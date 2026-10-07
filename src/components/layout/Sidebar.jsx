import { useState, useEffect } from 'react'
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
  BuildingOfficeIcon,
  MapPinIcon,
  Square3Stack3DIcon,
  ChevronDownIcon,
  FolderIcon
} from '@heroicons/react/24/outline'
import { useAuthStore } from '../../store/useAuthStore'
import api from '../../utils/api'

// A helper function to assign icons based on module code or name
const getIconForModule = (codigo) => {
  const code = codigo?.toUpperCase() || ''
  if (code.includes('VENTAS')) return ShoppingCartIcon
  if (code.includes('PRODUCTOS') || code.includes('CATALOGOS')) return CubeIcon
  if (code.includes('CLIENTES')) return UsersIcon
  if (code.includes('REPORTES')) return DocumentChartBarIcon
  if (code.includes('USUARIOS')) return UserGroupIcon
  if (code.includes('EMPRESAS')) return BuildingOfficeIcon
  if (code.includes('SUCURSALES')) return MapPinIcon
  if (code.includes('MODULOS') || code.includes('ADMINISTRACION')) return Square3Stack3DIcon
  if (code.includes('CONFIGURACION')) return Cog6ToothIcon
  if (code.includes('DASHBOARD') || code.includes('PRINCIPAL')) return HomeIcon
  return FolderIcon
}

export default function Sidebar({ collapsed, mobileOpen, onClose }) {
  const { user, menu } = useAuthStore()
  const [navSections, setNavSections] = useState([])
  
  // Estado para controlar qué divisiones están abiertas (por defecto todas abiertas)
  const [openSections, setOpenSections] = useState({})

  useEffect(() => {
    if (!menu) return

    // Filter out 'CONFIGURACION' from Sidebar, it goes to Navbar
    const sidebarMenu = menu.filter(m => m.codigo !== 'CONFIGURACION')

    // Map backend modules to frontend structure
    const sections = sidebarMenu.map(rootModule => ({
      id: rootModule.id,
      title: rootModule.nombre,
      iconClass: rootModule.icon,
      ruta: rootModule.ruta,
      items: (rootModule.items || []).map(child => ({
        to: child.ruta || `/${child.codigo.toLowerCase()}`,
        icon: getIconForModule(child.codigo),
        iconClass: child.icon,
        label: child.nombre
      }))
    }))

    // Ensure "Dashboard" is always there if they have basic access or add it dynamically
    const hasDashboard = sections.some(s => s.items.some(i => i.to === '/dashboard'))
    if (!hasDashboard && user) {
      sections.unshift({
        id: 'dashboard-root',
        title: 'Principal',
        items: [
          { to: '/dashboard', icon: HomeIcon, label: 'Dashboard', iconClass: 'fas fa-chart-line' }
        ]
      })
    }

    setNavSections(sections)
    
    // Open all sections by default
    const initialOpenState = {}
    sections.forEach((_, idx) => {
      initialOpenState[idx] = true
    })
    setOpenSections(initialOpenState)
  }, [menu, user])

  const toggleSection = (idx) => {
    setOpenSections(prev => ({
      ...prev,
      [idx]: !prev[idx]
    }))
  }

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
        <nav className="flex-1 px-3 py-4 overflow-y-auto">
          {!menu ? (
            <div className="text-white/50 text-xs px-3 py-2">Cargando menú...</div>
          ) : navSections.map((section, idx) => {
            const isOpen = openSections[idx] || collapsed; // Siempre visible si está colapsado para mostrar los íconos
            if (section.items.length === 0 && section.ruta) {
              // Si es un módulo sin hijos pero con ruta (ej. un link directo en la raíz)
              const Icon = getIconForModule(section.title)
              return (
                <div key={section.id || idx} className="mb-1">
                   <NavLink
                    to={section.ruta}
                    title={collapsed ? section.title : undefined}
                    className={({ isActive }) => `nav-link ${isActive ? 'is-active' : ''}`}
                   >
                     {section.iconClass ? <i className={`${section.iconClass} w-5 shrink-0 text-center text-[1.125rem]`} /> : <Icon className="h-5 w-5 shrink-0" />}
                     <span className="sidebar-label truncate">{section.title}</span>
                   </NavLink>
                </div>
              )
            }
            
            return (
              <div key={section.id || idx} className="mb-4 last:mb-0">
                {/* Título de la División (Botón Desplegable) */}
                <button
                  onClick={() => toggleSection(idx)}
                  className={`w-full flex items-center justify-between px-3 mb-1 text-xs font-semibold uppercase tracking-wider text-white/50 hover:text-white transition-all duration-300 ${
                    collapsed ? 'opacity-0 h-0 overflow-hidden m-0 p-0' : 'opacity-100'
                  }`}
                  aria-expanded={isOpen}
                >
                  <span>{section.title}</span>
                  <ChevronDownIcon
                    className={`h-3 w-3 transition-transform duration-300 ${
                      isOpen ? 'rotate-180' : ''
                    }`}
                  />
                </button>
                
                {/* Submódulos de la División */}
                <div
                  className={`grid transition-[grid-template-rows] duration-300 ease-in-out ${
                    isOpen ? 'grid-rows-[1fr]' : 'grid-rows-[0fr]'
                  }`}
                >
                  <ul className="overflow-hidden space-y-1">
                    {section.items.map(({ to, icon: Icon, iconClass, label }) => (
                      <li key={to}>
                        <NavLink
                          to={to}
                          id={`nav-${to.replace(/[^a-zA-Z0-9]/g, '-')}`}
                          title={collapsed ? label : undefined}
                          className={({ isActive }) => `nav-link ${isActive ? 'is-active' : ''}`}
                        >
                          {iconClass ? <i className={`${iconClass} w-5 shrink-0 text-center text-[1.125rem]`} /> : <Icon className="h-5 w-5 shrink-0" />}
                          <span className="sidebar-label truncate">{label}</span>
                        </NavLink>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            )
          })}
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
