import type {
  Cliente,
  EmpresaConfig,
  Factura,
  FacturaLinea,
  PagoFactura,
  ResumenEstadisticas,
} from '../types';
import { supabase, isSupabaseConfigured } from '../utils/supabase';
import { calculateInvoiceTotals, round2 } from '../utils/taxCalculator';

// Configuración vacía inicial para nueva empresa
export const EMPTY_EMPRESA_CONFIG: EmpresaConfig = {
  id: '',
  nombreComercial: '',
  razonSocial: '',
  nifCif: '',
  direccion: '',
  codigoPostal: '',
  ciudad: '',
  provincia: '',
  pais: 'España',
  email: '',
  telefono: '',
  logotipoUrl: '',
  datosBancarios: {
    iban: '',
    bic: '',
    banco: '',
    titular: '',
  },
  formaPagoPredeterminada: 'Transferencia bancaria a 30 días',
  pieFacturaPredeterminado: '',
  registroMercantil: '',
  esDemo: false,
  updatedAt: new Date().toISOString(),
};

export const EMPTY_STATS: ResumenEstadisticas = {
  totalFacturas: 0,
  importeTotalFacturado: 0,
  facturasPendientesCobro: 0,
  importePendienteCobro: 0,
  facturasCobradas: 0,
  importeCobrado: 0,
  facturasBorrador: 0,
  facturasVencidas: 0,
};

class StorageService {
  private async getUserId(): Promise<string> {
    if (!isSupabaseConfigured || !supabase) {
      throw new Error('Supabase no está configurado. Verifique las variables de entorno.');
    }
    const { data: { user }, error } = await supabase.auth.getUser();
    if (error || !user) {
      throw new Error('No hay una sesión activa en Supabase. Inicie sesión nuevamente.');
    }
    return user.id;
  }

  // ============================================================================
  // CONFIGURACIÓN DE EMPRESA
  // ============================================================================
  async getEmpresaConfig(): Promise<EmpresaConfig> {
    if (!isSupabaseConfigured || !supabase) {
      return EMPTY_EMPRESA_CONFIG;
    }

    try {
      const userId = await this.getUserId();
      const { data, error } = await supabase
        .from('empresa_config')
        .select('*')
        .eq('user_id', userId)
        .maybeSingle();

      if (error) {
        console.error('Error al obtener empresa_config de Supabase:', error);
        return EMPTY_EMPRESA_CONFIG;
      }

      if (!data) {
        return EMPTY_EMPRESA_CONFIG;
      }

      return {
        id: data.id,
        nombreComercial: data.nombre_comercial || '',
        razonSocial: data.razon_social || '',
        nifCif: data.nif_cif || '',
        direccion: data.direccion || '',
        codigoPostal: data.codigo_postal || '',
        ciudad: data.ciudad || '',
        provincia: data.provincia || '',
        pais: data.pais || 'España',
        email: data.email || '',
        telefono: data.telefono || '',
        logotipoUrl: data.logotipo_url || '',
        datosBancarios: data.datos_bancarios || { iban: '', bic: '', banco: '', titular: '' },
        formaPagoPredeterminada: data.forma_pago_predeterminada || 'Transferencia bancaria a 30 días',
        pieFacturaPredeterminado: data.pie_factura_predeterminado || '',
        registroMercantil: data.registro_mercantil || '',
        esDemo: Boolean(data.es_demo),
        updatedAt: data.updated_at || new Date().toISOString(),
      };
    } catch {
      return EMPTY_EMPRESA_CONFIG;
    }
  }

