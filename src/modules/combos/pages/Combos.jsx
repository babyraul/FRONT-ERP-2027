import { useEffect, useState, useMemo } from 'react'
import {
  MagnifyingGlassIcon,
  PlusIcon,
  PencilIcon,
  TrashIcon,
  SparklesIcon,
  ArrowPathIcon,
  CheckCircleIcon,
  XCircleIcon,
  CubeIcon,
  ExclamationTriangleIcon
} from '@heroicons/react/24/outline'
import PageHeader from '../../../components/ui/PageHeader.jsx'
import { DataTable } from '../../../components/ui/DataTable.jsx'
import Modal from '../../../components/ui/Modal.jsx'
import ActionSection from '../../../components/ui/ActionSection.jsx'
import {
  ActionCell,
  EditRowButton,
  DeleteRowButton,
  ReactivateRowButton,
  KardexRowButton,
  RefreshButton,
  NewButton
} from '../../../components/ui/ActionButtons.jsx'
import ComboModal from '../components/ComboModal.jsx'
import StockKardexModal from '../../stock/components/StockKardexModal.jsx'
import { combosService } from '../controller/combos.js'
import { toast } from '../../../utils/toast.js'

export default function Combos() {
  const [combos, setCombos] = useState([])
  const [loading, setLoading] = useState(false)
  const [busq, setBusq] = useState('')
  const [estadoFiltro, setEstadoFiltro] = useState('todos') // 'todos' | 'activos' | 'inactivos'

  // Panel Inline Alta / Edición
  const [isFormOpen, setIsFormOpen] = useState(false)
  const [selectedComboId, setSelectedComboId] = useState(null)

  // Modal / Panel Inline Kárdex
  const [kardexModalOpen, setKardexModalOpen] = useState(false)
  const [kardexCombo, setKardexCombo] = useState(null)

  // Modal Confirmación de Inactivación
  const [inactivarModalOpen, setInactivarModalOpen] = useState(false)
  const [comboAInactivar, setComboAInactivar] = useState(null)
  const [isInactivating, setIsInactivating] = useState(false)

  const fetchCombos = async () => {
    setLoading(true)
    const res = await combosService.fetchAll()
    if (res.success) {
      setCombos(res.data)
    } else {
      toast.error('Error', res.error || 'No se pudo obtener el listado de combos.')
    }
    setLoading(false)
  }

  useEffect(() => {
    fetchCombos()
  }, [])

  // Filtrado reactivo en frontend
  const filtered = useMemo(() => {
    return combos.filter((c) => {
      // Filtro por Estado
      const isActivo = c.activo !== false && c.Estado === 'Activo'
      if (estadoFiltro === 'activos' && !isActivo) return false
      if (estadoFiltro === 'inactivos' && isActivo) return false

      // Filtro por Búsqueda (Nombre o Código de Barras)
      const q = busq.toLowerCase().trim()
      if (!q) return true

      return (
        (c.nombre || c.Nombre || '').toLowerCase().includes(q) ||
        (c.codigo_barra || c.CodigoBarras || '').toLowerCase().includes(q) ||
        (c.codigo || '').toLowerCase().includes(q)
      )
    })
  }, [combos, busq, estadoFiltro])

  // Abrir panel registro (variant="inline")
  const handleCreate = () => {
    setSelectedComboId(null)
    setIsFormOpen(true)
  }

  // Abrir panel edición (variant="inline")
  const handleEdit = (combo) => {
    setSelectedComboId(combo.id || combo.IdCombo)
    setIsFormOpen(true)
  }

  // Abrir modal Kárdex para el combo
  const handleOpenKardex = (combo) => {
    // Estructurar el ítem en el formato esperado por StockKardexModal
    const itemData = {
      id: combo.id || combo.IdCombo,
      nombre: combo.nombre || combo.Nombre,
      codigo: combo.codigo || '',
      codigo_barra: combo.codigo_barra || combo.CodigoBarras || '',
      presentacion_id: combo.presentacion_id || null,
      presentacion_nombre: 'UNIDAD',
      unidad_medida_id: combo.unidad_medida_id || 'NIU',
      stock_actual: Number(combo.stock ?? combo.Stock ?? 0)
    }
    setKardexCombo(itemData)
    setKardexModalOpen(true)
  }

  // Solicitar confirmación de inactivación (dar de baja)
  const handleSolicitarInactivar = (combo) => {
    setComboAInactivar(combo)
    setInactivarModalOpen(true)
  }

  // Confirmar inactivación
  const handleConfirmarInactivar = async () => {
    if (!comboAInactivar) return
    setIsInactivating(true)
    const comboId = comboAInactivar.id || comboAInactivar.IdCombo
    const res = await combosService.toggleState(comboId, 'Inactivo')
    setIsInactivating(false)

    if (res.success) {
      toast.success('Inactivado', `El combo "${comboAInactivar.nombre || comboAInactivar.Nombre}" fue dado de baja correctamente.`)
      setInactivarModalOpen(false)
      setComboAInactivar(null)
      fetchCombos()
    } else {
      toast.error('Error', res.error || 'No se pudo inactivar el combo.')
    }
  }

  // Reactivar combo directamente
  const handleReactivar = async (combo) => {
    const comboId = combo.id || combo.IdCombo
    const res = await combosService.toggleState(comboId, 'Activo')
    if (res.success) {
      toast.success('Reactivado', `El combo "${combo.nombre || combo.Nombre}" fue reactivado exitosamente.`)
      fetchCombos()
    } else {
      toast.error('Error', res.error || 'No se pudo reactivar el combo.')
    }
  }

  // Columnas TanStack DataTable respetando contrato unificado y ActionButtons
  const columns = useMemo(
    () => [
      {
        id: 'acciones',
        header: 'Acciones',
        size: 130,
        cell: ({ row }) => {
          const combo = row.original
          const isActivo = combo.activo !== false && combo.Estado === 'Activo'
          return (
            <ActionCell align="center">
              {/* Botón Editar */}
              <EditRowButton
                onClick={() => handleEdit(combo)}
                title="Editar combo"
              />

              {/* Botón Kárdex (Movimientos y Ventas del combo) */}
              <KardexRowButton
                onClick={() => handleOpenKardex(combo)}
                title="Ver Kárdex y ventas del combo"
              />

              {/* Botón Único de Inactivar / Reactivar (Nunca eliminación física) */}
              {isActivo ? (
                <DeleteRowButton
                  onClick={() => handleSolicitarInactivar(combo)}
                  title="Inactivar / Dar de baja el combo"
                />
              ) : (
                <ReactivateRowButton
                  onClick={() => handleReactivar(combo)}
                  title="Reactivar combo"
                />
              )}
            </ActionCell>
          )
        }
      },
      {
        accessorKey: 'Estado',
        header: 'Estado',
        size: 90,
        cell: ({ row }) => {
          const isActivo = row.original.activo !== false && row.original.Estado === 'Activo'
          return (
            <div className="flex items-center justify-center">
              <span
                className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold ${isActivo
                  ? 'text-emerald-700 bg-emerald-50 dark:bg-emerald-950/40 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-800'
                  : 'text-red-700 bg-red-50 dark:bg-red-950/40 dark:text-red-400 border border-red-200 dark:border-red-800'
                  }`}
              >
                <span
                  className="h-1.5 w-1.5 rounded-full"
                  style={{ backgroundColor: isActivo ? '#388E3C' : '#D32F2F' }}
                />
                <span>{isActivo ? 'Activo' : 'Inactivo'}</span>
              </span>
            </div>
          )
        }
      },
      {
        accessorKey: 'Nombre',
        header: 'Nombre',
        cell: ({ row }) => {
          const c = row.original
          return (
            <div>
              <span className="font-semibold text-slate-800 dark:text-slate-200">
                {c.nombre || c.Nombre}
              </span>
              {c.codigo && (
                <span className="ml-2 text-xs text-slate-400 font-mono">({c.codigo})</span>
              )}
            </div>
          )
        }
      },
      {
        accessorKey: 'CodigoBarras',
        header: 'Codigo barras',
        size: 180,
        cell: ({ row }) => {
          const cod = row.original.codigo_barra || row.original.CodigoBarras
          return cod ? (
            <span className="font-mono text-xs text-slate-700 dark:text-slate-300 bg-slate-100 dark:bg-slate-800/80 px-2 py-0.5 rounded border border-slate-200/80 dark:border-slate-700 inline-block">
              {cod}
            </span>
          ) : (
            <span className="text-slate-400 italic text-xs">-</span>
          )
        }
      },
      {
        accessorKey: 'Stock',
        header: 'Stock / Ventas',
        size: 160,
        cell: ({ row }) => {
          const rawStock = Number(row.original.stock_actual ?? row.original.stock ?? row.original.Stock ?? 0)
          // Si el saldo_actual es negativo (-9), significa que han salido / se han vendido 9 unidades del combo
          const ventas = row.original.ventas_totales !== undefined
            ? Number(row.original.ventas_totales)
            : Math.abs(rawStock < 0 ? rawStock : 0)

          return (
            <div className="text-center" title="Total de combos vendidos registrados en el Kárdex">
              <span
                className={`font-mono text-xs font-bold px-2.5 py-0.5 rounded-full border inline-block ${ventas > 0
                  ? 'text-teal-700 bg-teal-50 dark:bg-teal-950/40 border-teal-200 dark:border-teal-800/60'
                  : 'text-slate-600 bg-slate-100 dark:bg-slate-800 border-slate-200 dark:border-slate-700 dark:text-slate-400'
                  }`}
              >
                {ventas} {ventas === 1 ? 'vendido' : 'vendidos'}
              </span>
            </div>
          )
        }
      },
      {
        accessorKey: 'Precio',
        header: 'Precio combo',
        size: 130,
        cell: ({ row }) => {
          const precio = Number(row.original.precio ?? row.original.Precio ?? 0)
          return (
            <div className="text-right font-mono font-bold text-slate-900 dark:text-white">
              S/ {precio.toFixed(2)}
            </div>
          )
        }
      }
    ],
    []
  )

  return (
    <div className="space-y-6 p-6">
      {/* ── ENCABEZADO MODULAR GLOBAL (PageHeader) ── */}
      <PageHeader
        title="Gestión de Combos"
        actions={
          <>
            <RefreshButton
              onClick={fetchCombos}
              loading={loading}
              title="Actualizar listado de combos"
            />
            {!isFormOpen && (
              <NewButton
                onClick={handleCreate}
                label="Registrar combo"
                title="Crear un nuevo paquete o producto de tipo combo"
              />
            )}
          </>
        }
      />

      {/* BARRA DE BÚSQUEDA Y FILTROS RÁPIDOS (Siempre visible) */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-3 p-3 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-2xs">
        {/* Selector de Estado: Activos, Inactivos, Todos */}
        <div className="flex items-center bg-slate-100 dark:bg-slate-800 p-0.5 rounded-lg border border-slate-200 dark:border-slate-700 w-full sm:w-auto">
          {[
            { id: 'todos', label: 'Todos' },
            { id: 'activos', label: '● Activos' },
            { id: 'inactivos', label: '● Inactivos' }
          ].map((f) => (
            <button
              key={f.id}
              type="button"
              onClick={() => setEstadoFiltro(f.id)}
              className={`flex-1 sm:flex-none px-3 py-1.5 text-xs font-bold rounded-md transition-all cursor-pointer ${estadoFiltro === f.id
                ? f.id === 'inactivos'
                  ? 'bg-rose-600 text-white shadow-xs'
                  : f.id === 'activos'
                    ? 'bg-white dark:bg-slate-900 text-emerald-600 dark:text-emerald-400 shadow-xs'
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
          <MagnifyingGlassIcon className="absolute left-3.5 top-2.5 h-4 w-4 text-slate-400" />
          <input
            type="text"
            placeholder="Buscar combo por nombre, código..."
            value={busq}
            onChange={(e) => setBusq(e.target.value)}
            className="w-full pl-10 pr-4 py-2 text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white focus:ring-2 focus:ring-[#01a59c] outline-none transition-all"
          />
        </div>
      </div>

      {/* ── CONTENEDOR IN-PLACE CON TRANSICIÓN ANIMADA DE LA LISTA / FORMULARIO / KARDEX ── */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-sm overflow-hidden transition-all duration-300">
        {isFormOpen ? (
          <ComboModal
            isOpen={isFormOpen}
            onClose={() => {
              setIsFormOpen(false)
              setSelectedComboId(null)
            }}
            comboId={selectedComboId}
            onSaved={() => {
              setIsFormOpen(false)
              setSelectedComboId(null)
              fetchCombos()
            }}
            variant="inline"
          />
        ) : kardexModalOpen ? (
          <StockKardexModal
            isOpen={kardexModalOpen}
            onClose={() => {
              setKardexModalOpen(false)
              setKardexCombo(null)
            }}
            itemSeleccionado={kardexCombo}
            onStockUpdated={fetchCombos}
            variant="inline"
          />
        ) : (
          <div className="transition-all duration-300 ease-in-out opacity-100 translate-y-0">
            <DataTable
              columns={columns}
              data={filtered}
              loading={loading}
              pagination={{ pageSize: 10, pageSizes: [5, 10, 20, 25, 50, 100] }}
              emptyMessage="No se encontraron registros de combos."
            />
          </div>
        )}
      </div>

      {/* MODAL CONFIRMACIÓN DE INACTIVACIÓN / DAR DE BAJA (Nunca eliminación de BD) */}
      <Modal
        isOpen={inactivarModalOpen}
        onClose={() => {
          if (!isInactivating) {
            setInactivarModalOpen(false)
            setComboAInactivar(null)
          }
        }}
        title="Confirmar Baja de Combo"
        size="md"
        confirmText={isInactivating ? 'Inactivando...' : 'Sí, dar de baja'}
        cancelText="Cancelar"
        isProcessing={isInactivating}
        onConfirm={handleConfirmarInactivar}
      >
        <div className="space-y-4">
          <div className="flex items-start gap-3 text-amber-600 dark:text-amber-400">
            <div className="p-3 bg-amber-50 dark:bg-amber-950/40 rounded-full shrink-0">
              <ExclamationTriangleIcon className="h-6 w-6" />
            </div>
            <div>
              <h4 className="font-semibold text-slate-900 dark:text-white">
                ¿Está seguro de dar de baja este combo?
              </h4>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 leading-relaxed">
                El combo <strong>&quot;{comboAInactivar?.nombre || comboAInactivar?.Nombre}&quot;</strong> pasará al estado <strong>Inactivo</strong> y ya no se mostrará como opción disponible para facturación rápida en la pantalla de ventas. Podrás reactivarlo en cualquier momento.
              </p>
            </div>
          </div>
        </div>
      </Modal>
    </div>
  )
}
