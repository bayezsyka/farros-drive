import { ArrowLeft, Download, FileText, Folder } from 'lucide-react'
import { useEffect, useState } from 'react'
import { useParams, useSearchParams } from 'react-router-dom'
import FilePreviewModal from '../components/drive/FilePreviewModal'
import { useDriveStore } from '../hooks/useDriveStore'
import { buildBreadcrumbItems, normalizeVirtualPath } from '../lib/driveAdapter'
import { getPreviewKind } from '../lib/fileUtils'
import { formatBytes, formatDateTime } from '../lib/formatters'

function PublicShare() {
  const { token } = useParams()
  const [params, setParams] = useSearchParams()
  const {
    loadPublicShare,
    previewTextPublic,
    publicDownloadUrlForPath,
    publicPreviewUrlForPath,
  } = useDriveStore()
  const [shareData, setShareData] = useState(null)
  const [textPreview, setTextPreview] = useState('')
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [previewTarget, setPreviewTarget] = useState(null)

  const currentPath = normalizeVirtualPath(params.get('path') || '/')

  useEffect(() => {
    let cancelled = false

    const fetchShare = async () => {
      setLoading(true)
      setError('')

      try {
        const payload = await loadPublicShare(token, currentPath)
        if (!cancelled) {
          setShareData(payload)
        }
      } catch (fetchError) {
        if (!cancelled) {
          setError(fetchError.message)
        }
      } finally {
        if (!cancelled) {
          setLoading(false)
        }
      }
    }

    fetchShare()

    return () => {
      cancelled = true
    }
  }, [currentPath, loadPublicShare, token])

  useEffect(() => {
    let cancelled = false

    const item = shareData?.item
    if (!item || getPreviewKind(item) !== 'text') {
      return undefined
    }

    const fetchText = async () => {
      try {
        const content = await previewTextPublic(token, item.path)
        if (!cancelled) {
          setTextPreview(content)
        }
      } catch {
        if (!cancelled) {
          setTextPreview('')
        }
      }
    }

    fetchText()

    return () => {
      cancelled = true
    }
  }, [previewTextPublic, shareData?.item, token])

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center px-6">
        <div className="panel-surface w-full max-w-md rounded-[32px] px-8 py-10 text-center">
          <h1 className="font-serif text-3xl text-farros-navy">Farros Drive</h1>
          <p className="mt-3 text-sm text-farros-ink">Memuat tautan...</p>
        </div>
      </div>
    )
  }

  if (error || !shareData) {
    return (
      <div className="flex min-h-screen items-center justify-center px-6">
        <div className="panel-surface w-full max-w-md rounded-[32px] px-8 py-10 text-center">
          <h1 className="font-serif text-3xl text-farros-navy">Farros Drive</h1>
          <p className="mt-3 text-sm text-farros-ink">{error || 'Tautan tidak ditemukan.'}</p>
        </div>
      </div>
    )
  }

  const breadcrumbs = buildBreadcrumbItems(shareData.currentPath || '/')
  const inlineItem = shareData.item
  const previewKind = inlineItem ? getPreviewKind(inlineItem) : 'other'

  return (
    <div className="min-h-screen px-4 py-6 sm:px-6">
      <div className="mx-auto max-w-5xl space-y-4">
        <div className="rounded-[30px] border border-black/5 bg-white/85 px-5 py-5 shadow-sm">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <p className="text-sm font-semibold uppercase tracking-[0.14em] text-farros-ink">Farros Drive</p>
              <h1 className="mt-2 text-2xl font-semibold text-farros-navy">{shareData.name}</h1>
              <p className="mt-1 text-sm text-farros-ink">{shareData.type === 'folder' ? 'Folder publik' : 'File publik'}</p>
            </div>
            {shareData.allowDownload && inlineItem ? (
              <a
                href={publicDownloadUrlForPath(token, inlineItem.path)}
                target="_blank"
                rel="noreferrer"
                className="inline-flex h-11 items-center gap-2 rounded-2xl bg-farros-navy px-4 text-sm font-semibold text-farros-ivory"
              >
                <Download size={16} />
                Download
              </a>
            ) : null}
          </div>
        </div>

        {inlineItem ? (
          <section className="panel-surface rounded-[30px] px-5 py-5">
            <div className="mb-4 flex flex-wrap gap-3 text-sm text-farros-ink">
              <span>{formatBytes(inlineItem.size)}</span>
              <span>{formatDateTime(inlineItem.updatedAt)}</span>
            </div>
            <div className="min-h-[320px] rounded-[24px] border border-black/5 bg-farros-mist/35 p-4">
              {previewKind === 'image' ? (
                <img src={publicPreviewUrlForPath(token, inlineItem.path)} alt={inlineItem.name} className="mx-auto max-h-[70vh] rounded-2xl object-contain" />
              ) : null}
              {previewKind === 'pdf' ? (
                <iframe title={inlineItem.name} src={publicPreviewUrlForPath(token, inlineItem.path)} className="h-[70vh] w-full rounded-2xl bg-white" />
              ) : null}
              {previewKind === 'video' ? (
                <video src={publicPreviewUrlForPath(token, inlineItem.path)} controls className="h-[70vh] w-full rounded-2xl bg-black" />
              ) : null}
              {previewKind === 'audio' ? (
                <div className="flex h-full min-h-[220px] items-center justify-center">
                  <audio src={publicPreviewUrlForPath(token, inlineItem.path)} controls className="w-full max-w-xl" />
                </div>
              ) : null}
              {previewKind === 'text' ? (
                <pre className="overflow-auto rounded-2xl bg-white p-4 text-sm leading-6 text-farros-navy whitespace-pre-wrap">
                  <code>{textPreview}</code>
                </pre>
              ) : null}
              {['image', 'pdf', 'video', 'audio', 'text'].includes(previewKind) ? null : (
                <div className="flex min-h-[220px] flex-col items-center justify-center gap-2 text-center">
                  <FileText className="text-farros-ink" size={28} />
                  <p className="text-sm text-farros-ink">Preview tidak tersedia.</p>
                </div>
              )}
            </div>
          </section>
        ) : null}

        {shareData.type === 'folder' ? (
          <section className="panel-surface rounded-[30px] px-5 py-5">
            <div className="flex flex-wrap items-center gap-2 text-sm text-farros-ink">
              <button
                type="button"
                onClick={() => setParams({})}
                className="inline-flex items-center gap-2 rounded-full bg-farros-mist px-3 py-2 text-sm"
              >
                <ArrowLeft size={14} />
                Root
              </button>
              {breadcrumbs.map((item) => (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => setParams(item.id === '/' ? {} : { path: item.id })}
                  className="rounded-full bg-farros-mist px-3 py-2 text-sm"
                >
                  {item.name}
                </button>
              ))}
            </div>
            <div className="mt-4 space-y-3">
              {(shareData.items || []).map((item) => (
                <div key={item.id} className="rounded-[24px] border border-black/5 bg-white/80 px-4 py-4">
                  <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
                    <button
                      type="button"
                      onClick={() => (item.type === 'folder' ? setParams({ path: item.path }) : setPreviewTarget(item))}
                      className="flex min-w-0 items-center gap-3 text-left"
                    >
                      <div className={`rounded-2xl p-3 ${item.type === 'folder' ? 'bg-farros-mist text-farros-navy' : 'bg-farros-navy text-farros-ivory'}`}>
                        <Folder size={18} />
                      </div>
                      <div className="min-w-0">
                        <p className="truncate font-semibold text-farros-navy">{item.name}</p>
                        <p className="text-sm text-farros-ink">{item.type === 'folder' ? 'Folder' : formatBytes(item.size)}</p>
                      </div>
                    </button>
                    <div className="flex flex-wrap gap-2">
                      {item.type === 'file' ? (
                        <button
                          type="button"
                          onClick={() => setPreviewTarget(item)}
                          className="inline-flex h-10 items-center rounded-2xl bg-farros-mist px-4 text-sm font-semibold text-farros-navy"
                        >
                          Preview
                        </button>
                      ) : null}
                      {shareData.allowDownload && item.type === 'file' ? (
                        <a
                          href={publicDownloadUrlForPath(token, item.path)}
                          target="_blank"
                          rel="noreferrer"
                          className="inline-flex h-10 items-center rounded-2xl bg-farros-navy px-4 text-sm font-semibold text-farros-ivory"
                        >
                          Download
                        </a>
                      ) : null}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </section>
        ) : null}
      </div>

      <FilePreviewModal
        item={previewTarget}
        open={Boolean(previewTarget)}
        onClose={() => setPreviewTarget(null)}
        previewUrl={previewTarget ? publicPreviewUrlForPath(token, previewTarget.path) : null}
        downloadUrl={previewTarget && shareData.allowDownload ? publicDownloadUrlForPath(token, previewTarget.path) : null}
        loadText={(itemPath) => previewTextPublic(token, itemPath)}
      />
    </div>
  )
}

export default PublicShare
