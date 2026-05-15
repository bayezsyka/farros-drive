import { FolderPlus, FolderSearch, Upload } from 'lucide-react'
import { useEffect, useRef, useState } from 'react'
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
import { buildBreadcrumbItems, normalizeVirtualPath } from '../lib/driveAdapter'

function Files() {
  const {
    addFiles,
    backend,
    createFolder,
    downloadUrlForPath,
    getItemByPath,
    getItemsByPath,
    isServerMode,
    isSyncing,
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

  const currentPath = normalizeVirtualPath(params.get('path') || '/')

  useEffect(() => {
    if (currentPath === '/' || isSyncing) {
      return
    }

    const currentFolder = getItemByPath(currentPath)
    if (!currentFolder || currentFolder.type !== 'folder') {
      setParams({})
    }
  }, [currentPath, getItemByPath, isSyncing, setParams])

  const breadcrumbs = buildBreadcrumbItems(currentPath)
  const visibleItems = keyword ? searchItems(keyword, currentPath) : getItemsByPath(currentPath)

  const openFolder = (folderPath) => {
    const normalizedTargetPath = folderPath ? normalizeVirtualPath(folderPath) : '/'
    setParams(normalizedTargetPath === '/' ? {} : { path: normalizedTargetPath })
  }

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
      await moveToTrash(item.path)
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

    await createFolder(name, currentPath)
    setIsCreateOpen(false)
    await Swal.fire({
      title: 'Folder berhasil dibuat',
      text: backend.connected
        ? `${name} sudah dibuat di storage server.`
        : `${name} sudah masuk ke simulasi drive.`,
      icon: 'success',
      confirmButtonColor: '#0c253b',
    })
  }

  const handleAddFiles = async (fileList) => {
    if (!fileList?.length) {
      return
    }

    await addFiles(fileList, currentPath)
    await Swal.fire({
      title: backend.connected
        ? 'Berkas berhasil diunggah ke storage server'
        : 'Berkas berhasil ditambahkan ke simulasi drive',
      text: backend.connected
        ? 'File asli sudah ditulis ke storage root aktif.'
        : 'Metadata file disimpan di state lokal dan belum tersimpan ke /srv/drive.',
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

    await renameItem(renameTarget.path, name)
    setRenameTarget(null)
    await Swal.fire({
      title: 'Nama berhasil diperbarui',
      icon: 'success',
      confirmButtonColor: '#0c253b',
    })
  }

  const handleDummyDownload = async (item) => {
    if (isServerMode) {
      const url = downloadUrlForPath(item.path)

      if (url) {
        window.open(url, '_blank', 'noopener,noreferrer')
        return
      }
    }

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
        <Breadcrumb items={breadcrumbs} onNavigate={openFolder} />
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
        <div className="flex flex-wrap gap-2">
          <span className="rounded-full bg-white px-3 py-2 text-xs font-semibold text-farros-ink">
            Folder aktif: {currentPath}
          </span>
          <span className="rounded-full bg-white px-3 py-2 text-xs font-semibold text-farros-ink">
            {backend.connected ? 'Tersambung ke server' : 'Mode simulasi'}
          </span>
          {isSyncing ? (
            <span className="rounded-full bg-farros-mist px-3 py-2 text-xs font-semibold text-farros-ink">
              Menyegarkan data...
            </span>
          ) : null}
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
                  onOpen={() => openFolder(item.path)}
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
                onOpen={item.type === 'folder' ? () => openFolder(item.path) : undefined}
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
