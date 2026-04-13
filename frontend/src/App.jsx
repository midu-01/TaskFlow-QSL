import DashboardHeader from './components/dashboard/DashboardHeader'
import DashboardOverview from './components/dashboard/DashboardOverview'
import TaskModals from './components/dashboard/TaskModals'
import TaskWorkspace from './components/dashboard/TaskWorkspace'
import ToastStack from './components/dashboard/ToastStack'
import { useTaskDashboard } from './hooks/useTaskDashboard'

function App() {
  const {
    tableTasks,
    filters,
    createFormData,
    editFormData,
    editingTaskId,
    isLoading,
    isSubmitting,
    activeActionId,
    isCreateModalOpen,
    isArchiveView,
    errorMessage,
    successMessage,
    hasFilter,
    taskStats,
    insights,
    deliveryTrend,
    setCreateFormData,
    setEditFormData,
    handleCreate,
    handleEditClick,
    handleCancelEdit,
    handleUpdate,
    handleDelete,
    handleRestore,
    handlePermanentDelete,
    handleFilterChange,
    clearFilters,
    handleOpenCreateModal,
    handleCloseCreateModal,
    handleToggleArchiveView,
  } = useTaskDashboard()

  return (
    <main className="dashboard">
      <ToastStack errorMessage={errorMessage} successMessage={successMessage} />

      <DashboardHeader
        isArchiveView={isArchiveView}
        onToggleArchiveView={handleToggleArchiveView}
        onOpenCreateModal={handleOpenCreateModal}
      />

      {!isArchiveView ? (
        <DashboardOverview taskStats={taskStats} insights={insights} deliveryTrend={deliveryTrend} />
      ) : null}

      <TaskWorkspace
        isArchiveView={isArchiveView}
        filters={filters}
        onFilterChange={handleFilterChange}
        onResetFilters={clearFilters}
        tasks={tableTasks}
        isLoading={isLoading}
        hasFilter={hasFilter}
        activeActionId={activeActionId}
        onEdit={handleEditClick}
        onDelete={handleDelete}
        onRestore={handleRestore}
        onPermanentDelete={handlePermanentDelete}
      />

      <TaskModals
        isCreateModalOpen={isCreateModalOpen}
        onCloseCreateModal={handleCloseCreateModal}
        createFormData={createFormData}
        setCreateFormData={setCreateFormData}
        onCreate={handleCreate}
        editingTaskId={editingTaskId}
        onCancelEdit={handleCancelEdit}
        editFormData={editFormData}
        setEditFormData={setEditFormData}
        onUpdate={handleUpdate}
        isSubmitting={isSubmitting}
      />
    </main>
  )
}

export default App
