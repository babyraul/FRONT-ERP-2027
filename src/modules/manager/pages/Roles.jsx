import { useEffect, useState, useCallback, useMemo } from 'react'
import {
  PencilIcon,
  TrashIcon,
  ShieldCheckIcon,
  Squares2X2Icon,
  ArrowLeftIcon,
  MagnifyingGlassIcon
} from '@heroicons/react/24/outline'
import { Link } from 'react-router-dom'
import { rolController } from '../controllers/rol.js'
import { exportToExcel } from '../../../utils/exportExcel.js'
import { toast } from '../../../utils/toast'
import RolModal from '../components/RolModal.jsx'
import RolPermisosModal from '../components/RolPermisosModal.jsx'
import { DataTable } from '../../../components/ui/DataTable.jsx'
import PageHeader from '../../../components/ui/PageHeader.jsx'
import {
  NewButton,
  ExportExcelButton,
  RefreshButton,
  ActionCell
} from '../../../components/ui/ActionButtons.jsx'
import { useAuthStore } from '../../../store/useAuthStore'
import Can from '../../../components/ui/Can.jsx'

export default function Roles() {
  const [roles, setRoles] = useState([])
  const [loading, setLoading] = useState(true)
  const [busq, setBusq] = useState('')
  const [estadoFiltro, setEstadoFiltro] = useState('todos') // 'todos' | 'activos' | 'inactivos'

  // Modal / Formulario Inline de Rol
  const [isModalOpen, setModalOpen] = useState(false)
  const [rolEdit, setRolEdit] = useState(null)

  // Modal / Formulario Inline de Permisos
  const [isPermisosModalOpen, setPermisosModalOpen] = useState(false)
  const [rolPermisosEdit, setRolPermisosEdit] = useState(null)

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
    setPermisosModalOpen(false)
    setRolPermisosEdit(null)
    setModalOpen(true)
  }

  const handleOpenEdit = (rol) => {
    setRolEdit(rol)
    setPermisosModalOpen(false)
    setRolPermisosEdit(null)
    setModalOpen(true)
  }

  const handleOpenPermisos = (rol) => {
    setRolPermisosEdit(rol)
    setModalOpen(false)
    setRolEdit(null)
    setPermisosModalOpen(true)
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
      setRolEdit(null)
      toast.success(rolEdit ? 'Rol actualizado correctamente' : 'Rol creado correctamente')
      loadRoles()
    } else {
      toast.error(res.message || 'Error al guardar el rol')
    }
  }

  // Filtrado reactivo en memoria
  const filtered = useMemo(() => {
    let items = roles

    // Filtro por estado
    if (estadoFiltro === 'activos') {
      items = items.filter(r => r.activo)
    } else if (estadoFiltro === 'inactivos') {
      items = items.filter(r => !r.activo)
    }

    // Filtro por texto
    if (busq.trim()) {
      const q = busq.toLowerCase().trim()
      items = items.filter(r =>
        r.nombre?.toLowerCase().includes(q) ||
        r.descripcion?.toLowerCase().includes(q) ||
        String(r.nivel).includes(q)
      )
    }

    return items
  }, [roles, estadoFiltro, busq])

  const handleExport = () => {
    const data = filtered.map((r) => ({
      Rol: r.nombre,
      Descripción: r.descripcion || '',
      Nivel: r.nivel,
      Tipo: r.es_sistema ? 'Sistema' : 'Personalizado',
      Estado: r.activo ? 'Activo' : 'Inactivo',
    }))
    exportToExcel(data, 'roles_permisos', 'Roles')
    toast.success('Archivo descargado', 'El listado de roles se ha exportado correctamente a Excel.')
  }

  const columns = useMemo(() => [
    {
      accessorKey: 'nombre',
      header: 'Nombre del Rol',
      cell: info => (
        <div className="flex items-center gap-2">
          <div className="p-1 rounded-md bg-teal-50 dark:bg-teal-950/40 text-[#01a59c] shrink-0">
            <ShieldCheckIcon className="h-4 w-4" />
          </div>
          <span className="font-medium text-slate-800 dark:text-slate-100">{info.getValue()}</span>
          {info.row.original.es_sistema && (
            <span className="ml-2 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider text-purple-600 bg-purple-100 dark:text-purple-400 dark:bg-purple-900/30 rounded-full">
              Sistema
            </span>
          )}
        </div>
      ),
      size: 280
    },
    {
      accessorKey: 'descripcion',
      header: 'Descripción',
      cell: info => info.getValue() || <span className="text-slate-400 italic text-xs">No especificada</span>,
      size: 340
    },
    {
      accessorKey: 'nivel',
      header: 'Nivel',
      cell: info => (
        <span className="font-mono text-xs font-semibold text-slate-700 dark:text-slate-300 bg-slate-100 dark:bg-slate-800 px-2 py-0.5 rounded-md">
          {info.getValue()}
        </span>
      ),
      size: 90
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
        <ActionCell>
          <Can I="editar" a="roles" fallback={
            <button disabled className="p-1.5 rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-400 cursor-not-allowed" title="Sin permiso">
              <Squares2X2Icon className="h-4 w-4" />
            </button>
          }>
            <button
              onClick={() => handleOpenPermisos(row.original)}
              className="p-1.5 rounded-lg bg-teal-50 dark:bg-teal-900/20 text-[#01a59c] hover:bg-teal-100 dark:hover:bg-teal-900/40 transition-colors cursor-pointer"
              title="Configurar Permisos"
            >
              <Squares2X2Icon className="h-4 w-4" />
            </button>
          </Can>

          <Can I="editar" a="roles" fallback={
            <button disabled className="p-1.5 rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-400 cursor-not-allowed" title="Sin permiso">
              <PencilIcon className="h-4 w-4" />
            </button>
          }>
            <button
              onClick={() => handleOpenEdit(row.original)}
              className="p-1.5 rounded-lg bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400 hover:bg-blue-100 dark:hover:bg-blue-900/40 transition-colors cursor-pointer"
              title="Editar Rol"
            >
              <PencilIcon className="h-4 w-4" />
            </button>
          </Can>

          {!row.original.es_sistema && (
            <Can I="eliminar" a="roles" fallback={
              <button disabled className="p-1.5 rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-400 cursor-not-allowed" title="Sin permiso">
                <TrashIcon className="h-4 w-4" />
              </button>
            }>
              <button
                onClick={() => handleDelete(row.original.id)}
                className="p-1.5 rounded-lg bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 hover:bg-red-100 dark:hover:bg-red-900/40 transition-colors cursor-pointer"
                title="Eliminar Rol"
              >
                <TrashIcon className="h-4 w-4" />
              </button>
            </Can>
          )}
        </ActionCell>
      ),
      size: 110,
      enableColumnFilter: false
    }
  ], [])

  return (
    <div className="space-y-6 p-6">
      {/* ── ENCABEZADO MODULAR GLOBAL ── */}
      <PageHeader
        title="Roles y Permisos"
        subtitle={`${roles.length} ${roles.length === 1 ? 'rol registrado' : 'roles registrados'} en el sistema`}
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
              onClick={loadRoles}
              loading={loading}
              title="Actualizar listado de roles"
            />

            <ExportExcelButton
              onClick={handleExport}
              disabled={loading || filtered.length === 0}
              label="Excel"
              title="Exportar listado de roles a Excel"
            />

            <Can I="crear" a="roles">
              <NewButton
                onClick={handleOpenNew}
                label="Nuevo Rol"
                title="Registrar nuevo rol"
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
            placeholder="Buscar por rol, descripción o nivel..."
            value={busq}
            onChange={(e) => setBusq(e.target.value)}
            className="w-full pl-9 pr-4 py-1.5 bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-[#01a59c] focus:bg-white dark:focus:bg-slate-900 outline-none text-xs dark:text-white transition-all"
          />
        </div>
      </div>

      {/* ── CONTENEDOR IN-PLACE CON TRANSICIÓN ANIMADA DE ActionSection ── */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-sm overflow-hidden transition-all duration-300">
        {isModalOpen ? (
          <RolModal
            isOpen={isModalOpen}
            onClose={() => {
              setModalOpen(false)
              setRolEdit(null)
            }}
            onSave={handleSaveModal}
            rol={rolEdit}
            variant="inline"
          />
        ) : isPermisosModalOpen ? (
          <RolPermisosModal
            isOpen={isPermisosModalOpen}
            onClose={() => {
              setPermisosModalOpen(false)
              setRolPermisosEdit(null)
            }}
            rol={rolPermisosEdit}
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
                  ? 'No hay roles inactivos registrados.'
                  : 'No se encontraron roles registrados.'
              }
            />
          </div>
        )}
      </div>
    </div>
  )
}
