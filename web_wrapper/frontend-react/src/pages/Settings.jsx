import React from 'react'

export default function Settings({ preferences, onPreferencesChange, systemStatus }) {
  function updateSetting(key, value) {
    onPreferencesChange((current) => ({ ...current, [key]: value }))
  }

  return (
    <section className="space-y-6">
      <div className="hero-panel">
        <p className="eyebrow">Workspace settings</p>
        <h1 className="hero-title !text-[clamp(2.3rem,3vw,4rem)]">Control rendering defaults and environment readiness.</h1>
        <p className="hero-copy">These values prefill your Studio form so every new job starts from your preferred baseline.</p>
      </div>

      <div className="grid gap-6 lg:grid-cols-[1fr_340px]">
        <article className="surface-card space-y-4">
          <label className="field">
            <span className="field__label">Default negative prompt</span>
            <textarea
              value={preferences.negative_prompt}
              onChange={(event) => updateSetting('negative_prompt', event.target.value)}
              className="field__input min-h-[120px] resize-y"
              placeholder="blurry, low detail, bad anatomy..."
            />
          </label>

          <div className="grid gap-4 md:grid-cols-2">
            <label className="field">
              <span className="field__label">Default width</span>
              <input
                type="number"
                value={preferences.width}
                min="256"
                step="8"
                onChange={(event) => updateSetting('width', Number(event.target.value))}
                className="field__input"
              />
            </label>
            <label className="field">
              <span className="field__label">Default height</span>
              <input
                type="number"
                value={preferences.height}
                min="256"
                step="8"
                onChange={(event) => updateSetting('height', Number(event.target.value))}
                className="field__input"
              />
            </label>
            <label className="field">
              <span className="field__label">Default steps</span>
              <input
                type="number"
                value={preferences.steps}
                min="1"
                max="150"
                onChange={(event) => updateSetting('steps', Number(event.target.value))}
                className="field__input"
              />
            </label>
            <label className="field">
              <span className="field__label">Default CFG scale</span>
              <input
                type="number"
                value={preferences.cfg_scale}
                min="1"
                max="20"
                step="0.5"
                onChange={(event) => updateSetting('cfg_scale', Number(event.target.value))}
                className="field__input"
              />
            </label>
          </div>
        </article>

        <aside className="surface-card">
          <p className="eyebrow">System status</p>
          <div className="mt-4 space-y-3">
            <div className="stat-tile">
              <div className="stat-tile__value">{systemStatus?.backend_online ? 'Online' : 'Offline'}</div>
              <div className="stat-tile__label">backend api</div>
            </div>
            <div className="stat-tile">
              <div className="stat-tile__value">{systemStatus?.comfyui_online ? 'Online' : 'Offline'}</div>
              <div className="stat-tile__label">gpu worker</div>
            </div>
          </div>
        </aside>
      </div>
    </section>
  )
}
