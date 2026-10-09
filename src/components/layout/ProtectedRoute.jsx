import { Navigate, useLocation } from 'react-router-dom'
import { useAuthStore } from '../../store/useAuthStore.js'

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
  const { user, isAuthenticated, menu } = useAuthStore()
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

  // 3. Validación Automática (Inferencia de Permiso por Convención)
  if (!user.es_super_admin) {
    // Extraemos el módulo base (ej: /empresas -> empresas)
    const moduleName = location.pathname.split('/')[1]
    const ignoredModules = ['dashboard', 'perfil', ''] // Rutas base que no usan la convención estricta
    
    if (moduleName && !ignoredModules.includes(moduleName)) {
      // Si no se pasó un permiso manual, asumimos "modulo.ver" para leer la vista
      const required = requirePermission || `${moduleName}.ver`
      
      if (!user.permisos || !user.permisos.includes(required)) {
        return <Navigate to="/dashboard" replace />
      }
    }
  }

  return children
}
