import { Download, Eye, MoreHorizontal, Pencil, Trash2 } from 'lucide-react'
import { useEffect, useRef, useState } from 'react'

function MenuButton({ icon: Icon, label, onClick, danger = false }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`flex w-full items-center gap-3 rounded-2xl px-3 py-2 text-sm transition ${
        danger
          ? 'text-red-600 hover:bg-red-50'
          : 'text-farros-ink hover:bg-farros-mist'
      }`}
    >
      <Icon size={16} />
      <span>{label}</span>
    </button>
  )
}

function ActionMenu({ onDelete, onDetail, onDownload, onRename }) {
  const [open, setOpen] = useState(false)
  const ref = useRef(null)

  useEffect(() => {
    const handleClick = (event) => {
      if (ref.current && !ref.current.contains(event.target)) {
        setOpen(false)
      }
    }

    window.addEventListener('mousedown', handleClick)
    return () => window.removeEventListener('mousedown', handleClick)
  }, [])

  const handleAction = (callback) => {
    callback()
    setOpen(false)
  }

  return (
    <div ref={ref} className="relative">
      <button
        type="button"
        onClick={() => setOpen((value) => !value)}
        className="rounded-full p-2 text-farros-ink transition hover:bg-farros-mist"
        aria-label="Buka menu aksi"
      >
        <MoreHorizontal size={18} />
      </button>
      {open ? (
        <div className="absolute right-0 top-11 z-20 w-44 rounded-3xl border bg-white p-2 shadow-[0_20px_45px_-28px_rgba(12,37,59,0.35)]">
          <MenuButton icon={Eye} label="Detail" onClick={() => handleAction(onDetail)} />
          <MenuButton icon={Pencil} label="Rename" onClick={() => handleAction(onRename)} />
          <MenuButton icon={Download} label="Download dummy" onClick={() => handleAction(onDownload)} />
          <MenuButton icon={Trash2} label="Hapus" danger onClick={() => handleAction(onDelete)} />
        </div>
      ) : null}
    </div>
  )
}

export default ActionMenu
