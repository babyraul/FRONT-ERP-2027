import { useEffect, useState } from 'react'
import Modal from '../../../components/ui/Modal.jsx'
import { rolController } from '../controllers/rol'
import { moduloController } from '../controllers/modulo'
import { permisoController } from '../controllers/permiso'
import { toast } from '../../../utils/toast'

const UnifiedSwitch = ({ state, onClick, color = 'teal' }) => {
  let bgClass = 'bg-slate-300 dark:bg-slate-600'
  let thumbClass = 'translate-x-0.5'
  let ringClass = color === 'teal' ? 'focus-visible:ring-teal-500' : 'focus-visible:ring-purple-500'

  if (state === 'ON') {
    bgClass = color === 'teal' ? 'bg-teal-500' : 'bg-purple-500'
    thumbClass = 'translate-x-3.5'
  } else if (state === 'INDETERMINADO') {
    bgClass = 'bg-amber-400'
    thumbClass = 'translate-x-2'
  }

  return (
    <button
      type="button"
      role="switch"
      aria-checked={state === 'ON'}
      onClick={(e) => { e.preventDefault(); e.stopPropagation(); onClick(); }}
      className={`group relative inline-flex h-4 w-7 shrink-0 cursor-pointer items-center rounded-full transition-colors duration-200 ease-in-out focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 ${ringClass} ${bgClass}`}
    >
      <span className="sr-only">Toggle</span>
      <span className={`pointer-events-none inline-block h-3 w-3 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${thumbClass}`} />
    </button>
  )
}

