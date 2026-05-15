import {
  Archive,
  Database,
  File,
  FileCode,
  FileText,
  Folder,
  Image as ImageIcon,
  Table,
} from 'lucide-react'
import { getFileIconName, getItemStatus } from '../../lib/fileUtils'
import { formatBytes, formatDateTime } from '../../lib/formatters'
import Badge from '../ui/Badge'
import ActionMenu from './ActionMenu'

const iconMap = {
  archive: Archive,
  code: FileCode,
  database: Database,
  file: File,
  folder: Folder,
  image: ImageIcon,
  table: Table,
  text: FileText,
}

function FileRow({
  item,
  clickable = false,
  onDelete,
  onDetail,
  onDownload,
  onOpen,
  onRename,
  showDeleted = false,
}) {
  const Icon = iconMap[getFileIconName(item)] || File

  return (
    <div
      className={`grid gap-4 rounded-3xl border bg-white px-4 py-4 shadow-sm sm:grid-cols-[minmax(0,1.7fr)_130px_180px_150px_44px] sm:items-center ${
        clickable ? 'transition hover:border-farros-sage/60 hover:bg-farros-mist/30' : ''
      }`}
    >
      <button
        type="button"
        disabled={!clickable}
        onClick={onOpen}
        className="flex items-start gap-3 text-left disabled:cursor-default"
      >
        <div className="rounded-2xl bg-farros-mist p-3 text-farros-sage">
          <Icon size={20} />
        </div>
        <div className="min-w-0">
          <p className="truncate text-sm font-semibold text-farros-navy sm:text-base">{item.name}</p>
          <p className="mt-1 truncate text-xs text-farros-ink sm:text-sm">{item.path}</p>
        </div>
      </button>

      <div className="text-sm text-farros-ink">
        <p className="sm:hidden">Ukuran</p>
        <p>{item.type === 'folder' ? '-' : formatBytes(item.size)}</p>
      </div>

      <div className="text-sm text-farros-ink">
        <p className="sm:hidden">Diperbarui</p>
        <p>{formatDateTime(item.updatedAt)}</p>
      </div>

      <div>
        <Badge variant={showDeleted ? 'danger' : 'neutral'}>{getItemStatus(item)}</Badge>
      </div>

      <div className="justify-self-end">
        <ActionMenu
          onDelete={onDelete}
          onDetail={onDetail}
          onDownload={onDownload}
          onRename={onRename}
        />
      </div>
    </div>
  )
}

export default FileRow
