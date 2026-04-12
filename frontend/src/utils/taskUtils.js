export function buildTaskPayload(formData) {
  return {
    title: formData.title.trim(),
    description: formData.description.trim() || null,
    status: formData.status,
    due_date: formData.due_date || null,
  }
}

export function extractApiErrorMessage(error) {
  const apiError = error?.response?.data

  if (apiError?.errors) {
    const firstError = Object.values(apiError.errors)[0]
    if (Array.isArray(firstError) && firstError.length > 0) {
      return firstError[0]
    }
  }

  return apiError?.message || 'Something went wrong. Please try again.'
}

export function summarizeTasks(tasks) {
  const summary = {
    total: tasks.length,
    pending: 0,
    inProgress: 0,
    completed: 0,
  }

  for (const task of tasks) {
    if (task.status === 'pending') {
      summary.pending += 1
    } else if (task.status === 'in_progress') {
      summary.inProgress += 1
    } else if (task.status === 'completed') {
      summary.completed += 1
    }
  }

  return summary
}

export function computeTaskInsights(tasks, taskStats) {
  const today = new Date()
  today.setHours(0, 0, 0, 0)

  const sevenDaysFromNow = new Date(today)
  sevenDaysFromNow.setDate(today.getDate() + 7)

  let dueSoon = 0
  let overdue = 0

  for (const task of tasks) {
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

  return {
    dueSoon,
    overdue,
    completedRate: Math.round((taskStats.completed / total) * 100),
    inProgressRate: Math.round((taskStats.inProgress / total) * 100),
    pendingRate: Math.round((taskStats.pending / total) * 100),
  }
}

export function buildTaskQueryParams(filters) {
  const params = {
    sort: filters.sort,
  }

  if (filters.status) {
    params.status = filters.status
  }

  if (filters.search.trim()) {
    params.search = filters.search.trim()
  }

  return params
}