  async saveEmpresaConfig(config: EmpresaConfig): Promise<EmpresaConfig> {
    const userId = await this.getUserId();
    if (!supabase) throw new Error('Cliente Supabase no disponible');

    const payload = {
      user_id: userId,
      nombre_comercial: config.nombreComercial,
      razon_social: config.razonSocial,
      nif_cif: config.nifCif,
      direccion: config.direccion,
      codigo_postal: config.codigoPostal,
      ciudad: config.ciudad,
      provincia: config.provincia,
      pais: config.pais,
      email: config.email,
      telefono: config.telefono,
      logotipo_url: config.logotipoUrl || null,
      datos_bancarios: config.datosBancarios,
      forma_pago_predeterminada: config.formaPagoPredeterminada,
      pie_factura_predeterminado: config.pieFacturaPredeterminado,
      registro_mercantil: config.registroMercantil || null,
      es_demo: Boolean(config.esDemo),
      updated_at: new Date().toISOString(),
    };

    // Comprobar si ya existe un registro para este usuario
    const { data: existing } = await supabase
      .from('empresa_config')
      .select('id')
      .eq('user_id', userId)
      .maybeSingle();

    if (existing?.id) {
      const { data, error } = await supabase
        .from('empresa_config')
        .update(payload)
        .eq('id', existing.id)
        .select()
        .single();

      if (error) throw new Error(`Fallo al actualizar configuración en Supabase: ${error.message}`);
      return { ...config, id: data.id, updatedAt: data.updated_at };
    } else {
      const { data, error } = await supabase
        .from('empresa_config')
        .insert(payload)
        .select()
        .single();

      if (error) throw new Error(`Fallo al guardar configuración en Supabase: ${error.message}`);
      return { ...config, id: data.id, updatedAt: data.updated_at };
    }
  }

  // ============================================================================
  // CLIENTES
  // ============================================================================
  async getClientes(): Promise<Cliente[]> {
    if (!isSupabaseConfigured || !supabase) return [];

    try {
      const userId = await this.getUserId();
      const { data, error } = await supabase
        .from('clientes')
        .select('*')
        .eq('user_id', userId)
        .order('nombre_o_razon_social', { ascending: true });

      if (error) {
        console.error('Error cargando clientes de Supabase:', error);
        return [];
      }

      return (data || []).map((row) => ({
        id: row.id,
        nombreOrazonSocial: row.nombre_o_razon_social,
        nifCif: row.nif_cif,
        direccionFiscal: row.direccion_fiscal,
        codigoPostal: row.codigo_postal,
        ciudad: row.ciudad,
        provincia: row.provincia,
        pais: row.pais,
        email: row.email || '',
        telefono: row.telefono || '',
        notasInternas: row.notas_internas || '',
        createdAt: row.created_at,
        updatedAt: row.updated_at,
      }));
    } catch {
      return [];
    }
  }

  async createCliente(data: Omit<Cliente, 'id' | 'createdAt' | 'updatedAt'>): Promise<Cliente> {
    const userId = await this.getUserId();
    if (!supabase) throw new Error('Cliente Supabase no disponible');

    const payload = {
      user_id: userId,
      nombre_o_razon_social: data.nombreOrazonSocial,
      nif_cif: data.nifCif,
      direccion_fiscal: data.direccionFiscal,
      codigo_postal: data.codigoPostal,
      ciudad: data.ciudad,
      provincia: data.provincia,
      pais: data.pais || 'España',
      email: data.email || null,
      telefono: data.telefono || null,
      notas_internas: data.notasInternas || null,
    };

    const { data: row, error } = await supabase
      .from('clientes')
      .insert(payload)
      .select()
      .single();

    if (error) throw new Error(`Error guardando cliente en Supabase: ${error.message}`);

    return {
      id: row.id,
      nombreOrazonSocial: row.nombre_o_razon_social,
      nifCif: row.nif_cif,
      direccionFiscal: row.direccion_fiscal,
      codigoPostal: row.codigo_postal,
      ciudad: row.ciudad,
      provincia: row.provincia,
      pais: row.pais,
      email: row.email || '',
      telefono: row.telefono || '',
      notasInternas: row.notas_internas || '',
      createdAt: row.created_at,
      updatedAt: row.updated_at,
    };
  }

  async updateCliente(id: string, data: Partial<Omit<Cliente, 'id' | 'createdAt'>>): Promise<Cliente> {
    await this.getUserId();
    if (!supabase) throw new Error('Cliente Supabase no disponible');

    const payload: Record<string, any> = {
      updated_at: new Date().toISOString(),
    };
    if (data.nombreOrazonSocial !== undefined) payload.nombre_o_razon_social = data.nombreOrazonSocial;
    if (data.nifCif !== undefined) payload.nif_cif = data.nifCif;
    if (data.direccionFiscal !== undefined) payload.direccion_fiscal = data.direccionFiscal;
    if (data.codigoPostal !== undefined) payload.codigo_postal = data.codigoPostal;
    if (data.ciudad !== undefined) payload.ciudad = data.ciudad;
    if (data.provincia !== undefined) payload.provincia = data.provincia;
    if (data.pais !== undefined) payload.pais = data.pais;
    if (data.email !== undefined) payload.email = data.email || null;
    if (data.telefono !== undefined) payload.telefono = data.telefono || null;
    if (data.notasInternas !== undefined) payload.notas_internas = data.notasInternas || null;

    const { data: row, error } = await supabase
      .from('clientes')
      .update(payload)
      .eq('id', id)
      .select()
      .single();

    if (error) throw new Error(`Error actualizando cliente en Supabase: ${error.message}`);

    return {
      id: row.id,
      nombreOrazonSocial: row.nombre_o_razon_social,
      nifCif: row.nif_cif,
      direccionFiscal: row.direccion_fiscal,
      codigoPostal: row.codigo_postal,
      ciudad: row.ciudad,
      provincia: row.provincia,
      pais: row.pais,
      email: row.email || '',
      telefono: row.telefono || '',
      notasInternas: row.notas_internas || '',
      createdAt: row.created_at,
      updatedAt: row.updated_at,
    };
  }

