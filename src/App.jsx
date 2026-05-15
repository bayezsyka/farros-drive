import { Navigate, Outlet, Route, Routes } from 'react-router-dom'
import AppShell from './components/layout/AppShell'
import { useDriveStore } from './hooks/useDriveStore'
import Dashboard from './pages/Dashboard'
import Files from './pages/Files'
import Login from './pages/Login'
import PublicShare from './pages/PublicShare'
import Recent from './pages/Recent'
import Settings from './pages/Settings'
import Shared from './pages/Shared'
import Trash from './pages/Trash'

function FullscreenState({ message }) {
  return (
    <div className="flex min-h-screen items-center justify-center px-6">
      <div className="panel-surface w-full max-w-md rounded-[32px] px-8 py-10 text-center">
        <h1 className="font-serif text-3xl text-farros-navy">Farros Drive</h1>
        <p className="mt-3 text-sm text-farros-ink">{message}</p>
      </div>
    </div>
  )
}

function RequireAuth() {
  const { auth, isApiConfigured, isReady } = useDriveStore()

  if (!isReady) {
    return <FullscreenState message="Memeriksa sesi..." />
  }

  if (isApiConfigured && !auth.authenticated) {
    return <Navigate to="/login" replace />
  }

  return <Outlet />
}

function LoginRoute() {
  const { auth, isApiConfigured, isReady } = useDriveStore()

  if (!isApiConfigured) {
    return <Navigate to="/drive/files" replace />
  }

  if (!isReady) {
    return <FullscreenState message="Memeriksa sesi..." />
  }

  if (auth.authenticated) {
    return <Navigate to="/drive/files" replace />
  }

  return <Login />
}

function App() {
  return (
    <Routes>
      <Route path="/" element={<Navigate to="/drive/files" replace />} />
      <Route path="/login" element={<LoginRoute />} />
      <Route path="/s/:token" element={<PublicShare />} />
      <Route element={<RequireAuth />}>
        <Route path="/drive" element={<AppShell />}>
          <Route index element={<Navigate to="/drive/files" replace />} />
          <Route path="dashboard" element={<Dashboard />} />
          <Route path="files" element={<Files />} />
          <Route path="recent" element={<Recent />} />
          <Route path="trash" element={<Trash />} />
          <Route path="shared" element={<Shared />} />
          <Route path="settings" element={<Settings />} />
        </Route>
      </Route>
      <Route path="*" element={<Navigate to="/drive/files" replace />} />
    </Routes>
  )
}

export default App
