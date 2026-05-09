import React from 'react'
import { Link, NavLink } from 'react-router-dom'

const navItems = [
  { to: '/', label: 'Studio' },
  { to: '/gallery', label: 'Gallery' },
  { to: '/history', label: 'History' },
  { to: '/buy-credits', label: 'Credits' },
  { to: '/profile', label: 'Profile' },
]

function BrandIcon() {
  return (
    <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-[linear-gradient(135deg,#6c63ff_0%,#8b5cf6_45%,#ec4899_100%)] shadow-[0_16px_36px_rgba(108,99,255,0.35)]">
      <svg viewBox="0 0 24 24" className="h-7 w-7 text-white" fill="currentColor" aria-hidden="true">
        <path d="M12 3.25a8.75 8.75 0 1 0 0 17.5h.75a2.75 2.75 0 0 0 2.75-2.75c0-.61-.2-1.18-.54-1.64a2.26 2.26 0 0 1 1.84-3.61H18A2.75 2.75 0 0 0 20.75 10 6.75 6.75 0 0 0 12 3.25Zm-4 6.25a1.25 1.25 0 1 1 0 2.5 1.25 1.25 0 0 1 0-2.5Zm3.5-2.5a1.25 1.25 0 1 1 0 2.5 1.25 1.25 0 0 1 0-2.5Zm3.5 2.5a1.25 1.25 0 1 1 0 2.5 1.25 1.25 0 0 1 0-2.5Zm-1 7.5a1.75 1.75 0 1 1 0-3.5h1.5a.75.75 0 0 0 .75-.75A5.25 5.25 0 1 0 12 18.25h2Z" />
      </svg>
    </div>
  )
}

export default function Header({ imageCount = 0 }) {
  return (
    <header className="sticky top-0 z-30 border-b border-white/8 bg-slate-950/80 backdrop-blur-xl">
      <div className="mx-auto flex w-full max-w-[1760px] items-center justify-between gap-4 px-4 py-4 sm:px-6 xl:px-8">
        <Link to="/" className="flex items-center gap-4">
          <BrandIcon />
          <div>
            <p className="bg-[linear-gradient(135deg,#5a8cff_0%,#8b5cf6_52%,#f472b6_100%)] bg-clip-text text-3xl font-semibold text-transparent">
              Imagyn Studio
            </p>
            <p className="text-xs uppercase tracking-[0.28em] text-slate-500">Imagyn Workspace</p>
          </div>
        </Link>

        <div className="hidden flex-1 items-center justify-center xl:flex">
          <div className="flex items-center gap-3 rounded-[24px] border border-emerald-400/25 bg-emerald-500/10 px-5 py-3 shadow-[0_12px_28px_rgba(16,185,129,0.18)]">
            <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-emerald-400/20 text-emerald-300">
              <svg viewBox="0 0 24 24" className="h-6 w-6" fill="currentColor" aria-hidden="true">
                <path d="M12 2a5 5 0 0 0-5 5v1.2A3.5 3.5 0 0 0 3.5 11v3A3.5 3.5 0 0 0 7 17.5h10a3.5 3.5 0 0 0 3.5-3.5v-3A3.5 3.5 0 0 0 17 8.2V7a5 5 0 0 0-5-5Zm-3 6V7a3 3 0 1 1 6 0v1H9Z" />
              </svg>
            </div>
            <div>
              <div className="text-lg font-semibold text-white">Stable Diffusion 1.5</div>
              <div className="flex items-center gap-2 text-sm text-emerald-300">
                <span className="h-2 w-2 rounded-full bg-emerald-400" />
                Ready
              </div>
            </div>
          </div>
        </div>

        <div className="hidden items-center gap-2 lg:flex">
          {navItems.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              className={({ isActive }) =>
                `rounded-full px-4 py-2 text-sm font-medium transition ${
                  isActive
                    ? 'bg-white/10 text-white shadow-[inset_0_0_0_1px_rgba(255,255,255,0.12)]'
                    : 'text-slate-400 hover:bg-white/5 hover:text-white'
                }`
              }
            >
              {item.label}
            </NavLink>
          ))}
        </div>

        <div className="flex items-center gap-3">
          <div className="hidden items-center gap-3 rounded-2xl border border-emerald-400/20 bg-emerald-500/8 px-4 py-3 md:flex">
            <span className="text-2xl leading-none text-emerald-300">⚡</span>
            <div>
              <div className="text-lg font-semibold text-emerald-300">{imageCount}</div>
              <div className="text-[11px] uppercase tracking-[0.2em] text-slate-500">Generated</div>
            </div>
          </div>

          <Link to="/settings" className="flex h-12 w-12 items-center justify-center rounded-2xl border border-white/10 bg-white/5 text-slate-200 transition hover:bg-white/10">
            <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="1.7" aria-hidden="true">
              <path d="M12 8.75A3.25 3.25 0 1 0 12 15.25 3.25 3.25 0 0 0 12 8.75Z" />
              <path d="M19.4 15a1 1 0 0 0 .2 1.1l.05.05a1 1 0 0 1 0 1.4l-1 1a1 1 0 0 1-1.4 0l-.05-.05a1 1 0 0 0-1.1-.2 1 1 0 0 0-.6.92V20a1 1 0 0 1-1 1h-1.5a1 1 0 0 1-1-1v-.08a1 1 0 0 0-.6-.92 1 1 0 0 0-1.1.2l-.05.05a1 1 0 0 1-1.4 0l-1-1a1 1 0 0 1 0-1.4l.05-.05a1 1 0 0 0 .2-1.1 1 1 0 0 0-.92-.6H4a1 1 0 0 1-1-1v-1.5a1 1 0 0 1 1-1h.08a1 1 0 0 0 .92-.6 1 1 0 0 0-.2-1.1l-.05-.05a1 1 0 0 1 0-1.4l1-1a1 1 0 0 1 1.4 0l.05.05a1 1 0 0 0 1.1.2 1 1 0 0 0 .6-.92V4a1 1 0 0 1 1-1h1.5a1 1 0 0 1 1 1v.08a1 1 0 0 0 .6.92 1 1 0 0 0 1.1-.2l.05-.05a1 1 0 0 1 1.4 0l1 1a1 1 0 0 1 0 1.4l-.05.05a1 1 0 0 0-.2 1.1 1 1 0 0 0 .92.6H20a1 1 0 0 1 1 1v1.5a1 1 0 0 1-1 1h-.08a1 1 0 0 0-.92.6Z" />
            </svg>
          </Link>

          <Link to="/profile" className="flex items-center gap-3 rounded-2xl border border-blue-400/25 bg-blue-500/10 px-4 py-3 text-white transition hover:bg-blue-500/15">
            <div className="flex h-9 w-9 items-center justify-center rounded-full bg-white text-slate-900">
              <svg viewBox="0 0 24 24" className="h-5 w-5" fill="currentColor" aria-hidden="true">
                <path d="M12 12a4.25 4.25 0 1 0 0-8.5 4.25 4.25 0 0 0 0 8.5Zm0 2c-4.42 0-8 2.01-8 4.5V20h16v-1.5c0-2.49-3.58-4.5-8-4.5Z" />
              </svg>
            </div>
            <div className="hidden sm:block">
              <div className="text-sm font-semibold">Guest</div>
              <div className="text-xs text-blue-100/70">Local session</div>
            </div>
          </Link>
        </div>
      </div>
    </header>
  )
}
