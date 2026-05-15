import {
  Eye,
  Folder,
  FolderPlus,
  Grid2x2,
  HardDriveUpload,
  Link2,
  List,
  Pencil,
  Trash2,
} from 'lucide-react'
import { useEffect, useRef, useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import Breadcrumb from '../components/drive/Breadcrumb'
import CreateFolderModal from '../components/drive/CreateFolderModal'
import FilePreviewModal from '../components/drive/FilePreviewModal'
import RenameModal from '../components/drive/RenameModal'
import ShareModal from '../components/drive/ShareModal'
import UploadDropzone from '../components/drive/UploadDropzone'
import EmptyState from '../components/ui/EmptyState'
import SearchInput from '../components/ui/SearchInput'
import { useDriveStore } from '../hooks/useDriveStore'
import { buildBreadcrumbItems, normalizeVirtualPath } from '../lib/driveAdapter'
import { formatBytes, formatDateTime } from '../lib/formatters'

function ItemRow({ item, onDelete, onOpen, onRename, onShare }) {
  return (
    <div className="grid gap-3 rounded-[24px] border border-black/5 bg-white/82 px-4 py-4 shadow-sm lg:grid-cols-[minmax(0,1.6fr)_110px_170px_auto] lg:items-center">
      <button type="button" onClick={onOpen} className="flex min-w-0 items-center gap-3 text-left">
        <div className={`rounded-2xl p-3 ${item.type === 'folder' ? 'bg-farros-mist text-farros-navy' : 'bg-farros-navy text-farros-ivory'}`}>
          <Folder size={18} />
        </div>
        <div className="min-w-0">
          <p className="truncate font-semibold text-farros-navy">{item.name}</p>
          <p className="truncate text-sm text-farros-ink">{item.path}</p>
        </div>
      </button>
      <p className="text-sm text-farros-ink">{item.type === 'folder' ? '-' : formatBytes(item.size)}</p>
      <p className="text-sm text-farros-ink">{formatDateTime(item.updatedAt)}</p>
      <div className="flex flex-wrap justify-start gap-2 lg:justify-end">
        <button type="button" onClick={onOpen} className="rounded-2xl bg-farros-mist p-2.5 text-farros-navy">
          {item.type === 'folder' ? <Eye size={16} /> : <Eye size={16} />}
        </button>
        <button type="button" onClick={onShare} className="rounded-2xl bg-farros-mist p-2.5 text-farros-navy">
          <Link2 size={16} />
        </button>
        <button type="button" onClick={onRename} className="rounded-2xl bg-farros-mist p-2.5 text-farros-navy">
          <Pencil size={16} />
        </button>
        <button type="button" onClick={onDelete} className="rounded-2xl bg-red-50 p-2.5 text-red-600">
          <Trash2 size={16} />
        </button>
      </div>
    </div>
  )
}

function ItemCard({ item, onDelete, onOpen, onRename, onShare }) {
  return (
    <div className="rounded-[28px] border border-black/5 bg-white/82 px-4 py-4 shadow-sm">
      <button type="button" onClick={onOpen} className="w-full text-left">
        <div className="flex items-start justify-between gap-4">
          <div className={`rounded-3xl p-3 ${item.type === 'folder' ? 'bg-farros-mist text-farros-navy' : 'bg-farros-navy text-farros-ivory'}`}>
            <Folder size={20} />
          </div>
          <span className="rounded-full bg-farros-mist px-3 py-1 text-xs font-semibold text-farros-navy">
            {item.type === 'folder' ? 'Folder' : item.extension || 'file'}
          </span>
        </div>
        <p className="mt-5 truncate text-lg font-semibold text-farros-navy">{item.name}</p>
        <p className="mt-1 truncate text-sm text-farros-ink">{item.path}</p>
      </button>
      <div className="mt-4 flex items-center justify-between text-sm text-farros-ink">
        <span>{item.type === 'folder' ? '-' : formatBytes(item.size)}</span>
        <span>{formatDateTime(item.updatedAt)}</span>
      </div>
      <div className="mt-4 flex flex-wrap gap-2">
        <button type="button" onClick={onOpen} className="rounded-2xl bg-farros-mist px-3 py-2 text-sm font-semibold text-farros-navy">
          {item.type === 'folder' ? 'Buka' : 'Preview'}
        </button>
        <button type="button" onClick={onShare} className="rounded-2xl bg-farros-mist px-3 py-2 text-sm font-semibold text-farros-navy">
          Bagikan
        </button>
        <button type="button" onClick={onRename} className="rounded-2xl bg-farros-mist px-3 py-2 text-sm font-semibold text-farros-navy">
          Ubah
        </button>
        <button type="button" onClick={onDelete} className="rounded-2xl bg-red-50 px-3 py-2 text-sm font-semibold text-red-600">
          Hapus
        </button>
      </div>
    </div>
  )
}

function Files() {
  const {
    addFiles,
    buildBreadcrumbItems: buildStoreBreadcrumbs,
    createFolder,
    createShare,
    getItemByPath,
    getItemsByPath,
    getPreviewUrlForPath,
    isServerMode,
    isSyncing,
    moveToTrash,
    previewText,
    renameItem,
    revokeShare,
    searchItems,
    shares,
    downloadUrlForPath,
  } = useDriveStore()
  const [params, setParams] = useSearchParams()
  const [keyword, setKeyword] = useState('')
  const [view, setView] = useState('list')
  const [isCreateOpen, setIsCreateOpen] = useState(false)
  const [renameTarget, setRenameTarget] = useState(null)
  const [previewTarget, setPreviewTarget] = useState(null)
  const [shareTarget, setShareTarget] = useState(null)
  const uploadInputRef = useRef(null)

  const currentPath = normalizeVirtualPath(params.get('path') || '/')
  const breadcrumbs = buildStoreBreadcrumbs ? buildStoreBreadcrumbs(currentPath) : buildBreadcrumbItems(currentPath)
  const visibleItems = keyword ? searchItems(keyword, currentPath) : getItemsByPath(currentPath)

  useEffect(() => {
    if (currentPath === '/' || isSyncing) {
      return
    }

    const currentFolder = getItemByPath(currentPath)
    if (!currentFolder || currentFolder.type !== 'folder') {
      setParams({})
    }
  }, [currentPath, getItemByPath, isSyncing, setParams])

  const openFolder = (folderPath) => {
    const normalizedTargetPath = folderPath ? normalizeVirtualPath(folderPath) : '/'
    setParams(normalizedTargetPath === '/' ? {} : { path: normalizedTargetPath })
  }

  const handleOpenItem = (item) => {
    if (item.type === 'folder') {
      openFolder(item.path)
      return
    }

    setPreviewTarget(item)
  }

  const handleDelete = async (item) => {
    if (!window.confirm(`Pindahkan "${item.name}" ke Sampah?`)) {
      return
    }

    await moveToTrash(item.path)
  }

  const handleCreateFolder = async (name) => {
    if (!name.trim()) {
      return
    }

    await createFolder(name, currentPath)
    setIsCreateOpen(false)
  }

  const handleAddFiles = async (files) => {
    await addFiles(files, currentPath)
  }

  const handleRename = async (name) => {
    if (!renameTarget || !name.trim()) {
      return
    }

    await renameItem(renameTarget.path, name)
    setRenameTarget(null)
  }

  const previewUrl = previewTarget && isServerMode ? getPreviewUrlForPath(previewTarget.path) : null
  const downloadUrl = previewTarget && isServerMode ? downloadUrlForPath(previewTarget.path) : null
  const loadText = isServerMode ? previewText : async () => 'Preview tersedia saat backend aktif.'

  return (
    <div className="space-y-4">
      <div className="rounded-[30px] border border-black/5 bg-white/82 px-4 py-4 shadow-sm">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <div className="space-y-3">
            <Breadcrumb items={breadcrumbs} onNavigate={openFolder} />
            <div className="flex flex-wrap gap-2 text-xs text-farros-ink">
              <span className="rounded-full bg-farros-mist px-3 py-1.5">{currentPath}</span>
              {isSyncing ? <span className="rounded-full bg-farros-mist px-3 py-1.5">Memuat...</span> : null}
            </div>
          </div>
          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              onClick={() => uploadInputRef.current?.click()}
              className="inline-flex h-11 items-center gap-2 rounded-2xl bg-farros-navy px-4 text-sm font-semibold text-farros-ivory"
            >
              <HardDriveUpload size={16} />
              Upload
            </button>
            <button
              type="button"
              onClick={() => setIsCreateOpen(true)}
              className="inline-flex h-11 items-center gap-2 rounded-2xl bg-farros-mist px-4 text-sm font-semibold text-farros-navy"
            >
              <FolderPlus size={16} />
              Folder
            </button>
            <button
              type="button"
              onClick={() => setView('list')}
              className={`inline-flex h-11 items-center rounded-2xl px-3 ${view === 'list' ? 'bg-farros-navy text-farros-ivory' : 'bg-farros-mist text-farros-navy'}`}
            >
              <List size={16} />
            </button>
            <button
              type="button"
              onClick={() => setView('grid')}
              className={`inline-flex h-11 items-center rounded-2xl px-3 ${view === 'grid' ? 'bg-farros-navy text-farros-ivory' : 'bg-farros-mist text-farros-navy'}`}
            >
              <Grid2x2 size={16} />
            </button>
          </div>
        </div>
        <div className="mt-4">
          <SearchInput value={keyword} onChange={setKeyword} placeholder="Cari di folder ini" />
        </div>
      </div>

      <UploadDropzone onFiles={handleAddFiles} inputRef={uploadInputRef} />

      {visibleItems.length ? (
        view === 'list' ? (
          <div className="space-y-3">
            {visibleItems.map((item) => (
              <ItemRow
                key={item.id}
                item={item}
                onOpen={() => handleOpenItem(item)}
                onShare={() => setShareTarget(item)}
                onRename={() => setRenameTarget(item)}
                onDelete={() => handleDelete(item)}
              />
            ))}
          </div>
        ) : (
          <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
            {visibleItems.map((item) => (
              <ItemCard
                key={item.id}
                item={item}
                onOpen={() => handleOpenItem(item)}
                onShare={() => setShareTarget(item)}
                onRename={() => setRenameTarget(item)}
                onDelete={() => handleDelete(item)}
              />
            ))}
          </div>
        )
      ) : (
        <EmptyState
          icon={Folder}
          title="Folder kosong"
          description="Upload berkas atau buat folder baru."
        />
      )}

      <CreateFolderModal open={isCreateOpen} onClose={() => setIsCreateOpen(false)} onSubmit={handleCreateFolder} />
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
        previewUrl={previewUrl}
        downloadUrl={downloadUrl}
        loadText={loadText}
      />
    </div>
  )
}

export default Files
