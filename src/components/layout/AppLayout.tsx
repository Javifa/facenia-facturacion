import React, { useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import type { EmpresaConfig } from '../../types';
import {
  LayoutDashboard,
  FileText,
  PlusCircle,
  Users,
  Settings,
  LogOut,
  Menu,
  X,
  AlertTriangle,
  ArrowRight,
  Database,
  ShieldCheck,
} from 'lucide-react';

export type CurrentView = 'dashboard' | 'facturas' | 'nueva-factura' | 'clientes' | 'configuracion';

interface AppLayoutProps {
  currentView: CurrentView;
  onNavigate: (view: CurrentView) => void;
  empresaConfig: EmpresaConfig;
  onOpenBackupModal: () => void;
  children: React.ReactNode;
}

export const AppLayout: React.FC<AppLayoutProps> = ({
  currentView,
  onNavigate,
  empresaConfig,
  onOpenBackupModal,
  children,
}) => {
  const { usuario, logout } = useAuth();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const navItems = [
    { id: 'dashboard' as CurrentView, label: 'Panel Principal', icon: LayoutDashboard },
    { id: 'facturas' as CurrentView, label: 'Facturas', icon: FileText },
    { id: 'nueva-factura' as CurrentView, label: 'Crear Factura', icon: PlusCircle },
    { id: 'clientes' as CurrentView, label: 'Clientes', icon: Users },
    { id: 'configuracion' as CurrentView, label: 'Configuración', icon: Settings },
  ];

  const handleNavClick = (view: CurrentView) => {
    onNavigate(view);
    setMobileMenuOpen(false);
  };

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col md:flex-row">
      {/* SIDEBAR ESCRITORIO */}
      <aside className="hidden md:flex md:w-64 md:flex-col md:fixed md:inset-y-0 bg-slate-900 border-r border-slate-800 text-slate-300 z-30">
        {/* Brand Header */}
        <div className="h-16 flex items-center gap-3 px-6 border-b border-slate-800 bg-slate-950">
          <div className="h-9 w-9 rounded-lg bg-brand-600 flex items-center justify-center font-bold text-white text-lg tracking-tight shadow-sm">
            F
          </div>
          <div>
            <h1 className="text-base font-bold text-white tracking-tight">FACENIA</h1>
            <p className="text-[10px] uppercase tracking-wider text-slate-400 font-medium">Facturación Privada</p>
          </div>
        </div>

        {/* Navigation links */}
        <nav className="flex-1 px-3 py-4 space-y-1">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = currentView === item.id;
            return (
              <button
                key={item.id}
                onClick={() => handleNavClick(item.id)}
                className={`w-full flex items-center gap-3 px-3.5 py-2.5 rounded-lg text-sm font-medium transition-colors ${
                  isActive
                    ? 'bg-brand-600 text-white font-semibold shadow-sm'
                    : 'text-slate-300 hover:bg-slate-800/80 hover:text-white'
                }`}
              >
                <Icon className={`w-4 h-4 ${isActive ? 'text-white' : 'text-slate-400'}`} />
                <span>{item.label}</span>
              </button>
            );
          })}
        </nav>

        {/* Secondary Actions (Backup & Data) */}
        <div className="px-3 py-2 border-t border-slate-800">
          <button
            onClick={onOpenBackupModal}
            className="w-full flex items-center gap-3 px-3.5 py-2 rounded-lg text-xs font-medium text-slate-400 hover:bg-slate-800 hover:text-slate-200 transition-colors"
          >
            <Database className="w-4 h-4 text-slate-400" />
            <span>Copia de Seguridad / Datos</span>
          </button>
        </div>

        {/* User Card & Logout */}
        <div className="p-4 border-t border-slate-800 bg-slate-950/60">
          <div className="flex items-center justify-between">
            <div className="min-w-0 flex-1 pr-2">
              <div className="flex items-center gap-1.5">
                <ShieldCheck className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                <p className="text-xs font-semibold text-white truncate">
                  {usuario?.nombre || 'Administrador'}
                </p>
              </div>
              <p className="text-[11px] text-slate-400 truncate">{usuario?.email}</p>
            </div>
            <button
              onClick={logout}
              title="Cerrar Sesión"
              className="p-1.5 text-slate-400 hover:text-red-400 hover:bg-slate-800 rounded-lg transition-colors"
            >
              <LogOut className="w-4 h-4" />
            </button>
          </div>
        </div>
      </aside>

      {/* HEADER MÓVIL */}
      <header className="md:hidden bg-slate-900 border-b border-slate-800 text-white px-4 py-3 flex items-center justify-between sticky top-0 z-40">
        <div className="flex items-center gap-2.5">
          <div className="h-8 w-8 rounded-lg bg-brand-600 flex items-center justify-center font-bold text-white text-base">
            F
          </div>
          <div>
            <h1 className="text-sm font-bold leading-tight">FACENIA</h1>
            <p className="text-[9px] uppercase tracking-wider text-slate-400">Facturación</p>
          </div>
        </div>

        <button
          onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          className="p-2 text-slate-300 hover:text-white rounded-lg hover:bg-slate-800 focus:outline-none"
          aria-label="Abrir menú"
        >
          {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
        </button>
      </header>

      {/* DRAWER MÓVIL */}
      {mobileMenuOpen && (
        <div className="md:hidden fixed inset-0 z-50 bg-slate-900/80 backdrop-blur-sm">
          <div className="fixed inset-y-0 left-0 w-72 bg-slate-900 text-white p-5 flex flex-col shadow-xl">
            <div className="flex items-center justify-between pb-4 border-b border-slate-800">
              <div className="flex items-center gap-2.5">
                <div className="h-8 w-8 rounded-lg bg-brand-600 flex items-center justify-center font-bold text-white">
                  F
                </div>
                <span className="font-bold text-sm">FACENIA Facturas</span>
              </div>
              <button
                onClick={() => setMobileMenuOpen(false)}
                className="p-1.5 text-slate-400 hover:text-white rounded-lg"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <nav className="flex-1 py-4 space-y-1">
              {navItems.map((item) => {
                const Icon = item.icon;
                const isActive = currentView === item.id;
                return (
                  <button
                    key={item.id}
                    onClick={() => handleNavClick(item.id)}
                    className={`w-full flex items-center gap-3 px-3.5 py-2.5 rounded-lg text-sm font-medium transition-colors ${
                      isActive
                        ? 'bg-brand-600 text-white font-semibold'
                        : 'text-slate-300 hover:bg-slate-800 hover:text-white'
                    }`}
                  >
                    <Icon className="w-4 h-4" />
                    <span>{item.label}</span>
                  </button>
                );
              })}

              <div className="pt-4 border-t border-slate-800">
                <button
                  onClick={() => {
                    setMobileMenuOpen(false);
                    onOpenBackupModal();
                  }}
                  className="w-full flex items-center gap-3 px-3.5 py-2.5 rounded-lg text-sm font-medium text-slate-300 hover:bg-slate-800"
                >
                  <Database className="w-4 h-4 text-slate-400" />
                  <span>Copia de Seguridad</span>
                </button>
              </div>
            </nav>

            <div className="pt-4 border-t border-slate-800 flex items-center justify-between">
              <div>
                <p className="text-xs font-semibold text-white">{usuario?.nombre}</p>
                <p className="text-[11px] text-slate-400">{usuario?.email}</p>
              </div>
              <button
                onClick={logout}
                className="p-2 text-slate-400 hover:text-red-400 rounded-lg hover:bg-slate-800"
              >
                <LogOut className="w-5 h-5" />
              </button>
            </div>
          </div>
        </div>
      )}

      {/* CONTENIDO PRINCIPAL */}
      <div className="flex-1 md:pl-64 flex flex-col min-h-screen">
        {/* BANNER GLOBAL DE MODO DEMO */}
        {empresaConfig.esDemo && (
          <div className="bg-amber-500 text-slate-950 px-4 py-2.5 text-xs sm:text-sm font-medium flex items-center justify-between gap-3 shadow-sm border-b border-amber-600/20">
            <div className="flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 text-slate-950 shrink-0" />
              <span>
                <strong>Modo Demostración Activo:</strong> La empresa está configurada con datos ficticios de prueba ({empresaConfig.nombreComercial} - NIF: {empresaConfig.nifCif}). Los documentos emitidos se marcarán como demo.
              </span>
            </div>
            <button
              onClick={() => onNavigate('configuracion')}
              className="hidden sm:inline-flex items-center gap-1 px-2.5 py-1 bg-slate-900 text-white rounded text-xs font-semibold hover:bg-slate-800 transition-colors shrink-0"
            >
              <span>Editar Datos Empresa</span>
              <ArrowRight className="w-3 h-3" />
            </button>
          </div>
        )}

        {/* MAIN VIEWPORT */}
        <main className="flex-1 p-4 sm:p-6 lg:p-8 max-w-7xl w-full mx-auto">
          {children}
        </main>
      </div>
    </div>
  );
};
