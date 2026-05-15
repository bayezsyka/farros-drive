import clsx from 'clsx'
import { HardDrive, LogOut } from 'lucide-react'
import { NavLink } from 'react-router-dom'
import { useDriveStore } from '../../hooks/useDriveStore'

function Sidebar({ items }) {
  const { backend, logout } = useDriveStore()

  return (
    <aside className="hidden border-r border-black/5 bg-white/72 px-5 py-5 backdrop-blur xl:flex xl:flex-col">
      <div className="rounded-[28px] border border-black/5 bg-farros-navy px-5 py-5 text-farros-ivory">
        <div className="flex items-center gap-3">
          <div className="rounded-2xl bg-white/12 p-3">
            <HardDrive size={20} />
          </div>
          <div>
            <p className="font-serif text-2xl">Farros Drive</p>
            <p className="text-sm text-farros-ivory/70">drive.farros.space</p>
          </div>
        </div>
        <div className="mt-5 flex items-center gap-2 text-xs text-farros-ivory/78">
          <span className={clsx('inline-block h-2.5 w-2.5 rounded-full', backend.connected ? 'bg-emerald-400' : 'bg-amber-400')} />
          <span>{backend.connected ? 'Backend online' : 'Backend bermasalah'}</span>
        </div>
      </div>

      <nav className="mt-6 space-y-1.5">
        {items.map((item) => (
          <NavLink
            key={item.to}
            to={item.to}
            className={({ isActive }) =>
              clsx(
                'flex items-center gap-3 rounded-2xl px-4 py-3 text-sm font-semibold transition',
                isActive ? 'bg-white text-farros-navy shadow-sm' : 'text-farros-ink hover:bg-white/70',
              )
            }
          >
            <item.icon size={18} />
            <span>{item.label}</span>
          </NavLink>
        ))}
      </nav>

      <button
        type="button"
        onClick={logout}
        className="mt-auto flex items-center gap-3 rounded-2xl px-4 py-3 text-sm font-semibold text-farros-ink transition hover:bg-white/70"
      >
        <LogOut size={18} />
        <span>Keluar</span>
      </button>
    </aside>
  )
}

export default Sidebar
