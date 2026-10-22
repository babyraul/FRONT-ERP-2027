import { useEffect, useRef, useState } from 'react'

/**
 * AuthBackground
 * Efecto de fondo canvas de alto rendimiento:
 * - Partículas de energía ascendentes con estela y núcleo
 * - Circuito digital en perspectiva
 * - Reactivo al cursor (halo dinámico)
 * - Detección de tema claro/oscuro en tiempo real (MutationObserver)
 * - Pausa automática al cambiar de pestaña (0% CPU)
 */
export const AuthBackground = ({ logoUrl }) => {
  const canvasRef = useRef(null)
  const mouseRef = useRef({ x: -1000, y: -1000, targetX: -1000, targetY: -1000, active: false })
  const [isDark, setIsDark] = useState(() => {
    return (
      document.documentElement.getAttribute('data-theme') === 'dark' ||
      document.documentElement.classList.contains('dark') ||
      window.matchMedia('(prefers-color-scheme: dark)').matches
    )
  })

  // Escuchar cambios de tema (claro/oscuro)
  useEffect(() => {
    const observer = new MutationObserver(() => {
      const dark =
        document.documentElement.getAttribute('data-theme') === 'dark' ||
        document.documentElement.classList.contains('dark')
      setIsDark(dark)
    })

    observer.observe(document.documentElement, {
      attributes: true,
      attributeFilter: ['data-theme', 'class']
    })

    return () => observer.disconnect()
  }, [])

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d', { alpha: true })
    if (!ctx) return

    let animationFrameId
    let width = 0
    let height = 0
    let isVisible = true

    const PARTICLE_COUNT = 52
    const CIRCUIT_LINES_COUNT = 8
    const particles = []
    const circuitStreams = []

    const getColors = () =>
      isDark
        ? {
            fuelCyan: 'rgba(6, 182, 212, ',
            fuelTeal: 'rgba(1, 165, 156, ',
            fuelEmerald: 'rgba(16, 185, 129, ',
            fuelAmber: 'rgba(245, 158, 11, ',
            gridLine: 'rgba(1, 165, 156, 0.07)'
          }
        : {
            fuelCyan: 'rgba(8, 145, 178, ',
            fuelTeal: 'rgba(13, 148, 136, ',
            fuelEmerald: 'rgba(5, 150, 105, ',
            fuelAmber: 'rgba(217, 119, 6, ',
            gridLine: 'rgba(13, 148, 136, 0.08)'
          }

    const colors = getColors()

    const resize = () => {
      const dpr = Math.min(window.devicePixelRatio || 1, 2)
      width = window.innerWidth
      height = window.innerHeight
      canvas.width = Math.floor(width * dpr)
      canvas.height = Math.floor(height * dpr)
      canvas.style.width = `${width}px`
      canvas.style.height = `${height}px`
      ctx.scale(dpr, dpr)
    }

    resize()
    window.addEventListener('resize', resize, { passive: true })

    // Partículas
    const colorTypes = ['fuelCyan', 'fuelTeal', 'fuelEmerald', 'fuelAmber']
    for (let i = 0; i < PARTICLE_COUNT; i++) {
      particles.push({
        x: Math.random() * width,
        y: Math.random() * height,
        size: Math.random() * 2.2 + 0.8,
        speedY: Math.random() * 0.9 + 0.35,
        swayRange: Math.random() * 25 + 10,
        phase: Math.random() * Math.PI * 2,
        baseAlpha: Math.random() * 0.55 + 0.25,
        tailLength: Math.random() * 12 + 6,
        colorType: colorTypes[Math.floor(Math.random() * colorTypes.length)],
        sparkle: Math.random() > 0.7
      })
    }

    // Circuitos
    for (let i = 0; i < CIRCUIT_LINES_COUNT; i++) {
      circuitStreams.push({
        xPercent: (i + 1) / (CIRCUIT_LINES_COUNT + 1) + (Math.random() * 0.05 - 0.025),
        pulseY: Math.random() * height,
        pulseSpeed: Math.random() * 2 + 1.2,
        pulseLength: Math.random() * 120 + 80,
        alpha: Math.random() * 0.3 + 0.2
      })
    }

    const handleMouseMove = (e) => {
      mouseRef.current.targetX = e.clientX
      mouseRef.current.targetY = e.clientY
      mouseRef.current.active = true
    }

    const handleMouseLeave = () => {
      mouseRef.current.active = false
      mouseRef.current.targetX = -1000
      mouseRef.current.targetY = -1000
    }

    window.addEventListener('mousemove', handleMouseMove, { passive: true })
    window.addEventListener('mouseleave', handleMouseLeave, { passive: true })

    const handleVisibility = () => {
      isVisible = !document.hidden
      if (isVisible) {
        lastTime = performance.now()
        animationFrameId = requestAnimationFrame(render)
      } else {
        cancelAnimationFrame(animationFrameId)
      }
    }
    document.addEventListener('visibilitychange', handleVisibility)

    let lastTime = performance.now()
    let time = 0

    const render = (now) => {
      if (!isVisible) return

      const dt = Math.min((now - lastTime) / 1000, 0.1)
      lastTime = now
      time += dt

      const m = mouseRef.current
      m.x += (m.targetX - m.x) * 0.1
      m.y += (m.targetY - m.y) * 0.1

      ctx.clearRect(0, 0, width, height)

      // 1. Cuadrícula en perspectiva
      const gridHorizon = height * 0.72
      const gridBottom = height
      const numLines = 14

      ctx.save()
      ctx.strokeStyle = colors.gridLine
      ctx.lineWidth = 1
      for (let i = 0; i <= numLines; i++) {
        const xBottom = (width / numLines) * i
        const xHorizon = width * 0.5 + (xBottom - width * 0.5) * 0.25
        ctx.beginPath()
        ctx.moveTo(xHorizon, gridHorizon)
        ctx.lineTo(xBottom, gridBottom)
        ctx.stroke()
      }
      ctx.restore()

      // 2. Líneas de circuito digital con pulsos
      circuitStreams.forEach((stream) => {
        const streamX = stream.xPercent * width
        stream.pulseY -= stream.pulseSpeed * 60 * dt
        if (stream.pulseY < -stream.pulseLength) {
          stream.pulseY = height + Math.random() * 100
        }

        const grad = ctx.createLinearGradient(
          streamX,
          stream.pulseY,
          streamX,
          stream.pulseY + stream.pulseLength
        )
        grad.addColorStop(0, 'rgba(6, 182, 212, 0)')
        grad.addColorStop(
          0.5,
          isDark ? `rgba(6, 182, 212, ${stream.alpha})` : `rgba(13, 148, 136, ${stream.alpha})`
        )
        grad.addColorStop(1, 'rgba(6, 182, 212, 0)')

        ctx.strokeStyle = grad
        ctx.lineWidth = 1.5
        ctx.beginPath()
        ctx.moveTo(streamX, stream.pulseY)
        ctx.lineTo(streamX, stream.pulseY + stream.pulseLength)
        ctx.stroke()
      })

      // 3. Halo del cursor
      if (m.active && m.x > -500) {
        const mouseGlow = ctx.createRadialGradient(m.x, m.y, 0, m.x, m.y, 240)
        mouseGlow.addColorStop(0, isDark ? 'rgba(6, 182, 212, 0.14)' : 'rgba(13, 148, 136, 0.12)')
        mouseGlow.addColorStop(0.5, 'rgba(1, 165, 156, 0.04)')
        mouseGlow.addColorStop(1, 'rgba(0, 0, 0, 0)')
        ctx.fillStyle = mouseGlow
        ctx.fillRect(m.x - 240, m.y - 240, 480, 480)
      }

      // 4. Partículas
      particles.forEach((p) => {
        p.y -= p.speedY * 60 * dt
        const currentX = p.x + Math.sin(time * 2 + p.phase) * p.swayRange

        if (p.y < -30) {
          p.y = height + Math.random() * 40
          p.x = Math.random() * width
        }

        const colorPrefix = colors[p.colorType] || colors.fuelTeal
        const alpha = p.baseAlpha

        // Estela
        ctx.strokeStyle = `${colorPrefix}${alpha * 0.4})`
        ctx.lineWidth = p.size * 0.6
        ctx.beginPath()
        ctx.moveTo(currentX, p.y)
        ctx.lineTo(currentX, p.y + p.tailLength)
        ctx.stroke()

        // Núcleo
        ctx.fillStyle = `${colorPrefix}${alpha})`
        ctx.beginPath()
        ctx.arc(currentX, p.y, p.size, 0, Math.PI * 2)
        ctx.fill()
      })

      animationFrameId = requestAnimationFrame(render)
    }

    animationFrameId = requestAnimationFrame(render)

    return () => {
      cancelAnimationFrame(animationFrameId)
      window.removeEventListener('resize', resize)
      window.removeEventListener('mousemove', handleMouseMove)
      window.removeEventListener('mouseleave', handleMouseLeave)
      document.removeEventListener('visibilitychange', handleVisibility)
    }
  }, [isDark])

  return (
    <div
      className="fixed inset-0 pointer-events-none overflow-hidden select-none"
      style={{ zIndex: 0 }}
      aria-hidden="true"
    >
      {/* Fondo degradado base */}
      <div
        className="absolute inset-0 transition-colors duration-700"
        style={{
          background: isDark
            ? 'radial-gradient(ellipse 90% 80% at 50% 100%, #061c24 0%, #07131b 45%, #03080e 100%)'
            : 'radial-gradient(ellipse 90% 80% at 50% 100%, #e0f2fe 0%, #f0fdfa 45%, #f8fafc 100%)'
        }}
      />

      {/* Auras de energía */}
      <div
        className="absolute -top-32 -left-32 w-96 h-96 rounded-full blur-3xl opacity-20 pointer-events-none animate-pulse"
        style={{
          background: 'radial-gradient(circle, #01a59c 0%, transparent 70%)',
          animationDuration: '8s'
        }}
      />
      <div
        className="absolute top-1/3 -right-24 w-80 h-80 rounded-full blur-3xl opacity-15 pointer-events-none animate-pulse"
        style={{
          background: 'radial-gradient(circle, #f59e0b 0%, transparent 70%)',
          animationDuration: '10s',
          animationDelay: '2s'
        }}
      />

      {/* Marca de agua de fondo */}
      {logoUrl && (
        <div
          className="absolute inset-0 flex items-center justify-center opacity-[0.035] dark:opacity-[0.045] pointer-events-none transition-opacity duration-500"
          style={{
            backgroundImage: `url(${logoUrl})`,
            backgroundPosition: 'center',
            backgroundRepeat: 'no-repeat',
            backgroundSize: '340px',
            filter: 'grayscale(100%) brightness(1.2)'
          }}
        />
      )}

      {/* Canvas interactivo */}
      <canvas ref={canvasRef} className="absolute inset-0 block w-full h-full pointer-events-none" />

      {/* Viñeta sutil */}
      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          boxShadow: isDark
            ? 'inset 0 0 120px rgba(0, 0, 0, 0.7)'
            : 'inset 0 0 100px rgba(15, 23, 42, 0.05)'
        }}
      />
    </div>
  )
}

export default AuthBackground
