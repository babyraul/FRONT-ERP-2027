import { useEffect, useState, useMemo, useCallback } from 'react'
import { PlusIcon, PencilIcon, TrashIcon, KeyIcon, ArrowLeftIcon } from '@heroicons/react/24/outline'
import { Link } from 'react-router-dom'
import { DataTable } from '../../../components/ui/DataTable.jsx'
import { toast } from '../../../utils/toast.js'
import { usuarioController } from '../controllers/usuario.js'
import UsuarioModal from '../components/UsuarioModal.jsx'
import UsuarioAccesosModal from '../components/UsuarioAccesosModal.jsx'
import Can from '../../../components/ui/Can.jsx'

export default function Usuarios() {
  const [usuarios, setUsuarios] = useState([])
  const [loading, setLoading] = useState(true)
  const [isModalOpen, setModalOpen] = useState(false)
  const [usuarioEdit, setUsuarioEdit] = useState(null)
  
  const [isAccessModalOpen, setAccessModalOpen] = useState(false)
  const [usuarioAccess, setUsuarioAccess] = useState(null)

  const loadUsuarios = useCallback(async () => {
    setLoading(true)
    const res = await usuarioController.getAll()
    if (res.success) {
      setUsuarios(res.data)
    }
    setLoading(false)
  }, [])

  useEffect(() => {
    loadUsuarios()
  }, [loadUsuarios])

  const handleOpenEdit = (user) => {
    setUsuarioEdit(user)
    setModalOpen(true)
  }

  const handleDelete = async (id) => {
    if (!confirm('¿Eliminar usuario de manera permanente?')) return
    const res = await usuarioController.delete(id)
    if (res.success) {
      toast.success('Éxito', 'Usuario eliminado.')
      loadUsuarios()
    } else {
      toast.error('Error al eliminar', res.message)
    }
  }

  const handleOpenAccess = (user) => {
    setUsuarioAccess(user)
    setAccessModalOpen(true)
  }

  const columns = useMemo(() => [
    {
      accessorKey: 'nombre',
      header: 'Nombre Completo',
      size: 200,
      cell: info => <span className="font-medium text-slate-800 dark:text-slate-200">{info.getValue()}</span>
    },
    {
      accessorKey: 'usuario',
      header: 'Usuario (Login)',
      size: 150,
      cell: info => <span className="font-mono text-blue-600 dark:text-blue-400 font-semibold">{info.getValue()}</span>
    },
    {
      accessorKey: 'es_super_admin',
      header: 'Privilegios',
      size: 120,
      cell: info => (
        <div className="text-center">
          <span className={info.getValue() ? 'badge-red' : 'badge-gray'}>
            {info.getValue() ? 'Super Admin' : 'Estándar'}
          </span>
        </div>
      )
    },
    {
      accessorKey: 'activo',
      header: 'Estado',
      size: 100,
      cell: info => (
        <div className="text-center">
          <span className={info.getValue() ? 'badge-green' : 'badge-gray'}>
            {info.getValue() ? 'Activo' : 'Inactivo'}
          </span>
        </div>
      )
    },
    {
      accessorKey: 'last_activity_at',
      header: 'Última Actividad',
      size: 160,
      cell: info => {
        const val = info.getValue()
        return val ? new Date(val).toLocaleString() : '-'
      }
    },
    {
      id: 'acciones',
      header: 'Acciones',
      size: 150,
      enableSorting: false,
      enableColumnFilter: false,
      cell: info => (
        <div className="flex items-center justify-center gap-1">
          <Can I="editar" a="usuarios" fallback={
            <button disabled className="p-1.5 rounded bg-slate-50 text-slate-300 cursor-not-allowed" title="Sin permiso">
              <KeyIcon className="h-4 w-4" />
            </button>
          }>
            <button onClick={() => handleOpenAccess(info.row.original)} className="p-1.5 rounded hover:bg-yellow-50 text-slate-400 hover:text-yellow-600 transition-colors" title="Gestionar Accesos">
              <KeyIcon className="h-4 w-4" />
            </button>
          </Can>
          
          <Can I="editar" a="usuarios" fallback={
            <button disabled className="p-1.5 rounded bg-slate-50 text-slate-300 cursor-not-allowed" title="Sin permiso">
              <PencilIcon className="h-4 w-4" />
            </button>
          }>
            <button onClick={() => handleOpenEdit(info.row.original)} className="p-1.5 rounded hover:bg-blue-50 text-slate-400 hover:text-blue-600 transition-colors" title="Editar Identidad">
              <PencilIcon className="h-4 w-4" />
            </button>
          </Can>
          
          <Can I="eliminar" a="usuarios" fallback={
            <button disabled className="p-1.5 rounded bg-slate-50 text-slate-300 cursor-not-allowed" title="Sin permiso">
              <TrashIcon className="h-4 w-4" />
            </button>
          }>
            <button onClick={() => handleDelete(info.row.original.id)} className="p-1.5 rounded hover:bg-red-50 text-slate-400 hover:text-red-600 transition-colors" title="Eliminar Usuario">
              <TrashIcon className="h-4 w-4" />
            </button>
          </Can>
        </div>
      )
    }
  ], [])

  const handleOpenNew = () => {
    setUsuarioEdit(null)
    setModalOpen(true)
  }

  const handleSaveModal = async (data) => {
    let res
    if (usuarioEdit) {
      res = await usuarioController.update(usuarioEdit.id, data)
    } else {
      res = await usuarioController.create(data)
    }

    if (res.success) {
      toast.success('Guardado correctamente', usuarioEdit ? 'Usuario actualizado.' : 'Usuario creado.')
      setModalOpen(false)
      loadUsuarios()
    } else {
      toast.error('Error', res.message)
    }
  }

  return (
    <div className="space-y-5 p-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Link to="/configuracion" className="p-2 -ml-2 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-full transition-colors text-slate-500" title="Volver a Configuración">
            <ArrowLeftIcon className="h-5 w-5" />
          </Link>
          <div>
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Gestión de Usuarios</h1>
            <p className="text-sm text-gray-500 mt-0.5">{usuarios.length} usuarios registrados en el sistema</p>
          </div>
        </div>
        <Can I="crear" a="usuarios">
          <button onClick={handleOpenNew} className="btn-primary">
            <PlusIcon className="h-4 w-4" /> Nuevo Usuario
          </button>
        </Can>
      </div>

      {loading ? (
        <div className="card p-8 text-center text-slate-500">Cargando usuarios...</div>
      ) : (
        <DataTable data={usuarios} columns={columns} />
      )}

      <UsuarioModal
        isOpen={isModalOpen}
        onClose={() => setModalOpen(false)}
        onSave={handleSaveModal}
        usuario={usuarioEdit}
      />

      <UsuarioAccesosModal
        isOpen={isAccessModalOpen}
        onClose={() => setAccessModalOpen(false)}
        user={usuarioAccess}
      />
    </div>
  )
}
