import React, { useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { Lock, Mail, ShieldAlert, KeyRound, ArrowRight, UserPlus, LogIn, CheckCircle2 } from 'lucide-react';

export const LoginView: React.FC = () => {
  const { login, signup, solicitarRecuperacion, error: authError } = useAuth();
  const [modo, setModo] = useState<'login' | 'signup'>('login');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [nombre, setNombre] = useState('');
  const [loading, setLoading] = useState(false);
  const [localError, setLocalError] = useState<string | null>(null);
  const [localSuccess, setLocalSuccess] = useState<string | null>(null);

  // Modal recuperación
  const [mostrarRecuperar, setMostrarRecuperar] = useState(false);
  const [emailRecuperar, setEmailRecuperar] = useState('');
  const [recuperarMensaje, setRecuperarMensaje] = useState<{ tipo: 'ok' | 'err'; texto: string } | null>(null);
  const [cargandoRecuperar, setCargandoRecuperar] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLocalError(null);
    setLocalSuccess(null);

    if (!email.trim() || !password.trim()) {
      setLocalError('Por favor, introduzca su correo electrónico y contraseña.');
      return;
    }

    setLoading(true);
    try {
      if (modo === 'login') {
        const ok = await login(email, password);
        if (!ok) {
          setLocalError(authError || 'Credenciales no autorizadas en Supabase.');
        }
      } else {
        const res = await signup(email, password, nombre);
        if (res.success) {
          setLocalSuccess(res.message);
          setModo('login');
        } else {
          setLocalError(res.message);
        }
      }
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
    <div className="min-h-screen bg-slate-900 flex flex-col justify-center py-12 sm:px-6 lg:px-8">
      <div className="sm:mx-auto sm:w-full sm:max-w-md">
        {/* Brand Icon */}
        <div className="flex justify-center">
          <div className="h-14 w-14 rounded-2xl bg-brand-600 flex items-center justify-center font-bold text-white text-2xl tracking-tight shadow-lg shadow-brand-500/20">
            F
          </div>
        </div>
        <h2 className="mt-4 text-center text-2xl font-bold tracking-tight text-white">
          FACENIA Facturación
        </h2>
        <p className="mt-1 text-center text-xs text-slate-400">
          Plataforma privada de gestión comercial con base de datos en Supabase
        </p>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md px-4 sm:px-0">
        <div className="bg-slate-800/90 backdrop-blur-sm border border-slate-700/80 py-8 px-6 shadow-xl rounded-2xl sm:px-10 text-white">
          {/* Selector de modo */}
          <div className="flex rounded-lg bg-slate-900/60 p-1 mb-6 border border-slate-700">
            <button
              type="button"
              onClick={() => {
                setModo('login');
                setLocalError(null);
                setLocalSuccess(null);
              }}
              className={`flex-1 py-1.5 text-xs font-semibold rounded-md transition-all flex items-center justify-center gap-1.5 ${
                modo === 'login'
                  ? 'bg-brand-600 text-white shadow-sm'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              <LogIn className="w-3.5 h-3.5" />
              <span>Iniciar Sesión</span>
            </button>
            <button
              type="button"
              onClick={() => {
                setModo('signup');
                setLocalError(null);
                setLocalSuccess(null);
              }}
              className={`flex-1 py-1.5 text-xs font-semibold rounded-md transition-all flex items-center justify-center gap-1.5 ${
                modo === 'signup'
                  ? 'bg-brand-600 text-white shadow-sm'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              <UserPlus className="w-3.5 h-3.5" />
              <span>Crear Administrador</span>
            </button>
          </div>

          {(localError || authError) && (
            <div className="mb-5 rounded-lg bg-red-900/30 border border-red-500/50 p-3.5 flex items-start gap-2.5 text-red-200 text-xs">
              <ShieldAlert className="w-4 h-4 text-red-400 shrink-0 mt-0.5" />
              <span>{localError || authError}</span>
            </div>
          )}

          {localSuccess && (
            <div className="mb-5 rounded-lg bg-emerald-900/30 border border-emerald-500/50 p-3.5 flex items-start gap-2.5 text-emerald-200 text-xs">
              <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
              <span>{localSuccess}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            {modo === 'signup' && (
              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1">
                  Nombre o Razón
                </label>
                <input
                  type="text"
                  value={nombre}
                  onChange={(e) => setNombre(e.target.value)}
                  placeholder="Administrador Principal"
                  className="w-full px-3 py-2 bg-slate-900/60 border border-slate-700 rounded-lg text-sm text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-brand-500 focus:border-transparent transition-all"
                />
              </div>
            )}

            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1">
                Correo Electrónico
              </label>
              <div className="relative">
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="ejemplo@facenia.tech"
                  required
                  className="w-full pl-9 pr-3 py-2 bg-slate-900/60 border border-slate-700 rounded-lg text-sm text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-brand-500 focus:border-transparent transition-all"
                />
                <Mail className="w-4 h-4 text-slate-500 absolute left-3 top-2.5 pointer-events-none" />
              </div>
            </div>

            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="block text-xs font-medium text-slate-300">
                  Contraseña
                </label>
                {modo === 'login' && (
                  <button
                    type="button"
                    onClick={() => setMostrarRecuperar(true)}
                    className="text-[11px] text-brand-400 hover:text-brand-300 hover:underline"
                  >
                    ¿Olvidó su contraseña?
                  </button>
                )}
              </div>
              <div className="relative">
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  required
                  className="w-full pl-9 pr-3 py-2 bg-slate-900/60 border border-slate-700 rounded-lg text-sm text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-brand-500 focus:border-transparent transition-all"
                />
                <Lock className="w-4 h-4 text-slate-500 absolute left-3 top-2.5 pointer-events-none" />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full mt-2 flex items-center justify-center gap-2 py-2.5 px-4 bg-brand-600 hover:bg-brand-500 text-white rounded-lg text-sm font-semibold shadow-md transition-all disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? (
                <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              ) : (
                <>
                  <span>{modo === 'login' ? 'Entrar al Sistema' : 'Crear Usuario'}</span>
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>
          </form>
        </div>
      </div>

      {/* Modal Recuperación */}
      {mostrarRecuperar && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
          <div className="bg-slate-800 border border-slate-700 rounded-xl max-w-sm w-full p-6 text-white shadow-2xl">
            <div className="flex items-center gap-2 mb-3">
              <KeyRound className="w-5 h-5 text-brand-400" />
              <h3 className="text-base font-bold">Recuperar Contraseña</h3>
            </div>
            <p className="text-xs text-slate-400 mb-4">
              Introduzca su correo registrado en Supabase para recibir el enlace de restablecimiento.
            </p>

            {recuperarMensaje && (
              <div
                className={`mb-4 p-3 rounded-lg text-xs ${
                  recuperarMensaje.tipo === 'ok'
                    ? 'bg-emerald-900/40 text-emerald-200 border border-emerald-500/40'
                    : 'bg-red-900/40 text-red-200 border border-red-500/40'
                }`}
              >
                {recuperarMensaje.texto}
              </div>
            )}

            <form onSubmit={handleRecuperar} className="space-y-3">
              <div>
                <input
                  type="email"
                  value={emailRecuperar}
                  onChange={(e) => setEmailRecuperar(e.target.value)}
                  placeholder="su-email@empresa.com"
                  required
                  className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded-lg text-sm text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-brand-500"
                />
              </div>
              <div className="flex gap-2 justify-end pt-2">
                <button
                  type="button"
                  onClick={() => {
                    setMostrarRecuperar(false);
                    setRecuperarMensaje(null);
                  }}
                  className="px-3 py-1.5 text-xs text-slate-300 hover:text-white"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={cargandoRecuperar}
                  className="px-4 py-1.5 bg-brand-600 hover:bg-brand-500 text-white rounded-lg text-xs font-semibold disabled:opacity-50"
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
