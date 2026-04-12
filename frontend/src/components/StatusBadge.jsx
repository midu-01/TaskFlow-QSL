const STATUS_LABELS = {
  pending: 'Pending',
  in_progress: 'In Progress',
  completed: 'Completed',
}

export default function StatusBadge({ status }) {
  return <span className={`status-badge ${status}`}>{STATUS_LABELS[status] || status}</span>
}
