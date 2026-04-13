import { useCallback, useEffect, useMemo, useState } from 'react'
import TaskForm from './components/TaskForm'
import TaskList from './components/TaskList'
import {
  createTask,
  deleteTask,
  fetchArchivedTasks,
  fetchTasks,
  forceDeleteTask,
  restoreTask,
  updateTask,
} from './api/tasks'

const EMPTY_FORM = {
  title: '',
  description: '',
  status: 'pending',
  due_date: '',
}

const DEFAULT_FILTERS = {
  status: '',
  search: '',
  sort: '-created_at',
}

const TREND_CHART_WIDTH = 320
const TREND_CHART_HEIGHT = 110
const TREND_CHART_PADDING_X = 10
const TREND_CHART_PADDING_TOP = 10
const TREND_CHART_PADDING_BOTTOM = 12
const TREND_WINDOW_DAYS = 7

function getLocalDateKey(dateInput) {
  const date = new Date(dateInput)

  if (Number.isNaN(date.getTime())) {
    return null
  }

  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const day = String(date.getDate()).padStart(2, '0')
  return `${year}-${month}-${day}`
}

function buildLinePath(points) {
  if (!points.length) {
    return ''
  }

  return points
    .map((point, index) => `${index === 0 ? 'M' : 'L'}${point.x} ${point.y}`)
    .join(' ')
}

function buildPayload(formData) {
  return {
    title: formData.title.trim(),
    description: formData.description.trim() || null,
    status: formData.status,
    due_date: formData.due_date || null,
  }
}

function getErrorMessage(error) {
  const apiError = error?.response?.data

  if (apiError?.errors) {
    const firstError = Object.values(apiError.errors)[0]
    if (Array.isArray(firstError) && firstError.length > 0) {
      return firstError[0]
    }
  }

  return apiError?.message || 'Something went wrong. Please try again.'
}

