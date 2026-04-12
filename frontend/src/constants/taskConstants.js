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
