import React, { useState, useEffect, useMemo } from 'react';
import type {
  Cliente,
  EmpresaConfig,
  Factura,
  FacturaLinea,
} from '../../types';
import {
  calculateInvoiceTotals,
  calculateLine,
  formatCurrency,
} from '../../utils/taxCalculator';
import { storageService } from '../../services/storageService';
import { ClientModal } from '../clients/ClientModal';
import {
  Plus,
  Trash2,
  Save,
  CheckCircle,
  Eye,
  ArrowLeft,
  UserPlus,
  AlertCircle,
  HelpCircle,
} from 'lucide-react';

interface InvoiceFormViewProps {
  facturaToEdit?: Factura | null;
  empresaConfig: EmpresaConfig;
  clientes: Cliente[];
  facturas: Factura[];
  onSave: (factura: Factura) => void;
  onCancel: () => void;
  onPreview: (factura: Factura) => void;
  onCreateClienteInline: (clienteData: Omit<Cliente, 'id' | 'createdAt' | 'updatedAt'>) => Promise<Cliente>;
}

export const InvoiceFormView: React.FC<InvoiceFormViewProps> = ({
  facturaToEdit,
  empresaConfig,
  clientes,
  facturas,
  onSave,
  onCancel,
  onPreview,
  onCreateClienteInline,
}) => {
  const isEditing = Boolean(facturaToEdit);
  const isLocked = isEditing && facturaToEdit?.estado !== 'borrador';

  const getTodayISO = () => new Date().toISOString().split('T')[0] ?? '';
  const getDue30Days = () => {
    const d = new Date();
    d.setDate(d.getDate() + 30);
    return d.toISOString().split('T')[0] ?? '';
  };

  const [serie, setSerie] = useState(facturaToEdit?.serie || `FAC-${new Date().getFullYear()}`);
  const [numero, setNumero] = useState(facturaToEdit?.numero || '');
  const [numeroSecuencial, setNumeroSecuencial] = useState(facturaToEdit?.numeroSecuencial || 0);
  const [fechaEmision, setFechaEmision] = useState(facturaToEdit?.fechaEmision || getTodayISO());
  const [fechaOperacion, setFechaOperacion] = useState(facturaToEdit?.fechaOperacion || '');
  const [fechaVencimiento, setFechaVencimiento] = useState(facturaToEdit?.fechaVencimiento || getDue30Days());
  const [clienteId, setClienteId] = useState(facturaToEdit?.clienteId || (clientes[0]?.id || ''));
  const [formaPago, setFormaPago] = useState(facturaToEdit?.formaPago || empresaConfig.formaPagoPredeterminada);
  const [observaciones, setObservaciones] = useState(facturaToEdit?.observaciones || empresaConfig.pieFacturaPredeterminado);
  const [retencionIrpfPorcentaje, setRetencionIrpfPorcentaje] = useState<number>(facturaToEdit?.retencionIrpfPorcentaje || 0);

  const [isClientModalOpen, setIsClientModalOpen] = useState(false);

  const [lineas, setLineas] = useState<FacturaLinea[]>(() => {
    if (facturaToEdit?.lineas?.length) {
      return facturaToEdit.lineas;
    }
    return [
      {
        id: 'lin-inicial-1',
        descripcion: '',
        cantidad: 1,
        precioUnitario: 0,
        descuentoPorcentaje: 0,
        tipoIva: 21,
        baseImponible: 0,
        cuotaIva: 0,
        totalLinea: 0,
      },
    ];
  });

  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  useEffect(() => {
    if (!isEditing && !numero) {
      const { numero: nextNum, secuencial } = storageService.getNextInvoiceNumber(facturas, serie);
      setNumero(nextNum);
      setNumeroSecuencial(secuencial);
    }
  }, [serie, isEditing, numero, facturas]);

  const handleLineChange = (
    id: string,
    field: keyof FacturaLinea,
    val: any
  ) => {
    if (isLocked) return;
    setLineas((prev) =>
      prev.map((l) => {
        if (l.id !== id) return l;

        const updated = { ...l, [field]: val };
        const { baseImponible, cuotaIva, totalLinea } = calculateLine(
          updated.cantidad,
          updated.precioUnitario,
          updated.descuentoPorcentaje,
          updated.tipoIva
        );

        return {
          ...updated,
          baseImponible,
          cuotaIva,
          totalLinea,
        };
      })
    );
  };

  const handleAddLine = () => {
    if (isLocked) return;
    setLineas((prev) => [
      ...prev,
      {
        id: `lin-${Date.now()}-${prev.length + 1}`,
        descripcion: '',
        cantidad: 1,
        precioUnitario: 0,
        descuentoPorcentaje: 0,
        tipoIva: 21,
        baseImponible: 0,
        cuotaIva: 0,
        totalLinea: 0,
      },
    ]);
  };

  const handleRemoveLine = (id: string) => {
    if (isLocked) return;
    if (lineas.length === 1) {
      alert('La factura debe tener al menos una línea.');
      return;
    }
    setLineas((prev) => prev.filter((l) => l.id !== id));
  };

  const calculatedTotals = useMemo(() => {
    return calculateInvoiceTotals(lineas, retencionIrpfPorcentaje, facturaToEdit?.pagos || []);
  }, [lineas, retencionIrpfPorcentaje, facturaToEdit?.pagos]);

  const selectedCliente = useMemo(() => {
    return clientes.find((c) => c.id === clienteId);
  }, [clientes, clienteId]);

  const buildFacturaObject = (targetEstado: Factura['estado']): Factura => {
    if (!selectedCliente) {
      throw new Error('Debe seleccionar un cliente destinatario.');
    }

    if (!numero.trim()) {
      throw new Error('El número de factura es obligatorio.');
    }

    const lineasValidas = lineas.filter((l) => l.descripcion.trim().length > 0);
    if (lineasValidas.length === 0) {
      throw new Error('Debe ingresar al menos una línea con descripción en la factura.');
    }

    const now = new Date().toISOString();

    const snapshotEmisor = {
      nombreComercial: empresaConfig.nombreComercial || 'FACENIA',
      razonSocial: empresaConfig.razonSocial,
      nifCif: empresaConfig.nifCif,
      direccion: empresaConfig.direccion,
      codigoPostal: empresaConfig.codigoPostal,
      ciudad: empresaConfig.ciudad,
      provincia: empresaConfig.provincia,
      pais: empresaConfig.pais,
      email: empresaConfig.email,
      telefono: empresaConfig.telefono,
      registroMercantil: empresaConfig.registroMercantil,
      esDemo: empresaConfig.esDemo,
      logotipoUrl: empresaConfig.logotipoUrl || '/logo.png',
    };

    const snapshotCliente = {
      nombreOrazonSocial: selectedCliente.nombreOrazonSocial,
      nifCif: selectedCliente.nifCif,
      direccionFiscal: selectedCliente.direccionFiscal,
      codigoPostal: selectedCliente.codigoPostal,
      ciudad: selectedCliente.ciudad,
      provincia: selectedCliente.provincia,
      pais: selectedCliente.pais,
      email: selectedCliente.email,
      telefono: selectedCliente.telefono,
    };

    return {
      id: facturaToEdit?.id || `fac-${Date.now()}`,
      numero: numero.trim(),
      serie: serie.trim(),
      numeroSecuencial: numeroSecuencial || 1,
      fechaEmision,
      fechaOperacion: fechaOperacion || undefined,
      fechaVencimiento,
      clienteId: selectedCliente.id,
      clienteSnapshot: snapshotCliente,
      emisorSnapshot: snapshotEmisor,
      lineas: lineasValidas,
      moneda: 'EUR',
      formaPago,
      datosBancarios: empresaConfig.datosBancarios,
      observaciones,
      estado: targetEstado,
      esRectificativa: facturaToEdit?.esRectificativa || false,
      facturaRectificadaNumero: facturaToEdit?.facturaRectificadaNumero,
      facturaRectificadaId: facturaToEdit?.facturaRectificadaId,
      motivoRectificacion: facturaToEdit?.motivoRectificacion,
      subtotalBruto: calculatedTotals.subtotalBruto,
      descuentoTotal: calculatedTotals.descuentoTotal,
      baseImponibleTotal: calculatedTotals.baseImponibleTotal,
      desgloseIva: calculatedTotals.desgloseIva,
      cuotaIvaTotal: calculatedTotals.cuotaIvaTotal,
      retencionIrpfPorcentaje: calculatedTotals.retencionIrpfPorcentaje,
      importeRetencionIrpf: calculatedTotals.importeRetencionIrpf,
      totalFinal: calculatedTotals.totalFinal,
      importeCobrado: calculatedTotals.importeCobrado,
      importePendiente: calculatedTotals.importePendiente,
      pagos: facturaToEdit?.pagos || [],
      createdAt: facturaToEdit?.createdAt || now,
      updatedAt: now,
    };
  };

  const handleSave = (estado: Factura['estado']) => {
    setErrorMsg(null);
    try {
      const factura = buildFacturaObject(estado);
      onSave(factura);
    } catch (err: any) {
      setErrorMsg(err.message || 'Error al validar los datos de la factura.');
    }
  };

  const handlePreviewClick = () => {
    setErrorMsg(null);
    try {
      const factura = buildFacturaObject(facturaToEdit?.estado || 'borrador');
      onPreview(factura);
    } catch (err: any) {
      setErrorMsg(err.message || 'No se puede previsualizar: complete los campos obligatorios.');
    }
  };

  return (
    <div className="space-y-6 max-w-5xl pb-16">
      {/* Header bar */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-3 border-b border-slate-200 dark:border-slate-800">
        <div className="flex items-center gap-3">
          <button
            onClick={onCancel}
            className="p-1.5 text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-200 dark:hover:bg-slate-800 rounded-lg transition-colors"
            title="Volver"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div>
            <h1 className="text-2xl font-bold text-slate-900 dark:text-white tracking-tight">
              {isEditing
                ? `Factura ${facturaToEdit?.numero}`
                : 'Emitir Nueva Factura'}
            </h1>
            <p className="text-sm text-slate-500 dark:text-slate-400">
              {isLocked
                ? 'Documento emitido. Solo lectura de conceptos para garantizar la trazabilidad fiscal.'
                : 'Complete los datos del destinatario y desglose los conceptos de facturación.'}
            </p>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <button
            type="button"
            onClick={handlePreviewClick}
            className="inline-flex items-center gap-2 px-3.5 py-2 text-xs font-semibold text-slate-700 dark:text-slate-200 bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-800 shadow-subtle transition-colors"
          >
            <Eye className="w-3.5 h-3.5 text-slate-500 dark:text-slate-400" />
            <span>Vista Previa PDF</span>
          </button>

          {!isLocked && (
            <>
              <button
                type="button"
                onClick={() => handleSave('borrador')}
                className="inline-flex items-center gap-2 px-4 py-2 text-xs font-semibold text-slate-700 dark:text-slate-200 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 rounded-lg shadow-subtle transition-colors"
              >
                <Save className="w-3.5 h-3.5" />
                <span>Guardar Borrador</span>
              </button>
              <button
                type="button"
                onClick={() => handleSave('pendiente_cobro')}
                className="inline-flex items-center gap-2 px-4 py-2 text-xs font-semibold text-white bg-brand-700 hover:bg-brand-800 rounded-lg shadow-subtle focus:ring-2 focus:ring-brand-500 transition-colors"
              >
                <CheckCircle className="w-3.5 h-3.5" />
                <span>Emitir Factura</span>
              </button>
            </>
          )}
        </div>
      </div>

      {errorMsg && (
        <div className="p-4 bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-800 rounded-xl text-xs sm:text-sm text-red-800 dark:text-red-200 flex items-start gap-2.5">
          <AlertCircle className="w-5 h-5 text-red-600 dark:text-red-400 shrink-0 mt-0.5" />
          <span>{errorMsg}</span>
        </div>
      )}

      {isLocked && (
        <div className="p-4 bg-brand-50 dark:bg-brand-950/40 border border-brand-200 dark:border-brand-800 rounded-xl text-xs sm:text-sm text-brand-900 dark:text-brand-200 flex items-start gap-2.5">
          <HelpCircle className="w-5 h-5 text-brand-600 dark:text-brand-400 shrink-0 mt-0.5" />
          <div>
            <strong>Documento Emitido Inmutable:</strong> Conforme al Real Decreto 1619/2012, las facturas emitidas no se modifican directamente. Para subsanar importes o conceptos, emita una Factura Rectificativa desde el registro de facturas.
          </div>
        </div>
      )}

      {/* SECCIÓN 1: DATOS GENERALES Y CLIENTE */}
      <div className="ui-card p-6 space-y-5">
        <h2 className="text-xs font-bold uppercase tracking-wider text-slate-600 dark:text-slate-400 pb-2 border-b border-slate-100 dark:border-slate-800">
          1. Datos de Emisión y Destinatario
        </h2>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div>
            <label htmlFor="inv-serie" className="ui-label">
              Serie
            </label>
            <input
              id="inv-serie"
              name="serie"
              type="text"
              disabled={isLocked}
              value={serie}
              onChange={(e) => setSerie(e.target.value)}
              className="ui-input font-mono"
            />
          </div>

          <div>
            <label htmlFor="inv-numero" className="ui-label">
              Número de Factura *
            </label>
            <input
              id="inv-numero"
              name="numero"
              type="text"
              disabled={isLocked}
              required
              value={numero}
              onChange={(e) => setNumero(e.target.value)}
              className="ui-input font-mono font-bold"
            />
          </div>

          <div>
            <label htmlFor="inv-moneda" className="ui-label">
              Moneda
            </label>
            <input
              id="inv-moneda"
              name="moneda"
              type="text"
              disabled
              value="EUR (€) — Euro"
              className="ui-input bg-slate-100 dark:bg-slate-800 cursor-not-allowed"
            />
          </div>

          <div>
            <label htmlFor="inv-fechaEmision" className="ui-label">
              Fecha de Emisión *
            </label>
            <input
              id="inv-fechaEmision"
              name="fechaEmision"
              type="date"
              disabled={isLocked}
              required
              value={fechaEmision}
              onChange={(e) => setFechaEmision(e.target.value)}
              className="ui-input"
            />
          </div>

          <div>
            <label htmlFor="inv-fechaOperacion" className="ui-label">
              Fecha de Operación (Opcional)
            </label>
            <input
              id="inv-fechaOperacion"
              name="fechaOperacion"
              type="date"
              disabled={isLocked}
              value={fechaOperacion}
              onChange={(e) => setFechaOperacion(e.target.value)}
              className="ui-input"
            />
          </div>

          <div>
            <label htmlFor="inv-fechaVencimiento" className="ui-label">
              Fecha de Vencimiento *
            </label>
            <input
              id="inv-fechaVencimiento"
              name="fechaVencimiento"
              type="date"
              disabled={isLocked}
              required
              value={fechaVencimiento}
              onChange={(e) => setFechaVencimiento(e.target.value)}
              className="ui-input"
            />
          </div>
        </div>

        {/* Selección de Cliente con botón inline */}
        <div className="pt-2">
          <div className="flex items-center justify-between mb-1.5">
            <label htmlFor="inv-clienteId" className="ui-label mb-0">
              Cliente Destinatario *
            </label>
            {!isLocked && (
              <button
                type="button"
                onClick={() => setIsClientModalOpen(true)}
                className="inline-flex items-center gap-1 text-xs font-semibold text-brand-700 dark:text-brand-400 hover:underline"
              >
                <UserPlus className="w-3.5 h-3.5" />
                <span>+ Dar de alta nuevo cliente</span>
              </button>
            )}
          </div>

          <select
            id="inv-clienteId"
            name="clienteId"
            disabled={isLocked}
            value={clienteId}
            onChange={(e) => setClienteId(e.target.value)}
            className="ui-input py-2.5"
          >
            {clientes.length === 0 ? (
              <option value="">No hay clientes registrados. Cree uno primero.</option>
            ) : (
              clientes.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.nombreOrazonSocial} — NIF: {c.nifCif} ({c.ciudad})
                </option>
              ))
            )}
          </select>

          {selectedCliente && (
            <div className="mt-2.5 p-3 rounded-lg bg-slate-50 dark:bg-slate-950/70 border border-slate-200 dark:border-slate-800 text-xs text-slate-600 dark:text-slate-300 flex flex-wrap gap-x-6 gap-y-1">
              <div>
                <span className="font-semibold text-slate-800 dark:text-slate-100">Domicilio fiscal: </span>
                {selectedCliente.direccionFiscal}, {selectedCliente.codigoPostal} {selectedCliente.ciudad}
              </div>
              <div>
                <span className="font-semibold text-slate-800 dark:text-slate-100">NIF/CIF: </span>
                <span className="font-mono">{selectedCliente.nifCif}</span>
              </div>
              {selectedCliente.email && (
                <div>
                  <span className="font-semibold text-slate-800 dark:text-slate-100">Email: </span>
                  {selectedCliente.email}
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* SECCIÓN 2: LÍNEAS DE FACTURA */}
      <div className="ui-card p-6 space-y-4">
        <div className="flex items-center justify-between pb-2 border-b border-slate-100 dark:border-slate-800">
          <h2 className="text-xs font-bold uppercase tracking-wider text-slate-600 dark:text-slate-400">
            2. Conceptos y Líneas de Factura
          </h2>
          {!isLocked && (
            <button
              type="button"
              onClick={handleAddLine}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-brand-700 dark:text-brand-300 bg-brand-50 dark:bg-brand-950/60 hover:bg-brand-100 dark:hover:bg-brand-900/60 border border-brand-200 dark:border-brand-800 rounded-lg transition-colors"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Añadir Concepto</span>
            </button>
          )}
        </div>

        <div className="space-y-3">
          {lineas.map((linea, idx) => (
            <div
              key={linea.id}
              className="p-3.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/70 dark:bg-slate-950/60 space-y-3"
            >
              <div className="grid grid-cols-1 md:grid-cols-12 gap-3 items-start">
                <div className="md:col-span-5">
                  <label htmlFor={`lin-desc-${idx}`} className="block text-[11px] font-semibold text-slate-600 dark:text-slate-400 mb-1">
                    Descripción del servicio o producto *
                  </label>
                  <input
                    id={`lin-desc-${idx}`}
                    name={`descripcion-${idx}`}
                    type="text"
                    disabled={isLocked}
                    required
                    value={linea.descripcion}
                    onChange={(e) => handleLineChange(linea.id, 'descripcion', e.target.value)}
                    placeholder="ej. Desarrollo e implantación de plataforma..."
                    className="ui-input py-1.5 text-xs sm:text-sm"
                  />
                </div>

                <div className="md:col-span-1">
                  <label htmlFor={`lin-cant-${idx}`} className="block text-[11px] font-semibold text-slate-600 dark:text-slate-400 mb-1">
                    Cant.
                  </label>
                  <input
                    id={`lin-cant-${idx}`}
                    name={`cantidad-${idx}`}
                    type="number"
                    min="0"
                    step="any"
                    disabled={isLocked}
                    value={linea.cantidad}
                    onChange={(e) => handleLineChange(linea.id, 'cantidad', parseFloat(e.target.value) || 0)}
                    className="ui-input px-2 py-1.5 text-xs sm:text-sm text-right font-mono"
                  />
                </div>

                <div className="md:col-span-2">
                  <label htmlFor={`lin-precio-${idx}`} className="block text-[11px] font-semibold text-slate-600 dark:text-slate-400 mb-1">
                    Precio Unit. (€)
                  </label>
                  <input
                    id={`lin-precio-${idx}`}
                    name={`precio-${idx}`}
                    type="number"
                    min="0"
                    step="0.01"
                    disabled={isLocked}
                    value={linea.precioUnitario}
                    onChange={(e) => handleLineChange(linea.id, 'precioUnitario', parseFloat(e.target.value) || 0)}
                    className="ui-input px-2 py-1.5 text-xs sm:text-sm text-right font-mono"
                  />
                </div>

                <div className="md:col-span-1">
                  <label htmlFor={`lin-dto-${idx}`} className="block text-[11px] font-semibold text-slate-600 dark:text-slate-400 mb-1">
                    Dto %
                  </label>
                  <input
                    id={`lin-dto-${idx}`}
                    name={`descuento-${idx}`}
                    type="number"
                    min="0"
                    max="100"
                    step="1"
                    disabled={isLocked}
                    value={linea.descuentoPorcentaje}
                    onChange={(e) => handleLineChange(linea.id, 'descuentoPorcentaje', parseFloat(e.target.value) || 0)}
                    className="ui-input px-2 py-1.5 text-xs sm:text-sm text-right font-mono"
                  />
                </div>

                <div className="md:col-span-1">
                  <label htmlFor={`lin-iva-${idx}`} className="block text-[11px] font-semibold text-slate-600 dark:text-slate-400 mb-1">
                    IVA %
                  </label>
                  <select
                    id={`lin-iva-${idx}`}
                    name={`iva-${idx}`}
                    disabled={isLocked}
                    value={linea.tipoIva}
                    onChange={(e) => handleLineChange(linea.id, 'tipoIva', Number(e.target.value))}
                    className="ui-input px-1.5 py-1.5 text-xs sm:text-sm text-right font-mono"
                  >
                    <option value={21}>21%</option>
                    <option value={10}>10%</option>
                    <option value={4}>4%</option>
                    <option value={0}>0%</option>
                  </select>
                </div>

                <div className="md:col-span-2 flex items-center justify-between gap-2 pt-5 md:pt-0">
                  <div className="text-right flex-1">
                    <span className="block text-[10px] text-slate-500 dark:text-slate-400">
                      Base: {formatCurrency(linea.baseImponible)}
                    </span>
                    <span className="font-bold text-sm text-slate-900 dark:text-white font-mono">
                      {formatCurrency(linea.totalLinea)}
                    </span>
                  </div>

                  {!isLocked && (
                    <button
                      type="button"
                      onClick={() => handleRemoveLine(linea.id)}
                      className="p-1.5 text-slate-400 hover:text-red-600 dark:hover:text-red-400 hover:bg-red-50 dark:hover:bg-red-950/40 rounded-lg transition-colors shrink-0"
                      title="Eliminar línea"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* SECCIÓN 3: CONDICIONES DE PAGO Y RESUMEN ECONÓMICO */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="ui-card p-6 space-y-4">
          <h2 className="text-xs font-bold uppercase tracking-wider text-slate-600 dark:text-slate-400 pb-2 border-b border-slate-100 dark:border-slate-800">
            3. Condiciones de Pago y Retención IRPF
          </h2>

          <div>
            <label htmlFor="inv-formaPago" className="ui-label">
              Forma de Pago
            </label>
            <input
              id="inv-formaPago"
              name="formaPago"
              type="text"
              disabled={isLocked}
              value={formaPago}
              onChange={(e) => setFormaPago(e.target.value)}
              placeholder="ej. Transferencia bancaria a 30 días"
              className="ui-input"
            />
          </div>

          <div>
            <label htmlFor="inv-retencionIrpf" className="ui-label">
              Retención de IRPF
            </label>
            <select
              id="inv-retencionIrpf"
              name="retencionIrpf"
              disabled={isLocked}
              value={retencionIrpfPorcentaje}
              onChange={(e) => setRetencionIrpfPorcentaje(Number(e.target.value))}
              className="ui-input"
            >
              <option value={0}>Sin retención (0%) — Sociedades Mercantiles</option>
              <option value={15}>15% — Actividades profesionales (Tipo general)</option>
              <option value={7}>7% — Inicio de actividad profesional</option>
              <option value={19}>19% — Arrendamiento de inmuebles urbanos</option>
            </select>
          </div>

          <div>
            <label htmlFor="inv-observaciones" className="ui-label">
              Observaciones y Notas en Factura
            </label>
            <textarea
              id="inv-observaciones"
              name="observaciones"
              rows={2}
              disabled={isLocked}
              value={observaciones}
              onChange={(e) => setObservaciones(e.target.value)}
              className="ui-input"
            />
          </div>
        </div>

        <div className="ui-card p-6 flex flex-col justify-between">
          <div>
            <h2 className="text-xs font-bold uppercase tracking-wider text-slate-600 dark:text-slate-400 pb-2 border-b border-slate-100 dark:border-slate-800 mb-4">
              4. Liquidación e Impuestos
            </h2>

            <div className="space-y-2.5 text-xs text-slate-600 dark:text-slate-300">
              <div className="flex justify-between">
                <span>Subtotal Bruto:</span>
                <span className="font-mono text-slate-900 dark:text-white">{formatCurrency(calculatedTotals.subtotalBruto)}</span>
              </div>

              {calculatedTotals.descuentoTotal > 0 && (
                <div className="flex justify-between text-amber-700 dark:text-amber-400">
                  <span>Descuentos aplicados:</span>
                  <span className="font-mono">-{formatCurrency(calculatedTotals.descuentoTotal)}</span>
                </div>
              )}

              <div className="flex justify-between font-semibold text-slate-900 dark:text-white pt-2 border-t border-slate-100 dark:border-slate-800">
                <span>Base Imponible Total:</span>
                <span className="font-mono">{formatCurrency(calculatedTotals.baseImponibleTotal)}</span>
              </div>

              {calculatedTotals.desgloseIva.map((item) => (
                <div key={item.tipo} className="flex justify-between pl-2.5 border-l-2 border-brand-500">
                  <span>Cuota IVA {item.tipo}% (s/ {formatCurrency(item.base)}):</span>
                  <span className="font-mono text-slate-900 dark:text-white">{formatCurrency(item.cuota)}</span>
                </div>
              ))}

              <div className="flex justify-between text-slate-700 dark:text-slate-200">
                <span>Cuota IVA Total:</span>
                <span className="font-mono font-semibold">{formatCurrency(calculatedTotals.cuotaIvaTotal)}</span>
              </div>

              {calculatedTotals.retencionIrpfPorcentaje > 0 && (
                <div className="flex justify-between text-red-700 dark:text-red-400 font-medium">
                  <span>Retención IRPF ({calculatedTotals.retencionIrpfPorcentaje}%):</span>
                  <span className="font-mono">-{formatCurrency(calculatedTotals.importeRetencionIrpf)}</span>
                </div>
              )}
            </div>
          </div>

          <div className="mt-6 pt-4 border-t border-slate-200 dark:border-slate-800">
            <div className="p-4 rounded-xl bg-brand-900 dark:bg-brand-950 border border-brand-800 text-white flex items-center justify-between">
              <div>
                <span className="text-[10px] uppercase tracking-wider text-brand-200 font-semibold block">
                  Total Final a Pagar
                </span>
                <span className="text-2xl font-bold font-mono tracking-tight text-white">
                  {formatCurrency(calculatedTotals.totalFinal)}
                </span>
              </div>

              <div className="text-right">
                <span className="text-[10px] text-brand-200 block">Divisa</span>
                <span className="text-xs font-semibold uppercase text-brand-100">EUR (€)</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Modal para crear cliente inline */}
      <ClientModal
        isOpen={isClientModalOpen}
        existingClientes={clientes}
        onClose={() => setIsClientModalOpen(false)}
        onSave={async (data) => {
          const nuevo = await onCreateClienteInline(data);
          setClienteId(nuevo.id);
        }}
      />
    </div>
  );
};
