import { useEffect, useState, useCallback, useMemo } from 'react'
import { PlusIcon, PencilIcon, TrashIcon, ShieldCheckIcon } from '@heroicons/react/24/outline'
import { rolController } from '../controllers/rol.js'
import { toast } from '../../../utils/toast'
import RolModal from '../components/RolModal.jsx'
import { DataTable } from '../../../components/ui/DataTable.jsx'
import { useAuthStore } from '../../../store/useAuthStore'

export default function Roles() {
  const [roles, setRoles] = useState([])
  const [loading, setLoading] = useState(true)
  const [isModalOpen, setModalOpen] = useState(false)
  const [rolEdit, setRolEdit] = useState(null)
  
  // En un sistema multitenant, cuando se crea un rol se debe enviar el empresa_id.
  // Aquí podemos sacarlo del usuario actual.
  const { user } = useAuthStore()

  const loadRoles = useCallback(async () => {
    setLoading(true)
    const res = await rolController.getAll()
    if (res.success) setRoles(res.data)
    else toast.error('Error al cargar los roles')
    setLoading(false)
  }, [])

  useEffect(() => {
    loadRoles()
  }, [loadRoles])

  const handleOpenNew = () => {
    setRolEdit(null)
    setModalOpen(true)
  }

  const handleOpenEdit = (rol) => {
    setRolEdit(rol)
    setModalOpen(true)
  }

  const handleDelete = async (id) => {
    if (!confirm('¿Eliminar rol?')) return
    const res = await rolController.delete(id)
    if (res.success) {
      toast.success('Rol eliminado correctamente')
      loadRoles()
    } else {
      toast.error(res.message || 'Error al eliminar el rol')
    }
  }

  const handleSaveModal = async (data) => {
    let res
    
    // Si estamos creando y el data no tiene empresa_id, se la inyectamos
    const payload = { ...data }
    if (!rolEdit && !payload.empresa_id && user?.empresa_id) {
      payload.empresa_id = user.empresa_id
    }

    if (rolEdit) {
      res = await rolController.update(rolEdit.id, payload)
    } else {
      res = await rolController.create(payload)
    }
    
    if (res.success) {
      setModalOpen(false)
      toast.success(rolEdit ? 'Rol actualizado correctamente' : 'Rol creado correctamente')
      loadRoles()
    } else {
      toast.error(res.message || 'Error al guardar el rol')
    }
  }

  const columns = useMemo(() => [
    {
      accessorKey: 'nombre',
      header: 'Nombre del Rol',
      cell: info => (
        <div className="flex items-center gap-2">
          <ShieldCheckIcon className="h-5 w-5 text-slate-400" />
          <span className="font-medium text-slate-800 dark:text-slate-100">{info.getValue()}</span>
          {info.row.original.es_sistema && (
            <span className="ml-2 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider text-purple-600 bg-purple-100 dark:text-purple-400 dark:bg-purple-900/30 rounded-full">
              Sistema
            </span>
          )}
        </div>
      ),
      size: 300
    },
    {
      accessorKey: 'descripcion',
      header: 'Descripción',
      cell: info => info.getValue() || <span className="text-slate-400 italic">No especificada</span>,
      size: 400
    },
    {
      accessorKey: 'nivel',
      header: 'Nivel',
      cell: info => <span className="font-mono text-xs font-semibold text-slate-600 dark:text-slate-300">{info.getValue()}</span>,
      size: 100
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
          {!row.original.es_sistema && (
            <button onClick={() => handleDelete(row.original.id)} className="p-1.5 rounded-lg bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 hover:bg-red-100 dark:hover:bg-red-900/40 transition-colors tooltip-target" title="Eliminar">
              <TrashIcon className="h-4 w-4" />
            </button>
          )}
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
          <h1 className="text-2xl font-bold text-slate-800 dark:text-white">Roles y Permisos</h1>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
            Gestión de roles de acceso del sistema
          </p>
        </div>
        <div className="flex gap-2">
          <button onClick={handleOpenNew} className="btn-primary flex items-center gap-2">
            <PlusIcon className="h-4 w-4" /> Nuevo Rol
          </button>
        </div>
      </div>

      <div className="w-full">
        {loading ? (
          <div className="flex flex-col items-center justify-center h-64 bg-white dark:bg-slate-900 rounded-2xl shadow-sm border border-slate-200/60 dark:border-slate-800/60">
            <div className="w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
            <p className="mt-4 text-slate-500 font-medium">Cargando roles...</p>
          </div>
        ) : (
          <DataTable data={roles} columns={columns} pagination={true} />
        )}
      </div>

      <RolModal
        isOpen={isModalOpen}
        onClose={() => setModalOpen(false)}
        onSave={handleSaveModal}
        rol={rolEdit}
      />
    </div>
  )
}
