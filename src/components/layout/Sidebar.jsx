import { NavLink } from 'react-router-dom'
import {
  HomeIcon,
  CubeIcon,
  UsersIcon,
  ShoppingCartIcon,
  UserGroupIcon,
  DocumentChartBarIcon,
  Cog6ToothIcon,
  XMarkIcon,
} from '@heroicons/react/24/outline'

const nav = [
  { to: '/dashboard',     icon: HomeIcon,               label: 'Dashboard' },
  { to: '/productos',     icon: CubeIcon,               label: 'Productos' },
  { to: '/clientes',      icon: UsersIcon,              label: 'Clientes' },
  { to: '/ventas',        icon: ShoppingCartIcon,       label: 'Ventas' },
  { to: '/usuarios',      icon: UserGroupIcon,          label: 'Usuarios' },
  { to: '/reportes',      icon: DocumentChartBarIcon,   label: 'Reportes' },
  { to: '/configuracion', icon: Cog6ToothIcon,          label: 'Configuración' },
]

export default function Sidebar({ open, onClose }) {
  return (
    <>
      {/* Overlay mobile */}
      {open && (
        <div
          className="fixed inset-0 z-20 bg-black/50 lg:hidden"
          onClick={onClose}
        />
      )}

      <aside
        className={`
          fixed z-30 inset-y-0 left-0 flex flex-col w-64 bg-sidebar transition-transform duration-300
          lg:static lg:translate-x-0
          ${open ? 'translate-x-0' : '-translate-x-full'}
        `}
      >
        {/* Logo */}
        <div className="flex items-center justify-between h-16 px-6 border-b border-white/10">
          <span className="text-white font-bold text-lg tracking-tight">
            🏪 Sistema Market
          </span>
          <button
            onClick={onClose}
            className="lg:hidden text-gray-400 hover:text-white"
          >
            <XMarkIcon className="h-5 w-5" />
          </button>
        </div>

        {/* Nav */}
        <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto">
          {nav.map(({ to, icon: Icon, label }) => (
            <NavLink
              key={to}
              to={to}
              className={({ isActive }) =>
                `flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${
                  isActive
                    ? 'bg-primary-600 text-white'
                    : 'text-gray-300 hover:bg-white/10 hover:text-white'
                }`
              }
            >
              <Icon className="h-5 w-5 shrink-0" />
              {label}
            </NavLink>
          ))}
        </nav>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-white/10 text-xs text-gray-500">
          v1.0.0 &copy; {new Date().getFullYear()} MiFacturaPeru
        </div>
      </aside>
    </>
  )
}
