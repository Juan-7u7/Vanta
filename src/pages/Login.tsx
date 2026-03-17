/** final 1.2 - Premium Minimalist Login */
import { useState, useEffect } from 'react';
import { Lock, Mail, Loader2, Eye, EyeOff, ShieldCheck, ChevronRight } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { supabase } from '../lib/supabase';

interface BusinessUnit {
  id: number;
  nombre: string;
  logo_url?: string;
}

export default function Login() {
  const { signIn } = useAuth();
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [businessUnits, setBusinessUnits] = useState<BusinessUnit[]>([]);

  useEffect(() => {
    document.title = 'Avanta Media | Inteligencia Estratégica';
    fetchBusinessUnits();
  }, []);

  const fetchBusinessUnits = async () => {
    try {
      const { data, error: err } = await supabase
        .from('unidades_negocio')
        .select('id, nombre, logo_url')
        .not('logo_url', 'is', null);
      
      if (!err && data) {
        setBusinessUnits(data);
      }
    } catch (err) {
      console.error('Error fetching business units:', err);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!username || !password) {
      setError('Por favor, ingresa tus credenciales.');
      return;
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(username)) {
      setError('Formato de correo no válido.');
      return;
    }

    setIsLoading(true);
    setError('');
    
    try {
      const result = await signIn(username, password);
      if (result.error) {
        setError('Acceso denegado. Verifica tus datos.');
      }
    } catch (err) {
      setError('Fallo de conexión externa.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-[100dvh] w-full flex items-center justify-center p-3 sm:p-6 relative overflow-hidden bg-white dark:bg-[#06070a]">
      
      {/* Background elements */}
      <div className="absolute top-[-10%] right-[-10%] w-[50%] h-[50%] bg-indigo-500/10 rounded-full blur-[120px] animate-pulse" />
      <div className="absolute bottom-[-10%] left-[-10%] w-[50%] h-[50%] bg-emerald-500/10 rounded-full blur-[120px] animate-pulse" style={{ animationDelay: '2s' }} />

      <div className="w-full max-w-[440px] lg:max-w-[1100px] grid grid-cols-1 lg:grid-cols-2 bg-white/40 dark:bg-white/[0.02] backdrop-blur-3xl border border-gray-100 dark:border-white/5 shadow-2xl rounded-[32px] lg:rounded-[64px] overflow-hidden relative z-10">
        
        {/* Top (Mobile) / Left (Desktop) Side: Branding */}
        <div className="flex flex-col justify-between p-4 sm:p-6 lg:p-16 bg-gradient-to-br from-indigo-600 to-indigo-800 text-white relative">
          <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/carbon-fibre.png')] opacity-10 mix-blend-overlay" />
          
          <div className="relative z-10">
            <img src="/logo-avalanz-blanco.png" alt="Avalanz Logo" className="h-7 sm:h-10 lg:h-16 w-auto mb-2 sm:mb-4 lg:mb-12 drop-shadow-2xl" />
            <h1 className="text-xl sm:text-2xl lg:text-5xl font-black tracking-tighter leading-tight lg:leading-[1.1] mb-1 lg:mb-6">
              Gestión Inteligente de <span className="text-emerald-400">Compensaciones.</span>
            </h1>
            <p className="hidden lg:block text-indigo-100 text-sm lg:text-lg font-medium max-w-md leading-relaxed opacity-80 mb-8 lg:mb-12">
              Accede a la plataforma líder en análisis estratégico y optimización de capital humano.
            </p>

            {/* Business Units Carousel (Desktop only) */}
            {businessUnits.length > 0 && (
              <div className="hidden lg:block space-y-4">
                <p className="text-[10px] font-black uppercase tracking-[0.3em] text-indigo-300 opacity-60">Nuestras Unidades de Negocio</p>
                <div className="relative w-full overflow-hidden [mask-image:linear-gradient(to_right,transparent,white_20%,white_80%,transparent)]">
                  <div className="flex w-fit gap-12 animate-infinite-scroll">
                    {[...businessUnits, ...businessUnits].map((unit, idx) => (
                      <div key={`${unit.id}-${idx}`} className="flex items-center gap-3 shrink-0 group">
                        <div className="w-12 h-12 rounded-xl bg-white/20 backdrop-blur-md border border-white/20 p-2 flex items-center justify-center transition-all group-hover:bg-white/30 group-hover:scale-110">
                          <img src={unit.logo_url} alt={unit.nombre} className="w-full h-full object-contain transition-opacity group-hover:opacity-100 opacity-90" />
                        </div>
                        <span className="text-sm font-bold tracking-tight text-white/70 group-hover:text-white transition-colors">
                          {unit.nombre}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Bottom (Mobile) / Right (Desktop) Side: Form */}
        <div className="p-5 sm:p-8 lg:p-16 flex flex-col justify-center">
          
          <div className="mb-4 sm:mb-6 lg:mb-8">
             <div className="hidden lg:flex items-center gap-3 mb-4">
                <span className="h-1.5 w-8 bg-indigo-500 rounded-full" />
                <p className="text-[10px] font-black uppercase tracking-[0.4em] text-indigo-500">Security Gate</p>
             </div>
             <h2 className="text-2xl lg:text-4xl font-black text-gray-800 dark:text-white tracking-tighter leading-none mb-1 lg:mb-3">
               Iniciar Sesión
             </h2>
             <p className="hidden lg:block text-gray-400 font-medium text-sm leading-relaxed">
               Ingresa tus credenciales corporativas para entrar al panel de control.
             </p>
          </div>

          <form onSubmit={handleSubmit} noValidate className="space-y-3 lg:space-y-5">
            
            <div className="space-y-1 lg:space-y-2">
              <label className="text-[9px] lg:text-[10px] font-black uppercase tracking-widest text-gray-400 ml-2">Identificación Corporativa</label>
              <div className="relative group">
                <Mail className="absolute left-4 lg:left-6 top-1/2 -translate-y-1/2 w-4 h-4 lg:w-5 lg:h-5 text-gray-300 group-focus-within:text-indigo-500 transition-colors" />
                <input
                  type="email"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  placeholder="usuario@vantamedia.com"
                  className="w-full pl-11 lg:pl-16 pr-4 lg:pr-6 py-3 lg:py-5 bg-gray-50 dark:bg-white/[0.03] border border-gray-100 dark:border-white/5 rounded-2xl lg:rounded-[28px] text-gray-800 dark:text-white placeholder-gray-300 dark:placeholder-gray-600 outline-none focus:border-indigo-500/50 focus:ring-4 focus:ring-indigo-500/5 transition-all font-medium text-xs lg:text-sm"
                />
              </div>
            </div>

            <div className="space-y-1 lg:space-y-2">
              <div className="flex justify-between items-center px-2">
                <label className="text-[9px] lg:text-[10px] font-black uppercase tracking-widest text-gray-400">Token de Acceso</label>
              </div>
              <div className="relative group">
                <Lock className="absolute left-4 lg:left-6 top-1/2 -translate-y-1/2 w-4 h-4 lg:w-5 lg:h-5 text-gray-300 group-focus-within:text-indigo-500 transition-colors" />
                <input
                  type={showPassword ? "text" : "password"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full pl-11 lg:pl-16 pr-11 lg:pr-14 py-3 lg:py-5 bg-gray-50 dark:bg-white/[0.03] border border-gray-100 dark:border-white/5 rounded-2xl lg:rounded-[28px] text-gray-800 dark:text-white placeholder-gray-300 dark:placeholder-gray-600 outline-none focus:border-indigo-500/50 focus:ring-4 focus:ring-indigo-500/5 transition-all font-medium text-xs lg:text-sm"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-4 lg:right-6 top-1/2 -translate-y-1/2 text-gray-300 hover:text-indigo-500 transition-colors"
                >
                  {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
            </div>

            {error && (
              <div className="p-3 lg:p-5 bg-rose-500/5 border border-rose-500/10 rounded-xl lg:rounded-[24px] flex items-center gap-3 lg:gap-4 text-rose-500 animate-in fade-in slide-in-from-top-2 duration-300">
                <ShieldCheck size={16} className="shrink-0 lg:w-[18px] lg:h-[18px]" />
                <p className="text-[9px] lg:text-xs font-black uppercase tracking-tight">{error}</p>
              </div>
            )}

            <button
              type="submit"
              disabled={isLoading}
              className="group w-full py-4 lg:py-6 bg-indigo-600 hover:bg-indigo-500 disabled:bg-indigo-400 text-white rounded-2xl lg:rounded-[28px] font-black text-[10px] lg:text-[11px] uppercase tracking-[0.3em] shadow-2xl shadow-indigo-600/20 active:scale-[0.98] transition-all flex items-center justify-center gap-3"
            >
              {isLoading ? (
                <Loader2 className="w-4 h-4 lg:w-5 lg:h-5 animate-spin" />
              ) : (
                <>
                  Verificar Identidad
                  <ChevronRight className="w-3.5 h-3.5 lg:w-4 lg:h-4 group-hover:translate-x-1 transition-transform" />
                </>
              )}
            </button>
          </form>

          {/* Business Units Carousel (Mobile only) */}
          {businessUnits.length > 0 && (
            <div className="lg:hidden mt-6 space-y-2">
              <p className="text-[8px] font-black uppercase tracking-[0.3em] text-gray-400 opacity-60 text-center">Unidades de Negocio</p>
              <div className="relative w-full overflow-hidden [mask-image:linear-gradient(to_right,transparent,white_20%,white_80%,transparent)]">
                <div className="flex w-fit gap-6 animate-infinite-scroll">
                  {[...businessUnits, ...businessUnits].map((unit, idx) => (
                    <div key={`${unit.id}-mob-${idx}`} className="flex items-center gap-2 shrink-0">
                      <div className="w-8 h-8 rounded-lg bg-gray-100 dark:bg-white/5 border border-gray-200 dark:border-white/10 p-1.5 flex items-center justify-center">
                        <img src={unit.logo_url} alt={unit.nombre} className="w-full h-full object-contain opacity-80" />
                      </div>
                      <span className="text-[10px] font-bold tracking-tight text-gray-500 dark:text-gray-400">
                        {unit.nombre}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
