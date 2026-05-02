import React from 'react'
import { formatDateTime, formatDuration, titleCase } from '../lib/formatters'

export default function History({ jobs, loading = false, onRefresh }) {
  const completedJobs = jobs.filter((job) => job.status === 'completed')
  const failedJobs = jobs.filter((job) => job.status === 'failed')
  const pendingJobs = jobs.filter((job) => job.status === 'pending' || job.status === 'processing')

  return (
    <section className="space-y-6">
      <div className="hero-panel flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <p className="eyebrow">Render history</p>
          <h1 className="hero-title !text-[clamp(2.3rem,3vw,4rem)]">Track queue state, timing, and failures without guessing.</h1>
          <p className="hero-copy">
            Every request is represented as a job, so you can see what was queued, what finished, and what needs another try.
          </p>
        </div>

        <button type="button" onClick={onRefresh} className="secondary-button">
          Refresh jobs
        </button>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        <div className="stat-tile">
          <div className="stat-tile__value">{completedJobs.length}</div>
          <div className="stat-tile__label">completed jobs</div>
        </div>
        <div className="stat-tile">
          <div className="stat-tile__value">{pendingJobs.length}</div>
          <div className="stat-tile__label">in progress</div>
        </div>
        <div className="stat-tile">
          <div className="stat-tile__value">{failedJobs.length}</div>
          <div className="stat-tile__label">needs retry</div>
        </div>
      </div>

      <div className="surface-card space-y-4">
        {loading ? (
          <div className="rounded-[1.5rem] border border-[var(--border-soft)] bg-[var(--panel-muted)] px-4 py-10 text-center text-sm text-[var(--text-soft)]">
            Loading job history...
          </div>
        ) : jobs.length ? (
          jobs.map((job) => (
            <article key={job.id} className="rounded-[1.65rem] border border-[var(--border-soft)] bg-[var(--panel-muted)] p-5">
              <div className="flex flex-wrap items-start justify-between gap-4">
                <div>
                  <p className="eyebrow">{titleCase(job.status)}</p>
                  <h2 className="mt-2 text-lg font-semibold text-[var(--text-strong)]">{job.model_name}</h2>
                  <p className="mt-3 max-w-4xl text-sm leading-7 text-[var(--text-soft)]">{job.prompt}</p>
                </div>
                <div className="rounded-[1.25rem] border border-[var(--border-soft)] bg-[var(--panel-strong)] px-4 py-3 text-right">
                  <div className="text-xs uppercase tracking-[0.22em] text-[var(--text-soft)]">GPU time</div>
                  <div className="mt-2 text-lg font-semibold text-[var(--text-strong)]">{formatDuration(job.gpu_time)}</div>
                </div>
              </div>

              <div className="mt-5 grid gap-3 md:grid-cols-3">
                <div className="rounded-[1.2rem] border border-[var(--border-soft)] bg-[var(--panel-strong)] px-4 py-3 text-sm text-[var(--text-soft)]">
                  Created: {formatDateTime(job.created_at)}
                </div>
                <div className="rounded-[1.2rem] border border-[var(--border-soft)] bg-[var(--panel-strong)] px-4 py-3 text-sm text-[var(--text-soft)]">
                  Started: {formatDateTime(job.started_at)}
                </div>
                <div className="rounded-[1.2rem] border border-[var(--border-soft)] bg-[var(--panel-strong)] px-4 py-3 text-sm text-[var(--text-soft)]">
                  Finished: {formatDateTime(job.finished_at)}
                </div>
              </div>

              {job.error_message && (
                <div className="mt-4 rounded-[1.2rem] border border-rose-500/25 bg-rose-500/10 px-4 py-3 text-sm text-rose-200">
                  {job.error_message}
                </div>
              )}

              {job.image_url && (
                <a href={job.image_url} target="_blank" rel="noreferrer" className="secondary-button mt-4 inline-flex">
                  Open final image
                </a>
              )}
            </article>
          ))
        ) : (
          <div className="rounded-[1.5rem] border border-dashed border-[var(--border-soft)] bg-[var(--panel-muted)] px-4 py-12 text-center">
            <p className="text-lg font-semibold text-[var(--text-strong)]">No jobs yet.</p>
            <p className="mt-2 text-sm text-[var(--text-soft)]">Queue your first prompt from the studio to build a proper render history.</p>
          </div>
        )}
      </div>
    </section>
  )
}
