import React, { useState } from 'react';
import type { EmpresaConfig } from '../../types';
import {
  Building2,
  CreditCard,
  FileSignature,
  Save,
  AlertTriangle,
  Upload,
  CheckCircle2,
  Trash2,
  Image as ImageIcon,
} from 'lucide-react';

interface CompanyConfigViewProps {
  config: EmpresaConfig;
  onSave: (config: EmpresaConfig) => void;
}

export const CompanyConfigView: React.FC<CompanyConfigViewProps> = ({
  config,
  onSave,
}) => {
  const [formData, setFormData] = useState<EmpresaConfig>(config);
  const [saveSuccess, setSaveSuccess] = useState(false);

  React.useEffect(() => {
    setFormData(config);
  }, [config]);

  const handleChange = (
    field: keyof EmpresaConfig,
    value: any
  ) => {
    setFormData((prev) => ({
      ...prev,
      [field]: value,
    }));
    setSaveSuccess(false);
  };

  const handleBankChange = (field: string, value: string) => {
    setFormData((prev) => ({
      ...prev,
      datosBancarios: {
        ...prev.datosBancarios,
        [field]: value,
      },
    }));
    setSaveSuccess(false);
  };

  const handleLogoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 1024 * 1024) {
        alert('El logotipo no debe superar 1 MB de tamaño.');
        return;
      }
      const reader = new FileReader();
      reader.onload = () => {
        handleChange('logotipoUrl', reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSave(formData);
    setSaveSuccess(true);
    setTimeout(() => setSaveSuccess(false), 4000);
  };

  const isConfigIncomplete = !formData.razonSocial.trim() || !formData.nifCif.trim();

  return (
    <div className="space-y-6 max-w-4xl pb-16">
      {/* Top Header */}
      <div className="pb-2 border-b border-slate-200">
        <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Configuración de la Empresa</h1>
        <p className="text-sm text-slate-500">
          Datos fiscales, bancarios y de identidad que aparecerán en las facturas emitidas.
        </p>
      </div>

      {/* Alerta de Configuración Pendiente */}
      {isConfigIncomplete && (
        <div className="p-4 rounded-xl bg-blue-50 border border-blue-200 text-blue-950 text-sm">
          <div className="flex items-start gap-3">
            <Building2 className="w-5 h-5 text-brand-600 shrink-0 mt-0.5" />
            <div>
              <p className="font-bold">Configuración de empresa pendiente de completar</p>
              <p className="mt-0.5 text-xs text-blue-800">
                Complete la razón social, NIF/CIF y domicilio fiscal de su empresa para poder emitir facturas comerciales válidas.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Alerta de Modo Demo */}
      {formData.esDemo && (
        <div className="p-4 rounded-xl bg-amber-50 border border-amber-200 text-amber-900 text-sm">
          <div className="flex items-start gap-3">
            <AlertTriangle className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
            <div>
              <p className="font-bold">Aviso importante: Datos fiscales provisionales</p>
              <p className="mt-0.5 text-xs text-amber-800">
                La empresa contiene valores de prueba identificados como "DEMO". Para emitir facturas legales reales, sustituya el NIF/CIF provisional y desactive la casilla «Marcar como datos de demostración».
              </p>
            </div>
          </div>
        </div>
      )}

      {saveSuccess && (
        <div className="p-4 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-sm flex items-center gap-2 animate-fadeIn">
          <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
          <span>Configuración guardada correctamente en el almacenamiento de la aplicación.</span>
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* SECCIÓN 1: IDENTIDAD Y DATOS FISCALES */}
        <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-card space-y-4">
          <div className="flex items-center gap-2 pb-3 border-b border-slate-100">
            <Building2 className="w-5 h-5 text-brand-600" />
            <h2 className="text-base font-bold text-slate-900">Identidad y Datos Fiscales</h2>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label htmlFor="cfg-nombreComercial" className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
                Nombre Comercial *
              </label>
              <input
                id="cfg-nombreComercial"
                name="nombreComercial"
                type="text"
                required
                value={formData.nombreComercial}
                onChange={(e) => handleChange('nombreComercial', e.target.value)}
                className="w-full px-3.5 py-2 text-sm bg-slate-50 border border-slate-300 rounded-lg focus:ring-2 focus:ring-brand-500 focus:outline-none"
              />
            </div>

            <div>
              <label htmlFor="cfg-razonSocial" className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
                Razón Social *
              </label>
              <input
                id="cfg-razonSocial"
                name="razonSocial"
                type="text"
                required
                value={formData.razonSocial}
                onChange={(e) => handleChange('razonSocial', e.target.value)}
                className="w-full px-3.5 py-2 text-sm bg-slate-50 border border-slate-300 rounded-lg focus:ring-2 focus:ring-brand-500 focus:outline-none"
              />
            </div>

            <div>
              <label htmlFor="cfg-nifCif" className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
                NIF / CIF *
              </label>
              <input
                id="cfg-nifCif"
                name="nifCif"
                type="text"
                required
                value={formData.nifCif}
                onChange={(e) => handleChange('nifCif', e.target.value)}
                className="w-full px-3.5 py-2 text-sm bg-slate-50 border border-slate-300 rounded-lg font-mono focus:ring-2 focus:ring-brand-500 focus:outline-none"
              />
            </div>

            <div>
              <label htmlFor="cfg-pais" className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
                País *
              </label>
              <input
                id="cfg-pais"
                name="pais"
                type="text"
                required
                value={formData.pais}
                onChange={(e) => handleChange('pais', e.target.value)}
                className="w-full px-3.5 py-2 text-sm bg-slate-50 border border-slate-300 rounded-lg focus:ring-2 focus:ring-brand-500 focus:outline-none"
              />
            </div>

            <div className="sm:col-span-2">
              <label htmlFor="cfg-direccion" className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
                Dirección Fiscal *
              </label>
              <input
                id="cfg-direccion"
                name="direccion"
                type="text"
                required
                value={formData.direccion}
                onChange={(e) => handleChange('direccion', e.target.value)}
                className="w-full px-3.5 py-2 text-sm bg-slate-50 border border-slate-300 rounded-lg focus:ring-2 focus:ring-brand-500 focus:outline-none"
              />
            </div>

            <div>
              <label htmlFor="cfg-codigoPostal" className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
                Código Postal *
              </label>
              <input
                id="cfg-codigoPostal"
                name="codigoPostal"
                type="text"
                required
                value={formData.codigoPostal}
                onChange={(e) => handleChange('codigoPostal', e.target.value)}
                className="w-full px-3.5 py-2 text-sm bg-slate-50 border border-slate-300 rounded-lg focus:ring-2 focus:ring-brand-500 focus:outline-none"
              />
            </div>

            <div>
              <label htmlFor="cfg-ciudad" className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
                Ciudad y Provincia *
              </label>
              <div className="grid grid-cols-2 gap-2">
                <input
                  id="cfg-ciudad"
                  name="ciudad"
                  type="text"
                  required
                  placeholder="Ciudad"
                  value={formData.ciudad}
                  onChange={(e) => handleChange('ciudad', e.target.value)}
                  className="w-full px-3.5 py-2 text-sm bg-slate-50 border border-slate-300 rounded-lg focus:ring-2 focus:ring-brand-500 focus:outline-none"
                />
                <input
                  id="cfg-provincia"
                  name="provincia"
                  type="text"
                  required
                  placeholder="Provincia"
                  value={formData.provincia}
                  onChange={(e) => handleChange('provincia', e.target.value)}
                  className="w-full px-3.5 py-2 text-sm bg-slate-50 border border-slate-300 rounded-lg focus:ring-2 focus:ring-brand-500 focus:outline-none"
                />
              </div>
            </div>

            <div>
              <label htmlFor="cfg-email" className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
                Correo Electrónico *
              </label>
              <input
                id="cfg-email"
                name="email"
                type="email"
                required
                value={formData.email}
                onChange={(e) => handleChange('email', e.target.value)}
                className="w-full px-3.5 py-2 text-sm bg-slate-50 border border-slate-300 rounded-lg focus:ring-2 focus:ring-brand-500 focus:outline-none"
              />
            </div>

            <div>
              <label htmlFor="cfg-telefono" className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
                Teléfono de Contacto
              </label>
              <input
                id="cfg-telefono"
                name="telefono"
                type="text"
                value={formData.telefono}
                onChange={(e) => handleChange('telefono', e.target.value)}
                className="w-full px-3.5 py-2 text-sm bg-slate-50 border border-slate-300 rounded-lg focus:ring-2 focus:ring-brand-500 focus:outline-none"
              />
            </div>

            <div className="sm:col-span-2">
              <label htmlFor="cfg-registroMercantil" className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
                Datos Registrales (Registro Mercantil opcional)
              </label>
              <input
                id="cfg-registroMercantil"
                name="registroMercantil"
                type="text"
                value={formData.registroMercantil || ''}
                onChange={(e) => handleChange('registroMercantil', e.target.value)}
                placeholder="Tomo 000, Libro 00, Folio 00, Hoja MA-00000"
                className="w-full px-3.5 py-2 text-sm bg-slate-50 border border-slate-300 rounded-lg focus:ring-2 focus:ring-brand-500 focus:outline-none"
              />
            </div>
          </div>

          {/* Logotipo */}
          <div className="pt-3 border-t border-slate-100">
            <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-2">
              Logotipo Corporativo (Opcional)
            </label>
            <div className="flex items-center gap-4">
              {formData.logotipoUrl ? (
                <div className="relative border border-slate-200 rounded-lg p-2 bg-slate-50 w-36 h-20 flex items-center justify-center">
                  <img
                    src={formData.logotipoUrl}
                    alt="Logo"
                    className="max-h-16 max-w-full object-contain"
                  />
                  <button
                    type="button"
                    onClick={() => handleChange('logotipoUrl', '')}
                    className="absolute -top-2 -right-2 p-1 bg-red-600 text-white rounded-full hover:bg-red-700 shadow-sm"
                    title="Eliminar logotipo"
                  >
                    <Trash2 className="w-3 h-3" />
                  </button>
                </div>
              ) : (
                <div className="w-36 h-20 rounded-lg border-2 border-dashed border-slate-300 flex flex-col items-center justify-center text-slate-400 bg-slate-50">
                  <ImageIcon className="w-6 h-6 mb-1 text-slate-400" />
                  <span className="text-[10px]">Sin logotipo</span>
                </div>
              )}

              <div>
                <label className="cursor-pointer inline-flex items-center gap-2 px-3 py-2 bg-white border border-slate-300 rounded-lg text-xs font-semibold text-slate-700 hover:bg-slate-50 shadow-subtle">
                  <Upload className="w-3.5 h-3.5" />
                  <span>Subir archivo (PNG/JPG)</span>
                  <input
                    type="file"
                    accept="image/png, image/jpeg"
                    onChange={handleLogoUpload}
                    className="hidden"
                  />
                </label>
                <p className="text-[11px] text-slate-500 mt-1">Máx. 1 MB. Se incrustará en los PDF generados.</p>
              </div>
            </div>
          </div>

          {/* Toggle Modo Demostración */}
          <div className="pt-3 border-t border-slate-100 flex items-center gap-3">
            <input
              id="esDemo"
              type="checkbox"
              checked={formData.esDemo}
              onChange={(e) => handleChange('esDemo', e.target.checked)}
              className="h-4 w-4 text-brand-600 focus:ring-brand-500 border-slate-300 rounded cursor-pointer"
            />
            <label htmlFor="esDemo" className="text-sm font-medium text-slate-800 cursor-pointer">
              Marcar datos de la empresa como <strong>Demostración / Pruebas</strong> (muestra aviso en la web y marca de agua en los PDF)
            </label>
          </div>
        </div>

        {/* SECCIÓN 2: DATOS BANCARIOS Y FORMAS DE PAGO */}
        <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-card space-y-4">
          <div className="flex items-center gap-2 pb-3 border-b border-slate-100">
            <CreditCard className="w-5 h-5 text-brand-600" />
            <h2 className="text-base font-bold text-slate-900">Datos Bancarios y Cobro</h2>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label htmlFor="cfg-formaPagoPredeterminada" className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
                Forma de Pago Predeterminada
              </label>
              <input
                id="cfg-formaPagoPredeterminada"
                name="formaPagoPredeterminada"
                type="text"
                value={formData.formaPagoPredeterminada}
                onChange={(e) => handleChange('formaPagoPredeterminada', e.target.value)}
                placeholder="ej. Transferencia bancaria a 30 días"
                className="w-full px-3.5 py-2 text-sm bg-slate-50 border border-slate-300 rounded-lg focus:ring-2 focus:ring-brand-500 focus:outline-none"
              />
            </div>

            <div>
              <label htmlFor="cfg-iban" className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
                IBAN Bancario (Opcional)
              </label>
              <input
                id="cfg-iban"
                name="iban"
                type="text"
                value={formData.datosBancarios.iban}
                onChange={(e) => handleBankChange('iban', e.target.value)}
                placeholder="ES00 0000 0000 0000 0000 0000"
                className="w-full px-3.5 py-2 text-sm bg-slate-50 border border-slate-300 rounded-lg font-mono focus:ring-2 focus:ring-brand-500 focus:outline-none"
              />
            </div>

            <div>
              <label htmlFor="cfg-bic" className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
                BIC / SWIFT (Opcional)
              </label>
              <input
                id="cfg-bic"
                name="bic"
                type="text"
                value={formData.datosBancarios.bic || ''}
                onChange={(e) => handleBankChange('bic', e.target.value)}
                placeholder="BSCHESMMXXX"
                className="w-full px-3.5 py-2 text-sm bg-slate-50 border border-slate-300 rounded-lg font-mono focus:ring-2 focus:ring-brand-500 focus:outline-none"
              />
            </div>

            <div>
              <label htmlFor="cfg-banco" className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
                Entidad Bancaria (Opcional)
              </label>
              <input
                id="cfg-banco"
                name="banco"
                type="text"
                value={formData.datosBancarios.banco || ''}
                onChange={(e) => handleBankChange('banco', e.target.value)}
                placeholder="ej. Banco Santander"
                className="w-full px-3.5 py-2 text-sm bg-slate-50 border border-slate-300 rounded-lg focus:ring-2 focus:ring-brand-500 focus:outline-none"
              />
            </div>
          </div>
        </div>

        {/* SECCIÓN 3: TEXTOS PREDETERMINADOS DE FACTURA */}
        <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-card space-y-4">
          <div className="flex items-center gap-2 pb-3 border-b border-slate-100">
            <FileSignature className="w-5 h-5 text-brand-600" />
            <h2 className="text-base font-bold text-slate-900">Textos y Cláusulas en Factura</h2>
          </div>

          <div>
            <label htmlFor="cfg-pieFactura" className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
              Pie de Factura / Cláusulas Legales Predeterminadas
            </label>
            <textarea
              id="cfg-pieFactura"
              name="pieFactura"
              rows={3}
              value={formData.pieFacturaPredeterminado}
              onChange={(e) => handleChange('pieFacturaPredeterminado', e.target.value)}
              placeholder="Notas sobre ley de protección de datos, condiciones de pago, etc."
              className="w-full px-3.5 py-2 text-sm bg-slate-50 border border-slate-300 rounded-lg focus:ring-2 focus:ring-brand-500 focus:outline-none"
            />
            <p className="text-[11px] text-slate-500 mt-1">
              Este texto se incluirá al final de cada factura en el PDF generado.
            </p>
          </div>
        </div>

        {/* Botón Guardar Cambios */}
        <div className="flex justify-end pt-2">
          <button
            type="submit"
            className="inline-flex items-center gap-2 px-5 py-2.5 bg-brand-600 text-white rounded-lg text-sm font-semibold hover:bg-brand-700 active:bg-brand-800 shadow-subtle focus:outline-none focus:ring-2 focus:ring-brand-500"
          >
            <Save className="w-4 h-4" />
            <span>Guardar Configuración</span>
          </button>
        </div>
      </form>
    </div>
  );
};
