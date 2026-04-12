function formatDate(date) {
  if (!date) {
    return 'No due date'
  }

  const parts = date.split('-')

  if (parts.length !== 3) {
    return date
  }

  const [year, month, day] = parts
  return `${month}/${day}/${year}`
}

const STATUS_LABELS = {
  pending: 'Pending',
  in_progress: 'In Progress',
  completed: 'Completed',
}

export default function TaskList({
  tasks,
  onEdit,
  onDelete,
  isLoading,
  emptyMessage,
  activeActionId,
}) {
  if (isLoading) {
    return <div className="info-card">Loading tasks...</div>
  }

  if (!tasks.length) {
    return <div className="info-card">{emptyMessage}</div>
  }

  return (
    <div className="task-list-wrapper">
      <div className="task-cards-grid">
        {tasks.map((task) => {
          const isRowBusy = activeActionId === task.id

          return (
            <article key={task.id} className={`task-mini-card status-${task.status}`}>
              <div className="task-mini-head">
                <div className="task-mini-main">
                  <h3 className="task-mini-title">{task.title}</h3>
                </div>
                <div className="status-actions">
                  <span
                    className={`status-toggle active ${task.status === 'in_progress' ? 'in-progress' : task.status}`}
                  >
                    {STATUS_LABELS[task.status] || task.status}
                  </span>
                </div>
              </div>

              <p className="task-mini-desc">{task.description || 'No description provided.'}</p>

              <div className="task-mini-footer">
                <div className="task-mini-meta">
                  <span className="meta-chip">Due: {formatDate(task.due_date)}</span>
                  <span className="meta-chip subtle">ID #{task.id}</span>
                </div>

                <div className="row-actions">
                  <button
                    className="icon-action icon-edit"
                    onClick={() => onEdit(task)}
                    disabled={isRowBusy}
                    aria-label="Edit task"
                    title="Edit"
                  >
                    <svg viewBox="0 0 24 24" role="img" aria-hidden="true">
                      <path d="M4 20h4.5L19 9.5 14.5 5 4 15.5V20Zm3.6-2H6v-1.6L14.5 7.9l1.6 1.6L7.6 18ZM17.7 7.9l-1.6-1.6 1-1a1.2 1.2 0 0 1 1.7 0l.9.9a1.2 1.2 0 0 1 0 1.7l-1 1Z" />
                    </svg>
                  </button>
                  <button
                    className="icon-action icon-delete"
                    onClick={() => onDelete(task.id)}
                    disabled={isRowBusy}
                    aria-label="Delete task"
                    title="Delete"
                  >
                    <svg viewBox="0 0 24 24" role="img" aria-hidden="true">
                      <path d="M9 3h6l1 2h4v2H4V5h4l1-2Zm1 6h2v9h-2V9Zm4 0h2v9h-2V9ZM7 9h2v9H7V9Zm-1 12h12a2 2 0 0 0 2-2V8H4v11a2 2 0 0 0 2 2Z" />
                    </svg>
                  </button>
                </div>
              </div>
            </article>
          )
        })}
      </div>
    </div>
  )
}
