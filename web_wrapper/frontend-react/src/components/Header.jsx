import React from 'react'
import { Link, NavLink } from 'react-router-dom'
import ThemeToggle from './ThemeToggle'

function BrandMark() {
  return (
    <div className="brand-mark">
      <svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
        <path d="M11.9 2.4c-5.2 0-9.5 4.2-9.5 9.4 0 5 4 9.2 8.9 9.4h.9c1.5 0 2.8-1.2 2.8-2.8 0-.6-.2-1.2-.6-1.6a2.3 2.3 0 0 1 1.8-3.7h1.1c1.5 0 2.8-1.2 2.8-2.8 0-4.3-3.6-7.8-8.2-7.9Zm-3.7 7a1.2 1.2 0 1 1 0 2.4 1.2 1.2 0 0 1 0-2.4Zm3.3-2.4a1.2 1.2 0 1 1 0 2.4 1.2 1.2 0 0 1 0-2.4Zm3.3 2.4a1.2 1.2 0 1 1 0 2.4 1.2 1.2 0 0 1 0-2.4Z" />
      </svg>
    </div>
  )
}

export default function Header({
  isAuthenticated,
  onLogout,
  queueCount = 0,
  systemStatus,
  user,
}) {
  const navigationItems = [
    { to: '/studio', label: 'Studio' },
    { to: '/library', label: 'Prompt Library' },
    { to: '/gallery', label: 'Gallery' },
    { to: '/pricing', label: 'Pricing' },
    { to: '/profile', label: 'Profile' },
  ]

  if (user?.role === 'admin') {
    navigationItems.push({ to: '/admin', label: 'Admin' })
  }

  return (
    <header className="topbar">
      <div className="topbar__inner">
        <Link to={isAuthenticated ? '/studio' : '/'} className="brand">
          <BrandMark />
          <div>
            <p className="brand__title">Imagyn</p>
          </div>
        </Link>

        {isAuthenticated && (
          <nav className="nav-row">
            {navigationItems.map((item) => (
              <NavLink
                key={item.to}
                to={item.to}
                className={({ isActive }) => (isActive ? 'nav-pill nav-pill--active' : 'nav-pill')}
              >
                {item.label}
              </NavLink>
            ))}
          </nav>
        )}

        <div className="topbar__actions">
          

          

          <ThemeToggle />

          {isAuthenticated ? (
            <>
              <Link to="/profile" className="user-chip">
                <span className="user-chip__avatar">{(user?.name || 'U').charAt(0).toUpperCase()}</span>
                <span>{user?.name || 'Account'}</span>
              </Link>
              <button type="button" onClick={onLogout} className="ghost-button">
                Sign out
              </button>
            </>
          ) : (
            <Link to="/login" className="primary-button">
              Sign in
            </Link>
          )}
        </div>
      </div>
    </header>
  )
}
