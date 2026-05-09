import React, { useEffect } from 'react'

export default function ToastStack({ toasts, onDismiss }) {
  useEffect(() => {
    const timers = toasts.map((toast) => setTimeout(() => onDismiss(toast.id), toast.duration || 3200))
    return () => timers.forEach((timer) => clearTimeout(timer))
  }, [onDismiss, toasts])

  if (!toasts.length) {
    return null
  }

  return (
    <div className="toast-stack" aria-live="polite">
      {toasts.map((toast) => (
        <article key={toast.id} className={`toast-card toast-card--${toast.type || 'info'}`}>
          <p className="toast-card__title">{toast.title || 'Notice'}</p>
          <p className="toast-card__message">{toast.message}</p>
          <button type="button" onClick={() => onDismiss(toast.id)} className="toast-card__close" aria-label="Dismiss notification">
            x
          </button>
        </article>
      ))}
    </div>
  )
}
