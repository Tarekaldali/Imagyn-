import React, { useMemo, useState } from 'react'
import { formatCurrency, formatDateTime, formatDuration } from '../lib/formatters'

export default function AdminDashboard({
  adminOverview,
  jobs = [],
  onDeletePlan,
  onRefresh,
  onToast,
  onUpdatePlan,
  plans = [],
  onCreatePlan,
  requestConfirm,
}) {
  const [creating, setCreating] = useState(false)
  const [newPlan, setNewPlan] = useState({ id: '', name: '', price: 0, credits: 0, badge: '', description: '', features: [] })

  const stats = adminOverview?.stats || {}
  const users = adminOverview?.users || []
  const recentJobs = useMemo(() => jobs.slice(0, 6), [jobs])

  async function handleDeletePlan(planId, planName) {
    const approved = await requestConfirm({
      eyebrow: 'Plan removal',
      title: `Delete ${planName}?`,
      message: 'This removes the plan from the shared pricing layout in the app. You can recreate it later if needed.',
      confirmLabel: 'Delete plan',
    })

    if (approved) {
      onDeletePlan(planId)
      onToast?.(`${planName} removed from the pricing page.`, 'success', 'Plan updated')
    }
  }

  async function handleCreate() {
    const id = newPlan.id || `plan_${Date.now()}`
    const planToCreate = { ...newPlan, id }
    onCreatePlan?.(planToCreate)
    onToast?.(`${newPlan.name} created.`, 'success', 'Plan created')
    setNewPlan({ id: '', name: '', price: 0, credits: 0, badge: '', description: '', features: [] })
    setCreating(false)
  }

  return (
    <section className="admin-shell">
      <div className="admin-toolbar">
        <div>
          <p className="eyebrow">Owner command center</p>
          <h1 className="admin-title">Manage plans, users, and system health from one dashboard.</h1>
        </div>
        <div className="flex gap-2">
          <button type="button" onClick={() => setCreating(true)} className="primary-button">Add plan</button>
          <button type="button" onClick={onRefresh} className="secondary-button">Refresh overview</button>
        </div>
      </div>

      <section className="admin-section" id="overview">
        <div className="admin-section__header">
          <div>
            <p className="eyebrow">Overview</p>
            <h2 className="admin-section__title">System summary</h2>
          </div>
        </div>

        <div className="admin-metrics">
          <article className="admin-metric">
            <p className="admin-metric__label">Total users</p>
            <p className="admin-metric__value">{stats.total_users || 0}</p>
            <p className="admin-metric__hint">{stats.admin_users || 0} admin accounts</p>
          </article>
          
          <article className="admin-metric">
            <p className="admin-metric__label">Credit balance</p>
            <p className="admin-metric__value">{stats.credit_balance_total || 0}</p>
            <p className="admin-metric__hint">Total user credits across the site</p>
          </article>
          <article className="admin-metric admin-metric--accent">
            <p className="admin-metric__label">Recent images</p>
            <p className="admin-metric__value">{stats.recent_images || 0}</p>
            <p className="admin-metric__hint">{stats.failed_jobs || 0} failed jobs need review</p>
          </article>
        </div>
      </section>

      {/* Users section */}
      <section className="admin-section" id="users">
        <div className="admin-section__header">
          <div>
            <p className="eyebrow">Recent users</p>
            <h2 className="admin-section__title">Account activity snapshot</h2>
          </div>
        </div>

        <div className="admin-panel">
          <div className="admin-table">
            {users.slice(0, 10).map((user) => (
              <article key={user.id} className="admin-table__row">
                <div>
                  <p className="admin-table__name">{user.name}</p>
                  <p className="admin-table__meta">{user.email}</p>
                </div>
                <div className="admin-table__stat">
                  <span>{user.role}</span>
                  <strong>{user.credits} credits</strong>
                </div>
              </article>
            ))}
            {users.length === 0 && <div className="text-sm text-[var(--text-soft)]">No users found</div>}
          </div>
        </div>
      </section>

      {/* Analysis section */}
      

      {/* Plans section */}
      <section className="admin-section" id="plans">
        <div className="admin-section__header">
          <div>
            <p className="eyebrow">Website plans</p>
            <h2 className="admin-section__title">Pricing and credit tiers</h2>
          </div>
          <div>
            <button type="button" className="primary-button" onClick={() => setCreating(true)}>Add plan</button>
          </div>
        </div>

        <div className="admin-panel">
          <div className="admin-plan-list">
            {creating && (
              <article className="admin-plan-card admin-plan-card--new">
                <div className="admin-plan-card__head">
                  <input
                    placeholder="Plan name"
                    value={newPlan.name}
                    onChange={(e) => setNewPlan((p) => ({ ...p, name: e.target.value }))}
                    className="field__input"
                  />
                  <div>
                    <button type="button" onClick={handleCreate} className="primary-button">Create</button>
                    <button type="button" onClick={() => setCreating(false)} className="ghost-button">Cancel</button>
                  </div>
                </div>

                <div className="grid gap-3 md:grid-cols-3">
                  <label className="field">
                    <span className="field__label">Price</span>
                    <input type="number" value={newPlan.price} onChange={(e) => setNewPlan((p) => ({ ...p, price: Number(e.target.value) }))} className="field__input" />
                  </label>
                  <label className="field">
                    <span className="field__label">Credits</span>
                    <input type="number" value={newPlan.credits} onChange={(e) => setNewPlan((p) => ({ ...p, credits: Number(e.target.value) }))} className="field__input" />
                  </label>
                  <label className="field">
                    <span className="field__label">Badge</span>
                    <input value={newPlan.badge} onChange={(e) => setNewPlan((p) => ({ ...p, badge: e.target.value }))} className="field__input" />
                  </label>
                </div>

                <label className="field">
                  <span className="field__label">Summary</span>
                  <input value={newPlan.description} onChange={(e) => setNewPlan((p) => ({ ...p, description: e.target.value }))} className="field__input" />
                </label>
              </article>
            )}

            {plans.map((plan) => (
              <article key={plan.id} className="admin-plan-card">
                <div className="admin-plan-card__head">
                  <input value={plan.name} onChange={(event) => onUpdatePlan(plan.id, { name: event.target.value })} className="field__input" />
                  <button type="button" onClick={() => handleDeletePlan(plan.id, plan.name)} className="ghost-button">Delete</button>
                </div>

                <div className="grid gap-3 md:grid-cols-3">
                  <label className="field">
                    <span className="field__label">Price</span>
                    <input type="number" value={plan.price} onChange={(event) => onUpdatePlan(plan.id, { price: Number(event.target.value) })} className="field__input" />
                  </label>
                  <label className="field">
                    <span className="field__label">Credits</span>
                    <input type="number" value={plan.credits} onChange={(event) => onUpdatePlan(plan.id, { credits: Number(event.target.value) })} className="field__input" />
                  </label>
                  <label className="field">
                    <span className="field__label">Badge</span>
                    <input value={plan.badge} onChange={(event) => onUpdatePlan(plan.id, { badge: event.target.value })} className="field__input" />
                  </label>
                </div>

                <label className="field">
                  <span className="field__label">Summary</span>
                  <input value={plan.description} onChange={(event) => onUpdatePlan(plan.id, { description: event.target.value })} className="field__input" />
                </label>
              </article>
            ))}
          </div>
        </div>
      </section>
    </section>
  )
}
