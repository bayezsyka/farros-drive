import {
  Files as FilesIcon,
  FolderKanban,
  HardDrive,
  MoveRight,
  Sparkles,
} from 'lucide-react'
import { Link } from 'react-router-dom'
import StorageUsageCard from '../components/drive/StorageUsageCard'
import StatCard from '../components/drive/StatCard'
import Badge from '../components/ui/Badge'
import Card from '../components/ui/Card'
import { useDriveStore } from '../hooks/useDriveStore'
import { formatBytes, formatRelativeTime } from '../lib/formatters'

function Dashboard() {
  const { getRecentItems, getStorageSummary } = useDriveStore()
  const recentItems = getRecentItems(5)
  const summary = getStorageSummary()

  return (
    <div className="space-y-6">
      <section className="grid gap-4 lg:grid-cols-[minmax(0,1.4fr)_minmax(320px,0.9fr)]">
        <Card className="overflow-hidden p-6 sm:p-8">
          <div className="flex flex-col gap-8 lg:flex-row lg:items-end lg:justify-between">
            <div className="max-w-2xl">
              <Badge variant="success">Farros Drive</Badge>
              <h1 className="section-title mt-4">Kelola berkas server pribadi dari satu tampilan yang rapi.</h1>
              <p className="mt-4 max-w-xl text-sm leading-7 text-farros-ink sm:text-base">
                Fase ini fokus pada simulasi frontend untuk alur pertukaran file laptop, HP, dan server
                Proxmox/CT. Struktur UI sudah disiapkan agar mudah dihubungkan ke backend Go nanti.
              </p>
            </div>
            <div className="flex flex-wrap gap-3">
              <Link
                to="/drive/files"
                className="inline-flex h-11 items-center justify-center rounded-2xl bg-farros-navy px-4 text-sm font-semibold text-farros-ivory transition hover:bg-farros-navy/92"
              >
                Upload Berkas
              </Link>
              <Link
                to="/drive/files"
                className="inline-flex h-11 items-center justify-center rounded-2xl bg-farros-sage px-4 text-sm font-semibold text-farros-navy transition hover:bg-farros-sage/85"
              >
                Buat Folder
              </Link>
            </div>
          </div>
        </Card>

        <StorageUsageCard summary={summary} />
      </section>

      <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <StatCard
          icon={FilesIcon}
          label="Total Berkas"
          value={summary.fileCount}
          note="File aktif di simulasi drive"
        />
        <StatCard
          icon={FolderKanban}
          label="Total Folder"
          value={summary.folderCount}
          note="Folder aktif siap dinavigasi"
        />
        <StatCard
          icon={HardDrive}
          label="Total Ukuran"
          value={formatBytes(summary.usedBytes)}
          note="Akumulasi ukuran file dummy"
        />
        <StatCard
          icon={Sparkles}
          label="Berkas Terbaru"
          value={summary.recentFileName}
          note="File paling baru diubah"
        />
      </section>

      <section className="grid gap-4 xl:grid-cols-[minmax(0,1.5fr)_minmax(320px,0.9fr)]">
        <Card className="p-6">
          <div className="flex items-center justify-between gap-4">
            <div>
              <p className="text-sm font-semibold uppercase tracking-[0.2em] text-farros-ink">Aktivitas terbaru</p>
              <h2 className="mt-2 text-2xl font-semibold text-farros-navy">5 file terakhir</h2>
            </div>
            <Link to="/drive/recent" className="text-sm font-semibold text-farros-navy">
              Lihat semua
            </Link>
          </div>
          <div className="mt-6 space-y-3">
            {recentItems.map((item) => (
              <div
                key={item.id}
                className="flex flex-col gap-3 rounded-3xl border bg-farros-ivory/80 px-4 py-4 sm:flex-row sm:items-center sm:justify-between"
              >
                <div>
                  <p className="font-semibold text-farros-navy">{item.name}</p>
                  <p className="mt-1 text-sm text-farros-ink">{item.path}</p>
                </div>
                <div className="flex items-center gap-4 text-sm text-farros-ink">
                  <span>{formatBytes(item.size)}</span>
                  <span>{formatRelativeTime(item.updatedAt)}</span>
                </div>
              </div>
            ))}
          </div>
        </Card>

        <Card className="p-6">
          <p className="text-sm font-semibold uppercase tracking-[0.2em] text-farros-ink">Storage path</p>
          <h2 className="mt-3 text-2xl font-semibold text-farros-navy">Lokasi penyimpanan nanti</h2>
          <div className="mt-6 rounded-[24px] bg-farros-navy px-5 py-6 text-farros-ivory">
            <p className="text-sm uppercase tracking-[0.2em] text-farros-ivory/70">Target server</p>
            <p className="mt-3 font-mono text-lg">/srv/drive</p>
          </div>
          <p className="mt-5 text-sm leading-6 text-farros-ink">
            Panel web akan ditempatkan terpisah di `/opt/farros-drive` dan terhubung ke backend Go pada fase
            berikutnya.
          </p>
          <Link to="/drive/files" className="mt-6 inline-flex items-center gap-2 text-sm font-semibold text-farros-navy">
            Buka area berkas
            <MoveRight size={16} />
          </Link>
        </Card>
      </section>
    </div>
  )
}

export default Dashboard
