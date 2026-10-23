import { useEffect, useState, useCallback, useMemo } from 'react'
import {
  PencilIcon,
  TrashIcon,
  HomeModernIcon,
  ArrowLeftIcon,
  MagnifyingGlassIcon
} from '@heroicons/react/24/outline'
import { Link } from 'react-router-dom'
import { almacenController } from '../controllers/almacen.js'
import { exportToExcel } from '../../../utils/exportExcel.js'
import { toast } from '../../../utils/toast'
import AlmacenModal from '../components/AlmacenModal.jsx'
import { DataTable } from '../../../components/ui/DataTable.jsx'
import PageHeader from '../../../components/ui/PageHeader.jsx'
import {
  NewButton,
  ExportExcelButton,
  RefreshButton,
  ActionCell
} from '../../../components/ui/ActionButtons.jsx'
import Can from '../../../components/ui/Can.jsx'

export function Almacenes() {
  const [almacenes, setAlmacenes] = useState([])
  const [loading, setLoading] = useState(true)
  const [busq, setBusq] = useState('')
  const [estadoFiltro, setEstadoFiltro] = useState('todos') // 'todos' | 'activos' | 'inactivos'

  // Modal / Formulario Inline de Almacén
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
      setAlmacenEdit(null)
      toast.success(almacenEdit ? 'Almacén actualizado correctamente' : 'Almacén creado correctamente')
      loadAlmacenes()
    } else {
      toast.error(res.message || 'Error al guardar el almacén')
    }
  }

  // Filtrado reactivo en memoria
  const filtered = useMemo(() => {
    let items = almacenes

    // Filtro por estado
    if (estadoFiltro === 'activos') {
      items = items.filter(a => a.activo)
    } else if (estadoFiltro === 'inactivos') {
      items = items.filter(a => !a.activo)
    }

    // Filtro por texto
    if (busq.trim()) {
      const q = busq.toLowerCase().trim()
      items = items.filter(a =>
        a.nombre?.toLowerCase().includes(q) ||
        a.codigo?.toLowerCase().includes(q) ||
        a.direccion?.toLowerCase().includes(q)
      )
    }

    return items
  }, [almacenes, estadoFiltro, busq])

  const handleExport = () => {
    const data = filtered.map((a) => ({
      Código: a.codigo || '-',
      Almacén: a.nombre,
      Tipo: a.es_principal ? 'Principal' : 'Secundario',
      Dirección: a.direccion || '',
      Estado: a.activo ? 'Activo' : 'Inactivo',
    }))
    exportToExcel(data, 'almacenes', 'Almacenes')
    toast.success('Archivo descargado', 'El listado de almacenes se ha exportado correctamente a Excel.')
  }

  const columns = useMemo(() => [
    {
      accessorKey: 'codigo',
      header: 'Código',
      cell: info => (
        <span className="font-mono text-xs font-semibold tracking-wider text-slate-700 dark:text-slate-300">
          {info.getValue() || '-'}
        </span>
      ),
      size: 110
    },
    {
      accessorKey: 'nombre',
      header: 'Nombre del Almacén',
      cell: info => (
        <div className="flex items-center gap-2">
          <div className="p-1 rounded-md bg-teal-50 dark:bg-teal-950/40 text-[#01a59c] shrink-0">
            <HomeModernIcon className="h-4 w-4" />
          </div>
          <span className="font-medium text-slate-800 dark:text-slate-100">{info.getValue()}</span>
          {info.row.original.es_principal && (
            <span className="ml-2 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider text-blue-600 bg-blue-100 dark:text-blue-400 dark:bg-blue-900/30 rounded-full">
              Principal
            </span>
          )}
        </div>
      ),
      size: 320
    },
    {
      accessorKey: 'direccion',
      header: 'Dirección',
      cell: info => info.getValue() || <span className="text-slate-400 italic text-xs">No especificada</span>,
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
        <ActionCell>
          <Can I="editar" a="almacenes" fallback={
            <button disabled className="p-1.5 rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-400 cursor-not-allowed" title="Sin permiso">
              <PencilIcon className="h-4 w-4" />
            </button>
          }>
            <button
              onClick={() => handleOpenEdit(row.original)}
              className="p-1.5 rounded-lg bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400 hover:bg-blue-100 dark:hover:bg-blue-900/40 transition-colors cursor-pointer"
              title="Editar Almacén"
            >
              <PencilIcon className="h-4 w-4" />
            </button>
          </Can>

          <Can I="eliminar" a="almacenes" fallback={
            <button disabled className="p-1.5 rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-400 cursor-not-allowed" title="Sin permiso">
              <TrashIcon className="h-4 w-4" />
            </button>
          }>
            <button
              onClick={() => handleDelete(row.original.id)}
              className="p-1.5 rounded-lg bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 hover:bg-red-100 dark:hover:bg-red-900/40 transition-colors cursor-pointer"
              title="Eliminar Almacén"
            >
              <TrashIcon className="h-4 w-4" />
            </button>
          </Can>
        </ActionCell>
      ),
      size: 100,
      enableColumnFilter: false
    }
  ], [])

  return (
    <div className="space-y-6 p-6">
      {/* ── ENCABEZADO MODULAR GLOBAL ── */}
      <PageHeader
        title="Almacenes"
        subtitle={`${almacenes.length} ${almacenes.length === 1 ? 'almacén registrado' : 'almacenes registrados'} en el sistema`}
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
              onClick={loadAlmacenes}
              loading={loading}
              title="Actualizar listado de almacenes"
            />

            <ExportExcelButton
              onClick={handleExport}
              disabled={loading || filtered.length === 0}
              label="Excel"
              title="Exportar listado de almacenes a Excel"
            />

            <Can I="crear" a="almacenes">
              <NewButton
                onClick={handleOpenNew}
                label="Nuevo Almacén"
                title="Registrar nuevo almacén"
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
            placeholder="Buscar por código, nombre o dirección..."
            value={busq}
            onChange={(e) => setBusq(e.target.value)}
            className="w-full pl-9 pr-4 py-1.5 bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-[#01a59c] focus:bg-white dark:focus:bg-slate-900 outline-none text-xs dark:text-white transition-all"
          />
        </div>
      </div>

      {/* ── CONTENEDOR IN-PLACE CON TRANSICIÓN ANIMADA DE ActionSection ── */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-sm overflow-hidden transition-all duration-300">
        {isModalOpen ? (
          <AlmacenModal
            isOpen={isModalOpen}
            onClose={() => {
              setModalOpen(false)
              setAlmacenEdit(null)
            }}
            onSave={handleSaveModal}
            almacen={almacenEdit}
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
                  ? 'No hay almacenes inactivos registrados.'
                  : 'No se encontraron almacenes registrados.'
              }
            />
          </div>
        )}
      </div>
    </div>
  )
}
