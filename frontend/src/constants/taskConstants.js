export const EMPTY_TASK_FORM = {
  title: '',
  description: '',
  status: 'pending',
  due_date: '',
}

export const DEFAULT_TASK_FILTERS = {
  status: '',
  search: '',
  sort: '-created_at',
}

export const TASK_STATUS_OPTIONS = [
  { value: '', label: 'All' },
  { value: 'pending', label: 'Pending' },
  { value: 'in_progress', label: 'In Progress' },
  { value: 'completed', label: 'Completed' },
]

export const TASK_SORT_OPTIONS = [
  { value: '-created_at', label: 'Newest First' },
  { value: 'created_at', label: 'Oldest First' },
  { value: 'title', label: 'Title (A-Z)' },
  { value: '-title', label: 'Title (Z-A)' },
  { value: 'due_date', label: 'Due Date (Soonest)' },
  { value: '-due_date', label: 'Due Date (Latest)' },
  { value: 'status', label: 'Status (A-Z)' },
  { value: '-status', label: 'Status (Z-A)' },
]

export const TREND_CHART_WIDTH = 320
export const TREND_CHART_HEIGHT = 110
export const TREND_CHART_PADDING_X = 10
export const TREND_CHART_PADDING_TOP = 10
export const TREND_CHART_PADDING_BOTTOM = 12
export const TREND_WINDOW_DAYS = 7
