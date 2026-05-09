import React, { useCallback, useEffect, useMemo, useState } from 'react'
import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom'
import Header from './components/Header'
import Landing from './pages/Landing'
import Login from './pages/Login'
import Studio from './pages/Studio'
import GalleryPage from './pages/GalleryPage'
import History from './pages/History'
import BuyCredits from './pages/BuyCredits'
import Profile from './pages/Profile'
import Settings from './pages/Settings'
import { ThemeProvider } from './context/ThemeContext'
import { AuthProvider, useAuth } from './context/AuthContext'
import { apiRequest } from './api/client'

const defaultPreferences = {
  negative_prompt: '',
  model_name: '',
  width: 768,
  height: 768,
  steps: 25,
  cfg_scale: 7,
  sampler: 'dpmpp_2m',
  seed: -1,
}

function wait(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms))
}

function LoadingState({ label }) {
  return (
    <div className="mx-auto max-w-6xl px-4 py-10 sm:px-6 xl:px-8">
      <div className="surface-card text-center">
        <p className="eyebrow">Imagyn workspace</p>
        <h2 className="mt-3 text-3xl font-semibold text-[var(--text-strong)]">{label}</h2>
      </div>
    </div>
  )
}

function ProtectedRoute({ children }) {
  const { authLoading, isAuthenticated } = useAuth()

  if (authLoading) {
    return <LoadingState label="Restoring your session..." />
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />
  }

  return children
}

