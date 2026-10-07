import { useEffect, useState, useCallback, useMemo } from 'react'
import { ArrowDownTrayIcon, PlusIcon, PencilIcon, TrashIcon, BuildingOfficeIcon } from '@heroicons/react/24/outline'
import { empresaController } from '../controllers/empresa.js'
import { exportToExcel } from '../../../utils/exportExcel.js'
import { toast } from '../../../utils/toast'
import EmpresaModal from '../components/EmpresaModal.jsx'
import { DataTable } from '../../../components/ui/DataTable.jsx'

export function Empresas() {
  const [empresas, setEmpresas] = useState([])
  const [loading, setLoading] = useState(true)
  const [isModalOpen, setModalOpen] = useState(false)
  const [empresaEdit, setEmpresaEdit] = useState(null)

  const loadEmpresas = useCallback(async () => {
    setLoading(true)
    const res = await empresaController.getAll()
    if (res.success) setEmpresas(res.data)
    else toast.error('Error al cargar las empresas')
    setLoading(false)
  }, [])

  useEffect(() => {
    loadEmpresas()
  }, [loadEmpresas])

  const handleExport = () => {
    const data = empresas.map((e) => ({
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
      toast.success('Empresa eliminada correctamente')
      loadEmpresas()
    } else {
      toast.error(res.message || 'Error al eliminar la empresa')
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
      toast.success(empresaEdit ? 'Empresa actualizada correctamente' : 'Empresa, Sucursal y Almacén creados correctamente')
      loadEmpresas()
    } else {
      toast.error(res.message || 'Error al guardar la empresa')
    }
  }

  const columns = useMemo(() => [
    {
      accessorKey: 'ruc',
      header: 'RUC',
      cell: info => <span className="font-mono text-xs font-semibold tracking-wider text-slate-700 dark:text-slate-300">{info.getValue()}</span>,
      size: 150
    },
    {
      accessorKey: 'razon_social',
      header: 'Razón Social',
      cell: info => (
        <div className="flex items-center gap-2">
          <BuildingOfficeIcon className="h-5 w-5 text-slate-400" />
          <span className="font-medium text-slate-800 dark:text-slate-100">{info.getValue()}</span>
        </div>
      ),
      size: 400
    },
    {
      accessorKey: 'nombre_comercial',
      header: 'Nombre Comercial',
      cell: info => info.getValue() || <span className="text-slate-400 italic">No especificado</span>,
      size: 400
    },
    {
      accessorKey: 'ubigeo_descripcion',
      header: 'Ubicación (Ubigeo)',
      cell: info => info.getValue() || <span className="text-slate-400 italic">No especificado</span>,
      size: 300
    },
    {
      accessorKey: 'email1',
      header: 'Email',
      size: 150
    },
    {
      accessorKey: 'telefono1',
      header: 'Teléfono',
      size: 120
    },
    {
      accessorKey: 'activo',
      header: 'Estado',
      cell: info => (
        <div className="flex justify-center">
          <span className={info.getValue() ? 'badge-green' : 'badge-gray'}>
            {info.getValue() ? 'Activo' : 'Inactivo'}
          </span>
        </div>
      ),
      size: 100,
      enableColumnFilter: false
    },
    {
      id: 'acciones',
      header: 'Acciones',
      cell: ({ row }) => (
        <div className="flex items-center justify-center gap-1.5">
          <button onClick={() => handleOpenEdit(row.original)} className="p-1.5 rounded-lg bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400 hover:bg-blue-100 dark:hover:bg-blue-900/40 transition-colors tooltip-target" title="Editar">
            <PencilIcon className="h-4 w-4" />
          </button>
          <button onClick={() => handleDelete(row.original.id)} className="p-1.5 rounded-lg bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 hover:bg-red-100 dark:hover:bg-red-900/40 transition-colors tooltip-target" title="Eliminar">
            <TrashIcon className="h-4 w-4" />
          </button>
        </div>
      ),
      size: 100,
      enableColumnFilter: false
    }
  ], [])

  return (
    <div className="space-y-6 p-6">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-800 dark:text-white">Empresas</h1>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
            {empresas.length} {empresas.length === 1 ? 'empresa registrada' : 'empresas registradas'} en el sistema
          </p>
        </div>
        <div className="flex gap-2">
          <button onClick={handleExport} className="btn-secondary flex items-center gap-2">
            <ArrowDownTrayIcon className="h-4 w-4" /> Exportar Excel
          </button>
          <button onClick={handleOpenNew} className="btn-primary flex items-center gap-2">
            <PlusIcon className="h-4 w-4" /> Nueva Empresa
          </button>
        </div>
      </div>

      <div className="w-full">
        {loading ? (
          <div className="flex flex-col items-center justify-center h-64 bg-white dark:bg-slate-900 rounded-2xl shadow-sm border border-slate-200/60 dark:border-slate-800/60">
            <div className="w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
            <p className="mt-4 text-slate-500 font-medium">Cargando empresas...</p>
          </div>
        ) : (
          <DataTable data={empresas} columns={columns} pagination={true} />
        )}
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