  async deleteCliente(id: string): Promise<boolean> {
    await this.getUserId();
    if (!supabase) throw new Error('Cliente Supabase no disponible');

    // Verificar si el cliente tiene facturas asociadas
    const { count, error: countErr } = await supabase
      .from('facturas')
      .select('*', { count: 'exact', head: true })
      .eq('cliente_id', id);

    if (countErr) throw new Error(`Error comprobando facturas del cliente: ${countErr.message}`);
    if (count && count > 0) {
      throw new Error('No es posible eliminar un cliente que posee facturas asociadas.');
    }

    const { error } = await supabase.from('clientes').delete().eq('id', id);
    if (error) throw new Error(`Error eliminando cliente en Supabase: ${error.message}`);
    return true;
  }

  // ============================================================================
  // FACTURAS
  // ============================================================================
  async getFacturas(): Promise<Factura[]> {
    if (!isSupabaseConfigured || !supabase) return [];

    try {
      const userId = await this.getUserId();
      const { data, error } = await supabase
        .from('facturas')
        .select(`
          *,
          factura_lineas (*),
          pagos_factura (*)
        `)
        .eq('user_id', userId)
        .order('fecha_emision', { ascending: false })
        .order('numero_secuencial', { ascending: false });

      if (error) {
        console.error('Error cargando facturas de Supabase:', error);
        return [];
      }

      return (data || []).map((row) => {
        const lineas: FacturaLinea[] = (row.factura_lineas || [])
          .sort((a: any, b: any) => (a.orden || 0) - (b.orden || 0))
          .map((l: any) => ({
            id: l.id,
            descripcion: l.descripcion,
            cantidad: Number(l.cantidad),
            precioUnitario: Number(l.precio_unitario),
            descuentoPorcentaje: Number(l.descuento_porcentaje || 0),
            tipoIva: Number(l.tipo_iva),
            baseImponible: Number(l.base_imponible),
            cuotaIva: Number(l.cuota_iva),
            totalLinea: Number(l.total_linea),
          }));

        const pagos: PagoFactura[] = (row.pagos_factura || [])
          .sort((a: any, b: any) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime())
          .map((p: any) => ({
            id: p.id,
            fecha: p.fecha,
            importe: Number(p.importe),
            metodo: p.metodo,
            referencia: p.referencia || '',
            notas: p.notas || '',
            createdAt: p.created_at,
          }));

        return {
          id: row.id,
          numero: row.numero,
          serie: row.serie,
          numeroSecuencial: row.numero_secuencial,
          fechaEmision: row.fecha_emision,
          fechaOperacion: row.fecha_operacion || undefined,
          fechaVencimiento: row.fecha_vencimiento,
          clienteId: row.cliente_id || '',
          clienteSnapshot: row.cliente_snapshot,
          emisorSnapshot: row.emisor_snapshot,
          lineas,
          moneda: row.moneda || 'EUR',
          formaPago: row.forma_pago,
          datosBancarios: row.datos_bancarios || undefined,
          observaciones: row.observaciones || '',
          estado: row.estado,
          esRectificativa: Boolean(row.es_rectificativa),
          facturaRectificadaNumero: row.factura_rectificada_numero || undefined,
          facturaRectificadaId: row.factura_rectificada_id || undefined,
          motivoRectificacion: row.motivo_rectificacion || undefined,
          subtotalBruto: Number(row.subtotal_bruto || 0),
          descuentoTotal: Number(row.descuento_total || 0),
          baseImponibleTotal: Number(row.base_imponible_total || 0),
          desgloseIva: row.desglose_iva || [],
          cuotaIvaTotal: Number(row.cuota_iva_total || 0),
          retencionIrpfPorcentaje: Number(row.retencion_irpf_porcentaje || 0),
          importeRetencionIrpf: Number(row.importe_retencion_irpf || 0),
          totalFinal: Number(row.total_final || 0),
          importeCobrado: Number(row.importe_cobrado || 0),
          importePendiente: Number(row.importe_pendiente || 0),
          pagos,
          createdAt: row.created_at,
          updatedAt: row.updated_at,
        };
      });
    } catch {
      return [];
    }
  }

