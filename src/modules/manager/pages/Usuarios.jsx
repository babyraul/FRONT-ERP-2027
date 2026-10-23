import { useEffect, useState, useMemo, useCallback } from 'react'
import {
  PencilIcon,
  TrashIcon,
  KeyIcon,
  ArrowLeftIcon,
  UserIcon,
  MagnifyingGlassIcon
} from '@heroicons/react/24/outline'
import { Link } from 'react-router-dom'
import { DataTable } from '../../../components/ui/DataTable.jsx'
import { toast } from '../../../utils/toast.js'
import { exportToExcel } from '../../../utils/exportExcel.js'
import { usuarioController } from '../controllers/usuario.js'
import UsuarioModal from '../components/UsuarioModal.jsx'
import UsuarioAccesosModal from '../components/UsuarioAccesosModal.jsx'
import PageHeader from '../../../components/ui/PageHeader.jsx'
import {
  NewButton,
  ExportExcelButton,
  RefreshButton,
  ActionCell
} from '../../../components/ui/ActionButtons.jsx'
import Can from '../../../components/ui/Can.jsx'

export default function Usuarios() {
  const [usuarios, setUsuarios] = useState([])
  const [loading, setLoading] = useState(true)
  const [busq, setBusq] = useState('')
  const [estadoFiltro, setEstadoFiltro] = useState('todos') // 'todos' | 'activos' | 'inactivos'

  // Modal / Formulario Inline de Identidad de Usuario
  const [isModalOpen, setModalOpen] = useState(false)
  const [usuarioEdit, setUsuarioEdit] = useState(null)

  // Modal / Formulario Inline de Accesos
  const [isAccessModalOpen, setAccessModalOpen] = useState(false)
  const [usuarioAccess, setUsuarioAccess] = useState(null)

  const loadUsuarios = useCallback(async () => {
    setLoading(true)
    const res = await usuarioController.getAll()
    if (res.success) {
      setUsuarios(res.data)
    } else {
      toast.error('Error al cargar usuarios', res.message)
    }
    setLoading(false)
  }, [])

  useEffect(() => {
    loadUsuarios()
  }, [loadUsuarios])

  const handleOpenNew = () => {
    setUsuarioEdit(null)
    setAccessModalOpen(false)
    setUsuarioAccess(null)
    setModalOpen(true)
  }

  const handleOpenEdit = (user) => {
    setUsuarioEdit(user)
    setAccessModalOpen(false)
    setUsuarioAccess(null)
    setModalOpen(true)
  }

  const handleOpenAccess = (user) => {
    setUsuarioAccess(user)
    setModalOpen(false)
    setUsuarioEdit(null)
    setAccessModalOpen(true)
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
      setUsuarioEdit(null)
      loadUsuarios()
    } else {
      toast.error('Error', res.message)
    }
  }

  // Filtrado reactivo en memoria
  const filtered = useMemo(() => {
    let items = usuarios

    // Filtro por estado
    if (estadoFiltro === 'activos') {
      items = items.filter(u => u.activo)
    } else if (estadoFiltro === 'inactivos') {
      items = items.filter(u => !u.activo)
    }

    // Filtro por texto
    if (busq.trim()) {
      const q = busq.toLowerCase().trim()
      items = items.filter(u =>
        u.nombre?.toLowerCase().includes(q) ||
        u.usuario?.toLowerCase().includes(q) ||
        u.telefono?.toLowerCase().includes(q)
      )
    }

    return items
  }, [usuarios, estadoFiltro, busq])

  const handleExport = () => {
    const data = filtered.map((u) => ({
      Nombre: u.nombre,
      Usuario: u.usuario,
      Privilegios: u.es_super_admin ? 'Super Admin' : 'Estándar',
      Estado: u.activo ? 'Activo' : 'Inactivo',
      Teléfono: u.telefono || '',
      'Última Actividad': u.last_activity_at ? new Date(u.last_activity_at).toLocaleString() : '-'
    }))
    exportToExcel(data, 'usuarios', 'Usuarios')
    toast.success('Archivo descargado', 'El listado de usuarios se ha exportado correctamente a Excel.')
  }

  const columns = useMemo(() => [
    {
      accessorKey: 'nombre',
      header: 'Nombre Completo',
      size: 220,
      cell: info => (
        <div className="flex items-center gap-2">
          <div className="p-1 rounded-md bg-teal-50 dark:bg-teal-950/40 text-[#01a59c] shrink-0">
            <UserIcon className="h-4 w-4" />
          </div>
          <span className="font-medium text-slate-800 dark:text-slate-200">{info.getValue()}</span>
        </div>
      )
    },
    {
      accessorKey: 'usuario',
      header: 'Usuario (Login)',
      size: 160,
      cell: info => (
        <span className="font-mono text-xs font-semibold text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-900/20 px-2 py-0.5 rounded-md">
          {info.getValue()}
        </span>
      )
    },
    {
      accessorKey: 'es_super_admin',
      header: 'Privilegios',
      size: 130,
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
      ),
      enableColumnFilter: false
    },
    {
      accessorKey: 'last_activity_at',
      header: 'Última Actividad',
      size: 170,
      cell: info => {
        const val = info.getValue()
        return val ? (
          <span className="text-xs text-slate-600 dark:text-slate-400 font-mono">
            {new Date(val).toLocaleString()}
          </span>
        ) : (
          <span className="text-xs text-slate-400 italic">-</span>
        )
      }
    },
    {
      id: 'acciones',
      header: 'Acciones',
      size: 120,
      enableSorting: false,
      enableColumnFilter: false,
      cell: info => (
        <ActionCell>
          <Can I="editar" a="usuarios" fallback={
            <button disabled className="p-1.5 rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-400 cursor-not-allowed" title="Sin permiso">
              <KeyIcon className="h-4 w-4" />
            </button>
          }>
            <button
              onClick={() => handleOpenAccess(info.row.original)}
              className="p-1.5 rounded-lg bg-amber-50 dark:bg-amber-900/20 text-amber-600 dark:text-amber-400 hover:bg-amber-100 dark:hover:bg-amber-900/40 transition-colors cursor-pointer"
              title="Gestionar Accesos"
            >
              <KeyIcon className="h-4 w-4" />
            </button>
          </Can>

          <Can I="editar" a="usuarios" fallback={
            <button disabled className="p-1.5 rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-400 cursor-not-allowed" title="Sin permiso">
              <PencilIcon className="h-4 w-4" />
            </button>
          }>
            <button
              onClick={() => handleOpenEdit(info.row.original)}
              className="p-1.5 rounded-lg bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400 hover:bg-blue-100 dark:hover:bg-blue-900/40 transition-colors cursor-pointer"
              title="Editar Usuario"
            >
              <PencilIcon className="h-4 w-4" />
            </button>
          </Can>

          <Can I="eliminar" a="usuarios" fallback={
            <button disabled className="p-1.5 rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-400 cursor-not-allowed" title="Sin permiso">
              <TrashIcon className="h-4 w-4" />
            </button>
          }>
            <button
              onClick={() => handleDelete(info.row.original.id)}
              className="p-1.5 rounded-lg bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 hover:bg-red-100 dark:hover:bg-red-900/40 transition-colors cursor-pointer"
              title="Eliminar Usuario"
            >
              <TrashIcon className="h-4 w-4" />
            </button>
          </Can>
        </ActionCell>
      )
    }
  ], [])

  return (
    <div className="space-y-6 p-6">
      {/* ── ENCABEZADO MODULAR GLOBAL ── */}
      <PageHeader
        title="Gestión de Usuarios"
        subtitle={`${usuarios.length} ${usuarios.length === 1 ? 'usuario registrado' : 'usuarios registrados'} en el sistema`}
        leftActions={
          <Link
            to="/configuracion"
            className="p-2 -ml-1 text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-slate-200 rounded-full hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
            title="Volver a Configuración"
          >
            <ArrowLeftIcon className="h-5 w-5" />
          </Link>
        }
        actions={
          <>
            <RefreshButton
              onClick={loadUsuarios}
              loading={loading}
              title="Actualizar listado de usuarios"
            />

            <ExportExcelButton
              onClick={handleExport}
              disabled={loading || filtered.length === 0}
              label="Excel"
              title="Exportar listado de usuarios a Excel"
            />

            <Can I="crear" a="usuarios">
              <NewButton
                onClick={handleOpenNew}
                label="Nuevo Usuario"
                title="Registrar nuevo usuario"
              />
            </Can>
          </>
        }
      />

      {/* ── BARRA DE BÚSQUEDA Y FILTROS RÁPIDOS ── */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-3 p-3 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-2xs">
        {/* Selector de Estado */}
        <div className="flex items-center bg-slate-100 dark:bg-slate-800 p-0.5 rounded-lg border border-slate-200 dark:border-slate-700 w-full sm:w-auto">
          {[
            { id: 'todos', label: 'Todos' },
            { id: 'activos', label: 'Activos' },
            { id: 'inactivos', label: 'Inactivos' }
          ].map((f) => (
            <button
              key={f.id}
              type="button"
              onClick={() => setEstadoFiltro(f.id)}
              className={`flex-1 sm:flex-none px-3 py-1.5 text-xs font-bold rounded-md transition-all cursor-pointer ${
                estadoFiltro === f.id
                  ? f.id === 'inactivos'
                    ? 'bg-rose-600 text-white shadow-xs'
                    : 'bg-white dark:bg-slate-900 text-slate-800 dark:text-white shadow-xs'
                  : 'text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-white'
              }`}
            >
              {f.label}
            </button>
          ))}
        </div>

        {/* Input Buscador */}
        <div className="relative w-full sm:w-80">
          <MagnifyingGlassIcon className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
          <input
            type="text"
            placeholder="Buscar por nombre o usuario..."
            value={busq}
            onChange={(e) => setBusq(e.target.value)}
            className="w-full pl-9 pr-4 py-1.5 bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-[#01a59c] focus:bg-white dark:focus:bg-slate-900 outline-none text-xs dark:text-white transition-all"
          />
        </div>
      </div>

      {/* ── CONTENEDOR IN-PLACE CON TRANSICIÓN ANIMADA DE ActionSection ── */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-sm overflow-hidden transition-all duration-300">
        {isModalOpen ? (
          <UsuarioModal
            isOpen={isModalOpen}
            onClose={() => {
              setModalOpen(false)
              setUsuarioEdit(null)
            }}
            onSave={handleSaveModal}
            usuario={usuarioEdit}
            variant="inline"
          />
        ) : isAccessModalOpen ? (
          <UsuarioAccesosModal
            isOpen={isAccessModalOpen}
            onClose={() => {
              setAccessModalOpen(false)
              setUsuarioAccess(null)
            }}
            user={usuarioAccess}
            variant="inline"
          />
        ) : (
          <div className="transition-all duration-300 ease-in-out opacity-100 translate-y-0">
            <DataTable
              data={filtered}
              columns={columns}
              pagination={true}
              loading={loading}
              emptyMessage={
                estadoFiltro === 'inactivos'
                  ? 'No hay usuarios inactivos registrados.'
                  : 'No se encontraron usuarios registrados.'
              }
            />
          </div>
        )}
      </div>
    </div>
  )
}
