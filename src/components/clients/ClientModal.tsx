import React, { useState, useEffect } from 'react';
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

  useEffect(() => {
    setFormData({
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
    setError(null);
  }, [cliente, isOpen]);

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
      <div className="bg-white dark:bg-slate-900 rounded-2xl max-w-xl w-full shadow-modal border border-slate-200 dark:border-slate-800 overflow-hidden flex flex-col">
        {/* Header Modal */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200 dark:border-slate-800 bg-slate-50/80 dark:bg-slate-800/50">
          <div>
            <h2 className="text-base font-bold text-slate-900 dark:text-white">
              {cliente ? 'Editar Ficha de Cliente' : 'Nuevo Cliente'}
            </h2>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Datos fiscales para emisión de facturas y control de cobros.
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 rounded-lg hover:bg-slate-200 dark:hover:bg-slate-800 transition-colors"
            aria-label="Cerrar modal"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {error && (
            <div className="p-3 bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-900/60 rounded-lg text-xs text-red-800 dark:text-red-300 flex items-start gap-2">
              <AlertCircle className="w-4 h-4 text-red-600 dark:text-red-400 shrink-0 mt-0.5" />
              <span>{error}</span>
            </div>
          )}

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="sm:col-span-2">
              <label htmlFor="cli-nombre" className="ui-label">
                Nombre o Razón Social *
              </label>
              <input
                id="cli-nombre"
                name="nombreOrazonSocial"
                type="text"
                required
                value={formData.nombreOrazonSocial}
                onChange={(e) => handleChange('nombreOrazonSocial', e.target.value)}
                placeholder="ej. Acero & Construcciones S.L."
                className="ui-input"
              />
            </div>

            <div>
              <label htmlFor="cli-nif" className="ui-label">
                NIF / NIE / CIF *
              </label>
              <input
                id="cli-nif"
                name="nifCif"
                type="text"
                required
                value={formData.nifCif}
                onChange={(e) => handleChange('nifCif', e.target.value)}
                placeholder="B12345678"
                className="ui-input font-mono"
              />
            </div>

            <div>
              <label htmlFor="cli-pais" className="ui-label">
                País *
              </label>
              <input
                id="cli-pais"
                name="pais"
                type="text"
                required
                value={formData.pais}
                onChange={(e) => handleChange('pais', e.target.value)}
                className="ui-input"
              />
            </div>

            <div className="sm:col-span-2">
              <label htmlFor="cli-direccion" className="ui-label">
                Dirección Fiscal *
              </label>
              <input
                id="cli-direccion"
                name="direccionFiscal"
                type="text"
                required
                value={formData.direccionFiscal}
                onChange={(e) => handleChange('direccionFiscal', e.target.value)}
                placeholder="Calle o Avenida, número, piso"
                className="ui-input"
              />
            </div>

            <div>
              <label htmlFor="cli-cp" className="ui-label">
                Código Postal *
              </label>
              <input
                id="cli-cp"
                name="codigoPostal"
                type="text"
                required
                value={formData.codigoPostal}
                onChange={(e) => handleChange('codigoPostal', e.target.value)}
                placeholder="29000"
                className="ui-input"
              />
            </div>

            <div>
              <label htmlFor="cli-ciudad" className="ui-label">
                Ciudad y Provincia *
              </label>
              <div className="grid grid-cols-2 gap-2">
                <input
                  id="cli-ciudad"
                  name="ciudad"
                  type="text"
                  required
                  placeholder="Ciudad"
                  value={formData.ciudad}
                  onChange={(e) => handleChange('ciudad', e.target.value)}
                  className="ui-input"
                />
                <input
                  id="cli-provincia"
                  name="provincia"
                  type="text"
                  required
                  aria-label="Provincia"
                  placeholder="Provincia"
                  value={formData.provincia}
                  onChange={(e) => handleChange('provincia', e.target.value)}
                  className="ui-input"
                />
              </div>
            </div>

            <div>
              <label htmlFor="cli-email" className="ui-label">
                Correo Electrónico
              </label>
              <input
                id="cli-email"
                name="email"
                type="email"
                value={formData.email}
                onChange={(e) => handleChange('email', e.target.value)}
                placeholder="facturacion@empresa.com"
                className="ui-input"
              />
            </div>

            <div>
              <label htmlFor="cli-telefono" className="ui-label">
                Teléfono de Contacto
              </label>
              <input
                id="cli-telefono"
                name="telefono"
                type="text"
                value={formData.telefono}
                onChange={(e) => handleChange('telefono', e.target.value)}
                placeholder="+34 600 00 00 00"
                className="ui-input"
              />
            </div>

            <div className="sm:col-span-2">
              <label htmlFor="cli-notas" className="ui-label">
                Notas Internas (Privadas)
              </label>
              <textarea
                id="cli-notas"
                name="notasInternas"
                rows={2}
                value={formData.notasInternas}
                onChange={(e) => handleChange('notasInternas', e.target.value)}
                placeholder="Observaciones de contacto o condiciones acordadas..."
                className="ui-input"
              />
            </div>
          </div>

          <div className="flex justify-end gap-3 pt-4 border-t border-slate-100 dark:border-slate-800">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-xs font-medium text-slate-600 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200"
            >
              Cancelar
            </button>
            <button
              type="submit"
              className="inline-flex items-center gap-2 px-4 py-2 bg-brand-700 dark:bg-brand-600 text-white rounded-lg text-xs font-semibold hover:bg-brand-800 dark:hover:bg-brand-500 shadow-subtle transition-colors"
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
