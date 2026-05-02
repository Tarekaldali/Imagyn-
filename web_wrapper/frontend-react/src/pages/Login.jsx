import React, { useState } from 'react'

const highlights = [
  'A real account flow backed by FastAPI and Supabase auth',
  'Personal image gallery and queue history tied to your user',
  'Persistent light and dark themes with generation defaults',
]

export default function Login({ onLogin, onRegister, authLoading = false }) {
  const [mode, setMode] = useState('login')
  const [form, setForm] = useState({
    name: '',
    email: '',
    password: '',
  })
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState('')

  function updateField(key, value) {
    setForm((current) => ({ ...current, [key]: value }))
  }

  async function handleSubmit(event) {
    event.preventDefault()
    setError('')
    setSubmitting(true)

    try {
      if (mode === 'register') {
        await onRegister({
          name: form.name.trim(),
          email: form.email.trim(),
          password: form.password,
        })
      } else {
        await onLogin({
          email: form.email.trim(),
          password: form.password,
        })
      }
    } catch (submissionError) {
      setError(submissionError.message)
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <section className="grid gap-6 xl:grid-cols-[0.92fr_1.08fr]">
      <aside className="surface-card flex flex-col justify-between">
        <div>
          <p className="eyebrow">Account access</p>
          <h1 className="mt-3 text-4xl font-semibold text-[var(--text-strong)]">Sign in to your image workspace.</h1>
          <p className="mt-4 text-sm leading-7 text-[var(--text-soft)]">
            The new auth flow stores your credits, queue history, and image archive in one account instead of leaving each page to guess who you are.
          </p>
        </div>

        <div className="mt-10 space-y-3">
          {highlights.map((item) => (
            <div key={item} className="rounded-[1.5rem] border border-[var(--border-soft)] bg-[var(--panel-muted)] px-4 py-4 text-sm text-[var(--text-soft)]">
              {item}
            </div>
          ))}
        </div>
      </aside>

      <div className="surface-card">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <p className="eyebrow">Authentication</p>
            <h2 className="mt-2 text-3xl font-semibold text-[var(--text-strong)]">
              {mode === 'login' ? 'Welcome back' : 'Create your account'}
            </h2>
          </div>

          <div className="rounded-full border border-[var(--border-soft)] bg-[var(--panel-muted)] p-1">
            <button type="button" onClick={() => setMode('login')} className={mode === 'login' ? 'segmented-button segmented-button--active' : 'segmented-button'}>
              Sign in
            </button>
            <button type="button" onClick={() => setMode('register')} className={mode === 'register' ? 'segmented-button segmented-button--active' : 'segmented-button'}>
              Sign up
            </button>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="mt-8 grid gap-5">
          {mode === 'register' && (
            <label className="field">
              <span className="field__label">Display name</span>
              <input
                required
                value={form.name}
                onChange={(event) => updateField('name', event.target.value)}
                className="field__input"
                placeholder="Tarek"
              />
            </label>
          )}

          <label className="field">
            <span className="field__label">Email address</span>
            <input
              required
              type="email"
              value={form.email}
              onChange={(event) => updateField('email', event.target.value)}
              className="field__input"
              placeholder="name@example.com"
            />
          </label>

          <label className="field">
            <span className="field__label">Password</span>
            <input
              required
              type="password"
              value={form.password}
              onChange={(event) => updateField('password', event.target.value)}
              className="field__input"
              placeholder="At least one strong password"
            />
          </label>

          {error && (
            <div className="rounded-[1.5rem] border border-rose-500/25 bg-rose-500/10 px-4 py-3 text-sm text-rose-200">
              {error}
            </div>
          )}

          <button type="submit" disabled={submitting || authLoading} className="primary-button w-full justify-center">
            {submitting || authLoading
              ? 'Working...'
              : mode === 'login'
                ? 'Sign in to Imagyn'
                : 'Create account and start generating'}
          </button>
        </form>
      </div>
    </section>
  )
}
