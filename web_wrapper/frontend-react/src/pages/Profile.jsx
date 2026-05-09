import React from 'react'
import { formatDateTime } from '../lib/formatters'

export default function Profile({ user, images = [], jobs = [] }) {
  const completedJobs = jobs.filter((job) => job.status === 'completed')
  const failedJobs = jobs.filter((job) => job.status === 'failed')

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
          <p className="eyebrow">Name</p>
          <p className="mt-3 text-3xl font-semibold text-[var(--text-strong)]">{user?.name || 'User'}</p>
          <p className="mt-2 text-sm text-[var(--text-soft)]">{user?.email || 'No email'}</p>
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
