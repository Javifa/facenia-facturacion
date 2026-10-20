import React, { createContext, useContext, useState, useEffect } from 'react';
import type { Usuario } from '../types';
import { supabase, isSupabaseConfigured } from '../utils/supabase';

interface AuthContextType {
  usuario: Usuario | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  error: string | null;
  login: (email: string, pass: string) => Promise<boolean>;
  signup: (email: string, pass: string, nombre?: string) => Promise<{ success: boolean; message: string }>;
  logout: () => Promise<void>;
  solicitarRecuperacion: (email: string) => Promise<{ success: boolean; message: string }>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [usuario, setUsuario] = useState<Usuario | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Función auxiliar para sincronizar y obtener el perfil desde la tabla public.usuarios
  const cargarPerfilUsuario = async (authUser: {
    id: string;
    email?: string;
    user_metadata?: Record<string, any>;
    app_metadata?: Record<string, any>;
  }): Promise<Usuario> => {
    const emailStr = authUser.email || '';
    const isSuperMeta =
      emailStr === 'admin@gmail.com' ||
      authUser.user_metadata?.rol === 'admin_supremo' ||
      authUser.app_metadata?.rol === 'admin_supremo';

    if (supabase) {
      try {
        const { data: filaUsuario } = await supabase
          .from('usuarios')
          .select('id, email, username, nombre, rol, ultimo_acceso')
          .eq('id', authUser.id)
          .maybeSingle();

        if (filaUsuario) {
          const ahora = new Date().toISOString();
          // Actualizar último acceso en segundo plano
          void supabase
            .from('usuarios')
            .update({ ultimo_acceso: ahora, updated_at: ahora })
            .eq('id', authUser.id);

          const rolValido: Usuario['rol'] =
            filaUsuario.rol === 'admin_supremo' || isSuperMeta
              ? 'admin_supremo'
              : filaUsuario.rol === 'gestor'
              ? 'gestor'
              : 'administrador';

          return {
            id: filaUsuario.id,
            email: filaUsuario.email || emailStr,
            nombre: filaUsuario.nombre || (rolValido === 'admin_supremo' ? 'Admin Supremo' : 'Administrador'),
            rol: rolValido,
            ultimoAcceso: ahora,
          };
        }
      } catch (err) {
        console.warn('No se pudo consultar public.usuarios, usando metadatos de sesión:', err);
      }
    }

    return {
      id: authUser.id,
      email: emailStr,
      nombre:
        authUser.user_metadata?.nombre ||
        (isSuperMeta ? 'Admin Supremo' : emailStr.split('@')[0] || 'Administrador'),
      rol: isSuperMeta ? 'admin_supremo' : 'administrador',
      ultimoAcceso: new Date().toISOString(),
    };
  };

