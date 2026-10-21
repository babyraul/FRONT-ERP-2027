/**
 * Utilidad para Generación e Impresión de Tickets Térmicos de 80mm
 * Cumple con especificación:
 * 1. Ticket de Movimiento de Caja (Ingreso / Egreso con copia de firma)
 * 2. Ticket de Cierre de Caja / Arqueo (Totales Sistema vs Físico, Diferencias y Desglose)
 */

function abrirVentanaImpresion(contenidoHtml, titulo = 'Ticket 80mm') {
  const iframe = document.createElement('iframe')
  iframe.style.position = 'fixed'
  iframe.style.right = '0'
  iframe.style.bottom = '0'
  iframe.style.width = '0'
  iframe.style.height = '0'
  iframe.style.border = '0'
  document.body.appendChild(iframe)

  const doc = iframe.contentWindow.document
  doc.open()
  doc.write(`
    <!DOCTYPE html>
    <html lang="es">
    <head>
      <meta charset="UTF-8">
      <title>${titulo}</title>
      <style>
        @page {
          size: 80mm auto;
          margin: 0;
        }
        body {
          font-family: 'Courier New', Courier, monospace, monospace;
          font-size: 11px;
          line-height: 1.25;
          margin: 0;
          padding: 8px 6px;
          color: #000;
          background: #fff;
          width: 72mm;
          max-width: 72mm;
        }
        .text-center { text-align: center; }
        .text-right { text-align: right; }
        .text-left { text-align: left; }
        .font-bold { font-weight: bold; }
        .border-t { border-top: 1px dashed #000; margin-top: 5px; padding-top: 5px; }
        .border-b { border-bottom: 1px dashed #000; margin-bottom: 5px; padding-bottom: 5px; }
        .divider { border-bottom: 1px dashed #000; margin: 4px 0; }
        .table-full { width: 100%; border-collapse: collapse; }
        .table-full td { padding: 1.5px 0; }
        .signature-line { margin-top: 35px; border-top: 1px solid #000; text-align: center; font-size: 10px; padding-top: 3px; }
        .copia-tag { font-size: 9px; text-transform: uppercase; letter-spacing: 1px; }
      </style>
    </head>
    <body>
      ${contenidoHtml}
    </body>
    </html>
  `)
  doc.close()

  iframe.contentWindow.focus()
  setTimeout(() => {
    iframe.contentWindow.print()
    setTimeout(() => {
      document.body.removeChild(iframe)
    }, 1500)
  }, 300)
}

/**
 * 1. Imprime Ticket de Movimiento de Caja (Ingreso / Egreso)
 */
export function imprimirTicketMovimiento(movimiento, infoEmpresa = {}) {
  if (!movimiento) return

  const fechaHora = movimiento.created_at
    ? new Date(movimiento.created_at).toLocaleString()
    : new Date().toLocaleString()
  const tipo = String(movimiento.tipo_movimiento || 'MOVIMIENTO').toUpperCase()
  const monto = Number(movimiento.monto_total || movimiento.monto || 0).toFixed(2)
  const concepto = movimiento.concepto || 'Sin concepto'
  const obs = movimiento.observacion || 'Ninguna'
  const usuario = movimiento.usuario_nombre || 'Cajero'
  const caja = movimiento.identificador_caja || infoEmpresa.identificador_caja || 'CAJA'

  const html = `
    <div class="text-center">
      <div class="font-bold" style="font-size: 13px;">${infoEmpresa.razon_social || 'SISTEMA MARKET'}</div>
      <div>RUC: ${infoEmpresa.ruc || '20000000001'}</div>
      <div>${infoEmpresa.direccion || 'SEDE PRINCIPAL'}</div>
      <div class="divider"></div>
      <div class="font-bold" style="font-size: 12px;">MOVIMIENTO DE CAJA</div>
      <div class="copia-tag">[ ${tipo} ]</div>
    </div>

    <div class="divider"></div>
    <table class="table-full">
      <tr><td><strong>Caja:</strong></td><td class="text-right">${caja}</td></tr>
      <tr><td><strong>Fecha:</strong></td><td class="text-right">${fechaHora}</td></tr>
      <tr><td><strong>Usuario:</strong></td><td class="text-right">${usuario}</td></tr>
    </table>

    <div class="divider"></div>
    <table class="table-full">
      <tr>
        <td><strong>CONCEPTO:</strong></td>
      </tr>
      <tr>
        <td colspan="2" style="padding-left: 4px;">${concepto}</td>
      </tr>
      ${obs && obs !== 'Ninguna' ? `
      <tr>
        <td><strong>OBSERVACIÓN:</strong></td>
      </tr>
      <tr>
        <td colspan="2" style="padding-left: 4px; font-style: italic;">${obs}</td>
      </tr>` : ''}
    </table>

    <div class="divider"></div>
    <table class="table-full" style="font-size: 13px;">
      <tr>
        <td><strong>TOTAL ${tipo}:</strong></td>
        <td class="text-right font-bold">S/ ${monto}</td>
      </tr>
    </table>

    <div class="signature-line">
      Firma Responsable / Cajero
    </div>
    <div class="text-center" style="font-size: 9px; margin-top: 8px; color: #555;">
      Ticket de control interno de gaveta
    </div>
  `

  abrirVentanaImpresion(html, `Ticket_Movimiento_${tipo}_${Date.now()}`)
}

