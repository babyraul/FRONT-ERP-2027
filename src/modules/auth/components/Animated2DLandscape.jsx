import React from 'react'

/**
 * Animated2DLandscape
 * 
 * Paisaje vectorial 2D animado (2D Animated Landscape) con estética corporativa flat/editorial:
 * - Capas en paralaje sutil (Skyline comercial, almacenes logísticos, montañas de fondo y carretera/flujo continuo).
 * - Temática ERP multirubro:
 *   1. Centro Logístico / Almacén central (racks, montacargas y camión en tránsito de mercadería).
 *   2. Supermercado / Minimarket / Retail (código de barras, góndolas y comprobantes).
 *   3. Nube de Sincronización y Facturación SUNAT con ondas de datos en vivo.
 * - Utiliza estrictamente la paleta de tu proyecto:
 *   --color-primary: #35605a (Dark #1f6f64)
 *   --color-secondary: #01a59c (Dark #06b6a4)
 *   Fondos: --bg (#f1f5f9 / #0f1720)
 * - Ultra ligero: SVG puro animado con CSS transform acelerado por GPU (will-change).
 */
export default function Animated2DLandscape({ logoSrc }) {
  return (
    <div
      aria-hidden="true"
      className="absolute inset-0 overflow-hidden pointer-events-none select-none bg-gradient-to-b from-[#eaf2f1] via-[#d6e7e4] to-[#c2ddd9] dark:from-[#0a1514] dark:via-[#0e1d1b] dark:to-[#122724] transition-colors duration-500"
    >
      {/* ─── 1. CIELO Y SOL / LUNA DEGRADADO CORPORATIVO ─── */}
      <div className="absolute top-10 right-24 size-44 rounded-full bg-gradient-to-tr from-[#01a59c]/20 to-[#35605a]/5 dark:from-[#06b6a4]/25 dark:to-transparent blur-2xl" />

      {/* Nubes vectoriales suaves flotantes */}
      <div className="absolute top-14 left-[8%] opacity-35 dark:opacity-20 erp-cloud-slow">
        <svg width="140" height="40" viewBox="0 0 140 40" fill="currentColor" className="text-white">
          <path d="M20,35 Q10,35 10,25 Q10,12 25,14 Q32,4 45,6 Q55,0 68,6 Q78,4 85,14 Q100,12 100,25 Q100,35 90,35 Z" />
        </svg>
      </div>

      <div className="absolute top-28 left-[45%] opacity-25 dark:opacity-15 erp-cloud-fast">
        <svg width="180" height="50" viewBox="0 0 180 50" fill="currentColor" className="text-white">
          <path d="M25,45 Q12,45 12,32 Q12,16 32,18 Q40,6 58,8 Q70,0 86,8 Q100,6 108,18 Q128,16 128,32 Q128,45 115,45 Z" />
        </svg>
      </div>

      {/* ─── 2. MONTAÑAS / HORIZONTE DE FONDO (CAPA 1: LEJANA) ─── */}
      <svg
        className="absolute bottom-32 w-[160%] -left-[10%] h-64 text-[#35605a]/15 dark:text-[#06b6a4]/10"
        preserveAspectRatio="none"
        viewBox="0 0 1200 300"
      >
        <path
          fill="currentColor"
          d="M0,220 L180,90 L340,240 L520,70 L720,250 L910,110 L1080,260 L1200,180 L1200,300 L0,300 Z"
        />
      </svg>

      {/* ─── 3. SKYLINE COMERCIAL / CIUDAD Y CENTROS DE DISTRIBUCIÓN (CAPA 2) ─── */}
      <svg
        className="absolute bottom-28 w-[140%] -left-[5%] h-52 text-[#35605a]/30 dark:text-[#1f6f64]/25"
        preserveAspectRatio="none"
        viewBox="0 0 1200 250"
      >
        {/* Siluetas de naves industriales, almacenes techados y torres comerciales */}
        <path
          fill="currentColor"
          d="M0,250 L0,180 L60,180 L60,140 L110,140 L110,180 L180,180 L220,130 L260,180 L320,180 L320,90 L370,90 L370,180 L440,180 L490,120 L540,180 L640,180 L640,110 L700,110 L700,180 L790,180 L840,130 L890,180 L960,180 L960,80 L1010,80 L1010,180 L1100,180 L1100,140 L1200,140 L1200,250 Z"
        />
        {/* Ventanas iluminadas en las torres comerciales */}
        <rect x="335" y="105" width="8" height="12" fill="rgba(255,255,255,0.4)" />
        <rect x="350" y="105" width="8" height="12" fill="rgba(255,255,255,0.4)" />
        <rect x="335" y="125" width="8" height="12" fill="rgba(255,255,255,0.4)" />
        <rect x="350" y="125" width="8" height="12" fill="rgba(255,255,255,0.4)" />
        <rect x="975" y="95" width="8" height="12" fill="rgba(255,255,255,0.4)" />
        <rect x="990" y="95" width="8" height="12" fill="rgba(255,255,255,0.4)" />
      </svg>


      {/* ─── 5. PISTA / CARRETERA LOGÍSTICA EN PRIMER PLANO (CAPA DE MOVIMIENTO) ─── */}
      <div className="absolute bottom-0 inset-x-0 h-28 bg-[#2d4d48] dark:bg-[#091614] border-t-4 border-[#01a59c] dark:border-[#06b6a4]/80 shadow-2xl">
        {/* Línea central punteada de la carretera que fluye continuamente */}
        <div className="absolute top-1/2 left-0 right-0 h-0.5 border-t-2 border-dashed border-white/30 erp-road-flow" />

        {/* Camión Logístico 2D animado cruzando el paisaje con mercadería */}
        <div className="absolute top-2 erp-truck-drive flex items-center">
          <div className="relative">
            {/* Camión vector estilizado con logo/cajas */}
            <svg width="105" height="52" viewBox="0 0 120 60" fill="none" className="drop-shadow-lg">
              {/* Carrocería del furgón */}
              <rect x="5" y="10" width="70" height="34" rx="4" fill="#35605a" />
              <rect x="8" y="13" width="64" height="28" rx="2" fill="#01a59c" opacity="0.85" />
              {/* Etiqueta de facturación / mercadería en furgón */}
              <text x="14" y="29" fill="white" fontSize="7" fontWeight="bold" fontFamily="monospace">MIFACTURA</text>
              <text x="14" y="37" fill="#d1fae5" fontSize="6" fontFamily="monospace">DESPACHO</text>

              {/* Cabina */}
              <path d="M75,20 L92,20 L102,32 L102,44 L75,44 Z" fill="#35605a" />
              {/* Ventana de la cabina */}
              <path d="M78,23 L90,23 L97,32 L78,32 Z" fill="#e2e8f0" opacity="0.9" />

              {/* Luces delanteras */}
              <polygon points="102,36 120,32 120,44 102,40" fill="rgba(254, 240, 138, 0.45)" />

              {/* Ruedas con rotación */}
              <circle cx="28" cy="45" r="7" fill="#1e293b" />
              <circle cx="28" cy="45" r="3" fill="#cbd5e1" />
              <circle cx="58" cy="45" r="7" fill="#1e293b" />
              <circle cx="58" cy="45" r="3" fill="#cbd5e1" />
              <circle cx="88" cy="45" r="7" fill="#1e293b" />
              <circle cx="88" cy="45" r="3" fill="#cbd5e1" />
            </svg>
          </div>
        </div>

        {/* Segundo móvil logístico en desfasaje (Furgoneta ágil de reparto) */}
        <div className="absolute top-4 erp-van-drive flex items-center">
          <svg width="70" height="38" viewBox="0 0 80 44" fill="none" className="drop-shadow-md">
            <rect x="4" y="8" width="45" height="26" rx="3" fill="#1f6f64" />
            <path d="M49,15 L62,15 L70,24 L70,34 L49,34 Z" fill="#1f6f64" />
            <path d="M51,17 L60,17 L66,24 L51,24 Z" fill="#e2e8f0" opacity="0.8" />
            <circle cx="22" cy="34" r="5" fill="#0f172a" />
            <circle cx="58" cy="34" r="5" fill="#0f172a" />
          </svg>
        </div>
      </div>
    </div>
  )
}
