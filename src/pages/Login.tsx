/** final 1.2 - Premium Minimalist Login */
import { useState, useEffect } from 'react';
import { Lock, Mail, Loader2, Eye, EyeOff, ShieldCheck, ChevronRight } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

export default function Login() {
  const { signIn } = useAuth();
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  useEffect(() => {
    document.title = 'Avanta Media | Inteligencia Estratégica';
  }, []);

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
    <div className="min-h-[100dvh] w-full flex items-center justify-center p-6 relative overflow-hidden bg-white dark:bg-[#06070a]">
      
      {/* Background elements */}
      <div className="absolute top-[-10%] right-[-10%] w-[50%] h-[50%] bg-indigo-500/10 rounded-full blur-[120px] animate-pulse" />
      <div className="absolute bottom-[-10%] left-[-10%] w-[50%] h-[50%] bg-emerald-500/10 rounded-full blur-[120px] animate-pulse" style={{ animationDelay: '2s' }} />

      <div className="w-full max-w-lg lg:max-w-[1100px] grid grid-cols-1 lg:grid-cols-2 bg-white/40 dark:bg-white/[0.02] backdrop-blur-3xl border border-gray-100 dark:border-white/5 shadow-2xl rounded-[64px] overflow-hidden relative z-10">
        
        {/* Left Side: Branding (Desktop Only) */}
        <div className="hidden lg:flex flex-col justify-between p-16 bg-gradient-to-br from-indigo-600 to-indigo-800 text-white relative">
          <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/carbon-fibre.png')] opacity-10 mix-blend-overlay" />
          
          <div className="relative z-10">
            <img src="/logo-avalanz-blanco.png" alt="Avalanz Logo" className="h-16 w-auto mb-12 drop-shadow-2xl" />
            <h1 className="text-5xl font-black tracking-tighter leading-[1.1] mb-6">
              Gestión Inteligente de <span className="text-emerald-400">Compensaciones.</span>
            </h1>
            <p className="text-indigo-100 text-lg font-medium max-w-md leading-relaxed opacity-80">
              Accede a la plataforma líder en análisis estratégico y optimización de capital humano.
            </p>
          </div>
        </div>

        {/* Right Side: Form */}
        <div className="p-10 lg:p-20 flex flex-col justify-center">
          
          <div className="mb-12">
             <div className="lg:hidden mb-10 flex justify-center">
               <img src="/logo-avalanz-blanco.png" alt="Avalanz Logo" className="h-10 w-auto dark:invert dark:brightness-0" />
             </div>
             <div className="flex items-center gap-3 mb-4">
                <span className="h-1.5 w-8 bg-indigo-500 rounded-full" />
                <p className="text-[10px] font-black uppercase tracking-[0.4em] text-indigo-500">Security Gate</p>
             </div>
             <h2 className="text-4xl font-black text-gray-800 dark:text-white tracking-tighter leading-none mb-4">
               Iniciar Sesión
             </h2>
             <p className="text-gray-400 font-medium text-sm leading-relaxed">
               Ingresa tus credenciales corporativas para entrar al panel de control.
             </p>
          </div>

          <form onSubmit={handleSubmit} noValidate className="space-y-6">
            
            <div className="space-y-2">
              <label className="text-[10px] font-black uppercase tracking-widest text-gray-400 ml-2">Identificación Corporativa</label>
              <div className="relative group">
                <Mail className="absolute left-6 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-300 group-focus-within:text-indigo-500 transition-colors" />
                <input
                  type="email"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  placeholder="usuario@vantamedia.com"
                  className="w-full pl-16 pr-6 py-5 bg-gray-50 dark:bg-white/[0.03] border border-gray-100 dark:border-white/5 rounded-[28px] text-gray-800 dark:text-white placeholder-gray-300 dark:placeholder-gray-600 outline-none focus:border-indigo-500/50 focus:ring-4 focus:ring-indigo-500/5 transition-all font-medium text-sm"
                />
              </div>
            </div>

            <div className="space-y-2">
              <div className="flex justify-between items-center px-2">
                <label className="text-[10px] font-black uppercase tracking-widest text-gray-400">Token de Acceso</label>
              </div>
              <div className="relative group">
                <Lock className="absolute left-6 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-300 group-focus-within:text-indigo-500 transition-colors" />
                <input
                  type={showPassword ? "text" : "password"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full pl-16 pr-14 py-5 bg-gray-50 dark:bg-white/[0.03] border border-gray-100 dark:border-white/5 rounded-[28px] text-gray-800 dark:text-white placeholder-gray-300 dark:placeholder-gray-600 outline-none focus:border-indigo-500/50 focus:ring-4 focus:ring-indigo-500/5 transition-all font-medium text-sm"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-6 top-1/2 -translate-y-1/2 text-gray-300 hover:text-indigo-500 transition-colors"
                >
                  {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                </button>
              </div>
            </div>

            {error && (
              <div className="p-5 bg-rose-500/5 border border-rose-500/10 rounded-[24px] flex items-center gap-4 text-rose-500 animate-in fade-in slide-in-from-top-2 duration-300">
                <div className="p-2 bg-rose-500/10 rounded-xl">
                  <ShieldCheck size={18} />
                </div>
                <p className="text-xs font-black uppercase tracking-tight">{error}</p>
              </div>
            )}

            <button
              type="submit"
              disabled={isLoading}
              className="group w-full py-6 bg-indigo-600 hover:bg-indigo-500 disabled:bg-indigo-400 text-white rounded-[28px] font-black text-[11px] uppercase tracking-[0.3em] shadow-2xl shadow-indigo-600/20 active:scale-[0.98] transition-all flex items-center justify-center gap-3"
            >
              {isLoading ? (
                <Loader2 className="w-5 h-5 animate-spin" />
              ) : (
                <>
                  Verificar Identidad
                  <ChevronRight size={16} className="group-hover:translate-x-1 transition-transform" />
                </>
              )}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
