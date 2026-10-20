import React, { useState, useEffect } from 'react';
import type { Factura } from '../../types';
import { X, AlertTriangle, FileText } from 'lucide-react';

interface RectifyModalProps {
  factura: Factura | null;
  isOpen: boolean;
  onClose: () => void;
  onConfirmRectify: (facturaId: string, motivo: string) => void;
}

export const RectifyModal: React.FC<RectifyModalProps> = ({
  factura,
  isOpen,
  onClose,
  onConfirmRectify,
}) => {
  const [motivo, setMotivo] = useState('Anulación por error en los conceptos facturados');
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (factura) {
      setMotivo('Anulación por error en los conceptos facturados');
      setError(null);
    }
  }, [factura]);

  if (!isOpen || !factura) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!motivo.trim()) {
      setError('Debe especificar el motivo legal de la rectificación.');
      return;
    }
    onConfirmRectify(factura.id, motivo.trim());
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-3 sm:p-6 animate-fadeIn">
      <div className="bg-white dark:bg-slate-900 rounded-2xl max-w-md w-full shadow-modal border border-slate-200 dark:border-slate-800 overflow-hidden flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200 dark:border-slate-800 bg-purple-50/80 dark:bg-purple-950/30">
          <div className="flex items-center gap-2.5 text-purple-900 dark:text-purple-200">
            <FileText className="w-5 h-5 text-purple-700 dark:text-purple-400" />
            <h2 className="text-base font-bold">Emitir Factura Rectificativa</h2>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 rounded-lg hover:bg-slate-200 dark:hover:bg-slate-800"
            aria-label="Cerrar modal"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div className="p-3.5 bg-purple-50 dark:bg-purple-950/40 border border-purple-200 dark:border-purple-900/60 rounded-xl text-xs text-purple-900 dark:text-purple-200 space-y-1">
            <p className="font-bold flex items-center gap-1.5">
              <AlertTriangle className="w-4 h-4 text-purple-700 dark:text-purple-400" />
              <span>Procedimiento de rectificación (RD 1619/2012)</span>
            </p>
            <p>
              Se generará una nueva factura en la <strong>Serie R</strong> referenciando a la factura <strong>{factura.numero}</strong> con importes compensatorios negativos y la original pasará al estado de Rectificada.
            </p>
          </div>

          {error && <p className="text-xs text-red-600 dark:text-red-400 font-semibold">{error}</p>}

          <div>
            <label htmlFor="rectify-motivo" className="ui-label">
              Motivo de la Rectificación *
            </label>
            <textarea
              id="rectify-motivo"
              name="motivo"
              rows={3}
              required
              value={motivo}
              onChange={(e) => {
                setMotivo(e.target.value);
                setError(null);
              }}
              className="ui-input"
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
              className="px-4 py-2 bg-purple-700 text-white rounded-lg text-xs font-semibold hover:bg-purple-800 shadow-subtle transition-colors"
            >
              Generar Factura Rectificativa
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
