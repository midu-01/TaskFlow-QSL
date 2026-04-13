export default function DashboardHeader({ isArchiveView, onToggleArchiveView, onOpenCreateModal }) {
  return (
    <header className="top-bar">
      <h1>TaskFlow</h1>
      <div className="top-bar-actions">
        <button
          type="button"
          className={`archive-toggle-btn ${isArchiveView ? 'active' : ''}`}
          onClick={onToggleArchiveView}
        >
          {isArchiveView ? 'Back to Tasks' : 'Archive'}
        </button>
        <button type="button" className="new-task-btn" onClick={onOpenCreateModal}>
          + New task
        </button>
      </div>
    </header>
  )
}
