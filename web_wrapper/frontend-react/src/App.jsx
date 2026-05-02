import React, { startTransition, useEffect, useState } from 'react'
import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom'
import { apiRequest } from './api/client'
import Header from './components/Header'
import { useAuth } from './context/AuthContext'
import { useTheme } from './context/ThemeContext'
import BuyCredits from './pages/BuyCredits'
import GalleryPage from './pages/GalleryPage'
import History from './pages/History'
import Landing from './pages/Landing'
import Login from './pages/Login'
import Profile from './pages/Profile'
import Settings from './pages/Settings'
import Studio from './pages/Studio'

const DEFAULT_PREFERENCES = {
  model_name: '',
  negative_prompt: 'blurry, low quality, malformed hands, duplicate limbs, overexposed highlights',
  width: 768,
  height: 768,
  steps: 25,
  cfg_scale: 7,
  sampler: 'dpmpp_2m',
}

function readStoredPreferences() {
  try {
    const raw = localStorage.getItem('imagyn_preferences')
    return raw ? { ...DEFAULT_PREFERENCES, ...JSON.parse(raw) } : DEFAULT_PREFERENCES
  } catch (error) {
    return DEFAULT_PREFERENCES
  }
}

function activeJobIdsFromList(jobs = []) {
  return jobs
    .filter((job) => job.status === 'pending' || job.status === 'processing')
    .map((job) => job.id)
}

function LoadingScreen() {
  return (
    <div className="surface-card min-h-[320px] text-center">
      <p className="eyebrow">Preparing workspace</p>
      <h2 className="mt-4 text-3xl font-semibold text-[var(--text-strong)]">Restoring your session.</h2>
      <p className="mt-4 text-sm text-[var(--text-soft)]">Authenticating and pulling the latest jobs, gallery items, and settings.</p>
    </div>
  )
}

function ProtectedRoute({ authLoading, children, isAuthenticated }) {
  if (authLoading) {
    return <LoadingScreen />
  }

  return isAuthenticated ? children : <Navigate to="/login" replace />
}

function FlashNotice({ notice, onDismiss }) {
  if (!notice) {
    return null
  }

  return (
    <div className={notice.variant === 'error' ? 'notice notice--error' : 'notice'}>
      <div>
        <strong className="block text-[var(--text-strong)]">{notice.title}</strong>
        <span className="mt-1 block text-sm text-[var(--text-soft)]">{notice.message}</span>
      </div>
      <button type="button" className="ghost-button" onClick={onDismiss}>
        Dismiss
      </button>
    </div>
  )
}

