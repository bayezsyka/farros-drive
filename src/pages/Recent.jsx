import { Filter, History } from 'lucide-react'
import { useMemo, useState } from 'react'
import Swal from 'sweetalert2'
import FileDetailModal from '../components/drive/FileDetailModal'
import FileRow from '../components/drive/FileRow'
import RenameModal from '../components/drive/RenameModal'
import Badge from '../components/ui/Badge'
import EmptyState from '../components/ui/EmptyState'
import { useDriveStore } from '../hooks/useDriveStore'
import { getFileCategory } from '../lib/fileUtils'

const filters = [
  { key: 'semua', label: 'Semua' },
  { key: 'dokumen', label: 'Dokumen' },
  { key: 'gambar', label: 'Gambar' },
  { key: 'arsip', label: 'Arsip' },
  { key: 'sql', label: 'SQL' },
  { key: 'excel', label: 'Excel' },
  { key: 'lainnya', label: 'Lainnya' },
]

function Recent() {
  const { downloadUrlForPath, getRecentItems, isServerMode, moveToTrash, renameItem } = useDriveStore()
  const [activeFilter, setActiveFilter] = useState('semua')
  const [renameTarget, setRenameTarget] = useState(null)
  const [detailTarget, setDetailTarget] = useState(null)

  const items = useMemo(() => {
    const recentItems = getRecentItems(20)

    if (activeFilter === 'semua') {
      return recentItems
    }

    return recentItems.filter((item) => getFileCategory(item) === activeFilter)
  }, [activeFilter, getRecentItems])

  const handleDelete = async (item) => {
    const result = await Swal.fire({
      title: `Pindahkan "${item.name}" ke Sampah?`,
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#0c253b',
      confirmButtonText: 'Pindahkan',
      cancelButtonText: 'Batal',
    })

    if (result.isConfirmed) {
      await moveToTrash(item.path)
      await Swal.fire({
        title: 'Item dipindahkan',
        icon: 'success',
        confirmButtonColor: '#0c253b',
      })
    }
  }

  const handleRename = async (name) => {
    if (!renameTarget) {
      return
    }

    if (!name.trim()) {
      await Swal.fire({
        title: 'Nama baru wajib diisi',
        icon: 'error',
        confirmButtonColor: '#0c253b',
      })
      return
    }

    await renameItem(renameTarget.path, name)
    setRenameTarget(null)
    await Swal.fire({
      title: 'Berkas berhasil di-rename',
      icon: 'success',
      confirmButtonColor: '#0c253b',
    })
  }

  const handleDownload = async (item) => {
    if (isServerMode) {
      const url = downloadUrlForPath(item.path)

      if (url) {
        window.open(url, '_blank', 'noopener,noreferrer')
        return
      }
    }

    await Swal.fire({
      title: 'Download dummy',
      text: `${item.name} belum diunduh sungguhan.`,
      icon: 'success',
      confirmButtonColor: '#0c253b',
    })
  }

  return (
    <div className="space-y-6">
      <div className="panel-surface p-5">
        <div className="flex flex-wrap items-center gap-3">
          <div className="flex items-center gap-2 text-sm font-semibold text-farros-ink">
            <Filter size={16} />
            <span>Filter tipe file</span>
          </div>
          {filters.map((filter) => (
            <button
              key={filter.key}
              type="button"
              onClick={() => setActiveFilter(filter.key)}
              className={`rounded-full px-4 py-2 text-sm font-semibold transition ${
                activeFilter === filter.key
                  ? 'bg-farros-navy text-farros-ivory'
                  : 'bg-farros-mist text-farros-ink hover:bg-farros-sage/30'
              }`}
            >
              {filter.label}
            </button>
          ))}
        </div>
      </div>

      {items.length ? (
        <div className="space-y-3">
          {items.map((item, index) => (
            <div key={item.id} className="space-y-2">
              {index === 0 ? <Badge variant="success">Paling baru</Badge> : null}
              <FileRow
                item={item}
                onDetail={() => setDetailTarget(item)}
                onRename={() => setRenameTarget(item)}
                onDownload={() => handleDownload(item)}
                onDelete={() => handleDelete(item)}
              />
            </div>
          ))}
        </div>
      ) : (
        <EmptyState
          icon={History}
          title="Belum ada file untuk filter ini"
          description="Coba pilih filter lain atau unggah file baru ke simulasi drive."
        />
      )}

      <RenameModal
        key={renameTarget?.id}
        item={renameTarget}
        open={Boolean(renameTarget)}
        onClose={() => setRenameTarget(null)}
        onSubmit={handleRename}
      />
      <FileDetailModal
        item={detailTarget}
        open={Boolean(detailTarget)}
        onClose={() => setDetailTarget(null)}
      />
    </div>
  )
}

export default Recent