export default function RolPermisosModal({ isOpen, onClose, rol }) {
  const [modulos, setModulos] = useState([])
  const [permisos, setPermisos] = useState([])
  const [assignedIds, setAssignedIds] = useState(new Set())
  const [loading, setLoading] = useState(false)
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    if (isOpen && rol) {
      loadData()
    }
  }, [isOpen, rol])

  const loadData = async () => {
    setLoading(true)

    const [resModulos, resPermisos, resAssigned] = await Promise.all([
      moduloController.getAll(),
      permisoController.getAll(),
      rolController.getPermisos(rol.id)
    ])

    if (resModulos.success) setModulos(resModulos.data)
    if (resPermisos.success) setPermisos(resPermisos.data)
    if (resAssigned.success) setAssignedIds(new Set(resAssigned.data))

    setLoading(false)
  }

  // Obtener todos los IDs de permisos descendientes de un módulo
  const getMenuPermissions = (moduloId) => {
    const directPermisos = permisos.filter(p => p.modulo_id === moduloId)
    const children = modulos.filter(m => m.padre_id === moduloId)

    let allPermisos = [...directPermisos]
    for (const child of children) {
      allPermisos = allPermisos.concat(getMenuPermissions(child.id))
    }
    return allPermisos
  }

  const getActionPermissions = (moduloId, action) => {
    return getMenuPermissions(moduloId).filter(p => p.codigo.endsWith(`.${action}`))
  }

  const getActionState = (moduloId, action) => {
    const actionPerms = getActionPermissions(moduloId, action)
    if (actionPerms.length === 0) return null
    const activeCount = actionPerms.filter(p => assignedIds.has(p.id)).length
    if (activeCount === 0) return 'OFF'
    if (activeCount === actionPerms.length) return 'ON'
    return 'INDETERMINADO'
  }

  // Estado del nodo (Módulo o Menú) para el switch principal
  const getNodeState = (moduloId) => {
    const nodePermisos = getMenuPermissions(moduloId)
    if (nodePermisos.length === 0) return 'OFF'
    
    const activeCount = nodePermisos.filter(p => assignedIds.has(p.id)).length
    if (activeCount === 0) return 'OFF'
    if (activeCount === nodePermisos.length) return 'ON'
    return 'INDETERMINADO'
  }

  const handleToggleModuleOrMenu = (modulo) => {
    setAssignedIds(prev => {
      const newSet = new Set(prev)
      const currentState = getNodeState(modulo.id)
      const targetState = (currentState === 'ON' || currentState === 'INDETERMINADO') ? 'OFF' : 'ON'

      const nodePermisos = getMenuPermissions(modulo.id)

      if (targetState === 'OFF') {
        nodePermisos.forEach(p => newSet.delete(p.id))
      } else {
        let added = false
        nodePermisos.forEach(p => {
          if (p.codigo.endsWith('.ver')) {
            newSet.add(p.id)
            added = true
          }
        })
        if (!added && nodePermisos.length > 0) {
          newSet.add(nodePermisos[0].id)
        }
      }
      return newSet
    })
  }

  const handleToggleAction = (moduloId, action) => {
    setAssignedIds(prev => {
      const newSet = new Set(prev)
      const actionPerms = getActionPermissions(moduloId, action)
      const currentState = getActionState(moduloId, action)
      const targetState = (currentState === 'ON' || currentState === 'INDETERMINADO') ? 'OFF' : 'ON'
      
      actionPerms.forEach(p => {
        if (targetState === 'OFF') {
          newSet.delete(p.id)
        } else {
          newSet.add(p.id)
        }
      })
      return newSet
    })
  }

  const handleTogglePermission = (permisoId) => {
    setAssignedIds(prev => {
      const newSet = new Set(prev)
      if (newSet.has(permisoId)) {
        newSet.delete(permisoId)
      } else {
        newSet.add(permisoId)
      }
      return newSet
    })
  }

  const handleSave = async () => {
    setSaving(true)
    const res = await rolController.assignPermisos(rol.id, Array.from(assignedIds))
    setSaving(false)

    if (res.success) {
      toast.success(res.message || 'Permisos guardados')
      onClose()
    } else {
      toast.error(res.message || 'Error al guardar permisos')
    }
  }

  const renderModulo = (modulo, level = 0) => {
    const hijos = modulos.filter(m => m.padre_id === modulo.id).sort((a, b) => a.orden - b.orden)
    
    const crudActions = ['ver', 'crear', 'editar', 'eliminar']
    const hasAnyAction = crudActions.some(action => getActionState(modulo.id, action) !== null)
    
    // Especiales son SOLO los de este módulo específico (no de los hijos, para no mezclar códigos únicos)
    const misPermisos = permisos.filter(p => p.modulo_id === modulo.id)
    const permisosEspeciales = misPermisos.filter(p => !crudActions.some(action => p.codigo.endsWith(`.${action}`))).sort((a,b) => a.codigo.localeCompare(b.codigo))

    const state = getNodeState(modulo.id)

    return (
      <div key={modulo.id} className={`flex flex-col ${level === 0 ? 'mt-2 border border-slate-200 dark:border-slate-700 rounded-xl overflow-hidden bg-white dark:bg-slate-800 shadow-sm' : 'border-t border-slate-100 dark:border-slate-700/50'}`}>
        
        {/* Fila del Módulo / Menú */}
        <div className={`flex items-center p-3 ${level === 0 ? 'bg-slate-50 dark:bg-slate-800/80' : 'hover:bg-slate-50/50 dark:hover:bg-slate-800/30 transition-colors'}`}>
          
          {/* Columna Izquierda: Switch + Nombre */}
          <div className="flex-1 flex items-center gap-3 min-w-[200px]" style={{ paddingLeft: `${level * 1.5}rem` }}>
            <UnifiedSwitch state={state} onClick={() => handleToggleModuleOrMenu(modulo)} />
            <div className="flex flex-col">
              <span className={`text-sm tracking-wide transition-colors ${state === 'ON' ? 'text-teal-700 dark:text-teal-400 font-bold'
                  : state === 'INDETERMINADO' ? 'text-amber-600 dark:text-amber-400 font-semibold'
                    : level > 0 ? 'text-slate-600 dark:text-slate-300 font-medium' : 'text-slate-800 dark:text-slate-100 font-semibold'
                }`}>
                {modulo.nombre} <span className="text-xs font-normal text-slate-400 dark:text-slate-500">({modulo.tipo})</span>
              </span>
            </div>
          </div>

          {/* Columna Derecha: Permisos CRUD (Mass/Leaf) + Especiales */}
          {(hasAnyAction || permisosEspeciales.length > 0) ? (
            <div className="flex items-start">
              
              {/* CRUD */}
              <div className="w-[240px] flex justify-between px-2">
                {crudActions.map((action, idx) => {
                  const actionState = getActionState(modulo.id, action)
                  if (actionState === null) return <div key={idx} className="w-10"></div>
                  return (
                    <div key={action} className="w-10 flex justify-center" title={`${action.toUpperCase()} en toda la rama`}>
                      <UnifiedSwitch state={actionState} onClick={() => handleToggleAction(modulo.id, action)} color="teal" />
                    </div>
                  )
                })}
              </div>

              {/* Especiales */}
              <div className="w-[200px] pl-4 border-l border-slate-200 dark:border-slate-700 flex flex-col gap-1.5 justify-center">
                {permisosEspeciales.map(p => {
                  const isON = assignedIds.has(p.id)
                  const shortName = p.codigo.split('.').pop()
                  return (
                    <label key={p.id} className="flex items-center gap-2 cursor-pointer group" title={p.nombre} onClick={(e) => { e.preventDefault(); handleTogglePermission(p.id); }}>
                      <UnifiedSwitch state={isON ? 'ON' : 'OFF'} onClick={() => handleTogglePermission(p.id)} color="purple" />
                      <span className={`text-[11px] font-medium transition-colors ${isON ? 'text-purple-700 dark:text-purple-400' : 'text-slate-500 dark:text-slate-400 group-hover:text-slate-700 dark:group-hover:text-slate-300'}`}>
                        {shortName.toUpperCase()}
                      </span>
                    </label>
                  )
                })}
              </div>

            </div>
          ) : (
            <div className="w-[440px]"></div> /* Placeholder para mantener aliniamiento si es un módulo agrupador vacío */
          )}
        </div>

        {/* Recursión para Hijos */}
        {hijos.length > 0 && (
          <div className="flex flex-col w-full">
            {hijos.map(hijo => renderModulo(hijo, level + 1))}
          </div>
        )}
      </div>
    )
  }

  const padres = modulos.filter(m => !m.padre_id).sort((a, b) => a.orden - b.orden)

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Gestión de Permisos"
      subtitle={<>Rol: <span className="font-semibold text-teal-600 dark:text-teal-400">{rol?.nombre}</span></>}
      onConfirm={handleSave}
      isProcessing={saving || loading}
      confirmText="Guardar Permisos"
      maxWidth="max-w-5xl"
    >
      {loading ? (
        <div className="flex justify-center items-center py-12 text-slate-500">
          <div className="w-10 h-10 border-4 border-teal-500 border-t-transparent rounded-full animate-spin"></div>
        </div>
      ) : padres.length === 0 ? (
        <div className="text-center py-10 text-slate-500 dark:text-slate-400">
          No hay módulos ni permisos registrados.
        </div>
      ) : (
        <div className="space-y-4 -mx-2">
          
          <div className="flex items-center px-4 py-2.5 bg-slate-100 dark:bg-slate-800 rounded-lg text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider shadow-sm">
            <div className="flex-1">Estructura del Sistema</div>
            <div className="w-[240px] flex justify-between px-2">
              <span className="w-10 text-center" title="Ver (Lectura)">Ver</span>
              <span className="w-10 text-center" title="Crear">Crear</span>
              <span className="w-10 text-center" title="Editar">Editar</span>
              <span className="w-10 text-center" title="Eliminar (Inactivar)">Inact.</span>
            </div>
            <div className="w-[200px] pl-4 border-l border-slate-300 dark:border-slate-600">
              Especiales
            </div>
          </div>

          <div className="space-y-3">
            {padres.map(padre => renderModulo(padre, 0))}
          </div>
          
        </div>
      )}
    </Modal>
  )
}