  getNextInvoiceNumber(facturas: Factura[], serie: string = `FAC-${new Date().getFullYear()}`): { numero: string; secuencial: number } {
    const facturasSerie = facturas.filter((f) => f.serie === serie);
    let maxSecuencial = 0;
    for (const f of facturasSerie) {
      if (f.numeroSecuencial && f.numeroSecuencial > maxSecuencial) {
        maxSecuencial = f.numeroSecuencial;
      }
    }
    const nextSec = maxSecuencial + 1;
    const padded = String(nextSec).padStart(4, '0');
    const numero = `${serie}-${padded}`;
    return { numero, secuencial: nextSec };
  }

  async createFactura(facturaData: Omit<Factura, 'id' | 'createdAt' | 'updatedAt'>): Promise<Factura> {
    const userId = await this.getUserId();
    if (!supabase) throw new Error('Cliente Supabase no disponible');

    // Comprobar colisión de numeración
    if (facturaData.estado !== 'borrador') {
      const { data: colision } = await supabase
        .from('facturas')
        .select('id')
        .eq('user_id', userId)
        .eq('serie', facturaData.serie)
        .eq('numero', facturaData.numero)
        .maybeSingle();

      if (colision) {
        throw new Error(`Ya existe una factura con el número ${facturaData.numero} en la serie ${facturaData.serie}.`);
      }
    }

    const payload = {
      user_id: userId,
      numero: facturaData.numero,
      serie: facturaData.serie,
      numero_secuencial: facturaData.numeroSecuencial,
      fecha_emision: facturaData.fechaEmision,
      fecha_operacion: facturaData.fechaOperacion || null,
      fecha_vencimiento: facturaData.fechaVencimiento,
      cliente_id: facturaData.clienteId || null,
      cliente_snapshot: facturaData.clienteSnapshot,
      emisor_snapshot: facturaData.emisorSnapshot,
      moneda: facturaData.moneda || 'EUR',
      forma_pago: facturaData.formaPago,
      datos_bancarios: facturaData.datosBancarios || null,
      observaciones: facturaData.observaciones || null,
      estado: facturaData.estado,
      es_rectificativa: Boolean(facturaData.esRectificativa),
      factura_rectificada_numero: facturaData.facturaRectificadaNumero || null,
      factura_rectificada_id: facturaData.facturaRectificadaId || null,
      motivo_rectificacion: facturaData.motivoRectificacion || null,
      subtotal_bruto: facturaData.subtotalBruto,
      descuento_total: facturaData.descuentoTotal,
      base_imponible_total: facturaData.baseImponibleTotal,
      desglose_iva: facturaData.desgloseIva,
      cuota_iva_total: facturaData.cuotaIvaTotal,
      retencion_irpf_porcentaje: facturaData.retencionIrpfPorcentaje,
      importe_retencion_irpf: facturaData.importeRetencionIrpf,
      total_final: facturaData.totalFinal,
      importe_cobrado: facturaData.importeCobrado,
      importe_pendiente: facturaData.importePendiente,
    };

    const { data: facturaRow, error: fError } = await supabase
      .from('facturas')
      .insert(payload)
      .select()
      .single();

    if (fError) throw new Error(`Error insertando factura en Supabase: ${fError.message}`);

    // Insertar líneas de factura
    if (facturaData.lineas && facturaData.lineas.length > 0) {
      const lineasPayload = facturaData.lineas.map((l, idx) => ({
        factura_id: facturaRow.id,
        descripcion: l.descripcion,
        cantidad: l.cantidad,
        precio_unitario: l.precioUnitario,
        descuento_porcentaje: l.descuentoPorcentaje || 0,
        tipo_iva: l.tipoIva,
        base_imponible: l.baseImponible,
        cuota_iva: l.cuotaIva,
        total_linea: l.totalLinea,
        orden: idx + 1,
      }));

      const { error: lError } = await supabase.from('factura_lineas').insert(lineasPayload);
      if (lError) throw new Error(`Error insertando líneas de factura: ${lError.message}`);
    }

    return {
      ...facturaData,
      id: facturaRow.id,
      createdAt: facturaRow.created_at,
      updatedAt: facturaRow.updated_at,
    };
  }

