import React from 'react'
import { useTheme } from '../context/ThemeContext'

export default function ThemeToggle() {
  const { theme, toggleTheme } = useTheme()
  const isDark = theme === 'dark'

  return (
    <button type="button" onClick={toggleTheme} className="icon-button" aria-label="Toggle theme">
      {isDark ? (
        <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="1.7">
          <path d="M12 3v2.2M12 18.8V21M4.93 4.93l1.56 1.56M17.5 17.5l1.57 1.57M3 12h2.2M18.8 12H21M4.93 19.07l1.56-1.56M17.5 6.5l1.57-1.57" />
          <circle cx="12" cy="12" r="4.25" />
        </svg>
      ) : (
        <svg viewBox="0 0 24 24" className="h-5 w-5" fill="currentColor">
          <path d="M20.7 14.2A8.75 8.75 0 0 1 9.8 3.3a.75.75 0 0 0-.95-.95A10.25 10.25 0 1 0 21.65 15.15a.75.75 0 0 0-.95-.95Z" />
        </svg>
      )}
    </button>
  )
}
