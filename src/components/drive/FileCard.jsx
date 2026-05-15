import {
  Archive,
  Database,
  File,
  FileCode,
  FileText,
  Image as ImageIcon,
  Table,
} from 'lucide-react'
import { getFileIconName } from '../../lib/fileUtils'
import { formatBytes, formatRelativeTime } from '../../lib/formatters'
import Badge from '../ui/Badge'
import Card from '../ui/Card'
import ActionMenu from './ActionMenu'

const iconMap = {
  archive: Archive,
  code: FileCode,
  database: Database,
  file: File,
  image: ImageIcon,
  table: Table,
  text: FileText,
}

function FileCard({ item, onDelete, onDetail, onDownload, onRename }) {
  const Icon = iconMap[getFileIconName(item)] || File

  return (
    <Card className="flex h-full flex-col gap-5 p-5">
      <div className="flex items-start justify-between gap-4">
        <div className="rounded-3xl bg-farros-mist p-3 text-farros-sage">
          <Icon size={24} />
        </div>
        <ActionMenu
          onDelete={onDelete}
          onDetail={onDetail}
          onDownload={onDownload}
          onRename={onRename}
        />
      </div>
      <div className="space-y-3">
        <div>
          <h3 className="line-clamp-2 text-lg font-semibold text-farros-navy">{item.name}</h3>
          <p className="mt-1 text-sm text-farros-ink">{item.path}</p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Badge>{item.extension || 'file'}</Badge>
          <Badge variant="success">{formatBytes(item.size)}</Badge>
        </div>
      </div>
      <p className="mt-auto text-sm text-farros-ink">Diperbarui {formatRelativeTime(item.updatedAt)}</p>
    </Card>
  )
}

export default FileCard
