import { useEffect, useMemo, useRef, useState } from 'react'
import { createPortal } from 'react-dom'
import { useNavigate, useLocation, Link } from 'react-router-dom'
import {
  Bars3Icon,
  ArrowRightOnRectangleIcon,
  ChevronDownIcon,
  ChevronRightIcon,
  Cog6ToothIcon,
  MagnifyingGlassIcon
} from '@heroicons/react/24/outline'
import { useAuthStore } from '../../store/useAuthStore.js'
import { toast } from '../../utils/toast'
import ThemeToggle from '../ThemeToggle.jsx'
import { buildNavData, resolveBreadcrumb } from './menuUtils.js'
import { NotificacionesBell } from '../../modules/notificaciones'

export default function Navbar({ onMenuClick }) {
  const { user, logout, menu, switchBranch } = useAuthStore()
  const navigate = useNavigate()
  const { pathname } = useLocation()

  const [menuOpen, setMenuOpen] = useState(false)
  const [isSwitching, setIsSwitching] = useState(false)
  const menuRef = useRef(null)

  // Paleta de comandos (Ctrl+K)
  const [paletteOpen, setPaletteOpen] = useState(false)
  const [paletteQuery, setPaletteQuery] = useState('')
  const [activeIdx, setActiveIdx] = useState(0)
  const paletteInputRef = useRef(null)

  const { flatItems } = useMemo(() => buildNavData(menu, user, { includeConfig: true }), [menu, user])
  const breadcrumb = useMemo(() => resolveBreadcrumb(pathname, flatItems), [pathname, flatItems])

  const paletteResults = useMemo(() => {
    const q = paletteQuery.trim().toLowerCase()
    if (!q) return flatItems.slice(0, 10)
    return flatItems
      .filter(
        (it) =>
          it.label?.toLowerCase().includes(q) ||
          it.sectionTitle?.toLowerCase().includes(q) ||
          it.codigo?.toLowerCase().includes(q) ||
          it.to?.toLowerCase().includes(q)
      )
      .slice(0, 12)
  }, [flatItems, paletteQuery])

  // Cerrar dropdown de usuario al hacer clic fuera
  useEffect(() => {
    const onClick = (e) => {
      if (menuRef.current && !menuRef.current.contains(e.target)) setMenuOpen(false)
    }
    document.addEventListener('mousedown', onClick)
    return () => document.removeEventListener('mousedown', onClick)
  }, [])

  // Atajo global Ctrl+K / Cmd+K
  useEffect(() => {
    const onKeyDown = (e) => {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault()
        setPaletteOpen((prev) => !prev)
        setPaletteQuery('')
        setActiveIdx(0)
      } else if (e.key === 'Escape' && paletteOpen) {
        setPaletteOpen(false)
      }
    }
    window.addEventListener('keydown', onKeyDown)
    return () => window.removeEventListener('keydown', onKeyDown)
  }, [paletteOpen])

  useEffect(() => {
    if (paletteOpen) {
      setTimeout(() => paletteInputRef.current?.focus(), 10)
    }
  }, [paletteOpen])

  const handlePaletteKeyDown = (e) => {
    if (e.key === 'ArrowDown') {
      e.preventDefault()
      setActiveIdx((i) => Math.min(i + 1, Math.max(0, paletteResults.length - 1)))
    } else if (e.key === 'ArrowUp') {
      e.preventDefault()
      setActiveIdx((i) => Math.max(i - 1, 0))
    } else if (e.key === 'Enter' && paletteResults[activeIdx]) {
      e.preventDefault()
      navigate(paletteResults[activeIdx].to)
      setPaletteOpen(false)
    }
  }

  const handleLogout = () => {
    logout()
    navigate('/login', { replace: true })
  }

  const nombre = user?.nombre ?? user?.usuario ?? 'Usuario'
  const rol = user?.es_super_admin ? 'Super Admin' : (user?.active_acceso?.rol_nombre || '')
  const sucursalActiva = user?.es_super_admin ? 'Todas las Sucursales' : (user?.active_acceso?.sucursal_nombre || '')
  const configuracionModule = menu?.find((m) => m.codigo === 'CONFIGURACION')

  const handleSwitchBranch = async (e) => {
    const branchId = e.target.value
    if (!branchId || branchId === user?.active_acceso?.branch_id) return

    setIsSwitching(true)
    const res = await switchBranch(branchId)
    setIsSwitching(false)

    if (res.success) {
      toast.success('Cambio de sucursal exitoso')
      navigate('/dashboard')
    } else {
      toast.error('Error', res.message || 'No se pudo cambiar de sucursal')
    }
  }

  return (
    <header className="navbar flex items-center justify-between gap-2" style={{ backgroundColor: '#01a59c' }}>
      {/* Izquierda: Menú móvil + Breadcrumb contextual */}
      <div className="flex items-center gap-3 min-w-0">
        <button
          id="navbar-menu"
          onClick={onMenuClick}
          className="icon-btn lg:hidden text-white hover:bg-white/15 hover:text-white cursor-pointer"
          aria-label="Menú"
        >
          <Bars3Icon className="h-5 w-5" />
        </button>

        {breadcrumb && (
          <div className="hidden sm:flex items-center gap-1.5 text-white/90 text-xs font-medium truncate">
            <span className="text-white/70 truncate">{breadcrumb.sectionTitle}</span>
            <ChevronRightIcon className="h-3.5 w-3.5 text-white/60 shrink-0" />
            <span className="font-bold text-white truncate">{breadcrumb.label}</span>
          </div>
        )}
      </div>

      {/* Centro/Derecha: Botón Ctrl+K + Controles */}
      <div className="flex items-center gap-1 sm:gap-2">
        <button
          type="button"
          onClick={() => {
            setPaletteQuery('')
            setActiveIdx(0)
            setPaletteOpen(true)
          }}
          className="hidden md:inline-flex items-center gap-2 px-3 py-1.5 rounded-xl bg-white/15 hover:bg-white/25 border border-white/20 text-white text-xs font-medium transition-colors cursor-pointer mr-1"
          title="Ir rápido a un módulo (Ctrl + K)"
        >
          <MagnifyingGlassIcon className="h-3.5 w-3.5 text-white/80" />
          <span className="text-white/90">Ir a...</span>
          <kbd className="px-1.5 py-0.5 text-[10px] font-mono bg-black/20 rounded text-white/90">
            Ctrl+K
          </kbd>
        </button>

        <ThemeToggle className="text-white hover:bg-white/15" />

        {!user?.es_super_admin && user?.accesos?.length > 1 && (
          <div className="hidden md:flex items-center mx-1">
            <select
              className="bg-white/15 text-white border border-white/20 rounded-lg py-1 px-2 text-xs font-medium cursor-pointer max-w-[200px] outline-none hover:bg-white/20 focus:bg-[#018f87]"
              value={user.active_acceso?.branch_id || ''}
              onChange={handleSwitchBranch}
              disabled={isSwitching}
              title="Cambiar de Sucursal"
            >
              {user.accesos.map((acc) => (
                <option key={acc.branch_id} value={acc.branch_id} className="text-slate-800 bg-white">
                  {acc.sucursal_nombre} ({acc.empresa_nombre})
                </option>
              ))}
            </select>
          </div>
        )}

        <NotificacionesBell className="text-white hover:bg-white/15 hover:text-white" />

        <div className="relative ml-1" ref={menuRef}>
          <button
            id="navbar-user-menu"
            onClick={() => setMenuOpen((o) => !o)}
            className="flex items-center gap-2 rounded-lg px-2 py-1 transition-colors hover:bg-white/15 text-white cursor-pointer"
          >
            <div className="hidden sm:block text-left">
              <p className="text-sm font-bold leading-none text-white">{nombre}</p>
              <p className="text-xs text-teal-100 truncate max-w-[200px]">{sucursalActiva}</p>
            </div>
            <ChevronDownIcon className="hidden sm:block h-4 w-4 text-white/80" />
          </button>

          {menuOpen && (
            <div className="dropdown w-56">
              <div className="px-4 py-3 sm:hidden border-b" style={{ borderColor: 'var(--border)' }}>
                <p className="text-sm font-bold">{nombre}</p>
                {rol && <p className="text-xs font-semibold text-blue-600">{rol}</p>}
                <p className="text-[10px] text-slate-500">{sucursalActiva}</p>

                {!user?.es_super_admin && user?.accesos?.length > 1 && (
                  <select
                    className="mt-2 input-field py-1 px-2 text-xs w-full"
                    value={user.active_acceso?.branch_id || ''}
                    onChange={handleSwitchBranch}
                    disabled={isSwitching}
                  >
                    {user.accesos.map((acc) => (
                      <option key={acc.branch_id} value={acc.branch_id}>
                        {acc.sucursal_nombre}
                      </option>
                    ))}
                  </select>
                )}
              </div>

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

      {/* Modal Paleta de Comandos (Ctrl+K) */}
      {paletteOpen && createPortal(
        <div
          className="fixed inset-0 z-[99999] bg-slate-900/50 backdrop-blur-xs flex items-start justify-center pt-20 px-4"
          onClick={() => setPaletteOpen(false)}
        >
          <div
            className="w-full max-w-lg bg-white dark:bg-[var(--panel)] border border-slate-200 dark:border-slate-800 rounded-2xl shadow-2xl overflow-hidden"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center gap-2.5 px-4 py-3 border-b border-slate-100 dark:border-slate-800">
              <MagnifyingGlassIcon className="h-5 w-5 text-slate-400 shrink-0" />
              <input
                ref={paletteInputRef}
                type="text"
                value={paletteQuery}
                onChange={(e) => {
                  setPaletteQuery(e.target.value)
                  setActiveIdx(0)
                }}
                onKeyDown={handlePaletteKeyDown}
                placeholder="Buscar módulo o pantalla (ej. Productos, Caja, Ventas)..."
                className="w-full bg-transparent text-sm text-slate-800 dark:text-white outline-none placeholder:text-slate-400"
              />
              <kbd className="px-1.5 py-0.5 text-[10px] font-mono bg-slate-100 dark:bg-slate-800 text-slate-500 rounded">
                ESC
              </kbd>
            </div>

            <div className="max-h-80 overflow-y-auto p-2 space-y-0.5">
              {paletteResults.length === 0 ? (
                <p className="text-xs text-slate-400 text-center py-6">
                  No se encontraron accesos para "{paletteQuery}"
                </p>
              ) : (
                paletteResults.map((item, idx) => {
                  const Icon = item.icon
                  const isActive = idx === activeIdx
                  return (
                    <button
                      key={`${item.to}-${idx}`}
                      type="button"
                      onClick={() => {
                        navigate(item.to)
                        setPaletteOpen(false)
                      }}
                      onMouseEnter={() => setActiveIdx(idx)}
                      className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-left transition-colors cursor-pointer ${
                        isActive
                          ? 'bg-teal-50 dark:bg-teal-950/50 text-[#01a59c]'
                          : 'text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-800/60'
                      }`}
                    >
                      <Icon className="h-4 w-4 shrink-0" />
                      <div className="flex-1 min-w-0">
                        <div className="text-xs font-bold truncate">{item.label}</div>
                        <div className="text-[10px] text-slate-400 truncate">{item.sectionTitle}</div>
                      </div>
                      <span className="text-[10px] font-mono text-slate-400">{item.to}</span>
                    </button>
                  )
                })
              )}
            </div>
          </div>
        </div>,
        document.body
      )}
    </header>
  )
}
