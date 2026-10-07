import { useEffect, useState } from 'react'
import { empresaController } from '../controllers/empresa'
import { moduloController } from '../controllers/modulo'
import { toast } from '../../../utils/toast'
import Modal from '../../../components/ui/Modal.jsx'

// Modern Pill Switch Component
const TriStateSwitch = ({ state, onClick }) => {
  let bgClass = 'bg-slate-300 dark:bg-slate-600'; // OFF
  let thumbClass = 'translate-x-1';

  if (state === 'ON') {
    bgClass = 'bg-teal-500';
    thumbClass = 'translate-x-6';
  } else if (state === 'INDETERMINADO') {
    bgClass = 'bg-amber-400';
    thumbClass = 'translate-x-3.5';
  }

  return (
    <button
      type="button"
      role="switch"
      aria-checked={state === 'ON' ? 'true' : state === 'OFF' ? 'false' : 'mixed'}
      onClick={(e) => { e.preventDefault(); onClick(); }}
      className={`relative inline-flex h-5 w-10 items-center rounded-full transition-colors duration-300 focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2 ${bgClass}`}
    >
      <span className="sr-only">Toggle module</span>
      <span
        className={`inline-block h-3 w-3 transform rounded-full bg-white transition-transform duration-300 shadow-sm ${thumbClass}`}
      />
    </button>
  );
};

export default function EmpresaModulosModal({ isOpen, onClose, empresa }) {
  const [modulos, setModulos] = useState([])
  const [assignedIds, setAssignedIds] = useState(new Set())
  const [loading, setLoading] = useState(false)
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    if (isOpen && empresa) {
      loadData()
    }
  }, [isOpen, empresa])

  const loadData = async () => {
    setLoading(true)

    const resModulos = await moduloController.getAll()
    if (resModulos.success) {
      setModulos(resModulos.data)
    }

    const resAssigned = await empresaController.getModulos(empresa.id)
    if (resAssigned.success) {
      setAssignedIds(new Set(resAssigned.data))
    }

    setLoading(false)
  }

  // --- LOGICA DE CASCADA ---
  const getDescendants = (moduloId, allModulos) => {
    let descs = [];
    const children = allModulos.filter(m => m.padre_id === moduloId);
    for (const child of children) {
      descs.push(child.id);
      descs = descs.concat(getDescendants(child.id, allModulos));
    }
    return descs;
  };

  const getAncestors = (moduloId, allModulos) => {
    let ancs = [];
    const module = allModulos.find(m => m.id === moduloId);
    if (module && module.padre_id) {
      ancs.push(module.padre_id);
      ancs = ancs.concat(getAncestors(module.padre_id, allModulos));
    }
    return ancs;
  };

  const getNodeState = (moduloId, currentAssigned, allModulos) => {
    const children = allModulos.filter(m => m.padre_id === moduloId);
    if (children.length === 0) {
      return currentAssigned.has(moduloId) ? 'ON' : 'OFF';
    }

    const childStates = children.map(c => getNodeState(c.id, currentAssigned, allModulos));

    if (childStates.every(s => s === 'ON')) return 'ON';
    if (childStates.every(s => s === 'OFF')) return 'OFF';
    return 'INDETERMINADO';
  };

  const handleToggle = (moduloId) => {
    setAssignedIds(prev => {
      const newSet = new Set(prev);
      const currentState = getNodeState(moduloId, prev, modulos);

      // Si está en INDETERMINADO o OFF, el target es ON. Si está en ON, target es OFF.
      const targetState = (currentState === 'ON') ? 'OFF' : 'ON';

      // 1. Actualizar el nodo actual y todos sus descendientes
      const descendants = getDescendants(moduloId, modulos);
      const nodesToUpdate = [moduloId, ...descendants];

      nodesToUpdate.forEach(id => {
        if (targetState === 'ON') newSet.add(id);
        else newSet.delete(id);
      });

      // 2. Actualizar ancestros hacia arriba en el árbol
      const ancestors = getAncestors(moduloId, modulos);
      for (const ancId of ancestors) {
        // Un ancestro debe estar activo (en el set) si AL MENOS UNO de sus hijos directos está activo
        const children = modulos.filter(m => m.padre_id === ancId);
        const anyChildActive = children.some(c => newSet.has(c.id));
        if (anyChildActive) {
          newSet.add(ancId);
        } else {
          newSet.delete(ancId);
        }
      }

      return newSet;
    });
  }
  // --------------------------

  const handleSave = async () => {
    setSaving(true)
    const res = await empresaController.assignModulos(empresa.id, Array.from(assignedIds))
    setSaving(false)

    if (res.success) {
      toast.success(res.message || 'Módulos asignados correctamente')
      onClose()
    } else {
      toast.error(res.message || 'Error al asignar módulos')
    }
  }

  if (!isOpen) return null

  const padres = modulos.filter(m => !m.padre_id).sort((a, b) => a.orden - b.orden)

  const renderModulo = (modulo, isHijo = false) => {
    const hijos = modulos.filter(m => m.padre_id === modulo.id).sort((a, b) => a.orden - b.orden)
    const state = getNodeState(modulo.id, assignedIds, modulos)

    return (
      <div key={modulo.id} className={`${isHijo ? 'ml-6 mt-1.5' : 'mt-4 border border-slate-200 dark:border-slate-700 p-4 rounded-xl bg-white dark:bg-slate-800 shadow-sm'}`}>
        <div className="flex items-center gap-4 cursor-pointer select-none group" onClick={() => handleToggle(modulo.id)}>

          <TriStateSwitch state={state} onClick={() => { }} />

          <div className="flex flex-col">
            <span className={`text-sm tracking-wide transition-colors ${state === 'ON' ? 'text-teal-700 dark:text-teal-400 font-bold'
              : state === 'INDETERMINADO' ? 'text-amber-600 dark:text-amber-400 font-semibold'
                : isHijo ? 'text-slate-600 dark:text-slate-300 font-medium' : 'text-slate-800 dark:text-slate-100 font-semibold'
              }`}>
              {modulo.nombre}
            </span>
            {modulo.descripcion && (
              <span className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                {modulo.descripcion}
              </span>
            )}
          </div>
        </div>

        {/* Renderizar hijos si los hay */}
        {hijos.length > 0 && (
          <div className="pl-4 border-l-2 border-slate-100 dark:border-slate-700/50 ml-2 mt-3 pt-1 space-y-2">
            {hijos.map(hijo => renderModulo(hijo, true))}
          </div>
        )}
      </div>
    )
  }

  const modalSubtitle = (
    <>Empresa: <span className="font-semibold text-teal-600 dark:text-teal-400">{empresa?.razon_social}</span></>
  )

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Gestión de Permisos y Accesos"
      subtitle={modalSubtitle}
      onConfirm={handleSave}
      isProcessing={saving || loading}
      confirmText="Guardar Asignación"
      maxWidth="max-w-3xl"
    >
      {loading ? (
        <div className="flex justify-center items-center py-12 text-slate-500">
          <div className="w-10 h-10 border-4 border-teal-500 border-t-transparent rounded-full animate-spin"></div>
        </div>
      ) : padres.length === 0 ? (
        <div className="text-center py-10 text-slate-500 dark:text-slate-400 bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700">
          No hay módulos registrados en el sistema.
        </div>
      ) : (
        <div className="space-y-2 -mx-2">
          {padres.map(padre => renderModulo(padre, false))}
        </div>
      )}
    </Modal>
  )
}
