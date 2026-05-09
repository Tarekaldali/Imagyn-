import React, { useState } from 'react'
import { formatDateTime } from '../lib/formatters'

export default function Profile({ user, images = [], jobs = [], onUpdateUser, onChangePassword, onUpdateBilling, onToast }) {
  const completedJobs = jobs.filter((job) => job.status === 'completed')
  const failedJobs = jobs.filter((job) => job.status === 'failed')
  const [editing, setEditing] = useState(false)
  const [name, setName] = useState(user?.name || '')
  const [oldPassword, setOldPassword] = useState('')
  const [newPassword, setNewPassword] = useState('')
  const [billingEmail, setBillingEmail] = useState(user?.billing?.email || '')

  async function handleSave() {
    try {
      await onUpdateUser?.({ name })
      onToast?.('Profile saved.', 'success', 'Profile')
      setEditing(false)
    } catch (error) {
      onToast?.(error.message || 'Unable to save profile.', 'warning', 'Profile')
    }
  }

  async function handleChangePassword() {
    if (!oldPassword || !newPassword) {
      onToast?.('Provide both old and new password.', 'warning', 'Profile')
      return
    }

    try {
      await onChangePassword?.({ oldPassword, newPassword })
      onToast?.('Password updated.', 'success', 'Profile')
      setOldPassword('')
      setNewPassword('')
    } catch (error) {
      onToast?.(error.message || 'Unable to change password.', 'warning', 'Profile')
    }
  }

  async function handleBillingSave() {
    try {
      await onUpdateBilling?.({ email: billingEmail })
      onToast?.('Billing updated.', 'success', 'Billing')
    } catch (error) {
      onToast?.(error.message || 'Unable to update billing.', 'warning', 'Billing')
    }
  }

  return (
    <section className="space-y-6">
      <div className="hero-panel">
        <p className="eyebrow">Account profile</p>
        <h1 className="hero-title !text-[clamp(2.3rem,3vw,4rem)]">Your identity, credits, and generation footprint.</h1>
        <p className="hero-copy">
          Keep this page as the single source for account details and usage overview.
        </p>
      </div>

      <div className="grid gap-4 lg:grid-cols-3">
        <article className="surface-card">
          <div className="flex justify-between items-start">
            <div>
              <p className="eyebrow">Name</p>
              {!editing ? (
                <>
                  <p className="mt-3 text-3xl font-semibold text-[var(--text-strong)]">{user?.name || 'User'}</p>
                  <p className="mt-2 text-sm text-[var(--text-soft)]">{user?.email || 'No email'}</p>
                </>
              ) : (
                <div className="space-y-2">
                  <label className="field">
                    <span className="field__label">Full name</span>
                    <input value={name} onChange={(e) => setName(e.target.value)} className="field__input" />
                  </label>
                </div>
              )}
            </div>

            <div>
              {!editing ? (
                <button type="button" className="ghost-button" onClick={() => setEditing(true)}>Edit</button>
              ) : (
                <div className="flex gap-2">
                  <button type="button" className="primary-button" onClick={handleSave}>Save</button>
                  <button type="button" className="ghost-button" onClick={() => setEditing(false)}>Cancel</button>
                </div>
              )}
            </div>
          </div>
        </article>
        <article className="surface-card">
          <p className="eyebrow">Credits</p>
          <p className="mt-3 text-3xl font-semibold text-[var(--text-strong)]">{user?.credits ?? 0}</p>
          <p className="mt-2 text-sm text-[var(--text-soft)]">Available for new generations</p>
        </article>
        <article className="surface-card">
          <p className="eyebrow">Role</p>
          <p className="mt-3 text-3xl font-semibold text-[var(--text-strong)]">{user?.role || 'user'}</p>
          <p className="mt-2 text-sm text-[var(--text-soft)]">Last login: {formatDateTime(user?.last_login || user?.updated_at)}</p>
        </article>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        <article className="surface-card">
          <p className="eyebrow">Change password</p>
          <div className="space-y-2 mt-3">
            <label className="field">
              <span className="field__label">Current password</span>
              <input type="password" value={oldPassword} onChange={(e) => setOldPassword(e.target.value)} className="field__input" />
            </label>
            <label className="field">
              <span className="field__label">New password</span>
              <input type="password" value={newPassword} onChange={(e) => setNewPassword(e.target.value)} className="field__input" />
            </label>
            <div className="flex gap-2">
              <button type="button" className="primary-button" onClick={handleChangePassword}>Change password</button>
            </div>
          </div>
        </article>

        <article className="surface-card">
          <p className="eyebrow">Billing</p>
          <div className="space-y-2 mt-3">
            <label className="field">
              <span className="field__label">Billing email</span>
              <input value={billingEmail} onChange={(e) => setBillingEmail(e.target.value)} className="field__input" />
            </label>
            <div className="flex gap-2">
              <button type="button" className="primary-button" onClick={handleBillingSave}>Save billing</button>
            </div>
          </div>
        </article>

        <article className="surface-card">
          <p className="eyebrow">Support</p>
          <p className="mt-3 text-sm text-[var(--text-soft)]">Need help with billing or account recovery? Contact support.</p>
        </article>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        <article className="stat-tile">
          <div className="stat-tile__value">{images.length}</div>
          <div className="stat-tile__label">saved images</div>
        </article>
        <article className="stat-tile">
          <div className="stat-tile__value">{completedJobs.length}</div>
          <div className="stat-tile__label">completed jobs</div>
        </article>
        <article className="stat-tile">
          <div className="stat-tile__value">{failedJobs.length}</div>
          <div className="stat-tile__label">failed jobs</div>
        </article>
      </div>
    </section>
  )
}