  async updateFactura(id: string, data: Partial<Factura>): Promise<void> {
    const userId = await this.getUserId();
    if (!supabase) throw new Error('Cliente Supabase no disponible');

    // Obtener factura actual para validar inmutabilidad
    const { data: actual, error: aError } = await supabase
      .from('facturas')
      .select('estado, numero')
      .eq('id', id)
      .eq('user_id', userId)
      .single();

    if (aError || !actual) throw new Error('Factura no encontrada o sin permisos de acceso.');

    if (actual.estado !== 'borrador' && data.estado === 'borrador') {
      throw new Error('No es legal convertir una factura emitida de nuevo a borrador.');
    }

    const payload: Record<string, any> = {
      updated_at: new Date().toISOString(),
    };

    if (data.numero !== undefined) payload.numero = data.numero;
    if (data.serie !== undefined) payload.serie = data.serie;
    if (data.fechaEmision !== undefined) payload.fecha_emision = data.fechaEmision;
    if (data.fechaOperacion !== undefined) payload.fecha_operacion = data.fechaOperacion || null;
    if (data.fechaVencimiento !== undefined) payload.fecha_vencimiento = data.fechaVencimiento;
    if (data.clienteId !== undefined) payload.cliente_id = data.clienteId || null;
    if (data.clienteSnapshot !== undefined) payload.cliente_snapshot = data.clienteSnapshot;
    if (data.emisorSnapshot !== undefined) payload.emisor_snapshot = data.emisorSnapshot;
    if (data.formaPago !== undefined) payload.forma_pago = data.formaPago;
    if (data.datosBancarios !== undefined) payload.datos_bancarios = data.datosBancarios || null;
    if (data.observaciones !== undefined) payload.observaciones = data.observaciones || null;
    if (data.estado !== undefined) payload.estado = data.estado;
    if (data.subtotalBruto !== undefined) payload.subtotal_bruto = data.subtotalBruto;
    if (data.descuentoTotal !== undefined) payload.descuento_total = data.descuentoTotal;
    if (data.baseImponibleTotal !== undefined) payload.base_imponible_total = data.baseImponibleTotal;
    if (data.desgloseIva !== undefined) payload.desglose_iva = data.desgloseIva;
    if (data.cuotaIvaTotal !== undefined) payload.cuota_iva_total = data.cuotaIvaTotal;
    if (data.retencionIrpfPorcentaje !== undefined) payload.retencion_irpf_porcentaje = data.retencionIrpfPorcentaje;
    if (data.importeRetencionIrpf !== undefined) payload.importe_retencion_irpf = data.importeRetencionIrpf;
    if (data.totalFinal !== undefined) payload.total_final = data.totalFinal;
    if (data.importeCobrado !== undefined) payload.importe_cobrado = data.importeCobrado;
    if (data.importePendiente !== undefined) payload.importe_pendiente = data.importePendiente;

    const { error: uError } = await supabase
      .from('facturas')
      .update(payload)
      .eq('id', id)
      .eq('user_id', userId);

    if (uError) throw new Error(`Error actualizando factura en Supabase: ${uError.message}`);

    // Si se enviaron líneas nuevas, sincronizarlas
    if (data.lineas) {
      await supabase.from('factura_lineas').delete().eq('factura_id', id);

      const lineasPayload = data.lineas.map((l, idx) => ({
        factura_id: id,
        descripcion: l.descripcion,
        cantidad: l.cantidad,
        precio_unitario: l.precioUnitario,
        descuento_porcentaje: l.descuentoPorcentaje || 0,
        tipo_iva: l.tipoIva,
        base_imponible: l.baseImponible,
        cuota_iva: l.cuotaIva,
        total_linea: l.totalLinea,
        orden: idx + 1,
      }));

      const { error: lError } = await supabase.from('factura_lineas').insert(lineasPayload);
      if (lError) throw new Error(`Error actualizando líneas de factura: ${lError.message}`);
    }
  }

