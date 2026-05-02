import React from 'react'

const themeOptions = [
  { id: 'light', label: 'Light', description: 'Warm paper, softer contrast, daylight workspace.' },
  { id: 'dark', label: 'Dark', description: 'Ink surfaces, brighter accents, night-session focus.' },
]

export default function Settings({
  defaultModel,
  models = [],
  onPreferencesChange,
  onRefreshStatus,
  preferences,
  setTheme,
  systemStatus,
  theme,
}) {
  const availableModels = models.length ? models : [defaultModel].filter(Boolean)

  function updatePreference(key, value) {
    onPreferencesChange((current) => ({ ...current, [key]: value }))
  }

  return (
    <section className="space-y-6">
      <div className="hero-panel flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <p className="eyebrow">Settings</p>
          <h1 className="hero-title !text-[clamp(2.3rem,3vw,4rem)]">Tune the atmosphere and your generation defaults.</h1>
          <p className="hero-copy">
            This page now controls the actual light-dark theme plus the defaults reused by the studio instead of acting like a placeholder paragraph.
          </p>
        </div>

        <button type="button" onClick={onRefreshStatus} className="secondary-button">
          Refresh backend status
        </button>
      </div>

      <div className="grid gap-6 xl:grid-cols-[0.92fr_1.08fr]">
        <div className="surface-card">
          <p className="eyebrow">Theme mode</p>
          <div className="mt-5 grid gap-4">
            {themeOptions.map((option) => (
              <button key={option.id} type="button" onClick={() => setTheme(option.id)} className={theme === option.id ? 'theme-option theme-option--active' : 'theme-option'}>
                <strong className="block text-left text-base text-[var(--text-strong)]">{option.label}</strong>
                <span className="mt-2 block text-left text-sm leading-7 text-[var(--text-soft)]">{option.description}</span>
              </button>
            ))}
          </div>
        </div>

        <div className="surface-card space-y-5">
          <div>
            <p className="eyebrow">Studio defaults</p>
            <h2 className="mt-2 text-2xl font-semibold text-[var(--text-strong)]">Saved between sessions</h2>
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            <label className="field">
              <span className="field__label">Default model</span>
              <select value={preferences.model_name || defaultModel} onChange={(event) => updatePreference('model_name', event.target.value)} className="field__input">
                {availableModels.map((model) => (
                  <option key={model} value={model}>{model}</option>
                ))}
              </select>
            </label>

            <label className="field">
              <span className="field__label">Sampler</span>
              <input value={preferences.sampler} onChange={(event) => updatePreference('sampler', event.target.value)} className="field__input" />
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

          <label className="field">
            <span className="field__label">Default negative prompt</span>
            <textarea value={preferences.negative_prompt} onChange={(event) => updatePreference('negative_prompt', event.target.value)} className="field__input min-h-[120px] resize-y" />
          </label>

          <div className="rounded-[1.5rem] border border-[var(--border-soft)] bg-[var(--panel-muted)] p-4">
            <div className="detail-row">
              <span>Backend</span>
              <strong>{systemStatus?.backend || 'online'}</strong>
            </div>
            <div className="detail-row mt-3">
              <span>ComfyUI</span>
              <strong>{systemStatus?.comfyui_online ? 'Connected' : 'Offline'}</strong>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}
