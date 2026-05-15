import { HardDrive, Server } from 'lucide-react'
import { formatBytes, formatPercent } from '../../lib/formatters'

function Metric({ icon: Icon, label, value, note }) {
  return (
    <div className="rounded-[24px] border border-black/5 bg-white/80 px-4 py-4">
      <div className="flex items-center gap-3 text-farros-ink">
        <div className="rounded-2xl bg-farros-mist p-2.5">
          <Icon size={16} />
        </div>
        <span className="text-sm font-semibold">{label}</span>
      </div>
      <p className="mt-4 text-xl font-semibold text-farros-navy">{value}</p>
      <p className="mt-1 text-xs text-farros-ink">{note}</p>
    </div>
  )
}

function StorageSummaryCard({ summary }) {
  const drive = summary?.drive || {}
  const disk = summary?.disk || {}

  return (
    <section className="panel-surface rounded-[30px] px-5 py-5">
      <div className="flex items-center justify-between gap-4">
        <div>
          <h2 className="text-lg font-semibold text-farros-navy">Storage</h2>
          <p className="text-sm text-farros-ink">/srv/drive dan Disk CT</p>
        </div>
      </div>
      <div className="mt-4 grid gap-3 lg:grid-cols-2">
        <Metric
          icon={HardDrive}
          label="/srv/drive"
          value={formatBytes(drive.usedBytes || 0)}
          note={`${drive.fileCount || 0} berkas • ${drive.folderCount || 0} folder`}
        />
        <Metric
          icon={Server}
          label="Disk CT"
          value={formatBytes(disk.totalBytes || 0)}
          note={`Terpakai ${formatBytes(disk.usedBytes || 0)} • ${formatPercent(disk.usedPercent || 0)}`}
        />
      </div>
      <div className="mt-3 rounded-[24px] bg-farros-navy px-4 py-4 text-farros-ivory">
        <div className="flex flex-wrap items-center justify-between gap-3 text-sm">
          <span>Kapasitas CT</span>
          <span>{formatBytes(disk.totalBytes || 0)}</span>
        </div>
        <div className="mt-2 flex flex-wrap items-center justify-between gap-3 text-sm text-farros-ivory/80">
          <span>Tersisa</span>
          <span>{formatBytes(disk.freeBytes || 0)}</span>
        </div>
      </div>
    </section>
  )
}

export default StorageSummaryCard
