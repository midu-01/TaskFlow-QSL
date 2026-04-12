import { useCallback, useEffect, useMemo, useState } from 'react'
import { createTask, deleteTask, fetchTasks, updateTask } from '../api/tasks'
import { DEFAULT_TASK_FILTERS, EMPTY_TASK_FORM } from '../constants/taskConstants'
import {
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
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false)
  const [isLoading, setIsLoading] = useState(true)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [activeActionId, setActiveActionId] = useState(null)
  const [errorMessage, setErrorMessage] = useState('')
  const [successMessage, setSuccessMessage] = useState('')

  const hasFilter = useMemo(
    () => Boolean(filters.status || filters.search.trim()),
    [filters.status, filters.search],
  )

  const taskStats = useMemo(() => summarizeTasks(allTasks), [allTasks])
  const insights = useMemo(() => computeTaskInsights(allTasks, taskStats), [allTasks, taskStats])

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
      const response = await fetchTasks(buildTaskQueryParams(filters))
      setTableTasks(response.data)
      setErrorMessage('')
    } catch (error) {
      setErrorMessage(extractApiErrorMessage(error))
    } finally {
      setIsLoading(false)
    }
  }, [filters])

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

  const refreshAllData = useCallback(async () => {
    await Promise.all([loadOverviewTasks(), loadTableTasks()])
  }, [loadOverviewTasks, loadTableTasks])

  const submitCreateTask = async (event) => {
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

  const openEditModal = (task) => {
    setEditingTaskId(task.id)
    setEditFormData({
      title: task.title,
      description: task.description || '',
      status: task.status,
      due_date: task.due_date || '',
    })
  }

  const closeEditModal = () => {
    setEditingTaskId(null)
    setEditFormData(EMPTY_TASK_FORM)
  }

  const submitEditTask = async (event) => {
    event.preventDefault()

    if (!editingTaskId) {
      return
    }

    setIsSubmitting(true)

    try {
      await updateTask(editingTaskId, buildTaskPayload(editFormData))
      setSuccessMessage('Task updated successfully.')
      setErrorMessage('')
      closeEditModal()
      await refreshAllData()
    } catch (error) {
      setErrorMessage(extractApiErrorMessage(error))
    } finally {
      setIsSubmitting(false)
    }
  }

  const removeTask = async (taskId) => {
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
        closeEditModal()
      }

      await refreshAllData()
    } catch (error) {
      setErrorMessage(extractApiErrorMessage(error))
    } finally {
      setActiveActionId(null)
    }
  }

  const updateFilters = (event) => {
    const { name, value } = event.target

    setFilters((previous) => ({
      ...previous,
      [name]: value,
    }))
  }

  const resetFilters = () => {
    setFilters(DEFAULT_TASK_FILTERS)
  }

  const openCreateModal = () => {
    setIsCreateModalOpen(true)
  }

  const closeCreateModal = () => {
    setIsCreateModalOpen(false)
    setCreateFormData(EMPTY_TASK_FORM)
  }

  return {
    allTasks,
    tableTasks,
    filters,
    createFormData,
    editFormData,
    editingTaskId,
    isCreateModalOpen,
    isLoading,
    isSubmitting,
    activeActionId,
    errorMessage,
    successMessage,
    hasFilter,
    taskStats,
    insights,
    setCreateFormData,
    setEditFormData,
    submitCreateTask,
    openEditModal,
    closeEditModal,
    submitEditTask,
    removeTask,
    updateFilters,
    resetFilters,
    openCreateModal,
    closeCreateModal,
  }
}
