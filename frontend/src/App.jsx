import { useCallback, useEffect, useMemo, useState } from 'react'
import TaskForm from './components/TaskForm'
import TaskList from './components/TaskList'
import {
  createTask,
  deleteTask,
  fetchTasks,
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

      const response = await fetchTasks(params)
      setTableTasks(response.data)
      setErrorMessage('')
    } catch (error) {
      setErrorMessage(getErrorMessage(error))
    } finally {
      setIsLoading(false)
    }
  }, [filters.search, filters.sort, filters.status])

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
    const isConfirmed = window.confirm('Are you sure you want to delete this task?')

    if (!isConfirmed) {
      return
    }

    setActiveActionId(taskId)

    try {
      await deleteTask(taskId)
      setSuccessMessage('Task deleted successfully.')
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

  return (
    <main className="dashboard">
      <header className="top-bar">
        <h1>TaskFlow</h1>
        <button type="button" className="new-task-btn" onClick={handleOpenCreateModal}>
          + New task
        </button>
      </header>

      {errorMessage ? <div className="alert alert-error">{errorMessage}</div> : null}
      {successMessage ? <div className="alert alert-success">{successMessage}</div> : null}

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
            <span className="pill">Weekly</span>
          </div>
          <svg className="trend-chart" viewBox="0 0 320 110" role="img" aria-label="Task delivery trend">
            <path d="M0 65 C20 50, 42 76, 62 60 C82 42, 104 75, 124 58 C145 42, 166 67, 186 52 C206 38, 228 64, 248 45 C268 30, 292 62, 320 49" />
            <path d="M0 86 C22 72, 44 92, 66 81 C87 71, 108 96, 130 84 C151 72, 173 94, 195 82 C216 71, 238 89, 260 77 C282 66, 301 84, 320 73" />
          </svg>
          <div className="trend-meta">
            <div>
              <span>Due Soon</span>
              <strong>{insights.dueSoon}</strong>
            </div>
            <div>
              <span>Overdue</span>
              <strong>{insights.overdue}</strong>
            </div>
          </div>
        </article>
      </section>

      <section className="workspace-grid">
        <section className="workspace-panel list-panel">
          <div className="section-head">
            <h2>Task Table</h2>
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
            onEdit={handleEditClick}
            onDelete={handleDelete}
            isLoading={isLoading}
            emptyMessage={hasFilter ? 'No tasks found for the selected filters.' : 'No tasks available. Create one to get started.'}
            activeActionId={activeActionId}
          />
        </section>
      </section>

      {isCreateModalOpen ? (
        <div className="modal-overlay" onClick={handleCloseCreateModal} role="presentation">
          <section className="modal-window" onClick={(event) => event.stopPropagation()}>
            <TaskForm
              title="Create Task"
              submitLabel="Create Task"
              formData={createFormData}
              setFormData={setCreateFormData}
              onSubmit={handleCreate}
              onCancel={handleCloseCreateModal}
              isSubmitting={isSubmitting}
            />
          </section>
        </div>
      ) : null}

      {editingTaskId ? (
        <div className="modal-overlay" onClick={handleCancelEdit} role="presentation">
          <section className="modal-window" onClick={(event) => event.stopPropagation()}>
            <TaskForm
              title="Edit Task"
              submitLabel="Update Task"
              formData={editFormData}
              setFormData={setEditFormData}
              onSubmit={handleUpdate}
              onCancel={handleCancelEdit}
              isSubmitting={isSubmitting}
            />
          </section>
        </div>
      ) : null}
    </main>
  )
}

export default App
