import { useEffect, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  Bars3Icon,
  BellIcon,
  UserCircleIcon,
  ArrowRightOnRectangleIcon,
  ChevronDownIcon,
} from '@heroicons/react/24/outline'
import { useAuthStore } from '../../store/useAuthStore.js'
import ThemeToggle from '../ThemeToggle.jsx'

export default function Navbar({ onMenuClick }) {
  const { user, logout } = useAuthStore()
  const navigate = useNavigate()
  const [menuOpen, setMenuOpen] = useState(false)
  const menuRef = useRef(null)

  // Cerrar el menú al hacer clic fuera
  useEffect(() => {
    const onClick = (e) => menuRef.current && !menuRef.current.contains(e.target) && setMenuOpen(false)
    document.addEventListener('mousedown', onClick)
    return () => document.removeEventListener('mousedown', onClick)
  }, [])

  const handleLogout = () => {
    logout()
    navigate('/login', { replace: true })
  }

  const nombre = user?.nombre ?? user?.usuario ?? 'Usuario'
  const rol = user?.rol?.nombre ?? user?.rol ?? ''

  return (
    <header className="navbar">
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
            <div className="dropdown">
              <div className="px-4 py-3 sm:hidden border-b" style={{ borderColor: 'var(--border)' }}>
                <p className="text-sm font-medium">{nombre}</p>
                {rol && <p className="text-xs text-muted">{rol}</p>}
              </div>
              <button id="navbar-logout" onClick={handleLogout} className="dropdown-item text-red-500">
                <ArrowRightOnRectangleIcon className="h-5 w-5" />
                Cerrar sesión
              </button>
            </div>
          )}
        </div>
      </div>
    </header>
  )
}
