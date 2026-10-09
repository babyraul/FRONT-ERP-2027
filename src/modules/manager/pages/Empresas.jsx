import { useEffect, useState, useCallback, useMemo } from 'react'
import { ArrowDownTrayIcon, PlusIcon, PencilIcon, TrashIcon, BuildingOfficeIcon, Squares2X2Icon, ArrowLeftIcon } from '@heroicons/react/24/outline'
import { Link } from 'react-router-dom'
import { empresaController } from '../controllers/empresa.js'
import { exportToExcel } from '../../../utils/exportExcel.js'
import { toast } from '../../../utils/toast'
import EmpresaModal from '../components/EmpresaModal.jsx'
import EmpresaModulosModal from '../components/EmpresaModulosModal.jsx'
import { DataTable } from '../../../components/ui/DataTable.jsx'
import Can from '../../../components/ui/Can.jsx'

export function Empresas() {
  const [empresas, setEmpresas] = useState([])
  const [loading, setLoading] = useState(true)
  const [isModalOpen, setModalOpen] = useState(false)
  const [empresaEdit, setEmpresaEdit] = useState(null)
  
  // Estado para el modal de módulos
  const [isModulosModalOpen, setModulosModalOpen] = useState(false)
  const [empresaModulosEdit, setEmpresaModulosEdit] = useState(null)

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

  const handleOpenModulos = (empresa) => {
    setEmpresaModulosEdit(empresa)
    setModulosModalOpen(true)
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
          <Can I="modulos" a="empresas" fallback={
            <button disabled className="p-1.5 rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-400 cursor-not-allowed" title="Sin permiso">
              <Squares2X2Icon className="h-4 w-4" />
            </button>
          }>
            <button onClick={() => handleOpenModulos(row.original)} className="p-1.5 rounded-lg bg-teal-50 dark:bg-teal-900/20 text-teal-600 dark:text-teal-400 hover:bg-teal-100 dark:hover:bg-teal-900/40 transition-colors tooltip-target" title="Asignar Módulos">
              <Squares2X2Icon className="h-4 w-4" />
            </button>
          </Can>
          
          <Can I="editar" a="empresas" fallback={
            <button disabled className="p-1.5 rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-400 cursor-not-allowed" title="Sin permiso">
              <PencilIcon className="h-4 w-4" />
            </button>
          }>
            <button onClick={() => handleOpenEdit(row.original)} className="p-1.5 rounded-lg bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400 hover:bg-blue-100 dark:hover:bg-blue-900/40 transition-colors tooltip-target" title="Editar Empresa">
              <PencilIcon className="h-4 w-4" />
            </button>
          </Can>
          
          <Can I="eliminar" a="empresas" fallback={
            <button disabled className="p-1.5 rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-400 cursor-not-allowed" title="Sin permiso">
              <TrashIcon className="h-4 w-4" />
            </button>
          }>
            <button onClick={() => handleDelete(row.original.id)} className="p-1.5 rounded-lg bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 hover:bg-red-100 dark:hover:bg-red-900/40 transition-colors tooltip-target" title="Eliminar Empresa">
              <TrashIcon className="h-4 w-4" />
            </button>
          </Can>
        </div>
      ),
      size: 100,
      enableColumnFilter: false
    }
  ], [])

  return (
    <div className="space-y-6 p-6">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <Link to="/configuracion" className="p-2 -ml-2 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-full transition-colors text-slate-500" title="Volver a Configuración">
            <ArrowLeftIcon className="h-5 w-5" />
          </Link>
          <div>
            <h1 className="text-2xl font-bold text-slate-800 dark:text-white">Empresas</h1>
            <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
              {empresas.length} {empresas.length === 1 ? 'empresa registrada' : 'empresas registradas'} en el sistema
            </p>
          </div>
        </div>
        <div className="flex gap-2">
          <button onClick={handleExport} className="btn-secondary flex items-center gap-2">
            <ArrowDownTrayIcon className="h-4 w-4" /> Exportar Excel
          </button>
          <Can I="crear" a="empresas">
            <button onClick={handleOpenNew} className="btn-primary flex items-center gap-2">
              <PlusIcon className="h-4 w-4" /> Nueva Empresa
            </button>
          </Can>
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

      <EmpresaModulosModal
        isOpen={isModulosModalOpen}
        onClose={() => setModulosModalOpen(false)}
        empresa={empresaModulosEdit}
      />
    </div>
  )
}
