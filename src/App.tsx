import React, { useState, useEffect, useCallback } from 'react';
import { AuthProvider, useAuth } from './context/AuthContext';
import { ThemeProvider } from './context/ThemeContext';
import { storageService, EMPTY_EMPRESA_CONFIG, EMPTY_STATS } from './services/storageService';
import type { Cliente, EmpresaConfig, Factura, ResumenEstadisticas } from './types';
import { AppLayout, type CurrentView } from './components/layout/AppLayout';
import { LoginView } from './components/auth/LoginView';
import { DashboardView } from './components/dashboard/DashboardView';
import { InvoicesListView } from './components/invoices/InvoicesListView';
import { InvoiceFormView } from './components/invoices/InvoiceFormView';
import { ClientsView } from './components/clients/ClientsView';
import { CompanyConfigView } from './components/company/CompanyConfigView';
import { PdfPreviewModal } from './components/common/PdfPreviewModal';
import { BackupModal } from './components/common/BackupModal';
import { CheckCircle2, AlertCircle, Loader2 } from 'lucide-react';

const MainAppContent: React.FC = () => {
  const { isAuthenticated, isLoading: isAuthLoading } = useAuth();

  // Estados de datos
  const [currentView, setCurrentView] = useState<CurrentView>('dashboard');
  const [empresaConfig, setEmpresaConfig] = useState<EmpresaConfig>(EMPTY_EMPRESA_CONFIG);
  const [clientes, setClientes] = useState<Cliente[]>([]);
  const [facturas, setFacturas] = useState<Factura[]>([]);
  const [stats, setStats] = useState<ResumenEstadisticas>(EMPTY_STATS);
  const [isDataLoading, setIsDataLoading] = useState(false);

  // Factura en edición / Factura para previsualizar
  const [facturaToEdit, setFacturaToEdit] = useState<Factura | null>(null);
  const [previewFactura, setPreviewFactura] = useState<Factura | null>(null);

  // Modal backup
  const [isBackupOpen, setIsBackupOpen] = useState(false);

  // Sistema de notificaciones Toast
  const [toast, setToast] = useState<{ type: 'ok' | 'err'; message: string } | null>(null);

  const showToast = useCallback((type: 'ok' | 'err', message: string) => {
    setToast({ type, message });
    setTimeout(() => setToast(null), 4000);
  }, []);

  // Recarga todos los datos directamente de Supabase
  const reloadData = useCallback(async () => {
    if (!isAuthenticated) return;
    setIsDataLoading(true);
    try {
      const [cfg, cls, fcts, st] = await Promise.all([
        storageService.getEmpresaConfig(),
        storageService.getClientes(),
        storageService.getFacturas(),
        storageService.getEstadisticas(),
      ]);
      setEmpresaConfig(cfg);
      setClientes(cls);
      setFacturas(fcts);
      setStats(st);
    } catch (err: any) {
      console.error('Error sincronizando con Supabase:', err);
      showToast('err', `Error sincronizando datos: ${err.message || 'Error de conexión'}`);
    } finally {
      setIsDataLoading(false);
    }
  }, [isAuthenticated, showToast]);

  useEffect(() => {
    if (isAuthenticated) {
      reloadData();
    } else {
      // Limpiar estado al cerrar sesión
      setEmpresaConfig(EMPTY_EMPRESA_CONFIG);
      setClientes([]);
      setFacturas([]);
      setStats(EMPTY_STATS);
    }
  }, [isAuthenticated, reloadData]);

  // Si está cargando la sesión
  if (isAuthLoading) {
    return (
      <div className="min-h-screen bg-slate-50 dark:bg-slate-950 flex flex-col items-center justify-center gap-3 text-slate-900 dark:text-white">
        <img src="/logo.png" alt="FACENIA" className="w-11 h-11 object-contain mb-1" />
        <div className="flex items-center gap-2.5">
          <Loader2 className="w-5 h-5 text-brand-600 dark:text-brand-400 animate-spin" />
          <p className="text-sm font-medium text-slate-600 dark:text-slate-300">Iniciando entorno de facturación...</p>
        </div>
      </div>
    );
  }

  // Si no está autenticado, pantalla de Login
  if (!isAuthenticated) {
    return <LoginView />;
  }

  // --- CONTROLADORES DE EMPRESA ---
  const handleSaveConfig = async (newConfig: EmpresaConfig) => {
    try {
      const saved = await storageService.saveEmpresaConfig(newConfig);
      setEmpresaConfig(saved);
      showToast('ok', 'Configuración de la empresa guardada en Supabase.');
    } catch (err: any) {
      showToast('err', `Error guardando configuración: ${err.message}`);
    }
  };

  // --- CONTROLADORES DE CLIENTES ---
  const handleCreateCliente = async (data: Omit<Cliente, 'id' | 'createdAt' | 'updatedAt'>): Promise<Cliente> => {
    try {
      const nuevo = await storageService.createCliente(data);
      await reloadData();
      showToast('ok', `Cliente "${nuevo.nombreOrazonSocial}" guardado en Supabase.`);
      return nuevo;
    } catch (err: any) {
      showToast('err', `Error creando cliente: ${err.message}`);
      throw err;
    }
  };

  const handleUpdateCliente = async (id: string, data: Partial<Cliente>) => {
    try {
      const act = await storageService.updateCliente(id, data);
      await reloadData();
      showToast('ok', `Cliente "${act.nombreOrazonSocial}" actualizado en Supabase.`);
    } catch (err: any) {
      showToast('err', `Error actualizando cliente: ${err.message}`);
    }
  };

  const handleDeleteCliente = async (id: string) => {
    try {
      await storageService.deleteCliente(id);
      await reloadData();
      showToast('ok', 'Cliente eliminado de la base de datos.');
    } catch (err: any) {
      showToast('err', `Error eliminando cliente: ${err.message}`);
    }
  };

  // --- CONTROLADORES DE FACTURAS ---
  const handleSaveFactura = async (factura: Factura) => {
    try {
      const exists = facturas.some((f) => f.id === factura.id);
      if (exists) {
        await storageService.updateFactura(factura.id, factura);
        showToast('ok', `Factura ${factura.numero} actualizada en Supabase.`);
      } else {
        await storageService.createFactura(factura);
        showToast('ok', `Factura ${factura.numero} guardada en Supabase.`);
      }
      await reloadData();
      setFacturaToEdit(null);
      setCurrentView('facturas');
    } catch (err: any) {
      showToast('err', `Error guardando factura: ${err.message}`);
    }
  };

  const handleDeleteFactura = async (id: string) => {
    try {
      await storageService.deleteFactura(id);
      await reloadData();
      showToast('ok', 'Borrador de factura eliminado de Supabase.');
    } catch (err: any) {
      showToast('err', `Error eliminando factura: ${err.message}`);
    }
  };

  const handleEditInvoice = (factura: Factura) => {
    setFacturaToEdit(factura);
    setCurrentView('nueva-factura');
  };

  const handleNewInvoice = () => {
    setFacturaToEdit(null);
    setCurrentView('nueva-factura');
  };

  const handleAddPago = async (
    facturaId: string,
    pago: { fecha: string; importe: number; metodo: string; referencia?: string; notas?: string }
  ) => {
    try {
      await storageService.addPagoFactura(facturaId, pago);
      await reloadData();
      showToast('ok', 'Cobro registrado y conciliado en Supabase.');
    } catch (err: any) {
      showToast('err', `Error registrando cobro: ${err.message}`);
    }
  };

  const handleRectify = async (facturaId: string, motivo: string) => {
    try {
      const rect = await storageService.crearFacturaRectificativa(facturaId, motivo);
      await reloadData();
      showToast('ok', `Factura rectificativa ${rect.numero} emitida en Supabase.`);
    } catch (err: any) {
      showToast('err', `Error al rectificar factura: ${err.message}`);
    }
  };

  return (
    <AppLayout
      currentView={currentView}
      onNavigate={(v) => {
        if (v === 'nueva-factura' && currentView !== 'nueva-factura') {
          setFacturaToEdit(null);
        }
        setCurrentView(v);
      }}
      empresaConfig={empresaConfig}
      onOpenBackupModal={() => setIsBackupOpen(true)}
    >
      {/* Toast Notification */}
      {toast && (
        <div className="fixed bottom-5 right-5 z-50 animate-bounce">
          <div
            className={`px-4 py-3 rounded-xl shadow-modal text-xs font-semibold flex items-center gap-2.5 ${
              toast.type === 'ok'
                ? 'bg-slate-900 text-white border border-slate-700'
                : 'bg-red-600 text-white'
            }`}
          >
            {toast.type === 'ok' ? (
              <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
            ) : (
              <AlertCircle className="w-4 h-4 text-white shrink-0" />
            )}
            <span>{toast.message}</span>
          </div>
        </div>
      )}

      {/* Indicador de carga de datos */}
      {isDataLoading && (
        <div className="fixed top-4 right-4 z-40 bg-slate-900/90 text-white text-xs px-3 py-1.5 rounded-full flex items-center gap-2 shadow-md border border-slate-700">
          <Loader2 className="w-3.5 h-3.5 animate-spin text-brand-400" />
          <span>Sincronizando con Supabase...</span>
        </div>
      )}

      {/* Renderizado condicional de vistas */}
      {currentView === 'dashboard' && (
        <DashboardView
          stats={stats}
          recentFacturas={facturas}
          onNavigate={(v) => {
            if (v === 'nueva-factura') setFacturaToEdit(null);
            setCurrentView(v);
          }}
          onPreviewFactura={(f) => setPreviewFactura(f)}
        />
      )}

      {currentView === 'facturas' && (
        <InvoicesListView
          facturas={facturas}
          onNewInvoice={handleNewInvoice}
          onEditInvoice={handleEditInvoice}
          onDeleteInvoice={handleDeleteFactura}
          onPreviewInvoice={(f) => setPreviewFactura(f)}
          onAddPago={handleAddPago}
          onRectify={handleRectify}
        />
      )}

      {currentView === 'nueva-factura' && (
        <InvoiceFormView
          facturaToEdit={facturaToEdit}
          empresaConfig={empresaConfig}
          clientes={clientes}
          facturas={facturas}
          onSave={handleSaveFactura}
          onCancel={() => {
            setFacturaToEdit(null);
            setCurrentView('facturas');
          }}
          onPreview={(f) => setPreviewFactura(f)}
          onCreateClienteInline={handleCreateCliente}
        />
      )}

      {currentView === 'clientes' && (
        <ClientsView
          clientes={clientes}
          onCreateCliente={handleCreateCliente}
          onUpdateCliente={handleUpdateCliente}
          onDeleteCliente={handleDeleteCliente}
        />
      )}

      {currentView === 'configuracion' && (
        <CompanyConfigView
          config={empresaConfig}
          onSave={handleSaveConfig}
        />
      )}

      {/* Modal de Vista Previa PDF */}
      <PdfPreviewModal
        factura={previewFactura}
        onClose={() => setPreviewFactura(null)}
      />

      {/* Modal de Copia de Seguridad */}
      <BackupModal
        isOpen={isBackupOpen}
        onClose={() => setIsBackupOpen(false)}
        onDataReloaded={reloadData}
      />
    </AppLayout>
  );
};

export default function App() {
  return (
    <ThemeProvider>
      <AuthProvider>
        <MainAppContent />
      </AuthProvider>
    </ThemeProvider>
  );
}
