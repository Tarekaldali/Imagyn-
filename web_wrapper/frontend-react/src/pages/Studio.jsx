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
  const [previewImage, setPreviewImage] = useState(null)

  const latestImage = images[0]
  const selectedModel = preferences.model_name || defaultModel || models[0] || ''

  useEffect(() => {
    if (injectedPrompt) {
      setPrompt(injectedPrompt)
    }
  }, [injectedPrompt])

  useEffect(() => {
    // keep preview in sync with latest completed image
    setPreviewImage(latestImage || null)
  }, [latestImage])

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
    <section>
      <div className="studio-shell">
        <aside className="studio-sidebar surface-card">
          <div>
            <div className="admin-panel__header">
              <div>
                <p className="eyebrow">Prompt director</p>
                <h2 className="admin-panel__title">Shape the shot</h2>
              </div>
              <span className="rounded-full border border-[var(--border-soft)] bg-[var(--panel-muted)] px-3 py-1.5 text-xs uppercase tracking-[0.22em] text-[var(--text-soft)]">
                {workspaceLoading ? 'syncing' : 'ready'}
              </span>
            </div>

            <form onSubmit={handleSubmit} className="studio-form">
              <label className="field">
                <span className="field__label">Primary prompt</span>
                <textarea
                  value={prompt}
                  onChange={(event) => setPrompt(event.target.value)}
                  className="field__input studio-prompt"
                  placeholder="Describe the subject, camera, lens feel, styling, lighting, material details, and emotional tone."
                />
              </label>

              <div className="prompt-suggestions">
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
                  className="field__input min-h-[100px] resize-y"
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

                <div className="studio-actions">
                  <button type="submit" disabled={busy || !systemStatus?.comfyui_online} className="primary-button">
                    {busy ? 'Queueing generation...' : systemStatus?.comfyui_online ? 'generate' : 'Waiting for GPU backend'}
                  </button>
                  <Link to="/library" className="secondary-button">Open prompt library</Link>
                </div>
            </form>

            {/* Active queue removed per request */}
          </div>
        </aside>

        <main className="studio-main">
          <div className="studio-preview surface-card">
            <div className="studio-preview__header">
              <div>
                <p className="eyebrow">Render monitor</p>
                <h2 className="admin-panel__title">{previewImage ? 'Preview' : 'Preview stage'}</h2>
              </div>
              <div>
                <button type="button" className="ghost-button" onClick={() => setPreviewImage(latestImage || null)}>
                  Refresh
                </button>
              </div>
            </div>

            <div className="studio-preview__body">
              {previewImage ? (
                <img src={previewImage.image_url || previewImage.url} alt={previewImage.prompt} className="preview-image" />
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

            {previewImage && (
              <div className="grid gap-3 md:grid-cols-2 p-4">
                <div className="admin-summary-card">
                  <div>
                    <p className="admin-table__name">Prompt</p>
                    <p className="admin-table__meta">{previewImage.prompt}</p>
                  </div>
                </div>
                <div className="admin-summary-card">
                  <div>
                    <p className="admin-table__name">Created</p>
                    <p className="admin-table__meta">{formatDateTime(previewImage.created_at || previewImage.createdAt)}</p>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Recent renders removed per request */}
        </main>
      </div>
    </section>
  )
}
