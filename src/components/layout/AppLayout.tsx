import React, { useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useTheme } from '../../context/ThemeContext';
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
  Sun,
  Moon,
} from 'lucide-react';

export type CurrentView = 'dashboard' | 'facturas' | 'nueva-factura' | 'clientes' | 'configuracion';

interface AppLayoutProps {
  currentView: CurrentView;
  onNavigate: (view: CurrentView) => void;
  empresaConfig: EmpresaConfig;
  onOpenBackupModal: () => void;
  children: React.ReactNode;
}

const VIEW_METADATA: Record<CurrentView, { title: string; subtitle: string }> = {
  dashboard: {
    title: 'Panel Ejecutivo',
    subtitle: 'Indicadores financieros, estado de cobros y actividad reciente',
  },
  facturas: {
    title: 'Registro de Facturas',
    subtitle: 'Control documental, conciliación de pagos y rectificaciones',
  },
  'nueva-factura': {
    title: 'Emisión de Factura',
    subtitle: 'Cálculo impositivo automatizado y generación de documento PDF',
  },
  clientes: {
    title: 'Directorio de Clientes',
    subtitle: 'Fichas fiscales y datos de facturación de destinatarios',
  },
  configuracion: {
    title: 'Configuración Corporativa',
    subtitle: 'Identidad fiscal de FACENIA, cuentas bancarias y apariencia',
  },
};

