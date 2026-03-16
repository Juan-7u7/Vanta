/** final 1.0 */
import { AlertTriangle, X, Loader2, Trash2 } from 'lucide-react';

interface ConfirmDeleteModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title: string;
  message: string;
  loading?: boolean;
}

export default function ConfirmDeleteModal({ 
  isOpen, 
  onClose, 
  onConfirm, 
  title, 
  message,
  loading = false
}: ConfirmDeleteModalProps) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
      {/* Overlay con blur */}
      <div 
        className="absolute inset-0 bg-black/60 backdrop-blur-sm animate-in fade-in duration-300" 
        onClick={loading ? undefined : onClose} 
      />

      {/* Card del Modal */}
      <div className="relative w-full max-w-md bg-white dark:bg-[#0f1117] border border-gray-100 dark:border-white/10 rounded-[32px] shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200">
        
        {/* Decorative background circle */}
        <div className="absolute -top-24 -right-24 w-48 h-48 bg-red-500/10 rounded-full blur-3xl" />
        
        <div className="p-8 relative">
          <button
            onClick={onClose}
            disabled={loading}
            className="absolute top-6 right-6 p-2 rounded-xl text-gray-400 hover:text-gray-700 dark:hover:text-gray-200 hover:bg-gray-100 dark:hover:bg-white/10 transition-all disabled:opacity-50"
          >
            <X size={20} />
          </button>

          <div className="flex flex-col items-center text-center">
            {/* Icono de advertencia animado */}
            <div className="w-20 h-20 rounded-3xl bg-red-50 dark:bg-red-500/10 flex items-center justify-center mb-6 border border-red-100 dark:border-red-500/20 shadow-inner">
              <AlertTriangle size={40} className="text-red-500 animate-pulse" />
            </div>

            <h3 className="text-2xl font-bold text-gray-800 dark:text-white mb-3">
              {title}
            </h3>
            
            <p className="text-sm text-gray-500 dark:text-gray-400 leading-relaxed max-w-xs">
              {message}
            </p>

            <div className="flex flex-col sm:flex-row gap-3 w-full mt-10">
              <button
                type="button"
                onClick={onClose}
                disabled={loading}
                className="flex-1 py-4 rounded-2xl border border-gray-200 dark:border-white/10 text-gray-600 dark:text-gray-300 font-bold text-sm hover:bg-gray-50 dark:hover:bg-white/5 transition-all active:scale-[0.98] disabled:opacity-50"
              >
                No, cancelar
              </button>
              <button
                type="button"
                onClick={onConfirm}
                disabled={loading}
                className="flex-1 flex items-center justify-center gap-2 py-4 rounded-2xl bg-red-600 hover:bg-red-500 text-white font-bold text-sm shadow-lg shadow-red-500/20 transition-all active:scale-[0.98] disabled:opacity-50"
              >
                {loading ? (
                  <Loader2 size={18} className="animate-spin" />
                ) : (
                  <Trash2 size={18} />
                )}
                {loading ? 'Eliminando...' : 'Sí, eliminar'}
              </button>
            </div>
          </div>
        </div>

        {/* Info footer */}
        <div className="px-8 py-4 bg-gray-50 dark:bg-white/5 border-t border-gray-100 dark:border-white/5 flex items-center gap-3">
           <div className="w-2 h-2 rounded-full bg-red-500" />
           <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">
             Operación irreversible
           </p>
        </div>
      </div>
    </div>
  );
}
