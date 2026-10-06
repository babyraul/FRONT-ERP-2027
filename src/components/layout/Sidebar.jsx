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
  { to: '/dashboard',     icon: HomeIcon,             label: 'Dashboard' },
  { to: '/productos',     icon: CubeIcon,             label: 'Productos' },
  { to: '/clientes',      icon: UsersIcon,            label: 'Clientes' },
  { to: '/ventas',        icon: ShoppingCartIcon,     label: 'Ventas' },
  { to: '/usuarios',      icon: UserGroupIcon,        label: 'Usuarios' },
  { to: '/reportes',      icon: DocumentChartBarIcon, label: 'Reportes' },
  { to: '/configuracion', icon: Cog6ToothIcon,        label: 'Configuración' },
]

export default function Sidebar({ collapsed, mobileOpen, onClose }) {
  return (
    <>
      {/* Overlay mobile */}
      <div
        className={`sidebar-overlay ${mobileOpen ? 'is-visible' : ''}`}
        onClick={onClose}
        aria-hidden="true"
      />

      <aside
        id="app-sidebar"
        className={`sidebar ${collapsed ? 'is-collapsed' : ''} ${mobileOpen ? 'is-open' : ''}`}
      >
        {/* Logo */}
        <div className="sidebar-header">
          <div className="flex items-center gap-2 min-w-0">
            <span className="sidebar-logo">M</span>
            <span className="sidebar-label font-bold text-lg tracking-tight truncate">
              Sistema Market
            </span>
          </div>
          <button
            id="sidebar-close"
            onClick={onClose}
            className="icon-btn lg:hidden text-white/70 hover:text-white"
            aria-label="Cerrar menú"
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
              id={`nav-${to.slice(1)}`}
              title={collapsed ? label : undefined}
              className={({ isActive }) => `nav-link ${isActive ? 'is-active' : ''}`}
            >
              <Icon className="h-5 w-5 shrink-0" />
              <span className="sidebar-label truncate">{label}</span>
            </NavLink>
          ))}
        </nav>

        {/* Footer */}
        <div className="sidebar-footer">
          <span className="sidebar-label">
            v1.0.0 &copy; {new Date().getFullYear()} MiFacturaPeru
          </span>
        </div>
      </aside>
    </>
  )
}
