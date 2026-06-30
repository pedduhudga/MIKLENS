import { lazy, Suspense, useEffect } from 'react'
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { AppLayout } from '@/components/layout/AppLayout'
import { ProtectedRoute } from '@/components/auth/ProtectedRoute'
import { ToastProvider } from '@/components/ui/toast-provider'
import { useAuthListener } from '@/hooks/useAuth'
import { useUIStore } from '@/store/uiStore'
import { Loader2 } from 'lucide-react'

// Lazy retry helper to handle Vite chunk loading errors gracefully on new deployments
function lazyRetry<T extends React.ComponentType<any>>(
  componentImport: () => Promise<{ default: T }>
): React.LazyExoticComponent<T> {
  return lazy(async () => {
    try {
      return await componentImport()
    } catch (error) {
      console.error("Failed to load component chunk, forcing reload:", error)
      window.location.reload()
      return new Promise(() => {})
    }
  })
}

// Lazy loaded pages
const LoginPage = lazyRetry(() => import('@/pages/LoginPage'))
const DashboardPage = lazyRetry(() => import('@/pages/DashboardPage'))
const DataEntryPage = lazyRetry(() => import('@/pages/DataEntryPage'))
const AnalyticsPage = lazyRetry(() => import('@/pages/AnalyticsPage'))
const ReportsPage = lazyRetry(() => import('@/pages/ReportsPage'))
const ChartsPage = lazyRetry(() => import('@/pages/ChartsPage'))
const TimelinePage = lazyRetry(() => import('@/pages/TimelinePage'))
const AuditPage = lazyRetry(() => import('@/pages/AuditPage'))
const UsersPage = lazyRetry(() => import('@/pages/UsersPage'))
const SettingsPage = lazyRetry(() => import('@/pages/SettingsPage'))

const PageLoader = () => (
  <div className="flex items-center justify-center h-full min-h-[400px]">
    <Loader2 size={28} className="animate-spin text-primary" />
  </div>
)

function AppContent() {
  useAuthListener()
  const { theme } = useUIStore()

  useEffect(() => {
    const root = document.documentElement
    if (theme === 'dark') root.classList.add('dark')
    else if (theme === 'light') root.classList.remove('dark')
    else {
      const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches
      prefersDark ? root.classList.add('dark') : root.classList.remove('dark')
    }
  }, [theme])

  return (
    <Routes>
      {/* Public */}
      <Route
        path="/login"
        element={
          <Suspense fallback={<PageLoader />}>
            <LoginPage />
          </Suspense>
        }
      />

      {/* Protected */}
      <Route
        path="/"
        element={
          <ProtectedRoute>
            <AppLayout />
          </ProtectedRoute>
        }
      >
        <Route index element={<Navigate to="/dashboard" replace />} />
        <Route path="dashboard" element={<Suspense fallback={<PageLoader />}><DashboardPage /></Suspense>} />
        <Route path="entry" element={<Suspense fallback={<PageLoader />}><DataEntryPage /></Suspense>} />
        <Route path="analytics" element={<Suspense fallback={<PageLoader />}><AnalyticsPage /></Suspense>} />
        <Route path="reports" element={<Suspense fallback={<PageLoader />}><ReportsPage /></Suspense>} />
        <Route path="charts" element={<Suspense fallback={<PageLoader />}><ChartsPage /></Suspense>} />
        <Route path="timeline" element={<Suspense fallback={<PageLoader />}><TimelinePage /></Suspense>} />
        <Route path="audit" element={<Suspense fallback={<PageLoader />}><AuditPage /></Suspense>} />
        <Route path="users" element={<Suspense fallback={<PageLoader />}><UsersPage /></Suspense>} />
        <Route path="settings" element={<Suspense fallback={<PageLoader />}><SettingsPage /></Suspense>} />
      </Route>

      {/* Fallback */}
      <Route path="*" element={<Navigate to="/dashboard" replace />} />
    </Routes>
  )
}

export default function App() {
  return (
    <BrowserRouter>
      <ToastProvider>
        <AppContent />
      </ToastProvider>
    </BrowserRouter>
  )
}
