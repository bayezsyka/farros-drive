import clsx from 'clsx'
import { HardDrive } from 'lucide-react'
import { NavLink } from 'react-router-dom'
import { useDriveStore } from '../../hooks/useDriveStore'
import Badge from '../ui/Badge'

function Sidebar({ items }) {
  const { backend } = useDriveStore()

  return (
    <aside className="hidden border-r border-white/60 bg-white/55 px-6 py-8 backdrop-blur xl:flex xl:flex-col">
      <div className="panel-surface p-5">
        <div className="flex items-center gap-4">
          <div className="rounded-3xl bg-farros-navy p-3 text-farros-ivory">
            <HardDrive size={26} />
          </div>
          <div>
            <h1 className="font-serif text-2xl tracking-tight text-farros-navy">Farros Drive</h1>
            <p className="mt-1 text-sm leading-5 text-farros-ink">
              Ruang berkas pribadi untuk server Farros.
            </p>
          </div>
        </div>
        <div className="mt-5 flex flex-wrap gap-2">
          <Badge variant="success">drive.farros.space</Badge>
          <Badge variant={backend.connected ? 'success' : 'neutral'}>{backend.statusLabel}</Badge>
        </div>
      </div>

      <nav className="mt-8 space-y-2">
        {items.map((item) => (
          <NavLink
            key={item.to}
            to={item.to}
            end={item.end}
            className={({ isActive }) =>
              clsx(
                'flex items-center gap-3 rounded-2xl px-4 py-3 text-sm font-semibold transition',
                isActive
                  ? 'bg-farros-navy text-farros-ivory shadow-lg shadow-farros-navy/10'
                  : 'text-farros-ink hover:bg-white/70',
              )
            }
          >
            <item.icon size={18} />
            <span>{item.label}</span>
          </NavLink>
        ))}
      </nav>

      <div className="panel-muted mt-auto p-5">
        <p className="text-xs font-semibold uppercase tracking-[0.2em] text-farros-ink">
          Status backend
        </p>
        <p className="mt-3 text-sm leading-6 text-farros-ink">
          {backend.connected
            ? `API aktif dan membaca storage nyata dari ${backend.storageRoot}.`
            : 'Frontend sedang memakai fallback localStorage karena API belum aktif atau belum dikonfigurasi.'}
        </p>
      </div>
    </aside>
  )
}

export default Sidebar