function AppShell() {
  const { authLoading, isAuthenticated, logout, refreshUser, token, user } = useAuth()
  const [images, setImages] = useState([])
  const [jobs, setJobs] = useState([])
  const [models, setModels] = useState([])
  const [workspaceLoading, setWorkspaceLoading] = useState(false)
  const [systemStatus, setSystemStatus] = useState({ backend_online: true, comfyui_online: false })
  const [notice, setNotice] = useState('')
  const [preferences, setPreferences] = useState(defaultPreferences)

  const defaultModel = useMemo(() => models[0] || '', [models])

  const loadWorkspace = useCallback(async () => {
    if (!token) {
      return
    }

    setWorkspaceLoading(true)
    try {
      const [imagesPayload, jobsPayload, modelsPayload, statusPayload] = await Promise.all([
        apiRequest('/api/user_images?limit=80', { token }),
        apiRequest('/api/jobs?limit=80', { token }),
        apiRequest('/api/models', { token }),
        apiRequest('/api/system/status', { token }),
      ])

      setImages(Array.isArray(imagesPayload) ? imagesPayload : [])
      setJobs(Array.isArray(jobsPayload) ? jobsPayload : [])
      setModels(Array.isArray(modelsPayload?.models) ? modelsPayload.models : [])

      if (modelsPayload?.default_model) {
        setPreferences((current) => ({
          ...current,
          model_name: current.model_name || modelsPayload.default_model,
        }))
      }

      setSystemStatus({
        backend_online: Boolean(statusPayload?.backend_online ?? true),
        comfyui_online: Boolean(statusPayload?.comfyui_online),
      })
    } catch (error) {
      setNotice(error.message || 'Failed to load workspace data.')
    } finally {
      setWorkspaceLoading(false)
    }
  }, [token])

  useEffect(() => {
    if (!token) {
      setImages([])
      setJobs([])
      setModels([])
      setSystemStatus({ backend_online: true, comfyui_online: false })
      return
    }
    loadWorkspace()
  }, [loadWorkspace, token])

  useEffect(() => {
    if (!notice) {
      return undefined
    }
    const timer = setTimeout(() => setNotice(''), 5000)
    return () => clearTimeout(timer)
  }, [notice])

  const monitorJob = useCallback(async (jobId) => {
    if (!token || !jobId) {
      return
    }

    for (let attempt = 0; attempt < 200; attempt += 1) {
      await wait(2000)
      try {
        const statusPayload = await apiRequest(`/api/jobs/${jobId}/status`, { token })
        setJobs((current) => current.map((job) => (job.id === jobId ? { ...job, ...statusPayload } : job)))

        if (statusPayload.status === 'completed' || statusPayload.status === 'failed') {
          await Promise.all([loadWorkspace(), refreshUser(token)])
          if (statusPayload.status === 'completed') {
            setNotice('Image generation completed.')
          } else {
            setNotice(statusPayload.error || 'Generation failed.')
          }
          return
        }
      } catch (error) {
        setNotice(error.message || 'Failed to sync job status.')
        return
      }
    }
  }, [loadWorkspace, refreshUser, token])

  const handleGenerate = useCallback(async (payload) => {
    if (!token) {
      throw new Error('Please sign in before generating images.')
    }

    const response = await apiRequest('/api/generate_image_async', {
      method: 'POST',
      token,
      body: payload,
    })

    const optimisticJob = {
      id: response.job_id,
      prompt: payload.prompt,
      model_name: payload.model_name,
      status: 'pending',
      created_at: new Date().toISOString(),
    }

    setJobs((current) => [optimisticJob, ...current])
    monitorJob(response.job_id)
    refreshUser(token).catch(() => {})
  }, [monitorJob, refreshUser, token])

  const handleDeleteImage = useCallback(async (imageId) => {
    if (!token) {
      return
    }

    try {
      await apiRequest(`/api/images/${imageId}`, {
        method: 'DELETE',
        token,
      })
      setImages((current) => current.filter((image) => image.id !== imageId))
      setNotice('Image deleted.')
    } catch (error) {
      setNotice(error.message || 'Unable to delete image.')
    }
  }, [token])

  const activeJobs = jobs.filter((job) => job.status === 'pending' || job.status === 'processing')

  return (
    <div className="app-shell min-h-screen">
      <Header
        isAuthenticated={isAuthenticated}
        queueCount={activeJobs.length}
        systemStatus={systemStatus}
        user={user}
        onLogout={logout}
      />

      {notice && (
        <div className="mx-auto max-w-6xl px-4 pt-4 sm:px-6 xl:px-8">
          <div className="rounded-2xl border border-[var(--accent-border)] bg-[var(--accent-soft)] px-4 py-3 text-sm text-[var(--text-strong)]">
            {notice}
          </div>
        </div>
      )}

      <main className="mx-auto w-full max-w-6xl px-4 pb-12 pt-6 sm:px-6 xl:px-8">
        <Routes>
          <Route path="/" element={isAuthenticated ? <Navigate to="/studio" replace /> : <Landing />} />
          <Route path="/login" element={isAuthenticated ? <Navigate to="/studio" replace /> : <Login />} />
          <Route
            path="/studio"
            element={(
              <ProtectedRoute>
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
              </ProtectedRoute>
            )}
          />
          <Route
            path="/gallery"
            element={(
              <ProtectedRoute>
                <GalleryPage
                  images={images}
                  loading={workspaceLoading}
                  onDelete={handleDeleteImage}
                  onRefresh={loadWorkspace}
                />
              </ProtectedRoute>
            )}
          />
          <Route
            path="/history"
            element={(
              <ProtectedRoute>
                <History jobs={jobs} loading={workspaceLoading} onRefresh={loadWorkspace} />
              </ProtectedRoute>
            )}
          />
          <Route
            path="/credits"
            element={(
              <ProtectedRoute>
                <BuyCredits user={user} />
              </ProtectedRoute>
            )}
          />
          <Route
            path="/profile"
            element={(
              <ProtectedRoute>
                <Profile images={images} jobs={jobs} user={user} />
              </ProtectedRoute>
            )}
          />
          <Route
            path="/settings"
            element={(
              <ProtectedRoute>
                <Settings
                  preferences={preferences}
                  onPreferencesChange={setPreferences}
                  systemStatus={systemStatus}
                />
              </ProtectedRoute>
            )}
          />
          <Route path="*" element={<Navigate to={isAuthenticated ? '/studio' : '/'} replace />} />
        </Routes>
      </main>

      {authLoading && <LoadingState label="Preparing workspace..." />}
    </div>
  )
}

export default function App() {
  return (
    <BrowserRouter>
      <ThemeProvider>
        <AuthProvider>
          <AppShell />
        </AuthProvider>
      </ThemeProvider>
    </BrowserRouter>
  )
}
