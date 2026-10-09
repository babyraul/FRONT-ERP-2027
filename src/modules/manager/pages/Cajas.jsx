import { useEffect, useState, useCallback, useMemo } from 'react'
import { MagnifyingGlassIcon, ArrowDownTrayIcon, PlusIcon, PencilIcon, TrashIcon, ArrowLeftIcon } from '@heroicons/react/24/outline'
import { Link } from 'react-router-dom'
import { cajaController } from '../controllers/caja.js'
import { exportToExcel } from '../../../utils/exportExcel.js'
import CajaModal from '../components/CajaModal.jsx'
import { DataTable } from '../../../components/ui/DataTable.jsx'
import Can from '../../../components/ui/Can.jsx'
import { useAuthStore } from '../../../store/useAuthStore.js'

export function Cajas() {
  const [cajas, setCajas] = useState([])
  const [loading, setLoading] = useState(true)
  const [busq, setBusq] = useState('')
  const [isModalOpen, setModalOpen] = useState(false)
  const [cajaEdit, setCajaEdit] = useState(null)

  const { user } = useAuthStore()
  const branchId = user?.active_acceso?.branch_id

  const loadCajas = useCallback(async () => {
    setLoading(true)
    const res = await cajaController.getAll()
    if (res.success) setCajas(res.data)
    setLoading(false)
  }, [])

  useEffect(() => {
    loadCajas()
  }, [loadCajas, branchId])

  const handleBusq = (e) => setBusq(e.target.value)

  const filtered = cajas.filter(c =>
    c.nombre?.toLowerCase().includes(busq.toLowerCase()) ||
    c.serie?.toLowerCase().includes(busq.toLowerCase()) ||
    c.identificador_caja?.toLowerCase().includes(busq.toLowerCase())
  )

  const handleExport = () => {
    const data = filtered.map((c) => ({
      'ID Caja': c.identificador_caja || '-',
      Nombre: c.nombre,
      Serie: c.serie,
      Correlativo: c.correlativo,
      'Tipo Comprobante': c.tipo_comprobante_id || '-',
      Estado: c.activo ? 'Activo' : 'Inactivo',
      Tipo: c.tipo_caja
    }))
    exportToExcel(data, 'cajas_series', 'Cajas_Series')
  }

  const handleOpenNew = () => {
    setCajaEdit(null)
    setModalOpen(true)
  }

  const handleOpenEdit = (caja) => {
    setCajaEdit(caja)
    setModalOpen(true)
  }

  const handleDelete = async (id) => {
    if (!window.confirm('¿Inactivar este registro?')) return
    const res = await cajaController.delete(id)
    if (res.success) {
      loadCajas()
    } else {
      alert(res.error || 'Error al eliminar')
    }
  }

  const columns = useMemo(() => [
    { header: 'Identificador', accessorKey: 'identificador_caja', cell: (info) => <span className="font-medium text-slate-700 dark:text-slate-300">{info.getValue() || '-'}</span> },
    { header: 'Nombre / Descripción', accessorKey: 'nombre' },
    { header: 'Serie', accessorKey: 'serie', cell: (info) => <span className="uppercase font-semibold tracking-wide text-blue-600 dark:text-blue-400">{info.getValue()}</span> },
    { header: 'Correlativo', accessorKey: 'correlativo', cell: (info) => String(info.getValue()).padStart(8, '0') },
    { header: 'Tipo Comp.', accessorKey: 'tipo_comprobante_id', cell: (info) => <span className="bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 px-2 py-1 rounded text-xs">{info.getValue() || '-'}</span> },
    { header: 'Tipo Caja', accessorKey: 'tipo_caja', cell: (info) => <span className="text-xs uppercase">{info.getValue()}</span> },
    {
      header: 'Estado',
      accessorKey: 'activo',
      cell: (info) => (
        <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${info.getValue() ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-500/10 dark:text-emerald-400' : 'bg-red-100 text-red-800 dark:bg-red-500/10 dark:text-red-400'}`}>
          {info.getValue() ? 'Activo' : 'Inactivo'}
        </span>
      )
    },
    {
      id: 'acciones',
      header: 'Acciones',
      cell: (info) => (
        <div className="flex justify-end gap-2">
          <Can I="editar" a="cajas">
            <button
              onClick={() => handleOpenEdit(info.row.original)}
              className="p-1.5 text-slate-400 hover:text-blue-600 dark:hover:text-blue-400 transition-colors"
              title="Editar"
            >
              <PencilIcon className="h-5 w-5" />
            </button>
          </Can>
          <Can I="eliminar" a="cajas">
            <button
              onClick={() => handleDelete(info.row.original.id)}
              className="p-1.5 text-slate-400 hover:text-red-600 dark:hover:text-red-400 transition-colors"
              title="Inactivar"
            >
              <TrashIcon className="h-5 w-5" />
            </button>
          </Can>
        </div>
      ),
      className: 'text-right'
    }
  ], [])

  return (
    <div className="space-y-6 p-6">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <Link to="/configuracion" className="p-2 -ml-2 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-full transition-colors text-slate-500" title="Volver a Configuración">
            <ArrowLeftIcon className="h-5 w-5" />
          </Link>
          <div>
            <h1 className="text-2xl font-bold text-slate-800 dark:text-white">Series y Correlativos</h1>
            <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
              Configura las series de comprobantes y cajas para la sucursal activa.
            </p>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-3 w-full sm:w-auto">
          <div className="relative flex-1 sm:flex-none">
            <MagnifyingGlassIcon className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-slate-400" />
            <input
              type="text"
              placeholder="Buscar serie..."
              value={busq}
              onChange={handleBusq}
              className="w-full sm:w-64 pl-10 pr-4 py-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-500 focus:border-transparent outline-none transition-all text-sm dark:text-white"
            />
          </div>

          <Can I="ver" a="cajas">
            <button
              onClick={handleExport}
              className="flex items-center gap-2 px-4 py-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-200 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors text-sm font-medium whitespace-nowrap shadow-sm"
            >
              <ArrowDownTrayIcon className="h-5 w-5" />
              Exportar
            </button>
          </Can>

          <Can I="crear" a="cajas">
            <button
              onClick={handleOpenNew}
              className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm font-medium shadow-sm shadow-blue-500/20 whitespace-nowrap"
            >
              <PlusIcon className="h-5 w-5" />
              Nueva Caja
            </button>
          </Can>
        </div>
      </div>

      <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/60 dark:border-slate-800/60 shadow-sm overflow-hidden">
        <DataTable
          data={filtered}
          columns={columns}
          loading={loading}
          emptyMessage="No se encontraron series para esta sucursal."
        />
      </div>

      <CajaModal
        isOpen={isModalOpen}
        onClose={() => setModalOpen(false)}
        caja={cajaEdit}
        onSave={loadCajas}
      />
    </div>
  )
}
