import { Copy, Link2, Trash2 } from 'lucide-react'
import Button from '../ui/Button'

function SharedItemRow({ item, onCopy, onRevoke }) {
  return (
    <div className="rounded-[24px] border border-black/5 bg-white/80 px-4 py-4">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
        <div className="min-w-0">
          <div className="flex items-center gap-2 text-farros-navy">
            <Link2 size={16} />
            <p className="truncate font-semibold">{item.name}</p>
          </div>
          <p className="mt-1 truncate text-sm text-farros-ink">{item.url}</p>
          <p className="mt-1 text-xs text-farros-ink">{item.path}</p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button variant="subtle" size="sm" onClick={() => onCopy(item.url)}>
            <Copy size={15} />
            Salin
          </Button>
          <Button variant="danger" size="sm" onClick={() => onRevoke(item.token)}>
            <Trash2 size={15} />
            Cabut
          </Button>
        </div>
      </div>
    </div>
  )
}

export default SharedItemRow
