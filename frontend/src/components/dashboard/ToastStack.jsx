export default function ToastStack({ errorMessage, successMessage }) {
  if (!errorMessage && !successMessage) {
    return null
  }

  return (
    <div className="toast-stack" aria-live="polite" aria-atomic="true">
      {errorMessage ? (
        <div className="alert alert-error" role="alert">
          {errorMessage}
        </div>
      ) : null}
      {successMessage ? (
        <div className="alert alert-success" role="status">
          {successMessage}
        </div>
      ) : null}
    </div>
  )
}
