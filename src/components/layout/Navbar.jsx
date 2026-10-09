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
import { toast } from '../../utils/toast'
import ThemeToggle from '../ThemeToggle.jsx'

export default function Navbar({ onMenuClick }) {
  const { user, logout, menu, switchBranch } = useAuthStore()
  const navigate = useNavigate()
  const [menuOpen, setMenuOpen] = useState(false)
  const menuRef = useRef(null)
  
  // Estado para prevenir múltiples clicks al cambiar
  const [isSwitching, setIsSwitching] = useState(false)

  // Cerrar el menú al hacer clic fuera
  useEffect(() => {
    const onClick = (e) => {
      if (menuRef.current && !menuRef.current.contains(e.target)) setMenuOpen(false)
    }
    document.addEventListener('mousedown', onClick)
    return () => document.removeEventListener('mousedown', onClick)
  }, [])

  const handleLogout = () => {
    logout()
    navigate('/login', { replace: true })
  }

  const nombre = user?.nombre ?? user?.usuario ?? 'Usuario'
  // Si no es super admin, mostrar el rol del acceso activo. Si lo es, mostrar "Super Admin"
  const rol = user?.es_super_admin ? 'Super Admin' : (user?.active_acceso?.rol_nombre || '')
  const sucursalActiva = user?.es_super_admin ? 'Todas las Sucursales' : (user?.active_acceso?.sucursal_nombre || '')
  
  const configuracionModule = menu?.find(m => m.codigo === 'CONFIGURACION')

  const handleSwitchBranch = async (e) => {
    const branchId = e.target.value
    if (!branchId || branchId === user?.active_acceso?.branch_id) return
    
    setIsSwitching(true)
    const res = await switchBranch(branchId)
    setIsSwitching(false)
    
    if (res.success) {
      toast.success('Cambio de sucursal exitoso')
      // Forzar una recarga suave o redirigir al dashboard para limpiar estados locales si es necesario
      navigate('/dashboard')
    } else {
      toast.error('Error', res.message || 'No se pudo cambiar de sucursal')
    }
  }

  return (
    <header className="navbar flex items-center justify-between">
      <button id="navbar-menu" onClick={onMenuClick} className="icon-btn" aria-label="Menú">
        <Bars3Icon className="h-5 w-5" />
      </button>

      <div className="flex items-center gap-1 sm:gap-2">
        <ThemeToggle />

        {/* ── TENANT SWITCHER ── */}
        {!user?.es_super_admin && user?.accesos?.length > 1 && (
          <div className="hidden md:flex items-center mx-2">
            <select 
              className="input-field py-1 px-2 text-xs font-medium cursor-pointer max-w-[200px]"
              value={user.active_acceso?.branch_id || ''}
              onChange={handleSwitchBranch}
              disabled={isSwitching}
              title="Cambiar de Sucursal"
            >
              {user.accesos.map(acc => (
                <option key={acc.branch_id} value={acc.branch_id}>
                  {acc.sucursal_nombre} ({acc.empresa_nombre})
                </option>
              ))}
            </select>
          </div>
        )}

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
              <p className="text-sm font-bold leading-none text-slate-800 dark:text-slate-100">{nombre}</p>
              {rol && <p className="text-xs mt-0.5 text-blue-600 dark:text-blue-400 font-semibold">{rol}</p>}
              <p className="text-[10px] text-slate-500 truncate max-w-[150px]">{sucursalActiva}</p>
            </div>
            <ChevronDownIcon className="hidden sm:block h-4 w-4 text-muted" />
          </button>

          {menuOpen && (
            <div className="dropdown w-56">
              <div className="px-4 py-3 sm:hidden border-b" style={{ borderColor: 'var(--border)' }}>
                <p className="text-sm font-bold">{nombre}</p>
                {rol && <p className="text-xs font-semibold text-blue-600">{rol}</p>}
                <p className="text-[10px] text-slate-500">{sucursalActiva}</p>
                
                {/* Switcher móvil */}
                {!user?.es_super_admin && user?.accesos?.length > 1 && (
                  <select 
                    className="mt-2 input-field py-1 px-2 text-xs w-full"
                    value={user.active_acceso?.branch_id || ''}
                    onChange={handleSwitchBranch}
                    disabled={isSwitching}
                  >
                    {user.accesos.map(acc => (
                      <option key={acc.branch_id} value={acc.branch_id}>
                        {acc.sucursal_nombre}
                      </option>
                    ))}
                  </select>
                )}
              </div>

              {/* Enlace de Configuración dentro del perfil */}
              {configuracionModule && (
                <div className="border-b border-slate-100 dark:border-slate-800 py-1">
                  <Link 
                    to="/configuracion"
                    onClick={() => setMenuOpen(false)}
                    className="w-full px-4 py-2 flex items-center text-left hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors"
                  >
                    <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider flex items-center gap-1.5">
                      <Cog6ToothIcon className="h-4 w-4" />
                      Administración
                    </span>
                  </Link>
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
