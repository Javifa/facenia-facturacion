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

  // Obtener fecha actual en formato local ISO YYYY-MM-DD
  const getTodayISO = () => new Date().toISOString().split('T')[0] ?? '';
  const getDue30Days = () => {
    const d = new Date();
    d.setDate(d.getDate() + 30);
    return d.toISOString().split('T')[0] ?? '';
  };

  // Estado general de la factura
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

  // Modal para crear cliente inline
  const [isClientModalOpen, setIsClientModalOpen] = useState(false);

  // Líneas de factura
  const [lineas, setLineas] = useState<FacturaLinea[]>(() => {
    if (facturaToEdit?.lineas?.length) {
      return facturaToEdit.lineas;
    }
    return [
      {
        id: `lin-${Date.now()}-1`,
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

  // Si es nueva factura, calcular el siguiente número consecutivo de la serie
  useEffect(() => {
    if (!isEditing && !numero) {
      const { numero: nextNum, secuencial } = storageService.getNextInvoiceNumber(facturas, serie);
      setNumero(nextNum);
      setNumeroSecuencial(secuencial);
    }
  }, [serie, isEditing, numero, facturas]);

  // Manejo dinámico de líneas
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

  // Cálculos automáticos centralizados en tiempo real
  const calculatedTotals = useMemo(() => {
    return calculateInvoiceTotals(lineas, retencionIrpfPorcentaje, facturaToEdit?.pagos || []);
  }, [lineas, retencionIrpfPorcentaje, facturaToEdit?.pagos]);

  // Cliente seleccionado actual
  const selectedCliente = useMemo(() => {
    return clientes.find((c) => c.id === clienteId);
  }, [clientes, clienteId]);

  // Preparar objeto de factura para guardar o previsualizar
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
      nombreComercial: empresaConfig.nombreComercial,
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
      logotipoUrl: empresaConfig.logotipoUrl,
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
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-2 border-b border-slate-200">
        <div className="flex items-center gap-3">
          <button
            onClick={onCancel}
            className="p-1.5 text-slate-500 hover:text-slate-800 hover:bg-slate-200 rounded-lg transition-colors"
            title="Volver"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div>
            <h1 className="text-2xl font-bold text-slate-900 tracking-tight">
              {isEditing
                ? `Editar Factura: ${facturaToEdit?.numero}`
                : 'Nueva Factura'}
            </h1>
            <p className="text-sm text-slate-500">
              {isLocked
                ? 'Factura emitida. Solo lectura de conceptos para preservar la integridad documental.'
                : 'Complete los datos fiscales y conceptos para emitir o guardar borrador.'}
            </p>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <button
            type="button"
            onClick={handlePreviewClick}
            className="inline-flex items-center gap-2 px-3.5 py-2 text-xs font-semibold text-slate-700 bg-white border border-slate-300 rounded-lg hover:bg-slate-50 shadow-subtle"
          >
            <Eye className="w-3.5 h-3.5 text-slate-500" />
            <span>Vista Previa PDF</span>
          </button>

          {!isLocked && (
            <>
              <button
                type="button"
                onClick={() => handleSave('borrador')}
                className="inline-flex items-center gap-2 px-4 py-2 text-xs font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-lg shadow-subtle"
              >
                <Save className="w-3.5 h-3.5 text-slate-600" />
                <span>Guardar Borrador</span>
              </button>
              <button
                type="button"
                onClick={() => handleSave('pendiente_cobro')}
                className="inline-flex items-center gap-2 px-4 py-2 text-xs font-semibold text-white bg-brand-600 hover:bg-brand-700 rounded-lg shadow-subtle focus:ring-2 focus:ring-brand-500"
              >
                <CheckCircle className="w-3.5 h-3.5" />
                <span>Emitir Factura</span>
              </button>
            </>
          )}
        </div>
      </div>

      {errorMsg && (
        <div className="p-4 bg-red-50 border border-red-200 rounded-xl text-xs sm:text-sm text-red-800 flex items-start gap-2.5 animate-fadeIn">
          <AlertCircle className="w-5 h-5 text-red-600 shrink-0 mt-0.5" />
          <span>{errorMsg}</span>
        </div>
      )}

      {isLocked && (
        <div className="p-4 bg-blue-50 border border-blue-200 rounded-xl text-xs sm:text-sm text-brand-900 flex items-start gap-2.5">
          <HelpCircle className="w-5 h-5 text-brand-600 shrink-0 mt-0.5" />
          <div>
            <strong>Documento Emitido Inmutable:</strong> Según la normativa fiscal española (Real Decreto 1619/2012), las facturas emitidas no deben modificarse arbitrariamente. Si necesita corregir un error en importes o conceptos, genere una Factura Rectificativa desde el historial.
          </div>
        </div>
      )}

      {/* SECCIÓN 1: DATOS GENERALES Y CLIENTE */}
      <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-card space-y-5">
        <h2 className="text-sm font-bold uppercase tracking-wider text-slate-700 pb-2 border-b border-slate-100">
          1. Datos de Emisión y Cliente
        </h2>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div>
            <label htmlFor="inv-serie" className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
              Serie
            </label>
            <input
              id="inv-serie"
              name="serie"
              type="text"
              disabled={isLocked}
              value={serie}
              onChange={(e) => setSerie(e.target.value)}
              className="w-full px-3 py-2 text-sm bg-slate-50 border border-slate-300 rounded-lg font-mono disabled:opacity-60 focus:ring-2 focus:ring-brand-500 focus:outline-none"
            />
          </div>

          <div>
            <label htmlFor="inv-numero" className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
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
              className="w-full px-3 py-2 text-sm bg-slate-50 border border-slate-300 rounded-lg font-mono font-bold text-slate-900 disabled:opacity-60 focus:ring-2 focus:ring-brand-500 focus:outline-none"
            />
          </div>

          <div>
            <label htmlFor="inv-moneda" className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
              Moneda
            </label>
            <input
              id="inv-moneda"
              name="moneda"
              type="text"
              disabled
              value="EUR (€) — Euro"
              className="w-full px-3 py-2 text-sm bg-slate-100 border border-slate-200 rounded-lg text-slate-600 cursor-not-allowed"
            />
          </div>

          <div>
            <label htmlFor="inv-fechaEmision" className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
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
              className="w-full px-3 py-2 text-sm bg-slate-50 border border-slate-300 rounded-lg disabled:opacity-60 focus:ring-2 focus:ring-brand-500 focus:outline-none"
            />
          </div>

          <div>
            <label htmlFor="inv-fechaOperacion" className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
              Fecha de Operación (Opcional)
            </label>
            <input
              id="inv-fechaOperacion"
              name="fechaOperacion"
              type="date"
              disabled={isLocked}
              value={fechaOperacion}
              onChange={(e) => setFechaOperacion(e.target.value)}
              className="w-full px-3 py-2 text-sm bg-slate-50 border border-slate-300 rounded-lg disabled:opacity-60 focus:ring-2 focus:ring-brand-500 focus:outline-none"
            />
          </div>

          <div>
            <label htmlFor="inv-fechaVencimiento" className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
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
              className="w-full px-3 py-2 text-sm bg-slate-50 border border-slate-300 rounded-lg disabled:opacity-60 focus:ring-2 focus:ring-brand-500 focus:outline-none"
            />
          </div>
        </div>

        {/* Selección de Cliente con botón inline */}
        <div className="pt-2">
          <div className="flex items-center justify-between mb-1.5">
            <label htmlFor="inv-clienteId" className="block text-xs font-semibold text-slate-700 uppercase tracking-wider">
              Cliente Destinatario *
            </label>
            {!isLocked && (
              <button
                type="button"
                onClick={() => setIsClientModalOpen(true)}
                className="inline-flex items-center gap-1 text-xs font-semibold text-brand-600 hover:text-brand-800"
              >
                <UserPlus className="w-3.5 h-3.5" />
                <span>+ Crear cliente nuevo</span>
              </button>
            )}
          </div>

          <select
            id="inv-clienteId"
            name="clienteId"
            disabled={isLocked}
            value={clienteId}
            onChange={(e) => setClienteId(e.target.value)}
            className="w-full px-3.5 py-2.5 text-sm bg-slate-50 border border-slate-300 rounded-lg disabled:opacity-60 focus:ring-2 focus:ring-brand-500 focus:outline-none"
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

          {/* Ficha rápida de cliente seleccionado */}
          {selectedCliente && (
            <div className="mt-2.5 p-3 rounded-lg bg-slate-50 border border-slate-200 text-xs text-slate-600 flex flex-wrap gap-x-6 gap-y-1">
              <div>
                <span className="font-semibold text-slate-800">Dirección: </span>
                {selectedCliente.direccionFiscal}, {selectedCliente.codigoPostal} {selectedCliente.ciudad}
              </div>
              <div>
                <span className="font-semibold text-slate-800">NIF/CIF: </span>
                <span className="font-mono">{selectedCliente.nifCif}</span>
              </div>
              {selectedCliente.email && (
                <div>
                  <span className="font-semibold text-slate-800">Email: </span>
                  {selectedCliente.email}
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* SECCIÓN 2: LÍNEAS DE FACTURA */}
      <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-card space-y-4">
        <div className="flex items-center justify-between pb-2 border-b border-slate-100">
          <h2 className="text-sm font-bold uppercase tracking-wider text-slate-700">
            2. Conceptos y Líneas de Factura
          </h2>
          {!isLocked && (
            <button
              type="button"
              onClick={handleAddLine}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-brand-600 bg-brand-50 hover:bg-brand-100 rounded-lg transition-colors"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Añadir Concepto</span>
            </button>
          )}
        </div>

        <div className="space-y-3">
          {lineas.map((linea) => (
            <div
              key={linea.id}
              className="p-3.5 rounded-lg border border-slate-200 bg-slate-50/70 hover:bg-slate-50 transition-colors space-y-3"
            >
              <div className="grid grid-cols-1 md:grid-cols-12 gap-3 items-start">
                {/* Concepto / Descripción */}
                <div className="md:col-span-5">
                  <label className="block text-[11px] font-semibold text-slate-600 mb-1">
                    Descripción del servicio o producto *
                  </label>
                  <input
                    type="text"
                    disabled={isLocked}
                    required
                    value={linea.descripcion}
                    onChange={(e) => handleLineChange(linea.id, 'descripcion', e.target.value)}
                    placeholder="ej. Consultoría técnica, desarrollo de portal..."
                    className="w-full px-3 py-1.5 text-xs sm:text-sm bg-white border border-slate-300 rounded-lg focus:ring-2 focus:ring-brand-500 focus:outline-none"
                  />
                </div>

                {/* Cantidad */}
                <div className="md:col-span-1">
                  <label className="block text-[11px] font-semibold text-slate-600 mb-1">
                    Cant.
                  </label>
                  <input
                    type="number"
                    min="0"
                    step="any"
                    disabled={isLocked}
                    value={linea.cantidad}
                    onChange={(e) => handleLineChange(linea.id, 'cantidad', parseFloat(e.target.value) || 0)}
                    className="w-full px-2 py-1.5 text-xs sm:text-sm bg-white border border-slate-300 rounded-lg text-right font-mono focus:ring-2 focus:ring-brand-500 focus:outline-none"
                  />
                </div>

                {/* Precio Unitario */}
                <div className="md:col-span-2">
                  <label className="block text-[11px] font-semibold text-slate-600 mb-1">
                    Precio Unit. (€)
                  </label>
                  <input
                    type="number"
                    min="0"
                    step="0.01"
                    disabled={isLocked}
                    value={linea.precioUnitario}
                    onChange={(e) => handleLineChange(linea.id, 'precioUnitario', parseFloat(e.target.value) || 0)}
                    className="w-full px-2 py-1.5 text-xs sm:text-sm bg-white border border-slate-300 rounded-lg text-right font-mono focus:ring-2 focus:ring-brand-500 focus:outline-none"
                  />
                </div>

                {/* Descuento % */}
                <div className="md:col-span-1">
                  <label className="block text-[11px] font-semibold text-slate-600 mb-1">
                    Dto %
                  </label>
                  <input
                    type="number"
                    min="0"
                    max="100"
                    step="1"
                    disabled={isLocked}
                    value={linea.descuentoPorcentaje}
                    onChange={(e) => handleLineChange(linea.id, 'descuentoPorcentaje', parseFloat(e.target.value) || 0)}
                    className="w-full px-2 py-1.5 text-xs sm:text-sm bg-white border border-slate-300 rounded-lg text-right font-mono focus:ring-2 focus:ring-brand-500 focus:outline-none"
                  />
                </div>

                {/* Tipo IVA */}
                <div className="md:col-span-1">
                  <label className="block text-[11px] font-semibold text-slate-600 mb-1">
                    IVA %
                  </label>
                  <select
                    disabled={isLocked}
                    value={linea.tipoIva}
                    onChange={(e) => handleLineChange(linea.id, 'tipoIva', Number(e.target.value))}
                    className="w-full px-1.5 py-1.5 text-xs sm:text-sm bg-white border border-slate-300 rounded-lg text-right font-mono focus:ring-2 focus:ring-brand-500 focus:outline-none"
                  >
                    <option value={21}>21%</option>
                    <option value={10}>10%</option>
                    <option value={4}>4%</option>
                    <option value={0}>0%</option>
                  </select>
                </div>

                {/* Total Línea y Botón borrar */}
                <div className="md:col-span-2 flex items-center justify-between gap-2 pt-5 md:pt-0">
                  <div className="text-right flex-1">
                    <span className="block text-[10px] text-slate-500">Base: {formatCurrency(linea.baseImponible)}</span>
                    <span className="font-bold text-sm text-slate-900 font-mono">
                      {formatCurrency(linea.totalLinea)}
                    </span>
                  </div>

                  {!isLocked && (
                    <button
                      type="button"
                      onClick={() => handleRemoveLine(linea.id)}
                      className="p-1.5 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors shrink-0"
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
        {/* Lado izquierdo: Forma de Pago y Retención */}
        <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-card space-y-4">
          <h2 className="text-sm font-bold uppercase tracking-wider text-slate-700 pb-2 border-b border-slate-100">
            3. Pago y Retención IRPF
          </h2>

          <div>
            <label htmlFor="inv-formaPago" className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
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
              className="w-full px-3 py-2 text-sm bg-slate-50 border border-slate-300 rounded-lg focus:ring-2 focus:ring-brand-500 focus:outline-none"
            />
          </div>

          <div>
            <label htmlFor="inv-retencionIrpf" className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
              Retención de IRPF (Autónomos / Servicios Profesionales)
            </label>
            <select
              id="inv-retencionIrpf"
              name="retencionIrpf"
              disabled={isLocked}
              value={retencionIrpfPorcentaje}
              onChange={(e) => setRetencionIrpfPorcentaje(Number(e.target.value))}
              className="w-full px-3 py-2 text-sm bg-slate-50 border border-slate-300 rounded-lg focus:ring-2 focus:ring-brand-500 focus:outline-none"
            >
              <option value={0}>Sin retención (0%) — Sociedades o personas jurídicas</option>
              <option value={15}>15% — Tipo general profesional independiente</option>
              <option value={7}>7% — Nuevos autónomos (primeros 3 años)</option>
              <option value={19}>19% — Arrendamientos / otros rendimientos</option>
            </select>
            <p className="text-[11px] text-slate-500 mt-1">
              En España, la retención de IRPF se deduce de la base imponible total.
            </p>
          </div>

          <div>
            <label htmlFor="inv-observaciones" className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
              Observaciones y Notas
            </label>
            <textarea
              id="inv-observaciones"
              name="observaciones"
              rows={2}
              disabled={isLocked}
              value={observaciones}
              onChange={(e) => setObservaciones(e.target.value)}
              className="w-full px-3 py-2 text-sm bg-slate-50 border border-slate-300 rounded-lg focus:ring-2 focus:ring-brand-500 focus:outline-none"
            />
          </div>
        </div>

        {/* Lado derecho: Desglose Matemático y Total */}
        <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-card flex flex-col justify-between">
          <div>
            <h2 className="text-sm font-bold uppercase tracking-wider text-slate-700 pb-2 border-b border-slate-100 mb-4">
              4. Desglose Liquidación Fiscal
            </h2>

            <div className="space-y-2.5 text-xs text-slate-600">
              <div className="flex justify-between">
                <span>Subtotal Bruto:</span>
                <span className="font-mono text-slate-800">{formatCurrency(calculatedTotals.subtotalBruto)}</span>
              </div>

              {calculatedTotals.descuentoTotal > 0 && (
                <div className="flex justify-between text-amber-700">
                  <span>Descuentos aplicados:</span>
                  <span className="font-mono">-{formatCurrency(calculatedTotals.descuentoTotal)}</span>
                </div>
              )}

              <div className="flex justify-between font-semibold text-slate-800 pt-1 border-t border-slate-100">
                <span>Base Imponible Total:</span>
                <span className="font-mono">{formatCurrency(calculatedTotals.baseImponibleTotal)}</span>
              </div>

              {/* Detalle por tipos de IVA */}
              {calculatedTotals.desgloseIva.map((item) => (
                <div key={item.tipo} className="flex justify-between pl-2 border-l-2 border-brand-300">
                  <span>Cuota IVA {item.tipo}% (s/ {formatCurrency(item.base)}):</span>
                  <span className="font-mono text-slate-800">{formatCurrency(item.cuota)}</span>
                </div>
              ))}

              <div className="flex justify-between text-slate-700">
                <span>Cuota IVA Total:</span>
                <span className="font-mono font-semibold">{formatCurrency(calculatedTotals.cuotaIvaTotal)}</span>
              </div>

              {calculatedTotals.retencionIrpfPorcentaje > 0 && (
                <div className="flex justify-between text-red-700 font-medium">
                  <span>Retención IRPF ({calculatedTotals.retencionIrpfPorcentaje}%):</span>
                  <span className="font-mono">-{formatCurrency(calculatedTotals.importeRetencionIrpf)}</span>
                </div>
              )}
            </div>
          </div>

          <div className="mt-6 pt-4 border-t border-slate-200">
            <div className="p-4 rounded-xl bg-slate-900 text-white flex items-center justify-between">
              <div>
                <span className="text-[10px] uppercase tracking-wider text-slate-400 font-semibold block">
                  Total Final Factura
                </span>
                <span className="text-2xl font-bold font-mono tracking-tight text-white">
                  {formatCurrency(calculatedTotals.totalFinal)}
                </span>
              </div>

              <div className="text-right">
                <span className="text-[10px] text-slate-400 block">Moneda</span>
                <span className="text-xs font-semibold uppercase text-brand-300">EUR (€)</span>
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
