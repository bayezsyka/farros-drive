import { LogOut } from 'lucide-react'
import { useDriveStore } from '../../hooks/useDriveStore'

function Topbar({ title }) {
  const { backend, logout } = useDriveStore()

  return (
    <header className="flex items-center justify-between gap-4 rounded-[28px] border border-black/5 bg-white/82 px-5 py-4 shadow-sm backdrop-blur">
      <div className="min-w-0">
        <h1 className="truncate text-2xl font-semibold text-farros-navy">{title}</h1>
        <div className="mt-1 flex items-center gap-2 text-xs text-farros-ink">
          <span className={`inline-block h-2 w-2 rounded-full ${backend.connected ? 'bg-emerald-500' : 'bg-amber-500'}`} />
          <span>{backend.connected ? 'Online' : backend.statusLabel}</span>
          <span className="hidden sm:inline">•</span>
          <span className="hidden sm:inline">{backend.storageRoot}</span>
        </div>
      </div>
      <button
        type="button"
        onClick={logout}
        className="inline-flex h-10 items-center gap-2 rounded-2xl border border-black/5 bg-farros-mist/70 px-4 text-sm font-semibold text-farros-navy transition hover:bg-farros-mist"
      >
        <LogOut size={16} />
        <span className="hidden sm:inline">Keluar</span>
      </button>
    </header>
  )
}

export default Topbar
