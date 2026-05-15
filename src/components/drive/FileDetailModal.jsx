import { formatBytes, formatDateTime } from '../../lib/formatters'
import { getItemStatus } from '../../lib/fileUtils'
import Badge from '../ui/Badge'
import Modal from '../ui/Modal'

function InfoRow({ label, value }) {
  return (
    <div className="grid gap-2 border-b py-3 sm:grid-cols-[160px_minmax(0,1fr)]">
      <p className="text-sm font-semibold text-farros-navy">{label}</p>
      <p className="text-sm text-farros-ink">{value}</p>
    </div>
  )
}

function FileDetailModal({ item, open, onClose }) {
  if (!item) {
    return null
  }

  return (
    <Modal
      open={open}
      onClose={onClose}
      title="Detail Item"
      description="Metadata ini masih berasal dari state lokal dan siap disambungkan ke backend Go."
    >
      <div className="space-y-3">
        <InfoRow label="Nama" value={item.name} />
        <InfoRow label="Jenis" value={item.type === 'folder' ? 'Folder' : `File .${item.extension || '-'}`} />
        <InfoRow label="Ukuran" value={item.type === 'folder' ? '-' : formatBytes(item.size)} />
        <InfoRow label="Lokasi folder" value={item.path} />
        <InfoRow label="Tanggal dibuat" value={formatDateTime(item.createdAt)} />
        <InfoRow label="Tanggal diubah" value={formatDateTime(item.updatedAt)} />
        <div className="grid gap-2 py-3 sm:grid-cols-[160px_minmax(0,1fr)]">
          <p className="text-sm font-semibold text-farros-navy">Status</p>
          <div>
            <Badge variant={item.deletedAt ? 'danger' : 'success'}>{getItemStatus(item)}</Badge>
          </div>
        </div>
      </div>
    </Modal>
  )
}

export default FileDetailModal
