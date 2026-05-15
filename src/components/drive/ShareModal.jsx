import { Copy, Link2, Trash2 } from 'lucide-react'
import { useMemo, useState } from 'react'
import Modal from '../ui/Modal'
import Button from '../ui/Button'

function ShareModal({ item, onClose, onCreate, onRevoke, open, shares }) {
  const [latestLink, setLatestLink] = useState('')
  const [error, setError] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)

  const relatedShares = useMemo(
    () => shares.filter((share) => share.path === item?.path),
    [item?.path, shares],
  )

  const handleCreate = async () => {
    if (!item) {
      return
    }

    setIsSubmitting(true)
    setError('')

    try {
      const response = await onCreate({
        path: item.path,
        allowDownload: true,
        expiresAt: null,
      })
      setLatestLink(response.url)
    } catch (createError) {
      setError(createError.message)
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleCopy = async (url) => {
    await navigator.clipboard.writeText(url)
    setLatestLink(url)
  }

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={item ? `Bagikan ${item.name}` : 'Bagikan'}
      description="Link publik hanya baca"
    >
      <div className="space-y-4">
        <div className="rounded-[24px] border border-black/5 bg-farros-mist/55 px-4 py-4">
          <div className="flex flex-wrap gap-2">
            <Button onClick={handleCreate} disabled={!item || isSubmitting}>
              <Link2 size={16} />
              {isSubmitting ? 'Membuat...' : 'Buat link'}
            </Button>
            {latestLink ? (
              <Button variant="subtle" onClick={() => handleCopy(latestLink)}>
                <Copy size={16} />
                Salin link
              </Button>
            ) : null}
          </div>
          {latestLink ? <p className="mt-3 break-all text-sm text-farros-ink">{latestLink}</p> : null}
          {error ? <p className="mt-3 text-sm text-red-600">{error}</p> : null}
        </div>

        <div className="space-y-3">
          <h4 className="text-sm font-semibold uppercase tracking-[0.12em] text-farros-ink">Link aktif</h4>
          {relatedShares.length ? (
            relatedShares.map((share) => (
              <div key={share.token} className="rounded-[24px] border border-black/5 bg-white/80 px-4 py-4">
                <p className="break-all text-sm text-farros-navy">{share.url}</p>
                <div className="mt-3 flex flex-wrap gap-2">
                  <Button variant="subtle" size="sm" onClick={() => handleCopy(share.url)}>
                    <Copy size={15} />
                    Salin
                  </Button>
                  <Button variant="danger" size="sm" onClick={() => onRevoke(share.token)}>
                    <Trash2 size={15} />
                    Cabut
                  </Button>
                </div>
              </div>
            ))
          ) : (
            <p className="text-sm text-farros-ink">Belum ada link.</p>
          )}
        </div>
      </div>
    </Modal>
  )
}

export default ShareModal
