import { useEffect, useState, useCallback } from 'react'
import { MagnifyingGlassIcon, ArrowDownTrayIcon, PlusIcon, PencilIcon, TrashIcon } from '@heroicons/react/24/outline'
import { sucursalController } from '../controllers/sucursal.js'
import { exportToExcel } from '../../../utils/exportExcel.js'
import SucursalModal from '../components/SucursalModal.jsx'

export function Sucursales() {
  const [sucursales, setSucursales] = useState([])
  const [loading, setLoading] = useState(true)
  const [busq, setBusq] = useState('')
  const [isModalOpen, setModalOpen] = useState(false)
  const [sucursalEdit, setSucursalEdit] = useState(null)

  const loadSucursales = useCallback(async () => {
    setLoading(true)
    const res = await sucursalController.getAll()
    if (res.success) setSucursales(res.data)
    setLoading(false)
  }, [])

  useEffect(() => {
    loadSucursales()
  }, [loadSucursales])

  const handleBusq = (e) => setBusq(e.target.value)

  const filtered = sucursales.filter(s => 
    s.ruc?.toLowerCase().includes(busq.toLowerCase()) || 
    s.razon_social?.toLowerCase().includes(busq.toLowerCase()) ||
    s.sucursal_nombre?.toLowerCase().includes(busq.toLowerCase()) ||
    s.codigo_anexo?.toLowerCase().includes(busq.toLowerCase())
  )

  const handleExport = () => {
    const data = filtered.map((s) => ({
      Anexo: s.codigo_anexo,
      Sucursal: s.sucursal_nombre,
      RUC: s.ruc,
      'Razón Social': s.razon_social,
      Teléfono: s.telefono1,
      Dirección: s.direccion,
      Estado: s.activo ? 'Activo' : 'Inactivo',
    }))
    exportToExcel(data, 'sucursales', 'Sucursales')
  }

  const handleOpenNew = () => {
    setSucursalEdit(null)
    setModalOpen(true)
  }

  const handleOpenEdit = (sucursal) => {
    setSucursalEdit(sucursal)
    setModalOpen(true)
  }

  const handleDelete = async (id) => {
    if (!confirm('¿Eliminar sucursal?')) return
    const res = await sucursalController.delete(id)
    if (res.success) {
      loadSucursales()
    } else {
      alert(res.message || 'Error al eliminar')
    }
  }

  const handleSaveModal = async (data) => {
    let res
    if (sucursalEdit) {
      res = await sucursalController.update(sucursalEdit.id, data)
    } else {
      res = await sucursalController.create(data)
    }
    
    if (res.success) {
      setModalOpen(false)
      loadSucursales()
    } else {
      alert(res.message || 'Error al guardar la sucursal')
    }
  }

  return (
    <div className="space-y-5 p-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Sucursales</h1>
          <p className="text-sm text-gray-500 mt-0.5">{filtered.length} sucursales registradas</p>
        </div>
        <div className="flex gap-2">
          <button onClick={handleExport} className="btn-secondary">
            <ArrowDownTrayIcon className="h-4 w-4" /> Exportar Excel
          </button>
          <button onClick={handleOpenNew} className="btn-primary">
            <PlusIcon className="h-4 w-4" /> Nueva Sucursal
          </button>
        </div>
      </div>

      <div className="card p-4">
        <div className="relative">
          <MagnifyingGlassIcon className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
          <input
            type="text" placeholder="Buscar por Nombre, RUC, Anexo..."
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
                <th className="px-4 py-3 font-medium">Anexo</th>
                <th className="px-4 py-3 font-medium">Sucursal</th>
                <th className="px-4 py-3 font-medium">RUC</th>
                <th className="px-4 py-3 font-medium">Razón Social</th>
                <th className="px-4 py-3 font-medium">Dirección</th>
                <th className="px-4 py-3 font-medium text-center">Estado</th>
                <th className="px-4 py-3 font-medium text-center">Acciones</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
              {loading ? (
                <tr><td colSpan="7" className="py-8 text-center text-slate-500">Cargando sucursales...</td></tr>
              ) : filtered.length === 0 ? (
                <tr><td colSpan="7" className="py-8 text-center text-slate-500">No se encontraron sucursales.</td></tr>
              ) : (
                filtered.map((s) => (
                  <tr key={s.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors text-slate-700 dark:text-slate-300">
                    <td className="px-4 py-3 font-mono text-xs">{s.codigo_anexo}</td>
                    <td className="px-4 py-3 font-medium">{s.sucursal_nombre}</td>
                    <td className="px-4 py-3 font-mono text-xs text-slate-500">{s.ruc}</td>
                    <td className="px-4 py-3 text-slate-500">{s.razon_social}</td>
                    <td className="px-4 py-3 text-slate-500 max-w-[200px] truncate" title={s.direccion}>{s.direccion}</td>
                    <td className="px-4 py-3 text-center">
                      <span className={s.activo ? 'badge-green' : 'badge-gray'}>
                        {s.activo ? 'Activo' : 'Inactivo'}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center justify-center gap-1">
                        <button onClick={() => handleOpenEdit(s)} className="p-1.5 rounded hover:bg-blue-50 text-slate-400 hover:text-blue-600 transition-colors">
                          <PencilIcon className="h-4 w-4" />
                        </button>
                        <button
                          onClick={() => handleDelete(s.id)}
                          className="p-1.5 rounded hover:bg-red-50 text-slate-400 hover:text-red-600 transition-colors"
                        >
                          <TrashIcon className="h-4 w-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      <SucursalModal
        isOpen={isModalOpen}
        onClose={() => setModalOpen(false)}
        onSave={handleSaveModal}
        sucursal={sucursalEdit}
      />
    </div>
  )
}
