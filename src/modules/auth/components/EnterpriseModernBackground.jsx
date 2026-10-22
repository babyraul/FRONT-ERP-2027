import React from 'react'

/**
 * EnterpriseModernBackground
 * 
 * Fondo Corporativo / Fintech Industrial de Alta Gama (Estilo Linear / Stripe / Datadog):
 * - Micro-retícula técnica isométrica / blueprint con degradado radial de foco central.
 * - Haces de luz volumétrica (auroras y spots angulares) en animación respiratoria lenta.
 * - Ondas de flujo de datos y telemetría fiscal en tiempo real (simulando tránsito de paquetes y comprobantes).
 * - Partículas de polvo de luz en suspensión cuántica.
 * - 100% acelerado por GPU, cero consumo de CPU y adaptable a Dark/Light mode.
 */
export default function EnterpriseModernBackground() {
  return (
    <div
      aria-hidden="true"
      className="pointer-events-none absolute inset-0 overflow-hidden select-none bg-[#f8fafc] dark:bg-[#07100f] transition-colors duration-700"
    >
      {/* ─── 1. RESPLANDORES VOLUMÉTRICOS PROFUNDOS (AURORAS CORPORATIVAS) ─── */}
      {/* Haz principal verde teal (#01a59c) en respiración lenta */}
      <div className="absolute top-[-20%] left-1/2 -translate-x-1/2 w-[850px] h-[650px] rounded-full bg-gradient-to-b from-[#01a59c]/25 via-[#35605a]/15 to-transparent dark:from-[#01a59c]/30 dark:via-[#092a25]/20 blur-[130px] animate-pulse" style={{ animationDuration: '8s' }} />

      {/* Haz secundario angular en esmeralda profundo */}
      <div className="absolute bottom-[-15%] right-[-10%] w-[600px] h-[550px] rounded-full bg-gradient-to-tl from-[#06b6a4]/15 via-teal-900/10 to-transparent blur-[120px]" />
      
      {/* Haz terciario superior izquierdo */}
      <div className="absolute top-[20%] left-[-10%] w-[500px] h-[450px] rounded-full bg-gradient-to-br from-[#35605a]/20 to-transparent blur-[110px]" />

      {/* ─── 2. MICRO-RETÍCULA DE INGENIERÍA / BLUEPRINT TÉCNICO ─── */}
      <div
        className="absolute inset-0 opacity-[0.45] dark:opacity-[0.25]"
        style={{
          backgroundImage: `
            linear-gradient(to right, rgba(1, 165, 156, 0.12) 1px, transparent 1px),
            linear-gradient(to bottom, rgba(1, 165, 156, 0.12) 1px, transparent 1px)
          `,
          backgroundSize: '40px 40px',
          maskImage: 'radial-gradient(ellipse 70% 65% at 50% 50%, #000 35%, transparent 85%)',
          WebkitMaskImage: 'radial-gradient(ellipse 70% 65% at 50% 50%, #000 35%, transparent 85%)'
        }}
      />

      {/* Puntos de intersección de la retícula (Tech Dot Matrix) */}
      <div
        className="absolute inset-0 opacity-[0.6] dark:opacity-[0.4]"
        style={{
          backgroundImage: 'radial-gradient(rgba(1, 165, 156, 0.35) 1px, transparent 1px)',
          backgroundSize: '40px 40px',
          maskImage: 'radial-gradient(ellipse 60% 55% at 50% 50%, #000 20%, transparent 80%)',
          WebkitMaskImage: 'radial-gradient(ellipse 60% 55% at 50% 50%, #000 20%, transparent 80%)'
        }}
      />

      {/* ─── 3. ANILLOS ORBITALES CONCÉNTRICOS DE TELEMETRÍA (FIBRA ÓPTICA / SUNAT) ─── */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[720px] h-[720px] rounded-full border border-[#01a59c]/15 dark:border-[#01a59c]/20 [mask-image:radial-gradient(circle,transparent_40%,#000_65%,transparent_95%)] pointer-events-none erp-orbit-slow" />
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[980px] h-[980px] rounded-full border border-dashed border-[#01a59c]/10 dark:border-[#06b6a4]/15 [mask-image:radial-gradient(circle,transparent_50%,#000_75%,transparent_98%)] pointer-events-none erp-orbit-reverse" />

      {/* ─── 4. RAYOS DE TRANSMISIÓN DE DATOS EN PERSPECTIVA (SVG VECTORIAL DINÁMICO) ─── */}
      <svg
        className="absolute inset-0 h-full w-full opacity-60 dark:opacity-40"
        xmlns="http://www.w3.org/2000/svg"
        viewBox="0 0 1600 900"
        preserveAspectRatio="none"
      >
        <defs>
          <linearGradient id="laserGrad1" x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" stopColor="#01a59c" stopOpacity="0" />
            <stop offset="50%" stopColor="#06b6a4" stopOpacity="0.8" />
            <stop offset="100%" stopColor="#01a59c" stopOpacity="0" />
          </linearGradient>
          <linearGradient id="laserGrad2" x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stopColor="#01a59c" stopOpacity="0" />
            <stop offset="50%" stopColor="#2dd4bf" stopOpacity="0.7" />
            <stop offset="100%" stopColor="#01a59c" stopOpacity="0" />
          </linearGradient>
        </defs>

        {/* Líneas de circuito de datos diagonales sutiles */}
        <g stroke="currentColor" className="text-[#01a59c]/20 dark:text-[#06b6a4]/20" strokeWidth="1">
          <line x1="0" y1="250" x2="1600" y2="450" strokeDasharray="6 12" />
          <line x1="0" y1="650" x2="1600" y2="500" strokeDasharray="8 16" />
          <line x1="200" y1="0" x2="700" y2="900" strokeDasharray="4 10" />
          <line x1="1400" y1="0" x2="900" y2="900" strokeDasharray="4 10" />
        </g>

        {/* Pulsos de datos en tránsito que recorren las guías (Ventas, Comprobantes, Stock) */}
        <circle r="3" fill="#2dd4bf" className="erp-pulse-beam-1">
          <animateMotion
            path="M 0 250 L 1600 450"
            dur="9s"
            repeatCount="indefinite"
          />
        </circle>
        <circle r="2.5" fill="#01a59c" className="erp-pulse-beam-2">
          <animateMotion
            path="M 1600 500 L 0 650"
            dur="13s"
            repeatCount="indefinite"
          />
        </circle>
        <circle r="2" fill="#34d399" className="erp-pulse-beam-3">
          <animateMotion
            path="M 200 0 L 700 900"
            dur="11s"
            repeatCount="indefinite"
          />
        </circle>
      </svg>

      {/* ─── 5. PARTÍCULAS VOLUMÉTRICAS EN SUSPENSIÓN (MICRO-LUCES) ─── */}
      <div className="absolute inset-0">
        <span className="absolute top-[18%] left-[22%] size-1 rounded-full bg-teal-400 dark:bg-[#06b6a4] shadow-[0_0_8px_#2dd4bf] animate-ping" style={{ animationDuration: '4.5s' }} />
        <span className="absolute top-[72%] left-[16%] size-1.5 rounded-full bg-emerald-400 dark:bg-emerald-300 shadow-[0_0_10px_#34d399] animate-ping" style={{ animationDuration: '6s', animationDelay: '1.8s' }} />
        <span className="absolute top-[35%] right-[24%] size-1 rounded-full bg-cyan-400 dark:bg-cyan-300 shadow-[0_0_8px_#22d3ee] animate-ping" style={{ animationDuration: '5.2s', animationDelay: '2.5s' }} />
        <span className="absolute top-[80%] right-[18%] size-1.5 rounded-full bg-teal-300 dark:bg-teal-200 shadow-[0_0_10px_#2dd4bf] animate-ping" style={{ animationDuration: '7s', animationDelay: '0.8s' }} />
      </div>

      {/* ─── 6. GRADIENTE VIÑETA OSCURA DE BORDE (PROFUNDIDAD CINEMATOGRÁFICA) ─── */}
      <div className="absolute inset-0 bg-gradient-to-t from-[#f8fafc]/80 via-transparent to-[#f8fafc]/40 dark:from-[#040908] dark:via-transparent dark:to-[#040908]/60" />
    </div>
  )
}
