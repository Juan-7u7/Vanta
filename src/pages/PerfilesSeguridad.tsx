/** final 1.0 */
import { useState, useEffect } from 'react';
import { Plus, Edit2, Trash2, Loader2, X, AlertTriangle, Shield, ShieldAlert, ShieldCheck, Info } from 'lucide-react';
import { supabase } from '../lib/supabase';

interface PerfilSeguridad {
  id: number;
  nombre_perfil: string;
  nivel_acceso: number;
}

interface ConfirmModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  loading: boolean;
  perfilName: string;
}

function ConfirmDeleteModal({ isOpen, onClose, onConfirm, loading, perfilName }: ConfirmModalProps) {
  if (!isOpen) return null;
  return (
    <div className="fixed inset-0 z-[200] flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={onClose} />
      <div className="relative w-full max-w-sm bg-white dark:bg-gray-900 border border-gray-100 dark:border-white/10 rounded-[24px] shadow-2xl p-6 animate-in fade-in zoom-in-95 duration-200">
        <div className="flex flex-col items-center text-center">
          <div className="w-12 h-12 rounded-full bg-red-500/10 flex items-center justify-center mb-4">
            <AlertTriangle className="w-6 h-6 text-red-500" />
          </div>
          <h3 className="text-xl font-bold text-gray-800 dark:text-white mb-2">¿Eliminar perfil?</h3>
          <p className="text-sm text-gray-500 dark:text-gray-400 mb-6">
            Estás a punto de borrar <strong>{perfilName}</strong>. Esta acción no se puede deshacer. Si existen usuarios vinculados a este perfil, la base de datos podría rechazar la eliminación.
          </p>
          <div className="flex w-full gap-3">
            <button onClick={onClose} className="flex-1 py-3 bg-gray-100 hover:bg-gray-200 dark:bg-white/5 dark:hover:bg-white/10 text-gray-700 dark:text-gray-300 font-bold rounded-xl transition-colors">
              Cancelar
            </button>
            <button onClick={onConfirm} disabled={loading} className="flex-1 py-3 bg-red-500 hover:bg-red-600 text-white font-bold rounded-xl transition-colors disabled:opacity-50 flex items-center justify-center gap-2">
              {loading ? <Loader2 size={18} className="animate-spin" /> : <Trash2 size={18} />}
              {loading ? 'Borrando...' : 'Sí, eliminar'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

function PerfilModal({ isOpen, onClose, onSuccess, initialData }: any) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [formData, setFormData] = useState({ id: 0, nombre_perfil: '', nivel_acceso: 3 });

  useEffect(() => {
    if (initialData) {
      setFormData({
        id: initialData.id,
        nombre_perfil: initialData.nombre_perfil,
        nivel_acceso: initialData.nivel_acceso
      });
    } else {
      setFormData({ id: 0, nombre_perfil: '', nivel_acceso: 5 });
    }
    setError(null);
  }, [initialData, isOpen]);

  if (!isOpen) return null;
  const isEditing = !!formData.id;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    const payload = {
      nombre_perfil: formData.nombre_perfil.trim(),
      nivel_acceso: Number(formData.nivel_acceso)
    };

    try {
      if (isEditing) {
        const { error: err } = await supabase.from('perfiles_seguridad').update(payload).eq('id', formData.id);
        if (err) throw err;
      } else {
        const { error: err } = await supabase.from('perfiles_seguridad').insert([payload]);
        if (err) throw err;
      }
      onSuccess();
      onClose();
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={onClose} />
      <div className="relative w-full max-w-md bg-white dark:bg-gray-900 border border-gray-100 dark:border-white/10 rounded-[24px] shadow-2xl p-6 animate-in fade-in zoom-in-95 duration-200">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-indigo-500/10 flex items-center justify-center">
              <Shield className="w-5 h-5 text-indigo-500" />
            </div>
            <h2 className="text-xl font-bold text-gray-800 dark:text-white">
              {isEditing ? 'Editar Perfil' : 'Nuevo Perfil'}
            </h2>
          </div>
          <button onClick={onClose} className="p-2 text-gray-400 hover:text-gray-700 dark:hover:text-gray-200 bg-gray-50 hover:bg-gray-100 dark:bg-white/5 dark:hover:bg-white/10 rounded-xl transition-all">
            <X size={18} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-[11px] font-bold text-gray-400 uppercase tracking-wider mb-1.5">Nombre del Perfil</label>
            <input
              type="text"
              required
              value={formData.nombre_perfil}
              onChange={(e) => setFormData({ ...formData, nombre_perfil: e.target.value })}
              className="w-full px-4 py-3 bg-gray-50 dark:bg-black/20 border border-gray-200 dark:border-white/10 rounded-xl text-sm dark:text-white focus:ring-2 focus:ring-indigo-500/50 outline-none transition-all"
              placeholder="Ej. Gerente Comercial, Capturista..."
            />
          </div>
          
          <div>
            <div className="flex justify-between items-end mb-1.5">
              <label className="block text-[11px] font-bold text-gray-400 uppercase tracking-wider">Nivel de Acceso</label>
              <span className="text-2xl font-mono font-bold text-indigo-600 dark:text-indigo-400">{formData.nivel_acceso}</span>
            </div>
            <input
              type="range"
              min="1"
              max="5"
              required
              value={formData.nivel_acceso}
              onChange={(e) => setFormData({ ...formData, nivel_acceso: Number(e.target.value) })}
              className="w-full h-2 bg-gray-200 dark:bg-white/10 rounded-lg appearance-none cursor-pointer accent-indigo-600 focus:outline-none focus:ring-2 focus:ring-indigo-500/50"
            />
            <div className="flex justify-between mt-2 text-[10px] text-gray-400 font-bold uppercase">
              <span>1 (Admin)</span>
              <span>5 (Mínimo)</span>
            </div>
            
            <div className="mt-3 p-3 bg-indigo-50 dark:bg-indigo-500/10 rounded-xl border border-indigo-100 dark:border-indigo-500/20 flex items-start gap-2">
              <Info size={14} className="text-indigo-500 shrink-0 mt-0.5" />
              <p className="text-[11px] text-indigo-700 dark:text-indigo-300 leading-tight">
                {formData.nivel_acceso === 1 && 'Nivel 1: Administrador. Acceso total.'}
                {formData.nivel_acceso === 2 && 'Nivel 2: Dirección / Autorización Final.'}
                {formData.nivel_acceso === 3 && 'Nivel 3: Gerencia / Validación.'}
                {formData.nivel_acceso === 4 && 'Nivel 4: Revisión. (Solo lectura avanzada)'}
                {formData.nivel_acceso >= 5 && 'Nivel 5+: Capturista. Nivel base de entrada de datos.'}
              </p>
            </div>
          </div>

          {error && <p className="text-sm text-red-500 bg-red-50 dark:bg-red-500/10 p-3 rounded-xl">{error}</p>}

          <button
            type="submit"
            disabled={loading}
            className="w-full py-3.5 bg-indigo-600 hover:bg-indigo-500 text-white font-bold rounded-xl shadow-lg shadow-indigo-500/20 transition-all disabled:opacity-50 mt-4 flex items-center justify-center gap-2"
          >
            {loading && <Loader2 size={18} className="animate-spin" />}
            {loading ? 'Guardando...' : 'Guardar Perfil'}
          </button>
        </form>
      </div>
    </div>
  );
}

export default function PerfilesSeguridad() {
  const [perfiles, setPerfiles] = useState<PerfilSeguridad[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  const [modalOpen, setModalOpen] = useState(false);
  const [selectedPerfil, setSelectedPerfil] = useState<PerfilSeguridad | null>(null);
  
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [perfilToDelete, setPerfilToDelete] = useState<PerfilSeguridad | null>(null);
  const [deleteLoading, setDeleteLoading] = useState(false);

  useEffect(() => { fetchData(); }, []);

  const fetchData = async () => {
    try {
      setLoading(true);
      const { data, error: err } = await supabase
        .from('perfiles_seguridad')
        .select('*')
        .order('nivel_acceso', { ascending: true });

      if (err) throw err;
      setPerfiles(data || []);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async () => {
    if (!perfilToDelete) return;
    setDeleteLoading(true);
    try {
      const { error: err } = await supabase.from('perfiles_seguridad').delete().eq('id', perfilToDelete.id);
      if (err) {
        if (err.code === '23503') { // Foreign key violation
          throw new Error("No se puede eliminar porque hay usuarios vinculados a este perfil.");
        }
        throw err;
      }
      fetchData();
      setDeleteModalOpen(false);
    } catch (err: any) {
      alert("Error al eliminar: " + err.message);
    } finally {
      setDeleteLoading(false);
      setDeleteModalOpen(false);
    }
  };

  const getRoleInfo = (nivel: number) => {
    if (nivel === 1) return { label: 'Administrador', color: 'text-rose-500', bg: 'bg-rose-500/10', border: 'border-rose-500/20', Icon: ShieldAlert };
    if (nivel <= 3) return { label: 'Dirección / Gerencia', color: 'text-indigo-500', bg: 'bg-indigo-500/10', border: 'border-indigo-500/20', Icon: ShieldCheck };
    return { label: 'Revisión / Capturista', color: 'text-emerald-500', bg: 'bg-emerald-500/10', border: 'border-emerald-500/20', Icon: Shield };
  };

  const renderCards = () => {
    if (perfiles.length === 0) {
      return (
        <div className="col-span-full py-16 flex flex-col items-center justify-center border-2 border-dashed border-gray-200 dark:border-white/10 rounded-3xl">
          <Shield className="w-12 h-12 text-gray-300 dark:text-gray-600 mb-3" />
          <p className="text-gray-400 font-medium">No hay perfiles de seguridad registrados.</p>
        </div>
      );
    }

    return perfiles.map((p) => {
      const { label, color, bg, border, Icon } = getRoleInfo(p.nivel_acceso);
      
      return (
        <div key={p.id} className="group bg-white/50 dark:bg-white/5 backdrop-blur-xl border border-gray-100 dark:border-white/10 rounded-3xl p-6 shadow-sm hover:shadow-xl transition-all duration-300 relative overflow-hidden flex flex-col justify-between min-h-[160px]">
          <div className="flex justify-between items-start mb-6 w-full">
            <div className="flex items-center gap-4">
              <div className={`w-12 h-12 rounded-2xl flex items-center justify-center shadow-inner ${bg} ${border} border`}>
                <Icon className={`w-6 h-6 ${color}`} />
              </div>
              <div>
                <h3 className="text-lg font-bold text-gray-800 dark:text-white leading-tight">{p.nombre_perfil}</h3>
                <span className={`text-[11px] font-bold uppercase ${color}`}>{label}</span>
              </div>
            </div>
            
            <div className="flex items-center gap-1 opacity-100 sm:opacity-0 sm:group-hover:opacity-100 transition-opacity">
              <button onClick={() => { setSelectedPerfil(p); setModalOpen(true); }} className="p-2 text-gray-400 hover:text-indigo-600 hover:bg-indigo-50 dark:hover:bg-indigo-500/10 rounded-xl transition-colors">
                <Edit2 size={16} />
              </button>
              <button onClick={() => { setPerfilToDelete(p); setDeleteModalOpen(true); }} className="p-2 text-gray-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-500/10 rounded-xl transition-colors">
                <Trash2 size={16} />
              </button>
            </div>
          </div>

          <div className="flex items-center justify-between border-t border-gray-100 dark:border-white/5 pt-4">
            <div>
              <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">Nivel de Acceso</p>
              <div className="flex items-end gap-1 mt-1">
                <p className="text-2xl font-mono font-bold text-gray-700 dark:text-gray-300 leading-none">{p.nivel_acceso}</p>
                <span className="text-xs text-gray-400 mb-0.5">/ 5</span>
              </div>
            </div>

            {/* Gráfico visual del nivel (inverso: menor num = más bloques) */}
            <div className="flex gap-1 h-2 w-24">
              {[1, 2, 3, 4, 5].map((n) => (
                <div 
                  key={n} 
                  className={`flex-1 rounded-full ${n >= p.nivel_acceso ? color.replace('text-', 'bg-') : 'bg-gray-100 dark:bg-white/5'}`}
                />
              ))}
            </div>
          </div>
        </div>
      );
    });
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-500 max-w-6xl mx-auto">
      {/* Encabezado */}
      <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-gray-800 dark:text-white">Perfiles de Seguridad</h1>
          <p className="text-gray-500 dark:text-gray-400 mt-1">
            Gestión de roles y niveles de acceso al sistema
          </p>
        </div>
        <button
          onClick={() => { setSelectedPerfil(null); setModalOpen(true); }}
          className="flex items-center justify-center gap-2 px-6 py-3.5 bg-indigo-600 hover:bg-indigo-500 text-white font-bold rounded-2xl shadow-lg shadow-indigo-500/20 transition-transform transform hover:scale-[1.02] active:scale-[0.98] shrink-0"
        >
          <Plus size={20} />
          Nuevo Perfil
        </button>
      </div>

      {/* Leyenda Niveles */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
        <div className="px-5 py-4 bg-white/50 dark:bg-white/5 rounded-2xl border border-gray-100 dark:border-white/10 flex items-center gap-4">
          <div className="w-10 h-10 rounded-xl bg-rose-500/10 flex items-center justify-center shrink-0">
            <span className="font-mono font-bold text-rose-500">1</span>
          </div>
          <div>
            <h4 className="text-[11px] font-bold text-gray-800 dark:text-gray-200 uppercase">Administrador</h4>
            <p className="text-[10px] text-gray-500 leading-tight mt-0.5">Acceso total sin restricciones.</p>
          </div>
        </div>
        <div className="px-5 py-4 bg-white/50 dark:bg-white/5 rounded-2xl border border-gray-100 dark:border-white/10 flex items-center gap-4">
          <div className="w-10 h-10 rounded-xl bg-indigo-500/10 flex items-center justify-center shrink-0">
            <span className="font-mono font-bold text-indigo-500">2-3</span>
          </div>
          <div>
            <h4 className="text-[11px] font-bold text-gray-800 dark:text-gray-200 uppercase">Dirección / Gerencia</h4>
            <p className="text-[10px] text-gray-500 leading-tight mt-0.5">Autorización final y validación de procesos.</p>
          </div>
        </div>
        <div className="px-5 py-4 bg-white/50 dark:bg-white/5 rounded-2xl border border-gray-100 dark:border-white/10 flex items-center gap-4">
          <div className="w-10 h-10 rounded-xl bg-emerald-500/10 flex items-center justify-center shrink-0">
            <span className="font-mono font-bold text-emerald-500">4-5</span>
          </div>
          <div>
            <h4 className="text-[11px] font-bold text-gray-800 dark:text-gray-200 uppercase">Revisión / Capturistas</h4>
            <p className="text-[10px] text-gray-500 leading-tight mt-0.5">Entrada de base de datos y tareas restringidas.</p>
          </div>
        </div>
      </div>

      {error && (
        <div className="p-4 bg-red-500/10 border border-red-500/20 rounded-2xl text-red-600 dark:text-red-400 text-sm font-medium">
          Error: {error}
        </div>
      )}

      {/* Grid de Perfiles */}
      {loading ? (
        <div className="flex flex-col items-center justify-center h-64 gap-3">
          <Loader2 className="w-8 h-8 text-indigo-500 animate-spin" />
          <p className="text-sm text-gray-500">Cargando perfiles...</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {renderCards()}
        </div>
      )}

      <PerfilModal
        isOpen={modalOpen}
        initialData={selectedPerfil}
        onClose={() => setModalOpen(false)}
        onSuccess={fetchData}
      />

      <ConfirmDeleteModal
        isOpen={deleteModalOpen}
        onClose={() => setDeleteModalOpen(false)}
        onConfirm={handleDelete}
        loading={deleteLoading}
        perfilName={perfilToDelete?.nombre_perfil || ''}
      />
    </div>
  );
}
