import clsx from 'clsx'
import { NavLink } from 'react-router-dom'

function MobileNav({ items }) {
  return (
    <nav className="fixed inset-x-4 bottom-4 z-40 rounded-[28px] border border-white/90 bg-white/94 p-2 shadow-[0_20px_45px_-28px_rgba(12,37,59,0.35)] backdrop-blur xl:hidden">
      <div className="grid grid-cols-5 gap-1">
        {items.map((item) => (
          <NavLink
            key={item.to}
            to={item.to}
            className={({ isActive }) =>
              clsx(
                'flex flex-col items-center gap-1 rounded-2xl px-2 py-2 text-[11px] font-semibold transition',
                isActive ? 'bg-farros-navy text-farros-ivory' : 'text-farros-ink hover:bg-farros-mist',
              )
            }
          >
            <item.icon size={17} />
            <span>{item.label}</span>
          </NavLink>
        ))}
      </div>
    </nav>
  )
}

export default MobileNav
