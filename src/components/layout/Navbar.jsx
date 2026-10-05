import { Bars3Icon, BellIcon, UserCircleIcon } from '@heroicons/react/24/outline'
import { useAuthStore } from '../../store/useAuthStore.js'

export default function Navbar({ onMenuClick }) {
  const { user, logout } = useAuthStore()

  return (
    <header className="h-16 bg-white border-b border-gray-200 flex items-center justify-between px-6 shrink-0">
      {/* Left */}
      <button
        onClick={onMenuClick}
        className="p-1.5 rounded-lg text-gray-500 hover:bg-gray-100"
      >
        <Bars3Icon className="h-5 w-5" />
      </button>

      {/* Right */}
      <div className="flex items-center gap-3">
        <button className="relative p-1.5 rounded-lg text-gray-500 hover:bg-gray-100">
          <BellIcon className="h-5 w-5" />
          <span className="absolute top-1 right-1 h-2 w-2 rounded-full bg-red-500" />
        </button>

        <div className="flex items-center gap-2 ml-2">
          <UserCircleIcon className="h-8 w-8 text-gray-400" />
          <div className="hidden sm:block text-right">
            <p className="text-sm font-medium text-gray-900 leading-none">
              {user?.nombre ?? 'Administrador'}
            </p>
            <p className="text-xs text-gray-500 mt-0.5">
              {user?.rol ?? 'admin'}
            </p>
          </div>
        </div>

        <button
          onClick={logout}
          className="ml-2 text-xs text-gray-500 hover:text-red-600 transition-colors"
        >
          Salir
        </button>
      </div>
    </header>
  )
}
