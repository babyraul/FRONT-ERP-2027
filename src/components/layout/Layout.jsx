import { useEffect, useState } from 'react'
import { Navigate, Outlet, useLocation } from 'react-router-dom'
import Sidebar from './Sidebar.jsx'
import Navbar from './Navbar.jsx'
import { useAuthStore } from '../../store/useAuthStore.js'

const isDesktop = () => window.matchMedia('(min-width: 1024px)').matches

export default function Layout() {
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated)
  const location = useLocation()

  // Desktop: sidebar expandido/colapsado. Mobile: drawer abierto/cerrado.
  const [collapsed, setCollapsed] = useState(false)
  const [mobileOpen, setMobileOpen] = useState(false)

  // Cerrar el drawer al navegar en mobile
  useEffect(() => setMobileOpen(false), [location.pathname])

  // Cerrar el drawer si se pasa a desktop
  useEffect(() => {
    const mq = window.matchMedia('(min-width: 1024px)')
    const onChange = (e) => e.matches && setMobileOpen(false)
    mq.addEventListener('change', onChange)
    return () => mq.removeEventListener('change', onChange)
  }, [])

  if (!isAuthenticated) {
    return <Navigate to="/login" replace state={{ from: location }} />
  }

  const handleMenuClick = () =>
    isDesktop() ? setCollapsed((c) => !c) : setMobileOpen((o) => !o)

  return (
    <div className="app-shell">
      <Sidebar
        collapsed={collapsed}
        mobileOpen={mobileOpen}
        onClose={() => setMobileOpen(false)}
      />

      <div className="flex flex-col flex-1 min-w-0 overflow-hidden">
        <Navbar onMenuClick={handleMenuClick} />

        <main className="app-main">
          <Outlet />
        </main>
      </div>
    </div>
  )
}