  // Inicialización de sesión desde Supabase Auth
  useEffect(() => {
    const initSession = async () => {
      try {
        if (!isSupabaseConfigured || !supabase) {
          setIsLoading(false);
          return;
        }

        const { data: { session }, error: sessionError } = await supabase.auth.getSession();
        if (sessionError) {
          console.error('Error recuperando sesión:', sessionError);
        }

        if (session?.user) {
          const perfil = await cargarPerfilUsuario(session.user);
          setUsuario(perfil);
        }
      } catch (err) {
        console.error('Error restaurando sesión de Supabase:', err);
      } finally {
        setIsLoading(false);
      }
    };

    initSession();

    // Listener de cambios de autenticación
    if (isSupabaseConfigured && supabase) {
      const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
        if (session?.user) {
          void cargarPerfilUsuario(session.user).then((perfil) => {
            setUsuario(perfil);
            setIsLoading(false);
          });
        } else {
          setUsuario(null);
          setIsLoading(false);
        }
      });

      return () => {
        subscription.unsubscribe();
      };
    }
  }, []);

  const login = async (emailOrUser: string, pass: string): Promise<boolean> => {
    setError(null);
    const rawIdentifier = emailOrUser.trim().toLowerCase();
    const cleanPass = pass.trim();

    if (!rawIdentifier || !cleanPass) {
      setError('Por favor, introduzca su usuario o correo electrónico y contraseña.');
      return false;
    }

    if (!isSupabaseConfigured || !supabase) {
      setError('Supabase no está configurado. Verifique las variables de entorno.');
      return false;
    }

    try {
      // 1. Verificar hash bcrypt contra public.usuarios mediante RPC login_usuario
      const { data: rpcValid } = await supabase.rpc('login_usuario', {
        p_username: rawIdentifier,
        p_password: cleanPass,
      });

      let cleanEmail = rawIdentifier === 'admin123' ? 'admin123@facenia.tech' : rawIdentifier;

      // 2. Si el identificador es un username sin @, resolvemos su email en public.usuarios
      if (!cleanEmail.includes('@')) {
        const { data: resolvedEmail } = await supabase.rpc('resolver_email_login', {
          p_identificador: rawIdentifier,
        });
        if (resolvedEmail && typeof resolvedEmail === 'string' && resolvedEmail.includes('@')) {
          cleanEmail = resolvedEmail;
        }
      }

      // 3. Iniciar sesión autenticada JWT en Supabase Auth
      const { data, error: authError } = await supabase.auth.signInWithPassword({
        email: cleanEmail,
        password: cleanPass,
      });

      if (authError && !rpcValid) {
        if (authError.message.includes('Invalid login credentials')) {
          setError('Credenciales incorrectas. Verifique el usuario/correo y la contraseña.');
        } else if (authError.message.includes('Email not confirmed')) {
          setError('El correo electrónico no ha sido confirmado aún en Supabase.');
        } else {
          setError(`Error de acceso: ${authError.message}`);
        }
        return false;
      }

      if (data.user) {
        const perfil = await cargarPerfilUsuario(data.user);
        setUsuario(perfil);
        return true;
      }

      return false;
    } catch (err: any) {
      setError(`Fallo de conexión con Supabase: ${err.message || 'Error de red'}`);
      return false;
    }
  };

  const signup = async (email: string, pass: string, nombre?: string): Promise<{ success: boolean; message: string }> => {
    setError(null);
    const cleanEmail = email.trim().toLowerCase();
    const cleanPass = pass.trim();

    if (!cleanEmail || !cleanPass) {
      return { success: false, message: 'Debe especificar correo y contraseña.' };
    }

    if (cleanPass.length < 6) {
      return { success: false, message: 'La contraseña debe tener al menos 6 caracteres.' };
    }

    if (!isSupabaseConfigured || !supabase) {
      return { success: false, message: 'Supabase no está configurado.' };
    }

    try {
      const { data, error: signError } = await supabase.auth.signUp({
        email: cleanEmail,
        password: cleanPass,
        options: {
          data: {
            nombre: nombre?.trim() || cleanEmail.split('@')[0] || 'Administrador',
          },
        },
      });

      if (signError) {
        return { success: false, message: signError.message };
      }

      if (data.session) {
        // Sesión creada automáticamente (sin confirmación requerida)
        return { success: true, message: 'Cuenta de administrador creada y sesión iniciada correctamente.' };
      }

      return {
        success: true,
        message: 'Usuario registrado. Si su proyecto requiere confirmación de email, revise su bandeja de entrada.',
      };
    } catch (err: any) {
      return { success: false, message: err?.message || 'Error al registrar el usuario' };
    }
  };

  const logout = async () => {
    try {
      if (isSupabaseConfigured && supabase) {
        await supabase.auth.signOut();
      }
    } catch (e) {
      console.error('Error cerrando sesión en Supabase:', e);
    } finally {
      setUsuario(null);
    }
  };

  const solicitarRecuperacion = async (email: string): Promise<{ success: boolean; message: string }> => {
    const cleanEmail = email.trim().toLowerCase();
    if (!cleanEmail || !cleanEmail.includes('@')) {
      return { success: false, message: 'Por favor, introduzca un correo electrónico válido.' };
    }

    if (!isSupabaseConfigured || !supabase) {
      return { success: false, message: 'Supabase no está configurado.' };
    }

    try {
      const { error } = await supabase.auth.resetPasswordForEmail(cleanEmail, {
        redirectTo: window.location.origin,
      });

      if (error) {
        return { success: false, message: error.message };
      }

      return {
        success: true,
        message: 'Si el correo está registrado en Supabase, recibirá instrucciones para restablecer su contraseña.',
      };
    } catch (err: any) {
      return { success: false, message: `Error tramitando la solicitud: ${err.message}` };
    }
  };

  return (
    <AuthContext.Provider
      value={{
        usuario,
        isAuthenticated: Boolean(usuario),
        isLoading,
        error,
        login,
        signup,
        logout,
        solicitarRecuperacion,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth debe utilizarse dentro de un AuthProvider');
  }
  return context;
};
