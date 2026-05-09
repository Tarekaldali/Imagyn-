import React, { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { formatDateTime, formatRelativeTime, titleCase } from '../lib/formatters'

const promptIdeas = [
  'Founder portrait in a softly lit design office, editorial mood, muted neutrals, subtle film texture, 85mm lens.',
  'Ultra-clean product hero shot of ceramic skincare packaging on cut limestone, soft bounce light, premium brand campaign.',
  'Cinematic rooftop dinner scene at blue hour, practical tungsten bulbs, elegant wardrobe styling, grounded realism.',
]

const samplers = ['dpmpp_2m', 'euler', 'euler_ancestral', 'dpmpp_sde', 'ddim']

export default function Studio({
  defaultModel,
  images,
  injectedPrompt,
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
  const activeJobs = jobs.filter((job) => job.status === 'pending' || job.status === 'processing').slice(0, 5)
  const selectedModel = preferences.model_name || defaultModel || models[0] || ''

  useEffect(() => {
    if (injectedPrompt) {
      setPrompt(injectedPrompt)
    }
  }, [injectedPrompt])

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
      <div className="command-hero">
        <div>
          <p className="eyebrow">Studio control room</p>
          <h1 className="hero-title !text-[clamp(2.7rem,4vw,4.8rem)]">Build prompts like a real production desk.</h1>
          <p className="hero-copy">
            Welcome back, {user?.name}. This workspace is tuned for fast visual iteration, clean generation controls, and clear operational feedback from the GPU pipeline.
          </p>
        </div>

        <div className="command-hero__stats">
          <article className="admin-metric">
            <p className="admin-metric__label">Saved images</p>
            <p className="admin-metric__value">{images.length}</p>
            <p className="admin-metric__hint">Private gallery assets</p>
          </article>
          <article className="admin-metric">
            <p className="admin-metric__label">Active queue</p>
            <p className="admin-metric__value">{activeJobs.length}</p>
            <p className="admin-metric__hint">Pending or processing jobs</p>
          </article>
          <article className={`admin-metric ${systemStatus?.comfyui_online ? 'admin-metric--accent' : ''}`}>
            <p className="admin-metric__label">Render backend</p>
            <p className="admin-metric__value">{systemStatus?.comfyui_online ? 'Online' : 'Offline'}</p>
            <p className="admin-metric__hint">{selectedModel || 'No model selected'}</p>
          </article>
        </div>
      </div>

      <div className="admin-grid">
        <form onSubmit={handleSubmit} className="admin-panel admin-panel--wide">
          <div className="admin-panel__header">
            <div>
              <p className="eyebrow">Prompt director</p>
              <h2 className="admin-panel__title">Shape the shot</h2>
            </div>
            <span className="rounded-full border border-[var(--border-soft)] bg-[var(--panel-muted)] px-3 py-1.5 text-xs uppercase tracking-[0.22em] text-[var(--text-soft)]">
              {workspaceLoading ? 'syncing' : 'ready'}
            </span>
          </div>

          <label className="field">
            <span className="field__label">Primary prompt</span>
            <textarea
              value={prompt}
              onChange={(event) => setPrompt(event.target.value)}
              className="field__input studio-prompt"
              placeholder="Describe the subject, camera, lens feel, styling, lighting, material details, and emotional tone."
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
              className="field__input min-h-[110px] resize-y"
              placeholder="blurry, extra fingers, harsh artifacts, bad anatomy"
            />
          </label>

          <div className="grid gap-4 md:grid-cols-3">
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
              <span className="field__label">Steps</span>
              <input type="number" min="1" max="150" value={preferences.steps} onChange={(event) => updatePreference('steps', Number(event.target.value))} className="field__input" />
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
              <span className="field__label">CFG scale</span>
              <input type="number" min="1" max="20" step="0.5" value={preferences.cfg_scale} onChange={(event) => updatePreference('cfg_scale', Number(event.target.value))} className="field__input" />
            </label>
          </div>

          {error && (
            <div className="rounded-[1.2rem] border border-rose-500/25 bg-rose-500/10 px-4 py-3 text-sm text-rose-200">
              {error}
            </div>
          )}

          <div className="flex flex-wrap items-center gap-3">
            <button type="submit" disabled={busy || !systemStatus?.comfyui_online} className="primary-button">
              {busy ? 'Queueing generation...' : systemStatus?.comfyui_online ? 'Generate on GPU' : 'Waiting for GPU backend'}
            </button>
            <Link to="/library" className="secondary-button">Open prompt library</Link>
          </div>
        </form>

        <section className="admin-panel">
          <div className="admin-panel__header">
            <div>
              <p className="eyebrow">Render monitor</p>
              <h2 className="admin-panel__title">{latestImage ? 'Latest completed render' : 'Preview stage'}</h2>
            </div>
          </div>

          <div className="studio-preview">
            {latestImage ? (
              <img src={latestImage.image_url || latestImage.url} alt={latestImage.prompt} className="h-full w-full object-cover" />
            ) : (
              <div className="preview-placeholder">
                <div className="preview-placeholder__orb" />
                <p className="eyebrow">Awaiting output</p>
                <h3 className="mt-3 text-3xl font-semibold text-[var(--text-strong)]">Your next image will land here.</h3>
                <p className="mt-4 max-w-xl text-sm leading-7 text-[var(--text-soft)]">
                  Once a queued job finishes, the image appears here and is archived in Gallery automatically.
                </p>
              </div>
            )}
          </div>

          {latestImage && (
            <div className="grid gap-3 md:grid-cols-2">
              <div className="admin-summary-card">
                <div>
                  <p className="admin-table__name">Prompt</p>
                  <p className="admin-table__meta">{latestImage.prompt}</p>
                </div>
              </div>
              <div className="admin-summary-card">
                <div>
                  <p className="admin-table__name">Created</p>
                  <p className="admin-table__meta">{formatDateTime(latestImage.created_at || latestImage.createdAt)}</p>
                </div>
              </div>
            </div>
          )}
        </section>

        
      </div>
    </section>
  )
}