export default function App() {
  const { authLoading, isAuthenticated, login, logout, refreshUser, register, token, user } = useAuth()
  const { setTheme, theme } = useTheme()

  const [defaultModel, setDefaultModel] = useState('')
  const [images, setImages] = useState([])
  const [jobs, setJobs] = useState([])
  const [models, setModels] = useState([])
  const [notice, setNotice] = useState(null)
  const [preferences, setPreferences] = useState(() => readStoredPreferences())
  const [systemStatus, setSystemStatus] = useState(null)
  const [workspaceLoading, setWorkspaceLoading] = useState(false)
  const [activeJobIds, setActiveJobIds] = useState([])

  useEffect(() => {
    try {
      localStorage.setItem('imagyn_preferences', JSON.stringify(preferences))
    } catch (error) {}
  }, [preferences])

  async function loadModels() {
    const payload = await apiRequest('/api/models')
    startTransition(() => {
      setModels(payload.models || [])
      setDefaultModel(payload.default_model || payload.models?.[0] || '')
      setPreferences((current) => ({
        ...current,
        model_name: current.model_name || payload.default_model || payload.models?.[0] || '',
      }))
    })
    return payload
  }

  async function loadSystemStatus() {
    const payload = await apiRequest('/api/system/status')
    setSystemStatus(payload)
    return payload
  }

  async function loadWorkspace({ silent = false } = {}) {
    if (!token) {
      startTransition(() => {
        setImages([])
        setJobs([])
        setActiveJobIds([])
      })
      return
    }

    if (!silent) {
      setWorkspaceLoading(true)
    }

    try {
      const [imagesPayload, jobsPayload] = await Promise.all([
        apiRequest('/api/user_images?limit=40', { token }),
        apiRequest('/api/jobs?limit=40', { token }),
      ])

      startTransition(() => {
        setImages(imagesPayload)
        setJobs(jobsPayload)
        setActiveJobIds(activeJobIdsFromList(jobsPayload))
      })
    } finally {
      if (!silent) {
        setWorkspaceLoading(false)
      }
    }
  }

  useEffect(() => {
    loadModels().catch(() => {})
    loadSystemStatus().catch(() => {})
  }, [])

  useEffect(() => {
    if (!token) {
      startTransition(() => {
        setImages([])
        setJobs([])
        setActiveJobIds([])
      })
      return
    }

    loadWorkspace().catch((error) => {
      setNotice({
        title: 'Workspace load failed',
        message: error.message,
        variant: 'error',
      })
    })
  }, [token])

  useEffect(() => {
    if (!token || !activeJobIds.length) {
      return
    }

    const interval = setInterval(async () => {
      try {
        const statuses = await Promise.all(
          activeJobIds.map((jobId) => apiRequest(`/api/jobs/${jobId}/status`, { token }))
        )

        const stillRunning = statuses
          .filter((job) => job.status === 'pending' || job.status === 'processing')
          .map((job) => job.job_id)

        setActiveJobIds(stillRunning)

        const completed = statuses.filter((job) => job.status === 'completed')
        const failed = statuses.filter((job) => job.status === 'failed')

        if (completed.length || failed.length) {
          await Promise.all([
            loadWorkspace({ silent: true }),
            refreshUser().catch(() => null),
          ])

          if (completed.length) {
            setNotice({
              title: 'Generation complete',
              message: `${completed.length} render${completed.length > 1 ? 's have' : ' has'} landed in your gallery.`,
            })
          }

          if (failed.length) {
            setNotice({
              title: 'A job needs attention',
              message: failed[0].error || 'One or more jobs failed while rendering.',
              variant: 'error',
            })
          }
        }
      } catch (error) {}
    }, 2500)

    return () => clearInterval(interval)
  }, [activeJobIds.join('|'), refreshUser, token])

  async function handleGenerate(payload) {
    const response = await apiRequest('/api/generate_image_async', {
      method: 'POST',
      token,
      body: payload,
    })

    startTransition(() => {
      setJobs((current) => [
        {
          id: response.job_id,
          prompt: payload.prompt,
          model_name: payload.model_name,
          status: response.status,
          created_at: new Date().toISOString(),
          gpu_time: null,
        },
        ...current,
      ])
      setActiveJobIds((current) => Array.from(new Set([response.job_id, ...current])))
    })

    await refreshUser().catch(() => null)

    setNotice({
      title: 'Generation queued',
      message: 'Your prompt has been sent to the GPU queue and will appear in the gallery when complete.',
    })

    return response
  }

  async function handleDeleteImage(imageId) {
    await apiRequest(`/api/images/${imageId}`, {
      method: 'DELETE',
      token,
    })

    startTransition(() => {
      setImages((current) => current.filter((image) => image.id !== imageId))
    })

    setNotice({
      title: 'Image removed',
      message: 'The selected render has been deleted from your gallery.',
    })
  }

  function handleLogout() {
    logout()
    setNotice({
      title: 'Signed out',
      message: 'Your session has been cleared from this browser.',
    })
  }

  return (
    <BrowserRouter>
      <div className="min-h-screen">
        <Header
          imageCount={images.length}
          jobCount={jobs.length}
          onLogout={handleLogout}
          systemStatus={systemStatus}
          user={user}
        />

        <main className="mx-auto flex w-full max-w-[1560px] flex-col gap-6 px-4 py-6 sm:px-6 xl:px-8">
          <FlashNotice notice={notice} onDismiss={() => setNotice(null)} />

          <Routes>
            <Route
              path="/"
              element={
                isAuthenticated ? (
                  <Studio
                    defaultModel={defaultModel}
                    images={images}
                    jobs={jobs}
                    models={models}
                    onGenerate={handleGenerate}
                    onPreferencesChange={setPreferences}
                    preferences={preferences}
                    systemStatus={systemStatus}
                    user={user}
                    workspaceLoading={workspaceLoading}
                  />
                ) : (
                  <Landing modelCount={models.length} systemStatus={systemStatus} />
                )
              }
            />
            <Route
              path="/login"
              element={
                isAuthenticated ? (
                  <Navigate to="/" replace />
                ) : (
                  <Login authLoading={authLoading} onLogin={login} onRegister={register} />
                )
              }
            />
            <Route
              path="/gallery"
              element={
                <ProtectedRoute authLoading={authLoading} isAuthenticated={isAuthenticated}>
                  <GalleryPage
                    images={images}
                    loading={workspaceLoading}
                    onDelete={handleDeleteImage}
                    onRefresh={() => loadWorkspace()}
                  />
                </ProtectedRoute>
              }
            />
            <Route
              path="/history"
              element={
                <ProtectedRoute authLoading={authLoading} isAuthenticated={isAuthenticated}>
                  <History jobs={jobs} loading={workspaceLoading} onRefresh={() => loadWorkspace()} />
                </ProtectedRoute>
              }
            />
            <Route
              path="/buy-credits"
              element={
                <ProtectedRoute authLoading={authLoading} isAuthenticated={isAuthenticated}>
                  <BuyCredits jobs={jobs} user={user} />
                </ProtectedRoute>
              }
            />
            <Route
              path="/profile"
              element={
                <ProtectedRoute authLoading={authLoading} isAuthenticated={isAuthenticated}>
                  <Profile images={images} jobs={jobs} user={user} />
                </ProtectedRoute>
              }
            />
            <Route
              path="/settings"
              element={
                <ProtectedRoute authLoading={authLoading} isAuthenticated={isAuthenticated}>
                  <Settings
                    defaultModel={defaultModel}
                    models={models}
                    onPreferencesChange={setPreferences}
                    onRefreshStatus={() => loadSystemStatus()}
                    preferences={preferences}
                    setTheme={setTheme}
                    systemStatus={systemStatus}
                    theme={theme}
                  />
                </ProtectedRoute>
              }
            />
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </main>
      </div>
    </BrowserRouter>
  )
}
