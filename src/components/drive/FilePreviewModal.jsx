import { Download, Link2 } from 'lucide-react'
import { useEffect, useState } from 'react'
import { getPreviewKind } from '../../lib/fileUtils'
import { formatBytes } from '../../lib/formatters'
import Modal from '../ui/Modal'
import Button from '../ui/Button'

function FilePreviewModal({ downloadUrl, item, loadText, onClose, onShare, open, previewUrl }) {
  const [textContent, setTextContent] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const previewKind = item ? getPreviewKind(item) : 'other'

  useEffect(() => {
    let cancelled = false

    if (!open || !item || previewKind !== 'text') {
      return undefined
    }

    const fetchText = async () => {
      setLoading(true)
      setError('')

      try {
        const content = await loadText(item.path)
        if (!cancelled) {
          setTextContent(content)
        }
      } catch (loadError) {
        if (!cancelled) {
          setError(loadError.message)
        }
      } finally {
        if (!cancelled) {
          setLoading(false)
        }
      }
    }

    fetchText()

    return () => {
      cancelled = true
    }
  }, [item, loadText, open, previewKind])

  if (!item) {
    return null
  }

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={item.name}
      description={formatBytes(item.size)}
      panelClassName="max-w-5xl"
      contentClassName="space-y-4"
    >
      <div className="flex flex-wrap gap-2">
        {downloadUrl ? (
          <a
            href={downloadUrl}
            target="_blank"
            rel="noreferrer"
            className="inline-flex h-10 items-center gap-2 rounded-2xl bg-farros-navy px-4 text-sm font-semibold text-farros-ivory"
          >
            <Download size={16} />
            Download
          </a>
        ) : null}
        {onShare ? (
          <Button variant="subtle" size="sm" onClick={onShare}>
            <Link2 size={16} />
            Bagikan
          </Button>
        ) : null}
      </div>

      <div className="min-h-[360px] rounded-[24px] border border-black/5 bg-farros-mist/35 p-4">
        {previewKind === 'image' && previewUrl ? (
          <img src={previewUrl} alt={item.name} className="mx-auto max-h-[70vh] rounded-2xl object-contain" />
        ) : null}
        {previewKind === 'pdf' && previewUrl ? (
          <iframe title={item.name} src={previewUrl} className="h-[70vh] w-full rounded-2xl bg-white" />
        ) : null}
        {previewKind === 'video' && previewUrl ? (
          <video src={previewUrl} controls className="h-[70vh] w-full rounded-2xl bg-black" />
        ) : null}
        {previewKind === 'audio' && previewUrl ? (
          <div className="flex h-full min-h-[220px] items-center justify-center">
            <audio src={previewUrl} controls className="w-full max-w-xl" />
          </div>
        ) : null}
        {previewKind === 'text' ? (
          loading ? (
            <div className="flex h-full min-h-[220px] items-center justify-center text-sm text-farros-ink">Memuat preview...</div>
          ) : error ? (
            <div className="flex h-full min-h-[220px] items-center justify-center text-sm text-red-600">{error}</div>
          ) : (
            <pre className="overflow-auto rounded-2xl bg-white p-4 text-sm leading-6 text-farros-navy whitespace-pre-wrap">
              <code>{textContent}</code>
            </pre>
          )
        ) : null}
        {previewKind === 'folder' || previewKind === 'other' || (!previewUrl && ['image', 'pdf', 'video', 'audio'].includes(previewKind)) ? (
          <div className="flex h-full min-h-[220px] flex-col items-center justify-center gap-2 text-center">
            <p className="text-base font-semibold text-farros-navy">Preview tidak tersedia</p>
            <p className="text-sm text-farros-ink">File ini bisa langsung diunduh.</p>
          </div>
        ) : null}
      </div>
    </Modal>
  )
}

export default FilePreviewModal
