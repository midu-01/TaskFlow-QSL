import TaskForm from '../TaskForm'

export default function TaskModals({
  isCreateModalOpen,
  onCloseCreateModal,
  createFormData,
  setCreateFormData,
  onCreate,
  editingTaskId,
  onCancelEdit,
  editFormData,
  setEditFormData,
  onUpdate,
  isSubmitting,
}) {
  return (
    <>
      {isCreateModalOpen ? (
        <div className="modal-overlay" onClick={onCloseCreateModal} role="presentation">
          <section className="modal-window" onClick={(event) => event.stopPropagation()}>
            <button
              type="button"
              className="modal-close"
              onClick={onCloseCreateModal}
              aria-label="Close create task window"
            >
              ×
            </button>
            <TaskForm
              title="Create Task"
              submitLabel="Create Task"
              formData={createFormData}
              setFormData={setCreateFormData}
              onSubmit={onCreate}
              isSubmitting={isSubmitting}
            />
          </section>
        </div>
      ) : null}

      {editingTaskId ? (
        <div className="modal-overlay" onClick={onCancelEdit} role="presentation">
          <section className="modal-window" onClick={(event) => event.stopPropagation()}>
            <button
              type="button"
              className="modal-close"
              onClick={onCancelEdit}
              aria-label="Close edit task window"
            >
              ×
            </button>
            <TaskForm
              title="Edit Task"
              submitLabel="Update Task"
              formData={editFormData}
              setFormData={setEditFormData}
              onSubmit={onUpdate}
              isSubmitting={isSubmitting}
            />
          </section>
        </div>
      ) : null}
    </>
  )
}
