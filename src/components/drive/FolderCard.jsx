import { Folder } from 'lucide-react'
import { formatRelativeTime } from '../../lib/formatters'
import Badge from '../ui/Badge'
import Card from '../ui/Card'
import ActionMenu from './ActionMenu'

function FolderCard({ item, onDelete, onDetail, onDownload, onOpen, onRename }) {
  return (
    <button type="button" onClick={onOpen} className="h-full text-left">
      <Card className="flex h-full flex-col gap-5 p-5 transition hover:-translate-y-0.5">
        <div className="flex items-start justify-between gap-4">
          <div className="rounded-3xl bg-farros-mist p-3 text-farros-sage">
            <Folder size={24} />
          </div>
          <div onClick={(event) => event.stopPropagation()}>
            <ActionMenu
              onDelete={onDelete}
              onDetail={onDetail}
              onDownload={onDownload}
              onRename={onRename}
            />
          </div>
        </div>
        <div className="space-y-3">
          <div>
            <h3 className="line-clamp-2 text-lg font-semibold text-farros-navy">{item.name}</h3>
            <p className="mt-1 text-sm text-farros-ink">{item.path}</p>
          </div>
          <Badge variant="success">Folder</Badge>
        </div>
        <p className="mt-auto text-sm text-farros-ink">Diperbarui {formatRelativeTime(item.updatedAt)}</p>
      </Card>
    </button>
  )
}

export default FolderCard
