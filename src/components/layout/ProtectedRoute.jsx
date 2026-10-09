import { Navigate, useLocation } from 'react-router-dom'
import { useAuthStore } from '../../store/useAuthStore.js'
import { usePermission } from '../../hooks/usePermission.js'

/**
 * Rutas protegidas basadas en roles o permisos.
 * @param {Object} props
 * @param {React.ReactNode} props.children Componente hijo
 * @param {boolean} props.requireSuperAdmin Si true, requiere que el usuario sea super admin
 * @param {string} [props.requirePermission] Permiso manual (opcional, si no se envía se infiere de la URL)
 */
export default function ProtectedRoute({ 
  children, 
  requireSuperAdmin = false,
  requirePermission = null
}) {
  const { user, isAuthenticated } = useAuthStore()
  const { hasPermission } = usePermission()
  const location = useLocation()

  // 1. Si no está autenticado, mandar al login
  if (!isAuthenticated || !user) {
    return <Navigate to="/login" replace state={{ from: location }} />
  }

  // 2. Si requiere ser super admin
  if (requireSuperAdmin && !user.es_super_admin) {
    // Redirigir al dashboard si no tiene permisos
    return <Navigate to="/dashboard" replace />
  }

  // 3. Validación Automática Predictiva (UX Inteligente)
  const moduleName = location.pathname.split('/')[1]
  const ignoredModules = ['dashboard', 'perfil', ''] // Rutas base neutras
  
  if (moduleName && !ignoredModules.includes(moduleName)) {
    const required = requirePermission || `${moduleName}.ver`
    
    // El hook hasPermission ya soporta lógica O(1) y atajo para superadmins
    if (!hasPermission(required)) {
      return <Navigate to="/dashboard" replace />
    }
  }

  return children
}
