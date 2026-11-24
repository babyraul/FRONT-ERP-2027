import { useState, useEffect, useMemo } from 'react'
import { NavLink, useLocation } from 'react-router-dom'
import {
  XMarkIcon,
  Bars3Icon,
  ChevronDownIcon,
  MagnifyingGlassIcon,
  StarIcon
} from '@heroicons/react/24/outline'
import { StarIcon as StarSolidIcon } from '@heroicons/react/24/solid'
import { useAuthStore } from '../../store/useAuthStore'
import { buildNavData } from './menuUtils.js'

const OPEN_SECTIONS_KEY = 'erp-nav-open-sections'
const FAVORITES_KEY = 'erp-nav-favorites'
const MAX_FAVORITES = 5

const readJsonStorage = (key, fallback) => {
  try {
    const raw = localStorage.getItem(key)
    return raw ? JSON.parse(raw) : fallback
  } catch {
    return fallback
  }
}

export default function Sidebar({ collapsed, onToggleCollapse, mobileOpen, onClose }) {
  const { user, menu } = useAuthStore()
  const { pathname } = useLocation()

  const [searchQuery, setSearchQuery] = useState('')
  const [openSections, setOpenSections] = useState(() => readJsonStorage(OPEN_SECTIONS_KEY, {}))
  const [favorites, setFavorites] = useState(() => readJsonStorage(FAVORITES_KEY, []))

  const { sections, flatItems } = useMemo(() => buildNavData(menu, user), [menu, user])

  // Acordeón inteligente: abrir automáticamente solo la sección de la ruta activa
  useEffect(() => {
    if (sections.length === 0) return
    const activeSection = sections.find(
      (sec) =>
        sec.ruta === pathname ||
        sec.items.some((it) => pathname === it.to || pathname.startsWith(`${it.to}/`))
    )
    if (activeSection) {
      setOpenSections((prev) => {
        if (prev[activeSection.id]) return prev
        const next = { ...prev, [activeSection.id]: true }
        localStorage.setItem(OPEN_SECTIONS_KEY, JSON.stringify(next))
        return next
      })
    }
  }, [pathname, sections])

  const toggleSection = (sectionId) => {
    setOpenSections((prev) => {
      const next = { ...prev, [sectionId]: !prev[sectionId] }
      localStorage.setItem(OPEN_SECTIONS_KEY, JSON.stringify(next))
      return next
    })
  }

  const toggleFavorite = (e, to) => {
    e.preventDefault()
    e.stopPropagation()
    setFavorites((prev) => {
      const exists = prev.includes(to)
      const next = exists ? prev.filter((f) => f !== to) : [...prev, to].slice(0, MAX_FAVORITES)
      localStorage.setItem(FAVORITES_KEY, JSON.stringify(next))
      return next
    })
  }

  const favoriteItems = useMemo(() => {
    const byPath = new Map(flatItems.map((it) => [it.to, it]))
    return favorites.map((path) => byPath.get(path)).filter(Boolean)
  }, [favorites, flatItems])

  const trimmedQuery = searchQuery.trim().toLowerCase()
  const visibleSections = useMemo(() => {
    if (!trimmedQuery) return sections
    return sections
      .map((sec) => {
        const titleMatch = sec.title?.toLowerCase().includes(trimmedQuery)
        if (titleMatch) return sec
        const matchingItems = sec.items.filter(
          (it) =>
            it.label?.toLowerCase().includes(trimmedQuery) ||
            it.codigo?.toLowerCase().includes(trimmedQuery)
        )
        if (matchingItems.length === 0) return null
        return { ...sec, items: matchingItems }
      })
      .filter(Boolean)
  }, [sections, trimmedQuery])

  return (
    <>
      <div
        className={`sidebar-overlay ${mobileOpen ? 'is-visible' : ''}`}
        onClick={onClose}
        aria-hidden="true"
      />

      <aside
        id="app-sidebar"
        className={`sidebar ${collapsed ? 'is-collapsed' : ''} ${mobileOpen ? 'is-open' : ''}`}
      >
        {/* Logo y Botón de Ocultar/Colapsar Menú */}
        <div className="sidebar-header">
          {collapsed ? (
            <div className="w-full flex items-center justify-center">
              <button
                id="sidebar-expand-btn"
                onClick={onToggleCollapse}
                className="hidden lg:flex items-center justify-center h-9 w-9 rounded-lg bg-white/10 text-white hover:bg-white/20 transition-colors cursor-pointer"
                title="Mostrar menú"
                aria-label="Mostrar menú"
              >
                <Bars3Icon className="h-5 w-5" />
              </button>
            </div>
          ) : (
            <>
              <div className="flex items-center gap-2 min-w-0">
                <span className="sidebar-logo">M</span>
                <span className="sidebar-label font-bold text-lg tracking-tight truncate">
                  Mi Factura Perú
                </span>
              </div>

              <div className="flex items-center gap-1">
                <button
                  id="sidebar-collapse-btn"
                  onClick={onToggleCollapse}
                  className="hidden lg:flex icon-btn text-white/70 hover:text-white hover:bg-white/10 cursor-pointer"
                  title="Ocultar menú"
                  aria-label="Ocultar menú"
                >
                  <Bars3Icon className="h-5 w-5" />
                </button>

                <button
                  id="sidebar-close"
                  onClick={onClose}
                  className="icon-btn lg:hidden text-white/70 hover:text-white hover:bg-white/10 cursor-pointer"
                  aria-label="Cerrar menú"
                >
                  <XMarkIcon className="h-5 w-5" />
                </button>
              </div>
            </>
          )}
        </div>

        {/* Buscador rápido de módulos */}
        {!collapsed && (
          <div className="px-3 pt-3">
            <div className="relative">
              <MagnifyingGlassIcon className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-white/50 pointer-events-none" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Buscar módulo..."
                className="w-full pl-8 pr-7 py-1.5 text-xs rounded-lg bg-white/10 border border-white/15 text-white placeholder:text-white/50 outline-none focus:bg-white/15 focus:border-white/30 transition-colors"
              />
              {searchQuery && (
                <button
                  type="button"
                  onClick={() => setSearchQuery('')}
                  className="absolute right-2 top-1/2 -translate-y-1/2 text-white/60 hover:text-white text-xs cursor-pointer"
                  title="Limpiar búsqueda"
                >
                  &times;
                </button>
              )}
            </div>
          </div>
        )}

        {/* Nav */}
        <nav className="flex-1 px-3 py-3 overflow-y-auto space-y-3">
          {/* Favoritos fijados */}
          {!collapsed && !trimmedQuery && favoriteItems.length > 0 && (
            <div className="pb-2 border-b border-white/10">
              <div className="px-3 mb-1 text-[10px] font-bold uppercase tracking-wider text-amber-300/90 flex items-center gap-1">
                <StarSolidIcon className="h-3 w-3" />
                <span>Accesos Rápidos</span>
              </div>
              <ul className="space-y-0.5">
                {favoriteItems.map(({ to, icon: Icon, label }) => (
                  <li key={`fav-${to}`} className="group/item relative">
                    <NavLink
                      to={to}
                      onClick={mobileOpen ? onClose : undefined}
                      className={({ isActive }) => `nav-link pr-7 ${isActive ? 'is-active' : ''}`}
                    >
                      <Icon className="h-4 w-4 shrink-0" />
                      <span className="sidebar-label truncate text-xs">{label}</span>
                    </NavLink>
                    <button
                      type="button"
                      onClick={(e) => toggleFavorite(e, to)}
                      className="absolute right-2 top-1/2 -translate-y-1/2 text-amber-300 hover:text-amber-200 cursor-pointer"
                      title="Quitar de accesos rápidos"
                    >
                      <StarSolidIcon className="h-3.5 w-3.5" />
                    </button>
                  </li>
                ))}
              </ul>
            </div>
          )}

          {!menu ? (
            <div className="text-white/50 text-xs px-3 py-2">Cargando menú...</div>
          ) : visibleSections.length === 0 ? (
            <div className="text-white/60 text-xs px-3 py-4 text-center">
              Sin coincidencias para "{searchQuery}"
            </div>
          ) : (
            visibleSections.map((section) => {
              const isOpen = Boolean(trimmedQuery) || Boolean(openSections[section.id]) || collapsed

              if (section.items.length === 0 && section.ruta) {
                const Icon = section.icon
                const isFav = favorites.includes(section.ruta)
                return (
                  <div key={section.id} className="group/item relative">
                    <NavLink
                      to={section.ruta}
                      onClick={mobileOpen ? onClose : undefined}
                      title={collapsed ? section.title : undefined}
                      className={({ isActive }) => `nav-link ${!collapsed ? 'pr-7' : ''} ${isActive ? 'is-active' : ''}`}
                    >
                      <Icon className="h-4 w-4 shrink-0" />
                      <span className="sidebar-label truncate">{section.title}</span>
                    </NavLink>
                    {!collapsed && (
                      <button
                        type="button"
                        onClick={(e) => toggleFavorite(e, section.ruta)}
                        className={`absolute right-2 top-1/2 -translate-y-1/2 cursor-pointer transition-opacity ${
                          isFav ? 'opacity-100 text-amber-300' : 'opacity-0 group-hover/item:opacity-100 text-white/50 hover:text-amber-300'
                        }`}
                        title={isFav ? 'Quitar de favoritos' : 'Fijar en accesos rápidos'}
                      >
                        {isFav ? <StarSolidIcon className="h-3.5 w-3.5" /> : <StarIcon className="h-3.5 w-3.5" />}
                      </button>
                    )}
                  </div>
                )
              }

              return (
                <div key={section.id} className="last:mb-0">
                  <button
                    type="button"
                    onClick={() => toggleSection(section.id)}
                    className={`w-full flex items-center justify-between px-3 mb-1 py-1 text-[11px] font-bold uppercase tracking-wider text-white/80 hover:text-white transition-all cursor-pointer ${
                      collapsed ? 'opacity-0 h-0 overflow-hidden m-0 p-0' : 'opacity-100'
                    }`}
                    aria-expanded={isOpen}
                  >
                    <span className="truncate">{section.title}</span>
                    <ChevronDownIcon
                      className={`h-3.5 w-3.5 shrink-0 transition-transform duration-200 ${
                        isOpen ? 'rotate-180' : ''
                      }`}
                    />
                  </button>

                  <div
                    className={`grid transition-[grid-template-rows] duration-200 ease-in-out ${
                      isOpen ? 'grid-rows-[1fr]' : 'grid-rows-[0fr]'
                    }`}
                  >
                    <ul className="overflow-hidden space-y-0.5">
                      {section.items.map(({ to, icon: Icon, label }) => {
                        const isFav = favorites.includes(to)
                        return (
                          <li key={to} className="group/item relative">
                            <NavLink
                              to={to}
                              id={`nav-${to.replace(/[^a-zA-Z0-9]/g, '-')}`}
                              onClick={mobileOpen ? onClose : undefined}
                              title={collapsed ? label : undefined}
                              className={({ isActive }) => `nav-link ${!collapsed ? 'pr-7' : ''} ${isActive ? 'is-active' : ''}`}
                            >
                              <Icon className="h-4 w-4 shrink-0" />
                              <span className="sidebar-label truncate">{label}</span>
                            </NavLink>
                            {!collapsed && (
                              <button
                                type="button"
                                onClick={(e) => toggleFavorite(e, to)}
                                className={`absolute right-2 top-1/2 -translate-y-1/2 cursor-pointer transition-opacity ${
                                  isFav ? 'opacity-100 text-amber-300' : 'opacity-0 group-hover/item:opacity-100 text-white/50 hover:text-amber-300'
                                }`}
                                title={isFav ? 'Quitar de favoritos' : 'Fijar en accesos rápidos'}
                              >
                                {isFav ? <StarSolidIcon className="h-3.5 w-3.5" /> : <StarIcon className="h-3.5 w-3.5" />}
                              </button>
                            )}
                          </li>
                        )
                      })}
                    </ul>
                  </div>
                </div>
              )
            })
          )}
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
