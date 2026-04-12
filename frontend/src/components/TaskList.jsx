import StatusBadge from './StatusBadge'

function formatDate(date) {
  if (!date) {
    return '-'
  }

  const parts = date.split('-')

  if (parts.length !== 3) {
    return date
  }

  const [year, month, day] = parts
  return `${month}/${day}/${year}`
}

export default function TaskList({
  tasks,
  onEdit,
  onDelete,
  onStatusChange,
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
      <table className="task-table">
        <thead>
          <tr>
            <th>Title</th>
            <th>Description</th>
            <th>Status</th>
            <th>Due Date</th>
            <th>Actions</th>
          </tr>
        </thead>
        <tbody>
          {tasks.map((task) => {
            const isRowBusy = activeActionId === task.id

            return (
              <tr key={task.id}>
                <td className="title-cell">{task.title}</td>
                <td>{task.description || '-'}</td>
                <td>
                  <div className="status-cell">
                    <StatusBadge status={task.status} />
                    <select
                      value={task.status}
                      onChange={(event) => onStatusChange(task.id, event.target.value)}
                      disabled={isRowBusy}
                    >
                      <option value="pending">Pending</option>
                      <option value="in_progress">In Progress</option>
                      <option value="completed">Completed</option>
                    </select>
                  </div>
                </td>
                <td>{formatDate(task.due_date)}</td>
                <td>
                  <div className="row-actions">
                    <button className="btn btn-secondary" onClick={() => onEdit(task)} disabled={isRowBusy}>
                      Edit
                    </button>
                    <button className="btn btn-danger" onClick={() => onDelete(task.id)} disabled={isRowBusy}>
                      Delete
                    </button>
                  </div>
                </td>
              </tr>
            )
          })}
        </tbody>
      </table>
    </div>
  )
}
