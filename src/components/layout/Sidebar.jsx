import clsx from 'clsx'
import { HardDrive, LogOut } from 'lucide-react'
import { NavLink } from 'react-router-dom'
import { useDriveStore } from '../../hooks/useDriveStore'

function Sidebar({ items }) {
  const { logout } = useDriveStore()

  return (
    <aside className="group sticky top-0 hidden h-screen w-[68px] flex-col border-r border-black/8 bg-white/80 py-5 backdrop-blur-xl transition-[width] duration-300 ease-in-out hover:w-56 xl:flex">

      {/* Logo */}
      <div className="flex h-10 w-full flex-shrink-0 items-center overflow-hidden">
        <div className="flex w-[68px] flex-shrink-0 items-center justify-center">
          <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-farros-navy text-farros-ivory shadow-sm">
            <HardDrive size={18} />
          </div>
        </div>
        <span className="whitespace-nowrap font-serif text-lg text-farros-navy opacity-0 transition-opacity duration-200 group-hover:opacity-100">
          Farros Drive
        </span>
      </div>

      <div className="my-4 h-px w-full bg-black/5" />

      {/* Nav Items */}
      <nav className="flex flex-1 flex-col gap-1 px-2.5">
        {items.map((item) => (
          <NavLink
            key={item.to}
            to={item.to}
            className={({ isActive }) =>
              clsx(
                'flex h-10 w-full items-center overflow-hidden rounded-xl transition-all duration-200',
                isActive
                  ? 'bg-farros-navy text-white'
                  : 'text-farros-ink hover:bg-black/5',
              )
            }
          >
            {/* Icon always centered in a fixed-width slot */}
            <span className="flex w-[44px] flex-shrink-0 items-center justify-center">
              <item.icon size={18} />
            </span>
            <span className="whitespace-nowrap text-sm font-semibold opacity-0 transition-opacity duration-200 group-hover:opacity-100">
              {item.label}
            </span>
          </NavLink>
        ))}
      </nav>

      {/* Logout */}
      <div className="px-2.5">
        <button
          type="button"
          onClick={logout}
          className="flex h-10 w-full items-center overflow-hidden rounded-xl text-red-500 transition-all duration-200 hover:bg-red-50"
        >
          <span className="flex w-[44px] flex-shrink-0 items-center justify-center">
            <LogOut size={18} />
          </span>
          <span className="whitespace-nowrap text-sm font-semibold opacity-0 transition-opacity duration-200 group-hover:opacity-100">
            Keluar
          </span>
        </button>
      </div>

    </aside>
  )
}

export default Sidebar
