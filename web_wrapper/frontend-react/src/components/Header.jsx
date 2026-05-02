import React from 'react'
import { Link, NavLink } from 'react-router-dom'
import ThemeToggle from './ThemeToggle'

const navItems = [
  { to: '/', label: 'Home' },
  { to: '/gallery', label: 'Gallery' },
  { to: '/history', label: 'History' },
  { to: '/buy-credits', label: 'Credits' },
  { to: '/settings', label: 'Settings' },
]

function BrandMark() {
  return (
    <div className="flex items-center gap-4">
      <div className="flex h-12 w-12 items-center justify-center rounded-[1.25rem] bg-[linear-gradient(145deg,#0f766e_0%,#18b29c_55%,#f59e0b_100%)] text-white shadow-[0_18px_35px_rgba(15,118,110,0.25)]">
        <svg viewBox="0 0 24 24" className="h-6 w-6" fill="none" stroke="currentColor" strokeWidth="1.8">
          <path d="M4 16.25 12 4l8 12.25" />
          <path d="M7.75 14h8.5" />
          <path d="M9.5 19.25h5" />
        </svg>
      </div>
      <div>
        <p className="text-lg font-semibold tracking-[0.08em] text-[var(--text-strong)]">Imagyn</p>
        <p className="text-[11px] uppercase tracking-[0.28em] text-[var(--text-soft)]">GPU Studio</p>
      </div>
    </div>
  )
}

function StatusBadge({ systemStatus }) {
  const comfyOnline = systemStatus?.comfyui_online

  return (
    <div className="hidden items-center gap-3 rounded-full border border-[var(--border-strong)] bg-[var(--panel-strong)] px-4 py-2.5 lg:flex">
      <span
        className={`h-2.5 w-2.5 rounded-full ${
          comfyOnline
            ? 'bg-emerald-500 shadow-[0_0_12px_rgba(16,185,129,0.8)]'
            : 'bg-amber-500 shadow-[0_0_12px_rgba(245,158,11,0.55)]'
        }`}
      />
      <div className="leading-tight">
        <div className="text-sm font-semibold text-[var(--text-strong)]">
          {comfyOnline ? 'ComfyUI Online' : 'Waiting For GPU Backend'}
        </div>
        <div className="text-[11px] uppercase tracking-[0.22em] text-[var(--text-soft)]">
          {systemStatus?.default_model || 'Model status pending'}
        </div>
      </div>
    </div>
  )
}

export default function Header({
  imageCount = 0,
  jobCount = 0,
  user,
  onLogout,
  systemStatus,
}) {
  return (
    <header className="sticky top-0 z-40 border-b border-[var(--border-soft)] bg-[color:var(--app-chrome)]/90 backdrop-blur-2xl">
      <div className="mx-auto flex w-full max-w-[1560px] flex-col gap-4 px-4 py-4 sm:px-6 xl:px-8">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <Link to="/" className="flex items-center gap-4">
            <BrandMark />
          </Link>

          <StatusBadge systemStatus={systemStatus} />

          <div className="flex items-center gap-2 sm:gap-3">
            <div className="metric-pill hidden sm:flex">
              <span className="metric-pill__value">{imageCount}</span>
              <span className="metric-pill__label">renders</span>
            </div>
            <div className="metric-pill hidden md:flex">
              <span className="metric-pill__value">{jobCount}</span>
              <span className="metric-pill__label">jobs</span>
            </div>
            <ThemeToggle />
            {user ? (
              <div className="flex items-center gap-2">
                <Link to="/profile" className="profile-chip">
                  <span className="profile-chip__avatar">{user.name?.slice(0, 1)?.toUpperCase() || 'U'}</span>
                  <span className="hidden text-left sm:block">
                    <span className="block text-sm font-semibold text-[var(--text-strong)]">{user.name}</span>
                    <span className="block text-[11px] uppercase tracking-[0.22em] text-[var(--text-soft)]">
                      {user.credits} credits
                    </span>
                  </span>
                </Link>
                <button type="button" onClick={onLogout} className="ghost-button">
                  Sign out
                </button>
              </div>
            ) : (
              <Link to="/login" className="primary-button">
                Sign in
              </Link>
            )}
          </div>
        </div>

        <nav className="flex flex-wrap items-center gap-2">
          {navItems.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              className={({ isActive }) => (isActive ? 'nav-chip nav-chip--active' : 'nav-chip')}
            >
              {item.label}
            </NavLink>
          ))}
        </nav>
      </div>
    </header>
  )
}
