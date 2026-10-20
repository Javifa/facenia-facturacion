import React, { useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useTheme } from '../../context/ThemeContext';
import {
  Lock,
  Mail,
  ShieldAlert,
  KeyRound,
  ArrowRight,
  Sun,
  Moon,
  ShieldCheck,
} from 'lucide-react';

export const LoginView: React.FC = () => {
  const { login, solicitarRecuperacion, error: authError } = useAuth();
  const { resolvedTheme, toggleTheme } = useTheme();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [localError, setLocalError] = useState<string | null>(null);

  // Modal recuperación
  const [mostrarRecuperar, setMostrarRecuperar] = useState(false);
  const [emailRecuperar, setEmailRecuperar] = useState('');
  const [recuperarMensaje, setRecuperarMensaje] = useState<{ tipo: 'ok' | 'err'; texto: string } | null>(null);
  const [cargandoRecuperar, setCargandoRecuperar] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLocalError(null);

    if (!email.trim() || !password.trim()) {
      setLocalError('Por favor, introduzca su usuario o correo electrónico y contraseña.');
      return;
    }

    setLoading(true);
    try {
      await login(email, password);
    } catch (err: any) {
      setLocalError(`Error al procesar la solicitud: ${err?.message || 'Error de red'}`);
    } finally {
      setLoading(false);
    }
  };

  const handleRecuperar = async (e: React.FormEvent) => {
    e.preventDefault();
    setCargandoRecuperar(true);
    setRecuperarMensaje(null);
    try {
      const res = await solicitarRecuperacion(emailRecuperar);
      if (res.success) {
        setRecuperarMensaje({ tipo: 'ok', texto: res.message });
      } else {
        setRecuperarMensaje({ tipo: 'err', texto: res.message });
      }
    } catch {
      setRecuperarMensaje({ tipo: 'err', texto: 'No se pudo tramitar la solicitud de recuperación.' });
    } finally {
      setCargandoRecuperar(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 flex flex-col justify-center py-12 sm:px-6 lg:px-8 relative transition-colors duration-150">
      {/* Selector de tema en la esquina superior derecha */}
      <div className="absolute top-5 right-5">
        <button
          type="button"
          onClick={toggleTheme}
          className="inline-flex items-center gap-2 px-3 py-2 rounded-lg text-xs font-medium bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-200 border border-slate-200 dark:border-slate-800 shadow-subtle hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
        >
          {resolvedTheme === 'dark' ? (
            <>
              <Sun className="w-4 h-4 text-amber-400" />
              <span>Modo Claro</span>
            </>
          ) : (
            <>
              <Moon className="w-4 h-4 text-slate-600" />
              <span>Modo Oscuro</span>
            </>
          )}
        </button>
      </div>

      <div className="sm:mx-auto sm:w-full sm:max-w-md px-4">
        {/* Logotipo Oficial FACENIA */}
        <div className="flex justify-center">
          <div className="h-16 w-16 rounded-2xl bg-white border border-slate-200 dark:border-slate-700 p-2.5 flex items-center justify-center shadow-card">
            <img src="/logo.png" alt="FACENIA Logo" className="w-full h-full object-contain" />
          </div>
        </div>
        <h1 className="mt-4 text-center text-2xl font-bold tracking-tight text-slate-900 dark:text-white">
          FACENIA Facturación
        </h1>
        <p className="mt-1 text-center text-xs text-slate-500 dark:text-slate-400">
          Plataforma corporativa de gestión de facturación y control fiscal
        </p>
      </div>

      <div className="mt-7 sm:mx-auto sm:w-full sm:max-w-md px-4 sm:px-0">
        <div className="bg-white dark:bg-slate-900 border border-slate-200/90 dark:border-slate-800 py-8 px-6 shadow-card rounded-2xl sm:px-10">
          {/* Cabecera de acceso corporativo */}
          <div className="flex items-center gap-2.5 pb-4 mb-5 border-b border-slate-100 dark:border-slate-800">
            <div className="p-2 rounded-lg bg-brand-50 dark:bg-brand-950/60 text-brand-700 dark:text-brand-300">
              <ShieldCheck className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-sm font-bold text-slate-900 dark:text-white">
                Acceso Privado Autorizado
              </h2>
              <p className="text-[11px] text-slate-500 dark:text-slate-400">
                Identifíquese con sus credenciales corporativas
              </p>
            </div>
          </div>

          {(localError || authError) && (
            <div className="mb-5 rounded-lg bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-800/70 p-3.5 flex items-start gap-2.5 text-red-800 dark:text-red-200 text-xs">
              <ShieldAlert className="w-4 h-4 text-red-600 dark:text-red-400 shrink-0 mt-0.5" />
              <span>{localError || authError}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label htmlFor="auth-identificador" className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                Correo Electrónico o Usuario
              </label>
              <div className="relative">
                <input
                  id="auth-identificador"
                  name="identificador"
                  type="text"
                  autoComplete="username"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="contacto@facenia.tech o usuario"
                  required
                  className="w-full pl-9 pr-3 py-2.5 bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-700 rounded-lg text-sm text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-brand-500 focus:border-transparent transition-all"
                />
                <Mail className="w-4 h-4 text-slate-400 absolute left-3 top-3 pointer-events-none" />
              </div>
            </div>

            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label htmlFor="auth-password" className="block text-xs font-semibold text-slate-700 dark:text-slate-300">
                  Contraseña
                </label>
                <button
                  type="button"
                  onClick={() => setMostrarRecuperar(true)}
                  className="text-[11px] font-medium text-brand-700 dark:text-brand-400 hover:underline"
                >
                  ¿Olvidó su contraseña?
                </button>
              </div>
              <div className="relative">
                <input
                  id="auth-password"
                  name="password"
                  type="password"
                  autoComplete="current-password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  required
                  className="w-full pl-9 pr-3 py-2.5 bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-700 rounded-lg text-sm text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-brand-500 focus:border-transparent transition-all"
                />
                <Lock className="w-4 h-4 text-slate-400 absolute left-3 top-3 pointer-events-none" />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full mt-2 flex items-center justify-center gap-2 py-2.5 px-4 bg-brand-700 hover:bg-brand-800 text-white rounded-lg text-sm font-semibold shadow-subtle transition-all disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? (
                <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              ) : (
                <>
                  <span>Acceder al Panel</span>
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>
          </form>

          <div className="mt-6 pt-4 border-t border-slate-100 dark:border-slate-800 text-center">
            <p className="text-[11px] text-slate-400 dark:text-slate-500">
              Sistema de uso interno exclusivo de FACENIA. El alta de usuarios se gestiona únicamente desde la base de datos.
            </p>
          </div>
        </div>
      </div>

      {/* Modal Recuperación */}
      {mostrarRecuperar && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl max-w-sm w-full p-6 text-slate-900 dark:text-white shadow-modal">
            <div className="flex items-center gap-2 mb-2">
              <KeyRound className="w-5 h-5 text-brand-600 dark:text-brand-400" />
              <h3 className="text-base font-bold">Restablecer Contraseña</h3>
            </div>
            <p className="text-xs text-slate-500 dark:text-slate-400 mb-4">
              Introduzca su correo electrónico corporativo para recibir las instrucciones de recuperación.
            </p>

            {recuperarMensaje && (
              <div
                className={`mb-4 p-3 rounded-lg text-xs ${
                  recuperarMensaje.tipo === 'ok'
                    ? 'bg-emerald-50 dark:bg-emerald-950/40 text-emerald-800 dark:text-emerald-200 border border-emerald-200 dark:border-emerald-800'
                    : 'bg-red-50 dark:bg-red-950/40 text-red-800 dark:text-red-200 border border-red-200 dark:border-red-800'
                }`}
              >
                {recuperarMensaje.texto}
              </div>
            )}

            <form onSubmit={handleRecuperar} className="space-y-3">
              <div>
                <label htmlFor="recover-email" className="sr-only">
                  Correo electrónico de recuperación
                </label>
                <input
                  id="recover-email"
                  name="recoverEmail"
                  type="email"
                  autoComplete="email"
                  value={emailRecuperar}
                  onChange={(e) => setEmailRecuperar(e.target.value)}
                  placeholder="contacto@facenia.tech"
                  required
                  className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-700 rounded-lg text-sm text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-brand-500"
                />
              </div>
              <div className="flex gap-2 justify-end pt-2">
                <button
                  type="button"
                  onClick={() => {
                    setMostrarRecuperar(false);
                    setRecuperarMensaje(null);
                  }}
                  className="px-3 py-1.5 text-xs font-medium text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={cargandoRecuperar}
                  className="px-4 py-1.5 bg-brand-700 hover:bg-brand-800 text-white rounded-lg text-xs font-semibold disabled:opacity-50"
                >
                  {cargandoRecuperar ? 'Enviando...' : 'Enviar enlace'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
