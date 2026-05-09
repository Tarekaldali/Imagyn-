import React, { useCallback, useEffect, useMemo, useState } from 'react'
import { BrowserRouter, Navigate, Route, Routes, useNavigate } from 'react-router-dom'
import Header from './components/Header'
import ToastStack from './components/ToastStack'
import ConfirmDialog from './components/ConfirmDialog'
import Landing from './pages/Landing'
import Login from './pages/Login'
import Studio from './pages/Studio'
import GalleryPage from './pages/GalleryPage'
import BuyCredits from './pages/BuyCredits'
import Checkout from './pages/Checkout'
import Profile from './pages/Profile'
import Settings from './pages/Settings'
import PromptLibrary from './pages/PromptLibrary'
import AdminDashboard from './pages/AdminDashboard'
import { ThemeProvider } from './context/ThemeContext'
import { AuthProvider, useAuth } from './context/AuthContext'
import { apiRequest } from './api/client'

const PLANS_STORAGE_KEY = 'imagyn_pricing_plans'

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

const defaultPlans = [
  {
    id: 'starter',
    name: 'Starter Access',
    badge: 'Launch tier',
    price: 9,
    credits: 120,
    description: 'A compact credit pack for testing ideas and building daily visual concepts.',
    features: ['Fast onboarding credits', 'Private gallery storage', 'Great for light exploration'],
  },
  {
    id: 'pro',
    name: 'Pro Studio',
    badge: 'Most popular',
    price: 29,
    credits: 450,
    description: 'Balanced pricing for creators who generate often and need room to iterate.',
    features: ['Better value per render', 'Ideal for campaigns and revisions', 'Recommended for serious use'],
    highlight: true,
  },
  {
    id: 'scale',
    name: 'Scale Team',
    badge: 'Heavy usage',
    price: 79,
    credits: 1400,
    description: 'High-volume credit pool for agencies, teams, and production-heavy workflows.',
    features: ['Largest credit reserve', 'Strongest per-credit value', 'Fits team-level output'],
  },
]

