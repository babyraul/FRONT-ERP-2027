import { useEffect, useRef, useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import {
  Bars3Icon,
  BellIcon,
  UserCircleIcon,
  ArrowRightOnRectangleIcon,
  ChevronDownIcon,
  Cog6ToothIcon
} from '@heroicons/react/24/outline'
import { useAuthStore } from '../../store/useAuthStore.js'
import ThemeToggle from '../ThemeToggle.jsx'

export default function Navbar({ onMenuClick }) {
  const { user, logout, menu } = useAuthStore()
  const navigate = useNavigate()
  const [menuOpen, setMenuOpen] = useState(false)
  const [configOpen, setConfigOpen] = useState(false)
  const menuRef = useRef(null)
  const configRef = useRef(null)

  // Cerrar el menú al hacer clic fuera
  useEffect(() => {
    const onClick = (e) => {
      if (menuRef.current && !menuRef.current.contains(e.target)) setMenuOpen(false)
      if (configRef.current && !configRef.current.contains(e.target)) setConfigOpen(false)
    }
    document.addEventListener('mousedown', onClick)
    return () => document.removeEventListener('mousedown', onClick)
  }, [])

  const handleLogout = () => {
    logout()
    navigate('/login', { replace: true })
  }

  const nombre = user?.nombre ?? user?.usuario ?? 'Usuario'
  const rol = user?.rol?.nombre ?? user?.rol ?? ''
  
  const configuracionModule = menu?.find(m => m.codigo === 'CONFIGURACION')

  return (
    <header className="navbar flex items-center justify-between">
      <button id="navbar-menu" onClick={onMenuClick} className="icon-btn" aria-label="Menú">
        <Bars3Icon className="h-5 w-5" />
      </button>

      <div className="flex items-center gap-1 sm:gap-2">
        <ThemeToggle />

        <button id="navbar-notifications" className="icon-btn relative" aria-label="Notificaciones">
          <BellIcon className="h-5 w-5" />
          <span className="absolute top-1.5 right-1.5 h-2 w-2 rounded-full bg-red-500" />
        </button>

        <div className="relative ml-1" ref={menuRef}>
          <button
            id="navbar-user-menu"
            onClick={() => setMenuOpen((o) => !o)}
            className="flex items-center gap-2 rounded-lg px-2 py-1 transition-colors hover:bg-[var(--bg)]"
          >
            <UserCircleIcon className="h-8 w-8" style={{ color: 'var(--color-secondary)' }} />
            <div className="hidden sm:block text-left">
              <p className="text-sm font-medium leading-none">{nombre}</p>
              {rol && <p className="text-xs mt-0.5 text-muted">{rol}</p>}
            </div>
            <ChevronDownIcon className="hidden sm:block h-4 w-4 text-muted" />
          </button>

          {menuOpen && (
            <div className="dropdown w-56">
              <div className="px-4 py-3 sm:hidden border-b" style={{ borderColor: 'var(--border)' }}>
                <p className="text-sm font-medium">{nombre}</p>
                {rol && <p className="text-xs text-muted">{rol}</p>}
              </div>

              {/* Submenú de Configuración dentro del perfil */}
              {configuracionModule && (
                <div className="border-b border-slate-100 dark:border-slate-800 py-1">
                  <button 
                    onClick={(e) => {
                      e.stopPropagation()
                      setConfigOpen(!configOpen)
                    }}
                    className="w-full px-4 py-2 flex items-center justify-between text-left hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors"
                  >
                    <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider flex items-center gap-1.5">
                      <Cog6ToothIcon className="h-4 w-4" />
                      Administración
                    </span>
                    <ChevronDownIcon className={`h-4 w-4 text-slate-400 transition-transform ${configOpen ? 'rotate-180' : ''}`} />
                  </button>
                  
                  <div className={`overflow-hidden transition-all duration-200 ${configOpen ? 'max-h-48' : 'max-h-0'}`}>
                    {configuracionModule.items?.map((item) => (
                      <Link
                        key={item.id}
                        to={item.ruta || `/${item.codigo.toLowerCase()}`}
                        onClick={() => {
                          setMenuOpen(false)
                          setConfigOpen(false)
                        }}
                        className="block pl-9 pr-4 py-2 text-sm text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors"
                      >
                        {item.nombre}
                      </Link>
                    ))}
                  </div>
                </div>
              )}

              <div className="py-1">
                <button id="navbar-logout" onClick={handleLogout} className="dropdown-item text-red-500 w-full text-left">
                  <ArrowRightOnRectangleIcon className="h-5 w-5" />
                  Cerrar sesión
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </header>
  )
}
