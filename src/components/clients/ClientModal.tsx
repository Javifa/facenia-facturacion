import React, { useState } from 'react';
import type { Cliente } from '../../types';
import { X, Save, AlertCircle } from 'lucide-react';

interface ClientModalProps {
  cliente?: Cliente | null;
  isOpen: boolean;
  onClose: () => void;
  onSave: (clienteData: Omit<Cliente, 'id' | 'createdAt' | 'updatedAt'>) => void;
  existingClientes?: Cliente[];
}

export const ClientModal: React.FC<ClientModalProps> = ({
  cliente,
  isOpen,
  onClose,
  onSave,
  existingClientes = [],
}) => {
  const [formData, setFormData] = useState({
    nombreOrazonSocial: cliente?.nombreOrazonSocial || '',
    nifCif: cliente?.nifCif || '',
    direccionFiscal: cliente?.direccionFiscal || '',
    codigoPostal: cliente?.codigoPostal || '',
    ciudad: cliente?.ciudad || '',
    provincia: cliente?.provincia || '',
    pais: cliente?.pais || 'España',
    email: cliente?.email || '',
    telefono: cliente?.telefono || '',
    notasInternas: cliente?.notasInternas || '',
  });

  const [error, setError] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleChange = (field: string, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
    setError(null);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!formData.nombreOrazonSocial.trim()) {
      setError('El nombre o razón social es obligatorio.');
      return;
    }
    if (!formData.nifCif.trim()) {
      setError('El NIF / NIE / CIF es obligatorio para la emisión de facturas.');
      return;
    }
    if (!formData.direccionFiscal.trim()) {
      setError('La dirección fiscal es obligatoria.');
      return;
    }

    // Validación de duplicado de NIF/CIF
    const normalizedNif = formData.nifCif.trim().toUpperCase();
    const duplicado = existingClientes.find(
      (c) => c.id !== cliente?.id && c.nifCif.trim().toUpperCase() === normalizedNif
    );

    if (duplicado) {
      setError(`Ya existe un cliente registrado con el NIF/CIF "${normalizedNif}" (${duplicado.nombreOrazonSocial}).`);
      return;
    }

    onSave({
      ...formData,
      nifCif: normalizedNif,
    });
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-3 sm:p-6 animate-fadeIn">
      <div className="bg-white rounded-2xl max-w-xl w-full shadow-modal border border-slate-200 overflow-hidden flex flex-col">
        {/* Header Modal */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200 bg-slate-50/80">
          <div>
            <h2 className="text-base font-bold text-slate-900">
              {cliente ? 'Editar Ficha de Cliente' : 'Nuevo Cliente'}
            </h2>
            <p className="text-xs text-slate-500">
              Datos fiscales para emisión de facturas y control de cobros.
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-slate-600 rounded-lg hover:bg-slate-200"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {error && (
            <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-xs text-red-800 flex items-start gap-2">
              <AlertCircle className="w-4 h-4 text-red-600 shrink-0 mt-0.5" />
              <span>{error}</span>
            </div>
          )}

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="sm:col-span-2">
              <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
                Nombre o Razón Social *
              </label>
              <input
                type="text"
                required
                value={formData.nombreOrazonSocial}
                onChange={(e) => handleChange('nombreOrazonSocial', e.target.value)}
                placeholder="ej. Acero & Construcciones S.L."
                className="w-full px-3 py-2 text-sm bg-slate-50 border border-slate-300 rounded-lg focus:ring-2 focus:ring-brand-500 focus:outline-none"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
                NIF / NIE / CIF *
              </label>
              <input
                type="text"
                required
                value={formData.nifCif}
                onChange={(e) => handleChange('nifCif', e.target.value)}
                placeholder="B12345678"
                className="w-full px-3 py-2 text-sm bg-slate-50 border border-slate-300 rounded-lg font-mono focus:ring-2 focus:ring-brand-500 focus:outline-none"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
                País *
              </label>
              <input
                type="text"
                required
                value={formData.pais}
                onChange={(e) => handleChange('pais', e.target.value)}
                className="w-full px-3 py-2 text-sm bg-slate-50 border border-slate-300 rounded-lg focus:ring-2 focus:ring-brand-500 focus:outline-none"
              />
            </div>

            <div className="sm:col-span-2">
              <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
                Dirección Fiscal *
              </label>
              <input
                type="text"
                required
                value={formData.direccionFiscal}
                onChange={(e) => handleChange('direccionFiscal', e.target.value)}
                placeholder="Calle o Avenida, número, piso"
                className="w-full px-3 py-2 text-sm bg-slate-50 border border-slate-300 rounded-lg focus:ring-2 focus:ring-brand-500 focus:outline-none"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
                Código Postal *
              </label>
              <input
                type="text"
                required
                value={formData.codigoPostal}
                onChange={(e) => handleChange('codigoPostal', e.target.value)}
                placeholder="29000"
                className="w-full px-3 py-2 text-sm bg-slate-50 border border-slate-300 rounded-lg focus:ring-2 focus:ring-brand-500 focus:outline-none"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
                Ciudad y Provincia *
              </label>
              <div className="grid grid-cols-2 gap-2">
                <input
                  type="text"
                  required
                  placeholder="Ciudad"
                  value={formData.ciudad}
                  onChange={(e) => handleChange('ciudad', e.target.value)}
                  className="w-full px-3 py-2 text-sm bg-slate-50 border border-slate-300 rounded-lg focus:ring-2 focus:ring-brand-500 focus:outline-none"
                />
                <input
                  type="text"
                  required
                  placeholder="Provincia"
                  value={formData.provincia}
                  onChange={(e) => handleChange('provincia', e.target.value)}
                  className="w-full px-3 py-2 text-sm bg-slate-50 border border-slate-300 rounded-lg focus:ring-2 focus:ring-brand-500 focus:outline-none"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
                Correo Electrónico
              </label>
              <input
                type="email"
                value={formData.email}
                onChange={(e) => handleChange('email', e.target.value)}
                placeholder="facturacion@empresa.com"
                className="w-full px-3 py-2 text-sm bg-slate-50 border border-slate-300 rounded-lg focus:ring-2 focus:ring-brand-500 focus:outline-none"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
                Teléfono de Contacto
              </label>
              <input
                type="text"
                value={formData.telefono}
                onChange={(e) => handleChange('telefono', e.target.value)}
                placeholder="+34 600 00 00 00"
                className="w-full px-3 py-2 text-sm bg-slate-50 border border-slate-300 rounded-lg focus:ring-2 focus:ring-brand-500 focus:outline-none"
              />
            </div>

            <div className="sm:col-span-2">
              <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
                Notas Internas (Privadas)
              </label>
              <textarea
                rows={2}
                value={formData.notasInternas}
                onChange={(e) => handleChange('notasInternas', e.target.value)}
                placeholder="Observaciones de contacto o condiciones acordadas..."
                className="w-full px-3 py-2 text-sm bg-slate-50 border border-slate-300 rounded-lg focus:ring-2 focus:ring-brand-500 focus:outline-none"
              />
            </div>
          </div>

          <div className="flex justify-end gap-3 pt-4 border-t border-slate-100">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-xs font-medium text-slate-600 hover:text-slate-800"
            >
              Cancelar
            </button>
            <button
              type="submit"
              className="inline-flex items-center gap-2 px-4 py-2 bg-brand-600 text-white rounded-lg text-xs font-semibold hover:bg-brand-700 shadow-subtle"
            >
              <Save className="w-4 h-4" />
              <span>{cliente ? 'Actualizar Cliente' : 'Guardar Cliente'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
