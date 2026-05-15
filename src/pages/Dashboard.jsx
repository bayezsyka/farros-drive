import { Link } from 'react-router-dom'
import StorageSummaryCard from '../components/drive/StorageSummaryCard'
import { useDriveStore } from '../hooks/useDriveStore'
import { formatBytes } from '../lib/formatters'

function Stat({ label, value }) {
  return (
    <div className="rounded-[24px] border border-black/5 bg-white/80 px-4 py-4">
      <p className="text-sm text-farros-ink">{label}</p>
      <p className="mt-2 text-2xl font-semibold text-farros-navy">{value}</p>
    </div>
  )
}

function Dashboard() {
  const { getStorageSummary, getTrashItems, shares } = useDriveStore()
  const summary = getStorageSummary()

  return (
    <div className="space-y-4">
      <div className="grid gap-4 lg:grid-cols-[1.2fr_0.8fr]">
        <div className="panel-surface rounded-[32px] px-6 py-6">
          <h2 className="font-serif text-4xl text-farros-navy">Farros Drive</h2>
          <p className="mt-3 max-w-xl text-sm text-farros-ink">Berkas pribadi, preview cepat, dan link publik read-only.</p>
          <div className="mt-5 flex flex-wrap gap-3">
            <Link to="/drive/files" className="inline-flex h-11 items-center rounded-2xl bg-farros-navy px-4 text-sm font-semibold text-farros-ivory">
              Buka Berkas
            </Link>
            <Link to="/drive/shared" className="inline-flex h-11 items-center rounded-2xl bg-farros-mist px-4 text-sm font-semibold text-farros-navy">
              Lihat Link
            </Link>
          </div>
        </div>
        <StorageSummaryCard summary={summary} />
      </div>

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <Stat label="Berkas" value={summary.drive?.fileCount || 0} />
        <Stat label="Folder" value={summary.drive?.folderCount || 0} />
        <Stat label="Sampah" value={getTrashItems().length} />
        <Stat label="Link aktif" value={shares.length} />
      </div>

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <Stat label="Farros Drive" value={formatBytes(summary.drive?.usedBytes || 0)} />
        <Stat label="Disk CT" value={formatBytes(summary.disk?.usedBytes || 0)} />
        <Stat label="Tersisa" value={formatBytes(summary.disk?.freeBytes || 0)} />
        <Stat label="Mount" value={summary.disk?.mount || '/'} />
      </div>
    </div>
  )
}

export default Dashboard
