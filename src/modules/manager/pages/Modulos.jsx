import { useEffect, useState, useCallback } from 'react'
import { MagnifyingGlassIcon, ArrowDownTrayIcon, PlusIcon, PencilIcon, TrashIcon } from '@heroicons/react/24/outline'
import { moduloController } from '../controllers/modulo.js'
import { exportToExcel } from '../../../utils/exportExcel.js'
import ModuloModal from '../components/ModuloModal.jsx'

export function Modulos() {
  const [modulos, setModulos] = useState([])
  const [loading, setLoading] = useState(true)
  const [busq, setBusq] = useState('')
  const [isModalOpen, setModalOpen] = useState(false)
  const [moduloEdit, setModuloEdit] = useState(null)

  const loadModulos = useCallback(async () => {
    setLoading(true)
    const res = await moduloController.getAll()
    if (res.success) setModulos(res.data)
    setLoading(false)
  }, [])

  useEffect(() => {
    loadModulos()
  }, [loadModulos])

  const handleBusq = (e) => setBusq(e.target.value)

  const filtered = modulos.filter(m =>
    m.codigo?.toLowerCase().includes(busq.toLowerCase()) ||
    m.nombre?.toLowerCase().includes(busq.toLowerCase()) ||
    m.descripcion?.toLowerCase().includes(busq.toLowerCase())
  )

  const handleExport = () => {
    const data = filtered.map((m) => ({
      Código: m.codigo,
      Nombre: m.nombre,
      Descripción: m.descripcion,
      Estado: m.activo ? 'Activo' : 'Inactivo',
    }))
    exportToExcel(data, 'modulos', 'Módulos')
  }

  const handleOpenNew = () => {
    setModuloEdit(null)
    setModalOpen(true)
  }

  const handleOpenEdit = (modulo) => {
    setModuloEdit(modulo)
    setModalOpen(true)
  }

  const handleDelete = async (id) => {
    if (!confirm('¿Eliminar módulo de manera permanente?')) return
    const res = await moduloController.delete(id)
    if (res.success) {
      loadModulos()
    } else {
      alert(res.message || 'Error al eliminar')
    }
  }

  const handleSaveModal = async (data) => {
    let res
    if (moduloEdit) {
      res = await moduloController.update(moduloEdit.id, data)
    } else {
      res = await moduloController.create(data)
    }

    if (res.success) {
      setModalOpen(false)
      loadModulos()
    } else {
      alert(res.message || 'Error al guardar el módulo')
    }
  }

  return (
    <div className="space-y-5 p-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Módulos del Sistema</h1>
          <p className="text-sm text-gray-500 mt-0.5">{filtered.length} módulos registrados</p>
        </div>
        <div className="flex gap-2">
          <button onClick={handleExport} className="btn-secondary">
            <ArrowDownTrayIcon className="h-4 w-4" /> Exportar Excel
          </button>
          <button onClick={handleOpenNew} className="btn-primary">
            <PlusIcon className="h-4 w-4" /> Nuevo Módulo
          </button>
        </div>
      </div>

      <div className="card p-4">
        <div className="relative">
          <MagnifyingGlassIcon className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
          <input
            type="text" placeholder="Buscar por Código, Nombre o Descripción..."
            value={busq} onChange={handleBusq}
            className="input-field pl-9"
          />
        </div>
      </div>

      <div className="card p-0 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-slate-50 dark:bg-slate-800/50 border-b border-slate-200 dark:border-slate-700">
              <tr className="text-left text-slate-500 dark:text-slate-400">
                <th className="px-4 py-3 font-medium">Código</th>
                <th className="px-4 py-3 font-medium">Nombre</th>
                <th className="px-4 py-3 font-medium">Padre / Tipo</th>
                <th className="px-4 py-3 font-medium text-center">Ruta</th>
                <th className="px-4 py-3 font-medium text-center">Orden</th>
                <th className="px-4 py-3 font-medium text-center">Estado</th>
                <th className="px-4 py-3 font-medium text-center">Acciones</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
              {loading ? (
                <tr><td colSpan="7" className="py-8 text-center text-slate-500">Cargando módulos...</td></tr>
              ) : filtered.length === 0 ? (
                <tr><td colSpan="7" className="py-8 text-center text-slate-500">No se encontraron módulos.</td></tr>
              ) : (
                filtered.map((m) => {
                  const parent = modulos.find(p => p.id === m.padre_id)
                  return (
                    <tr key={m.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors text-slate-700 dark:text-slate-300">
                      <td className="px-4 py-3 font-mono font-semibold text-blue-600 dark:text-blue-400">{m.codigo}</td>
                      <td className="px-4 py-3 font-medium">
                        {m.nombre}
                        {m.descripcion && <p className="text-xs text-slate-400 font-normal truncate max-w-xs">{m.descripcion}</p>}
                      </td>
                      <td className="px-4 py-3">
                        <span className="text-xs font-semibold px-2 py-0.5 rounded bg-slate-100 dark:bg-slate-700 mr-2">
                          {m.tipo}
                        </span>
                        {parent && <span className="text-xs text-slate-500">↳ {parent.codigo}</span>}
                      </td>
                      <td className="px-4 py-3 text-center text-sm font-mono text-slate-500">
                        {m.ruta || '-'}
                      </td>
                      <td className="px-4 py-3 text-center text-sm">
                        {m.orden}
                      </td>
                      <td className="px-4 py-3 text-center">
                        <span className={m.activo ? 'badge-green' : 'badge-gray'}>
                          {m.activo ? 'Activo' : 'Inactivo'}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center justify-center gap-1">
                          <button onClick={() => handleOpenEdit(m)} className="p-1.5 rounded hover:bg-blue-50 text-slate-400 hover:text-blue-600 transition-colors" title="Editar Módulo">
                            <PencilIcon className="h-4 w-4" />
                          </button>
                          <button
                            onClick={() => handleDelete(m.id)}
                            className="p-1.5 rounded hover:bg-red-50 text-slate-400 hover:text-red-600 transition-colors"
                            title="Eliminar Módulo"
                          >
                            <TrashIcon className="h-4 w-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  )
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      <ModuloModal
        isOpen={isModalOpen}
        onClose={() => setModalOpen(false)}
        onSave={handleSaveModal}
        modulo={moduloEdit}
        modulosList={modulos}
      />
    </div>
  )
}
