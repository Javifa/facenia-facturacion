import React, { useEffect, useState } from 'react';
import type { Factura } from '../../types';
import { generarFacturaPDF } from '../../utils/pdfGenerator';
import { Download, Printer, X, Loader2 } from 'lucide-react';

interface PdfPreviewModalProps {
  factura: Factura | null;
  onClose: () => void;
}

export const PdfPreviewModal: React.FC<PdfPreviewModalProps> = ({ factura, onClose }) => {
  const [pdfUrl, setPdfUrl] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let currentUrl: string | null = null;

    async function loadPdf() {
      if (!factura) return;
      setLoading(true);
      try {
        const doc = await generarFacturaPDF(factura);
        const blob = doc.output('blob');
        currentUrl = URL.createObjectURL(blob);
        setPdfUrl(currentUrl);
      } catch (err) {
        console.error('Error generando vista previa PDF:', err);
      } finally {
        setLoading(false);
      }
    }

    loadPdf();

    return () => {
      if (currentUrl) {
        URL.revokeObjectURL(currentUrl);
      }
    };
  }, [factura]);

  if (!factura) return null;

  const handleDownload = async () => {
    try {
      const doc = await generarFacturaPDF(factura);
      const safeNum = factura.numero.replace(/[^a-zA-Z0-9_-]/g, '_');
      doc.save(`Factura_${safeNum}.pdf`);
    } catch (err) {
      console.error('Error descargando PDF:', err);
    }
  };

  const handlePrint = () => {
    if (!pdfUrl) return;
    const iframe = document.getElementById('pdf-preview-frame') as HTMLIFrameElement;
    if (iframe && iframe.contentWindow) {
      iframe.contentWindow.focus();
      iframe.contentWindow.print();
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-slate-900/60 backdrop-blur-sm animate-fadeIn">
      <div className="bg-white rounded-2xl shadow-modal flex flex-col w-full max-w-4xl h-[90vh] overflow-hidden border border-slate-200">
        {/* Header Modal */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200 bg-slate-50/80">
          <div>
            <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
              <span>Vista Previa: Factura {factura.numero}</span>
              {factura.emisorSnapshot?.esDemo && (
                <span className="px-2 py-0.5 text-xs font-semibold rounded bg-amber-100 text-amber-800 border border-amber-200">
                  Modo Demo
                </span>
              )}
            </h2>
            <p className="text-xs text-slate-600">
              Cliente: {factura.clienteSnapshot?.nombreOrazonSocial || 'Sin asignar'}
            </p>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handlePrint}
              disabled={loading || !pdfUrl}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-slate-700 bg-white border border-slate-300 rounded-lg hover:bg-slate-50 focus:outline-none focus:ring-2 focus:ring-brand-500 disabled:opacity-50"
            >
              <Printer className="w-3.5 h-3.5" />
              <span>Imprimir</span>
            </button>
            <button
              onClick={handleDownload}
              disabled={loading}
              className="inline-flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-semibold text-white bg-brand-600 rounded-lg hover:bg-brand-700 focus:outline-none focus:ring-2 focus:ring-brand-500 disabled:opacity-50 shadow-subtle"
            >
              <Download className="w-3.5 h-3.5" />
              <span>Descargar PDF</span>
            </button>
            <button
              onClick={onClose}
              className="p-1.5 text-slate-400 hover:text-slate-600 rounded-lg hover:bg-slate-200 transition-colors ml-1"
              aria-label="Cerrar modal"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* PDF Viewer Body */}
        <div className="flex-1 bg-slate-200 p-2 sm:p-4 overflow-hidden relative">
          {loading ? (
            <div className="absolute inset-0 flex flex-col items-center justify-center bg-slate-100 gap-3">
              <Loader2 className="w-8 h-8 text-brand-600 animate-spin" />
              <p className="text-sm font-medium text-slate-600">Renderizando documento PDF...</p>
            </div>
          ) : pdfUrl ? (
            <iframe
              id="pdf-preview-frame"
              src={pdfUrl}
              title={`Vista previa ${factura.numero}`}
              className="w-full h-full rounded-lg bg-white shadow-subtle border border-slate-300"
            />
          ) : (
            <div className="flex items-center justify-center h-full text-slate-500 text-sm">
              No se pudo cargar la vista previa del documento.
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
