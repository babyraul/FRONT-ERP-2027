import { useEffect, useState, useCallback, useMemo } from 'react'
import { MagnifyingGlassIcon, ArrowDownTrayIcon, PlusIcon, PencilIcon, TrashIcon, ArrowLeftIcon } from '@heroicons/react/24/outline'
import { Link } from 'react-router-dom'
import { sucursalController } from '../controllers/sucursal.js'
import { exportToExcel } from '../../../utils/exportExcel.js'
import SucursalModal from '../components/SucursalModal.jsx'
import { DataTable } from '../../../components/ui/DataTable.jsx'
import Can from '../../../components/ui/Can.jsx'

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

  // eslint-disable-next-line react-hooks/exhaustive-deps
  const columns = useMemo(() => [
    {
      header: 'Anexo',
      accessorKey: 'codigo_anexo',
    },
    {
      header: 'Sucursal',
      accessorKey: 'sucursal_nombre',
    },
    {
      header: 'Empresa',
      id: 'empresa_info',
      accessorFn: row => `${row.ruc} - ${row.razon_social}`,
      cell: ({ row }) => (
        <div className="flex flex-col">
          <span className="font-medium text-slate-700 dark:text-slate-200">{row.original.razon_social}</span>
          <span className="text-xs text-slate-500 font-mono">RUC: {row.original.ruc}</span>
        </div>
      )
    },
    {
      header: 'Ubicación',
      id: 'ubicacion_info',
      accessorFn: row => `${row.direccion} ${row.ubigeo_descripcion || ''}`,
      cell: ({ row }) => (
        <div className="flex flex-col max-w-[250px]">
          <span className="text-sm text-slate-700 dark:text-slate-300 truncate" title={row.original.direccion}>
            {row.original.direccion}
          </span>
          {row.original.ubigeo_descripcion && (
            <span className="text-xs text-slate-500 truncate" title={row.original.ubigeo_descripcion}>
              {row.original.ubigeo_descripcion}
            </span>
          )}
        </div>
      )
    },
    {
      header: 'Estado',
      accessorKey: 'activo',
      cell: ({ row }) => {
        const isActive = row.original.activo
        return (
          <div className="flex justify-center">
            <span className={isActive ? 'badge-green' : 'badge-gray'}>
              {isActive ? 'Activo' : 'Inactivo'}
            </span>
          </div>
        )
      }
    },
    {
      header: 'Acciones',
      id: 'acciones',
      cell: ({ row }) => {
        const s = row.original
        return (
          <div className="flex items-center justify-center gap-1">
            <Can I="editar" a="sucursales" fallback={
              <button disabled className="p-1.5 rounded bg-slate-50 text-slate-300 cursor-not-allowed" title="Sin permiso">
                <PencilIcon className="h-4 w-4" />
              </button>
            }>
              <button onClick={() => handleOpenEdit(s)} className="p-1.5 rounded hover:bg-blue-50 text-slate-400 hover:text-blue-600 transition-colors" title="Editar">
                <PencilIcon className="h-4 w-4" />
              </button>
            </Can>
            
            <Can I="eliminar" a="sucursales" fallback={
              <button disabled className="p-1.5 rounded bg-slate-50 text-slate-300 cursor-not-allowed" title="Sin permiso">
                <TrashIcon className="h-4 w-4" />
              </button>
            }>
              <button
                onClick={() => handleDelete(s.id)}
                className="p-1.5 rounded hover:bg-red-50 text-slate-400 hover:text-red-600 transition-colors"
                title="Eliminar"
              >
                <TrashIcon className="h-4 w-4" />
              </button>
            </Can>
          </div>
        )
      }
    }
  ], [])

  return (
    <div className="space-y-5 p-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Link to="/configuracion" className="p-2 -ml-2 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-full transition-colors text-slate-500" title="Volver a Configuración">
            <ArrowLeftIcon className="h-5 w-5" />
          </Link>
          <div>
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Sucursales</h1>
            <p className="text-sm text-gray-500 mt-0.5">{filtered.length} sucursales registradas</p>
          </div>
        </div>
        <div className="flex gap-2">
          <button onClick={handleExport} className="btn-secondary">
            <ArrowDownTrayIcon className="h-4 w-4" /> Exportar Excel
          </button>
          <Can I="crear" a="sucursales">
            <button onClick={handleOpenNew} className="btn-primary">
              <PlusIcon className="h-4 w-4" /> Nueva Sucursal
            </button>
          </Can>
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

      {loading ? (
        <div className="py-8 text-center text-slate-500">Cargando sucursales...</div>
      ) : (
        <DataTable data={filtered} columns={columns} />
      )}

      <SucursalModal
        isOpen={isModalOpen}
        onClose={() => setModalOpen(false)}
        onSave={handleSaveModal}
        sucursal={sucursalEdit}
      />
    </div>
  )
}
