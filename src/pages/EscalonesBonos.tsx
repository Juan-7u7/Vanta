/** final 2.0 - Gestión de Esquemas y Escalones */
import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { 
  Plus, Edit2, Trash2, Save, X, Loader2, 
  Percent, ArrowRight, AlertCircle, Info,
  Layers, Settings2, Calendar, DollarSign
} from 'lucide-react';

interface Esquema {
  id: number;
  nombre: string;
  tipo: 'porcentaje' | 'meses' | 'monto';
  descripcion: string;
}

interface Escalon {
  id: number;
  esquema_id: number;
  limite_inferior: number;
  limite_superior: number;
  porcentaje_pago: number;
}

export default function EscalonesBonos() {
  const [esquemas, setEsquemas] = useState<Esquema[]>([]);
  const [selectedEsquemaId, setSelectedEsquemaId] = useState<number | null>(null);
  const [escalones, setEscalones] = useState<Escalon[]>([]);
  
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  // Modales/Edición
  const [showEsquemaModal, setShowEsquemaModal] = useState(false);
  const [editingEsquema, setEditingEsquema] = useState<Partial<Esquema> | null>(null);
  
  const [editingEscalonId, setEditingEscalonId] = useState<number | 'new' | null>(null);
  const [escalonFormData, setEscalonFormData] = useState<Partial<Escalon>>({
    limite_inferior: 0,
    limite_superior: 0,
    porcentaje_pago: 0
  });

  useEffect(() => {
    fetchEsquemas();
  }, []);

  useEffect(() => {
    if (selectedEsquemaId) {
      fetchEscalones(selectedEsquemaId);
    } else {
      setEscalones([]);
    }
  }, [selectedEsquemaId]);

  const fetchEsquemas = async () => {
    try {
      setLoading(true);
      const { data, error: err } = await supabase.from('esquemas_pago').select('*').order('nombre');
      if (err) throw err;
      setEsquemas(data || []);
      if (data && data.length > 0 && !selectedEsquemaId) {
        setSelectedEsquemaId(data[0].id);
      }
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const fetchEscalones = async (esquemaId: number) => {
    try {
      const { data, error: err } = await supabase
        .from('escalones_bonos')
        .select('*')
        .eq('esquema_id', esquemaId)
        .order('limite_inferior', { ascending: true });
      if (err) throw err;
      setEscalones(data || []);
    } catch (err: any) {
      setError(err.message);
    }
  };

  // --- LÓGICA DE ESQUEMAS ---
  const handleSaveEsquema = async () => {
    try {
      setSaving(true);
      if (editingEsquema?.id) {
        await supabase.from('esquemas_pago').update(editingEsquema).eq('id', editingEsquema.id);
      } else {
        await supabase.from('esquemas_pago').insert([editingEsquema]);
      }
      setShowEsquemaModal(false);
      fetchEsquemas();
    } catch (err: any) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteEsquema = async (id: number) => {
    if (!confirm('¿Eliminar esquema? Se borrarán todos sus escalones asociados.')) return;
    await supabase.from('esquemas_pago').delete().eq('id', id);
    if (selectedEsquemaId === id) setSelectedEsquemaId(null);
    fetchEsquemas();
  };

  // --- LÓGICA DE ESCALONES ---
  const handleSaveEscalon = async () => {
    if (!selectedEsquemaId) return;
    try {
      setSaving(true);
      const data = { ...escalonFormData, esquema_id: selectedEsquemaId };
      if (editingEscalonId === 'new') {
        await supabase.from('escalones_bonos').insert([data]);
      } else {
        await supabase.from('escalones_bonos').update(data).eq('id', editingEscalonId);
      }
      setEditingEscalonId(null);
      fetchEscalones(selectedEsquemaId);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  };

  const currentEsquema = esquemas.find(e => e.id === selectedEsquemaId);

  return (
    <div className="max-w-6xl mx-auto space-y-8 animate-in fade-in duration-700">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div className="space-y-1">
          <h1 className="text-3xl font-black text-gray-800 dark:text-white tracking-tight flex items-center gap-3">
            <Layers className="text-indigo-500" size={32} />
            Esquemas de Compensación
          </h1>
          <p className="text-gray-500 dark:text-gray-400">Configura diferentes modelos de pago para tus colaboradores.</p>
        </div>
        <button
          onClick={() => { setEditingEsquema({ nombre: '', tipo: 'porcentaje', descripcion: '' }); setShowEsquemaModal(true); }}
          className="flex items-center gap-2 px-6 py-3 bg-gray-900 dark:bg-white text-white dark:text-black font-bold rounded-2xl shadow-xl hover:scale-[1.02] transition-all"
        >
          <Plus size={20} /> Nuevo Esquema
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
        {/* Sidebar de Esquemas */}
        <div className="lg:col-span-1 space-y-4">
          <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-2">Tus Esquemas</p>
          <div className="space-y-2">
            {esquemas.map(e => (
              <div 
                key={e.id}
                onClick={() => setSelectedEsquemaId(e.id)}
                className={`group relative p-4 rounded-[24px] cursor-pointer transition-all border ${
                  selectedEsquemaId === e.id 
                  ? 'bg-indigo-600 border-indigo-600 text-white shadow-lg shadow-indigo-500/20' 
                  : 'bg-white/40 dark:bg-white/5 border-gray-100 dark:border-white/5 text-gray-600 dark:text-gray-400 hover:border-indigo-500/50'
                }`}
              >
                <div className="flex items-center gap-3">
                  <div className={`p-2 rounded-xl ${selectedEsquemaId === e.id ? 'bg-white/20' : 'bg-indigo-500/10 text-indigo-500'}`}>
                    {e.tipo === 'porcentaje' && <Percent size={16} />}
                    {e.tipo === 'meses' && <Calendar size={16} />}
                    {e.tipo === 'monto' && <DollarSign size={16} />}
                  </div>
                  <div>
                    <p className="text-xs font-bold truncate max-w-[120px]">{e.nombre}</p>
                    <p className={`text-[9px] uppercase font-bold opacity-60`}>{e.tipo}</p>
                  </div>
                </div>
                <div className="absolute top-2 right-2 flex gap-1 transition-all">
                   <button 
                     onClick={(e_event) => { e_event.stopPropagation(); setEditingEsquema(e); setShowEsquemaModal(true); }} 
                     className={`p-1.5 rounded-lg transition-colors ${
                       selectedEsquemaId === e.id 
                       ? 'bg-white/20 hover:bg-white/40 text-white' 
                       : 'bg-indigo-500/10 hover:bg-indigo-500 text-indigo-600 hover:text-white'
                     }`}
                     title="Configurar Esquema"
                   >
                     <Settings2 size={12} />
                   </button>
                   <button 
                     onClick={(e_event) => { e_event.stopPropagation(); handleDeleteEsquema(e.id); }} 
                     className={`p-1.5 rounded-lg transition-colors ${
                       selectedEsquemaId === e.id 
                       ? 'bg-red-500/20 hover:bg-red-500 text-white' 
                       : 'bg-red-500/10 hover:bg-red-500 text-red-600 hover:text-white'
                     }`}
                     title="Eliminar Esquema"
                   >
                     <Trash2 size={12} />
                   </button>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Panel de Escalones */}
        <div className="lg:col-span-3 space-y-6">
          {currentEsquema ? (
            <div className="bg-white/40 dark:bg-black/20 backdrop-blur-xl border border-white/40 dark:border-white/10 rounded-[40px] p-8 shadow-xl">
               <div className="flex items-center justify-between mb-8">
                  <div>
                    <h2 className="text-2xl font-bold text-gray-800 dark:text-white">{currentEsquema.nombre}</h2>
                    <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">{currentEsquema.descripcion || 'Sin descripción'}</p>
                  </div>
                  <button
                    onClick={() => { setEditingEscalonId('new'); setEscalonFormData({ limite_inferior: 0, limite_superior: 0, porcentaje_pago: 0 }); }}
                    className="flex items-center gap-2 px-4 py-2 bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 font-bold rounded-xl hover:bg-indigo-500 hover:text-white transition-all text-xs"
                  >
                    <Plus size={16} /> Agregar Escalón
                  </button>
               </div>

               <div className="overflow-hidden rounded-2xl border border-gray-100 dark:border-white/5">
                 <table className="w-full text-left">
                   <thead className="bg-gray-50/50 dark:bg-white/5">
                     <tr>
                       <th className="px-6 py-4 text-[10px] font-bold text-gray-400 uppercase tracking-widest">
                         Rango ({currentEsquema.tipo === 'porcentaje' ? '%' : currentEsquema.tipo === 'meses' ? 'Meses' : '$'})
                       </th>
                       <th className="px-6 py-4 text-[10px] font-bold text-gray-400 uppercase tracking-widest text-center">Pago %</th>
                       <th className="px-6 py-4 text-[10px] font-bold text-gray-400 uppercase tracking-widest text-right">Acciones</th>
                     </tr>
                   </thead>
                   <tbody className="divide-y divide-gray-100 dark:divide-white/5">
                     {editingEscalonId !== null && (
                       <tr className="bg-indigo-500/5">
                         <td className="px-6 py-4">
                           <div className="flex items-center gap-2">
                             <input type="number" step="0.01" value={escalonFormData.limite_inferior} onChange={e => setEscalonFormData({...escalonFormData, limite_inferior: parseFloat(e.target.value)})} className="w-20 px-3 py-2 bg-white dark:bg-black/20 border border-indigo-500/30 rounded-xl text-xs outline-none" placeholder="Min" />
                             <ArrowRight size={12} className="text-gray-400" />
                             <input type="number" step="0.01" value={escalonFormData.limite_superior} onChange={e => setEscalonFormData({...escalonFormData, limite_superior: parseFloat(e.target.value)})} className="w-20 px-3 py-2 bg-white dark:bg-black/20 border border-indigo-500/30 rounded-xl text-xs outline-none" placeholder="Max" />
                           </div>
                         </td>
                         <td className="px-6 py-4">
                           <div className="flex items-center justify-center gap-2">
                             <input type="number" step="0.01" value={escalonFormData.porcentaje_pago} onChange={e => setEscalonFormData({...escalonFormData, porcentaje_pago: parseFloat(e.target.value)})} className="w-20 px-3 py-2 bg-white dark:bg-black/20 border border-indigo-500/30 rounded-xl text-xs text-center font-bold" />
                             <span className="text-xs text-indigo-500 font-bold">%</span>
                           </div>
                         </td>
                         <td className="px-6 py-4 text-right">
                           <div className="flex justify-end gap-2">
                             <button onClick={handleSaveEscalon} className="p-2 bg-emerald-50 dark:bg-emerald-500/10 text-emerald-500 hover:bg-emerald-500 hover:text-white rounded-xl transition-all shadow-sm" title="Guardar"><Save size={14} /></button>
                             <button onClick={() => setEditingEscalonId(null)} className="p-2 bg-gray-50 dark:bg-white/5 text-gray-400 hover:bg-gray-500 hover:text-white rounded-xl transition-all shadow-sm" title="Cancelar"><X size={14} /></button>
                           </div>
                         </td>
                       </tr>
                     )}

                     {escalones.map(esc => (
                       <tr key={esc.id} className="hover:bg-gray-50/50 dark:hover:bg-white/[0.02] group">
                         <td className="px-6 py-4">
                           <div className="flex items-center gap-3 text-sm font-medium text-gray-700 dark:text-gray-300">
                             <span className="px-2 py-1 bg-gray-100 dark:bg-white/5 rounded-lg">{esc.limite_inferior}</span>
                             <ArrowRight size={12} className="text-gray-300" />
                             <span className="px-2 py-1 bg-gray-100 dark:bg-white/5 rounded-lg">{esc.limite_superior}</span>
                           </div>
                         </td>
                         <td className="px-6 py-4 text-center">
                           <span className="px-3 py-1 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 font-black text-xs rounded-full">
                             {esc.porcentaje_pago}%
                           </span>
                         </td>
                         <td className="px-6 py-4 text-right">
                            <div className="flex justify-end gap-2">
                               <button 
                                 onClick={() => { setEditingEscalonId(esc.id); setEscalonFormData(esc); }} 
                                 className="p-2 bg-indigo-50 dark:bg-indigo-500/5 text-indigo-400 hover:bg-indigo-500 hover:text-white rounded-xl transition-all shadow-sm"
                                 title="Editar Escalón"
                               >
                                 <Edit2 size={14} />
                               </button>
                               <button 
                                 onClick={() => { if(confirm('¿Eliminar?')) supabase.from('escalones_bonos').delete().eq('id', esc.id).then(() => fetchEscalones(selectedEsquemaId!)); }} 
                                 className="p-2 bg-red-50 dark:bg-red-500/5 text-red-400 hover:bg-red-600 hover:text-white rounded-xl transition-all shadow-sm"
                                 title="Eliminar Escalón"
                               >
                                 <Trash2 size={14} />
                               </button>
                            </div>
                         </td>
                       </tr>
                     ))}
                   </tbody>
                 </table>
               </div>
            </div>
          ) : (
            <div className="h-[400px] bg-white/40 dark:bg-black/20 backdrop-blur-xl border border-white/40 dark:border-white/10 rounded-[40px] flex flex-col items-center justify-center text-center p-12">
               <Layers size={48} className="text-gray-200 dark:text-gray-800 mb-4" />
               <p className="text-gray-400 font-medium">Selecciona o crea un esquema para empezar a configurar sus reglas de pago.</p>
            </div>
          )}
        </div>
      </div>

      {/* Modal Esquema */}
      {showEsquemaModal && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 animate-in fade-in duration-300">
          <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={() => setShowEsquemaModal(false)} />
          <div className="relative w-full max-w-md bg-white dark:bg-gray-900 rounded-[32px] p-8 shadow-2xl overflow-hidden animate-in zoom-in-95 duration-300">
            <h3 className="text-xl font-bold text-gray-800 dark:text-white mb-6">{editingEsquema?.id ? 'Editar Esquema' : 'Nuevo Esquema'}</h3>
            <div className="space-y-4">
              <div className="space-y-1">
                <label className="text-[10px] font-black text-gray-400 uppercase ml-1">Nombre</label>
                <input type="text" value={editingEsquema?.nombre} onChange={e => setEditingEsquema({...editingEsquema, nombre: e.target.value})} className="w-full px-4 py-3 bg-gray-50 dark:bg-white/5 border border-gray-200 dark:border-white/10 rounded-2xl outline-none focus:ring-2 focus:ring-indigo-500" placeholder="Ej: Operativos Planta" />
              </div>
              <div className="space-y-1">
                <label className="text-[10px] font-black text-gray-400 uppercase ml-1">Tipo de Lógica</label>
                <select value={editingEsquema?.tipo} onChange={e => setEditingEsquema({...editingEsquema, tipo: e.target.value as any})} className="w-full px-4 py-3 bg-gray-50 dark:bg-white/5 border border-gray-200 dark:border-white/10 rounded-2xl outline-none focus:ring-2 focus:ring-indigo-500 appearance-none">
                  <option value="porcentaje">Porcentaje de Cumplimiento (%)</option>
                  <option value="meses">Antigüedad (Meses)</option>
                  <option value="monto">Monto de Ventas ($)</option>
                </select>
              </div>
              <div className="space-y-1">
                <label className="text-[10px] font-black text-gray-400 uppercase ml-1">Descripción</label>
                <textarea value={editingEsquema?.descripcion} onChange={e => setEditingEsquema({...editingEsquema, descripcion: e.target.value})} className="w-full px-4 py-3 bg-gray-50 dark:bg-white/5 border border-gray-200 dark:border-white/10 rounded-2xl outline-none focus:ring-2 focus:ring-indigo-500" rows={3} />
              </div>
            </div>
            <div className="mt-8 flex gap-3">
              <button onClick={() => setShowEsquemaModal(false)} className="flex-1 py-4 bg-gray-100 dark:bg-white/5 text-gray-600 dark:text-white font-bold rounded-2xl hover:bg-gray-200 transition-all">Cancelar</button>
              <button onClick={handleSaveEsquema} className="flex-1 py-4 bg-indigo-600 text-white font-bold rounded-2xl shadow-lg shadow-indigo-500/20 hover:bg-indigo-500 transition-all flex items-center justify-center">
                {saving ? <Loader2 className="animate-spin" /> : 'Guardar Esquema'}
              </button>
            </div>
          </div>
        </div>
      )}

      {error && (
        <div className="fixed bottom-8 right-8 p-4 bg-red-500 text-white rounded-2xl shadow-2xl flex items-center gap-3 animate-in slide-in-from-right duration-300">
          <AlertCircle size={20} />
          <p className="text-sm font-bold">{error}</p>
          <button onClick={() => setError(null)}><X size={16} /></button>
        </div>
      )}
    </div>
  );
}
