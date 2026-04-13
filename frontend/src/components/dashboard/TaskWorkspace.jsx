import TaskList from '../TaskList'
import { TASK_SORT_OPTIONS, TASK_STATUS_OPTIONS } from '../../constants/taskConstants'

export default function TaskWorkspace({
  isArchiveView,
  filters,
  onFilterChange,
  onResetFilters,
  tasks,
  isLoading,
  hasFilter,
  activeActionId,
  onEdit,
  onDelete,
  onRestore,
  onPermanentDelete,
}) {
  return (
    <section className="workspace-grid">
      <section className="workspace-panel list-panel">
        <div className="section-head">
          <h2>{isArchiveView ? 'Archived Tasks' : 'Task Table'}</h2>
        </div>

        <div className="table-filters">
          <label className="field filter-inline">
            <span>Status</span>
            <select name="status" value={filters.status} onChange={onFilterChange}>
              {TASK_STATUS_OPTIONS.map((option) => (
                <option key={option.value || 'all'} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </label>

          <label className="field filter-inline">
            <span>Search</span>
            <input
              name="search"
              type="text"
              placeholder="Search tasks by title"
              value={filters.search}
              onChange={onFilterChange}
            />
          </label>

          <label className="field filter-inline">
            <span>Sort</span>
            <select name="sort" value={filters.sort} onChange={onFilterChange}>
              {TASK_SORT_OPTIONS.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </label>

          <button type="button" className="btn btn-secondary filter-reset" onClick={onResetFilters}>
            Reset
          </button>
        </div>

        <TaskList
          tasks={tasks}
          onEdit={isArchiveView ? undefined : onEdit}
          onDelete={isArchiveView ? undefined : onDelete}
          onRestore={isArchiveView ? onRestore : undefined}
          onPermanentDelete={isArchiveView ? onPermanentDelete : undefined}
          isLoading={isLoading}
          emptyMessage={
            hasFilter
              ? 'No tasks found for the selected filters.'
              : isArchiveView
                ? 'No archived tasks yet.'
                : 'No tasks available. Create one to get started.'
          }
          activeActionId={activeActionId}
          showActions={!isArchiveView}
          showRestoreAction={isArchiveView}
          deleteLabel="Archive"
        />
      </section>
    </section>
  )
}