function App() {
  const [allTasks, setAllTasks] = useState([])
  const [tableTasks, setTableTasks] = useState([])
  const [filters, setFilters] = useState(DEFAULT_FILTERS)
  const [createFormData, setCreateFormData] = useState(EMPTY_FORM)
  const [editFormData, setEditFormData] = useState(EMPTY_FORM)
  const [editingTaskId, setEditingTaskId] = useState(null)
  const [isLoading, setIsLoading] = useState(true)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [activeActionId, setActiveActionId] = useState(null)
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false)
  const [isArchiveView, setIsArchiveView] = useState(false)
  const [errorMessage, setErrorMessage] = useState('')
  const [successMessage, setSuccessMessage] = useState('')

  const hasFilter = useMemo(
    () => Boolean(filters.status || filters.search.trim()),
    [filters.status, filters.search],
  )

  const taskStats = useMemo(() => {
    const summary = {
      total: allTasks.length,
      pending: 0,
      inProgress: 0,
      completed: 0,
    }

    for (const task of allTasks) {
      if (task.status === 'pending') {
        summary.pending += 1
      } else if (task.status === 'in_progress') {
        summary.inProgress += 1
      } else if (task.status === 'completed') {
        summary.completed += 1
      }
    }

    return summary
  }, [allTasks])

  const insights = useMemo(() => {
    const today = new Date()
    today.setHours(0, 0, 0, 0)

    const sevenDaysFromNow = new Date(today)
    sevenDaysFromNow.setDate(today.getDate() + 7)

    let dueSoon = 0
    let overdue = 0

    for (const task of allTasks) {
      if (!task.due_date || task.status === 'completed') {
        continue
      }

      const dueDate = new Date(task.due_date)
      dueDate.setHours(0, 0, 0, 0)

      if (dueDate < today) {
        overdue += 1
      } else if (dueDate <= sevenDaysFromNow) {
        dueSoon += 1
      }
    }

    const total = Math.max(taskStats.total, 1)
    const completedRate = Math.round((taskStats.completed / total) * 100)
    const inProgressRate = Math.round((taskStats.inProgress / total) * 100)
    const pendingRate = Math.round((taskStats.pending / total) * 100)

    return {
      dueSoon,
      overdue,
      completedRate,
      inProgressRate,
      pendingRate,
    }
  }, [allTasks, taskStats])

  const deliveryTrend = useMemo(() => {
    const today = new Date()
    today.setHours(0, 0, 0, 0)

    const windowDays = []

    for (let index = TREND_WINDOW_DAYS - 1; index >= 0; index -= 1) {
      const day = new Date(today)
      day.setDate(today.getDate() - index)
      const key = getLocalDateKey(day)

      if (key) {
        windowDays.push({
          key,
          label: day.toLocaleDateString(undefined, { month: 'short', day: 'numeric' }),
        })
      }
    }

    const dayIndexByKey = new Map(windowDays.map((day, index) => [day.key, index]))
    const createdSeries = new Array(windowDays.length).fill(0)
    const completedSeries = new Array(windowDays.length).fill(0)

    for (const task of allTasks) {
      const createdKey = getLocalDateKey(task.created_at)
      const createdIndex = createdKey ? dayIndexByKey.get(createdKey) : undefined

      if (createdIndex !== undefined) {
        createdSeries[createdIndex] += 1
      }

      if (task.status === 'completed') {
        const completedKey = getLocalDateKey(task.updated_at)
        const completedIndex = completedKey ? dayIndexByKey.get(completedKey) : undefined

        if (completedIndex !== undefined) {
          completedSeries[completedIndex] += 1
        }
      }
    }

    const maxValue = Math.max(1, ...createdSeries, ...completedSeries)
    const usableWidth = TREND_CHART_WIDTH - TREND_CHART_PADDING_X * 2
    const usableHeight = TREND_CHART_HEIGHT - TREND_CHART_PADDING_TOP - TREND_CHART_PADDING_BOTTOM
    const step = windowDays.length > 1 ? usableWidth / (windowDays.length - 1) : 0

    const toY = (value) => TREND_CHART_PADDING_TOP + ((maxValue - value) / maxValue) * usableHeight
    const buildPoints = (series) =>
      series.map((value, index) => ({
        x: TREND_CHART_PADDING_X + step * index,
        y: toY(value),
      }))

    const createdPoints = buildPoints(createdSeries)
    const completedPoints = buildPoints(completedSeries)

    const createdThisWeek = createdSeries.reduce((sum, value) => sum + value, 0)
    const completedThisWeek = completedSeries.reduce((sum, value) => sum + value, 0)
    const firstHalfCompleted = completedSeries.slice(0, 3).reduce((sum, value) => sum + value, 0)
    const lastHalfCompleted = completedSeries.slice(-3).reduce((sum, value) => sum + value, 0)
    const paceDiff = lastHalfCompleted - firstHalfCompleted

    let paceLabel = 'Completion pace steady vs early week'
    if (paceDiff > 0) {
      paceLabel = `Completion pace up by ${paceDiff} vs early week`
    } else if (paceDiff < 0) {
      paceLabel = `Completion pace down by ${Math.abs(paceDiff)} vs early week`
    }

    return {
      createdPath: buildLinePath(createdPoints),
      completedPath: buildLinePath(completedPoints),
      createdThisWeek,
      completedThisWeek,
      startLabel: windowDays[0]?.label ?? '',
      endLabel: windowDays[windowDays.length - 1]?.label ?? '',
      paceLabel,
    }
  }, [allTasks])

  const loadOverviewTasks = useCallback(async () => {
    try {
      const response = await fetchTasks({ sort: '-created_at' })
      setAllTasks(response.data)
      setErrorMessage('')
    } catch (error) {
      setErrorMessage(getErrorMessage(error))
    }
  }, [])

  const loadTableTasks = useCallback(async () => {
    setIsLoading(true)

    try {
      const params = {
        sort: filters.sort,
      }

      if (filters.status) {
        params.status = filters.status
      }

      if (filters.search.trim()) {
        params.search = filters.search.trim()
      }

      const response = isArchiveView
        ? await fetchArchivedTasks(params)
        : await fetchTasks(params)
      setTableTasks(response.data)
      setErrorMessage('')
    } catch (error) {
      setErrorMessage(getErrorMessage(error))
    } finally {
      setIsLoading(false)
    }
  }, [filters.search, filters.sort, filters.status, isArchiveView])

  useEffect(() => {
    const timer = setTimeout(() => {
      loadTableTasks()
    }, 250)

    return () => clearTimeout(timer)
  }, [loadTableTasks])

  useEffect(() => {
    loadOverviewTasks()
  }, [loadOverviewTasks])

  useEffect(() => {
    if (isArchiveView && editingTaskId) {
      setEditingTaskId(null)
      setEditFormData(EMPTY_FORM)
    }
  }, [isArchiveView, editingTaskId])

  useEffect(() => {
    if (!successMessage) {
      return undefined
    }

    const timer = setTimeout(() => setSuccessMessage(''), 2500)
    return () => clearTimeout(timer)
  }, [successMessage])

  const handleCreate = async (event) => {
    event.preventDefault()
    setIsSubmitting(true)

    try {
      await createTask(buildPayload(createFormData))
      setCreateFormData(EMPTY_FORM)
      setIsCreateModalOpen(false)
      setSuccessMessage('Task created successfully.')
      setErrorMessage('')
      await Promise.all([loadOverviewTasks(), loadTableTasks()])
    } catch (error) {
      setErrorMessage(getErrorMessage(error))
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleEditClick = (task) => {
    setEditingTaskId(task.id)
    setEditFormData({
      title: task.title,
      description: task.description || '',
      status: task.status,
      due_date: task.due_date || '',
    })
  }

  const handleCancelEdit = () => {
    setEditingTaskId(null)
    setEditFormData(EMPTY_FORM)
  }

  const handleUpdate = async (event) => {
    event.preventDefault()

    if (!editingTaskId) {
      return
    }

    setIsSubmitting(true)

    try {
      await updateTask(editingTaskId, buildPayload(editFormData))
      setSuccessMessage('Task updated successfully.')
      setErrorMessage('')
      handleCancelEdit()
      await Promise.all([loadOverviewTasks(), loadTableTasks()])
    } catch (error) {
      setErrorMessage(getErrorMessage(error))
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleDelete = async (taskId) => {
    const isConfirmed = window.confirm('Are you sure you want to archive this task?')

    if (!isConfirmed) {
      return
    }

    setActiveActionId(taskId)

    try {
      await deleteTask(taskId)
      setSuccessMessage('Task archived successfully.')
      setErrorMessage('')

      if (editingTaskId === taskId) {
        handleCancelEdit()
      }

      await Promise.all([loadOverviewTasks(), loadTableTasks()])
    } catch (error) {
      setErrorMessage(getErrorMessage(error))
    } finally {
      setActiveActionId(null)
    }
  }

  const handleRestore = async (taskId) => {
    const isConfirmed = window.confirm('Are you sure you want to restore this task?')

    if (!isConfirmed) {
      return
    }

    setActiveActionId(taskId)

    try {
      await restoreTask(taskId)
      setSuccessMessage('Task restored successfully.')
      setErrorMessage('')
      await Promise.all([loadOverviewTasks(), loadTableTasks()])
    } catch (error) {
      setErrorMessage(getErrorMessage(error))
    } finally {
      setActiveActionId(null)
    }
  }

  const handlePermanentDelete = async (taskId) => {
    const isConfirmed = window.confirm(
      'Permanently delete this task? This action cannot be undone.',
    )

    if (!isConfirmed) {
      return
    }

    setActiveActionId(taskId)

    try {
      await forceDeleteTask(taskId)
      setSuccessMessage('Task permanently deleted.')
      setErrorMessage('')
      await Promise.all([loadOverviewTasks(), loadTableTasks()])
    } catch (error) {
      setErrorMessage(getErrorMessage(error))
    } finally {
      setActiveActionId(null)
    }
  }

  const handleFilterChange = (event) => {
    const { name, value } = event.target

    setFilters((previous) => ({
      ...previous,
      [name]: value,
    }))
  }

  const clearFilters = () => {
    setFilters(DEFAULT_FILTERS)
  }

  const handleOpenCreateModal = () => {
    setIsCreateModalOpen(true)
  }

  const handleCloseCreateModal = () => {
    setIsCreateModalOpen(false)
    setCreateFormData(EMPTY_FORM)
  }

  const handleToggleArchiveView = () => {
    setIsArchiveView((previous) => !previous)
    setErrorMessage('')
    setSuccessMessage('')
  }

  return (
    <main className="dashboard">
      {errorMessage || successMessage ? (
        <div className="toast-stack" aria-live="polite" aria-atomic="true">
          {errorMessage ? (
            <div className="alert alert-error" role="alert">
              {errorMessage}
            </div>
          ) : null}
          {successMessage ? (
            <div className="alert alert-success" role="status">
              {successMessage}
            </div>
          ) : null}
        </div>
      ) : null}

      <header className="top-bar">
        <h1>TaskFlow</h1>
        <div className="top-bar-actions">
          <button
            type="button"
            className={`archive-toggle-btn ${isArchiveView ? 'active' : ''}`}
            onClick={handleToggleArchiveView}
          >
            {isArchiveView ? 'Back to Tasks' : 'Archive'}
          </button>
          <button type="button" className="new-task-btn" onClick={handleOpenCreateModal}>
            + New task
          </button>
        </div>
      </header>

      {!isArchiveView ? (
        <>
          <section className="metric-grid">
            <article className="metric-card green">
              <div className="metric-head">
                <div className="metric-icon">○</div>
              </div>
              <p className="metric-label">Active Tasks</p>
              <h2>{taskStats.inProgress}</h2>
              <p className="metric-meta">In delivery right now</p>
            </article>

            <article className="metric-card blue">
              <div className="metric-head">
                <div className="metric-icon">◉</div>
              </div>
              <p className="metric-label">Total Tasks</p>
              <h2>{taskStats.total}</h2>
              <p className="metric-meta">All records in workspace</p>
            </article>

            <article className="metric-card pink">
              <div className="metric-head">
                <div className="metric-icon">◎</div>
              </div>
              <p className="metric-label">Completed Tasks</p>
              <h2>{taskStats.completed}</h2>
              <p className="metric-meta">{insights.completedRate}% completion rate</p>
            </article>
          </section>

          <section className="insight-grid">
            <article className="insight-card centered-card">
              <div className="insight-header">
                <h3>Task Progress</h3>
                <span className="pill">Live</span>
              </div>
              <div className="progress-main">{insights.completedRate}%</div>
              <p className="muted">Average task completion</p>
              <div className="stacked-bars">
                <div className="bar pending" style={{ width: `${insights.pendingRate}%` }} />
                <div className="bar progress" style={{ width: `${insights.inProgressRate}%` }} />
                <div className="bar complete" style={{ width: `${insights.completedRate}%` }} />
              </div>
              <div className="status-row">
                <span className="status-item pending">
                  <i className="dot" />
                  Pending {taskStats.pending}
                </span>
                <span className="status-item in-progress">
                  <i className="dot" />
                  In Progress {taskStats.inProgress}
                </span>
                <span className="status-item completed">
                  <i className="dot" />
                  Completed {taskStats.completed}
                </span>
              </div>
            </article>

            <article className="insight-card centered-card">
              <div className="insight-header">
                <h3>Task Status</h3>
                <span className="pill">Summary</span>
              </div>
              <div
                className="status-ring"
                style={{
                  background: `conic-gradient(
                    #16a34a 0deg ${insights.completedRate * 3.6}deg,
                    #3b82f6 ${insights.completedRate * 3.6}deg ${(insights.completedRate + insights.inProgressRate) * 3.6}deg,
                    #ec4899 ${(insights.completedRate + insights.inProgressRate) * 3.6}deg 360deg
                  )`,
                }}
              >
                <div className="status-ring-inner">
                  <strong>{taskStats.total}</strong>
                  <span>tasks</span>
                </div>
              </div>
              <div className="status-row">
                <span className="status-item pending">
                  <i className="dot" />
                  Pending {taskStats.pending}
                </span>
                <span className="status-item in-progress">
                  <i className="dot" />
                  In Progress {taskStats.inProgress}
                </span>
                <span className="status-item completed">
                  <i className="dot" />
                  Completed {taskStats.completed}
                </span>
              </div>
            </article>

            <article className="insight-card">
              <div className="insight-header">
                <h3>Delivery Trend</h3>
                <span className="pill">Last 7 Days</span>
              </div>
              <svg
                className="trend-chart"
                viewBox={`0 0 ${TREND_CHART_WIDTH} ${TREND_CHART_HEIGHT}`}
                role="img"
                aria-label="Task delivery trend for created and completed tasks over the last seven days"
              >
                <path d={deliveryTrend.createdPath} />
                <path d={deliveryTrend.completedPath} />
              </svg>
              <div className="trend-legend">
                <span className="legend-item">
                  <i className="legend-dot created" />
                  Created
                </span>
                <span className="legend-item">
                  <i className="legend-dot completed" />
                  Completed
                </span>
                <span className="trend-window">
                  {deliveryTrend.startLabel} to {deliveryTrend.endLabel}
                </span>
              </div>
              <div className="trend-meta">
                <div>
                  <span>Created</span>
                  <strong>{deliveryTrend.createdThisWeek}</strong>
                </div>
                <div>
                  <span>Completed</span>
                  <strong>{deliveryTrend.completedThisWeek}</strong>
                </div>
              </div>
              <p className="trend-footnote">{deliveryTrend.paceLabel}</p>
            </article>
          </section>
        </>
      ) : null}

      <section className="workspace-grid">
        <section className="workspace-panel list-panel">
          <div className="section-head">
            <h2>{isArchiveView ? 'Archived Tasks' : 'Task Table'}</h2>
          </div>

          <div className="table-filters">
            <label className="field filter-inline">
              <span>Status</span>
              <select name="status" value={filters.status} onChange={handleFilterChange}>
                <option value="">All</option>
                <option value="pending">Pending</option>
                <option value="in_progress">In Progress</option>
                <option value="completed">Completed</option>
              </select>
            </label>

            <label className="field filter-inline">
              <span>Search</span>
              <input
                name="search"
                type="text"
                placeholder="Search tasks by title"
                value={filters.search}
                onChange={handleFilterChange}
              />
            </label>

            <label className="field filter-inline">
              <span>Sort</span>
              <select name="sort" value={filters.sort} onChange={handleFilterChange}>
                <option value="-created_at">Newest First</option>
                <option value="created_at">Oldest First</option>
                <option value="title">Title (A-Z)</option>
                <option value="-title">Title (Z-A)</option>
                <option value="due_date">Due Date (Soonest)</option>
                <option value="-due_date">Due Date (Latest)</option>
                <option value="status">Status (A-Z)</option>
                <option value="-status">Status (Z-A)</option>
              </select>
            </label>

            <button type="button" className="btn btn-secondary filter-reset" onClick={clearFilters}>
              Reset
            </button>
          </div>

          <TaskList
            tasks={tableTasks}
            onEdit={isArchiveView ? undefined : handleEditClick}
            onDelete={isArchiveView ? undefined : handleDelete}
            onRestore={isArchiveView ? handleRestore : undefined}
            onPermanentDelete={isArchiveView ? handlePermanentDelete : undefined}
            isLoading={isLoading}
            emptyMessage={
              hasFilter
                ? 'No tasks found for the selected filters.'
                : isArchiveView
                  ? 'No archived tasks yet.'
                  : 'No tasks available. Create one to get started.'
            }
            activeActionId={activeActionId}
            showActions={!isArchiveView}
            showRestoreAction={isArchiveView}
            deleteLabel="Archive"
          />
        </section>
      </section>

      {isCreateModalOpen ? (
        <div className="modal-overlay" onClick={handleCloseCreateModal} role="presentation">
          <section className="modal-window" onClick={(event) => event.stopPropagation()}>
            <button
              type="button"
              className="modal-close"
              onClick={handleCloseCreateModal}
              aria-label="Close create task window"
            >
              ×
            </button>
            <TaskForm
              title="Create Task"
              submitLabel="Create Task"
              formData={createFormData}
              setFormData={setCreateFormData}
              onSubmit={handleCreate}
              isSubmitting={isSubmitting}
            />
          </section>
        </div>
      ) : null}

      {editingTaskId ? (
        <div className="modal-overlay" onClick={handleCancelEdit} role="presentation">
          <section className="modal-window" onClick={(event) => event.stopPropagation()}>
            <button
              type="button"
              className="modal-close"
              onClick={handleCancelEdit}
              aria-label="Close edit task window"
            >
              ×
            </button>
            <TaskForm
              title="Edit Task"
              submitLabel="Update Task"
              formData={editFormData}
              setFormData={setEditFormData}
              onSubmit={handleUpdate}
              isSubmitting={isSubmitting}
            />
          </section>
        </div>
      ) : null}
    </main>
  )
}

export default App