/**
 * 2. Imprime Ticket de Cierre de Caja / Arqueo (80mm)
 */
export function imprimirTicketCierre(turno, infoEmpresa = {}) {
  if (!turno) return

  const fechaApertura = turno.fecha_apertura
    ? new Date(turno.fecha_apertura).toLocaleString()
    : '-'
  const fechaCierre = turno.fecha_cierre_f
    ? new Date(turno.fecha_cierre_f).toLocaleString()
    : new Date().toLocaleString()
  const usuario = turno.usuario_nombre || 'Cajero'
  const caja = turno.identificador_caja || 'CAJA'

  const totales = Array.isArray(turno.totales) ? turno.totales : []
  const montoAperturaGeneral = Number(turno.monto_apertura || 0)

  // Calcular sumatorias
  let totalSistema = 0
  let totalDeclarado = 0
  let totalDiferencia = 0

  const filasHtml = totales.map((t) => {
    const sistema = Number(t.monto_sistema || 0)
    const declarado = Number(t.monto_declarado || 0)
    const dif = Number(t.diferencia !== undefined ? t.diferencia : (declarado - sistema))

    totalSistema += sistema
    totalDeclarado += declarado
    totalDiferencia += dif

    const nombreMetodo = (t.metodo_pago_nombre || `Método ${t.metodo_pago_id}`).toUpperCase()

    return `
      <tr>
        <td colspan="3" style="font-weight: bold; padding-top: 4px;">${nombreMetodo}</td>
      </tr>
      <tr style="font-size: 10px;">
        <td style="padding-left: 6px;">Sist: S/ ${sistema.toFixed(2)}</td>
        <td class="text-right">Decl: S/ ${declarado.toFixed(2)}</td>
        <td class="text-right font-bold" style="color: ${dif < 0 ? '#b00' : '#000'}">Dif: ${dif >= 0 ? '+' : ''}${dif.toFixed(2)}</td>
      </tr>
    `
  }).join('')

  const html = `
    <div class="text-center">
      <div class="font-bold" style="font-size: 13px;">${infoEmpresa.razon_social || 'SISTEMA MARKET'}</div>
      <div>RUC: ${infoEmpresa.ruc || '20000000001'}</div>
      <div>${infoEmpresa.direccion || 'SEDE PRINCIPAL'}</div>
      <div class="divider"></div>
      <div class="font-bold" style="font-size: 12px;">CIERRE DE TURNO Y ARQUEO</div>
      <div class="copia-tag">CAJA: ${caja}</div>
    </div>

    <div class="divider"></div>
    <table class="table-full" style="font-size: 10px;">
      <tr><td><strong>Cajero:</strong></td><td class="text-right">${usuario}</td></tr>
      <tr><td><strong>Apertura:</strong></td><td class="text-right">${fechaApertura}</td></tr>
      <tr><td><strong>Fondo Inicial Efectivo:</strong></td><td class="text-right font-bold">S/ ${montoAperturaGeneral.toFixed(2)}</td></tr>
      <tr><td><strong>Cierre:</strong></td><td class="text-right">${fechaCierre}</td></tr>
    </table>

    <div class="divider"></div>
    <div class="font-bold text-center" style="font-size: 11px;">BALANCE POR MEDIO DE PAGO</div>
    <table class="table-full" style="margin-top: 4px;">
      ${filasHtml || '<tr><td colspan="3" class="text-center">Sin totales registrados</td></tr>'}
    </table>

    <div class="divider" style="margin-top: 6px;"></div>
    <table class="table-full font-bold" style="font-size: 11px;">
      <tr>
        <td>TOTAL SISTEMA:</td>
        <td class="text-right">S/ ${totalSistema.toFixed(2)}</td>
      </tr>
      <tr>
        <td>TOTAL FÍSICO DECL.:</td>
        <td class="text-right">S/ ${totalDeclarado.toFixed(2)}</td>
      </tr>
      <tr style="font-size: 12px; border-top: 1px dashed #000;">
        <td>DIFERENCIA TOTAL:</td>
        <td class="text-right font-bold">${totalDiferencia >= 0 ? '+' : ''}S/ ${totalDiferencia.toFixed(2)}</td>
      </tr>
    </table>

    ${turno.observacion ? `
    <div class="divider"></div>
    <div style="font-size: 10px;">
      <strong>Obs:</strong> ${turno.observacion}
    </div>` : ''}

    <div class="signature-line" style="margin-top: 40px;">
      Firma Cajero
    </div>
    <div class="signature-line" style="margin-top: 30px;">
      Firma Supervisor / Administrador
    </div>
    <div class="text-center" style="font-size: 9px; margin-top: 10px; color: #555;">
      Documento no fiscal · Control de caja
    </div>
  `

  abrirVentanaImpresion(html, `Ticket_Cierre_${caja}_${Date.now()}`)
}
