import React, { useDeferredValue, useState } from 'react'
import { formatDateTime, formatDuration, titleCase } from '../lib/formatters'

export default function History({ jobs = [], loading = false, onRefresh }) {
  const [query, setQuery] = useState('')
  const deferredQuery = useDeferredValue(query.trim().toLowerCase())

  const filteredJobs = jobs.filter((job) => {
    if (!deferredQuery) {
      return true
    }
    return (job.prompt || '').toLowerCase().includes(deferredQuery) || (job.model_name || '').toLowerCase().includes(deferredQuery)
  })

  return (
    <section className="space-y-6">
      <div className="hero-panel flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <p className="eyebrow">Generation timeline</p>
          <h1 className="hero-title !text-[clamp(2.3rem,3vw,4rem)]">Track every queued prompt and final result.</h1>
          <p className="hero-copy">
            Review status transitions, model usage, and render time for each job created in your account.
          </p>
        </div>
        <button type="button" onClick={onRefresh} className="secondary-button">Refresh history</button>
      </div>

      <div className="surface-card space-y-5">
        <label className="field">
          <span className="field__label">Search by prompt or model</span>
          <input
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            className="field__input"
            placeholder="editorial portrait, dreamshaper..."
          />
        </label>

        {loading ? (
          <div className="rounded-[1.5rem] border border-[var(--border-soft)] bg-[var(--panel-muted)] px-4 py-10 text-center text-sm text-[var(--text-soft)]">
            Loading history...
          </div>
        ) : filteredJobs.length ? (
          <div className="space-y-3">
            {filteredJobs.map((job) => (
              <article key={job.id} className="rounded-[1.5rem] border border-[var(--border-soft)] bg-[var(--panel-muted)] p-4">
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <div>
                    <p className="text-sm uppercase tracking-[0.22em] text-[var(--text-soft)]">{formatDateTime(job.created_at)}</p>
                    <h3 className="mt-2 text-lg font-semibold text-[var(--text-strong)]">{titleCase(job.status)}</h3>
                  </div>
                  <div className="text-right text-sm text-[var(--text-soft)]">
                    <p>{job.model_name || 'Default model'}</p>
                    <p>{formatDuration(job.gpu_time)}</p>
                  </div>
                </div>
                <p className="mt-3 text-sm leading-7 text-[var(--text-soft)]">{job.prompt}</p>
                {job.error_message && (
                  <p className="mt-3 rounded-xl border border-rose-500/25 bg-rose-500/10 px-3 py-2 text-sm text-rose-200">
                    {job.error_message}
                  </p>
                )}
              </article>
            ))}
          </div>
        ) : (
          <div className="rounded-[1.5rem] border border-dashed border-[var(--border-soft)] bg-[var(--panel-muted)] px-4 py-12 text-center">
            <p className="text-lg font-semibold text-[var(--text-strong)]">No generation jobs yet.</p>
            <p className="mt-2 text-sm text-[var(--text-soft)]">Queue your first render from Studio and it will appear here.</p>
          </div>
        )}
      </div>
    </section>
  )
}
