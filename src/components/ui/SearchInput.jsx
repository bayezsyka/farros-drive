import { Search } from 'lucide-react'

function SearchInput({ value, onChange, placeholder = 'Cari berkas atau folder...' }) {
  return (
    <label className="flex h-11 items-center gap-3 rounded-2xl border bg-white px-4 text-sm shadow-sm">
      <Search size={18} className="text-farros-ink" />
      <input
        value={value}
        onChange={(event) => onChange(event.target.value)}
        placeholder={placeholder}
        className="w-full bg-transparent text-farros-navy placeholder:text-farros-ink/70"
      />
    </label>
  )
}

export default SearchInput
