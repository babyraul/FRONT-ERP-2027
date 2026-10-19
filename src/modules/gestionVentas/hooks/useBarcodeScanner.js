import { useEffect, useRef } from 'react'

/**
 * Hook para interceptar lecturas globales de escáner de código de barras
 * Cumple con RN-16: Detecta buffer que cumpla ^PV-\d+$ seguido de Enter.
 *
 * @param {Function} onScan - Callback al detectar un código de preventa escaneado
 * @param {boolean} enabled - Si el listener está activo
 */
export function useBarcodeScanner(onScan, enabled = true) {
  const bufferRef = useRef('')
  const lastKeyTimeRef = useRef(0)

  useEffect(() => {
    if (!enabled) return

    const handleKeyDown = (e) => {
      // Si el foco está en un input o textarea normal, no capturar para no interferir con tipeos
      const tag = e.target.tagName?.toUpperCase()
      if (tag === 'INPUT' || tag === 'TEXTAREA' || e.target.isContentEditable) {
        return
      }

      // Ignorar teclas modificadoras
      const ignoredKeys = [
        'Shift', 'Control', 'Alt', 'Meta', 'CapsLock',
        'Tab', 'ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight',
        'Escape'
      ]
      if (ignoredKeys.includes(e.key)) return

      const now = Date.now()
      // Si pasan más de 500ms entre teclas, se reinicia el buffer (humano tipeando lento vs lector veloz)
      if (now - lastKeyTimeRef.current > 500) {
        bufferRef.current = ''
      }
      lastKeyTimeRef.current = now

      if (e.key === 'Enter') {
        const rawCode = bufferRef.current.trim().toUpperCase()
        bufferRef.current = ''

        // Validación con regex según regla RN-16 / V-07: ^PV-\d+$ o número correlativo
        const match = rawCode.match(/^PV-(\d+)$/)
        if (match) {
          e.preventDefault()
          onScan(rawCode, match[1])
        }
      } else if (e.key.length === 1) {
        bufferRef.current += e.key
      }
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [onScan, enabled])
}
