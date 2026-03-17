/** final 1.0 */
import { useState, useEffect } from 'react';
import { Plus, Edit2, Trash2, Loader2, X, AlertTriangle, Image as ImageIcon, Upload, Trash } from 'lucide-react';
import { supabase } from '../lib/supabase';

interface UnidadNegocio {
  id: number;
  nombre: string;
  color_hex: string;
  logo_url?: string;
  colaboradores?: { count: number }[];
}

interface ConfirmModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  loading: boolean;
  unidadName: string;
}

function ConfirmDeleteModal({ isOpen, onClose, onConfirm, loading, unidadName }: ConfirmModalProps) {
  if (!isOpen) return null;
  return (
    <div className="fixed inset-0 z-[200] flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={onClose} />
      <div className="relative w-full max-w-sm bg-white dark:bg-gray-900 border border-gray-100 dark:border-white/10 rounded-[24px] shadow-2xl p-6 animate-in fade-in zoom-in-95 duration-200">
        <div className="flex flex-col items-center text-center">
          <div className="w-12 h-12 rounded-full bg-red-500/10 flex items-center justify-center mb-4">
            <AlertTriangle className="w-6 h-6 text-red-500" />
          </div>
          <h3 className="text-xl font-bold text-gray-800 dark:text-white mb-2">¿Eliminar unidad?</h3>
          <p className="text-sm text-gray-500 dark:text-gray-400 mb-6">
            Estás a punto de borrar <strong>{unidadName}</strong>. Esta acción no se puede deshacer. Los colaboradores asociados podrían perder su asignación temporalmente.
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

const PREDEFINED_COLORS = [
  '#ef4444', '#f97316', '#f59e0b', '#eab308', '#84cc16', '#22c55e',
  '#10b981', '#14b8a6', '#06b6d4', '#0ea5e9', '#3b82f6', '#6366f1',
  '#8b5cf6', '#a855f7', '#d946ef', '#ec4899', '#f43f5e', '#64748b'
];

function UnidadModal({ isOpen, onClose, onSuccess, initialData }: any) {
  const [loading, setLoading] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [formData, setFormData] = useState({ id: 0, nombre: '', color_hex: '#3B82F6', logo_url: '' });

  useEffect(() => {
    if (initialData) {
      setFormData({
        id: initialData.id,
        nombre: initialData.nombre,
        color_hex: initialData.color_hex || '#3B82F6',
        logo_url: initialData.logo_url || ''
      });
    } else {
      setFormData({ id: 0, nombre: '', color_hex: '#3B82F6', logo_url: '' });
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
      nombre: formData.nombre.trim(),
      color_hex: formData.color_hex,
      logo_url: formData.logo_url
    };

    try {
      if (isEditing) {
        const { error: err } = await supabase.from('unidades_negocio').update(payload).eq('id', formData.id);
        if (err) throw err;
      } else {
        const { error: err } = await supabase.from('unidades_negocio').insert([payload]);
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

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    try {
      const file = e.target.files?.[0];
      if (!file) return;

      setUploading(true);
      setError(null);

      // 1. Sanitize file name
      const fileExt = file.name.split('.').pop();
      const fileName = `${Math.random().toString(36).substring(2)}-${Date.now()}.${fileExt}`;
      const filePath = `logos/${fileName}`;

      // 2. Upload to 'imagenes' bucket
      const { error: uploadError } = await supabase.storage
        .from('imagenes')
        .upload(filePath, file);

      if (uploadError) throw uploadError;

      // 3. Get Public URL
      const { data: { publicUrl } } = supabase.storage
        .from('imagenes')
        .getPublicUrl(filePath);

      setFormData(prev => ({ ...prev, logo_url: publicUrl }));
    } catch (err: any) {
      setError("Error al subir imagen: " + err.message);
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={onClose} />
      <div className="relative w-full max-w-md bg-white dark:bg-gray-900 border border-gray-100 dark:border-white/10 rounded-[24px] shadow-2xl p-6 animate-in fade-in zoom-in-95 duration-200">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-bold text-gray-800 dark:text-white">
            {isEditing ? 'Editar Unidad' : 'Nueva Unidad'}
          </h2>
          <button onClick={onClose} className="p-2 text-gray-400 hover:text-gray-700 dark:hover:text-gray-200 bg-gray-50 hover:bg-gray-100 dark:bg-white/5 dark:hover:bg-white/10 rounded-xl transition-all">
            <X size={18} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-[11px] font-bold text-gray-400 uppercase tracking-wider mb-1.5">Nombre de la Unidad</label>
            <input
              type="text"
              required
              value={formData.nombre}
              onChange={(e) => setFormData({ ...formData, nombre: e.target.value })}
              className="w-full px-4 py-3 bg-gray-50 dark:bg-black/20 border border-gray-200 dark:border-white/10 rounded-xl text-sm dark:text-white focus:ring-2 focus:ring-blue-500/50 outline-none"
              placeholder="Ej. Comercial, Operaciones..."
            />
          </div>
          <div>
            <label className="block text-[11px] font-bold text-gray-400 uppercase tracking-wider mb-2">Color Representativo</label>
            
            {/* Paleta predefinida */}
            <div className="grid grid-cols-6 gap-2 mb-3">
              {PREDEFINED_COLORS.map(c => (
                <button
                  key={c}
                  type="button"
                  onClick={() => setFormData({ ...formData, color_hex: c })}
                  className={`h-8 rounded-lg outline-none transition-all ${
                    formData.color_hex.toLowerCase() === c.toLowerCase()
                      ? 'ring-2 ring-offset-2 ring-offset-white dark:ring-offset-gray-900 ring-blue-500 scale-110'
                      : 'hover:scale-110 opacity-90 hover:opacity-100'
                  }`}
                  style={{ backgroundColor: c }}
                />
              ))}
            </div>

            {/* Selector libre */}
            <div className="flex items-center justify-between bg-gray-50 dark:bg-black/20 px-3 py-2 rounded-xl border border-gray-200 dark:border-white/10">
              <span className="text-xs text-gray-500 dark:text-gray-400 font-medium">Color personalizado:</span>
              <div className="flex items-center gap-3">
                <span className="font-mono text-xs uppercase text-gray-600 dark:text-gray-300">
                  {formData.color_hex}
                </span>
                <input
                  type="color"
                  value={formData.color_hex}
                  onChange={(e) => setFormData({ ...formData, color_hex: e.target.value })}
                  className="w-8 h-8 rounded cursor-pointer border-0 bg-transparent p-0"
                />
              </div>
            </div>
          </div>
          <div className="space-y-3">
            <label className="block text-[11px] font-bold text-gray-400 uppercase tracking-wider">Logo de la Empresa</label>
            <div className="flex items-center gap-4">
              <div className="relative w-24 h-24 bg-gray-50 dark:bg-black/20 border border-gray-200 dark:border-white/10 rounded-2xl overflow-hidden flex items-center justify-center group/logo">
                {formData.logo_url ? (
                  <>
                    <img src={formData.logo_url} alt="Preview" className="w-full h-full object-contain p-2" />
                    <button 
                      type="button"
                      onClick={() => setFormData(prev => ({ ...prev, logo_url: '' }))}
                      className="absolute inset-0 bg-black/40 opacity-0 group-hover/logo:opacity-100 transition-opacity flex items-center justify-center text-white"
                    >
                      <Trash size={20} />
                    </button>
                  </>
                ) : (
                  <ImageIcon size={32} className="text-gray-300 dark:text-gray-600" />
                )}
                {uploading && (
                  <div className="absolute inset-0 bg-white/60 dark:bg-black/60 flex items-center justify-center">
                    <Loader2 size={18} className="animate-spin text-blue-500" />
                  </div>
                )}
              </div>
              <div className="flex-1">
                <label className="inline-flex cursor-pointer items-center gap-2 px-4 py-2.5 bg-blue-600/10 hover:bg-blue-600/20 text-blue-600 dark:text-blue-400 font-bold rounded-xl transition-all text-xs">
                  <Upload size={14} />
                  {uploading ? 'Subiendo...' : 'Elegir Imagen'}
                  <input type="file" className="hidden" accept="image/*" onChange={handleFileUpload} disabled={uploading} />
                </label>
                <p className="text-[10px] text-gray-400 mt-2 leading-relaxed">Formatos: PNG, JPG o WEBP. Tamaño recomendado 512x512px.</p>
              </div>
            </div>
          </div>

          {error && <p className="text-sm text-red-500 bg-red-50 dark:bg-red-500/10 p-3 rounded-xl">{error}</p>}

          <button
            type="submit"
            disabled={loading}
            className="w-full py-3.5 bg-blue-600 hover:bg-blue-500 text-white font-bold rounded-xl shadow-lg shadow-blue-500/20 transition-all disabled:opacity-50 mt-2 flex items-center justify-center gap-2"
          >
            {loading && <Loader2 size={18} className="animate-spin" />}
            {loading ? 'Guardando...' : 'Guardar Unidad'}
          </button>
        </form>
      </div>
    </div>
  );
}

export default function UnidadesNegocio() {
  const [unidades, setUnidades] = useState<UnidadNegocio[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  const [modalOpen, setModalOpen] = useState(false);
  const [selectedUnidad, setSelectedUnidad] = useState<UnidadNegocio | null>(null);
  
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [unidadToDelete, setUnidadToDelete] = useState<UnidadNegocio | null>(null);
  const [deleteLoading, setDeleteLoading] = useState(false);

  useEffect(() => { fetchData(); }, []);

  const fetchData = async () => {
    try {
      setLoading(true);
      // Hacemos join count para saber cuántos colaboradores tiene cada unidad
      const { data, error: err } = await supabase
        .from('unidades_negocio')
        .select(`
          id, nombre, color_hex, logo_url,
          colaboradores (count)
        `)
        .order('nombre');

      if (err) throw err;
      setUnidades(data || []);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async () => {
    if (!unidadToDelete) return;
    setDeleteLoading(true);
    try {
      const { error: err } = await supabase.from('unidades_negocio').delete().eq('id', unidadToDelete.id);
      if (err) throw err;
      fetchData();
      setDeleteModalOpen(false);
    } catch (err: any) {
      alert("Error al eliminar: " + err.message);
    } finally {
      setDeleteLoading(false);
    }
  };

  // UI States combinados
  const renderCards = () => {
    if (unidades.length === 0) {
      return (
        <div className="col-span-full py-16 flex flex-col items-center justify-center border-2 border-dashed border-gray-200 dark:border-white/10 rounded-3xl">
          <p className="text-gray-400 font-medium">No hay unidades de negocio creadas.</p>
        </div>
      );
    }

    return unidades.map((u) => {
      const countArray: any = u.colaboradores || [];
      const colabs = countArray.length > 0 ? countArray[0].count : 0;

      return (
        <div key={u.id} className="group bg-white/50 dark:bg-white/5 backdrop-blur-xl border border-gray-100 dark:border-white/10 rounded-3xl p-6 shadow-sm hover:shadow-xl transition-all duration-300 relative overflow-hidden flex flex-col justify-between min-h-[160px]">
          <div className="absolute left-0 top-0 bottom-0 w-1.5" style={{ backgroundColor: u.color_hex || '#3B82F6' }} />
          
          <div className="flex justify-between items-start pl-2 mb-8">
            <div className="flex items-center gap-4">
              <div className="w-14 h-14 rounded-2xl bg-white dark:bg-black/20 border border-gray-100 dark:border-white/10 shadow-inner flex items-center justify-center overflow-hidden">
                {u.logo_url ? (
                  <img src={u.logo_url} alt={u.nombre} className="w-full h-full object-contain p-2" />
                ) : (
                  <div className="w-full h-full flex items-center justify-center font-bold text-xl" style={{ backgroundColor: `${u.color_hex}15`, color: u.color_hex }}>
                    {u.nombre?.charAt(0).toUpperCase()}
                  </div>
                )}
              </div>
              <div>
                <h3 className="text-lg font-bold text-gray-800 dark:text-white leading-tight">{u.nombre}</h3>
                <span className="text-[11px] font-mono font-medium text-gray-400 uppercase">{u.color_hex}</span>
              </div>
            </div>
            <div className="flex items-center gap-1 opacity-100 sm:opacity-0 sm:group-hover:opacity-100 transition-opacity">
              <button onClick={() => { setSelectedUnidad(u); setModalOpen(true); }} className="p-2 text-gray-400 hover:text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-500/10 rounded-xl transition-colors">
                <Edit2 size={16} />
              </button>
              <button onClick={() => { setUnidadToDelete(u); setDeleteModalOpen(true); }} className="p-2 text-gray-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-500/10 rounded-xl transition-colors">
                <Trash2 size={16} />
              </button>
            </div>
          </div>

          <div className="pl-2 flex items-center justify-between border-t border-gray-100 dark:border-white/5 pt-4">
            <div>
              <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">Colaboradores</p>
              <p className="text-xl font-bold text-gray-700 dark:text-gray-300">{colabs}</p>
            </div>
          </div>
        </div>
      );
    });
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-500 max-w-6xl mx-auto">
      {/* Encabezado */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-gray-800 dark:text-white">Unidades de Negocio</h1>
          <p className="text-gray-500 dark:text-gray-400 mt-1">
            Gestión de agrupaciones y colores para colaboradores
          </p>
        </div>
        <button
          onClick={() => { setSelectedUnidad(null); setModalOpen(true); }}
          className="flex items-center justify-center gap-2 px-6 py-3.5 bg-blue-600 hover:bg-blue-500 text-white font-bold rounded-2xl shadow-lg shadow-blue-500/20 transition-transform transform hover:scale-[1.02] active:scale-[0.98]"
        >
          <Plus size={20} />
          Nueva Unidad
        </button>
      </div>

      {error && (
        <div className="p-4 bg-red-500/10 border border-red-500/20 rounded-2xl text-red-600 dark:text-red-400 text-sm font-medium">
          Error: {error}
        </div>
      )}

      {/* Grid */}
      {loading ? (
        <div className="flex flex-col items-center justify-center h-64 gap-3">
          <Loader2 className="w-8 h-8 text-blue-500 animate-spin" />
          <p className="text-sm text-gray-500">Cargando unidades...</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {renderCards()}
        </div>
      )}

      <UnidadModal
        isOpen={modalOpen}
        initialData={selectedUnidad}
        onClose={() => setModalOpen(false)}
        onSuccess={fetchData}
      />

      <ConfirmDeleteModal
        isOpen={deleteModalOpen}
        onClose={() => setDeleteModalOpen(false)}
        onConfirm={handleDelete}
        loading={deleteLoading}
        unidadName={unidadToDelete?.nombre || ''}
      />
    </div>
  );
}
