import React, { useState } from 'react';
import { storageService } from '../../services/storageService';
import { X, Download, Upload, CheckCircle2, AlertCircle } from 'lucide-react';

interface BackupModalProps {
  isOpen: boolean;
  onClose: () => void;
  onDataReloaded: () => void;
}

export const BackupModal: React.FC<BackupModalProps> = ({
  isOpen,
  onClose,
  onDataReloaded,
}) => {
  const [message, setMessage] = useState<{ type: 'ok' | 'err'; text: string } | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);

  if (!isOpen) return null;

  const handleExport = async () => {
    setIsProcessing(true);
    setMessage(null);
    try {
      const json = await storageService.exportBackup();
      const blob = new Blob([json], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `CopiaSeguridad_FACENIA_${new Date().toISOString().split('T')[0]}.json`;
      a.click();
      URL.revokeObjectURL(url);
      setMessage({ type: 'ok', text: 'Copia de seguridad descargada correctamente desde Supabase.' });
    } catch (err: any) {
      setMessage({ type: 'err', text: err.message || 'Error al exportar los datos.' });
    } finally {
      setIsProcessing(false);
    }
  };

  const handleImport = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsProcessing(true);
    setMessage(null);

    const reader = new FileReader();
    reader.onload = async (event) => {
      try {
        const content = event.target?.result as string;
        const res = await storageService.importBackup(content);
        if (res.success) {
          setMessage({ type: 'ok', text: res.message });
          onDataReloaded();
        } else {
          setMessage({ type: 'err', text: res.message });
        }
      } catch (err: any) {
        setMessage({ type: 'err', text: err.message || 'Fallo al procesar el archivo.' });
      } finally {
        setIsProcessing(false);
      }
    };
    reader.readAsText(file);
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-3 sm:p-6 animate-fadeIn">
      <div className="bg-white dark:bg-slate-900 rounded-2xl max-w-md w-full shadow-modal border border-slate-200 dark:border-slate-800 overflow-hidden flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200 dark:border-slate-800 bg-slate-50/80 dark:bg-slate-800/50">
          <div>
            <h2 className="text-base font-bold text-slate-900 dark:text-white">Gestión de Copia de Seguridad</h2>
            <p className="text-xs text-slate-500 dark:text-slate-400">Respaldo y restauración directa con Supabase</p>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 rounded-lg hover:bg-slate-200 dark:hover:bg-slate-800"
            aria-label="Cerrar modal"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-6 space-y-4">
          {message && (
            <div
              className={`p-3 rounded-lg text-xs flex items-start gap-2 ${
                message.type === 'ok'
                  ? 'bg-emerald-50 dark:bg-emerald-950/40 text-emerald-800 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-900/60'
                  : 'bg-red-50 dark:bg-red-950/40 text-red-800 dark:text-red-300 border border-red-200 dark:border-red-900/60'
              }`}
            >
              {message.type === 'ok' ? (
                <CheckCircle2 className="w-4 h-4 text-emerald-600 dark:text-emerald-400 shrink-0 mt-0.5" />
              ) : (
                <AlertCircle className="w-4 h-4 text-red-600 dark:text-red-400 shrink-0 mt-0.5" />
              )}
              <span>{message.text}</span>
            </div>
          )}

          <div className="space-y-3">
            {/* Exportar */}
            <div className="p-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/50 flex items-center justify-between">
              <div>
                <p className="text-xs font-bold text-slate-900 dark:text-white">Descargar Copia JSON</p>
                <p className="text-[11px] text-slate-500 dark:text-slate-400">Guarde un archivo con toda la información de Supabase.</p>
              </div>
              <button
                type="button"
                disabled={isProcessing}
                onClick={handleExport}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-brand-700 dark:bg-brand-600 text-white rounded-lg text-xs font-semibold hover:bg-brand-800 dark:hover:bg-brand-500 shadow-subtle disabled:opacity-50"
              >
                <Download className="w-3.5 h-3.5" />
                <span>{isProcessing ? 'Procesando...' : 'Exportar'}</span>
              </button>
            </div>

            {/* Importar */}
            <div className="p-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/50 flex items-center justify-between">
              <div>
                <p className="text-xs font-bold text-slate-900 dark:text-white">Restaurar Copia</p>
                <p className="text-[11px] text-slate-500 dark:text-slate-400">Cargue un archivo JSON y sincronícelo en Supabase.</p>
              </div>
              <label className="cursor-pointer inline-flex items-center gap-1.5 px-3 py-1.5 bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 text-slate-700 dark:text-slate-200 rounded-lg text-xs font-semibold hover:bg-slate-100 dark:hover:bg-slate-700 shadow-subtle">
                <Upload className="w-3.5 h-3.5" />
                <span>Importar</span>
                <input id="backup-file-upload" name="backupFileUpload" type="file" accept=".json" onChange={handleImport} disabled={isProcessing} className="hidden" />
              </label>
            </div>
          </div>

          <div className="flex justify-end pt-2">
            <button
              onClick={onClose}
              className="px-4 py-2 text-xs font-medium text-slate-600 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200"
            >
              Cerrar
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
