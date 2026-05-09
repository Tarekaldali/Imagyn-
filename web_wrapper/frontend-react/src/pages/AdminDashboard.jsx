import React, { useMemo } from 'react'
import { formatCurrency, formatDateTime, formatDuration } from '../lib/formatters'

export default function AdminDashboard({
  adminOverview,
  jobs = [],
  onDeletePlan,
  onRefresh,
  onToast,
  onUpdatePlan,
  plans = [],
  requestConfirm,
}) {
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
      onToast(`${planName} removed from the pricing page.`, 'success', 'Plan updated')
    }
  }

  return (
    <section className="admin-shell">
      <div className="admin-toolbar">
        <div>
          <p className="eyebrow">Owner command center</p>
          <h1 className="admin-title">Manage plans, users, and system health from one dashboard.</h1>
        </div>
        <button type="button" onClick={onRefresh} className="secondary-button">Refresh overview</button>
      </div>

      <div className="admin-metrics">
        <article className="admin-metric">
          <p className="admin-metric__label">Total users</p>
          <p className="admin-metric__value">{stats.total_users || 0}</p>
          <p className="admin-metric__hint">{stats.admin_users || 0} admin accounts</p>
        </article>
        <article className="admin-metric">
          <p className="admin-metric__label">Active jobs</p>
          <p className="admin-metric__value">{stats.active_jobs || 0}</p>
          <p className="admin-metric__hint">{stats.completed_jobs || 0} completed renders</p>
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

      <div className="admin-grid">
        <section className="admin-panel">
          <div className="admin-panel__header">
            <div>
              <p className="eyebrow">Website plans</p>
              <h2 className="admin-panel__title">Pricing and credit tiers</h2>
            </div>
          </div>

          <div className="admin-plan-list">
            {plans.map((plan) => (
              <article key={plan.id} className="admin-plan-card">
                <div className="admin-plan-card__head">
                  <input
                    value={plan.name}
                    onChange={(event) => onUpdatePlan(plan.id, { name: event.target.value })}
                    className="field__input"
                  />
                  <button type="button" onClick={() => handleDeletePlan(plan.id, plan.name)} className="ghost-button">
                    Delete
                  </button>
                </div>

                <div className="grid gap-3 md:grid-cols-3">
                  <label className="field">
                    <span className="field__label">Price</span>
                    <input
                      type="number"
                      value={plan.price}
                      onChange={(event) => onUpdatePlan(plan.id, { price: Number(event.target.value) })}
                      className="field__input"
                    />
                  </label>
                  <label className="field">
                    <span className="field__label">Credits</span>
                    <input
                      type="number"
                      value={plan.credits}
                      onChange={(event) => onUpdatePlan(plan.id, { credits: Number(event.target.value) })}
                      className="field__input"
                    />
                  </label>
                  <label className="field">
                    <span className="field__label">Badge</span>
                    <input
                      value={plan.badge}
                      onChange={(event) => onUpdatePlan(plan.id, { badge: event.target.value })}
                      className="field__input"
                    />
                  </label>
                </div>

                <label className="field">
                  <span className="field__label">Summary</span>
                  <input
                    value={plan.description}
                    onChange={(event) => onUpdatePlan(plan.id, { description: event.target.value })}
                    className="field__input"
                  />
                </label>
              </article>
            ))}
          </div>
        </section>

        <section className="admin-panel">
          <div className="admin-panel__header">
            <div>
              <p className="eyebrow">Recent users</p>
              <h2 className="admin-panel__title">Account activity snapshot</h2>
            </div>
          </div>

          <div className="admin-table">
            {users.slice(0, 7).map((user) => (
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
          </div>
        </section>

        <section className="admin-panel admin-panel--wide">
          <div className="admin-panel__header">
            <div>
              <p className="eyebrow">Recent jobs</p>
              <h2 className="admin-panel__title">Generation operations</h2>
            </div>
          </div>

          <div className="admin-jobs">
            {recentJobs.map((job) => (
              <article key={job.id} className="admin-job-card">
                <div className="admin-job-card__main">
                  <strong>{job.model_name || 'Default model'}</strong>
                  <span>{job.prompt}</span>
                </div>
                <div className="admin-job-card__meta">
                  <span>{job.status}</span>
                  <span>{formatDuration(job.gpu_time)}</span>
                  <span>{formatDateTime(job.created_at)}</span>
                </div>
              </article>
            ))}
          </div>
        </section>

        <section className="admin-panel">
          <div className="admin-panel__header">
            <div>
              <p className="eyebrow">Business summary</p>
              <h2 className="admin-panel__title">Plan value preview</h2>
            </div>
          </div>

          <div className="space-y-3">
            {plans.map((plan) => (
              <article key={plan.id} className="admin-summary-card">
                <div>
                  <p className="admin-table__name">{plan.name}</p>
                  <p className="admin-table__meta">{plan.credits} credits</p>
                </div>
                <strong>{formatCurrency(plan.price)}</strong>
              </article>
            ))}
          </div>
        </section>
      </div>
    </section>
  )
}
