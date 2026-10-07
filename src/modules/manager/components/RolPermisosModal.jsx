import { useEffect, useState } from 'react'
import Modal from '../../../components/ui/Modal.jsx'
import { rolController } from '../controllers/rol'
import { moduloController } from '../controllers/modulo'
import { permisoController } from '../controllers/permiso'
import { toast } from '../../../utils/toast'

const TriStateSwitch = ({ state, onClick }) => {
  let bgClass = 'bg-slate-300 dark:bg-slate-600'
  let thumbClass = 'translate-x-1'
  
  if (state === 'ON') {
    bgClass = 'bg-teal-500'
    thumbClass = 'translate-x-6'
  } else if (state === 'INDETERMINADO') {
    bgClass = 'bg-amber-400'
    thumbClass = 'translate-x-3.5'
  }
  
  return (
    <button
      type="button"
      role="switch"
      onClick={(e) => { e.preventDefault(); e.stopPropagation(); onClick(); }}
      className={`relative inline-flex h-5 w-10 items-center rounded-full transition-colors duration-300 focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2 ${bgClass}`}
    >
      <span className="sr-only">Toggle</span>
      <span className={`inline-block h-3 w-3 transform rounded-full bg-white transition-transform duration-300 shadow-sm ${thumbClass}`} />
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

  // Estado del nodo (Módulo o Menú)
  const getNodeState = (moduloId) => {
    const nodePermisos = getMenuPermissions(moduloId)
    if (nodePermisos.length === 0) return 'OFF' // Si no tiene permisos propios ni en hijos, OFF
    
    const activeCount = nodePermisos.filter(p => assignedIds.has(p.id)).length
    
    if (activeCount === 0) return 'OFF'
    // Si queremos ser estrictos: 'ON' es cuando todos los permisos están activos.
    // Pero la regla de negocio dice: "Activar un MENU: Debe activar como mínimo 'ver'".
    // Si todos están activos es ON. Si solo algunos, INDETERMINADO.
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
        // Desactivar todos los permisos de este subárbol
        nodePermisos.forEach(p => newSet.delete(p.id))
      } else {
        // Al encender, la regla dice que solo activamos los de lectura (o mínimos).
        // Activamos los permisos cuyo código termina en ".ver".
        // Si no existe un ".ver", activamos el primero como fallback (o ninguno).
        nodePermisos.forEach(p => {
          if (p.codigo.endsWith('.ver')) {
            newSet.add(p.id)
          }
        })
      }
      
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

  const renderPermiso = (permiso) => {
    const isON = assignedIds.has(permiso.id)
    return (
      <div key={permiso.id} className="flex items-center gap-3 py-1.5 cursor-pointer group" onClick={() => handleTogglePermission(permiso.id)}>
        <TriStateSwitch state={isON ? 'ON' : 'OFF'} onClick={() => handleTogglePermission(permiso.id)} />
        <div>
          <span className={`text-xs font-semibold ${isON ? 'text-teal-700 dark:text-teal-400' : 'text-slate-600 dark:text-slate-400'}`}>
            {permiso.nombre}
          </span>
          <span className="block text-[10px] text-slate-400 font-mono">{permiso.codigo}</span>
        </div>
      </div>
    )
  }

  const renderModulo = (modulo, level = 0) => {
    const hijos = modulos.filter(m => m.padre_id === modulo.id).sort((a, b) => a.orden - b.orden)
    const misPermisos = permisos.filter(p => p.modulo_id === modulo.id).sort((a,b) => a.codigo.localeCompare(b.codigo))
    
    const state = getNodeState(modulo.id)
    
    return (
      <div key={modulo.id} className={`${level > 0 ? 'ml-6 mt-1.5' : 'mt-4 border border-slate-200 dark:border-slate-700 p-4 rounded-xl bg-white dark:bg-slate-800 shadow-sm'}`}>
        
        <div className="flex items-center gap-4 cursor-pointer select-none group" onClick={() => handleToggleModuleOrMenu(modulo)}>
          <TriStateSwitch state={state} onClick={() => handleToggleModuleOrMenu(modulo)} />
          <div className="flex flex-col">
            <span className={`text-sm tracking-wide transition-colors ${
              state === 'ON' ? 'text-teal-700 dark:text-teal-400 font-bold' 
              : state === 'INDETERMINADO' ? 'text-amber-600 dark:text-amber-400 font-semibold' 
              : level > 0 ? 'text-slate-600 dark:text-slate-300 font-medium' : 'text-slate-800 dark:text-slate-100 font-semibold'
            }`}>
              {modulo.nombre} <span className="text-xs font-normal text-slate-400">({modulo.tipo})</span>
            </span>
            {modulo.descripcion && (
              <span className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                {modulo.descripcion}
              </span>
            )}
          </div>
        </div>

        {misPermisos.length > 0 && (
          <div className="pl-6 ml-2 mt-3 mb-2 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2">
            {misPermisos.map(p => renderPermiso(p))}
          </div>
        )}
        
        {hijos.length > 0 && (
          <div className="pl-4 border-l-2 border-slate-100 dark:border-slate-700/50 ml-2 mt-3 pt-1 space-y-2">
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
      maxWidth="max-w-4xl"
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
        <div className="space-y-2 -mx-2">
          <p className="text-sm font-medium text-slate-600 dark:text-slate-300 mb-6 bg-blue-50 dark:bg-blue-900/20 text-blue-700 dark:text-blue-300 p-3 rounded-lg border border-blue-100 dark:border-blue-800/30">
            Al activar un módulo/menú, se habilitan por defecto solo sus permisos de lectura. Activa los permisos CRUD y especiales de forma individual según sea necesario.
          </p>
          {padres.map(padre => renderModulo(padre, 0))}
        </div>
      )}
    </Modal>
  )
}
