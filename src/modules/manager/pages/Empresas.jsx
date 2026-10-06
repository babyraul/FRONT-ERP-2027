import { useEffect, useState, useCallback } from 'react'
import { MagnifyingGlassIcon, ArrowDownTrayIcon, PlusIcon, PencilIcon, TrashIcon } from '@heroicons/react/24/outline'
import { empresaController } from '../controllers/empresa.js'
import { exportToExcel } from '../../../utils/exportExcel.js'
import EmpresaModal from '../components/EmpresaModal.jsx'

export function Empresas() {
  const [empresas, setEmpresas] = useState([])
  const [loading, setLoading] = useState(true)
  const [busq, setBusq] = useState('')
  const [isModalOpen, setModalOpen] = useState(false)
  const [empresaEdit, setEmpresaEdit] = useState(null)

  const loadEmpresas = useCallback(async () => {
    setLoading(true)
    const res = await empresaController.getAll()
    if (res.success) setEmpresas(res.data)
    setLoading(false)
  }, [])

  useEffect(() => {
    loadEmpresas()
  }, [loadEmpresas])

  const handleBusq = (e) => setBusq(e.target.value)

  const filtered = empresas.filter(e => 
    e.ruc?.toLowerCase().includes(busq.toLowerCase()) || 
    e.razon_social?.toLowerCase().includes(busq.toLowerCase()) ||
    e.nombre_comercial?.toLowerCase().includes(busq.toLowerCase())
  )

  const handleExport = () => {
    const data = filtered.map((e) => ({
      RUC: e.ruc,
      'Razón Social': e.razon_social,
      'Nombre Comercial': e.nombre_comercial,
      Teléfono: e.telefono1,
      Email: e.email1,
      Estado: e.activo ? 'Activo' : 'Inactivo',
    }))
    exportToExcel(data, 'empresas', 'Empresas')
  }

  const handleOpenNew = () => {
    setEmpresaEdit(null)
    setModalOpen(true)
  }

  const handleOpenEdit = (empresa) => {
    setEmpresaEdit(empresa)
    setModalOpen(true)
  }

  const handleDelete = async (id) => {
    if (!confirm('¿Eliminar empresa?')) return
    const res = await empresaController.delete(id)
    if (res.success) {
      loadEmpresas()
    } else {
      alert(res.message || 'Error al eliminar')
    }
  }

  const handleSaveModal = async (data) => {
    let res
    if (empresaEdit) {
      res = await empresaController.update(empresaEdit.id, data)
    } else {
      res = await empresaController.create(data)
    }
    
    if (res.success) {
      setModalOpen(false)
      loadEmpresas()
    } else {
      alert(res.message || 'Error al guardar la empresa')
    }
  }

  return (
    <div className="space-y-5 p-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Empresas</h1>
          <p className="text-sm text-gray-500 mt-0.5">{filtered.length} empresas registradas</p>
        </div>
        <div className="flex gap-2">
          <button onClick={handleExport} className="btn-secondary">
            <ArrowDownTrayIcon className="h-4 w-4" /> Exportar Excel
          </button>
          <button onClick={handleOpenNew} className="btn-primary">
            <PlusIcon className="h-4 w-4" /> Nueva Empresa
          </button>
        </div>
      </div>

      <div className="card p-4">
        <div className="relative">
          <MagnifyingGlassIcon className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
          <input
            type="text" placeholder="Buscar por RUC, Razón Social o Nombre Comercial..."
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
                <th className="px-4 py-3 font-medium">RUC</th>
                <th className="px-4 py-3 font-medium">Razón Social</th>
                <th className="px-4 py-3 font-medium">Nombre Comercial</th>
                <th className="px-4 py-3 font-medium">Email</th>
                <th className="px-4 py-3 font-medium">Teléfono</th>
                <th className="px-4 py-3 font-medium text-center">Estado</th>
                <th className="px-4 py-3 font-medium text-center">Acciones</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
              {loading ? (
                <tr><td colSpan="7" className="py-8 text-center text-slate-500">Cargando empresas...</td></tr>
              ) : filtered.length === 0 ? (
                <tr><td colSpan="7" className="py-8 text-center text-slate-500">No se encontraron empresas.</td></tr>
              ) : (
                filtered.map((e) => (
                  <tr key={e.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors text-slate-700 dark:text-slate-300">
                    <td className="px-4 py-3 font-mono text-xs">{e.ruc}</td>
                    <td className="px-4 py-3 font-medium">{e.razon_social}</td>
                    <td className="px-4 py-3">{e.nombre_comercial}</td>
                    <td className="px-4 py-3 text-slate-500 dark:text-slate-400">{e.email1}</td>
                    <td className="px-4 py-3 text-slate-500 dark:text-slate-400">{e.telefono1}</td>
                    <td className="px-4 py-3 text-center">
                      <span className={e.activo ? 'badge-green' : 'badge-gray'}>
                        {e.activo ? 'Activo' : 'Inactivo'}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center justify-center gap-1">
                        <button onClick={() => handleOpenEdit(e)} className="p-1.5 rounded hover:bg-blue-50 text-slate-400 hover:text-blue-600 transition-colors">
                          <PencilIcon className="h-4 w-4" />
                        </button>
                        <button
                          onClick={() => handleDelete(e.id)}
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

      <EmpresaModal
        isOpen={isModalOpen}
        onClose={() => setModalOpen(false)}
        onSave={handleSaveModal}
        empresa={empresaEdit}
      />
    </div>
  )
}
