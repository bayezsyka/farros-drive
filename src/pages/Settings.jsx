import { Globe, HardDrive, Lock, Server, Workflow } from 'lucide-react'
import Card from '../components/ui/Card'
import { useDriveStore } from '../hooks/useDriveStore'

function Settings() {
  const { backend, currentMode } = useDriveStore()
  const settingsRows = [
    { label: 'Nama drive', value: 'Farros Drive', icon: HardDrive },
    { label: 'Domain', value: 'drive.farros.space', icon: Globe },
    { label: 'Lokasi storage nanti', value: '/srv/drive', icon: Server },
    { label: 'Lokasi aplikasi nanti', value: '/opt/farros-drive', icon: Workflow },
    { label: 'Batas upload dummy', value: '100 MB', icon: HardDrive },
    { label: 'Mode akses', value: 'Pribadi', icon: Lock },
    { label: 'Backend status', value: backend.statusLabel, icon: Server },
    { label: 'API base URL', value: backend.apiBaseUrl || '-', icon: Globe },
    { label: 'Storage root aktif', value: backend.storageRoot || '-', icon: Server },
    { label: 'Mode data', value: currentMode, icon: Workflow },
  ]

  return (
    <div className="grid gap-4 xl:grid-cols-[minmax(0,1.3fr)_minmax(320px,0.9fr)]">
      <Card className="p-6">
        <p className="text-sm font-semibold uppercase tracking-[0.2em] text-farros-ink">Konfigurasi dummy</p>
        <div className="mt-6 divide-y">
          {settingsRows.map((row) => (
            <div key={row.label} className="grid gap-4 py-4 sm:grid-cols-[220px_minmax(0,1fr)] sm:items-center">
              <div className="flex items-center gap-3 text-sm font-semibold text-farros-navy">
                <div className="rounded-2xl bg-farros-mist p-2 text-farros-sage">
                  <row.icon size={16} />
                </div>
                <span>{row.label}</span>
              </div>
              <p className="text-sm text-farros-ink">{row.value}</p>
            </div>
          ))}
        </div>
      </Card>

      <Card className="p-6">
        <p className="text-sm font-semibold uppercase tracking-[0.2em] text-farros-ink">Catatan fase</p>
        <h2 className="mt-3 text-2xl font-semibold text-farros-navy">Arah integrasi berikutnya</h2>
        <p className="mt-4 text-sm leading-7 text-farros-ink">
          Fase ini sudah menambahkan backend Go API untuk membaca dan mengelola storage nyata. Autentikasi dan
          proteksi akses masih belum dipasang.
        </p>
        <div className="mt-6 rounded-[28px] bg-farros-navy px-5 py-6 text-farros-ivory">
          <p className="text-sm uppercase tracking-[0.2em] text-farros-ivory/70">Deployment target</p>
          <p className="mt-3 text-lg font-semibold">Panel: /opt/farros-drive</p>
          <p className="mt-2 text-sm text-farros-ivory/80">Storage asli: /srv/drive</p>
        </div>
        <p className="mt-5 text-sm leading-7 text-farros-ink">
          Backend saat ini: {backend.app} {backend.version}. Mode aktif: {currentMode}.
        </p>
      </Card>
    </div>
  )
}

export default Settings
