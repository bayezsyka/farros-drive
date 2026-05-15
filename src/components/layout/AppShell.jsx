import { FolderOpen, History, Link2, Settings, Trash2 } from 'lucide-react'
import { Outlet, useLocation } from 'react-router-dom'
import MobileNav from './MobileNav'
import Sidebar from './Sidebar'
import Topbar from './Topbar'

const navigationItems = [
  { label: 'Berkas', to: '/drive/files', icon: FolderOpen },
  { label: 'Terbaru', to: '/drive/recent', icon: History },
  { label: 'Sampah', to: '/drive/trash', icon: Trash2 },
  { label: 'Dibagikan', to: '/drive/shared', icon: Link2 },
  { label: 'Pengaturan', to: '/drive/settings', icon: Settings },
]

const routeTitles = {
  '/drive/dashboard': 'Dashboard',
  '/drive/files': 'Berkas',
  '/drive/recent': 'Terbaru',
  '/drive/trash': 'Sampah',
  '/drive/shared': 'Dibagikan',
  '/drive/settings': 'Pengaturan',
}

function AppShell() {
  const location = useLocation()
  const title = routeTitles[location.pathname] || 'Farros Drive'

  return (
    <div className="min-h-screen xl:grid xl:grid-cols-[260px_minmax(0,1fr)]">
      <Sidebar items={navigationItems} />
      <div className="min-w-0 px-4 py-4 sm:px-6 xl:px-7">
        <div className="mx-auto flex min-h-[calc(100vh-2rem)] max-w-7xl flex-col gap-4 pb-28 xl:pb-6">
          <Topbar title={title} />
          <main className="min-h-0 flex-1">
            <Outlet />
          </main>
        </div>
      </div>
      <MobileNav items={navigationItems} />
    </div>
  )
}

export default AppShell
