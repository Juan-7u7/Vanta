/** final 1.0 */
import { X, Loader2 } from 'lucide-react';
import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';

interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  initialData?: any;
}

export default function ColaboradorModal({ isOpen, onClose, onSuccess, initialData }: ModalProps) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  // Catálogos
  const [unidades, setUnidades] = useState<{id: number, nombre: string}[]>([]);
  const [perfiles, setPerfiles] = useState<{id: number, nombre_perfil: string}[]>([]);
  const [jefes, setJefes] = useState<{id: string, nombre: string, apellido_paterno: string}[]>([]);
  const [esquemas, setEsquemas] = useState<{id: number, nombre: string}[]>([]);

  const [formData, setFormData] = useState({
    matricula: '',
    nombre: '',
    apellido_paterno: '',
    apellido_materno: '',
    email: '',
    puesto: '',
    area: '',
    razon_social: 'VANTA MEDIA S.A. DE C.V.',
    unidad_negocio_id: '',
    perfil_id: '',
    jefe_id: '',
    esquema_pago_id: '',
    esta_activo: true,
    fecha_ingreso: new Date().toISOString().split('T')[0]
  });

  useEffect(() => {
    if (isOpen) {
      fetchCatalogs();
      if (initialData) {
        setFormData({
          matricula: initialData.matricula || '',
          nombre: initialData.nombre || '',
          apellido_paterno: initialData.apellido_paterno || '',
          apellido_materno: initialData.apellido_materno || '',
          email: initialData.email || '',
          puesto: initialData.puesto || '',
          area: initialData.area || '',
          razon_social: initialData.razon_social || 'VANTA MEDIA S.A. DE C.V.',
          unidad_negocio_id: initialData.unidad_negocio_id?.toString() || '',
          perfil_id: initialData.perfil_id?.toString() || '',
          jefe_id: initialData.jefe_id || '',
          esquema_pago_id: initialData.esquema_pago_id?.toString() || '',
          esta_activo: initialData.esta_activo ?? true,
          fecha_ingreso: initialData.fecha_ingreso || new Date().toISOString().split('T')[0]
        });
      } else {
        setFormData({
          matricula: '', nombre: '', apellido_paterno: '', apellido_materno: '',
          email: '', puesto: '', area: '', razon_social: 'VANTA MEDIA S.A. DE C.V.',
          unidad_negocio_id: '', perfil_id: '', jefe_id: '', esquema_pago_id: '',
          esta_activo: true, fecha_ingreso: new Date().toISOString().split('T')[0]
        });
      }
    }
  }, [isOpen, initialData]);

  const fetchCatalogs = async () => {
    try {
      const [uRes, pRes, jRes, eRes] = await Promise.all([
        supabase.from('unidades_negocio').select('id, nombre'),
        supabase.from('perfiles_seguridad').select('id, nombre_perfil'),
        supabase.from('colaboradores').select('id, nombre, apellido_paterno').eq('esta_activo', true),
        supabase.from('esquemas_pago').select('id, nombre')
      ]);

      if (uRes.data) setUnidades(uRes.data);
      if (pRes.data) setPerfiles(pRes.data);
      if (eRes.data) setEsquemas(eRes.data);
      if (jRes.data) {
        // Excluir al propio colaborador de la lista de jefes si estamos editando
        const filteredJefes = initialData 
          ? jRes.data.filter(j => j.id !== initialData.id)
          : jRes.data;
        setJefes(filteredJefes);
      }
    } catch (err) {
      console.error('Error cargando catálogos:', err);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    const dataToSave = {
      ...formData,
      unidad_negocio_id: formData.unidad_negocio_id ? parseInt(formData.unidad_negocio_id) : null,
      perfil_id: formData.perfil_id ? parseInt(formData.perfil_id) : null,
      jefe_id: formData.jefe_id || null,
      esquema_pago_id: formData.esquema_pago_id ? parseInt(formData.esquema_pago_id) : null
    };

    try {
      if (initialData) {
        // Actualizar
        const { error: updateError } = await supabase
          .from('colaboradores')
          .update(dataToSave)
          .eq('id', initialData.id);
        if (updateError) throw updateError;
      } else {
        // Insertar
        const { error: insertError } = await supabase
          .from('colaboradores')
          .insert([dataToSave]);
        if (insertError) throw insertError;
      }

      onSuccess();
      onClose();
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 animate-in fade-in duration-300">
      <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={onClose} />
      
      <div className="relative w-full max-w-2xl bg-white dark:bg-gray-900 rounded-[32px] shadow-2xl overflow-hidden animate-in zoom-in-95 duration-300">
        <div className="flex items-center justify-between p-6 border-b border-gray-100 dark:border-white/5">
          <h2 className="text-xl font-bold text-gray-800 dark:text-white">
            {initialData ? 'Editar Colaborador' : 'Nuevo Colaborador'}
          </h2>
          <button onClick={onClose} className="p-2 hover:bg-gray-100 dark:hover:bg-white/5 rounded-xl transition-colors text-gray-400">
            <X size={20} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 overflow-y-auto max-h-[80vh] scrollbar-hide">
          {error && (
            <div className="mb-6 p-4 bg-red-500/10 border border-red-500/20 rounded-2xl text-red-600 text-sm">
              {error}
            </div>
          )}

          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            {/* Matrícula */}
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-gray-400 uppercase ml-1">Matrícula</label>
              <input 
                required
                type="text"
                value={formData.matricula}
                onChange={e => setFormData({...formData, matricula: e.target.value})}
                placeholder="Ej. V-001"
                className="w-full px-4 py-3 bg-gray-50 dark:bg-white/5 border border-gray-200 dark:border-white/10 rounded-2xl focus:ring-2 focus:ring-blue-500/50 outline-none transition-all dark:text-white text-sm"
              />
            </div>

            {/* Email */}
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-gray-400 uppercase ml-1">Email</label>
              <input 
                required
                type="email"
                value={formData.email}
                onChange={e => setFormData({...formData, email: e.target.value})}
                placeholder="correo@ejemplo.com"
                className="w-full px-4 py-3 bg-gray-50 dark:bg-white/5 border border-gray-200 dark:border-white/10 rounded-2xl focus:ring-2 focus:ring-blue-500/50 outline-none transition-all dark:text-white text-sm"
              />
            </div>

            {/* Nombre */}
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-gray-400 uppercase ml-1">Nombre</label>
              <input 
                required
                type="text"
                value={formData.nombre}
                onChange={e => setFormData({...formData, nombre: e.target.value})}
                className="w-full px-4 py-3 bg-gray-50 dark:bg-white/5 border border-gray-200 dark:border-white/10 rounded-2xl focus:ring-2 focus:ring-blue-500/50 outline-none transition-all dark:text-white text-sm"
              />
            </div>

            {/* Apellidos */}
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-gray-400 uppercase ml-1">At. Paterno</label>
                <input 
                  required
                  type="text"
                  value={formData.apellido_paterno}
                  onChange={e => setFormData({...formData, apellido_paterno: e.target.value})}
                  className="w-full px-4 py-3 bg-gray-50 dark:bg-white/5 border border-gray-200 dark:border-white/10 rounded-2xl focus:ring-2 focus:ring-blue-500/50 outline-none transition-all dark:text-white text-sm"
                />
              </div>
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-gray-400 uppercase ml-1">At. Materno</label>
                <input 
                  type="text"
                  value={formData.apellido_materno}
                  onChange={e => setFormData({...formData, apellido_materno: e.target.value})}
                  className="w-full px-4 py-3 bg-gray-50 dark:bg-white/5 border border-gray-200 dark:border-white/10 rounded-2xl focus:ring-2 focus:ring-blue-500/50 outline-none transition-all dark:text-white text-sm"
                />
              </div>
            </div>

            {/* Puesto */}
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-gray-400 uppercase ml-1">Puesto</label>
              <input 
                type="text"
                value={formData.puesto}
                onChange={e => setFormData({...formData, puesto: e.target.value})}
                className="w-full px-4 py-3 bg-gray-50 dark:bg-white/5 border border-gray-200 dark:border-white/10 rounded-2xl focus:ring-2 focus:ring-blue-500/50 outline-none transition-all dark:text-white text-sm"
              />
            </div>

            {/* Area */}
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-gray-400 uppercase ml-1">Área</label>
              <input 
                type="text"
                value={formData.area}
                onChange={e => setFormData({...formData, area: e.target.value})}
                className="w-full px-4 py-3 bg-gray-50 dark:bg-white/5 border border-gray-200 dark:border-white/10 rounded-2xl focus:ring-2 focus:ring-blue-500/50 outline-none transition-all dark:text-white text-sm"
              />
            </div>

            {/* Unidad de Negocio */}
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-gray-400 uppercase ml-1">Unidad de Negocio</label>
              <select 
                value={formData.unidad_negocio_id}
                onChange={e => setFormData({...formData, unidad_negocio_id: e.target.value})}
                className="w-full px-4 py-3 bg-gray-50 dark:bg-[#1a1f2e] border border-gray-200 dark:border-white/10 rounded-2xl focus:ring-2 focus:ring-blue-500/50 outline-none transition-all dark:text-white text-sm cursor-pointer appearance-none"
              >
                <option value="" className="bg-white dark:bg-[#1a1f2e] text-gray-900 dark:text-gray-300">Seleccionar unidad...</option>
                {unidades.map(u => (
                  <option key={u.id} value={u.id} className="bg-white dark:bg-[#1a1f2e] text-gray-900 dark:text-gray-300">
                    {u.nombre}
                  </option>
                ))}
              </select>
            </div>

            {/* Perfil de Seguridad */}
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-gray-400 uppercase ml-1">Perfil de Seguridad</label>
              <select 
                value={formData.perfil_id}
                onChange={e => setFormData({...formData, perfil_id: e.target.value})}
                className="w-full px-4 py-3 bg-gray-50 dark:bg-[#1a1f2e] border border-gray-200 dark:border-white/10 rounded-2xl focus:ring-2 focus:ring-blue-500/50 outline-none transition-all dark:text-white text-sm cursor-pointer appearance-none"
              >
                <option value="" className="bg-white dark:bg-[#1a1f2e] text-gray-900 dark:text-gray-300">Seleccionar perfil...</option>
                {perfiles.map(p => (
                  <option key={p.id} value={p.id} className="bg-white dark:bg-[#1a1f2e] text-gray-900 dark:text-gray-300">
                    {p.nombre_perfil}
                  </option>
                ))}
              </select>
            </div>

            {/* Jefe Directo */}
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-gray-400 uppercase ml-1">Jefe Directo</label>
              <select 
                value={formData.jefe_id}
                onChange={e => setFormData({...formData, jefe_id: e.target.value})}
                className="w-full px-4 py-3 bg-gray-50 dark:bg-[#1a1f2e] border border-gray-200 dark:border-white/10 rounded-2xl focus:ring-2 focus:ring-blue-500/50 outline-none transition-all dark:text-white text-sm cursor-pointer appearance-none"
              >
                <option value="" className="bg-white dark:bg-[#1a1f2e] text-gray-900 dark:text-gray-300">Seleccionar jefe...</option>
                {jefes.map(j => (
                  <option key={j.id} value={j.id} className="bg-white dark:bg-[#1a1f2e] text-gray-900 dark:text-gray-300">
                    {j.nombre} {j.apellido_paterno}
                  </option>
                ))}
              </select>
            </div>

            {/* Fecha de Ingreso */}
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-gray-400 uppercase ml-1">Fecha de Ingreso</label>
              <input 
                type="date"
                value={formData.fecha_ingreso}
                onChange={e => setFormData({...formData, fecha_ingreso: e.target.value})}
                className="w-full px-4 py-3 bg-gray-50 dark:bg-white/5 border border-gray-200 dark:border-white/10 rounded-2xl focus:ring-2 focus:ring-blue-500/50 outline-none transition-all dark:text-white text-sm"
              />
            </div>

            {/* Estado Activo/Baja */}
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-gray-400 uppercase ml-1">Estado</label>
              <button
                type="button"
                onClick={() => setFormData({ ...formData, esta_activo: !formData.esta_activo })}
                className={`w-full px-4 py-3 rounded-2xl border-2 font-bold text-sm flex items-center justify-between transition-all duration-200 ${
                  formData.esta_activo
                    ? 'bg-green-500/10 border-green-500/30 text-green-700 dark:text-green-400 hover:bg-green-500/20'
                    : 'bg-red-500/10 border-red-500/30 text-red-700 dark:text-red-400 hover:bg-red-500/20'
                }`}
              >
                <span className="flex items-center gap-2">
                  <span className={`w-2.5 h-2.5 rounded-full ${formData.esta_activo ? 'bg-green-500 shadow-[0_0_8px_rgba(34,197,94,0.6)]' : 'bg-red-500'}`} />
                  {formData.esta_activo ? 'Activo' : 'Baja / Inactivo'}
                </span>
                <span className={`text-[10px] uppercase tracking-wider px-2 py-0.5 rounded-full border font-bold ${
                  formData.esta_activo
                    ? 'border-green-500/30 bg-green-500/10'
                    : 'border-red-500/30 bg-red-500/10'
                }`}>
                  {formData.esta_activo ? 'Clic para dar de baja' : 'Clic para reactivar'}
                </span>
              </button>
            </div>

            {/* Esquema de Pago */}
            <div className="space-y-1.5 md:col-span-2">
              <label className="text-xs font-bold text-gray-400 uppercase ml-1">Esquema de Pago (Cálculo de Bonos)</label>
              <select 
                value={formData.esquema_pago_id}
                onChange={e => setFormData({...formData, esquema_pago_id: e.target.value})}
                className="w-full px-4 py-3 bg-gray-50 dark:bg-[#1a1f2e] border border-gray-200 dark:border-white/10 rounded-2xl focus:ring-2 focus:ring-blue-500/50 outline-none transition-all dark:text-white text-sm cursor-pointer appearance-none"
              >
                <option value="" className="bg-white dark:bg-[#1a1f2e] text-gray-900 dark:text-gray-300">Seleccionar esquema...</option>
                {esquemas.map(e => (
                  <option key={e.id} value={e.id} className="bg-white dark:bg-[#1a1f2e] text-gray-900 dark:text-gray-300">
                    {e.nombre}
                  </option>
                ))}
              </select>
              <p className="text-[10px] text-gray-400 mt-1 ml-1">
                Esto define si el bono se calcula por % de cumplimiento, por meses de antigüedad o por monto.
              </p>
            </div>
          </div>

          <div className="mt-8 flex gap-3">
            <button 
              type="button" 
              onClick={onClose}
              className="flex-1 py-4 bg-gray-100 dark:bg-white/5 hover:bg-gray-200 dark:hover:bg-white/10 text-gray-600 dark:text-white font-bold rounded-2xl transition-all"
            >
              Cancelar
            </button>
            <button 
              disabled={loading}
              type="submit"
              className="flex-1 py-4 bg-blue-600 hover:bg-blue-500 text-white font-bold rounded-2xl shadow-lg shadow-blue-500/20 transition-all flex items-center justify-center gap-2"
            >
              {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : 'Guardar Colaborador'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
