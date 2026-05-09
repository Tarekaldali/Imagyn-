import React, { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'

export default function Login() {
  const navigate = useNavigate()
  const { login, register } = useAuth()

  const [mode, setMode] = useState('signin')
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  async function handleSubmit(event) {
    event.preventDefault()
    setError('')

    if (!email.trim() || !password.trim()) {
      setError('Email and password are required.')
      return
    }

    if (mode === 'signup') {
      if (!name.trim()) {
        setError('Name is required for sign up.')
        return
      }
      if (password !== confirmPassword) {
        setError('Password confirmation does not match.')
        return
      }
    }

    setLoading(true)
    try {
      if (mode === 'signin') {
        await login({ email: email.trim(), password })
      } else {
        await register({ name: name.trim(), email: email.trim(), password })
      }
      navigate('/studio')
    } catch (requestError) {
      setError(requestError.message || 'Authentication failed.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <section className="mx-auto grid max-w-5xl gap-6 lg:grid-cols-[1fr_1fr]">
      <article className="hero-panel">
        <p className="eyebrow">Account access</p>
        <h1 className="hero-title !text-[clamp(2.2rem,3vw,3.8rem)]">Enter your workspace securely.</h1>
        <p className="hero-copy">
          Sign in to manage your private gallery and job history, or create a new account to start generating with starter credits.
        </p>
        <div className="mt-6 grid gap-3 sm:grid-cols-2">
          <div className="stat-tile">
            <div className="stat-tile__value">100</div>
            <div className="stat-tile__label">starter credits</div>
          </div>
          <div className="stat-tile">
            <div className="stat-tile__value">GPU</div>
            <div className="stat-tile__label">backed renders</div>
          </div>
        </div>
      </article>

      <article className="surface-card">
        <div className="inline-flex rounded-full border border-[var(--border-soft)] bg-[var(--panel-muted)] p-1">
          <button type="button" onClick={() => setMode('signin')} className={mode === 'signin' ? 'tab-button tab-button--active' : 'tab-button'}>
            Sign in
          </button>
          <button type="button" onClick={() => setMode('signup')} className={mode === 'signup' ? 'tab-button tab-button--active' : 'tab-button'}>
            Create account
          </button>
        </div>

        <form onSubmit={handleSubmit} className="mt-6 space-y-4">
          {mode === 'signup' && (
            <label className="field">
              <span className="field__label">Name</span>
              <input
                value={name}
                onChange={(event) => setName(event.target.value)}
                className="field__input"
                placeholder="Your display name"
              />
            </label>
          )}

          <label className="field">
            <span className="field__label">Email</span>
            <input
              type="email"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              className="field__input"
              placeholder="name@email.com"
            />
          </label>

          <label className="field">
            <span className="field__label">Password</span>
            <input
              type="password"
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              className="field__input"
              placeholder="Your password"
            />
          </label>

          {mode === 'signup' && (
            <label className="field">
              <span className="field__label">Confirm password</span>
              <input
                type="password"
                value={confirmPassword}
                onChange={(event) => setConfirmPassword(event.target.value)}
                className="field__input"
                placeholder="Repeat password"
              />
            </label>
          )}

          {error && (
            <div className="rounded-2xl border border-rose-500/35 bg-rose-500/10 px-4 py-3 text-sm text-rose-200">
              {error}
            </div>
          )}

          <button type="submit" disabled={loading} className="primary-button w-full justify-center">
            {loading ? 'Processing...' : mode === 'signin' ? 'Sign in' : 'Create account'}
          </button>
        </form>

        <p className="mt-5 text-sm text-[var(--text-soft)]">
          Need to inspect backend endpoints first? <Link to="/" className="link-inline">Return to landing</Link>
        </p>
      </article>
    </section>
  )
}