  async deleteFactura(id: string): Promise<boolean> {
    const userId = await this.getUserId();
    if (!supabase) throw new Error('Cliente Supabase no disponible');

    const { data: factura, error: fError } = await supabase
      .from('facturas')
      .select('estado')
      .eq('id', id)
      .eq('user_id', userId)
      .single();

    if (fError || !factura) throw new Error('Factura no encontrada.');

    if (factura.estado !== 'borrador') {
      throw new Error(
        'Por normativa fiscal española, las facturas emitidas no pueden eliminarse. En su lugar, emita una Factura Rectificativa o márquela como Anulada.'
      );
    }

    const { error } = await supabase
      .from('facturas')
      .delete()
      .eq('id', id)
      .eq('user_id', userId);

    if (error) throw new Error(`Error eliminando factura en Supabase: ${error.message}`);
    return true;
  }

  async addPagoFactura(facturaId: string, pago: Omit<PagoFactura, 'id' | 'createdAt'>): Promise<void> {
    const userId = await this.getUserId();
    if (!supabase) throw new Error('Cliente Supabase no disponible');

    // 1. Insertar el pago
    const { error: pError } = await supabase.from('pagos_factura').insert({
      factura_id: facturaId,
      fecha: pago.fecha,
      importe: pago.importe,
      metodo: pago.metodo,
      referencia: pago.referencia || null,
      notas: pago.notas || null,
    });

    if (pError) throw new Error(`Error registrando el pago en Supabase: ${pError.message}`);

    // 2. Obtener todos los pagos de la factura para recalcular
    const { data: pagos, error: fetchErr } = await supabase
      .from('pagos_factura')
      .select('importe')
      .eq('factura_id', facturaId);

    if (fetchErr) throw new Error(`Error calculando totales de cobro: ${fetchErr.message}`);

    const totalCobrado = round2((pagos || []).reduce((sum, p) => sum + Number(p.importe), 0));

    // 3. Obtener el totalFinal de la factura
    const { data: factura, error: facErr } = await supabase
      .from('facturas')
      .select('total_final, estado')
      .eq('id', facturaId)
      .eq('user_id', userId)
      .single();

    if (facErr || !factura) throw new Error('No se pudo verificar la factura para actualizar el cobro.');

    const totalFinal = Number(factura.total_final);
    const totalPendiente = Math.max(0, round2(totalFinal - totalCobrado));

    let nuevoEstado = factura.estado;
    if (totalPendiente === 0 && totalFinal > 0) {
      nuevoEstado = 'cobrada';
    } else if (totalCobrado > 0 && totalPendiente > 0) {
      nuevoEstado = 'parcialmente_cobrada';
    }

    await supabase
      .from('facturas')
      .update({
        importe_cobrado: totalCobrado,
        importe_pendiente: totalPendiente,
        estado: nuevoEstado,
        updated_at: new Date().toISOString(),
      })
      .eq('id', facturaId)
      .eq('user_id', userId);
  }

