import { useEffect, useState, useCallback, useMemo } from 'react'
import {
  BuildingOfficeIcon,
  Squares2X2Icon,
  ArrowLeftIcon,
  MagnifyingGlassIcon,
  PencilIcon,
  TrashIcon
} from '@heroicons/react/24/outline'
import { Link } from 'react-router-dom'
import { empresaController } from '../controllers/empresa.js'
import { exportToExcel } from '../../../utils/exportExcel.js'
import { toast } from '../../../utils/toast'
import EmpresaModal from '../components/EmpresaModal.jsx'
import EmpresaModulosModal from '../components/EmpresaModulosModal.jsx'
import { DataTable } from '../../../components/ui/DataTable.jsx'
import PageHeader from '../../../components/ui/PageHeader.jsx'
import {
  NewButton,
  ExportExcelButton,
  RefreshButton,
  ActionCell
} from '../../../components/ui/ActionButtons.jsx'
import Can from '../../../components/ui/Can.jsx'

export function Empresas() {
  const [empresas, setEmpresas] = useState([])
  const [loading, setLoading] = useState(true)
  const [busq, setBusq] = useState('')
  const [estadoFiltro, setEstadoFiltro] = useState('todos') // 'todos' | 'activos' | 'inactivos'

  // Modal / Formulario Inline de Empresa
  const [isModalOpen, setModalOpen] = useState(false)
  const [empresaEdit, setEmpresaEdit] = useState(null)

  // Modal / Formulario Inline de Módulos
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
    const data = filtered.map((e) => ({
      RUC: e.ruc,
      'Razón Social': e.razon_social,
      'Nombre Comercial': e.nombre_comercial,
      Dirección: e.direccion || '',
      Ubigeo: e.ubigeo || '',
      Teléfono: e.telefono1,
      Email: e.email1,
      Estado: e.activo ? 'Activo' : 'Inactivo',
    }))
    exportToExcel(data, 'empresas', 'Empresas')
    toast.success('Archivo descargado', 'El listado de empresas se ha exportado correctamente a Excel.')
  }

  const handleOpenNew = () => {
    setEmpresaEdit(null)
    setModulosModalOpen(false)
    setEmpresaModulosEdit(null)
    setModalOpen(true)
  }

  const handleOpenEdit = (empresa) => {
    setEmpresaEdit(empresa)
    setModulosModalOpen(false)
    setEmpresaModulosEdit(null)
    setModalOpen(true)
  }

  const handleOpenModulos = (empresa) => {
    setEmpresaModulosEdit(empresa)
    setModalOpen(false)
    setEmpresaEdit(null)
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
      setEmpresaEdit(null)
      toast.success(
        empresaEdit
          ? 'Empresa actualizada correctamente'
          : 'Empresa, Sucursal y Almacén creados correctamente'
      )
      loadEmpresas()
    } else {
      toast.error(res.message || 'Error al guardar la empresa')
    }
  }

  // Filtrado reactivo en memoria
  const filtered = useMemo(() => {
    let items = empresas

    // Filtro por estado
    if (estadoFiltro === 'activos') {
      items = items.filter(e => e.activo)
    } else if (estadoFiltro === 'inactivos') {
      items = items.filter(e => !e.activo)
    }

    // Filtro por texto
    if (busq.trim()) {
      const q = busq.toLowerCase().trim()
      items = items.filter(e =>
        e.ruc?.toLowerCase().includes(q) ||
        e.razon_social?.toLowerCase().includes(q) ||
        e.nombre_comercial?.toLowerCase().includes(q) ||
        e.email1?.toLowerCase().includes(q) ||
        e.telefono1?.toLowerCase().includes(q)
      )
    }

    return items
  }, [empresas, estadoFiltro, busq])

  const columns = useMemo(() => [
    {
      accessorKey: 'ruc',
      header: 'RUC',
      cell: info => (
        <span className="font-mono text-xs font-semibold tracking-wider text-slate-700 dark:text-slate-300">
          {info.getValue()}
        </span>
      ),
      size: 140
    },
    {
      accessorKey: 'razon_social',
      header: 'Razón Social',
      cell: info => (
        <div className="flex items-center gap-2">
          <div className="p-1 rounded-md bg-teal-50 dark:bg-teal-950/40 text-[#01a59c] shrink-0">
            <BuildingOfficeIcon className="h-4 w-4" />
          </div>
          <span className="font-medium text-slate-800 dark:text-slate-100">{info.getValue()}</span>
        </div>
      ),
      size: 320
    },
    {
      accessorKey: 'nombre_comercial',
      header: 'Nombre Comercial',
      cell: info => info.getValue() || <span className="text-slate-400 italic text-xs">No especificado</span>,
      size: 260
    },
    {
      accessorKey: 'ubigeo_descripcion',
      header: 'Ubicación (Ubigeo)',
      cell: info => info.getValue() || <span className="text-slate-400 italic text-xs">No especificado</span>,
      size: 220
    },
    {
      accessorKey: 'email1',
      header: 'Email',
      size: 180,
      cell: info => info.getValue() || <span className="text-slate-400 italic text-xs">-</span>
    },
    {
      accessorKey: 'telefono1',
      header: 'Teléfono',
      size: 120,
      cell: info => info.getValue() || <span className="text-slate-400 italic text-xs">-</span>
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
          <Can I="modulos" a="empresas" fallback={
            <button disabled className="p-1.5 rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-400 cursor-not-allowed" title="Sin permiso">
              <Squares2X2Icon className="h-4 w-4" />
            </button>
          }>
            <button
              onClick={() => handleOpenModulos(row.original)}
              className="p-1.5 rounded-lg bg-teal-50 dark:bg-teal-900/20 text-[#01a59c] hover:bg-teal-100 dark:hover:bg-teal-900/40 transition-colors cursor-pointer"
              title="Asignar Módulos"
            >
              <Squares2X2Icon className="h-4 w-4" />
            </button>
          </Can>

          <Can I="editar" a="empresas" fallback={
            <button disabled className="p-1.5 rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-400 cursor-not-allowed" title="Sin permiso">
              <PencilIcon className="h-4 w-4" />
            </button>
          }>
            <button
              onClick={() => handleOpenEdit(row.original)}
              className="p-1.5 rounded-lg bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400 hover:bg-blue-100 dark:hover:bg-blue-900/40 transition-colors cursor-pointer"
              title="Editar Empresa"
            >
              <PencilIcon className="h-4 w-4" />
            </button>
          </Can>

          <Can I="eliminar" a="empresas" fallback={
            <button disabled className="p-1.5 rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-400 cursor-not-allowed" title="Sin permiso">
              <TrashIcon className="h-4 w-4" />
            </button>
          }>
            <button
              onClick={() => handleDelete(row.original.id)}
              className="p-1.5 rounded-lg bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 hover:bg-red-100 dark:hover:bg-red-900/40 transition-colors cursor-pointer"
              title="Eliminar Empresa"
            >
              <TrashIcon className="h-4 w-4" />
            </button>
          </Can>
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
        title="Empresas"
        subtitle={`${empresas.length} ${empresas.length === 1 ? 'empresa registrada' : 'empresas registradas'} en el sistema`}
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
              onClick={loadEmpresas}
              loading={loading}
              title="Actualizar listado de empresas"
            />

            <ExportExcelButton
              onClick={handleExport}
              disabled={loading || filtered.length === 0}
              label="Excel"
              title="Exportar listado de empresas a Excel"
            />

            <Can I="crear" a="empresas">
              <NewButton
                onClick={handleOpenNew}
                label="Nueva Empresa"
                title="Registrar nueva empresa"
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
              className={`flex-1 sm:flex-none px-3 py-1.5 text-xs font-bold rounded-md transition-all cursor-pointer ${estadoFiltro === f.id
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
            placeholder="Buscar por RUC, razón social, nombre..."
            value={busq}
            onChange={(e) => setBusq(e.target.value)}
            className="w-full pl-9 pr-4 py-1.5 bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-[#01a59c] focus:bg-white dark:focus:bg-slate-900 outline-none text-xs dark:text-white transition-all"
          />
        </div>
      </div>

      {/* ── CONTENEDOR IN-PLACE CON TRANSICIÓN ANIMADA DE ActionSection ── */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-sm overflow-hidden transition-all duration-300">
        {isModalOpen ? (
          <EmpresaModal
            isOpen={isModalOpen}
            onClose={() => {
              setModalOpen(false)
              setEmpresaEdit(null)
            }}
            onSave={handleSaveModal}
            empresa={empresaEdit}
            variant="inline"
          />
        ) : isModulosModalOpen ? (
          <EmpresaModulosModal
            isOpen={isModulosModalOpen}
            onClose={() => {
              setModulosModalOpen(false)
              setEmpresaModulosEdit(null)
            }}
            empresa={empresaModulosEdit}
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
                  ? 'No hay empresas inactivas registradas.'
                  : 'No se encontraron empresas registradas.'
              }
            />
          </div>
        )}
      </div>
    </div>
  )
}
