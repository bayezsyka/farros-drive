import { RotateCcw, Trash2 } from 'lucide-react'
import { useState } from 'react'
import Swal from 'sweetalert2'
import FileDetailModal from '../components/drive/FileDetailModal'
import Button from '../components/ui/Button'
import Card from '../components/ui/Card'
import EmptyState from '../components/ui/EmptyState'
import { useDriveStore } from '../hooks/useDriveStore'
import { formatDateTime } from '../lib/formatters'

function Trash() {
  const { deleteForever, getTrashItems, restoreItem } = useDriveStore()
  const [detailTarget, setDetailTarget] = useState(null)
  const trashItems = getTrashItems()

  const handleRestore = async (item) => {
    restoreItem(item.id)
    await Swal.fire({
      title: 'Item berhasil dipulihkan',
      text: `${item.name} kembali ke lokasi sebelumnya.`,
      icon: 'success',
      confirmButtonColor: '#0c253b',
    })
  }

  const handleDeleteForever = async (item) => {
    const result = await Swal.fire({
      title: `Hapus permanen "${item.name}"?`,
      text: 'Aksi ini tidak bisa dibatalkan.',
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#b91c1c',
      confirmButtonText: 'Hapus permanen',
      cancelButtonText: 'Batal',
    })

    if (result.isConfirmed) {
      deleteForever(item.id)
      await Swal.fire({
        title: 'Item dihapus permanen',
        icon: 'success',
        confirmButtonColor: '#0c253b',
      })
    }
  }

  if (!trashItems.length) {
    return (
      <EmptyState
        icon={Trash2}
        title="Sampah masih kosong"
        description="Item yang Anda hapus dari halaman berkas akan muncul di sini untuk dipulihkan atau dihapus permanen."
      />
    )
  }

  return (
    <div className="space-y-4">
      {trashItems.map((item) => (
        <Card key={item.id} className="p-5">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
            <div>
              <p className="text-lg font-semibold text-farros-navy">{item.name}</p>
              <p className="mt-1 text-sm text-farros-ink">{item.path}</p>
              <p className="mt-3 text-sm text-farros-ink">Dipindahkan ke sampah pada {formatDateTime(item.deletedAt)}</p>
            </div>
            <div className="flex flex-wrap gap-3">
              <Button variant="ghost" onClick={() => setDetailTarget(item)}>
                Detail
              </Button>
              <Button variant="secondary" onClick={() => handleRestore(item)}>
                <RotateCcw size={16} />
                Pulihkan
              </Button>
              <Button variant="danger" onClick={() => handleDeleteForever(item)}>
                <Trash2 size={16} />
                Hapus Permanen
              </Button>
            </div>
          </div>
        </Card>
      ))}

      <FileDetailModal
        item={detailTarget}
        open={Boolean(detailTarget)}
        onClose={() => setDetailTarget(null)}
      />
    </div>
  )
}

export default Trash
