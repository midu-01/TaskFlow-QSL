import Calendar from 'react-calendar'
import 'react-calendar/dist/Calendar.css'

function formatDateToYmd(date) {
  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const day = String(date.getDate()).padStart(2, '0')

  return `${year}-${month}-${day}`
}

function parseYmd(value) {
  if (!value) {
    return null
  }

  const [year, month, day] = value.split('-').map(Number)

  if (!year || !month || !day) {
    return null
  }

  return new Date(year, month - 1, day)
}

export default function TaskForm({
  title,
  submitLabel,
  formData,
  setFormData,
  onSubmit,
  isSubmitting,
}) {
  const handleChange = (event) => {
    const { name, value } = event.target
    setFormData((previous) => ({
      ...previous,
      [name]: value,
    }))
  }

  const handleDateChange = (value) => {
    if (!(value instanceof Date) || Number.isNaN(value.getTime())) {
      return
    }

    setFormData((previous) => ({
      ...previous,
      due_date: formatDateToYmd(value),
    }))
  }

  const clearDueDate = () => {
    setFormData((previous) => ({
      ...previous,
      due_date: '',
    }))
  }

  const selectedDate = parseYmd(formData.due_date)

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

        <label className="field field-full">
          <span>Due Date</span>
          <div className="due-date-panel">
            <div className="due-date-meta">
              <input
                type="text"
                className="due-date-display"
                value={formData.due_date || 'No due date selected'}
                readOnly
              />
              {formData.due_date ? (
                <button type="button" className="clear-date-btn" onClick={clearDueDate}>
                  Clear
                </button>
              ) : null}
            </div>
            <Calendar
              className="task-calendar"
              value={selectedDate || new Date()}
              onChange={handleDateChange}
              calendarType="gregory"
            />
          </div>
        </label>
      </div>

      <div className="form-actions">
        <button type="submit" className="btn btn-primary" disabled={isSubmitting}>
          {isSubmitting ? 'Saving...' : submitLabel}
        </button>
      </div>
    </form>
  )
}
