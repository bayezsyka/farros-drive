import { HardDrive } from 'lucide-react'
import { formatBytes } from '../../lib/formatters'
import Card from '../ui/Card'

function StorageUsageCard({ summary }) {
  const usagePercent = Math.min((summary.usedBytes / summary.capacityBytes) * 100, 100)

  return (
    <Card className="p-6">
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="text-sm font-medium text-farros-ink">Penggunaan Simulasi Storage</p>
          <h3 className="mt-3 text-2xl font-semibold text-farros-navy">
            {formatBytes(summary.usedBytes)} dari {formatBytes(summary.capacityBytes)}
          </h3>
          <p className="mt-2 text-sm text-farros-ink">
            Backend belum tersambung. Nilai ini dihitung dari file dummy dan upload lokal.
          </p>
        </div>
        <div className="rounded-3xl bg-farros-mist p-3 text-farros-sage">
          <HardDrive size={24} />
        </div>
      </div>
      <div className="mt-6 h-3 rounded-full bg-farros-mist">
        <div
          className="h-3 rounded-full bg-farros-sage transition-[width]"
          style={{ width: `${usagePercent}%` }}
        />
      </div>
      <div className="mt-3 flex items-center justify-between text-sm text-farros-ink">
        <span>{usagePercent.toFixed(1)}% terpakai</span>
        <span>Sisa {formatBytes(summary.remainingBytes)}</span>
      </div>
    </Card>
  )
}

export default StorageUsageCard
