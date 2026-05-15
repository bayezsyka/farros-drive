import {
  FolderOpen,
  History,
  LayoutDashboard,
  Settings,
  Trash2,
} from 'lucide-react'
import { Outlet, useLocation } from 'react-router-dom'
import MobileNav from './MobileNav'
import Sidebar from './Sidebar'
import Topbar from './Topbar'

const navigationItems = [
  { label: 'Dashboard', to: '/drive', icon: LayoutDashboard, end: true },
  { label: 'Berkas', to: '/drive/files', icon: FolderOpen },
  { label: 'Terbaru', to: '/drive/recent', icon: History },
  { label: 'Sampah', to: '/drive/trash', icon: Trash2 },
  { label: 'Pengaturan', to: '/drive/settings', icon: Settings },
]

const routeCopy = {
  '/drive': {
    title: 'Farros Drive',
    description: 'Kelola berkas server pribadi dari satu tampilan yang rapi.',
  },
  '/drive/files': {
    title: 'Berkas',
    description: 'Navigasi folder, unggah file, dan kelola storage server atau fallback simulasi dari satu UI.',
  },
  '/drive/recent': {
    title: 'Terbaru',
    description: 'Pantau file yang paling sering berubah untuk alur transfer laptop, HP, dan server.',
  },
  '/drive/trash': {
    title: 'Sampah',
    description: 'Kelola item yang dipindahkan sementara sebelum benar-benar dihapus permanen.',
  },
  '/drive/settings': {
    title: 'Pengaturan',
    description: 'Ringkasan mode backend, root storage aktif, dan arah instalasi Farros Drive di lingkungan server.',
  },
}

function AppShell() {
  const location = useLocation()
  const copy = routeCopy[location.pathname] || routeCopy['/drive']

  return (
    <div className="min-h-screen xl:grid xl:grid-cols-[290px_minmax(0,1fr)]">
      <Sidebar items={navigationItems} />
      <div className="min-w-0 px-4 py-4 sm:px-6 sm:py-6 xl:px-8">
        <div className="mx-auto flex min-h-[calc(100vh-2rem)] max-w-7xl flex-col gap-6 pb-28 xl:pb-8">
          <Topbar title={copy.title} description={copy.description} />
          <main className="flex-1">
            <Outlet />
          </main>
        </div>
      </div>
      <MobileNav items={navigationItems} />
    </div>
  )
}

export default AppShell
