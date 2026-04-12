import { api } from './client'

export async function fetchTasks(params) {
  const response = await api.get('/tasks', { params })
  return response.data
}

export async function fetchArchivedTasks(params) {
  const response = await api.get('/tasks/archived', { params })
  return response.data
}

export async function createTask(payload) {
  const response = await api.post('/tasks', payload)
  return response.data
}

export async function updateTask(taskId, payload) {
  const response = await api.put(`/tasks/${taskId}`, payload)
  return response.data
}

export async function updateTaskStatus(taskId, status) {
  const response = await api.patch(`/tasks/${taskId}/status`, { status })
  return response.data
}

export async function deleteTask(taskId) {
  const response = await api.delete(`/tasks/${taskId}`)
  return response.data
}

export async function restoreTask(taskId) {
  const response = await api.patch(`/tasks/${taskId}/restore`)
  return response.data
}

export async function forceDeleteTask(taskId) {
  const response = await api.delete(`/tasks/${taskId}/force`)
  return response.data
}
