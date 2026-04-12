const EMPTY_FORM = {
  title: '',
  description: '',
  status: 'pending',
  due_date: '',
}

export default function TaskForm({
  title,
  submitLabel,
  formData,
  setFormData,
  onSubmit,
  onCancel,
  isSubmitting,
}) {
  const handleChange = (event) => {
    const { name, value } = event.target
    setFormData((previous) => ({
      ...previous,
      [name]: value,
    }))
  }

  const handleReset = () => {
    setFormData(EMPTY_FORM)
    if (onCancel) {
      onCancel()
    }
  }

  return (
    <form className="task-form" onSubmit={onSubmit}>
      <div className="form-header">
        <h2>{title}</h2>
      </div>

      <div className="field-grid">
        <label className="field">
          <span>Title *</span>
          <input
            name="title"
            type="text"
            value={formData.title}
            onChange={handleChange}
            placeholder="Enter task title"
            maxLength={255}
            required
          />
        </label>

        <label className="field">
          <span>Status *</span>
          <select name="status" value={formData.status} onChange={handleChange} required>
            <option value="pending">Pending</option>
            <option value="in_progress">In Progress</option>
            <option value="completed">Completed</option>
          </select>
        </label>

        <label className="field field-full">
          <span>Description</span>
          <textarea
            name="description"
            rows="3"
            value={formData.description}
            onChange={handleChange}
            placeholder="Optional task description"
          />
        </label>

        <label className="field">
          <span>Due Date</span>
          <input name="due_date" type="date" value={formData.due_date || ''} onChange={handleChange} />
        </label>
      </div>

      <div className="form-actions">
        <button type="submit" className="btn btn-primary" disabled={isSubmitting}>
          {isSubmitting ? 'Saving...' : submitLabel}
        </button>
        <button type="button" className="btn btn-secondary" onClick={handleReset} disabled={isSubmitting}>
          {onCancel ? 'Cancel' : 'Reset'}
        </button>
      </div>
    </form>
  )
}
