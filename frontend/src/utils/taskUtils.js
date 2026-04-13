import {
  TREND_CHART_PADDING_BOTTOM,
  TREND_CHART_PADDING_TOP,
  TREND_CHART_PADDING_X,
  TREND_CHART_WIDTH,
  TREND_CHART_HEIGHT,
  TREND_WINDOW_DAYS,
} from '../constants/taskConstants'

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

export function buildDeliveryTrend(tasks) {
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

  for (const task of tasks) {
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
}
