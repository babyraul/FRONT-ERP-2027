import { useEffect, useState, useCallback, useMemo } from 'react'
import {
  ArrowDownTrayIcon,
  PlusIcon,
  PencilIcon,
  TrashIcon,
  TruckIcon,
  PhoneIcon,
  EnvelopeIcon,
  CheckCircleIcon,
  XCircleIcon
} from '@heroicons/react/24/outline'
import { DataTable } from '../../../components/ui/DataTable.jsx'
import ProveedorModal from '../components/ProveedorModal.jsx'
import { proveedorController } from '../controllers/proveedor.js'
import { exportToExcel } from '../../../utils/exportExcel.js'
import { toast } from '../../../utils/toast.js'
import Can from '../../../components/ui/Can.jsx'

export default function Proveedores() {
  const [proveedores, setProveedores] = useState([])
  const [loading, setLoading] = useState(true)
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [isProcessing, setIsProcessing] = useState(false)
  const [selectedProveedor, setSelectedProveedor] = useState(null)

  const loadProveedores = useCallback(async () => {
    setLoading(true)
    const res = await proveedorController.getAll()
    if (res.success) {
      setProveedores(res.data)
    } else {
      toast.error(res.message || 'Error al cargar la lista de proveedores')
    }
    setLoading(false)
  }, [])

  useEffect(() => {
    loadProveedores()
  }, [loadProveedores])

  const handleExport = () => {
    if (proveedores.length === 0) {
      toast.error('No hay datos para exportar')
      return
    }

    const data = proveedores.map((p) => ({
      RUC: p.ruc,
      'Razón Social': p.razon_social,
      'Nombre Comercial': p.nombre_comercial || '',
      Dirección: p.direccion || '',
      Ubigeo: p.ubigeo_descripcion || p.ubigeo || '',
      Teléfono: p.telefono || '',
      Email: p.email || '',
      Contacto: p.persona_contacto || '',
      Mercadería: p.es_mercaderia ? 'SÍ' : 'NO',
      Servicio: p.es_servicio ? 'SÍ' : 'NO',
      ActivoFijo: p.es_activo ? 'SÍ' : 'NO',
      Comisiones: p.es_comisiones ? 'SÍ' : 'NO',
      Estado: p.activo ? 'Activo' : 'Inactivo',
    }))

    exportToExcel(data, 'proveedores', 'Proveedores')
  }

  const handleOpenNew = () => {
    setSelectedProveedor(null)
    setIsModalOpen(true)
  }

  const handleOpenEdit = (proveedor) => {
    setSelectedProveedor(proveedor)
    setIsModalOpen(true)
  }

  const handleDelete = async (id, razonSocial) => {
    if (!confirm(`¿Está seguro de inactivar al proveedor "${razonSocial}"?`)) return

    const res = await proveedorController.delete(id)
    if (res.success) {
      toast.success(res.message || 'Proveedor inactivado correctamente')
      loadProveedores()
    } else {
      toast.error(res.message || 'Error al eliminar el proveedor')
    }
  }

  const handleSaveModal = async (formData) => {
    setIsProcessing(true)
    let res
    if (selectedProveedor) {
      res = await proveedorController.update(selectedProveedor.id, formData)
    } else {
      res = await proveedorController.create(formData)
    }

    if (res.success) {
      setIsModalOpen(false)
      toast.success(res.message || (selectedProveedor ? 'Proveedor actualizado' : 'Proveedor registrado'))
      loadProveedores()
    } else {
      toast.error(res.message || 'Error al procesar la solicitud')
    }
    setIsProcessing(false)
  }

  const columns = useMemo(() => [
,
    {
      id: 'acciones',
      header: 'Acciones',
      cell: ({ row }) => (
        <div className="flex items-center justify-center gap-1.5">
          <Can I="editar" a="proveedores" fallback={
            <button
              onClick={() => handleOpenEdit(row.original)}
              className="p-1.5 rounded-lg bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400 hover:bg-blue-100 dark:hover:bg-blue-900/40 transition-colors"
              title="Editar Proveedor"
            >
              <PencilIcon className="h-4 w-4" />
            </button>
          }>
            <button
              onClick={() => handleOpenEdit(row.original)}
              className="p-1.5 rounded-lg bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400 hover:bg-blue-100 dark:hover:bg-blue-900/40 transition-colors"
              title="Editar Proveedor"
            >
              <PencilIcon className="h-4 w-4" />
            </button>
          </Can>

          <Can I="eliminar" a="proveedores" fallback={
            <button
              onClick={() => handleDelete(row.original.id, row.original.razon_social)}
              className="p-1.5 rounded-lg bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 hover:bg-red-100 dark:hover:bg-red-900/40 transition-colors"
              title="Inactivar Proveedor"
            >
              <TrashIcon className="h-4 w-4" />
            </button>
          }>
            <button
              onClick={() => handleDelete(row.original.id, row.original.razon_social)}
              className="p-1.5 rounded-lg bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 hover:bg-red-100 dark:hover:bg-red-900/40 transition-colors"
              title="Inactivar Proveedor"
            >
              <TrashIcon className="h-4 w-4" />
            </button>
          </Can>
        </div>
      ),
      size: 100,
      enableColumnFilter: false
    },
    {
      accessorKey: 'ruc',
      header: 'RUC',
      cell: info => (
        <span className="font-mono text-xs font-semibold tracking-wider text-slate-800 dark:text-slate-200 bg-slate-100 dark:bg-slate-800 px-2 py-1 rounded">
          {info.getValue()}
        </span>
      ),
      size: 130
    },
    {
      accessorKey: 'razon_social',
      header: 'Razón Social / Nombre',
      cell: info => {
        const row = info.row.original
        return (
          <div className="flex flex-col">
            <span className="font-semibold text-slate-800 dark:text-slate-100 leading-snug">
              {info.getValue()}
            </span>
            {row.nombre_comercial && (
              <span className="text-xs text-slate-400 dark:text-slate-500 italic">
                {row.nombre_comercial}
              </span>
            )}
          </div>
        )
      },
      size: 260
    },
    {
      accessorKey: 'direccion',
      header: 'Dirección / Ubicación',
      cell: info => {
        const row = info.row.original
        return (
          <div className="flex flex-col text-xs max-w-xs truncate">
            <span className="text-slate-700 dark:text-slate-300 truncate" title={info.getValue() || ''}>
              {info.getValue() || <span className="text-slate-400 italic">Sin dirección</span>}
            </span>
            {row.ubigeo_descripcion && (
              <span className="text-[11px] text-slate-400 dark:text-slate-500 truncate" title={row.ubigeo_descripcion}>
                📍 {row.ubigeo_descripcion}
              </span>
            )}
          </div>
        )
      },
      size: 240
    },
    {
      id: 'contacto',
      header: 'Contacto',
      cell: ({ row }) => {
        const { telefono, email, persona_contacto } = row.original
        return (
          <div className="flex flex-col gap-0.5 text-xs">
            {persona_contacto && (
              <span className="font-medium text-slate-800 dark:text-slate-200">
                {persona_contacto}
              </span>
            )}
            {telefono && (
              <span className="flex items-center gap-1 text-slate-500 dark:text-slate-400">
                <PhoneIcon className="h-3 w-3 shrink-0" /> {telefono}
              </span>
            )}
            {email && (
              <span className="flex items-center gap-1 text-slate-500 dark:text-slate-400 truncate max-w-[180px]" title={email}>
                <EnvelopeIcon className="h-3 w-3 shrink-0" /> {email}
              </span>
            )}
            {!telefono && !email && !persona_contacto && (
              <span className="text-slate-400 italic">No registrado</span>
            )}
          </div>
        )
      },
      size: 190
    },
    {
      id: 'clasificacion',
      header: 'Clasificación',
      cell: ({ row }) => {
        const p = row.original
        const tags = []
        if (p.es_mercaderia) tags.push({ label: 'Mercadería', color: 'bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-400 border-emerald-200 dark:border-emerald-800' })
        if (p.es_servicio) tags.push({ label: 'Servicio', color: 'bg-blue-50 dark:bg-blue-950/40 text-blue-700 dark:text-blue-400 border-blue-200 dark:border-blue-800' })
        if (p.es_activo) tags.push({ label: 'Activo Fijo', color: 'bg-amber-50 dark:bg-amber-950/40 text-amber-700 dark:text-amber-400 border-amber-200 dark:border-amber-800' })
        if (p.es_comisiones) tags.push({ label: 'Comisiones', color: 'bg-purple-50 dark:bg-purple-950/40 text-purple-700 dark:text-purple-400 border-purple-200 dark:border-purple-800' })

        return (
          <div className="flex flex-wrap gap-1">
            {tags.length > 0 ? (
              tags.map((t, idx) => (
                <span
                  key={idx}
                  className={`text-[10px] font-medium px-1.5 py-0.5 rounded border ${t.color}`}
                >
                  {t.label}
                </span>
              ))
            ) : (
              <span className="text-xs text-slate-400 italic">General</span>
            )}
          </div>
        )
      },
      size: 170,
      enableColumnFilter: false
    },
    {
      accessorKey: 'activo',
      header: 'Estado',
      cell: info => {
        const val = info.getValue()
        return (
          <div className="flex justify-center">
            <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold ${
              val
                ? 'bg-emerald-50 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-400'
                : 'bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400'
            }`}>
              {val ? <CheckCircleIcon className="h-3.5 w-3.5" /> : <XCircleIcon className="h-3.5 w-3.5" />}
              {val ? 'Activo' : 'Inactivo'}
            </span>
          </div>
        )
      },
      size: 110,
      enableColumnFilter: false
    }
  ], [])

  return (
    <div className="space-y-6 p-6">
      {/* Encabezado */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div>
            <h1 className="text-2xl font-bold text-slate-800 dark:text-white">Proveedores</h1>
            <p className="text-sm text-slate-500 dark:text-slate-400 mt-0.5">
              Directorio de proveedores comerciales, clasificación y datos tributarios
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2.5">
          <button
            onClick={handleExport}
            className="btn-secondary flex items-center gap-2"
            title="Exportar listado a Excel"
          >
            <ArrowDownTrayIcon className="h-4 w-4" /> Exportar Excel
          </button>

          <Can I="crear" a="proveedores" fallback={
            <button
              onClick={handleOpenNew}
              className="btn-primary flex items-center gap-2 shadow-sm"
            >
              <PlusIcon className="h-4 w-4" /> Nuevo Proveedor
            </button>
          }>
            <button
              onClick={handleOpenNew}
              className="btn-primary flex items-center gap-2 shadow-sm"
            >
              <PlusIcon className="h-4 w-4" /> Nuevo Proveedor
            </button>
          </Can>
        </div>
      </div>

      {/* Tabla con TanStack Table DataTable */}
      <div className="w-full">
        {loading ? (
          <div className="flex flex-col items-center justify-center h-64 bg-white dark:bg-slate-900 rounded-2xl shadow-sm border border-slate-200/60 dark:border-slate-800/60">
            <div className="w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
            <p className="mt-4 text-slate-500 font-medium">Cargando directorio de proveedores...</p>
          </div>
        ) : (
          <DataTable data={proveedores} columns={columns} pagination={true} />
        )}
      </div>

      {/* Modal de Creación / Edición */}
      <ProveedorModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSave={handleSaveModal}
        proveedor={selectedProveedor}
        isProcessing={isProcessing}
      />
    </div>
  )
}
