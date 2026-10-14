export type TipoIva = 21 | 10 | 4 | 0;

export type TipoRetencionIrpf = 0 | 7 | 15 | 19;

export type EstadoFactura =
  | 'borrador'
  | 'emitida'
  | 'pendiente_cobro'
  | 'parcialmente_cobrada'
  | 'cobrada'
  | 'vencida'
  | 'rectificada'
  | 'anulada';

export interface DatosBancarios {
  iban: string;
  bic?: string;
  banco?: string;
  titular?: string;
}

export interface EmpresaConfig {
  id: string;
  nombreComercial: string;
  razonSocial: string;
  nifCif: string;
  direccion: string;
  codigoPostal: string;
  ciudad: string;
  provincia: string;
  pais: string;
  email: string;
  telefono: string;
  logotipoUrl?: string;
  datosBancarios: DatosBancarios;
  formaPagoPredeterminada: string;
  pieFacturaPredeterminado: string;
  registroMercantil?: string;
  esDemo: boolean;
  updatedAt: string;
}

export interface Cliente {
  id: string;
  nombreOrazonSocial: string;
  nifCif: string;
  direccionFiscal: string;
  codigoPostal: string;
  ciudad: string;
  provincia: string;
  pais: string;
  email: string;
  telefono: string;
  notasInternas?: string;
  createdAt: string;
  updatedAt: string;
}

export interface FacturaLinea {
  id: string;
  descripcion: string;
  cantidad: number;
  precioUnitario: number;
  descuentoPorcentaje: number; // 0 - 100
  tipoIva: number; // 21, 10, 4, 0
  baseImponible: number; // (cantidad * precioUnitario) * (1 - descuento/100)
  cuotaIva: number; // baseImponible * (tipoIva / 100)
  totalLinea: number; // baseImponible + cuotaIva
}

export interface DesgloseIva {
  tipo: number;
  base: number;
  cuota: number;
}

export interface PagoFactura {
  id: string;
  fecha: string;
  importe: number;
  metodo: string;
  referencia?: string;
  notas?: string;
  createdAt: string;
}

export interface Factura {
  id: string;
  numero: string;
  serie: string;
  numeroSecuencial: number;
  fechaEmision: string; // YYYY-MM-DD
  fechaOperacion?: string; // YYYY-MM-DD
  fechaVencimiento: string; // YYYY-MM-DD
  clienteId: string;
  clienteSnapshot: {
    nombreOrazonSocial: string;
    nifCif: string;
    direccionFiscal: string;
    codigoPostal: string;
    ciudad: string;
    provincia: string;
    pais: string;
    email: string;
    telefono: string;
  };
  emisorSnapshot: {
    nombreComercial: string;
    razonSocial: string;
    nifCif: string;
    direccion: string;
    codigoPostal: string;
    ciudad: string;
    provincia: string;
    pais: string;
    email: string;
    telefono: string;
    registroMercantil?: string;
    logotipoUrl?: string;
    esDemo: boolean;
  };
  lineas: FacturaLinea[];
  moneda: string; // 'EUR'
  formaPago: string;
  datosBancarios?: DatosBancarios;
  observaciones?: string;
  estado: EstadoFactura;
  
  // Factura Rectificativa
  esRectificativa: boolean;
  facturaRectificadaNumero?: string;
  facturaRectificadaId?: string;
  motivoRectificacion?: string;

  // Cálculos fiscales
  subtotalBruto: number;
  descuentoTotal: number;
  baseImponibleTotal: number;
  desgloseIva: DesgloseIva[];
  cuotaIvaTotal: number;
  retencionIrpfPorcentaje: number;
  importeRetencionIrpf: number;
  totalFinal: number;

  // Cobros
  importeCobrado: number;
  importePendiente: number;
  pagos: PagoFactura[];

  createdAt: string;
  updatedAt: string;
}

export interface Usuario {
  id: string;
  email: string;
  nombre: string;
  rol: 'administrador' | 'gestor';
  ultimoAcceso?: string;
}

export interface ResumenEstadisticas {
  totalFacturas: number;
  importeTotalFacturado: number;
  facturasPendientesCobro: number;
  importePendienteCobro: number;
  facturasCobradas: number;
  importeCobrado: number;
  facturasBorrador: number;
  facturasVencidas: number;
}