export const AppLayout: React.FC<AppLayoutProps> = ({
  currentView,
  onNavigate,
  empresaConfig,
  onOpenBackupModal,
  children,
}) => {
  const { usuario, logout } = useAuth();
  const { resolvedTheme, toggleTheme } = useTheme();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const navItems = [
    { id: 'dashboard' as CurrentView, label: 'Panel Principal', icon: LayoutDashboard },
    { id: 'facturas' as CurrentView, label: 'Facturas', icon: FileText },
    { id: 'nueva-factura' as CurrentView, label: 'Emitir Factura', icon: PlusCircle },
    { id: 'clientes' as CurrentView, label: 'Clientes', icon: Users },
    { id: 'configuracion' as CurrentView, label: 'Configuración', icon: Settings },
  ];

  const handleNavClick = (view: CurrentView) => {
    onNavigate(view);
    setMobileMenuOpen(false);
  };

  const logoSrc = empresaConfig.logotipoUrl || '/logo.png';
  const currentMeta = VIEW_METADATA[currentView];

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 flex flex-col md:flex-row transition-colors duration-150">
      {/* SIDEBAR ESCRITORIO */}
      <aside className="hidden md:flex md:w-64 md:flex-col md:fixed md:inset-y-0 bg-white dark:bg-slate-900 border-r border-slate-200/90 dark:border-slate-800 z-30 transition-colors duration-150">
        {/* Brand Header */}
        <div className="h-16 flex items-center gap-3 px-5 border-b border-slate-200/80 dark:border-slate-800">
          <div className="h-9 w-9 rounded-lg bg-white border border-slate-200 dark:border-slate-700 p-1.5 flex items-center justify-center shadow-subtle shrink-0">
            <img
              src={logoSrc}
              alt="FACENIA Logo"
              className="w-full h-full object-contain"
              onError={(e) => {
                (e.currentTarget as HTMLImageElement).src = '/logo.png';
              }}
            />
          </div>
          <div className="min-w-0">
            <h1 className="text-sm font-bold text-slate-900 dark:text-white tracking-tight truncate">
              {empresaConfig.nombreComercial || 'FACENIA'}
            </h1>
            <p className="text-[11px] text-slate-500 dark:text-slate-400 font-medium truncate">
              Gestión de Facturación
            </p>
          </div>
        </div>

        {/* Navigation links */}
        <nav className="flex-1 px-3 py-5 space-y-1" aria-label="Navegación principal">
          <div className="px-3 pb-2 text-[10px] font-semibold uppercase tracking-wider text-slate-400 dark:text-slate-500">
            Área Operativa
          </div>
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = currentView === item.id;
            return (
              <button
                key={item.id}
                onClick={() => handleNavClick(item.id)}
                className={`w-full flex items-center gap-3 px-3.5 py-2.5 rounded-lg text-xs sm:text-sm font-medium transition-colors ${
                  isActive
                    ? 'bg-brand-700 text-white font-semibold shadow-subtle'
                    : 'text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800/80 hover:text-slate-900 dark:hover:text-white'
                }`}
              >
                <Icon
                  className={`w-4 h-4 shrink-0 ${
                    isActive ? 'text-white' : 'text-slate-400 dark:text-slate-400'
                  }`}
                />
                <span>{item.label}</span>
              </button>
            );
          })}
        </nav>

        {/* Secondary Actions (Theme & Backup) */}
        <div className="px-3 py-3 border-t border-slate-200/80 dark:border-slate-800 space-y-1">
          <button
            type="button"
            onClick={toggleTheme}
            className="w-full flex items-center justify-between px-3.5 py-2 rounded-lg text-xs font-medium text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
          >
            <span className="flex items-center gap-2.5">
              {resolvedTheme === 'dark' ? (
                <Moon className="w-4 h-4 text-brand-400" />
              ) : (
                <Sun className="w-4 h-4 text-amber-500" />
              )}
              <span>{resolvedTheme === 'dark' ? 'Modo Oscuro' : 'Modo Claro'}</span>
            </span>
            <span className="px-1.5 py-0.5 text-[10px] rounded bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400 border border-slate-200 dark:border-slate-700">
              Cambiar
            </span>
          </button>

          <button
            type="button"
            onClick={onOpenBackupModal}
            className="w-full flex items-center gap-2.5 px-3.5 py-2 rounded-lg text-xs font-medium text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
          >
            <Database className="w-4 h-4 text-slate-400" />
            <span>Copia de Seguridad / JSON</span>
          </button>
        </div>

        {/* User Card & Logout */}
        <div className="p-3.5 border-t border-slate-200/80 dark:border-slate-800 bg-slate-50/70 dark:bg-slate-950/50">
          <div className="flex items-center justify-between gap-2">
            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-1.5">
                <ShieldCheck className="w-3.5 h-3.5 text-brand-600 dark:text-brand-400 shrink-0" />
                <p className="text-xs font-semibold text-slate-900 dark:text-white truncate">
                  {usuario?.nombre || 'Administrador Principal'}
                </p>
              </div>
              <div className="flex items-center gap-1.5 mt-0.5">
                <span className="text-[11px] text-slate-500 dark:text-slate-400 truncate">
                  {usuario?.email}
                </span>
                <span className="px-1.5 py-0.2 text-[9px] font-semibold uppercase tracking-wide bg-brand-50 dark:bg-brand-900/50 text-brand-700 dark:text-brand-300 border border-brand-200 dark:border-brand-800 rounded shrink-0">
                  {usuario?.rol === 'admin_supremo' ? 'Dirección' : 'Admin'}
                </span>
              </div>
            </div>
            <button
              onClick={logout}
              title="Cerrar sesión"
              aria-label="Cerrar sesión"
              className="p-2 text-slate-500 dark:text-slate-400 hover:text-red-600 dark:hover:text-red-400 hover:bg-red-50 dark:hover:bg-red-950/40 rounded-lg transition-colors shrink-0"
            >
              <LogOut className="w-4 h-4" />
            </button>
          </div>
        </div>
      </aside>

      {/* HEADER MÓVIL */}
      <header className="md:hidden bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 px-4 py-3 flex items-center justify-between sticky top-0 z-40">
        <div className="flex items-center gap-2.5">
          <div className="h-8 w-8 rounded-lg bg-white border border-slate-200 dark:border-slate-700 p-1 flex items-center justify-center">
            <img src={logoSrc} alt="FACENIA" className="w-full h-full object-contain" />
          </div>
          <div>
            <h1 className="text-sm font-bold text-slate-900 dark:text-white leading-tight">
              {empresaConfig.nombreComercial || 'FACENIA'}
            </h1>
            <p className="text-[10px] text-slate-500 dark:text-slate-400">Facturación</p>
          </div>
        </div>

        <div className="flex items-center gap-1.5">
          <button
            type="button"
            onClick={toggleTheme}
            className="p-2 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg"
            aria-label="Cambiar tema claro u oscuro"
          >
            {resolvedTheme === 'dark' ? (
              <Sun className="w-5 h-5 text-amber-400" />
            ) : (
              <Moon className="w-5 h-5 text-slate-600" />
            )}
          </button>
          <button
            type="button"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="p-2 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg focus:outline-none"
            aria-label="Abrir menú de navegación"
          >
            {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
          </button>
        </div>
      </header>

      {/* DRAWER MÓVIL */}
      {mobileMenuOpen && (
        <div className="md:hidden fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm">
          <div className="fixed inset-y-0 left-0 w-72 bg-white dark:bg-slate-900 text-slate-900 dark:text-white p-5 flex flex-col shadow-xl border-r border-slate-200 dark:border-slate-800">
            <div className="flex items-center justify-between pb-4 border-b border-slate-200 dark:border-slate-800">
              <div className="flex items-center gap-2.5">
                <div className="h-8 w-8 rounded-lg bg-white border border-slate-200 dark:border-slate-700 p-1 flex items-center justify-center">
                  <img src={logoSrc} alt="FACENIA" className="w-full h-full object-contain" />
                </div>
                <span className="font-bold text-sm">FACENIA Facturación</span>
              </div>
              <button
                onClick={() => setMobileMenuOpen(false)}
                className="p-1.5 text-slate-400 hover:text-slate-700 dark:hover:text-white rounded-lg"
                aria-label="Cerrar menú"
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
                        ? 'bg-brand-700 text-white font-semibold'
                        : 'text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800'
                    }`}
                  >
                    <Icon className="w-4 h-4" />
                    <span>{item.label}</span>
                  </button>
                );
              })}

              <div className="pt-4 mt-4 border-t border-slate-200 dark:border-slate-800 space-y-1">
                <button
                  onClick={toggleTheme}
                  className="w-full flex items-center gap-3 px-3.5 py-2.5 rounded-lg text-sm font-medium text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800"
                >
                  {resolvedTheme === 'dark' ? (
                    <Sun className="w-4 h-4 text-amber-400" />
                  ) : (
                    <Moon className="w-4 h-4 text-slate-500" />
                  )}
                  <span>{resolvedTheme === 'dark' ? 'Cambiar a Modo Claro' : 'Cambiar a Modo Oscuro'}</span>
                </button>
                <button
                  onClick={() => {
                    setMobileMenuOpen(false);
                    onOpenBackupModal();
                  }}
                  className="w-full flex items-center gap-3 px-3.5 py-2.5 rounded-lg text-sm font-medium text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800"
                >
                  <Database className="w-4 h-4 text-slate-400" />
                  <span>Copia de Seguridad</span>
                </button>
              </div>
            </nav>

            <div className="pt-4 border-t border-slate-200 dark:border-slate-800 flex items-center justify-between">
              <div className="min-w-0">
                <p className="text-xs font-semibold text-slate-900 dark:text-white truncate">
                  {usuario?.nombre || 'Administrador Principal'}
                </p>
                <p className="text-[11px] text-slate-500 dark:text-slate-400 truncate">{usuario?.email}</p>
              </div>
              <button
                onClick={logout}
                className="p-2 text-slate-400 hover:text-red-500 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800"
                aria-label="Cerrar sesión"
              >
                <LogOut className="w-5 h-5" />
              </button>
            </div>
          </div>
        </div>
      )}

      {/* CONTENIDO PRINCIPAL */}
      <div className="flex-1 md:pl-64 flex flex-col min-h-screen">
        {/* TOPBAR ESCRITORIO */}
        <header className="hidden md:flex h-16 bg-white/80 dark:bg-slate-900/80 backdrop-blur-md border-b border-slate-200/80 dark:border-slate-800 px-8 items-center justify-between sticky top-0 z-20">
          <div>
            <h2 className="text-sm font-semibold text-slate-900 dark:text-white">{currentMeta.title}</h2>
            <p className="text-xs text-slate-500 dark:text-slate-400">{currentMeta.subtitle}</p>
          </div>

          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={toggleTheme}
              title={resolvedTheme === 'dark' ? 'Activar modo claro' : 'Activar modo oscuro'}
              className="inline-flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-medium bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-200 hover:bg-slate-200 dark:hover:bg-slate-700 border border-slate-200/80 dark:border-slate-700 transition-colors"
            >
              {resolvedTheme === 'dark' ? (
                <>
                  <Sun className="w-3.5 h-3.5 text-amber-400" />
                  <span>Modo Claro</span>
                </>
              ) : (
                <>
                  <Moon className="w-3.5 h-3.5 text-slate-600" />
                  <span>Modo Oscuro</span>
                </>
              )}
            </button>

            {currentView !== 'nueva-factura' && (
              <button
                type="button"
                onClick={() => onNavigate('nueva-factura')}
                className="inline-flex items-center gap-1.5 px-3.5 py-1.5 bg-brand-700 hover:bg-brand-800 text-white rounded-lg text-xs font-semibold shadow-subtle transition-colors"
              >
                <PlusCircle className="w-3.5 h-3.5" />
                <span>Nueva Factura</span>
              </button>
            )}
          </div>
        </header>

        {/* BANNER GLOBAL DE MODO DEMO */}
        {empresaConfig.esDemo && (
          <div className="bg-amber-50 dark:bg-amber-950/40 text-amber-900 dark:text-amber-200 px-4 sm:px-8 py-2.5 text-xs flex items-center justify-between gap-3 border-b border-amber-200 dark:border-amber-800/60">
            <div className="flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 text-amber-600 dark:text-amber-400 shrink-0" />
              <span>
                <strong>Entorno con datos fiscales de prueba:</strong> {empresaConfig.nombreComercial} (NIF:{' '}
                <span className="font-mono">{empresaConfig.nifCif}</span>). Actualice los datos en Configuración antes de emitir facturas definitivas.
              </span>
            </div>
            <button
              onClick={() => onNavigate('configuracion')}
              className="hidden sm:inline-flex items-center gap-1 px-2.5 py-1 bg-amber-900/10 dark:bg-amber-400/10 hover:bg-amber-900/20 dark:hover:bg-amber-400/20 text-amber-950 dark:text-amber-200 rounded-md text-xs font-semibold transition-colors shrink-0"
            >
              <span>Completar datos fiscales</span>
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
