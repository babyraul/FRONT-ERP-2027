import { Navigate, useLocation } from 'react-router-dom'
import { useAuthStore } from '../../store/useAuthStore.js'

/**
 * Rutas protegidas basadas en roles o permisos.
 * @param {Object} props
 * @param {React.ReactNode} props.children Componente hijo
 * @param {boolean} props.requireSuperAdmin Si true, requiere que el usuario sea super admin
 * @param {Array<string>} [props.allowedRoles] Arreglo de roles permitidos (futuro)
 */
export default function ProtectedRoute({ 
  children, 
  requireSuperAdmin = false,
  allowedRoles = [] 
}) {
  const { user, isAuthenticated } = useAuthStore()
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

  // 3. Validación de roles/módulos en el futuro
  if (allowedRoles.length > 0) {
    // Aquí puedes agregar la lógica para revisar `user.roles` o `user.modulos`
    // const hasRole = allowedRoles.some(role => user.roles?.includes(role))
    // if (!hasRole && !user.es_super_admin) return <Navigate to="/dashboard" replace />
  }

  return children
}
