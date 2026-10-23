import { useState } from 'react'
import {
  ExclamationTriangleIcon,
  ArrowPathRoundedSquareIcon
} from '@heroicons/react/24/outline'
import ActionSection from '../../../components/ui/ActionSection.jsx'
import Modal from '../../../components/ui/Modal.jsx'
import { stockController } from '../controllers/stock.js'
import { toast } from '../../../utils/toast.js'

/**
 * Componente Empresarial StockReinicioModal
 * Extrae la lógica y vista de reinicio masivo de saldos de stock a 0.
 * Soporta variant="inline" con transiciones de ActionSection o variant="modal".
 */
export default function StockReinicioModal({
  isOpen,
  onClose,
  almacenes = [],
  almacenInicial = '',
  variant = 'inline',
  onReinicioCompletado
}) {
  const [resetAlmacenId, setResetAlmacenId] = useState(almacenInicial || '')
  const [resetTipoSaldo, setResetTipoSaldo] = useState('todos') // 'todos' | 'solo_negativos' | 'solo_positivos'
  const [resetMotivo, setResetMotivo] = useState('REINICIO GENERAL DE INVENTARIO FÍSICO')
  const [resetIncluirCombos, setResetIncluirCombos] = useState(false)
  const [resetConfirmWord, setResetConfirmWord] = useState('')
  const [isResetting, setIsResetting] = useState(false)

  const handleConfirmarReinicio = async () => {
    if (resetConfirmWord.trim().toUpperCase() !== 'REINICIAR') {
      toast.error('Confirmación requerida', 'Escriba la palabra REINICIAR para confirmar esta acción.')
      return
    }

    setIsResetting(true)
    try {
      console.log('🔄 [REINICIO STOCK] Enviando solicitud con parámetros:', {
        almacen_id: resetAlmacenId || 'TODOS',
        tipo_saldo: resetTipoSaldo,
        incluir_combos: resetIncluirCombos,
        motivo: resetMotivo || 'REINICIO GENERAL DE INVENTARIO FÍSICO'
      })

      const res = await stockController.reiniciarStockMasivo({
        almacen_id: resetAlmacenId || undefined,
        tipo_saldo: resetTipoSaldo,
        incluir_combos: resetIncluirCombos,
        motivo: resetMotivo || 'REINICIO GENERAL DE INVENTARIO FÍSICO'
      })

      console.log('📋 [REINICIO STOCK] Respuesta completa del servidor:', res)

      if (res.success) {
        const afectados = res.data?.productos_afectados || []
        console.group('✅ [REINICIO STOCK] DETALLE DE PRODUCTOS REINICIADOS A 0')
        console.log(`Total registros afectados: ${res.data?.afectados || 0}`)
        if (afectados.length > 0) {
          console.table(
            afectados.map((item) => ({
              'Producto': item.producto_nombre,
              'Presentación': item.presentacion_nombre,
              'Saldo Anterior': item.saldo_anterior,
              'Ajuste Aplicado': item.ajuste_aplicado,
              'Nuevo Saldo': item.saldo_nuevo,
              'ID Producto': item.producto_id
            }))
          )
        } else {
          console.log('No hubo productos que cumplieran con el filtro de saldo seleccionado.')
        }
        console.groupEnd()

        toast.success('Stock Reiniciado', res.message || 'Se ha reiniciado el stock a 0 correctamente.')
        setIsResetting(false)
        setResetConfirmWord('')

        // Refrescar los datos reactivamente sin recargar la página completa para preservar la consola intacta
        if (onReinicioCompletado) {
          onReinicioCompletado()
        }
        if (onClose) {
          onClose()
        }
      } else {
        console.warn('⚠️ [REINICIO STOCK] El servidor respondió sin éxito:', res)
        toast.error('Error al reiniciar stock', res.message || 'No se pudo reiniciar el stock.')
        setIsResetting(false)
      }
    } catch (err) {
      console.error('❌ [REINICIO STOCK] Error al reiniciar stock:', err)
      toast.error('Error inesperado', err.message || 'Ocurrió un error al procesar el reinicio masivo.')
      setIsResetting(false)
    }
  }

  const formContent = (
    <div className="space-y-5 text-sm text-slate-700 dark:text-slate-300 max-w-4xl mx-auto py-2">
      {/* Alerta de advertencia con micro-diseño */}
      <div className="p-4 bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900/50 rounded-2xl flex items-start gap-3.5 shadow-xs">
        <ExclamationTriangleIcon className="h-6 w-6 text-rose-600 shrink-0 mt-0.5" />
        <div className="text-xs space-y-1">
          <p className="font-bold text-rose-800 dark:text-rose-300 text-sm">
            ¡Atención: Acción Destructiva de Regularización de Inventario!
          </p>
          <p className="text-rose-700 dark:text-rose-400 leading-relaxed">
            Se actualizarán los registros en <strong className="font-mono font-semibold">stock_actual</strong> a <strong>0.00</strong>.
            Para cada producto regularizado con saldo distinto de 0, se registrará un movimiento compensatorio en la tabla histórica <strong className="font-mono font-semibold">stock</strong> (kárdex) garantizando consistencia, auditoría y trazabilidad contable.
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Almacén selector */}
        <div className="space-y-1.5">
          <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wide">
            Almacén objetivo
          </label>
          <select
            value={resetAlmacenId}
            onChange={(e) => setResetAlmacenId(e.target.value)}
            disabled={isResetting}
            className="w-full px-3.5 py-2.5 text-xs bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl font-medium focus:ring-2 focus:ring-[#01a59c]/20 focus:border-[#01a59c] focus:outline-none disabled:opacity-50 transition-all"
          >
            <option value="">TODOS LOS ALMACENES DE LA SUCURSAL</option>
            {almacenes.map((alm) => (
              <option key={alm.id} value={alm.id}>
                {alm.nombre} {alm.es_principal ? '(Principal)' : ''}
              </option>
            ))}
          </select>
          <span className="text-[11px] text-slate-400">
            Puede reiniciar solo un almacén específico o todos los de su sucursal activa.
          </span>
        </div>

        {/* Motivo */}
        <div className="space-y-1.5">
          <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wide">
            Concepto / Motivo de la regularización
          </label>
          <input
            type="text"
            value={resetMotivo}
            onChange={(e) => setResetMotivo(e.target.value)}
            disabled={isResetting}
            placeholder="Ej. TOMA DE INVENTARIO FÍSICO GENERAL"
            className="w-full px-3.5 py-2.5 text-xs bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl font-medium focus:ring-2 focus:ring-[#01a59c]/20 focus:border-[#01a59c] focus:outline-none disabled:opacity-50 transition-all"
          />
          <span className="text-[11px] text-slate-400">
            Este texto quedará registrado en el Kárdex de cada producto regularizado.
          </span>
        </div>
      </div>

      {/* Alcance de saldos */}
      <div className="space-y-2">
        <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wide">
          Alcance de Saldos a Regularizar
        </label>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <label
            className={`p-3 rounded-2xl border flex flex-col justify-between cursor-pointer transition-all ${resetTipoSaldo === 'todos'
              ? 'border-[#01a59c] bg-teal-50/50 dark:bg-teal-950/30 text-[#01a59c] ring-2 ring-[#01a59c]/20 shadow-xs'
              : 'border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900/60 hover:border-slate-300 text-slate-700 dark:text-slate-300'
              }`}
          >
            <div className="flex items-center gap-2.5">
              <input
                type="radio"
                name="resetTipoSaldoModal"
                value="todos"
                checked={resetTipoSaldo === 'todos'}
                onChange={(e) => setResetTipoSaldo(e.target.value)}
                disabled={isResetting}
                className="text-[#01a59c] focus:ring-[#01a59c]"
              />
              <span className="text-xs font-black">Todos los Saldos</span>
            </div>
            <span className="text-[11px] text-slate-400 mt-1 pl-6">
              Pone positivos y negativos a cero
            </span>
          </label>

          <label
            className={`p-3 rounded-2xl border flex flex-col justify-between cursor-pointer transition-all ${resetTipoSaldo === 'solo_negativos'
              ? 'border-rose-500 bg-rose-50/50 dark:bg-rose-950/30 text-rose-600 ring-2 ring-rose-500/20 shadow-xs'
              : 'border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900/60 hover:border-slate-300 text-slate-700 dark:text-slate-300'
              }`}
          >
            <div className="flex items-center gap-2.5">
              <input
                type="radio"
                name="resetTipoSaldoModal"
                value="solo_negativos"
                checked={resetTipoSaldo === 'solo_negativos'}
                onChange={(e) => setResetTipoSaldo(e.target.value)}
                disabled={isResetting}
                className="text-rose-600 focus:ring-rose-500"
              />
              <span className="text-xs font-black">Solo Negativos</span>
            </div>
            <span className="text-[11px] text-slate-400 mt-1 pl-6">
              Regulariza solo saldos &lt; 0
            </span>
          </label>

          <label
            className={`p-3 rounded-2xl border flex flex-col justify-between cursor-pointer transition-all ${resetTipoSaldo === 'solo_positivos'
              ? 'border-emerald-500 bg-emerald-50/50 dark:bg-emerald-950/30 text-emerald-600 ring-2 ring-emerald-500/20 shadow-xs'
              : 'border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900/60 hover:border-slate-300 text-slate-700 dark:text-slate-300'
              }`}
          >
            <div className="flex items-center gap-2.5">
              <input
                type="radio"
                name="resetTipoSaldoModal"
                value="solo_positivos"
                checked={resetTipoSaldo === 'solo_positivos'}
                onChange={(e) => setResetTipoSaldo(e.target.value)}
                disabled={isResetting}
                className="text-emerald-600 focus:ring-emerald-500"
              />
              <span className="text-xs font-black">Solo Positivos</span>
            </div>
            <span className="text-[11px] text-slate-400 mt-1 pl-6">
              Regulariza solo saldos &gt; 0
            </span>
          </label>
        </div>
      </div>

      {/* Opción para Combos */}
      <div className="p-3.5 rounded-2xl border border-slate-200 dark:border-slate-800 bg-slate-50/80 dark:bg-slate-900/40">
        <label className="flex items-start gap-3 cursor-pointer select-none">
          <input
            type="checkbox"
            checked={resetIncluirCombos}
            onChange={(e) => setResetIncluirCombos(e.target.checked)}
            disabled={isResetting}
            className="mt-0.5 size-4 rounded border-slate-300 dark:border-slate-700 text-[#01a59c] focus:ring-[#01a59c] accent-[#01a59c]"
          />
          <div className="space-y-0.5">
            <span className="text-xs font-bold text-slate-800 dark:text-slate-200 block">
              Incluir productos tipo COMBO en el reinicio
            </span>
            <span className="text-[11px] text-slate-500 dark:text-slate-400 leading-relaxed block">
              Por defecto está <strong>desactivado</strong> para proteger el contador de combos despachados. Si marcas esta casilla, los combos con saldo negativo también se pondrán en 0.
            </span>
          </div>
        </label>
      </div>

      {/* Input de confirmación estricta */}
      <div className="space-y-2 p-4 bg-slate-50 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-800 rounded-2xl">
        <label className="block text-xs font-bold text-slate-900 dark:text-white">
          Para confirmar la operación, escriba exactamente <span className="font-mono text-rose-600 dark:text-rose-400 font-black">REINICIAR</span>:
        </label>
        <input
          type="text"
          value={resetConfirmWord}
          onChange={(e) => setResetConfirmWord(e.target.value.toUpperCase())}
          placeholder="REINICIAR"
          disabled={isResetting}
          className="w-full px-4 py-2.5 text-xs bg-white dark:bg-slate-950 border border-slate-300 dark:border-slate-700 rounded-xl font-mono font-bold tracking-widest focus:ring-2 focus:ring-rose-500 focus:outline-none disabled:opacity-50"
        />
      </div>

      {/* Animación activa de procesamiento */}
      {isResetting && (
        <div className="p-4 bg-teal-50 dark:bg-teal-950/40 border border-teal-200 dark:border-teal-800/60 rounded-2xl flex items-center gap-4 animate-pulse">
          <div className="w-6 h-6 border-2 border-teal-600 border-t-transparent rounded-full animate-spin shrink-0"></div>
          <div className="text-xs">
            <p className="font-bold text-teal-800 dark:text-teal-200 text-sm">
              Reiniciando inventario y registrando Kárdex...
            </p>
            <p className="text-teal-600 dark:text-teal-400 text-xs mt-0.5">
              Por favor no cierre la ventana, la página se recargará automáticamente al finalizar.
            </p>
          </div>
        </div>
      )}
    </div>
  )

  if (variant === 'inline') {
    return (
      <ActionSection
        isOpen={isOpen}
        onClose={onClose}
        title="Reinicio Masivo de Stock a Cero"
        subtitle="Regularización automática de saldos en stock_actual con generación de movimientos compensatorios en Kárdex."
        confirmText="Confirmar y Reiniciar"
        cancelText="Volver a la Lista"
        onConfirm={handleConfirmarReinicio}
        isProcessing={isResetting}
        showFooter={true}
        hideConfirm={false}
        extraHeader={
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-rose-50 dark:bg-rose-950/60 text-rose-700 dark:text-rose-300 border border-rose-200 dark:border-rose-800/60">
            <ArrowPathRoundedSquareIcon className="h-4 w-4" />
            Acción de Regularización
          </span>
        }
      >
        {formContent}
      </ActionSection>
    )
  }

  return (
    <Modal
      isOpen={isOpen}
      onClose={() => !isResetting && onClose()}
      title="Reinicio Masivo de Stock a Cero"
      subtitle="Regularización de saldos en stock_actual con generación de movimientos en Kárdex."
      size="lg"
      variant="modal"
      confirmText="Confirmar y Reiniciar"
      onConfirm={handleConfirmarReinicio}
      isProcessing={isResetting}
      hideConfirm={false}
    >
      {formContent}
    </Modal>
  )
}
