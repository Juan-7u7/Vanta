import type { User } from '@supabase/supabase-js';

export interface UserProfile {
  id: string;
  nombre: string;
  perfil_id: number;
  esta_activo: boolean;
}

export interface AuthContextType {
  user: User | null;
  profile: UserProfile | null;
  loading: boolean;
  signIn: (email: string, pass: string) => Promise<{ error: any }>;
  signOut: () => Promise<void>;
}
