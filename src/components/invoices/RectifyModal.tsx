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
      <div className="bg-white rounded-2xl max-w-md w-full shadow-modal border border-slate-200 overflow-hidden flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200 bg-purple-50/80">
          <div className="flex items-center gap-2.5 text-purple-900">
            <FileText className="w-5 h-5 text-purple-700" />
            <h2 className="text-base font-bold">Emitir Factura Rectificativa</h2>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-slate-600 rounded-lg hover:bg-slate-200"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div className="p-3.5 bg-purple-50 border border-purple-200 rounded-xl text-xs text-purple-900 space-y-1">
            <p className="font-bold flex items-center gap-1.5">
              <AlertTriangle className="w-4 h-4 text-purple-700" />
              <span>Procedimiento de rectificación (RD 1619/2012)</span>
            </p>
            <p>
              Se generará una nueva factura en la <strong>Serie R</strong> referenciando a la factura <strong>{factura.numero}</strong> con importes compensatorios negativos y la original pasará al estado de Rectificada.
            </p>
          </div>

          {error && <p className="text-xs text-red-600 font-semibold">{error}</p>}

          <div>
            <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
              Motivo de la Rectificación *
            </label>
            <textarea
              rows={3}
              required
              value={motivo}
              onChange={(e) => {
                setMotivo(e.target.value);
                setError(null);
              }}
              className="w-full px-3 py-2 text-xs sm:text-sm bg-slate-50 border border-slate-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:outline-none"
            />
          </div>

          <div className="flex justify-end gap-3 pt-3 border-t border-slate-100">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-xs font-medium text-slate-600 hover:text-slate-800"
            >
              Cancelar
            </button>
            <button
              type="submit"
              className="px-4 py-2 bg-purple-700 text-white rounded-lg text-xs font-semibold hover:bg-purple-800 shadow-subtle"
            >
              Generar Factura Rectificativa
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
