import { useCallback, useEffect, useMemo, useState } from 'react'
import {
  createTask,
  deleteTask,
  fetchArchivedTasks,
  fetchTasks,
  forceDeleteTask,
  restoreTask,
  updateTask,
} from '../api/tasks'
import { DEFAULT_TASK_FILTERS, EMPTY_TASK_FORM } from '../constants/taskConstants'
import {
  buildDeliveryTrend,
  buildTaskPayload,
  buildTaskQueryParams,
  computeTaskInsights,
  extractApiErrorMessage,
  summarizeTasks,
} from '../utils/taskUtils'

export function useTaskDashboard() {
  const [allTasks, setAllTasks] = useState([])
  const [tableTasks, setTableTasks] = useState([])
  const [filters, setFilters] = useState(DEFAULT_TASK_FILTERS)
  const [createFormData, setCreateFormData] = useState(EMPTY_TASK_FORM)
  const [editFormData, setEditFormData] = useState(EMPTY_TASK_FORM)
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

  const taskStats = useMemo(() => summarizeTasks(allTasks), [allTasks])
  const insights = useMemo(() => computeTaskInsights(allTasks, taskStats), [allTasks, taskStats])
  const deliveryTrend = useMemo(() => buildDeliveryTrend(allTasks), [allTasks])

  const loadOverviewTasks = useCallback(async () => {
    try {
      const response = await fetchTasks({ sort: '-created_at' })
      setAllTasks(response.data)
      setErrorMessage('')
    } catch (error) {
      setErrorMessage(extractApiErrorMessage(error))
    }
  }, [])

  const loadTableTasks = useCallback(async () => {
    setIsLoading(true)

    try {
      const params = buildTaskQueryParams(filters)
      const response = isArchiveView ? await fetchArchivedTasks(params) : await fetchTasks(params)
      setTableTasks(response.data)
      setErrorMessage('')
    } catch (error) {
      setErrorMessage(extractApiErrorMessage(error))
    } finally {
      setIsLoading(false)
    }
  }, [filters, isArchiveView])

  const refreshAllData = useCallback(async () => {
    await Promise.all([loadOverviewTasks(), loadTableTasks()])
  }, [loadOverviewTasks, loadTableTasks])

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
      setEditFormData(EMPTY_TASK_FORM)
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
      await createTask(buildTaskPayload(createFormData))
      setCreateFormData(EMPTY_TASK_FORM)
      setIsCreateModalOpen(false)
      setSuccessMessage('Task created successfully.')
      setErrorMessage('')
      await refreshAllData()
    } catch (error) {
      setErrorMessage(extractApiErrorMessage(error))
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
    setEditFormData(EMPTY_TASK_FORM)
  }

  const handleUpdate = async (event) => {
    event.preventDefault()

    if (!editingTaskId) {
      return
    }

    setIsSubmitting(true)

    try {
      await updateTask(editingTaskId, buildTaskPayload(editFormData))
      setSuccessMessage('Task updated successfully.')
      setErrorMessage('')
      handleCancelEdit()
      await refreshAllData()
    } catch (error) {
      setErrorMessage(extractApiErrorMessage(error))
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

      await refreshAllData()
    } catch (error) {
      setErrorMessage(extractApiErrorMessage(error))
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
      await refreshAllData()
    } catch (error) {
      setErrorMessage(extractApiErrorMessage(error))
    } finally {
      setActiveActionId(null)
    }
  }

  const handlePermanentDelete = async (taskId) => {
    const isConfirmed = window.confirm('Permanently delete this task? This action cannot be undone.')

    if (!isConfirmed) {
      return
    }

    setActiveActionId(taskId)

    try {
      await forceDeleteTask(taskId)
      setSuccessMessage('Task permanently deleted.')
      setErrorMessage('')
      await refreshAllData()
    } catch (error) {
      setErrorMessage(extractApiErrorMessage(error))
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
    setFilters(DEFAULT_TASK_FILTERS)
  }

  const handleOpenCreateModal = () => {
    setIsCreateModalOpen(true)
  }

  const handleCloseCreateModal = () => {
    setIsCreateModalOpen(false)
    setCreateFormData(EMPTY_TASK_FORM)
  }

  const handleToggleArchiveView = () => {
    setIsArchiveView((previous) => !previous)
    setErrorMessage('')
    setSuccessMessage('')
  }

  return {
    tableTasks,
    filters,
    createFormData,
    editFormData,
    editingTaskId,
    isLoading,
    isSubmitting,
    activeActionId,
    isCreateModalOpen,
    isArchiveView,
    errorMessage,
    successMessage,
    hasFilter,
    taskStats,
    insights,
    deliveryTrend,
    setCreateFormData,
    setEditFormData,
    handleCreate,
    handleEditClick,
    handleCancelEdit,
    handleUpdate,
    handleDelete,
    handleRestore,
    handlePermanentDelete,
    handleFilterChange,
    clearFilters,
    handleOpenCreateModal,
    handleCloseCreateModal,
    handleToggleArchiveView,
  }
}
