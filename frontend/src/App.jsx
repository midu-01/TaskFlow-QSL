import { useCallback, useEffect, useMemo, useState } from 'react'
import TaskForm from './components/TaskForm'
import TaskList from './components/TaskList'
import {
  createTask,
  deleteTask,
  fetchTasks,
  updateTask,
  updateTaskStatus,
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
  const [tasks, setTasks] = useState([])
  const [filters, setFilters] = useState(DEFAULT_FILTERS)
  const [createFormData, setCreateFormData] = useState(EMPTY_FORM)
  const [editFormData, setEditFormData] = useState(EMPTY_FORM)
  const [editingTaskId, setEditingTaskId] = useState(null)
  const [isLoading, setIsLoading] = useState(true)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [activeActionId, setActiveActionId] = useState(null)
  const [errorMessage, setErrorMessage] = useState('')
  const [successMessage, setSuccessMessage] = useState('')

  const hasFilter = useMemo(
    () => Boolean(filters.status || filters.search.trim()),
    [filters.status, filters.search],
  )

  const loadTasks = useCallback(async () => {
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
      setTasks(response.data)
      setErrorMessage('')
    } catch (error) {
      setErrorMessage(getErrorMessage(error))
    } finally {
      setIsLoading(false)
    }
  }, [filters.search, filters.sort, filters.status])

  useEffect(() => {
    const timer = setTimeout(() => {
      loadTasks()
    }, 250)

    return () => clearTimeout(timer)
  }, [loadTasks])

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
      setSuccessMessage('Task created successfully.')
      setErrorMessage('')
      await loadTasks()
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
      await loadTasks()
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

      await loadTasks()
    } catch (error) {
      setErrorMessage(getErrorMessage(error))
    } finally {
      setActiveActionId(null)
    }
  }

  const handleStatusChange = async (taskId, status) => {
    setActiveActionId(taskId)

    try {
      await updateTaskStatus(taskId, status)
      setSuccessMessage('Task status updated successfully.')
      setErrorMessage('')
      await loadTasks()
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

  return (
    <main className="page">
      <header className="page-header">
        <h1>Task Management System</h1>
        <p>Simple and reliable task tracking with status, filters, and search.</p>
      </header>

      {errorMessage ? <div className="alert alert-error">{errorMessage}</div> : null}
      {successMessage ? <div className="alert alert-success">{successMessage}</div> : null}

      <section className="panel">
        <h2>Filters</h2>
        <div className="filters">
          <label className="field">
            <span>Status</span>
            <select name="status" value={filters.status} onChange={handleFilterChange}>
              <option value="">All</option>
              <option value="pending">Pending</option>
              <option value="in_progress">In Progress</option>
              <option value="completed">Completed</option>
            </select>
          </label>

          <label className="field">
            <span>Search Title</span>
            <input
              name="search"
              type="text"
              placeholder="Search tasks by title"
              value={filters.search}
              onChange={handleFilterChange}
            />
          </label>

          <label className="field">
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
      </section>

      <section className="form-layout">
        <TaskForm
          title="Create Task"
          submitLabel="Create Task"
          formData={createFormData}
          setFormData={setCreateFormData}
          onSubmit={handleCreate}
          isSubmitting={isSubmitting}
        />

        {editingTaskId ? (
          <TaskForm
            title="Edit Task"
            submitLabel="Update Task"
            formData={editFormData}
            setFormData={setEditFormData}
            onSubmit={handleUpdate}
            onCancel={handleCancelEdit}
            isSubmitting={isSubmitting}
          />
        ) : (
          <div className="panel edit-placeholder">
            <h2>Edit Task</h2>
            <p>Select a task from the list and click <strong>Edit</strong> to open the update form.</p>
          </div>
        )}
      </section>

      <section className="panel">
        <h2>Tasks</h2>
        <TaskList
          tasks={tasks}
          onEdit={handleEditClick}
          onDelete={handleDelete}
          onStatusChange={handleStatusChange}
          isLoading={isLoading}
          emptyMessage={hasFilter ? 'No tasks found for the selected filters.' : 'No tasks available. Create one to get started.'}
          activeActionId={activeActionId}
        />
      </section>
    </main>
  )
}

export default App
