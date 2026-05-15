import { Navigate, Route, Routes } from 'react-router-dom'
import AppShell from './components/layout/AppShell'
import Dashboard from './pages/Dashboard'
import Files from './pages/Files'
import Recent from './pages/Recent'
import Settings from './pages/Settings'
import Trash from './pages/Trash'

function App() {
  return (
    <Routes>
      <Route path="/" element={<Navigate to="/drive" replace />} />
      <Route path="/drive" element={<AppShell />}>
        <Route index element={<Dashboard />} />
        <Route path="files" element={<Files />} />
        <Route path="recent" element={<Recent />} />
        <Route path="trash" element={<Trash />} />
        <Route path="settings" element={<Settings />} />
      </Route>
      <Route path="*" element={<Navigate to="/drive" replace />} />
    </Routes>
  )
}

export default App
