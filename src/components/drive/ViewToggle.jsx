import clsx from 'clsx'
import { LayoutGrid, List } from 'lucide-react'

function ViewToggle({ value, onChange }) {
  const options = [
    { value: 'grid', icon: LayoutGrid, label: 'Grid' },
    { value: 'list', icon: List, label: 'List' },
  ]

  return (
    <div className="inline-flex rounded-2xl border bg-white p-1 shadow-sm">
      {options.map((option) => (
        <button
          key={option.value}
          type="button"
          onClick={() => onChange(option.value)}
          className={clsx(
            'inline-flex items-center gap-2 rounded-xl px-3 py-2 text-sm font-semibold transition',
            value === option.value
              ? 'bg-farros-navy text-farros-ivory'
              : 'text-farros-ink hover:bg-farros-mist',
          )}
        >
          <option.icon size={16} />
          <span className="hidden sm:inline">{option.label}</span>
        </button>
      ))}
    </div>
  )
}

export default ViewToggle
