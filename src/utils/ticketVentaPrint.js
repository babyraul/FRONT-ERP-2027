/**
 * Utilitario de impresión térmica para Tickets de Venta (80mm)
 * Compatible con impresoras térmicas POS y diálogo estándar de impresión del navegador.
 */
export function printTicketVenta(dataVenta) {
  if (!dataVenta) return

  const ventana = window.open('', '_blank', 'width=380,height=600')
  if (!ventana) {
    alert('Permita ventanas emergentes (popups) para imprimir el ticket.')
    return
  }

  const fechaStr = dataVenta.fecha_emision ? new Date(dataVenta.fecha_emision).toLocaleString('es-PE') : ''
  const items = dataVenta.items || dataVenta.detalles || []
  const pagos = dataVenta.pagos || []

  ventana.document.write(`
    <!DOCTYPE html>
    <html lang="es">
    <head>
      <meta charset="utf-8" />
      <title>Ticket - ${dataVenta.numero || dataVenta.serie || 'Venta'}</title>
      <style>
        * {
          box-sizing: border-box;
          margin: 0;
          padding: 0;
        }
        body {
          font-family: 'Courier New', Courier, monospace;
          font-size: 11px;
          line-height: 1.25;
          color: #000;
          background: #fff;
          padding: 8px;
          max-width: 300px;
          margin: 0 auto;
        }
        .text-center { text-align: center; }
        .text-right { text-align: right; }
        .text-left { text-align: left; }
        .bold { font-weight: bold; }
        .divider {
          border-top: 1px dashed #000;
          margin: 6px 0;
        }
        .double-divider {
          border-top: 1px double #000;
          margin: 6px 0;
        }
        table {
          width: 100%;
          border-collapse: collapse;
          font-size: 10px;
        }
        th, td {
          padding: 2px 0;
          vertical-align: top;
        }
        .items-table th {
          border-bottom: 1px dashed #000;
          padding-bottom: 3px;
        }
        .items-table td {
          padding: 2px 0;
        }
        .totals-table td {
          padding: 1px 0;
        }
        @media print {
          body {
            padding: 0;
            max-width: 100%;
          }
          @page {
            margin: 0;
          }
        }
      </style>
    </head>
    <body>
      <div class="text-center bold" style="font-size: 13px; letter-spacing: 0.5px;">
        MIFACTURAPERU
      </div>
      <div class="text-center" style="font-size: 10px; margin-top: 2px;">
        ${dataVenta.sucursal_nombre || 'Sucursal Principal'}
      </div>

      <div class="divider"></div>

      <div class="text-center bold" style="font-size: 11px;">
        ${String(dataVenta.tipo_documento || 'COMPROBANTE').toUpperCase()} ELECTRÓNICA
      </div>
      <div class="text-center bold" style="font-size: 12px; margin-top: 2px;">
        ${dataVenta.numero || `${dataVenta.serie || 'S/N'}-${String(dataVenta.correlativo || '').padStart(8, '0')}`}
      </div>

      <div class="divider"></div>

      <div><b>Fecha:</b> ${fechaStr}</div>
      <div><b>Cliente:</b> ${dataVenta.cliente_nombre || 'VARIOS'}</div>
      <div><b>N° Doc:</b> ${dataVenta.cliente_numero_documento || '99999999'}</div>
      ${dataVenta.placa ? `<div><b>Placa:</b> ${dataVenta.placa}</div>` : ''}
      <div><b>Forma Pago:</b> ${dataVenta.modalidad_pago || (dataVenta.tipo_pago_id === '2' ? 'Crédito' : 'Contado')}</div>

      <div class="divider"></div>

      <table class="items-table">
        <thead>
          <tr>
            <th class="text-left" style="width: 50%;">CANT / DESCRIPCIÓN</th>
            <th class="text-right" style="width: 25%;">P.U</th>
            <th class="text-right" style="width: 25%;">TOTAL</th>
          </tr>
        </thead>
        <tbody>
          ${items.map((it) => `
            <tr>
              <td colspan="3" class="bold" style="padding-top: 3px;">
                ${it.producto_nombre || it.descripcion || it.nombre || 'Item'}
              </td>
            </tr>
            <tr>
              <td class="text-left" style="padding-left: 6px;">
                ${Number(it.cantidad || 1).toFixed(2)}
              </td>
              <td class="text-right">
                S/ ${Number(it.precio_unitario || 0).toFixed(2)}
              </td>
              <td class="text-right bold">
                S/ ${Number(it.total || (it.cantidad * it.precio_unitario) || 0).toFixed(2)}
              </td>
            </tr>
          `).join('')}
        </tbody>
      </table>

      <div class="divider"></div>

      <table class="totals-table">
        <tr>
          <td>OP. GRAVADAS:</td>
          <td class="text-right font-mono">S/ ${Number(dataVenta.gravadas || 0).toFixed(2)}</td>
        </tr>
        ${Number(dataVenta.exoneradas || 0) > 0 ? `
          <tr>
            <td>OP. EXONERADAS:</td>
            <td class="text-right font-mono">S/ ${Number(dataVenta.exoneradas).toFixed(2)}</td>
          </tr>
        ` : ''}
        ${Number(dataVenta.inafectas || 0) > 0 ? `
          <tr>
            <td>OP. INAFECTAS:</td>
            <td class="text-right font-mono">S/ ${Number(dataVenta.inafectas).toFixed(2)}</td>
          </tr>
        ` : ''}
        <tr>
          <td>I.G.V. (18%):</td>
          <td class="text-right font-mono">S/ ${Number(dataVenta.igv || 0).toFixed(2)}</td>
        </tr>
        ${Number(dataVenta.descuento || 0) > 0 ? `
          <tr>
            <td>DESCUENTO:</td>
            <td class="text-right font-mono">-S/ ${Number(dataVenta.descuento).toFixed(2)}</td>
          </tr>
        ` : ''}
        <tr class="bold" style="font-size: 12px;">
          <td style="padding-top: 4px;">TOTAL A PAGAR:</td>
          <td class="text-right font-mono" style="padding-top: 4px;">
            S/ ${Number(dataVenta.total || dataVenta.total_venta || 0).toFixed(2)}
          </td>
        </tr>
      </table>

      ${pagos.length > 0 ? `
        <div class="divider"></div>
        <div class="bold" style="font-size: 10px; margin-bottom: 2px;">DESGLOSE DE PAGO:</div>
        <table class="totals-table">
          ${pagos.map(p => `
            <tr>
              <td>${p.metodo_nombre || 'Pago'}:</td>
              <td class="text-right font-mono">S/ ${Number(p.monto || 0).toFixed(2)}</td>
            </tr>
          `).join('')}
        </table>
      ` : ''}

      <div class="double-divider"></div>

      <div class="text-center" style="font-size: 9px; margin-top: 6px;">
        Representación impresa de Comprobante de Pago Electrónico.<br />
        ¡Gracias por su compra!
      </div>
    </body>
    </html>
  `)

  ventana.document.close()
  ventana.focus()
  setTimeout(() => {
    ventana.print()
  }, 350)
}
