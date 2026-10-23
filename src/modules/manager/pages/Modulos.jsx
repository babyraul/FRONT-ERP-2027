import { useEffect, useState, useCallback, useMemo } from 'react'
import {
  PencilIcon,
  TrashIcon,
  ArrowLeftIcon,
  MagnifyingGlassIcon,
  Squares2X2Icon,
  KeyIcon
} from '@heroicons/react/24/outline'
import { Link } from 'react-router-dom'
import { moduloController } from '../controllers/modulo.js'
import { exportToExcel } from '../../../utils/exportExcel.js'
import ModuloModal from '../components/ModuloModal.jsx'
import ModuloPermisosModal from '../components/ModuloPermisosModal.jsx'
import { toast } from '../../../utils/toast.js'
import { DataTable } from '../../../components/ui/DataTable.jsx'
import PageHeader from '../../../components/ui/PageHeader.jsx'
import {
  NewButton,
  ExportExcelButton,
  RefreshButton,
  ActionCell
} from '../../../components/ui/ActionButtons.jsx'
import Can from '../../../components/ui/Can.jsx'

export function Modulos() {
  const [modulos, setModulos] = useState([])
  const [loading, setLoading] = useState(true)
  const [busq, setBusq] = useState('')
  const [estadoFiltro, setEstadoFiltro] = useState('todos') // 'todos' | 'activos' | 'inactivos'

  // Modal / Formulario Inline de Módulo
  const [isModalOpen, setModalOpen] = useState(false)
  const [moduloEdit, setModuloEdit] = useState(null)

  // Modal de Permisos Especiales del Módulo
  const [isPermisosModalOpen, setPermisosModalOpen] = useState(false)
  const [moduloPermisos, setModuloPermisos] = useState(null)

  const loadModulos = useCallback(async () => {
    setLoading(true)
    const res = await moduloController.getAll()
    if (res.success) {
      setModulos(res.data)
    } else {
      toast.error('Error al cargar módulos', res.message)
    }
    setLoading(false)
  }, [])

  useEffect(() => {
    loadModulos()
  }, [loadModulos])

  const handleOpenNew = () => {
    setModuloEdit(null)
    setModalOpen(true)
  }

  const handleOpenEdit = (modulo) => {
    setModuloEdit(modulo)
    setModalOpen(true)
  }

  const handleDelete = async (id) => {
    if (!confirm('¿Eliminar módulo de manera permanente?')) return
    const res = await moduloController.delete(id)
    if (res.success) {
      toast.success('Éxito', 'Módulo eliminado permanentemente.')
      loadModulos()
    } else {
      toast.error('Error al eliminar', res.message || 'Ocurrió un error inesperado.')
    }
  }

  const handleSaveModal = async (data) => {
    let res
    if (moduloEdit) {
      res = await moduloController.update(moduloEdit.id, data)
    } else {
      res = await moduloController.create(data)
    }

    if (res.success) {
      toast.success(
        'Guardado correctamente',
        moduloEdit ? 'Módulo actualizado con éxito.' : 'Módulo creado con éxito.'
      )
      setModalOpen(false)
      setModuloEdit(null)
      loadModulos()
    } else {
      toast.error('Error al guardar', res.message || 'No se pudo guardar el módulo.')
    }
  }

  // Filtrado reactivo en memoria
  const filtered = useMemo(() => {
    let items = modulos

    // Filtro por estado
    if (estadoFiltro === 'activos') {
      items = items.filter(m => m.activo)
    } else if (estadoFiltro === 'inactivos') {
      items = items.filter(m => !m.activo)
    }

    // Filtro por texto
    if (busq.trim()) {
      const q = busq.toLowerCase().trim()
      items = items.filter(m =>
        m.codigo?.toLowerCase().includes(q) ||
        m.nombre?.toLowerCase().includes(q) ||
        m.descripcion?.toLowerCase().includes(q) ||
        m.ruta?.toLowerCase().includes(q)
      )
    }

    return items
  }, [modulos, estadoFiltro, busq])

  const handleExport = () => {
    const data = filtered.map((m) => ({
      Código: m.codigo,
      Nombre: m.nombre,
      Tipo: m.tipo,
      Ruta: m.ruta || '-',
      Orden: m.orden,
      Descripción: m.descripcion || '',
      Estado: m.activo ? 'Activo' : 'Inactivo',
    }))
    exportToExcel(data, 'modulos', 'Módulos')
    toast.success('Archivo descargado', 'El listado de módulos se ha exportado correctamente a Excel.')
  }

  const columns = useMemo(() => [
    {
      accessorKey: 'codigo',
      header: 'Código',
      size: 150,
      cell: info => (
        <span className="font-mono text-xs font-semibold text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-900/20 px-2 py-0.5 rounded-md">
          {info.getValue()}
        </span>
      )
    },
    {
      accessorKey: 'nombre',
      header: 'Nombre',
      size: 260,
      cell: info => (
        <div className="flex items-center gap-2">
          <div className="p-1 rounded-md bg-teal-50 dark:bg-teal-950/40 text-[#01a59c] shrink-0">
            <Squares2X2Icon className="h-4 w-4" />
          </div>
          <div>
            <p className="font-medium text-slate-800 dark:text-slate-100">{info.getValue()}</p>
            {info.row.original.descripcion && (
              <p className="text-xs text-slate-400 font-normal truncate max-w-xs">
                {info.row.original.descripcion}
              </p>
            )}
          </div>
        </div>
      )
    },
    {
      accessorFn: row => {
        const parent = modulos.find(p => p.id === row.padre_id)
        return parent ? `${row.tipo} (${parent.codigo})` : row.tipo
      },
      id: 'padre_tipo',
      header: 'Padre / Tipo',
      size: 180,
      cell: info => {
        const { tipo, padre_id } = info.row.original
        const parent = modulos.find(p => p.id === padre_id)
        return (
          <div className="flex items-center gap-1.5 flex-wrap">
            <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300">
              {tipo}
            </span>
            {parent && (
              <span className="text-xs text-slate-500 font-mono">
                ↳ {parent.codigo}
              </span>
            )}
          </div>
        )
      }
    },
    {
      accessorKey: 'icon',
      header: 'Ícono',
      size: 110,
      cell: info => {
        const iconClass = info.getValue()
        return (
          <div className="flex items-center justify-center gap-1.5">
            {iconClass ? (
              <>
                <i className={`${iconClass} text-slate-500`} />
                <span className="text-xs text-slate-500 font-mono hidden sm:inline-block">
                  {iconClass}
                </span>
              </>
            ) : (
              <span className="text-xs text-slate-400 italic">-</span>
            )}
          </div>
        )
      }
    },
    {
      accessorKey: 'ruta',
      header: 'Ruta',
      size: 140,
      cell: info => (
        <div className="text-center text-xs font-mono text-slate-600 dark:text-slate-400">
          {info.getValue() || '-'}
        </div>
      )
    },
    {
      accessorKey: 'orden',
      header: 'Orden',
      size: 80,
      cell: info => (
        <div className="text-center font-mono text-xs font-semibold text-slate-700 dark:text-slate-300">
          {info.getValue()}
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
      id: 'acciones',
      header: 'Acciones',
      size: 130,
      enableSorting: false,
      enableColumnFilter: false,
      cell: info => (
        <ActionCell>
          <Can I="ver" a="roles" fallback={null}>
            <button
              onClick={() => {
                setModuloPermisos(info.row.original)
                setPermisosModalOpen(true)
              }}
              className="p-1.5 rounded-lg bg-purple-50 dark:bg-purple-900/20 text-purple-600 dark:text-purple-400 hover:bg-purple-100 dark:hover:bg-purple-900/40 transition-colors cursor-pointer"
              title="Gestionar Permisos Especiales"
            >
              <KeyIcon className="h-4 w-4" />
            </button>
          </Can>

          <Can I="editar" a="modulos" fallback={
            <button disabled className="p-1.5 rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-400 cursor-not-allowed" title="Sin permiso">
              <PencilIcon className="h-4 w-4" />
            </button>
          }>
            <button
              onClick={() => handleOpenEdit(info.row.original)}
              className="p-1.5 rounded-lg bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400 hover:bg-blue-100 dark:hover:bg-blue-900/40 transition-colors cursor-pointer"
              title="Editar Módulo"
            >
              <PencilIcon className="h-4 w-4" />
            </button>
          </Can>

          <Can I="eliminar" a="modulos" fallback={
            <button disabled className="p-1.5 rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-400 cursor-not-allowed" title="Sin permiso">
              <TrashIcon className="h-4 w-4" />
            </button>
          }>
            <button
              onClick={() => handleDelete(info.row.original.id)}
              className="p-1.5 rounded-lg bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 hover:bg-red-100 dark:hover:bg-red-900/40 transition-colors cursor-pointer"
              title="Eliminar Módulo"
            >
              <TrashIcon className="h-4 w-4" />
            </button>
          </Can>
        </ActionCell>
      )
    }
  ], [modulos])

  return (
    <div className="space-y-6 p-6">
      {/* ── ENCABEZADO MODULAR GLOBAL ── */}
      <PageHeader
        title="Módulos del Sistema"
        subtitle={`${modulos.length} ${modulos.length === 1 ? 'módulo registrado' : 'módulos registrados'} en el sistema`}
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
              onClick={loadModulos}
              loading={loading}
              title="Actualizar listado de módulos"
            />

            <ExportExcelButton
              onClick={handleExport}
              disabled={loading || filtered.length === 0}
              label="Excel"
              title="Exportar listado de módulos a Excel"
            />

            <Can I="crear" a="modulos">
              <NewButton
                onClick={handleOpenNew}
                label="Nuevo Módulo"
                title="Registrar nuevo módulo"
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
            placeholder="Buscar por código, nombre o ruta..."
            value={busq}
            onChange={(e) => setBusq(e.target.value)}
            className="w-full pl-9 pr-4 py-1.5 bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-[#01a59c] focus:bg-white dark:focus:bg-slate-900 outline-none text-xs dark:text-white transition-all"
          />
        </div>
      </div>

      {/* ── CONTENEDOR IN-PLACE CON TRANSICIÓN ANIMADA DE ActionSection ── */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-sm overflow-hidden transition-all duration-300">
        {isModalOpen ? (
          <ModuloModal
            isOpen={isModalOpen}
            onClose={() => {
              setModalOpen(false)
              setModuloEdit(null)
            }}
            onSave={handleSaveModal}
            modulo={moduloEdit}
            modulosList={modulos}
            variant="inline"
          />
        ) : isPermisosModalOpen ? (
          <ModuloPermisosModal
            isOpen={isPermisosModalOpen}
            onClose={() => {
              setPermisosModalOpen(false)
              setModuloPermisos(null)
            }}
            modulo={moduloPermisos}
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
                  ? 'No hay módulos inactivos registrados.'
                  : 'No se encontraron módulos registrados.'
              }
            />
          </div>
        )}
      </div>
    </div>
  )
}
