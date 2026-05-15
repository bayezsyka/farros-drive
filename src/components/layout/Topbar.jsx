import { CalendarDays, Server } from 'lucide-react'
import { useDriveStore } from '../../hooks/useDriveStore'
import Badge from '../ui/Badge'

function Topbar({ description, title }) {
  const { backend } = useDriveStore()
  const today = new Intl.DateTimeFormat('id-ID', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  }).format(new Date())

  return (
    <header className="panel-surface flex flex-col gap-5 px-5 py-5 sm:px-6 lg:flex-row lg:items-center lg:justify-between">
      <div className="space-y-2">
        <div className="flex flex-wrap gap-2">
          <Badge variant="success">drive.farros.space</Badge>
          <Badge variant={backend.connected ? 'success' : 'neutral'}>{backend.statusLabel}</Badge>
        </div>
        <div>
          <h2 className="text-2xl font-semibold text-farros-navy sm:text-3xl">{title}</h2>
          <p className="mt-2 max-w-2xl text-sm leading-6 text-farros-ink">{description}</p>
        </div>
      </div>
      <div className="flex flex-col gap-3 sm:flex-row">
        <div className="panel-muted flex items-center gap-3 px-4 py-3 text-sm text-farros-ink">
          <CalendarDays size={18} className="text-farros-sage" />
          <span>{today}</span>
        </div>
        <div className="panel-muted flex items-center gap-3 px-4 py-3 text-sm text-farros-ink">
          <Server size={18} className="text-farros-sage" />
          <span>{backend.connected ? backend.storageRoot : 'Mode localStorage / simulasi'}</span>
        </div>
      </div>
    </header>
  )
}

export default Topbar
