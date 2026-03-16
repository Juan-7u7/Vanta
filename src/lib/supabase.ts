/** final 1.0 */
// Configuración inicial del cliente de Supabase
import { createClient } from '@supabase/supabase-js'

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error('Faltan variables de entorno para inicializar Supabase. Por favor, asegúrate de añadirlas en el archivo .env')
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey)
