import { useEffect, useState, useCallback, useMemo } from 'react'
import { PlusIcon, PencilIcon, TrashIcon, HomeModernIcon } from '@heroicons/react/24/outline'
import { almacenController } from '../controllers/almacen.js'
import { toast } from '../../../utils/toast'
import AlmacenModal from '../components/AlmacenModal.jsx'
import { DataTable } from '../../../components/ui/DataTable.jsx'

export function Almacenes() {
  const [almacenes, setAlmacenes] = useState([])
  const [loading, setLoading] = useState(true)
  const [isModalOpen, setModalOpen] = useState(false)
  const [almacenEdit, setAlmacenEdit] = useState(null)

  const loadAlmacenes = useCallback(async () => {
    setLoading(true)
    const res = await almacenController.getAll()
    if (res.success) setAlmacenes(res.data)
    else toast.error('Error al cargar los almacenes')
    setLoading(false)
  }, [])

  useEffect(() => {
    loadAlmacenes()
  }, [loadAlmacenes])

  const handleOpenNew = () => {
    setAlmacenEdit(null)
    setModalOpen(true)
  }

  const handleOpenEdit = (almacen) => {
    setAlmacenEdit(almacen)
    setModalOpen(true)
  }

  const handleDelete = async (id) => {
    if (!confirm('¿Eliminar almacén?')) return
    const res = await almacenController.delete(id)
    if (res.success) {
      toast.success('Almacén eliminado correctamente')
      loadAlmacenes()
    } else {
      toast.error(res.message || 'Error al eliminar el almacén')
    }
  }

  const handleSaveModal = async (data) => {
    let res
    if (almacenEdit) {
      res = await almacenController.update(almacenEdit.id, data)
    } else {
      res = await almacenController.create(data)
    }
    
    if (res.success) {
      setModalOpen(false)
      toast.success(almacenEdit ? 'Almacén actualizado correctamente' : 'Almacén creado correctamente')
      loadAlmacenes()
    } else {
      toast.error(res.message || 'Error al guardar el almacén')
    }
  }

  const columns = useMemo(() => [
    {
      accessorKey: 'codigo',
      header: 'Código',
      cell: info => <span className="font-mono text-xs font-semibold tracking-wider text-slate-700 dark:text-slate-300">{info.getValue() || '-'}</span>,
      size: 100
    },
    {
      accessorKey: 'nombre',
      header: 'Nombre del Almacén',
      cell: info => (
        <div className="flex items-center gap-2">
          <HomeModernIcon className="h-5 w-5 text-slate-400" />
          <span className="font-medium text-slate-800 dark:text-slate-100">{info.getValue()}</span>
          {info.row.original.es_principal && (
            <span className="ml-2 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider text-blue-600 bg-blue-100 dark:text-blue-400 dark:bg-blue-900/30 rounded-full">
              Principal
            </span>
          )}
        </div>
      ),
      size: 300
    },
    {
      accessorKey: 'direccion',
      header: 'Dirección',
      cell: info => info.getValue() || <span className="text-slate-400 italic">No especificada</span>,
      size: 300
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
          <h1 className="text-2xl font-bold text-slate-800 dark:text-white">Almacenes</h1>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
            {almacenes.length} {almacenes.length === 1 ? 'almacén registrado' : 'almacenes registrados'} en el sistema
          </p>
        </div>
        <div className="flex gap-2">
          <button onClick={handleOpenNew} className="btn-primary flex items-center gap-2">
            <PlusIcon className="h-4 w-4" /> Nuevo Almacén
          </button>
        </div>
      </div>

      <div className="w-full">
        {loading ? (
          <div className="flex flex-col items-center justify-center h-64 bg-white dark:bg-slate-900 rounded-2xl shadow-sm border border-slate-200/60 dark:border-slate-800/60">
            <div className="w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
            <p className="mt-4 text-slate-500 font-medium">Cargando almacenes...</p>
          </div>
        ) : (
          <DataTable data={almacenes} columns={columns} pagination={true} />
        )}
      </div>

      <AlmacenModal
        isOpen={isModalOpen}
        onClose={() => setModalOpen(false)}
        onSave={handleSaveModal}
        almacen={almacenEdit}
      />
    </div>
  )
}
