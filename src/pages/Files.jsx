import { FolderPlus, FolderSearch, Upload } from 'lucide-react'
import { useEffect, useMemo, useRef, useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import Swal from 'sweetalert2'
import Breadcrumb from '../components/drive/Breadcrumb'
import CreateFolderModal from '../components/drive/CreateFolderModal'
import FileCard from '../components/drive/FileCard'
import FileDetailModal from '../components/drive/FileDetailModal'
import FileRow from '../components/drive/FileRow'
import FolderCard from '../components/drive/FolderCard'
import RenameModal from '../components/drive/RenameModal'
import UploadDropzone from '../components/drive/UploadDropzone'
import ViewToggle from '../components/drive/ViewToggle'
import Button from '../components/ui/Button'
import EmptyState from '../components/ui/EmptyState'
import SearchInput from '../components/ui/SearchInput'
import { useDriveStore } from '../hooks/useDriveStore'
import { getBreadcrumbTrail } from '../lib/fileUtils'

function Files() {
  const {
    addFiles,
    createFolder,
    getItemById,
    getItemsByParent,
    items,
    moveToTrash,
    renameItem,
    searchItems,
  } = useDriveStore()
  const [params, setParams] = useSearchParams()
  const [keyword, setKeyword] = useState('')
  const [view, setView] = useState('grid')
  const [isCreateOpen, setIsCreateOpen] = useState(false)
  const [renameTarget, setRenameTarget] = useState(null)
  const [detailTarget, setDetailTarget] = useState(null)
  const uploadInputRef = useRef(null)

  const currentFolderId = params.get('folder')
  const currentFolder = currentFolderId ? getItemById(currentFolderId) : null

  useEffect(() => {
    if (currentFolderId && (!currentFolder || currentFolder.deletedAt || currentFolder.type !== 'folder')) {
      setParams({})
    }
  }, [currentFolder, currentFolderId, setParams])

  const breadcrumbs = useMemo(
    () => getBreadcrumbTrail(items, currentFolderId),
    [items, currentFolderId],
  )
  const visibleItems = keyword
    ? searchItems(keyword, currentFolderId)
    : getItemsByParent(currentFolderId)

  const openFolder = (folderId) => setParams({ folder: folderId })

  const confirmTrash = async (item) => {
    const result = await Swal.fire({
      title: `Pindahkan "${item.name}" ke Sampah?`,
      text: 'Item tidak langsung dihapus permanen dan masih bisa dipulihkan.',
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#0c253b',
      cancelButtonColor: '#97ad82',
      confirmButtonText: 'Ya, pindahkan',
      cancelButtonText: 'Batal',
    })

    if (result.isConfirmed) {
      moveToTrash(item.id)
      await Swal.fire({
        title: 'Berhasil dipindahkan',
        text: `${item.name} sekarang ada di area Sampah.`,
        icon: 'success',
        confirmButtonColor: '#0c253b',
      })
    }
  }

  const handleCreateFolder = async (name) => {
    if (!name.trim()) {
      await Swal.fire({
        title: 'Nama folder wajib diisi',
        icon: 'error',
        confirmButtonColor: '#0c253b',
      })
      return
    }

    createFolder(name, currentFolderId)
    setIsCreateOpen(false)
    await Swal.fire({
      title: 'Folder berhasil dibuat',
      text: `${name} sudah masuk ke simulasi drive.`,
      icon: 'success',
      confirmButtonColor: '#0c253b',
    })
  }

  const handleAddFiles = async (fileList) => {
    if (!fileList?.length) {
      return
    }

    addFiles(fileList, currentFolderId)
    await Swal.fire({
      title: 'Berkas berhasil ditambahkan ke simulasi drive',
      text: 'Metadata file disimpan di state lokal dan belum tersimpan ke /srv/drive.',
      icon: 'success',
      confirmButtonColor: '#0c253b',
    })
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

    renameItem(renameTarget.id, name)
    setRenameTarget(null)
    await Swal.fire({
      title: 'Nama berhasil diperbarui',
      icon: 'success',
      confirmButtonColor: '#0c253b',
    })
  }

  const handleDummyDownload = async (item) => {
    await Swal.fire({
      title: 'Download dummy dimulai',
      text: `${item.name} belum diunduh sungguhan karena backend belum tersedia.`,
      icon: 'success',
      confirmButtonColor: '#0c253b',
    })
  }

  return (
    <div className="space-y-6">
      <div className="space-y-4">
        <Breadcrumb items={breadcrumbs} onNavigate={(folderId) => setParams(folderId ? { folder: folderId } : {})} />
        <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
          <div className="w-full lg:max-w-md">
            <SearchInput value={keyword} onChange={setKeyword} />
          </div>
          <div className="flex flex-wrap gap-3">
            <Button variant="primary" onClick={() => uploadInputRef.current?.click()}>
              <Upload size={16} />
              Upload Berkas
            </Button>
            <Button variant="secondary" onClick={() => setIsCreateOpen(true)}>
              <FolderPlus size={16} />
              Buat Folder
            </Button>
            <ViewToggle value={view} onChange={setView} />
          </div>
        </div>
      </div>

      <UploadDropzone onFiles={handleAddFiles} inputRef={uploadInputRef} />

      {visibleItems.length ? (
        view === 'grid' ? (
          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
            {visibleItems.map((item) =>
              item.type === 'folder' ? (
                <FolderCard
                  key={item.id}
                  item={item}
                  onOpen={() => openFolder(item.id)}
                  onDetail={() => setDetailTarget(item)}
                  onRename={() => setRenameTarget(item)}
                  onDownload={() => handleDummyDownload(item)}
                  onDelete={() => confirmTrash(item)}
                />
              ) : (
                <FileCard
                  key={item.id}
                  item={item}
                  onDetail={() => setDetailTarget(item)}
                  onRename={() => setRenameTarget(item)}
                  onDownload={() => handleDummyDownload(item)}
                  onDelete={() => confirmTrash(item)}
                />
              ),
            )}
          </div>
        ) : (
          <div className="space-y-3">
            {visibleItems.map((item) => (
              <FileRow
                key={item.id}
                item={item}
                clickable={item.type === 'folder'}
                onOpen={item.type === 'folder' ? () => openFolder(item.id) : undefined}
                onDetail={() => setDetailTarget(item)}
                onRename={() => setRenameTarget(item)}
                onDownload={() => handleDummyDownload(item)}
                onDelete={() => confirmTrash(item)}
              />
            ))}
          </div>
        )
      ) : (
        <EmptyState
          icon={FolderSearch}
          title="Belum ada item di folder ini"
          description="Coba upload berkas baru, buat folder, atau ubah kata kunci pencarian agar hasilnya muncul."
          action={
            <div className="flex flex-wrap justify-center gap-3">
              <Button variant="primary" onClick={() => uploadInputRef.current?.click()}>
                Upload Berkas
              </Button>
              <Button variant="secondary" onClick={() => setIsCreateOpen(true)}>
                Buat Folder
              </Button>
            </div>
          }
        />
      )}

      <CreateFolderModal
        open={isCreateOpen}
        onClose={() => setIsCreateOpen(false)}
        onSubmit={handleCreateFolder}
      />
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

export default Files
