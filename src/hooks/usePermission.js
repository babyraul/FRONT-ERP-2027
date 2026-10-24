import { useMemo } from 'react'
import { useAuthStore } from '../store/useAuthStore'

/**
 * Hook para evaluar permisos del usuario de forma optimizada en tiempo O(1)
 */
export const usePermission = () => {
  const user = useAuthStore((state) => state.user)

  // Memorizamos el Set para no recalcularlo en cada render y garantizar búsquedas O(1)
  const permissionsSet = useMemo(() => {
    return new Set(user?.permisos || [])
  }, [user?.permisos])

  const configuracionesSet = useMemo(() => {
    return new Set(user?.configuraciones || [])
  }, [user?.configuraciones])

  /**
   * Evalúa si el usuario activo tiene un permiso específico
   * @param {string} permissionCode - Ejemplo: 'empresas.crear'
   * @returns {boolean}
   */
  const hasPermission = (permissionCode) => {
    if (!user) return false
    // El super admin es Dios, tiene acceso a todo de manera implícita
    if (user.es_super_admin) return true
    
    // Verificación en tiempo O(1) en el Set de permisos
    return permissionsSet.has(permissionCode)
  }

  /**
   * Evalúa si la empresa activa tiene una configuración o bandera activada
   * @param {string} configCode - Ejemplo: 'VENTAS_DOC_DEFECTO_VALE'
   * @returns {boolean}
   */
  const hasConfig = (configCode) => {
    if (!user) return false
    return configuracionesSet.has(configCode)
  }

  return { hasPermission, hasConfig, permissionsSet, configuracionesSet, user }
}
