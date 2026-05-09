import React from 'react'

export default function ConfirmDialog({ dialog, onCancel, onConfirm }) {
  if (!dialog?.open) {
    return null
  }

  return (
    <div className="modal-backdrop" role="presentation">
      <div className="confirm-modal" role="dialog" aria-modal="true" aria-labelledby="confirm-dialog-title">
        <p className="eyebrow">{dialog.eyebrow || 'Please confirm'}</p>
        <h2 id="confirm-dialog-title" className="confirm-modal__title">{dialog.title || 'Continue?'}</h2>
        <p className="confirm-modal__message">{dialog.message || 'This action cannot be undone.'}</p>
        <div className="confirm-modal__actions">
          <button type="button" onClick={onCancel} className="ghost-button">Cancel</button>
          <button type="button" onClick={onConfirm} className="primary-button">
            {dialog.confirmLabel || 'Confirm'}
          </button>
        </div>
      </div>
    </div>
  )
}
