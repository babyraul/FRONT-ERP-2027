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
  CubeIcon
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
  RefreshButton,
  NewButton
} from '../../../components/ui/ActionButtons.jsx'
import ComboModal from '../components/ComboModal.jsx'
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

  // Modal Confirmación de Eliminación / Anulación
  const [deleteModalOpen, setDeleteModalOpen] = useState(false)
  const [comboToDelete, setComboToDelete] = useState(null)
  const [isDeleting, setIsDeleting] = useState(false)

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

  // Alternar Activar / Desactivar
  const handleToggleState = async (combo) => {
    const isActivo = combo.activo !== false && combo.Estado === 'Activo'
    const nuevoEstado = isActivo ? 'Inactivo' : 'Activo'
    const comboId = combo.id || combo.IdCombo

    const res = await combosService.toggleState(comboId, nuevoEstado)
    if (res.success) {
      toast.success('Actualizado', 'Se actualizó correctamente el combo.')
      fetchCombos()
    } else {
      toast.error('Error', res.error || 'No se pudo actualizar el estado.')
    }
  }

  // Confirmar eliminación
  const handleConfirmDelete = async () => {
    if (!comboToDelete) return
    setIsDeleting(true)
    const comboId = comboToDelete.id || comboToDelete.IdCombo
    const res = await combosService.delete(comboId)
    setIsDeleting(false)

    if (res.success) {
      toast.success('Eliminado', 'Se eliminó correctamente.')
      setDeleteModalOpen(false)
      setComboToDelete(null)
      fetchCombos()
    } else {
      toast.error('Error', res.error || 'No se pudo eliminar el combo.')
    }
  }

  // Columnas TanStack DataTable respetando contrato legacy y ActionButtons del sistema
  const columns = useMemo(
    () => [
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
        header: 'Stock disponible',
        size: 140,
        cell: ({ row }) => {
          const stock = Number(row.original.stock ?? row.original.Stock ?? 0)
          return (
            <div className="text-center">
              <span
                className={`font-mono text-xs font-bold px-2 py-0.5 rounded ${stock > 0
                    ? 'text-emerald-700 bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800/60'
                    : 'text-amber-700 bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800/60'
                  }`}
              >
                {stock} {stock === 1 ? 'unidad' : 'unidades'}
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
      },
      {
        id: 'acciones',
        header: 'Acciones',
        size: 240,
        cell: ({ row }) => {
          const combo = row.original
          const isActivo = combo.activo !== false && combo.Estado === 'Activo'
          return (
            <ActionCell align="right">
              {/* Botón Editar con ActionButtons */}
              <EditRowButton
                onClick={() => handleEdit(combo)}
                title="Editar combo"
              />

              {/* Botón Alternar Estado Activar / Desactivar */}
              {isActivo ? (
                <button
                  type="button"
                  onClick={() => handleToggleState(combo)}
                  className="p-1.5 rounded-lg transition-colors inline-flex items-center justify-center cursor-pointer shrink-0 bg-amber-50 dark:bg-amber-950/40 text-amber-600 dark:text-amber-400 hover:bg-amber-100 dark:hover:bg-amber-900/40"
                  title="Desactivar combo"
                >
                  <XCircleIcon className="h-4 w-4" />
                </button>
              ) : (
                <ReactivateRowButton
                  onClick={() => handleToggleState(combo)}
                  title="Activar combo"
                />
              )}

              {/* Botón Anular / Eliminar */}
              <DeleteRowButton
                onClick={() => {
                  setComboToDelete(combo)
                  setDeleteModalOpen(true)
                }}
                title="Anular / Eliminar combo"
              />
            </ActionCell>
          )
        }
      }
    ],
    []
  )

  return (
    <div className="space-y-4">
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

      {/* ── CONTENEDOR IN-PLACE CON TRANSICIÓN ANIMADA DE LA LISTA / FORMULARIO ── */}
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

      {/* MODAL CONFIRMACIÓN DE ANULACIÓN / ELIMINACIÓN */}
      <Modal
        isOpen={deleteModalOpen}
        onClose={() => {
          if (!isDeleting) setDeleteModalOpen(false)
        }}
        title="Confirmar eliminación"
        size="md"
      >
        <div className="space-y-4">
          <div className="flex items-center gap-3 text-amber-600 dark:text-amber-400">
            <div className="p-3 bg-amber-50 dark:bg-amber-950/40 rounded-full">
              <TrashIcon className="h-6 w-6" />
            </div>
            <div>
              <h4 className="font-semibold text-slate-900 dark:text-white">
                ¿Está seguro de eliminar este combo?
              </h4>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Se eliminará el combo &quot;{comboToDelete?.nombre || comboToDelete?.Nombre}&quot; y
                su composición de productos. Esta acción no se puede deshacer.
              </p>
            </div>
          </div>

          <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-200 dark:border-slate-700">
            <button
              type="button"
              disabled={isDeleting}
              onClick={() => setDeleteModalOpen(false)}
              className="px-4 py-2 text-sm font-medium rounded-lg text-slate-700 dark:text-slate-300 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors"
            >
              Cancelar
            </button>
            <button
              type="button"
              disabled={isDeleting}
              onClick={handleConfirmDelete}
              className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium rounded-lg text-white bg-red-600 hover:bg-red-700 disabled:opacity-50 transition-colors"
            >
              {isDeleting && (
                <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent" />
              )}
              <span>Eliminar</span>
            </button>
          </div>
        </div>
      </Modal>
    </div>
  )
}
