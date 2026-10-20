import React, { useState, useEffect } from 'react';
import type { Factura } from '../../types';
import { formatCurrency, formatDate } from '../../utils/taxCalculator';
import { X, CreditCard, CheckCircle, AlertCircle } from 'lucide-react';

interface PaymentModalProps {
  factura: Factura | null;
  isOpen: boolean;
  onClose: () => void;
  onAddPago: (
    facturaId: string,
    pago: { fecha: string; importe: number; metodo: string; referencia?: string; notas?: string }
  ) => void;
}

export const PaymentModal: React.FC<PaymentModalProps> = ({
  factura,
  isOpen,
  onClose,
  onAddPago,
}) => {
  const [importe, setImporte] = useState('0');
  const [fecha, setFecha] = useState(() => new Date().toISOString().split('T')[0] ?? '');
  const [metodo, setMetodo] = useState('Transferencia bancaria');
  const [referencia, setReferencia] = useState('');
  const [notas, setNotas] = useState('');
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (factura) {
      setImporte(factura.importePendiente.toString());
      setFecha(new Date().toISOString().split('T')[0] ?? '');
      setMetodo('Transferencia bancaria');
      setReferencia('');
      setNotas('');
      setError(null);
    }
  }, [factura]);

  if (!isOpen || !factura) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    const numImporte = parseFloat(importe);
    if (isNaN(numImporte) || numImporte <= 0) {
      setError('El importe debe ser superior a 0.');
      return;
    }
    if (numImporte > factura.importePendiente) {
      setError(`El importe a registrar (${formatCurrency(numImporte)}) excede el saldo pendiente (${formatCurrency(factura.importePendiente)}).`);
      return;
    }

    onAddPago(factura.id, {
      fecha,
      importe: numImporte,
      metodo,
      referencia: referencia.trim() || undefined,
      notas: notas.trim() || undefined,
    });
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-3 sm:p-6 animate-fadeIn">
      <div className="bg-white dark:bg-slate-900 rounded-2xl max-w-lg w-full shadow-modal border border-slate-200 dark:border-slate-800 overflow-hidden flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200 dark:border-slate-800 bg-slate-50/80 dark:bg-slate-800/50">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400">
              <CreditCard className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-slate-900 dark:text-white">
                Registrar Cobro: {factura.numero}
              </h2>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                {factura.clienteSnapshot.nombreOrazonSocial}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 rounded-lg hover:bg-slate-200 dark:hover:bg-slate-800 transition-colors"
            aria-label="Cerrar modal"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Resumen de cobros */}
        <div className="p-4 bg-slate-50 dark:bg-slate-800/40 border-b border-slate-200 dark:border-slate-800 grid grid-cols-3 gap-2 text-center text-xs">
          <div>
            <span className="text-slate-500 dark:text-slate-400 block">Total Factura</span>
            <span className="font-bold font-mono text-slate-800 dark:text-slate-100">{formatCurrency(factura.totalFinal)}</span>
          </div>
          <div>
            <span className="text-slate-500 dark:text-slate-400 block">Ya Cobrado</span>
            <span className="font-bold font-mono text-emerald-600 dark:text-emerald-400">{formatCurrency(factura.importeCobrado)}</span>
          </div>
          <div>
            <span className="text-slate-500 dark:text-slate-400 block">Saldo Pendiente</span>
            <span className="font-bold font-mono text-amber-600 dark:text-amber-400">{formatCurrency(factura.importePendiente)}</span>
          </div>
        </div>

        {/* Historial de pagos ya registrados */}
        {factura.pagos.length > 0 && (
          <div className="p-4 border-b border-slate-100 dark:border-slate-800 max-h-32 overflow-y-auto">
            <p className="text-[11px] font-semibold uppercase text-slate-500 dark:text-slate-400 mb-2">Historial de Cobros</p>
            <div className="space-y-1.5">
              {factura.pagos.map((p) => (
                <div key={p.id} className="text-xs flex justify-between p-2 rounded bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-200">
                  <span>{formatDate(p.fecha)} · {p.metodo} {p.referencia ? `(${p.referencia})` : ''}</span>
                  <span className="font-bold font-mono text-emerald-700 dark:text-emerald-400">{formatCurrency(p.importe)}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Formulario */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {error && (
            <div className="p-3 bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-900/60 rounded-lg text-xs text-red-800 dark:text-red-300 flex items-start gap-2">
              <AlertCircle className="w-4 h-4 text-red-600 dark:text-red-400 shrink-0 mt-0.5" />
              <span>{error}</span>
            </div>
          )}

          <div>
            <label htmlFor="pago-importe" className="ui-label">
              Importe a Cobrar (€) *
            </label>
            <input
              id="pago-importe"
              name="importe"
              type="number"
              step="0.01"
              required
              max={factura.importePendiente}
              value={importe}
              onChange={(e) => setImporte(e.target.value)}
              className="ui-input text-base font-bold font-mono"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label htmlFor="pago-fecha" className="ui-label">
                Fecha de Cobro *
              </label>
              <input
                id="pago-fecha"
                name="fecha"
                type="date"
                required
                value={fecha}
                onChange={(e) => setFecha(e.target.value)}
                className="ui-input text-xs"
              />
            </div>

            <div>
              <label htmlFor="pago-metodo" className="ui-label">
                Método de Cobro
              </label>
              <select
                id="pago-metodo"
                name="metodo"
                value={metodo}
                onChange={(e) => setMetodo(e.target.value)}
                className="ui-input text-xs"
              >
                <option value="Transferencia bancaria">Transferencia bancaria</option>
                <option value="Domiciliación bancaria">Domiciliación bancaria</option>
                <option value="Tarjeta de crédito/débito">Tarjeta</option>
                <option value="Efectivo">Efectivo</option>
                <option value="Bizum / Pago digital">Bizum / Pago digital</option>
              </select>
            </div>
          </div>

          <div>
            <label htmlFor="pago-referencia" className="ui-label">
              Referencia Bancaria o Transacción (Opcional)
            </label>
            <input
              id="pago-referencia"
              name="referencia"
              type="text"
              placeholder="ej. TRF-8392183"
              value={referencia}
              onChange={(e) => setReferencia(e.target.value)}
              className="ui-input text-xs"
            />
          </div>

          <div>
            <label htmlFor="pago-notas" className="ui-label">
              Notas Adicionales
            </label>
            <input
              id="pago-notas"
              name="notas"
              type="text"
              placeholder="Observaciones sobre la conciliación..."
              value={notas}
              onChange={(e) => setNotas(e.target.value)}
              className="ui-input text-xs"
            />
          </div>

          <div className="flex justify-end gap-3 pt-3 border-t border-slate-100 dark:border-slate-800">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-xs font-medium text-slate-600 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200"
            >
              Cancelar
            </button>
            <button
              type="submit"
              className="inline-flex items-center gap-2 px-4 py-2 bg-emerald-600 text-white rounded-lg text-xs font-semibold hover:bg-emerald-700 shadow-subtle transition-colors"
            >
              <CheckCircle className="w-4 h-4" />
              <span>Confirmar Cobro</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
