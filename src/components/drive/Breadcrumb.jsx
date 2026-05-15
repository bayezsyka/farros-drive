import { ChevronRight, Home } from 'lucide-react'

function Breadcrumb({ items, onNavigate }) {
  return (
    <div className="flex flex-wrap items-center gap-2 text-sm text-farros-ink">
      <button
        type="button"
        onClick={() => onNavigate(null)}
        className="inline-flex items-center gap-2 rounded-full bg-white px-3 py-2 transition hover:bg-farros-mist"
      >
        <Home size={15} />
        <span>Root</span>
      </button>
      {items.map((item) => (
        <div key={item.id} className="flex items-center gap-2">
          <ChevronRight size={15} />
          <button
            type="button"
            onClick={() => onNavigate(item.id)}
            className="rounded-full bg-white px-3 py-2 transition hover:bg-farros-mist"
          >
            {item.name}
          </button>
        </div>
      ))}
    </div>
  )
}

export default Breadcrumb