function readStoredPlans() {
  try {
    const raw = localStorage.getItem(PLANS_STORAGE_KEY)
    return raw ? JSON.parse(raw) : defaultPlans
  } catch (error) {
    return defaultPlans
  }
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

function AdminRoute({ children }) {
  const { user } = useAuth()

  if (user?.role !== 'admin') {
    return <Navigate to="/studio" replace />
  }

  return children
}

function AppShell() {
  const navigate = useNavigate()
  const { authLoading, isAuthenticated, logout, refreshUser, token, user } = useAuth()
  const [images, setImages] = useState([])
  const [jobs, setJobs] = useState([])
  const [models, setModels] = useState([])
  const [workspaceLoading, setWorkspaceLoading] = useState(false)
  const [systemStatus, setSystemStatus] = useState({ backend_online: true, comfyui_online: false })
  const [preferences, setPreferences] = useState(defaultPreferences)
  const [toasts, setToasts] = useState([])
  const [dialog, setDialog] = useState({ open: false })
  const [plans, setPlans] = useState(() => readStoredPlans())
  const [adminOverview, setAdminOverview] = useState(null)
  const [studioPrompt, setStudioPrompt] = useState('')

  const defaultModel = useMemo(() => models[0] || '', [models])

  useEffect(() => {
    try {
      localStorage.setItem(PLANS_STORAGE_KEY, JSON.stringify(plans))
    } catch (error) {}
  }, [plans])

  const dismissToast = useCallback((id) => {
    setToasts((current) => current.filter((toast) => toast.id !== id))
  }, [])

  const pushToast = useCallback((message, type = 'info', title = 'Notice') => {
    const nextToast = {
      id: `${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
      title,
      message,
      type,
    }
    setToasts((current) => [...current, nextToast])
  }, [])

  const requestConfirm = useCallback((options) => new Promise((resolve) => {
    setDialog({
      open: true,
      ...options,
      onResolve: resolve,
    })
  }), [])

  const closeDialog = useCallback((approved) => {
    setDialog((current) => {
      current.onResolve?.(approved)
      return { open: false }
    })
  }, [])

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
      pushToast(error.message || 'Failed to load workspace data.', 'warning', 'Workspace')
    } finally {
      setWorkspaceLoading(false)
    }
  }, [pushToast, token])

  const loadPublicStatus = useCallback(async () => {
    try {
      const statusPayload = await apiRequest('/api/system/status')
      setSystemStatus({
        backend_online: Boolean(statusPayload?.backend_online ?? true),
        comfyui_online: Boolean(statusPayload?.comfyui_online),
      })
    } catch (error) {
      setSystemStatus({ backend_online: true, comfyui_online: false })
    }
  }, [])

  const loadAdminOverview = useCallback(async () => {
    if (!token || user?.role !== 'admin') {
      setAdminOverview(null)
      return
    }

    try {
      const payload = await apiRequest('/api/admin/overview', { token })
      setAdminOverview(payload)
    } catch (error) {
      pushToast(error.message || 'Failed to load admin overview.', 'warning', 'Admin')
    }
  }, [pushToast, token, user?.role])

  useEffect(() => {
    if (!token) {
      setImages([])
      setJobs([])
      setModels([])
      setAdminOverview(null)
      loadPublicStatus()
      return
    }

    loadWorkspace()
  }, [loadPublicStatus, loadWorkspace, token])

  useEffect(() => {
    if (token && user?.role === 'admin') {
      loadAdminOverview()
    }
  }, [loadAdminOverview, token, user?.role])

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
          await Promise.all([loadWorkspace(), refreshUser(token), loadAdminOverview()])
          if (statusPayload.status === 'completed') {
            pushToast('Image generation completed and saved to your gallery.', 'success', 'Render complete')
          } else {
            pushToast(statusPayload.error || 'Generation failed.', 'warning', 'Render failed')
          }
          return
        }
      } catch (error) {
        pushToast(error.message || 'Failed to sync job status.', 'warning', 'Queue sync')
        return
      }
    }
  }, [loadAdminOverview, loadWorkspace, pushToast, refreshUser, token])

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
    pushToast('Generation queued on the GPU backend.', 'info', 'Queued')
    monitorJob(response.job_id)
    refreshUser(token).catch(() => {})
  }, [monitorJob, pushToast, refreshUser, token])

  const handleDeleteImage = useCallback(async (imageId) => {
    if (!token) {
      return
    }

    const approved = await requestConfirm({
      eyebrow: 'Delete image',
      title: 'Remove this image from your gallery?',
      message: 'The image record and stored asset will be removed for this account.',
      confirmLabel: 'Delete image',
    })

    if (!approved) {
      return
    }

    try {
      await apiRequest(`/api/images/${imageId}`, {
        method: 'DELETE',
        token,
      })
      setImages((current) => current.filter((image) => image.id !== imageId))
      pushToast('Image deleted successfully.', 'success', 'Gallery updated')
      loadAdminOverview()
    } catch (error) {
      pushToast(error.message || 'Unable to delete image.', 'warning', 'Delete failed')
    }
  }, [loadAdminOverview, pushToast, requestConfirm, token])

  const handleUsePrompt = useCallback((prompt) => {
    setStudioPrompt(prompt)
    pushToast('Prompt moved into the Studio composer.', 'success', 'Prompt ready')
    navigate('/studio')
  }, [navigate, pushToast])

  const handlePlanUpdate = useCallback((planId, patch) => {
    setPlans((current) => current.map((plan) => (plan.id === planId ? { ...plan, ...patch } : plan)))
  }, [])

  const handlePlanCreate = useCallback((plan) => {
    setPlans((current) => [...current, plan])
  }, [])

  const handlePurchase = useCallback(async (planId) => {
    if (!token) {
      pushToast('Please sign in to complete purchases.', 'warning', 'Billing')
      return
    }

    try {
      await apiRequest('/api/checkout', { method: 'POST', token, body: { plan_id: planId } })
      await refreshUser(token)
      pushToast('Purchase completed. Welcome!', 'success', 'Billing')
    } catch (error) {
      // Fallback / simulate
      pushToast(error.message || 'Purchase failed. Please try again later.', 'warning', 'Billing')
    }
  }, [pushToast, refreshUser, token])

  const handleUpdateUser = useCallback(async (patch) => {
    if (!token) {
      pushToast('Please sign in to update your profile.', 'warning', 'Profile')
      return
    }

    try {
      await apiRequest('/api/auth/update', { method: 'POST', token, body: patch })
      await refreshUser(token)
      pushToast('Profile updated.', 'success', 'Profile')
    } catch (error) {
      pushToast(error.message || 'Unable to update profile on the server.', 'warning', 'Profile')
    }
  }, [pushToast, refreshUser, token])

  const handleChangePassword = useCallback(async ({ oldPassword, newPassword }) => {
    if (!token) {
      pushToast('Please sign in to change your password.', 'warning', 'Profile')
      return
    }

    try {
      await apiRequest('/api/auth/change_password', { method: 'POST', token, body: { old_password: oldPassword, new_password: newPassword } })
      pushToast('Password changed successfully.', 'success', 'Profile')
    } catch (error) {
      pushToast(error.message || 'Unable to change password.', 'warning', 'Profile')
    }
  }, [pushToast, token])

  const handleUpdateBilling = useCallback(async (billing) => {
    if (!token) {
      pushToast('Please sign in to update billing.', 'warning', 'Billing')
      return
    }

    try {
      await apiRequest('/api/billing', { method: 'POST', token, body: billing })
      await refreshUser(token)
      pushToast('Billing updated.', 'success', 'Billing')
    } catch (error) {
      pushToast(error.message || 'Unable to update billing.', 'warning', 'Billing')
    }
  }, [pushToast, refreshUser, token])

  const handlePlanDelete = useCallback((planId) => {
    setPlans((current) => current.filter((plan) => plan.id !== planId))
  }, [])

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

      <ToastStack toasts={toasts} onDismiss={dismissToast} />
      <ConfirmDialog dialog={dialog} onCancel={() => closeDialog(false)} onConfirm={() => closeDialog(true)} />

      <main className="mx-auto w-full max-w-[1440px] px-4 pb-12 pt-6 sm:px-6 xl:px-8">
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
                  injectedPrompt={studioPrompt}
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
            path="/library"
            element={(
              <ProtectedRoute>
                <PromptLibrary onUsePrompt={handleUsePrompt} onToast={pushToast} />
              </ProtectedRoute>
            )}
          />
          <Route path="/history" element={<Navigate to="/library" replace />} />
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
            path="/pricing"
            element={(
              <ProtectedRoute>
                <BuyCredits plans={plans} user={user} />
              </ProtectedRoute>
            )}
          />
          <Route
            path="/checkout"
            element={(
              <ProtectedRoute>
                <Checkout onPurchase={handlePurchase} plans={plans} />
              </ProtectedRoute>
            )}
          />
          <Route
            path="/profile"
            element={(
              <ProtectedRoute>
                <Profile
                  images={images}
                  jobs={jobs}
                  user={user}
                  onUpdateUser={handleUpdateUser}
                  onChangePassword={handleChangePassword}
                  onUpdateBilling={handleUpdateBilling}
                  onToast={pushToast}
                />
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
          <Route
            path="/admin"
            element={(
              <ProtectedRoute>
                <AdminRoute>
                  <AdminDashboard
                    adminOverview={adminOverview}
                    jobs={jobs}
                    onDeletePlan={handlePlanDelete}
                    onRefresh={loadAdminOverview}
                    onToast={pushToast}
                    onUpdatePlan={handlePlanUpdate}
                    plans={plans}
                    onCreatePlan={handlePlanCreate}
                    requestConfirm={requestConfirm}
                  />
                </AdminRoute>
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
