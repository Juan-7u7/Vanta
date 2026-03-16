/** final 1.0 */
import { createContext, useContext, useEffect, useState, type ReactNode } from 'react';
import { supabase } from '../lib/supabase';
import type { User } from '@supabase/supabase-js';
import type { UserProfile, AuthContextType } from '../types/auth';

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let mounted = true;

    const checkUser = async () => {
      try {
        const { data: { session }, error } = await supabase.auth.getSession();
        if (error) throw error;
        if (session?.user && mounted) {
          setUser(session.user);
          // Carga el perfil sin bloquear el estado principal del usuario
          fetchProfile(session.user.id);
        }
      } catch (err) {
        // Error silencioso al verificar sesión inicial
      } finally {
        if (mounted) setLoading(false);
      }
    };

    // Tiempo límite de seguridad para detener el estado de carga
    const timer = setTimeout(() => {
      if (mounted) setLoading(false);
    }, 1500);

    checkUser();

    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (_event, session) => {
      if (!mounted) return;
      setUser(session?.user ?? null);
      if (session?.user) {
        fetchProfile(session.user.id);
      } else {
        setProfile(null);
      }
      setLoading(false);
    });

    return () => {
      mounted = false;
      subscription.unsubscribe();
      clearTimeout(timer);
    };
  }, []);

  const fetchProfile = async (userId: string) => {
    try {
      const { data } = await supabase
        .from('colaboradores')
        .select('id, nombre, perfil_id, esta_activo')
        .eq('auth_id', userId)
        .maybeSingle();

      if (data) setProfile(data);
    } catch (err) {
      // Si falla la carga del perfil, el usuario mantiene su sesión de auth
    }
  };

  const signIn = async (email: string, pass: string) => {
    try {
      const { data, error } = await supabase.auth.signInWithPassword({ email, password: pass });
      return { data, error };
    } catch (e: any) {
      return { data: null, error: e };
    }
  };

  const signOut = async () => {
    await supabase.auth.signOut();
    setUser(null);
    setProfile(null);
  };

  return (
    <AuthContext.Provider value={{ user, profile, loading, signIn, signOut }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
