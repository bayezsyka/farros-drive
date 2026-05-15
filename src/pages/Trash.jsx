import { RotateCcw, Trash2 } from 'lucide-react'
import EmptyState from '../components/ui/EmptyState'
import { useDriveStore } from '../hooks/useDriveStore'
import { formatDateTime } from '../lib/formatters'

function Trash() {
  const { deleteForever, getTrashItems, restoreItem } = useDriveStore()
  const trashItems = getTrashItems()

  const handleRestore = async (item) => {
    await restoreItem(item.trashPath, item.originalPath || item.path)
  }

  const handleDeleteForever = async (item) => {
    if (!window.confirm(`Hapus permanen "${item.name}"?`)) {
      return
    }

    await deleteForever(item.trashPath)
  }

  if (!trashItems.length) {
    return <EmptyState icon={Trash2} title="Sampah kosong" description="Item yang dihapus akan muncul di sini." />
  }

  return (
    <div className="space-y-3">
      {trashItems.map((item) => (
        <div key={item.id} className="rounded-[24px] border border-black/5 bg-white/82 px-4 py-4 shadow-sm">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
            <div className="min-w-0">
              <p className="truncate font-semibold text-farros-navy">{item.name}</p>
              <p className="truncate text-sm text-farros-ink">{item.originalPath || item.path}</p>
              <p className="mt-2 text-xs text-farros-ink">Dihapus {formatDateTime(item.deletedAt)}</p>
            </div>
            <div className="flex flex-wrap gap-2">
              <button
                type="button"
                onClick={() => handleRestore(item)}
                className="inline-flex h-10 items-center gap-2 rounded-2xl bg-farros-mist px-4 text-sm font-semibold text-farros-navy"
              >
                <RotateCcw size={16} />
                Pulihkan
              </button>
              <button
                type="button"
                onClick={() => handleDeleteForever(item)}
                className="inline-flex h-10 items-center gap-2 rounded-2xl bg-red-50 px-4 text-sm font-semibold text-red-600"
              >
                <Trash2 size={16} />
                Hapus
              </button>
            </div>
          </div>
        </div>
      ))}
    </div>
  )
}

export default Trash