  async crearFacturaRectificativa(facturaOriginalId: string, motivo: string): Promise<Factura> {
    const facturas = await this.getFacturas();
    const original = facturas.find((f) => f.id === facturaOriginalId);
    if (!original) throw new Error('Factura original no encontrada.');

    const serieRectificativa = `R-${new Date().getFullYear()}`;
    const { numero, secuencial } = this.getNextInvoiceNumber(facturas, serieRectificativa);

    const lineasInvertidas = original.lineas.map((l) => ({
      ...l,
      id: `lin-rec-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
      cantidad: -Math.abs(l.cantidad),
      baseImponible: -Math.abs(l.baseImponible),
      cuotaIva: -Math.abs(l.cuotaIva),
      totalLinea: -Math.abs(l.totalLinea),
    }));

    const totales = calculateInvoiceTotals(
      lineasInvertidas,
      original.retencionIrpfPorcentaje,
      []
    );

    const rectificativa = await this.createFactura({
      numero,
      serie: serieRectificativa,
      numeroSecuencial: secuencial,
      fechaEmision: new Date().toISOString().split('T')[0] ?? '',
      fechaOperacion: original.fechaEmision,
      fechaVencimiento: new Date().toISOString().split('T')[0] ?? '',
      clienteId: original.clienteId,
      clienteSnapshot: { ...original.clienteSnapshot },
      emisorSnapshot: { ...original.emisorSnapshot },
      lineas: lineasInvertidas,
      moneda: 'EUR',
      formaPago: original.formaPago,
      datosBancarios: original.datosBancarios,
      observaciones: `Factura rectificativa correspondiente a la factura ${original.numero}. Motivo: ${motivo}`,
      estado: 'rectificada',
      esRectificativa: true,
      facturaRectificadaNumero: original.numero,
      facturaRectificadaId: original.id,
      motivoRectificacion: motivo,
      subtotalBruto: totales.subtotalBruto,
      descuentoTotal: totales.descuentoTotal,
      baseImponibleTotal: totales.baseImponibleTotal,
      desgloseIva: totales.desgloseIva,
      cuotaIvaTotal: totales.cuotaIvaTotal,
      retencionIrpfPorcentaje: totales.retencionIrpfPorcentaje,
      importeRetencionIrpf: totales.importeRetencionIrpf,
      totalFinal: totales.totalFinal,
      importeCobrado: 0,
      importePendiente: totales.totalFinal,
      pagos: [],
    });

    // Actualizar original en Supabase
    await this.updateFactura(original.id, { estado: 'rectificada' });
    return rectificativa;
  }

  // ============================================================================
  // ESTADÍSTICAS DEL DASHBOARD
  // ============================================================================
  async getEstadisticas(): Promise<ResumenEstadisticas> {
    const facturas = await this.getFacturas();
    const hoy = new Date().toISOString().split('T')[0] ?? '';

    let totalFacturas = 0;
    let importeTotalFacturado = 0;
    let facturasPendientesCobro = 0;
    let importePendienteCobro = 0;
    let facturasCobradas = 0;
    let importeCobrado = 0;
    let facturasBorrador = 0;
    let facturasVencidas = 0;

    for (const f of facturas) {
      if (f.estado === 'borrador') {
        facturasBorrador++;
        continue;
      }

      totalFacturas++;
      importeTotalFacturado = round2(importeTotalFacturado + (f.totalFinal || 0));
      importeCobrado = round2(importeCobrado + (f.importeCobrado || 0));

      if (f.estado === 'cobrada') {
        facturasCobradas++;
      } else if (f.importePendiente > 0) {
        facturasPendientesCobro++;
        importePendienteCobro = round2(importePendienteCobro + f.importePendiente);
        if (f.fechaVencimiento && f.fechaVencimiento < hoy) {
          facturasVencidas++;
        }
      }
    }

    return {
      totalFacturas,
      importeTotalFacturado,
      facturasPendientesCobro,
      importePendienteCobro,
      facturasCobradas,
      importeCobrado,
      facturasBorrador,
      facturasVencidas,
    };
  }

  // ============================================================================
  // BACKUP Y RESTAURACIÓN EN JSON
  // ============================================================================
  async exportBackup(): Promise<string> {
    const [config, clientes, facturas] = await Promise.all([
      this.getEmpresaConfig(),
      this.getClientes(),
      this.getFacturas(),
    ]);

    const backup = {
      version: '2.0.0-supabase',
      exportedAt: new Date().toISOString(),
      config,
      clientes,
      facturas,
    };
    return JSON.stringify(backup, null, 2);
  }

  async importBackup(jsonString: string): Promise<{ success: boolean; message: string }> {
    try {
      const data = JSON.parse(jsonString);
      if (!data.config || !Array.isArray(data.clientes) || !Array.isArray(data.facturas)) {
        return { success: false, message: 'El archivo no contiene un formato de copia de seguridad válido.' };
      }

      // Guardar configuración
      await this.saveEmpresaConfig(data.config);

      // Guardar clientes
      for (const c of data.clientes) {
        await this.createCliente({
          nombreOrazonSocial: c.nombreOrazonSocial,
          nifCif: c.nifCif,
          direccionFiscal: c.direccionFiscal,
          codigoPostal: c.codigoPostal,
          ciudad: c.ciudad,
          provincia: c.provincia,
          pais: c.pais,
          email: c.email,
          telefono: c.telefono,
          notasInternas: c.notasInternas,
        });
      }

      return { success: true, message: 'Copia de seguridad importada y sincronizada en Supabase correctamente.' };
    } catch (err: any) {
      return { success: false, message: `Error al importar: ${err?.message || 'Archivo corrupto'}` };
    }
  }
}

export const storageService = new StorageService();
