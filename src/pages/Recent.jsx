import { Eye, FileClock, Link2, Pencil, Trash2 } from 'lucide-react'
import { useState } from 'react'
import FilePreviewModal from '../components/drive/FilePreviewModal'
import RenameModal from '../components/drive/RenameModal'
import ShareModal from '../components/drive/ShareModal'
import EmptyState from '../components/ui/EmptyState'
import { useDriveStore } from '../hooks/useDriveStore'
import { formatBytes, formatDateTime } from '../lib/formatters'

function Recent() {
  const {
    createShare,
    downloadUrlForPath,
    getPreviewUrlForPath,
    getRecentItems,
    isServerMode,
    moveToTrash,
    previewText,
    renameItem,
    revokeShare,
    shares,
  } = useDriveStore()
  const [previewTarget, setPreviewTarget] = useState(null)
  const [renameTarget, setRenameTarget] = useState(null)
  const [shareTarget, setShareTarget] = useState(null)

  const items = getRecentItems(20)

  const handleDelete = async (item) => {
    if (!window.confirm(`Pindahkan "${item.name}" ke Sampah?`)) {
      return
    }

    await moveToTrash(item.path)
  }

  const handleRename = async (name) => {
    if (!renameTarget || !name.trim()) {
      return
    }

    await renameItem(renameTarget.path, name)
    setRenameTarget(null)
  }

  if (!items.length) {
    return <EmptyState icon={FileClock} title="Belum ada file" description="File terbaru akan muncul di sini." />
  }

  return (
    <div className="space-y-3">
      {items.map((item) => (
        <div key={item.id} className="rounded-[24px] border border-black/5 bg-white/82 px-4 py-4 shadow-sm">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
            <div className="min-w-0">
              <p className="truncate font-semibold text-farros-navy">{item.name}</p>
              <p className="truncate text-sm text-farros-ink">{item.path}</p>
              <div className="mt-2 flex flex-wrap gap-4 text-xs text-farros-ink">
                <span>{formatBytes(item.size)}</span>
                <span>{formatDateTime(item.updatedAt)}</span>
              </div>
            </div>
            <div className="flex flex-wrap gap-2">
              <button type="button" onClick={() => setPreviewTarget(item)} className="rounded-2xl bg-farros-mist p-2.5 text-farros-navy">
                <Eye size={16} />
              </button>
              <button type="button" onClick={() => setShareTarget(item)} className="rounded-2xl bg-farros-mist p-2.5 text-farros-navy">
                <Link2 size={16} />
              </button>
              <button type="button" onClick={() => setRenameTarget(item)} className="rounded-2xl bg-farros-mist p-2.5 text-farros-navy">
                <Pencil size={16} />
              </button>
              <button type="button" onClick={() => handleDelete(item)} className="rounded-2xl bg-red-50 p-2.5 text-red-600">
                <Trash2 size={16} />
              </button>
            </div>
          </div>
        </div>
      ))}

      <RenameModal item={renameTarget} open={Boolean(renameTarget)} onClose={() => setRenameTarget(null)} onSubmit={handleRename} />
      <ShareModal
        item={shareTarget}
        open={Boolean(shareTarget)}
        onClose={() => setShareTarget(null)}
        onCreate={createShare}
        onRevoke={revokeShare}
        shares={shares}
      />
      <FilePreviewModal
        item={previewTarget}
        open={Boolean(previewTarget)}
        onClose={() => setPreviewTarget(null)}
        onShare={previewTarget ? () => setShareTarget(previewTarget) : null}
        previewUrl={previewTarget && isServerMode ? getPreviewUrlForPath(previewTarget.path) : null}
        downloadUrl={previewTarget && isServerMode ? downloadUrlForPath(previewTarget.path) : null}
        loadText={isServerMode ? previewText : async () => 'Preview tersedia saat backend aktif.'}
      />
    </div>
  )
}

export default Recent
