/** final 1.0 */
import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { Loader2, Plus, Edit2, XCircle, Tag, CheckCircle2 } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

interface Bono {
  id: number;
  nombre_bono: string;
  descripcion: string;
  esta_activo: boolean;
}

export default function Bonos() {
  const { user } = useAuth();
  
  const [isAdmin, setIsAdmin] = useState<boolean | null>(null);
  const [checkingAccess, setCheckingAccess] = useState(true);

  const [bonos, setBonos] = useState<Bono[]>([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  
  const [formData, setFormData] = useState({ id: 0, nombre_bono: '', descripcion: '', esta_activo: true });
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    verificarAcceso();
  }, [user]);

  const verificarAcceso = async () => {
    if (!user) return;
    try {
      setCheckingAccess(true);
      const { data, error: err } = await supabase
        .from('colaboradores')
        .select(`perfil_id`)
        .eq('auth_id', user.id)
        .single();
        
      if (err) throw err;

      // Nivel 1 es Administrador. Verificamos perfil_id o a través de la relación:
      // Si perfil_id en la tabla asume que 1 es Admin, o cruzamos con perfiles_seguridad.
      // Para estar 100% seguros y debido a los cambios recientes, validamos el subquery:
      const { data: pfData } = await supabase
        .from('perfiles_seguridad')
        .select('nivel_acceso')
        .eq('id', data.perfil_id)
        .single();

      if (pfData?.nivel_acceso === 1) {
        setIsAdmin(true);
        fetchBonos();
      } else {
        setIsAdmin(false);
      }
    } catch (err) {
      console.error('Error al verificar acceso:', err);
      setIsAdmin(false);
    } finally {
      setCheckingAccess(false);
    }
  };

  const fetchBonos = async () => {
    try {
      // Intentamos consultar. Si la tabla no existe o tira error, lo capturamos.
      const { data, error: err } = await supabase
        .from('cat_bonos')
        .select('*')
        .order('id');
      if (err) {
        if (err.code === '42P01') {
          throw new Error("La tabla public.cat_bonos no existe en la base de datos. Por favor ejecuta el script de migración SQL adjunto en la respuesta.");
        }
        throw err;
      }
      setBonos(data || []);
      setError(null);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const openModal = (bono?: Bono) => {
    if (bono) {
      setFormData({ ...bono });
    } else {
      setFormData({ id: 0, nombre_bono: '', descripcion: '', esta_activo: true });
    }
    setIsModalOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      if (formData.id) {
        const { error: err } = await supabase
          .from('cat_bonos')
          .update({
            nombre_bono: formData.nombre_bono,
            descripcion: formData.descripcion,
            esta_activo: formData.esta_activo
          })
          .eq('id', formData.id);
        if (err) throw err;
      } else {
        const { error: err } = await supabase
          .from('cat_bonos')
          .insert([{
            nombre_bono: formData.nombre_bono,
            descripcion: formData.descripcion,
            esta_activo: formData.esta_activo
          }]);
        if (err) throw err;
      }
      setIsModalOpen(false);
      fetchBonos();
    } catch (err: any) {
      alert("Error: " + err.message);
    } finally {
      setSaving(false);
    }
  };

  const toggleStatus = async (bono: Bono) => {
    try {
      const { error: err } = await supabase
        .from('cat_bonos')
        .update({ esta_activo: !bono.esta_activo })
        .eq('id', bono.id);
      if (err) throw err;
      fetchBonos();
    } catch (err: any) {
      alert("Error al cambiar estatus: " + err.message);
    }
  };

  if (checkingAccess) {
    return (
      <div className="flex flex-col items-center justify-center h-full gap-4 mt-20">
        <Loader2 className="w-10 h-10 text-amber-500 animate-spin" />
        <p className="text-gray-500 font-medium">Verificando permisos de seguridad...</p>
      </div>
    );
  }

  if (isAdmin === false) {
    return (
      <div className="flex flex-col items-center justify-center h-full gap-4 mt-20 max-w-md mx-auto text-center">
        <div className="w-20 h-20 bg-red-500/10 rounded-full flex items-center justify-center mb-2">
          <XCircle className="w-10 h-10 text-red-500" />
        </div>
        <h2 className="text-2xl font-bold text-gray-800 dark:text-white">Acceso Denegado</h2>
        <p className="text-gray-500">Esta vista requiere un Perfil de Seguridad con Nivel 1 (Administrador de sistema).</p>
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-in fade-in duration-500 max-w-5xl mx-auto">
      {/* Encabezado */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-gray-800 dark:text-white flex items-center gap-3">
            <Tag className="w-8 h-8 text-amber-500" />
            Catálogo de Bonos
          </h1>
          <p className="text-gray-500 dark:text-gray-400 mt-1">
            Gestión de nombres y descripciones de bonos para otros ingresos.
          </p>
        </div>
        <button
          onClick={() => openModal()}
          className="flex items-center justify-center gap-2 px-6 py-3 bg-amber-600 hover:bg-amber-500 text-white font-bold rounded-2xl shadow-lg shadow-amber-500/20 transition-all transform hover:scale-[1.02] active:scale-[0.98]"
        >
          <Plus size={20} />
          Nuevo Bono
        </button>
      </div>

      {error ? (
        <div className="p-4 bg-red-500/10 border border-red-500/20 rounded-2xl text-red-600 dark:text-red-400 text-sm font-medium">
          Error: {error}
        </div>
      ) : loading ? (
        <div className="flex flex-col items-center justify-center h-64 gap-3">
          <Loader2 className="w-8 h-8 text-amber-500 animate-spin" />
          <p className="text-sm text-gray-500">Cargando catálogo...</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {bonos.map((bono) => (
            <div key={bono.id} className="bg-white/50 dark:bg-white/5 backdrop-blur-xl border border-gray-100 dark:border-white/10 rounded-3xl p-6 shadow-sm hover:shadow-md transition-all group relative overflow-hidden">
              <div className="flex justify-between items-start mb-4">
                <div className={`w-12 h-12 rounded-2xl flex items-center justify-center shadow-lg transition-colors ${bono.esta_activo ? 'bg-amber-500 text-white shadow-amber-500/30' : 'bg-gray-200 dark:bg-gray-800 text-gray-400 dark:text-gray-600'}`}>
                  <Tag size={24} />
                </div>
                <div className="flex gap-2">
                  {/* Status Toggle */}
                  <button
                    onClick={() => toggleStatus(bono)}
                    className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-amber-500 focus:ring-offset-2 ${bono.esta_activo ? 'bg-amber-500' : 'bg-gray-300 dark:bg-white/10'}`}
                  >
                    <span className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${bono.esta_activo ? 'translate-x-6' : 'translate-x-1'}`} />
                  </button>
                  <button 
                    onClick={() => openModal(bono)}
                    className="p-2 bg-gray-100 dark:bg-white/10 text-gray-600 dark:text-gray-300 hover:text-amber-500 dark:hover:text-amber-400 rounded-xl transition-colors"
                  >
                    <Edit2 size={16} />
                  </button>
                </div>
              </div>
              <h3 className="text-lg font-bold text-gray-800 dark:text-white mb-2">{bono.nombre_bono}</h3>
              <p className="text-sm text-gray-500 dark:text-gray-400 leading-relaxed min-h-[40px]">{bono.descripcion || 'Sin descripción'}</p>
            </div>
          ))}
          
          {bonos.length === 0 && (
             <div className="col-span-full py-12 text-center text-gray-400 bg-white/30 dark:bg-white/5 rounded-3xl border border-dashed border-gray-300 dark:border-white/10">
               No hay bonos registrados en el catálogo.
             </div>
          )}
        </div>
      )}

      {/* MODAL */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={() => setIsModalOpen(false)} />
          <div className="relative w-full max-w-md bg-white dark:bg-[#0f1117] border border-gray-100 dark:border-white/10 rounded-[32px] shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-200">
            <div className="px-6 py-6 border-b border-gray-100 dark:border-white/5">
              <h2 className="text-xl font-bold text-gray-800 dark:text-white flex items-center gap-2">
                <Tag className="w-5 h-5 text-amber-500" />
                {formData.id ? 'Editar Bono' : 'Nuevo Bono'}
              </h2>
            </div>
            
            <form onSubmit={handleSubmit} className="p-6 space-y-4">
              <div>
                <label className="block text-[11px] font-bold text-gray-400 uppercase tracking-wider mb-1.5">Nombre del Bono / Concepto</label>
                <input
                  type="text"
                  required
                  value={formData.nombre_bono}
                  onChange={e => setFormData({...formData, nombre_bono: e.target.value})}
                  className="w-full px-4 py-2.5 bg-gray-50 dark:bg-[#1a1f2e] border border-gray-200 dark:border-white/10 rounded-2xl text-sm outline-none transition-all dark:text-white focus:ring-2 focus:ring-amber-500/40"
                  placeholder="Ej. Bono de Puntualidad"
                />
              </div>

              <div>
                <label className="block text-[11px] font-bold text-gray-400 uppercase tracking-wider mb-1.5">Descripción</label>
                <textarea
                  rows={3}
                  value={formData.descripcion}
                  onChange={e => setFormData({...formData, descripcion: e.target.value})}
                  className="w-full px-4 py-2.5 bg-gray-50 dark:bg-[#1a1f2e] border border-gray-200 dark:border-white/10 rounded-2xl text-sm outline-none transition-all dark:text-white focus:ring-2 focus:ring-amber-500/40 resize-none"
                  placeholder="Detalles sobre las condiciones del bono..."
                />
              </div>

              <div className="flex gap-3 pt-4">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="flex-1 py-3 rounded-2xl border border-gray-200 dark:border-white/10 text-gray-600 dark:text-gray-400 font-bold text-sm hover:bg-gray-50 dark:hover:bg-white/5 transition-all"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  className="flex-1 flex items-center justify-center gap-2 py-3 rounded-2xl bg-amber-600 hover:bg-amber-500 text-white font-bold text-sm shadow-lg shadow-amber-500/20 transition-all disabled:opacity-60"
                >
                  {saving ? <Loader2 size={18} className="animate-spin" /> : <CheckCircle2 size={18} />}
                  Guardar
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
