import PropTypes from 'prop-types'
import { usePermission } from '../../hooks/usePermission'

/**
 * Componente Declarativo <Can>
 * Evalúa permisos en tiempo O(1) para montar o desmontar componentes visuales.
 * 
 * Uso:
 * <Can I="editar" a="empresas" fallback={<button disabled>Editar</button>}>
 *   <button onClick={handleEdit}>Editar</button>
 * </Can>
 */
export default function Can({ I, a, fallback = null, children }) {
  const { hasPermission } = usePermission()

  // Concatena la acción y el recurso, ej: "empresas.editar"
  const permissionCode = `${a}.${I}`

  // Si tiene el permiso, renderizamos el contenido protegido
  if (hasPermission(permissionCode)) {
    return <>{children}</>
  }

  // Si no tiene el permiso, renderizamos el fallback o nada (null)
  return fallback ? <>{fallback}</> : null
}

Can.propTypes = {
  I: PropTypes.string.isRequired, // Acción: "crear", "editar", "eliminar", "ver"
  a: PropTypes.string.isRequired, // Recurso o módulo: "empresas", "sucursales"
  fallback: PropTypes.node,       // Elemento visual alternativo si se deniega (ej. Tooltip)
  children: PropTypes.node.isRequired,
}
