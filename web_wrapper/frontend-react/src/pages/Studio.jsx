import React, { useState } from 'react'
import { Link } from 'react-router-dom'
import { formatDateTime, formatRelativeTime, titleCase } from '../lib/formatters'

const promptIdeas = [
  'Editorial portrait in natural window light with textured linen styling',
  'Cinematic desert outpost at blue hour with dramatic practical lights',
  'Product hero shot of brushed metal headphones on warm stone',
]

const samplers = ['dpmpp_2m', 'euler', 'euler_ancestral', 'dpmpp_sde', 'ddim']

export default function Studio({
  defaultModel,
  images,
  jobs,
  models,
  onGenerate,
  onPreferencesChange,
  preferences,
  systemStatus,
  user,
  workspaceLoading = false,
}) {
  const [prompt, setPrompt] = useState('')
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')

  const latestImage = images[0]
  const activeJobs = jobs.filter((job) => job.status === 'pending' || job.status === 'processing').slice(0, 4)
  const recentImages = images.slice(0, 4)
  const selectedModel = preferences.model_name || defaultModel || models[0] || ''

  function updatePreference(key, value) {
    onPreferencesChange((current) => ({ ...current, [key]: value }))
  }

  async function handleSubmit(event) {
    event.preventDefault()

    if (!prompt.trim()) {
      setError('Add a prompt before starting a generation.')
      return
    }

    setBusy(true)
    setError('')

    try {
      await onGenerate({
        ...preferences,
        model_name: selectedModel,
        prompt: prompt.trim(),
      })
    } catch (submissionError) {
      setError(submissionError.message)
    } finally {
      setBusy(false)
    }
  }

  return (
    <section className="space-y-6">
      <div className="hero-panel grid gap-6 xl:grid-cols-[1.05fr_0.95fr]">
        <div className="space-y-5">
          <p className="eyebrow">Studio workspace</p>
          <h1 className="hero-title !text-[clamp(2.65rem,4vw,4.8rem)]">
            Compose, queue, and monitor image jobs from one place.
          </h1>
          <p className="hero-copy">
            Signed in as {user?.name}. Your current balance is {user?.credits} credits, and every completed render drops into your private gallery automatically.
          </p>
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <div className="stat-tile">
            <div className="stat-tile__value">{images.length}</div>
            <div className="stat-tile__label">saved images</div>
          </div>
          <div className="stat-tile">
            <div className="stat-tile__value">{activeJobs.length}</div>
            <div className="stat-tile__label">active jobs</div>
          </div>
          <div className="stat-tile">
            <div className="stat-tile__value">{selectedModel || 'Default'}</div>
            <div className="stat-tile__label">active model</div>
          </div>
          <div className="stat-tile">
            <div className="stat-tile__value">{systemStatus?.comfyui_online ? 'GPU on' : 'Checking'}</div>
            <div className="stat-tile__label">render backend</div>
          </div>
        </div>
      </div>

      <div className="grid gap-6 xl:grid-cols-[0.95fr_1.05fr]">
        <form onSubmit={handleSubmit} className="surface-card space-y-5">
          <div className="flex items-center justify-between gap-4">
            <div>
              <p className="eyebrow">Prompt composer</p>
              <h2 className="mt-2 text-2xl font-semibold text-[var(--text-strong)]">Describe the frame.</h2>
            </div>
            <span className="rounded-full border border-[var(--border-soft)] bg-[var(--panel-muted)] px-3 py-1.5 text-xs uppercase tracking-[0.22em] text-[var(--text-soft)]">
              {workspaceLoading ? 'syncing' : 'ready'}
            </span>
          </div>

          <label className="field">
            <span className="field__label">Main prompt</span>
            <textarea
              value={prompt}
              onChange={(event) => setPrompt(event.target.value)}
              className="field__input min-h-[220px] resize-y"
              placeholder="Write a detailed prompt with subject, camera language, lighting, material cues, and mood."
            />
          </label>

          <div className="flex flex-wrap gap-2">
            {promptIdeas.map((idea) => (
              <button key={idea} type="button" onClick={() => setPrompt(idea)} className="nav-chip">
                {idea}
              </button>
            ))}
          </div>

          <label className="field">
            <span className="field__label">Negative prompt</span>
            <textarea
              value={preferences.negative_prompt}
              onChange={(event) => updatePreference('negative_prompt', event.target.value)}
              className="field__input min-h-[96px] resize-y"
              placeholder="blurry, deformed hands, text artifacts, duplicated limbs"
            />
          </label>

          <div className="grid gap-4 md:grid-cols-2">
            <label className="field">
              <span className="field__label">Model</span>
              <select value={selectedModel} onChange={(event) => updatePreference('model_name', event.target.value)} className="field__input">
                {(models.length ? models : [selectedModel || defaultModel]).filter(Boolean).map((model) => (
                  <option key={model} value={model}>{model}</option>
                ))}
              </select>
            </label>

            <label className="field">
              <span className="field__label">Sampler</span>
              <select value={preferences.sampler} onChange={(event) => updatePreference('sampler', event.target.value)} className="field__input">
                {samplers.map((sampler) => (
                  <option key={sampler} value={sampler}>{titleCase(sampler)}</option>
                ))}
              </select>
            </label>

            <label className="field">
              <span className="field__label">Width</span>
              <input type="number" min="256" step="8" value={preferences.width} onChange={(event) => updatePreference('width', Number(event.target.value))} className="field__input" />
            </label>

            <label className="field">
              <span className="field__label">Height</span>
              <input type="number" min="256" step="8" value={preferences.height} onChange={(event) => updatePreference('height', Number(event.target.value))} className="field__input" />
            </label>

            <label className="field">
              <span className="field__label">Steps</span>
              <input type="number" min="1" max="150" value={preferences.steps} onChange={(event) => updatePreference('steps', Number(event.target.value))} className="field__input" />
            </label>

            <label className="field">
              <span className="field__label">CFG scale</span>
              <input type="number" min="1" max="20" step="0.5" value={preferences.cfg_scale} onChange={(event) => updatePreference('cfg_scale', Number(event.target.value))} className="field__input" />
            </label>
          </div>

          {error && (
            <div className="rounded-[1.5rem] border border-rose-500/25 bg-rose-500/10 px-4 py-3 text-sm text-rose-200">
              {error}
            </div>
          )}

          <button type="submit" disabled={busy || !systemStatus?.comfyui_online} className="primary-button w-full justify-center">
            {busy ? 'Queueing generation...' : systemStatus?.comfyui_online ? 'Generate on GPU' : 'Waiting for ComfyUI'}
          </button>
        </form>

        <div className="space-y-6">
          <div className="surface-card overflow-hidden">
            <div className="flex items-center justify-between gap-4">
              <div>
                <p className="eyebrow">Preview stage</p>
                <h2 className="mt-2 text-2xl font-semibold text-[var(--text-strong)]">
                  {latestImage ? 'Latest completed render' : 'Your next render will appear here'}
                </h2>
              </div>
              {latestImage && (
                <Link to="/gallery" className="secondary-button">
                  Open gallery
                </Link>
              )}
            </div>

            <div className="mt-6 preview-frame">
              {latestImage ? (
                <img src={latestImage.image_url || latestImage.url} alt={latestImage.prompt} className="h-full w-full object-cover" />
              ) : (
                <div className="preview-placeholder">
                  <div className="preview-placeholder__orb" />
                  <p className="eyebrow">Render queue</p>
                  <h3 className="mt-3 text-3xl font-semibold text-[var(--text-strong)]">Queue a prompt to seed the gallery.</h3>
                  <p className="mt-4 max-w-xl text-sm leading-7 text-[var(--text-soft)]">
                    Imagyn now shows real render state, so once ComfyUI completes a job the finished image returns here and lands in your history.
                  </p>
                </div>
              )}
            </div>

            {latestImage && (
              <div className="mt-5 grid gap-3 md:grid-cols-2">
                <div className="rounded-[1.5rem] border border-[var(--border-soft)] bg-[var(--panel-muted)] p-4">
                  <p className="eyebrow">Prompt</p>
                  <p className="mt-3 text-sm leading-7 text-[var(--text-soft)]">{latestImage.prompt}</p>
                </div>
                <div className="rounded-[1.5rem] border border-[var(--border-soft)] bg-[var(--panel-muted)] p-4">
                  <p className="eyebrow">Generated</p>
                  <p className="mt-3 text-sm text-[var(--text-soft)]">{formatDateTime(latestImage.created_at || latestImage.createdAt)}</p>
                </div>
              </div>
            )}
          </div>

          <div className="grid gap-6 lg:grid-cols-2">
            <div className="surface-card">
              <div className="flex items-center justify-between">
                <div>
                  <p className="eyebrow">Queue</p>
                  <h3 className="mt-2 text-xl font-semibold text-[var(--text-strong)]">Active generations</h3>
                </div>
                <Link to="/history" className="secondary-button">History</Link>
              </div>

              <div className="mt-5 space-y-3">
                {activeJobs.length ? activeJobs.map((job) => (
                  <article key={job.id} className="rounded-[1.4rem] border border-[var(--border-soft)] bg-[var(--panel-muted)] p-4">
                    <div className="flex items-center justify-between gap-3">
                      <strong className="text-sm text-[var(--text-strong)]">{titleCase(job.status)}</strong>
                      <span className="text-xs uppercase tracking-[0.22em] text-[var(--text-soft)]">{formatRelativeTime(job.created_at)}</span>
                    </div>
                    <p className="mt-3 text-sm leading-7 text-[var(--text-soft)]">{job.prompt}</p>
                  </article>
                )) : (
                  <div className="rounded-[1.4rem] border border-dashed border-[var(--border-soft)] bg-[var(--panel-muted)] px-4 py-8 text-sm text-[var(--text-soft)]">
                    No active jobs right now. The next generation you queue will show progress here.
                  </div>
                )}
              </div>
            </div>

            <div className="surface-card">
              <div className="flex items-center justify-between">
                <div>
                  <p className="eyebrow">Recent output</p>
                  <h3 className="mt-2 text-xl font-semibold text-[var(--text-strong)]">Quick access strip</h3>
                </div>
                <Link to="/gallery" className="secondary-button">View all</Link>
              </div>

              <div className="mt-5 grid gap-3 sm:grid-cols-2">
                {recentImages.length ? recentImages.map((image) => (
                  <article key={image.id} className="overflow-hidden rounded-[1.4rem] border border-[var(--border-soft)] bg-[var(--panel-muted)]">
                    <img src={image.image_url || image.url} alt={image.prompt} className="aspect-square w-full object-cover" />
                    <div className="p-3">
                      <p className="line-clamp-2 text-sm leading-6 text-[var(--text-soft)]">{image.prompt}</p>
                    </div>
                  </article>
                )) : (
                  <div className="rounded-[1.4rem] border border-dashed border-[var(--border-soft)] bg-[var(--panel-muted)] px-4 py-8 text-sm text-[var(--text-soft)] sm:col-span-2">
                    Your saved images will appear here after the first successful render.
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}
