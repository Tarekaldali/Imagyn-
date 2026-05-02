import React from 'react'
import { formatDateTime } from '../lib/formatters'

export default function Profile({ images = [], jobs = [], user }) {
  const lastImage = images[0]
  const lastJob = jobs[0]

  return (
    <section className="space-y-6">
      <div className="hero-panel grid gap-6 xl:grid-cols-[0.95fr_1.05fr]">
        <div>
          <p className="eyebrow">Profile</p>
          <h1 className="hero-title !text-[clamp(2.3rem,3vw,4rem)]">{user?.name || 'User'}'s workspace snapshot.</h1>
          <p className="hero-copy">
            This profile view turns the old static placeholder into a real account summary driven by your jobs, gallery, and credit balance.
          </p>
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <div className="stat-tile">
            <div className="stat-tile__value">{user?.credits ?? 0}</div>
            <div className="stat-tile__label">credits remaining</div>
          </div>
          <div className="stat-tile">
            <div className="stat-tile__value">{images.length}</div>
            <div className="stat-tile__label">saved images</div>
          </div>
          <div className="stat-tile">
            <div className="stat-tile__value">{jobs.length}</div>
            <div className="stat-tile__label">total jobs</div>
          </div>
          <div className="stat-tile">
            <div className="stat-tile__value">{user?.role || 'user'}</div>
            <div className="stat-tile__label">account role</div>
          </div>
        </div>
      </div>

      <div className="grid gap-6 xl:grid-cols-2">
        <div className="surface-card">
          <p className="eyebrow">Account details</p>
          <div className="mt-5 space-y-4">
            <div className="detail-row">
              <span>Name</span>
              <strong>{user?.name || 'Unknown'}</strong>
            </div>
            <div className="detail-row">
              <span>Email</span>
              <strong>{user?.email || 'Unknown'}</strong>
            </div>
            <div className="detail-row">
              <span>Last login</span>
              <strong>{formatDateTime(user?.last_login)}</strong>
            </div>
            <div className="detail-row">
              <span>Member since</span>
              <strong>{formatDateTime(user?.created_at)}</strong>
            </div>
          </div>
        </div>

        <div className="surface-card">
          <p className="eyebrow">Recent activity</p>
          <div className="mt-5 space-y-4">
            <div className="rounded-[1.4rem] border border-[var(--border-soft)] bg-[var(--panel-muted)] p-4">
              <div className="text-xs uppercase tracking-[0.22em] text-[var(--text-soft)]">Latest job</div>
              <p className="mt-3 text-sm leading-7 text-[var(--text-soft)]">{lastJob?.prompt || 'No jobs yet.'}</p>
            </div>
            <div className="rounded-[1.4rem] border border-[var(--border-soft)] bg-[var(--panel-muted)] p-4">
              <div className="text-xs uppercase tracking-[0.22em] text-[var(--text-soft)]">Latest image</div>
              <p className="mt-3 text-sm leading-7 text-[var(--text-soft)]">{lastImage?.prompt || 'No images saved yet.'}</p>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}
