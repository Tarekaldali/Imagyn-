import React, { createContext, useContext, useEffect, useState } from 'react'
import { apiRequest } from '../api/client'

const STORAGE_KEY = 'imagyn_session'
const AuthContext = createContext(null)

function readStoredSession() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    return raw ? JSON.parse(raw) : null
  } catch (error) {
    return null
  }
}

export function AuthProvider({ children }) {
  const [session, setSession] = useState(() => readStoredSession())
  const [authLoading, setAuthLoading] = useState(() => Boolean(readStoredSession()?.accessToken))

  const token = session?.accessToken || ''
  const user = session?.user || null
  const isAuthenticated = Boolean(token && user)

  useEffect(() => {
    try {
      if (session) {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(session))
      } else {
        localStorage.removeItem(STORAGE_KEY)
      }
    } catch (error) {}
  }, [session])

  useEffect(() => {
    let cancelled = false

    async function bootstrap() {
      if (!token) {
        setAuthLoading(false)
        return
      }

      try {
        const payload = await apiRequest('/api/auth/me', { token })
        if (!cancelled) {
          setSession((current) => current ? { ...current, user: payload.user } : null)
        }
      } catch (error) {
        if (!cancelled) {
          setSession(null)
        }
      } finally {
        if (!cancelled) {
          setAuthLoading(false)
        }
      }
    }

    bootstrap()

    return () => {
      cancelled = true
    }
  }, [token])

  async function applyAuth(path, body) {
    const payload = await apiRequest(path, {
      method: 'POST',
      body,
    })

    setSession({
      accessToken: payload.access_token,
      refreshToken: payload.refresh_token,
      user: payload.user,
    })

    return payload
  }

  async function login(credentials) {
    return applyAuth('/api/auth/login', credentials)
  }

  async function register(details) {
    return applyAuth('/api/auth/register', details)
  }

  async function refreshUser(currentToken = token) {
    if (!currentToken) {
      return null
    }

    const payload = await apiRequest('/api/auth/me', { token: currentToken })
    setSession((current) => current ? { ...current, user: payload.user } : null)
    return payload.user
  }

  function logout() {
    setSession(null)
    setAuthLoading(false)
  }

  return (
    <AuthContext.Provider
      value={{
        authLoading,
        isAuthenticated,
        login,
        logout,
        refreshUser,
        register,
        token,
        user,
      }}
    >
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (!context) {
    throw new Error('useAuth must be used within AuthProvider')
  }
  return context
}
