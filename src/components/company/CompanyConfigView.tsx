import React, { useState } from 'react';
import type { EmpresaConfig } from '../../types';
import { useTheme, type ThemePreference } from '../../context/ThemeContext';
import {
  Building2,
  CreditCard,
  FileSignature,
  Save,
  AlertTriangle,
  Upload,
  CheckCircle2,
  RotateCcw,
  Sun,
  Moon,
  Monitor,
  Palette,
} from 'lucide-react';

interface CompanyConfigViewProps {
  config: EmpresaConfig;
  onSave: (config: EmpresaConfig) => void;
}

export const CompanyConfigView: React.FC<CompanyConfigViewProps> = ({
  config,
  onSave,
}) => {
  const { theme, setTheme } = useTheme();
  const [formData, setFormData] = useState<EmpresaConfig>(config);
  const [saveSuccess, setSaveSuccess] = useState(false);

  React.useEffect(() => {
    setFormData(config);
  }, [config]);

  const handleChange = (field: keyof EmpresaConfig, value: any) => {
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
    onSave({
      ...formData,
      logotipoUrl: formData.logotipoUrl || '/logo.png',
    });
    setSaveSuccess(true);
    setTimeout(() => setSaveSuccess(false), 4000);
  };

  const isConfigIncomplete = !formData.razonSocial.trim() || !formData.nifCif.trim();
  const activeLogo = formData.logotipoUrl || '/logo.png';

  const themeOptions: { id: ThemePreference; label: string; desc: string; icon: React.ElementType }[] = [
    {
      id: 'light',
      label: 'Modo Claro',
      desc: 'Superficie clara de alto contraste para entornos de oficina.',
      icon: Sun,
    },
    {
      id: 'dark',
      label: 'Modo Oscuro',
      desc: 'Interfaz nocturna de baja fatiga visual y contraste equilibrado.',
      icon: Moon,
    },
    {
      id: 'system',
      label: 'Automático (Sistema)',
      desc: 'Se adapta automáticamente a la preferencia de su sistema operativo.',
      icon: Monitor,
    },
  ];

  return (
    <div className="space-y-6 max-w-4xl pb-16">
      {/* Top Header */}
      <div className="pb-3 border-b border-slate-200 dark:border-slate-800">
        <h1 className="text-2xl font-bold text-slate-900 dark:text-white tracking-tight">
          Configuración Corporativa y Apariencia
        </h1>
        <p className="text-sm text-slate-500 dark:text-slate-400">
          Personalice el modo visual de la aplicación y los datos fiscales de FACENIA para las facturas emitidas.
        </p>
      </div>

      {/* SECCIÓN 0: APARTADO DE MODO OSCURO Y APARIENCIA */}
      <div className="ui-card p-6 space-y-4">
        <div className="flex items-center gap-2 pb-3 border-b border-slate-100 dark:border-slate-800">
          <Palette className="w-5 h-5 text-brand-600 dark:text-brand-400" />
          <div>
            <h2 className="text-base font-bold text-slate-900 dark:text-white">
              Apariencia y Modo Oscuro
            </h2>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Seleccione el esquema de color de la plataforma. El cambio se aplica y guarda al instante.
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          {themeOptions.map((opt) => {
            const Icon = opt.icon;
            const isSelected = theme === opt.id;
            return (
              <button
                key={opt.id}
                type="button"
                onClick={() => setTheme(opt.id)}
                className={`text-left p-4 rounded-xl border transition-all flex flex-col justify-between gap-2 ${
                  isSelected
                    ? 'bg-brand-50/70 dark:bg-brand-950/50 border-brand-600 dark:border-brand-500 ring-1 ring-brand-600 dark:ring-brand-500'
                    : 'bg-slate-50/70 dark:bg-slate-950/60 border-slate-200 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700'
                }`}
              >
                <div className="flex items-center justify-between">
                  <div
                    className={`p-2 rounded-lg ${
                      isSelected
                        ? 'bg-brand-700 text-white'
                        : 'bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-slate-700'
                    }`}
                  >
                    <Icon className="w-4 h-4" />
                  </div>
                  {isSelected && (
                    <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full bg-brand-700 text-white">
                      Activo
                    </span>
                  )}
                </div>
                <div>
                  <p className="text-xs font-bold text-slate-900 dark:text-white">{opt.label}</p>
                  <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5 leading-relaxed">
                    {opt.desc}
                  </p>
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {/* Alerta de Configuración Pendiente */}
      {isConfigIncomplete && (
        <div className="p-4 rounded-xl bg-brand-50 dark:bg-brand-950/40 border border-brand-200 dark:border-brand-800 text-brand-950 dark:text-brand-200 text-sm">
          <div className="flex items-start gap-3">
            <Building2 className="w-5 h-5 text-brand-600 dark:text-brand-400 shrink-0 mt-0.5" />
            <div>
              <p className="font-bold">Configuración fiscal pendiente de completar</p>
              <p className="mt-0.5 text-xs text-brand-800 dark:text-brand-300">
                Complete la razón social, NIF/CIF y domicilio fiscal de su empresa para emitir facturas comerciales válidas.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Alerta de Modo Demo */}
      {formData.esDemo && (
        <div className="p-4 rounded-xl bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800/70 text-amber-900 dark:text-amber-200 text-sm">
          <div className="flex items-start gap-3">
            <AlertTriangle className="w-5 h-5 text-amber-600 dark:text-amber-400 shrink-0 mt-0.5" />
            <div>
              <p className="font-bold">Datos fiscales en modo de prueba</p>
              <p className="mt-0.5 text-xs text-amber-800 dark:text-amber-300">
                Sustituya el NIF/CIF provisional y desactive la casilla «Marcar como datos de demostración» cuando desee emitir documentos definitivos sin marca de agua.
              </p>
            </div>
          </div>
        </div>
      )}

      {saveSuccess && (
        <div className="p-4 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 text-emerald-800 dark:text-emerald-200 text-sm flex items-center gap-2">
          <CheckCircle2 className="w-5 h-5 text-emerald-600 dark:text-emerald-400 shrink-0" />
          <span>Configuración corporativa guardada y sincronizada con Supabase.</span>
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* SECCIÓN 1: IDENTIDAD Y DATOS FISCALES */}
        <div className="ui-card p-6 space-y-4">
          <div className="flex items-center gap-2 pb-3 border-b border-slate-100 dark:border-slate-800">
            <Building2 className="w-5 h-5 text-brand-600 dark:text-brand-400" />
            <h2 className="text-base font-bold text-slate-900 dark:text-white">
              Identidad Corporativa y Datos Fiscales
            </h2>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label htmlFor="cfg-nombreComercial" className="ui-label">
                Nombre Comercial *
              </label>
              <input
                id="cfg-nombreComercial"
                name="nombreComercial"
                type="text"
                required
                value={formData.nombreComercial}
                onChange={(e) => handleChange('nombreComercial', e.target.value)}
                className="ui-input"
              />
            </div>

            <div>
              <label htmlFor="cfg-razonSocial" className="ui-label">
                Razón Social *
              </label>
              <input
                id="cfg-razonSocial"
                name="razonSocial"
                type="text"
                required
                value={formData.razonSocial}
                onChange={(e) => handleChange('razonSocial', e.target.value)}
                className="ui-input"
              />
            </div>

            <div>
              <label htmlFor="cfg-nifCif" className="ui-label">
                NIF / CIF *
              </label>
              <input
                id="cfg-nifCif"
                name="nifCif"
                type="text"
                required
                value={formData.nifCif}
                onChange={(e) => handleChange('nifCif', e.target.value)}
                className="ui-input font-mono"
              />
            </div>

            <div>
              <label htmlFor="cfg-pais" className="ui-label">
                País *
              </label>
              <input
                id="cfg-pais"
                name="pais"
                type="text"
                required
                value={formData.pais}
                onChange={(e) => handleChange('pais', e.target.value)}
                className="ui-input"
              />
            </div>

            <div className="sm:col-span-2">
              <label htmlFor="cfg-direccion" className="ui-label">
                Dirección Fiscal *
              </label>
              <input
                id="cfg-direccion"
                name="direccion"
                type="text"
                required
                value={formData.direccion}
                onChange={(e) => handleChange('direccion', e.target.value)}
                className="ui-input"
              />
            </div>

            <div>
              <label htmlFor="cfg-codigoPostal" className="ui-label">
                Código Postal *
              </label>
              <input
                id="cfg-codigoPostal"
                name="codigoPostal"
                type="text"
                required
                value={formData.codigoPostal}
                onChange={(e) => handleChange('codigoPostal', e.target.value)}
                className="ui-input"
              />
            </div>

            <div>
              <label htmlFor="cfg-ciudad" className="ui-label">
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
                  className="ui-input"
                />
                <input
                  id="cfg-provincia"
                  name="provincia"
                  type="text"
                  required
                  placeholder="Provincia"
                  aria-label="Provincia"
                  value={formData.provincia}
                  onChange={(e) => handleChange('provincia', e.target.value)}
                  className="ui-input"
                />
              </div>
            </div>

            <div>
              <label htmlFor="cfg-email" className="ui-label">
                Correo Electrónico *
              </label>
              <input
                id="cfg-email"
                name="email"
                type="email"
                required
                value={formData.email}
                onChange={(e) => handleChange('email', e.target.value)}
                className="ui-input"
              />
            </div>

            <div>
              <label htmlFor="cfg-telefono" className="ui-label">
                Teléfono de Contacto
              </label>
              <input
                id="cfg-telefono"
                name="telefono"
                type="text"
                value={formData.telefono}
                onChange={(e) => handleChange('telefono', e.target.value)}
                className="ui-input"
              />
            </div>

            <div className="sm:col-span-2">
              <label htmlFor="cfg-registroMercantil" className="ui-label">
                Datos Registrales (Registro Mercantil opcional)
              </label>
              <input
                id="cfg-registroMercantil"
                name="registroMercantil"
                type="text"
                value={formData.registroMercantil || ''}
                onChange={(e) => handleChange('registroMercantil', e.target.value)}
                placeholder="Tomo 000, Libro 00, Folio 00, Hoja MA-00000"
                className="ui-input"
              />
            </div>
          </div>

          {/* Logotipo */}
          <div className="pt-4 border-t border-slate-100 dark:border-slate-800">
            <span className="ui-label">Logotipo Corporativo FACENIA</span>
            <div className="flex flex-wrap items-center gap-4 mt-2">
              <div className="relative border border-slate-200 dark:border-slate-700 rounded-xl p-3 bg-white dark:bg-slate-800 w-36 h-20 flex items-center justify-center shadow-subtle">
                <img
                  src={activeLogo}
                  alt="Logotipo FACENIA"
                  className="max-h-14 max-w-full object-contain"
                />
              </div>

              <div className="space-y-2">
                <div className="flex flex-wrap items-center gap-2">
                  <label
                    htmlFor="cfg-logo-upload"
                    className="cursor-pointer inline-flex items-center gap-2 px-3 py-2 bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg text-xs font-semibold text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-700 shadow-subtle transition-colors"
                  >
                    <Upload className="w-3.5 h-3.5" />
                    <span>Cambiar imagen (PNG/JPG)</span>
                    <input
                      id="cfg-logo-upload"
                      name="logoUpload"
                      type="file"
                      accept="image/png, image/jpeg"
                      onChange={handleLogoUpload}
                      className="hidden"
                    />
                  </label>

                  {formData.logotipoUrl && formData.logotipoUrl !== '/logo.png' && (
                    <button
                      type="button"
                      onClick={() => handleChange('logotipoUrl', '/logo.png')}
                      className="inline-flex items-center gap-1.5 px-3 py-2 text-xs font-medium text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-colors"
                    >
                      <RotateCcw className="w-3.5 h-3.5" />
                      <span>Restaurar logo oficial</span>
                    </button>
                  )}
                </div>
                <p className="text-[11px] text-slate-500 dark:text-slate-400">
                  El logotipo oficial de FACENIA se incluye automáticamente en la cabecera de todos los PDF emitidos.
                </p>
              </div>
            </div>
          </div>

          {/* Toggle Modo Demostración */}
          <div className="pt-4 border-t border-slate-100 dark:border-slate-800 flex items-center gap-3">
            <input
              id="esDemo"
              name="esDemo"
              type="checkbox"
              checked={formData.esDemo}
              onChange={(e) => handleChange('esDemo', e.target.checked)}
              className="h-4 w-4 text-brand-700 focus:ring-brand-500 border-slate-300 dark:border-slate-700 rounded cursor-pointer"
            />
            <label htmlFor="esDemo" className="text-xs sm:text-sm font-medium text-slate-800 dark:text-slate-200 cursor-pointer">
              Mantener empresa en <strong>Modo de Prueba / Demostración</strong> (incluye aviso preventivo y marca de agua en el PDF)
            </label>
          </div>
        </div>

        {/* SECCIÓN 2: DATOS BANCARIOS Y FORMAS DE PAGO */}
        <div className="ui-card p-6 space-y-4">
          <div className="flex items-center gap-2 pb-3 border-b border-slate-100 dark:border-slate-800">
            <CreditCard className="w-5 h-5 text-brand-600 dark:text-brand-400" />
            <h2 className="text-base font-bold text-slate-900 dark:text-white">
              Datos Bancarios y Condiciones de Cobro
            </h2>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label htmlFor="cfg-formaPagoPredeterminada" className="ui-label">
                Forma de Pago Predeterminada
              </label>
              <input
                id="cfg-formaPagoPredeterminada"
                name="formaPagoPredeterminada"
                type="text"
                value={formData.formaPagoPredeterminada}
                onChange={(e) => handleChange('formaPagoPredeterminada', e.target.value)}
                placeholder="ej. Transferencia bancaria a 30 días"
                className="ui-input"
              />
            </div>

            <div>
              <label htmlFor="cfg-iban" className="ui-label">
                IBAN Bancario (Opcional)
              </label>
              <input
                id="cfg-iban"
                name="iban"
                type="text"
                value={formData.datosBancarios.iban}
                onChange={(e) => handleBankChange('iban', e.target.value)}
                placeholder="ES00 0000 0000 0000 0000 0000"
                className="ui-input font-mono"
              />
            </div>

            <div>
              <label htmlFor="cfg-bic" className="ui-label">
                BIC / SWIFT (Opcional)
              </label>
              <input
                id="cfg-bic"
                name="bic"
                type="text"
                value={formData.datosBancarios.bic || ''}
                onChange={(e) => handleBankChange('bic', e.target.value)}
                placeholder="BSCHESMMXXX"
                className="ui-input font-mono"
              />
            </div>

            <div>
              <label htmlFor="cfg-banco" className="ui-label">
                Entidad Bancaria (Opcional)
              </label>
              <input
                id="cfg-banco"
                name="banco"
                type="text"
                value={formData.datosBancarios.banco || ''}
                onChange={(e) => handleBankChange('banco', e.target.value)}
                placeholder="ej. Banco Santander / BBVA / CaixaBank"
                className="ui-input"
              />
            </div>
          </div>
        </div>

        {/* SECCIÓN 3: TEXTOS PREDETERMINADOS DE FACTURA */}
        <div className="ui-card p-6 space-y-4">
          <div className="flex items-center gap-2 pb-3 border-b border-slate-100 dark:border-slate-800">
            <FileSignature className="w-5 h-5 text-brand-600 dark:text-brand-400" />
            <h2 className="text-base font-bold text-slate-900 dark:text-white">
              Textos Legales y Pie de Factura
            </h2>
          </div>

          <div>
            <label htmlFor="cfg-pieFactura" className="ui-label">
              Pie de Factura / Cláusulas Legales Predeterminadas
            </label>
            <textarea
              id="cfg-pieFactura"
              name="pieFactura"
              rows={3}
              value={formData.pieFacturaPredeterminado}
              onChange={(e) => handleChange('pieFacturaPredeterminado', e.target.value)}
              placeholder="Notas sobre ley de protección de datos, condiciones de pago, etc."
              className="ui-input"
            />
            <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-1">
              Este texto se incluirá al pie de cada factura en el documento PDF generado.
            </p>
          </div>
        </div>

        {/* Botón Guardar Cambios */}
        <div className="flex justify-end pt-2">
          <button
            type="submit"
            className="inline-flex items-center gap-2 px-5 py-2.5 bg-brand-700 hover:bg-brand-800 text-white rounded-lg text-sm font-semibold shadow-subtle focus:outline-none focus:ring-2 focus:ring-brand-500 transition-colors"
          >
            <Save className="w-4 h-4" />
            <span>Guardar Configuración</span>
          </button>
        </div>
      </form>
    </div>
  );
};
