import type { DesgloseIva, FacturaLinea, PagoFactura } from '../types';

/**
 * Redondeo bancario a 2 decimales evitando errores de punto flotante de JavaScript
 */
export function round2(num: number): number {
  return Math.round((num + Number.EPSILON) * 100) / 100;
}

/**
 * Formatea un número como divisa en euros (ej: "1.250,50 €")
 */
export function formatCurrency(amount: number, currency: string = 'EUR'): string {
  return new Intl.NumberFormat('es-ES', {
    style: 'currency',
    currency,
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(amount);
}

/**
 * Formatea una fecha ISO (YYYY-MM-DD) al formato español estándar DD/MM/YYYY
 */
export function formatDate(dateString?: string): string {
  if (!dateString) return '-';
  try {
    const [year, month, day] = dateString.split('-');
    if (!year || !month || !day) return dateString;
    return `${day}/${month}/${year}`;
  } catch {
    return dateString;
  }
}

/**
 * Calcula una línea individual de factura
 */
export function calculateLine(
  cantidad: number,
  precioUnitario: number,
  descuentoPorcentaje: number,
  tipoIva: number
): {
  baseImponible: number;
  cuotaIva: number;
  totalLinea: number;
} {
  const qty = isNaN(cantidad) || cantidad < 0 ? 0 : cantidad;
  const price = isNaN(precioUnitario) || precioUnitario < 0 ? 0 : precioUnitario;
  const discount = Math.max(0, Math.min(100, isNaN(descuentoPorcentaje) ? 0 : descuentoPorcentaje));
  const taxRate = isNaN(tipoIva) || tipoIva < 0 ? 0 : tipoIva;

  const bruto = round2(qty * price);
  const descuento = round2(bruto * (discount / 100));
  const baseImponible = round2(bruto - descuento);
  const cuotaIva = round2(baseImponible * (taxRate / 100));
  const totalLinea = round2(baseImponible + cuotaIva);

  return {
    baseImponible,
    cuotaIva,
    totalLinea,
  };
}

export interface TotalesFacturaCalculados {
  subtotalBruto: number;
  descuentoTotal: number;
  baseImponibleTotal: number;
  desgloseIva: DesgloseIva[];
  cuotaIvaTotal: number;
  retencionIrpfPorcentaje: number;
  importeRetencionIrpf: number;
  totalFinal: number;
  importeCobrado: number;
  importePendiente: number;
}

/**
 * Calcula todos los totales fiscales y de cobro de una factura a partir de sus líneas y retención
 */
export function calculateInvoiceTotals(
  lineas: FacturaLinea[],
  retencionIrpfPorcentaje: number = 0,
  pagos: PagoFactura[] = []
): TotalesFacturaCalculados {
  let subtotalBruto = 0;
  let descuentoTotal = 0;
  let baseImponibleTotal = 0;

  // Mapa para acumular bases imponibles agrupadas por tipo de IVA
  const mapaIva: Record<number, number> = {};

  for (const linea of lineas) {
    const qty = Math.max(0, linea.cantidad || 0);
    const price = Math.max(0, linea.precioUnitario || 0);
    const discPct = Math.max(0, Math.min(100, linea.descuentoPorcentaje || 0));
    
    const brutoLinea = round2(qty * price);
    const descLinea = round2(brutoLinea * (discPct / 100));
    const baseLinea = round2(brutoLinea - descLinea);

    subtotalBruto = round2(subtotalBruto + brutoLinea);
    descuentoTotal = round2(descuentoTotal + descLinea);
    baseImponibleTotal = round2(baseImponibleTotal + baseLinea);

    const tipo = linea.tipoIva ?? 21;
    mapaIva[tipo] = round2((mapaIva[tipo] || 0) + baseLinea);
  }

  // Generar el desglose agrupado por cada tipo de IVA presente
  const desgloseIva: DesgloseIva[] = Object.entries(mapaIva)
    .map(([tipoStr, base]) => {
      const tipo = Number(tipoStr);
      const cuota = round2(base * (tipo / 100));
      return { tipo, base, cuota };
    })
    .sort((a, b) => b.tipo - a.tipo); // 21%, 10%, 4%, 0%

  const cuotaIvaTotal = round2(
    desgloseIva.reduce((sum, item) => sum + item.cuota, 0)
  );

  const irpfPct = Math.max(0, Math.min(100, retencionIrpfPorcentaje || 0));
  const importeRetencionIrpf = round2(baseImponibleTotal * (irpfPct / 100));

  // En la normativa contable y fiscal española: Total = Base Imponible + IVA - Retención IRPF
  const totalFinal = round2(baseImponibleTotal + cuotaIvaTotal - importeRetencionIrpf);

  // Calcular cobros
  const importeCobrado = round2(
    pagos.reduce((acc, p) => acc + (p.importe || 0), 0)
  );
  const importePendiente = Math.max(0, round2(totalFinal - importeCobrado));

  return {
    subtotalBruto,
    descuentoTotal,
    baseImponibleTotal,
    desgloseIva,
    cuotaIvaTotal,
    retencionIrpfPorcentaje: irpfPct,
    importeRetencionIrpf,
    totalFinal,
    importeCobrado,
    importePendiente,
  };
}
