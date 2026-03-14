import { useState } from 'react';
import { Lock, User, Loader2, Eye, EyeOff } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

export default function Login() {
  const { signIn } = useAuth();
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [showErrorAnim, setShowErrorAnim] = useState(false);
  const [attemptedSubmit, setAttemptedSubmit] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setAttemptedSubmit(true);
    
    if (!username || !password) {
      triggerError('Por favor, completa todos los campos.');
      return;
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(username)) {
      triggerError('Por favor, ingresa un formato de correo válido.');
      return;
    }

    setIsLoading(true);
    setError('');
    setShowErrorAnim(false);
    
    try {
      const result = await signIn(username, password);

      if (result.error) {
        triggerError('Credenciales incorrectas. Verifica tu correo y contraseña.');
      }
    } catch (err) {
      triggerError('Error de conexión. Inténtalo de nuevo.');
    } finally {
      setIsLoading(false);
    }
  };

  const triggerError = (msg: string) => {
    setError(msg);
    setShowErrorAnim(true);
    // Reset animation after a moment to allow re-trigger
    setTimeout(() => setShowErrorAnim(false), 500);
  };

  return (
    <div className="min-h-[100dvh] w-full flex items-center justify-center p-4">
      <div className="w-full max-w-md bg-white/10 dark:bg-black/25 backdrop-blur-2xl border border-white/20 dark:border-white/10 shadow-[0_8px_32px_0_rgba(31,38,135,0.07)] dark:shadow-[0_8px_32px_0_rgba(0,0,0,0.4)] rounded-[32px] transform transition-all">
        
        {/* Header Section */}
        <div className="p-8 text-center pb-6">
          <div className="mx-auto w-16 h-16 rounded-2xl bg-gradient-to-tr from-blue-500 to-cyan-500 flex items-center justify-center shadow-lg mb-4">
             <span className="text-white font-bold text-3xl">V</span>
          </div>
          <h2 className="text-2xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-gray-800 to-gray-500 dark:from-white dark:to-gray-300">
            Bienvenido a Vanta Media
          </h2>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-2 font-medium">
            Ingresa tus credenciales para continuar
          </p>
        </div>

        <div className="px-8 pb-8 pt-2">
          <form onSubmit={handleSubmit} noValidate className="space-y-5">
            
            {/* Username Field */}
            <div>
              <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-1.5 ml-1">
                Correo electrónico
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                  <User className="h-5 w-5 text-gray-400 dark:text-gray-500" />
                </div>
                <input
                  type="email"
                  value={username}
                  onChange={(e) => {
                    setUsername(e.target.value);
                    if (error) setError('');
                  }}
                  className={`block w-full pl-11 pr-4 py-3.5 bg-white/50 dark:bg-black/20 border rounded-2xl focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500 dark:focus:ring-blue-400/50 text-gray-800 dark:text-white placeholder-gray-400 dark:placeholder-gray-500 backdrop-blur-sm transition-all outline-none ${
                    attemptedSubmit && !username 
                      ? 'border-red-500/50 bg-red-500/5' 
                      : 'border-gray-200 dark:border-white/10'
                  }`}
                  placeholder="ejemplo@correo.com"
                />
              </div>
              {attemptedSubmit && (!username || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(username)) && (
                <span className="text-[10px] text-red-500 mt-1 ml-2 font-medium animate-feedback">
                  {!username ? 'Este campo es obligatorio' : 'Correo no válido'}
                </span>
              )}
            </div>

            {/* Password Field */}
            <div>
              <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-1.5 ml-1">
                Contraseña
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                  <Lock className="h-5 w-5 text-gray-400 dark:text-gray-500" />
                </div>
                <input
                  type={showPassword ? "text" : "password"}
                  value={password}
                  onChange={(e) => {
                    setPassword(e.target.value);
                    if (error) setError('');
                  }}
                  className={`block w-full pl-11 pr-12 py-3.5 bg-white/50 dark:bg-black/20 border rounded-2xl focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500 dark:focus:ring-blue-400/50 text-gray-800 dark:text-white placeholder-gray-400 dark:placeholder-gray-500 backdrop-blur-sm transition-all outline-none ${
                    attemptedSubmit && !password 
                      ? 'border-red-500/50 bg-red-500/5' 
                      : 'border-gray-200 dark:border-white/10'
                  }`}
                  placeholder="******"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute inset-y-0 right-0 pr-4 flex items-center text-gray-400 hover:text-blue-500 transition-colors"
                >
                  {showPassword ? (
                    <EyeOff className="h-5 w-5" />
                  ) : (
                    <Eye className="h-5 w-5" />
                  )}
                </button>
              </div>
              {attemptedSubmit && !password && (
                <span className="text-[10px] text-red-500 mt-1 ml-2 font-medium animate-feedback">
                  La contraseña es necesaria
                </span>
              )}
            </div>



            {error && (
              <div className={`py-3 px-4 rounded-2xl bg-red-500/10 border border-red-500/20 text-red-600 dark:text-red-400 text-sm font-semibold text-center transition-all ${showErrorAnim ? 'animate-shake' : ''}`}>
                <div className="flex items-center justify-center gap-2">
                  <span className="w-1.5 h-1.5 rounded-full bg-red-500 animate-pulse" />
                  {error}
                </div>
              </div>
            )}

            <button
              type="submit"
              disabled={isLoading}
              className="mt-6 w-full flex justify-center items-center gap-2 py-4 px-4 border border-transparent rounded-2xl shadow-md text-sm font-bold text-white bg-gradient-to-r from-blue-600 to-cyan-600 hover:from-blue-500 hover:to-cyan-500 disabled:opacity-75 disabled:cursor-not-allowed focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500/50 dark:focus:ring-offset-black transition-all transform hover:scale-[1.02] active:scale-[0.98] disabled:hover:scale-100 disabled:active:scale-100"
            >
              {isLoading ? (
                <>
                  <Loader2 className="w-5 h-5 animate-spin" />
                  Conectando...
                </>
              ) : (
                'Iniciar sesión'
              )}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
