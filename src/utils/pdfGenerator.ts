import jsPDF from 'jspdf';
import type { Factura } from '../types';
import { formatCurrency, formatDate } from './taxCalculator';

export async function generarFacturaPDF(factura: Factura): Promise<jsPDF> {
  const doc = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: 'a4',
  });

  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();
  const margin = 18;
  const contentWidth = pageWidth - margin * 2;
  let y = margin;

  // Paleta de colores sobria y profesional
  const colors = {
    primary: [3, 84, 162] as [number, number, number], // Azul corporativo FACENIA
    dark: [15, 23, 42] as [number, number, number], // Slate 900
    textMuted: [100, 116, 139] as [number, number, number], // Slate 500
    border: [226, 232, 240] as [number, number, number], // Slate 200
    lightBg: [248, 250, 252] as [number, number, number], // Slate 50
    tableHeader: [241, 245, 249] as [number, number, number], // Slate 100
    white: [255, 255, 255] as [number, number, number],
    watermark: [220, 225, 235] as [number, number, number],
  };

  const isDemo = factura.emisorSnapshot?.esDemo;
  const isDraft = factura.estado === 'borrador';

  // Helper para verificar salto de página
  function ensureSpace(neededHeight: number) {
    if (y + neededHeight > pageHeight - 25) {
      doc.addPage();
      y = margin;
      drawWatermark();
      drawPageNumber();
    }
  }

  // Marca de agua si es Borrador o Demo
  function drawWatermark() {
    if (isDraft || isDemo) {
      doc.saveGraphicsState();
      doc.setTextColor(...colors.watermark);
      doc.setFontSize(44);
      doc.setFont('helvetica', 'bold');
      
      const watermarkText = isDraft ? 'BORRADOR' : 'DATOS DEMO';
      // Posición centrada y rotada
      doc.text(watermarkText, pageWidth / 2, pageHeight / 2, {
        align: 'center',
        angle: 45,
      });
      doc.restoreGraphicsState();
    }
  }

  // Pie de página con numeración
  function drawPageNumber() {
    const pageCount = (doc.internal as any).getNumberOfPages();
    for (let i = 1; i <= pageCount; i++) {
      doc.setPage(i);
      doc.setFontSize(8);
      doc.setFont('helvetica', 'normal');
      doc.setTextColor(...colors.textMuted);
      doc.setDrawColor(...colors.border);
      doc.setLineWidth(0.2);
      doc.line(margin, pageHeight - 12, pageWidth - margin, pageHeight - 12);

      const footerText = isDemo
        ? 'DOCUMENTO DE PRUEBA / DEMOSTRACIÓN — FACENIA FACTURACIÓN'
        : `${factura.emisorSnapshot.razonSocial} · NIF: ${factura.emisorSnapshot.nifCif}`;
      doc.text(footerText, margin, pageHeight - 8);

      const pageStr = `Página ${i} de ${pageCount}`;
      doc.text(pageStr, pageWidth - margin, pageHeight - 8, { align: 'right' });
    }
  }

  // 1. DIBUJAR MARCA DE AGUA INICIAL
  drawWatermark();

  // 2. CABECERA: EMISOR Y DATOS DE FACTURA
  // Lado izquierdo: Logotipo / Nombre Comercial
  if (factura.emisorSnapshot.logotipoUrl && factura.emisorSnapshot.logotipoUrl.startsWith('data:image')) {
    try {
      doc.addImage(factura.emisorSnapshot.logotipoUrl, 'JPEG', margin, y, 35, 16);
      y += 18;
    } catch {
      // Si la imagen falla, dibujar texto
      doc.setFillColor(...colors.primary);
      doc.roundedRect(margin, y, 10, 10, 2, 2, 'F');
      doc.setTextColor(...colors.white);
      doc.setFontSize(14);
      doc.setFont('helvetica', 'bold');
      doc.text('F', margin + 3.2, y + 7.5);

      doc.setTextColor(...colors.dark);
      doc.setFontSize(16);
      doc.setFont('helvetica', 'bold');
      doc.text(factura.emisorSnapshot.nombreComercial || 'FACENIA', margin + 14, y + 7.5);
      y += 14;
    }
  } else {
    doc.setFillColor(...colors.primary);
    doc.roundedRect(margin, y, 10, 10, 2, 2, 'F');
    doc.setTextColor(...colors.white);
    doc.setFontSize(14);
    doc.setFont('helvetica', 'bold');
    doc.text('F', margin + 3.2, y + 7.5);

    doc.setTextColor(...colors.dark);
    doc.setFontSize(16);
    doc.setFont('helvetica', 'bold');
    doc.text(factura.emisorSnapshot.nombreComercial || 'FACENIA', margin + 14, y + 7.5);
    y += 14;
  }

  // Datos fiscales del Emisor (debajo del logo)
  doc.setFontSize(8.5);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(...colors.textMuted);
  
  const emisorLines = [
    factura.emisorSnapshot.razonSocial,
    `NIF/CIF: ${factura.emisorSnapshot.nifCif}`,
    factura.emisorSnapshot.direccion,
    `${factura.emisorSnapshot.codigoPostal} ${factura.emisorSnapshot.ciudad} (${factura.emisorSnapshot.provincia}), ${factura.emisorSnapshot.pais}`,
    factura.emisorSnapshot.email ? `Email: ${factura.emisorSnapshot.email}` : '',
    factura.emisorSnapshot.telefono ? `Tel: ${factura.emisorSnapshot.telefono}` : '',
  ].filter(Boolean);

  let emisorY = y;
  for (const line of emisorLines) {
    doc.text(line, margin, emisorY);
    emisorY += 4.2;
  }

  // Lado derecho: Cuadro de Título y Metadatos de la Factura
  const boxX = pageWidth - margin - 75;
  const boxWidth = 75;
  const boxStartY = margin;

  doc.setFillColor(...colors.lightBg);
  doc.setDrawColor(...colors.border);
  doc.roundedRect(boxX, boxStartY, boxWidth, 38, 2, 2, 'FD');

  const tituloFactura = factura.esRectificativa
    ? 'FACTURA RECTIFICATIVA'
    : isDraft
    ? 'BORRADOR DE FACTURA'
    : 'FACTURA';

  doc.setFontSize(11);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(...colors.primary);
  doc.text(tituloFactura, boxX + 5, boxStartY + 7);

  doc.setFontSize(9);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(...colors.dark);
  doc.text(`Nº: ${factura.numero}`, boxX + 5, boxStartY + 14);

  doc.setFontSize(8);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(...colors.textMuted);
  doc.text(`Fecha emisión: ${formatDate(factura.fechaEmision)}`, boxX + 5, boxStartY + 20);
  
  if (factura.fechaOperacion && factura.fechaOperacion !== factura.fechaEmision) {
    doc.text(`Fecha operación: ${formatDate(factura.fechaOperacion)}`, boxX + 5, boxStartY + 25);
  } else {
    doc.text(`Serie: ${factura.serie}`, boxX + 5, boxStartY + 25);
  }

  doc.text(`Vencimiento: ${formatDate(factura.fechaVencimiento)}`, boxX + 5, boxStartY + 30);
  doc.text(`Forma de pago: ${factura.formaPago}`, boxX + 5, boxStartY + 35);

  y = Math.max(emisorY + 4, boxStartY + 42);

  // 3. CUADRO DE DATOS FISCALES DEL CLIENTE (RECEPTOR)
  ensureSpace(32);
  doc.setFillColor(...colors.lightBg);
  doc.setDrawColor(...colors.border);
  doc.setLineWidth(0.2);
  doc.roundedRect(margin, y, contentWidth, 24, 2, 2, 'FD');

  doc.setFontSize(7.5);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(...colors.primary);
  doc.text('DATOS DEL DESTINATARIO / CLIENTE', margin + 4, y + 5);

  doc.setFontSize(9);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(...colors.dark);
  doc.text(factura.clienteSnapshot.nombreOrazonSocial || 'Cliente no asignado', margin + 4, y + 10.5);

  doc.setFontSize(8);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(...colors.textMuted);
  doc.text(`NIF / CIF: ${factura.clienteSnapshot.nifCif || '-'}`, margin + 4, y + 15);
  
  const direccionCliente = `${factura.clienteSnapshot.direccionFiscal || ''}, ${factura.clienteSnapshot.codigoPostal || ''} ${factura.clienteSnapshot.ciudad || ''} (${factura.clienteSnapshot.provincia || ''})`;
  doc.text(`Dirección fiscal: ${direccionCliente}`, margin + 4, y + 19.5);

  if (factura.clienteSnapshot.email) {
    doc.text(`Email: ${factura.clienteSnapshot.email}`, margin + 95, y + 15);
  }
  if (factura.clienteSnapshot.telefono) {
    doc.text(`Tel: ${factura.clienteSnapshot.telefono}`, margin + 95, y + 19.5);
  }

  y += 28;

  // Si es rectificativa, mostrar aviso
  if (factura.esRectificativa && factura.facturaRectificadaNumero) {
    ensureSpace(12);
    doc.setFillColor(254, 242, 242);
    doc.setDrawColor(254, 202, 202);
    doc.roundedRect(margin, y, contentWidth, 10, 1.5, 1.5, 'FD');
    doc.setTextColor(153, 27, 27);
    doc.setFontSize(7.5);
    doc.setFont('helvetica', 'bold');
    doc.text(
      `RECTIFICA LA FACTURA: ${factura.facturaRectificadaNumero} · MOTIVO: ${factura.motivoRectificacion || 'Ajuste de operaciones'}`,
      margin + 4,
      y + 6.5
    );
    y += 13;
  }

  // 4. TABLA DE LÍNEAS DE FACTURA
  ensureSpace(20);
  
  // Anchos de columnas
  const colDesc = 82;
  const colCant = 18;
  const colPrecio = 24;
  const colDto = 16;
  const colIva = 16;

  // Cabecera de la tabla
  doc.setFillColor(...colors.tableHeader);
  doc.rect(margin, y, contentWidth, 7, 'F');
  doc.setDrawColor(...colors.border);
  doc.line(margin, y + 7, margin + contentWidth, y + 7);

  doc.setFontSize(7.5);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(...colors.dark);

  let currentX = margin + 3;
  doc.text('CONCEPTO / DESCRIPCIÓN', currentX, y + 4.8);
  currentX += colDesc;
  doc.text('CANT.', currentX, y + 4.8, { align: 'right' });
  currentX += colCant;
  doc.text('PRECIO UD.', currentX, y + 4.8, { align: 'right' });
  currentX += colPrecio;
  doc.text('DTO %', currentX, y + 4.8, { align: 'right' });
  currentX += colDto;
  doc.text('IVA', currentX, y + 4.8, { align: 'right' });
  currentX += colIva;
  doc.text('TOTAL', margin + contentWidth - 3, y + 4.8, { align: 'right' });

  y += 7;

  // Filas de las líneas
  doc.setFontSize(8);
  doc.setFont('helvetica', 'normal');

  for (let idx = 0; idx < factura.lineas.length; idx++) {
    const linea = factura.lineas[idx]!;
    
    // Calcular altura por salto de texto en descripción
    const splitDesc = doc.splitTextToSize(linea.descripcion, colDesc - 6) as string[];
    const rowHeight = Math.max(7, splitDesc.length * 4 + 3);

    ensureSpace(rowHeight + 2);

    // Fondo alternado muy sutil
    if (idx % 2 === 1) {
      doc.setFillColor(252, 253, 254);
      doc.rect(margin, y, contentWidth, rowHeight, 'F');
    }

    doc.setTextColor(...colors.dark);
    doc.text(splitDesc, margin + 3, y + 4.5);

    doc.setTextColor(...colors.dark);
    currentX = margin + 3 + colDesc;
    doc.text(linea.cantidad.toString(), currentX, y + 4.5, { align: 'right' });
    currentX += colCant;
    doc.text(formatCurrency(linea.precioUnitario), currentX, y + 4.5, { align: 'right' });
    currentX += colDto;
    doc.text(linea.descuentoPorcentaje ? `${linea.descuentoPorcentaje}%` : '-', currentX, y + 4.5, { align: 'right' });
    currentX += colIva;
    doc.text(`${linea.tipoIva}%`, currentX, y + 4.5, { align: 'right' });
    
    doc.setFont('helvetica', 'bold');
    doc.text(formatCurrency(linea.totalLinea), margin + contentWidth - 3, y + 4.5, { align: 'right' });
    doc.setFont('helvetica', 'normal');

    // Línea divisoria
    doc.setDrawColor(...colors.border);
    doc.setLineWidth(0.1);
    doc.line(margin, y + rowHeight, margin + contentWidth, y + rowHeight);

    y += rowHeight;
  }

  y += 4;

  // 5. SECCIÓN INFERIOR: FORMA DE PAGO, DATOS BANCARIOS Y TOTALES
  ensureSpace(45);

  const bottomStartY = y;
  const leftColWidth = 95;
  const totalsBoxX = margin + leftColWidth + 5;
  const totalsBoxWidth = contentWidth - leftColWidth - 5;

  // Lado Izquierdo: Datos de Pago y Observaciones
  doc.setFillColor(...colors.lightBg);
  doc.roundedRect(margin, bottomStartY, leftColWidth, 38, 1.5, 1.5, 'F');

  doc.setFontSize(7.5);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(...colors.primary);
  doc.text('FORMA DE PAGO Y DETALLES BANCARIOS', margin + 4, bottomStartY + 5);

  doc.setFontSize(8);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(...colors.dark);
  doc.text(`Modalidad: ${factura.formaPago}`, margin + 4, bottomStartY + 10);

  if (factura.datosBancarios?.iban) {
    doc.text(`IBAN: ${factura.datosBancarios.iban}`, margin + 4, bottomStartY + 15);
  }
  if (factura.datosBancarios?.bic) {
    doc.text(`BIC / SWIFT: ${factura.datosBancarios.bic}`, margin + 4, bottomStartY + 19.5);
  }
  if (factura.datosBancarios?.banco) {
    doc.text(`Entidad: ${factura.datosBancarios.banco}`, margin + 4, bottomStartY + 24);
  }

  if (factura.observaciones) {
    doc.setFontSize(7.5);
    doc.setFont('helvetica', 'italic');
    doc.setTextColor(...colors.textMuted);
    const splitObs = doc.splitTextToSize(`Nota: ${factura.observaciones}`, leftColWidth - 8);
    doc.text(splitObs, margin + 4, bottomStartY + 29);
  }

  // Lado Derecho: Cuadro Resumen de Totales y Desglose de Impuestos
  let totalsY = bottomStartY;

  // Línea: Subtotal Bruto / Base Imponible
  doc.setFontSize(8);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(...colors.textMuted);
  doc.text('Base Imponible Total:', totalsBoxX + 3, totalsY + 4);
  doc.setTextColor(...colors.dark);
  doc.text(formatCurrency(factura.baseImponibleTotal), totalsBoxX + totalsBoxWidth - 3, totalsY + 4, { align: 'right' });
  totalsY += 5.5;

  // Desglose por tipos de IVA
  for (const item of factura.desgloseIva) {
    doc.setTextColor(...colors.textMuted);
    doc.text(`IVA (${item.tipo}% sobre ${formatCurrency(item.base)}):`, totalsBoxX + 3, totalsY + 4);
    doc.setTextColor(...colors.dark);
    doc.text(formatCurrency(item.cuota), totalsBoxX + totalsBoxWidth - 3, totalsY + 4, { align: 'right' });
    totalsY += 5;
  }

  // Retención IRPF si procede
  if (factura.retencionIrpfPorcentaje > 0) {
    doc.setTextColor(185, 28, 28);
    doc.text(`Retención IRPF (${factura.retencionIrpfPorcentaje}%):`, totalsBoxX + 3, totalsY + 4);
    doc.text(`-${formatCurrency(factura.importeRetencionIrpf)}`, totalsBoxX + totalsBoxWidth - 3, totalsY + 4, { align: 'right' });
    totalsY += 5.5;
  }

  // Línea divisoria previa al total
  doc.setDrawColor(...colors.border);
  doc.line(totalsBoxX, totalsY + 2, totalsBoxX + totalsBoxWidth, totalsY + 2);
  totalsY += 5;

  // Caja Total Final destacada
  doc.setFillColor(...colors.primary);
  doc.roundedRect(totalsBoxX, totalsY, totalsBoxWidth, 9, 1.5, 1.5, 'F');
  doc.setTextColor(...colors.white);
  doc.setFontSize(9.5);
  doc.setFont('helvetica', 'bold');
  doc.text('TOTAL A PAGAR', totalsBoxX + 4, totalsY + 6);
  doc.text(formatCurrency(factura.totalFinal), totalsBoxX + totalsBoxWidth - 4, totalsY + 6, { align: 'right' });

  // Pie de factura o texto de régimen mercantil
  const pieTexto = factura.emisorSnapshot.esDemo
    ? 'AVISO: Documento emitido con datos de demostración para evaluación técnica. No constituye factura tributaria definitiva.'
    : (factura.observaciones || 'Factura emitida conforme al Real Decreto 1619/2012 de facturación.');

  ensureSpace(12);
  doc.setFontSize(7);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(...colors.textMuted);
  const pieLines = doc.splitTextToSize(pieTexto, contentWidth);
  doc.text(pieLines, margin, pageHeight - 16);

  // 6. NUMERACIÓN DE PÁGINAS FINAL
  drawPageNumber();

  return doc;
}
