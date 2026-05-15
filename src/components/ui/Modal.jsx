import { useEffect } from 'react'
import { X } from 'lucide-react'

function Modal({ children, onClose, open, title, description }) {
  useEffect(() => {
    if (!open) {
      return undefined
    }

    const handleKeyDown = (event) => {
      if (event.key === 'Escape') {
        onClose()
      }
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [onClose, open])

  if (!open) {
    return null
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-farros-navy/30 px-4 py-6 backdrop-blur-sm">
      <div className="panel-surface max-h-[90vh] w-full max-w-xl overflow-hidden">
        <div className="flex items-start justify-between border-b px-6 py-5">
          <div className="space-y-1">
            <h3 className="text-xl font-semibold text-farros-navy">{title}</h3>
            {description ? <p className="text-sm text-farros-ink">{description}</p> : null}
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-full p-2 text-farros-ink transition hover:bg-farros-mist"
            aria-label="Tutup modal"
          >
            <X size={18} />
          </button>
        </div>
        <div className="max-h-[calc(90vh-88px)] overflow-y-auto px-6 py-5">{children}</div>
      </div>
    </div>
  )
}

export default Modal
