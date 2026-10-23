import { useEffect, useState, useCallback, useMemo } from 'react'
import {
  MagnifyingGlassIcon,
  PencilIcon,
  TrashIcon,
  ArrowLeftIcon,
  BuildingStorefrontIcon
} from '@heroicons/react/24/outline'
import { Link } from 'react-router-dom'
import { sucursalController } from '../controllers/sucursal.js'
import { exportToExcel } from '../../../utils/exportExcel.js'
import { toast } from '../../../utils/toast'
import SucursalModal from '../components/SucursalModal.jsx'
import { DataTable } from '../../../components/ui/DataTable.jsx'
import PageHeader from '../../../components/ui/PageHeader.jsx'
import {
  NewButton,
  ExportExcelButton,
  RefreshButton,
  ActionCell
} from '../../../components/ui/ActionButtons.jsx'
import Can from '../../../components/ui/Can.jsx'

export function Sucursales() {
  const [sucursales, setSucursales] = useState([])
  const [loading, setLoading] = useState(true)
  const [busq, setBusq] = useState('')
  const [estadoFiltro, setEstadoFiltro] = useState('todos') // 'todos' | 'activos' | 'inactivos'

  // Modal / Formulario Inline de Sucursal
  const [isModalOpen, setModalOpen] = useState(false)
  const [sucursalEdit, setSucursalEdit] = useState(null)

  const loadSucursales = useCallback(async () => {
    setLoading(true)
    const res = await sucursalController.getAll()
    if (res.success) setSucursales(res.data)
    else toast.error('Error al cargar las sucursales')
    setLoading(false)
  }, [])

  useEffect(() => {
    loadSucursales()
  }, [loadSucursales])

  const handleBusq = (e) => setBusq(e.target.value)

  // Filtrado reactivo en memoria
  const filtered = useMemo(() => {
    let items = sucursales

    // Filtro por estado
    if (estadoFiltro === 'activos') {
      items = items.filter(s => s.activo)
    } else if (estadoFiltro === 'inactivos') {
      items = items.filter(s => !s.activo)
    }

    // Filtro por texto
    if (busq.trim()) {
      const q = busq.toLowerCase().trim()
      items = items.filter(s =>
        s.ruc?.toLowerCase().includes(q) ||
        s.razon_social?.toLowerCase().includes(q) ||
        s.sucursal_nombre?.toLowerCase().includes(q) ||
        s.codigo_anexo?.toLowerCase().includes(q) ||
        s.direccion?.toLowerCase().includes(q)
      )
    }

    return items
  }, [sucursales, estadoFiltro, busq])

  const handleExport = () => {
    const data = filtered.map((s) => ({
      Anexo: s.codigo_anexo,
      Sucursal: s.sucursal_nombre,
      RUC: s.ruc,
      'Razón Social': s.razon_social,
      Teléfono: s.telefono1 || '',
      Dirección: s.direccion || '',
      Estado: s.activo ? 'Activo' : 'Inactivo',
    }))
    exportToExcel(data, 'sucursales', 'Sucursales')
    toast.success('Archivo descargado', 'El listado de sucursales se ha exportado correctamente a Excel.')
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
      toast.success('Sucursal eliminada correctamente')
      loadSucursales()
    } else {
      toast.error(res.message || 'Error al eliminar la sucursal')
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
      setSucursalEdit(null)
      toast.success(sucursalEdit ? 'Sucursal actualizada correctamente' : 'Sucursal creada correctamente')
      loadSucursales()
    } else {
      toast.error(res.message || 'Error al guardar la sucursal')
    }
  }

  const columns = useMemo(() => [
    {
      header: 'Anexo',
      accessorKey: 'codigo_anexo',
      cell: info => (
        <span className="font-mono text-xs font-semibold tracking-wider text-slate-700 dark:text-slate-300">
          {info.getValue() || '0000'}
        </span>
      ),
      size: 90
    },
    {
      header: 'Sucursal',
      accessorKey: 'sucursal_nombre',
      cell: info => (
        <div className="flex items-center gap-2">
          <div className="p-1 rounded-md bg-teal-50 dark:bg-teal-950/40 text-[#01a59c] shrink-0">
            <BuildingStorefrontIcon className="h-4 w-4" />
          </div>
          <span className="font-medium text-slate-800 dark:text-slate-100">{info.getValue()}</span>
        </div>
      ),
      size: 260
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
      ),
      size: 280
    },
    {
      header: 'Ubicación',
      id: 'ubicacion_info',
      accessorFn: row => `${row.direccion} ${row.ubigeo_descripcion || ''}`,
      cell: ({ row }) => (
        <div className="flex flex-col max-w-[280px]">
          <span className="text-xs sm:text-sm text-slate-700 dark:text-slate-300 truncate" title={row.original.direccion}>
            {row.original.direccion}
          </span>
          {row.original.ubigeo_descripcion && (
            <span className="text-xs text-slate-500 truncate" title={row.original.ubigeo_descripcion}>
              {row.original.ubigeo_descripcion}
            </span>
          )}
        </div>
      ),
      size: 280
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
      },
      size: 100,
      enableColumnFilter: false
    },
    {
      header: 'Acciones',
      id: 'acciones',
      cell: ({ row }) => {
        const s = row.original
        return (
          <ActionCell>
            <Can I="editar" a="sucursales" fallback={
              <button disabled className="p-1.5 rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-400 cursor-not-allowed" title="Sin permiso">
                <PencilIcon className="h-4 w-4" />
              </button>
            }>
              <button
                onClick={() => handleOpenEdit(s)}
                className="p-1.5 rounded-lg bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400 hover:bg-blue-100 dark:hover:bg-blue-900/40 transition-colors cursor-pointer"
                title="Editar Sucursal"
              >
                <PencilIcon className="h-4 w-4" />
              </button>
            </Can>

            <Can I="eliminar" a="sucursales" fallback={
              <button disabled className="p-1.5 rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-400 cursor-not-allowed" title="Sin permiso">
                <TrashIcon className="h-4 w-4" />
              </button>
            }>
              <button
                onClick={() => handleDelete(s.id)}
                className="p-1.5 rounded-lg bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 hover:bg-red-100 dark:hover:bg-red-900/40 transition-colors cursor-pointer"
                title="Eliminar Sucursal"
              >
                <TrashIcon className="h-4 w-4" />
              </button>
            </Can>
          </ActionCell>
        )
      },
      size: 100,
      enableColumnFilter: false
    }
  ], [])

  return (
    <div className="space-y-6 p-6">
      {/* ── ENCABEZADO MODULAR GLOBAL ── */}
      <PageHeader
        title="Sucursales"
        subtitle={`${sucursales.length} ${sucursales.length === 1 ? 'sucursal registrada' : 'sucursales registradas'} en el sistema`}
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
              onClick={loadSucursales}
              loading={loading}
              title="Actualizar listado de sucursales"
            />

            <ExportExcelButton
              onClick={handleExport}
              disabled={loading || filtered.length === 0}
              label="Excel"
              title="Exportar listado de sucursales a Excel"
            />

            <Can I="crear" a="sucursales">
              <NewButton
                onClick={handleOpenNew}
                label="Nueva Sucursal"
                title="Registrar nueva sucursal"
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
            { id: 'todos', label: 'Todas' },
            { id: 'activos', label: 'Activas' },
            { id: 'inactivos', label: 'Inactivas' }
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
            placeholder="Buscar por Nombre, RUC, Anexo..."
            value={busq}
            onChange={handleBusq}
            className="w-full pl-9 pr-4 py-1.5 bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-[#01a59c] focus:bg-white dark:focus:bg-slate-900 outline-none text-xs dark:text-white transition-all"
          />
        </div>
      </div>

      {/* ── CONTENEDOR IN-PLACE CON TRANSICIÓN ANIMADA DE ActionSection ── */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-sm overflow-hidden transition-all duration-300">
        {isModalOpen ? (
          <SucursalModal
            isOpen={isModalOpen}
            onClose={() => {
              setModalOpen(false)
              setSucursalEdit(null)
            }}
            onSave={handleSaveModal}
            sucursal={sucursalEdit}
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
                  ? 'No hay sucursales inactivas registradas.'
                  : 'No se encontraron sucursales registradas.'
              }
            />
          </div>
        )}
      </div>
    </div>
  )
}
