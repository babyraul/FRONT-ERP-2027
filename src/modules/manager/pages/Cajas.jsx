import { useEffect, useState, useCallback, useMemo } from 'react'
import { 
  MagnifyingGlassIcon, 
  ArrowDownTrayIcon, 
  PlusIcon, 
  PencilIcon, 
  TrashIcon, 
  ArrowLeftIcon,
  ArchiveBoxIcon,
  DocumentDuplicateIcon,
  TableCellsIcon,
  Squares2X2Icon
} from '@heroicons/react/24/outline'
import { Link } from 'react-router-dom'
import { cajaController } from '../controllers/caja.js'
import { exportToExcel } from '../../../utils/exportExcel.js'
import CajaModal from '../components/CajaModal.jsx'
import { DataTable } from '../../../components/ui/DataTable.jsx'
import Can from '../../../components/ui/Can.jsx'
import { useAuthStore } from '../../../store/useAuthStore.js'

export function Cajas() {
  const [cajas, setCajas] = useState([])
  const [tiposComprobante, setTiposComprobante] = useState({})
  const [usuariosMap, setUsuariosMap] = useState({})
  const [loading, setLoading] = useState(true)
  const [busq, setBusq] = useState('')
  const [isModalOpen, setModalOpen] = useState(false)
  const [cajaEdit, setCajaEdit] = useState(null)
  const [viewMode, setViewMode] = useState('cards') // 'cards' (agrupado) | 'table'

  const { user } = useAuthStore()
  const branchId = user?.active_acceso?.branch_id

  const loadData = useCallback(async () => {
    setLoading(true)
    const [resCajas, resTipos, resUsers] = await Promise.all([
      cajaController.getAll(),
      cajaController.getTiposComprobante(),
      cajaController.getUsuarios()
    ])

    if (resCajas.success) {
      setCajas(resCajas.data)
    }

    if (resTipos.success && Array.isArray(resTipos.data)) {
      const mapaTipos = {}
      resTipos.data.forEach(t => {
        mapaTipos[t.id] = t.descripcion || t.abreviatura || t.id
      })
      setTiposComprobante(mapaTipos)
    }

    if (resUsers.success && Array.isArray(resUsers.data)) {
      const mapaUsers = {}
      resUsers.data.forEach(u => {
        mapaUsers[u.id] = u.nombre_completo || u.nombre || u.usuario
      })
      setUsuariosMap(mapaUsers)
    }

    setLoading(false)
  }, [])

  useEffect(() => {
    loadData()
  }, [loadData, branchId])

  const handleBusq = (e) => setBusq(e.target.value)

  // Filtrado plano de registros
  const filtered = useMemo(() => {
    return cajas.filter(c =>
      c.nombre?.toLowerCase().includes(busq.toLowerCase()) ||
      c.serie?.toLowerCase().includes(busq.toLowerCase()) ||
      c.identificador_caja?.toLowerCase().includes(busq.toLowerCase()) ||
      c.tipo_caja?.toLowerCase().includes(busq.toLowerCase()) ||
      (c.usuario_id && usuariosMap[c.usuario_id]?.toLowerCase().includes(busq.toLowerCase()))
    )
  }, [cajas, busq, usuariosMap])

  // Agrupación por identificador_caja (o clave fallback si no tiene)
  const groupedCajas = useMemo(() => {
    const groups = {}
    filtered.forEach(item => {
      const key = item.identificador_caja || `sin-id-${item.nombre}`
      if (!groups[key]) {
        groups[key] = {
          identificador_caja: item.identificador_caja || 'S/N',
          nombre: item.nombre,
          tipo_caja: item.tipo_caja || 'ADMINISTRATIVA',
          branch_id: item.branch_id,
          usuario_id: item.usuario_id,
          activo: item.activo,
          series: []
        }
      }
      // Mantener actualizado el usuario_id si alguna serie lo tiene
      if (item.usuario_id && !groups[key].usuario_id) {
        groups[key].usuario_id = item.usuario_id
      }
      groups[key].series.push(item)
    })
    return Object.values(groups)
  }, [filtered])

  const handleExport = () => {
    const data = filtered.map((c) => ({
      'ID Caja': c.identificador_caja || '-',
      Nombre: c.nombre,
      Tipo: c.tipo_caja,
      'Usuario Asignado': usuariosMap[c.usuario_id] || 'Disponible para todos',
      'Tipo Comprobante': tiposComprobante[c.tipo_comprobante_id] || c.tipo_comprobante_id || '-',
      Serie: c.serie,
      Correlativo: String(c.correlativo ?? 0).padStart(8, '0'),
      Estado: c.activo ? 'Activo' : 'Inactivo',
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
    if (!window.confirm('¿Inactivar/eliminar esta serie de caja?')) return
    const res = await cajaController.delete(id)
    if (res.success) {
      loadData()
    } else {
      alert(res.error || 'Error al eliminar')
    }
  }

  // Columnas para la vista de tabla agrupada
  const tableColumns = useMemo(() => [
    {
      header: 'Caja / Identificador',
      accessorKey: 'identificador_caja',
      cell: (info) => {
        const item = info.row.original
        const usuarioNombre = item.usuario_id ? (usuariosMap[item.usuario_id] || 'Usuario asignado') : null
        return (
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-xl bg-blue-50 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 flex items-center justify-center font-bold text-xs tracking-wider border border-blue-100 dark:border-blue-800/40">
              {item.identificador_caja}
            </div>
            <div>
              <div className="font-semibold text-slate-800 dark:text-white flex items-center gap-2">
                {item.nombre}
                <span className="text-[10px] font-medium tracking-wide uppercase px-2 py-0.5 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300">
                  {item.tipo_caja}
                </span>
              </div>
              <div className="flex items-center gap-2 text-xs text-slate-400 mt-0.5">
                <span>{item.series.length} doc{item.series.length > 1 ? 's' : ''}</span>
                <span>•</span>
                <span className={usuarioNombre ? 'text-indigo-600 dark:text-indigo-400 font-medium' : 'text-slate-400 italic'}>
                  {usuarioNombre ? `Asignada a: ${usuarioNombre}` : 'Sin usuario asignado'}
                </span>
              </div>
            </div>
          </div>
        )
      }
    },
    {
      header: 'Series y Correlativos Autorizados',
      id: 'series_correlativos',
      cell: (info) => {
        const item = info.row.original
        return (
          <div className="flex flex-wrap gap-2 py-1">
            {item.series.map((s) => {
              const nombreDoc = tiposComprobante[s.tipo_comprobante_id] || s.tipo_comprobante_id || 'DOC'
              return (
                <div
                  key={s.id}
                  className="inline-flex items-center gap-2 bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700/80 rounded-lg px-2.5 py-1 text-xs shadow-2xs"
                >
                  <span className="font-semibold text-blue-700 dark:text-blue-400 uppercase tracking-wider">
                    {s.serie}
                  </span>
                  <span className="text-slate-400 font-mono text-[11px]">
                    N° {String(s.correlativo ?? 0).padStart(8, '0')}
                  </span>
                  <span className="text-[10px] bg-slate-200/70 dark:bg-slate-700 text-slate-600 dark:text-slate-300 px-1.5 py-0.5 rounded" title={nombreDoc}>
                    {s.tipo_comprobante_id}
                  </span>
                  <div className="flex items-center ml-1 border-l border-slate-200 dark:border-slate-700 pl-1.5 gap-1">
                    <Can I="editar" a="cajas">
                      <button
                        onClick={() => handleOpenEdit(s)}
                        className="text-slate-400 hover:text-blue-600 dark:hover:text-blue-400 transition-colors p-0.5"
                        title={`Editar serie ${s.serie}`}
                      >
                        <PencilIcon className="h-3.5 w-3.5" />
                      </button>
                    </Can>
                    <Can I="eliminar" a="cajas">
                      <button
                        onClick={() => handleDelete(s.id)}
                        className="text-slate-400 hover:text-red-600 dark:hover:text-red-400 transition-colors p-0.5"
                        title={`Inactivar serie ${s.serie}`}
                      >
                        <TrashIcon className="h-3.5 w-3.5" />
                      </button>
                    </Can>
                  </div>
                </div>
              )
            })}
          </div>
        )
      }
    },
    {
      header: 'Estado',
      id: 'estado',
      cell: (info) => {
        const item = info.row.original
        const algunActivo = item.series.some(s => s.activo)
        return (
          <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${algunActivo ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-500/10 dark:text-emerald-400' : 'bg-red-100 text-red-800 dark:bg-red-500/10 dark:text-red-400'}`}>
            {algunActivo ? 'Activa' : 'Inactiva'}
          </span>
        )
      }
    }
  ], [tiposComprobante, usuariosMap])

  return (
    <div className="space-y-6 p-6">
      {/* Cabecera Principal */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <Link 
            to="/configuracion" 
            className="p-2 -ml-2 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-full transition-colors text-slate-500" 
            title="Volver a Configuración"
          >
            <ArrowLeftIcon className="h-5 w-5" />
          </Link>
          <div>
            <h1 className="text-2xl font-bold text-slate-800 dark:text-white flex items-center gap-2">
              Cajas, Series y Correlativos
            </h1>
            <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
              Administración unificada de cajas y talonarios de comprobantes por sucursal.
            </p>
          </div>
        </div>

        {/* Acciones Superiores */}
        <div className="flex flex-wrap items-center gap-3 w-full sm:w-auto">
          {/* Selector de Vista: Tarjetas agrupadas o Tabla */}
          <div className="flex items-center bg-slate-100 dark:bg-slate-800 p-1 rounded-xl border border-slate-200 dark:border-slate-700">
            <button
              onClick={() => setViewMode('cards')}
              className={`p-1.5 rounded-lg text-xs font-medium flex items-center gap-1.5 transition-all ${
                viewMode === 'cards'
                  ? 'bg-white dark:bg-slate-900 text-blue-600 dark:text-blue-400 shadow-2xs font-semibold'
                  : 'text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200'
              }`}
              title="Vista de Cajas Agrupadas"
            >
              <Squares2X2Icon className="h-4 w-4" />
              <span className="hidden md:inline">Cajas</span>
            </button>
            <button
              onClick={() => setViewMode('table')}
              className={`p-1.5 rounded-lg text-xs font-medium flex items-center gap-1.5 transition-all ${
                viewMode === 'table'
                  ? 'bg-white dark:bg-slate-900 text-blue-600 dark:text-blue-400 shadow-2xs font-semibold'
                  : 'text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200'
              }`}
              title="Vista en Tabla"
            >
              <TableCellsIcon className="h-4 w-4" />
              <span className="hidden md:inline">Tabla</span>
            </button>
          </div>

          <div className="relative flex-1 sm:flex-none">
            <MagnifyingGlassIcon className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-slate-400" />
            <input
              type="text"
              placeholder="Buscar por caja o serie..."
              value={busq}
              onChange={handleBusq}
              className="w-full sm:w-64 pl-10 pr-4 py-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-500 focus:border-transparent outline-none transition-all text-sm dark:text-white"
            />
          </div>

          <Can I="ver" a="cajas">
            <button
              onClick={handleExport}
              className="btn-primary flex items-center gap-2"
              title="Exportar a Excel"
            >
              <ArrowDownTrayIcon className="h-4 w-4" />
              Exportar
            </button>
          </Can>

          <Can I="crear" a="cajas">
            <button
              onClick={handleOpenNew}
              className="btn-primary flex items-center gap-2"
            >
              <PlusIcon className="h-4 w-4" />
              Nueva Caja
            </button>
          </Can>
        </div>
      </div>

      {/* Contenido Principal */}
      {loading ? (
        <div className="py-16 text-center text-slate-400 dark:text-slate-500">
          <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mb-3"></div>
          <p className="text-sm">Cargando cajas y series...</p>
        </div>
      ) : groupedCajas.length === 0 ? (
        <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/60 dark:border-slate-800/60 p-12 text-center text-slate-400 dark:text-slate-500">
          <ArchiveBoxIcon className="h-12 w-12 mx-auto stroke-1 mb-3 text-slate-300 dark:text-slate-600" />
          <p className="text-base font-medium text-slate-600 dark:text-slate-300">No se encontraron cajas registradas</p>
          <p className="text-xs text-slate-400 mt-1">Crea una nueva caja para configurar sus comprobantes y series.</p>
        </div>
      ) : viewMode === 'cards' ? (
        /* VISTA AGRUPADA EN TARJETAS */
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {groupedCajas.map((grupo) => {
            const tieneActivo = grupo.series.some(s => s.activo)
            return (
              <div
                key={grupo.identificador_caja + grupo.nombre}
                className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/70 dark:border-slate-800/70 shadow-xs hover:shadow-md transition-shadow flex flex-col justify-between overflow-hidden"
              >
                {/* Cabecera de la Tarjeta */}
                <div className="p-5 border-b border-slate-100 dark:border-slate-800/80">
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-center gap-3">
                      <div className="h-11 w-11 rounded-xl bg-blue-50 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 flex items-center justify-center font-bold text-sm tracking-wider border border-blue-100 dark:border-blue-800/40">
                        {grupo.identificador_caja}
                      </div>
                      <div>
                        <h3 className="font-semibold text-slate-900 dark:text-white text-base">
                          {grupo.nombre}
                        </h3>
                        <div className="flex items-center gap-2 mt-0.5">
                          <span className="text-[10px] font-semibold tracking-wide uppercase px-2 py-0.5 rounded-md bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300">
                            {grupo.tipo_caja}
                          </span>
                        </div>
                      </div>
                    </div>
                    <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-medium ${
                      tieneActivo 
                        ? 'bg-emerald-50 text-emerald-700 dark:bg-emerald-500/10 dark:text-emerald-400' 
                        : 'bg-red-50 text-red-700 dark:bg-red-500/10 dark:text-red-400'
                    }`}>
                      {tieneActivo ? 'Activa' : 'Inactiva'}
                    </span>
                  </div>
                </div>

                {/* Lista de Series y Correlativos */}
                <div className="p-5 flex-1 space-y-3">
                  <div className="flex items-center justify-between text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                    <span className="flex items-center gap-1.5">
                      <DocumentDuplicateIcon className="h-4 w-4" />
                      Series y Correlativos
                    </span>
                    <span className="text-[11px] font-normal lowercase bg-slate-100 dark:bg-slate-800 px-2 py-0.5 rounded-full">
                      {grupo.series.length} doc{grupo.series.length > 1 ? 's' : ''}
                    </span>
                  </div>

                  <div className="space-y-2">
                    {grupo.series.map((s) => {
                      const desc = tiposComprobante[s.tipo_comprobante_id] || s.tipo_comprobante_id || 'Comprobante'
                      return (
                        <div
                          key={s.id}
                          className="flex items-center justify-between p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-100 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700 transition-colors"
                        >
                          <div className="min-w-0 pr-2">
                            <div className="flex items-center gap-2">
                              <span className="font-bold text-sm tracking-wide text-blue-600 dark:text-blue-400">
                                {s.serie}
                              </span>
                              <span className="text-[10px] font-medium px-1.5 py-0.5 rounded bg-slate-200/80 dark:bg-slate-700 text-slate-600 dark:text-slate-300">
                                {s.tipo_comprobante_id}
                              </span>
                            </div>
                            <p className="text-xs text-slate-500 dark:text-slate-400 truncate mt-0.5" title={desc}>
                              {desc}
                            </p>
                          </div>

                          <div className="flex items-center gap-3">
                            <div className="text-right">
                              <div className="text-xs font-mono font-medium text-slate-800 dark:text-slate-200">
                                {String(s.correlativo ?? 0).padStart(8, '0')}
                              </div>
                              <span className="text-[10px] text-slate-400 block -mt-0.5">correlativo</span>
                            </div>

                            <div className="flex items-center gap-1 border-l border-slate-200 dark:border-slate-700 pl-2">
                              <Can I="editar" a="cajas">
                                <button
                                  onClick={() => handleOpenEdit(s)}
                                  className="p-1 text-slate-400 hover:text-blue-600 dark:hover:text-blue-400 rounded hover:bg-white dark:hover:bg-slate-700 transition-colors"
                                  title="Editar serie"
                                >
                                  <PencilIcon className="h-4 w-4" />
                                </button>
                              </Can>
                              <Can I="eliminar" a="cajas">
                                <button
                                  onClick={() => handleDelete(s.id)}
                                  className="p-1 text-slate-400 hover:text-red-600 dark:hover:text-red-400 rounded hover:bg-white dark:hover:bg-slate-700 transition-colors"
                                  title="Inactivar serie"
                                >
                                  <TrashIcon className="h-4 w-4" />
                                </button>
                              </Can>
                            </div>
                          </div>
                        </div>
                      )
                    })}
                  </div>
                </div>

                {/* Pie de Tarjeta */}
                <div className="px-5 py-3 bg-slate-50/70 dark:bg-slate-800/30 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between text-xs text-slate-400">
                  <div className="flex items-center gap-1.5 truncate max-w-[65%]">
                    <span className="text-slate-400">Asignada:</span>
                    <span className={`font-medium truncate ${grupo.usuario_id && usuariosMap[grupo.usuario_id] ? 'text-indigo-600 dark:text-indigo-400' : 'text-slate-500 italic'}`}>
                      {grupo.usuario_id && usuariosMap[grupo.usuario_id] ? usuariosMap[grupo.usuario_id] : 'Disponible'}
                    </span>
                  </div>
                  <span>ID: <code className="font-mono text-slate-500 dark:text-slate-400">{grupo.identificador_caja}</code></span>
                </div>
              </div>
            )
          })}
        </div>
      ) : (
        /* VISTA EN TABLA AGRUPADA */
        <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/60 dark:border-slate-800/60 shadow-xs overflow-hidden">
          <DataTable
            data={groupedCajas}
            columns={tableColumns}
            loading={loading}
            emptyMessage="No se encontraron series para esta sucursal."
          />
        </div>
      )}

      {/* Modal para Crear o Editar */}
      <CajaModal
        isOpen={isModalOpen}
        onClose={() => setModalOpen(false)}
        caja={cajaEdit}
        onSave={loadData}
      />
    </div>
  )
}
