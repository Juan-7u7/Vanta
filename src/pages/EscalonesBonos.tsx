/** final 3.0 - Gestión de Esquemas y Plantillas */
import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import {
  Plus, Edit2, Trash2, Save, X, Loader2,
  Percent, ArrowRight, AlertCircle,
  Layers, Settings2, Calendar, DollarSign, Copy
} from 'lucide-react';

interface Esquema {
  id: number;
  nombre: string;
  tipo: 'porcentaje' | 'meses' | 'monto' | 'ranking';
  descripcion: string;
  slug?: string;
  fuente?: 'plantilla' | 'custom';
  regla_calculo?: string | null;
  metadata?: Record<string, any> | null;
}

interface Escalon {
  id: number;
  esquema_id: number;
  limite_inferior: number;
  limite_superior: number;
  porcentaje_pago: number;
  valor_referencia?: string | null;
}

const PLANTILLA_RAPIDA = [
  { limite_inferior: 0, limite_superior: 89.9, porcentaje_pago: 0 },
  { limite_inferior: 90, limite_superior: 9999, porcentaje_pago: 100 },
];

export default function EscalonesBonos() {
  const [esquemas, setEsquemas] = useState<Esquema[]>([]);
  const [selectedEsquemaId, setSelectedEsquemaId] = useState<number | null>(null);
  const [escalones, setEscalones] = useState<Escalon[]>([]);
  const [plantillas, setPlantillas] = useState<Esquema[]>([]);
  const [tab, setTab] = useState<'esquemas' | 'plantillas'>('esquemas');

  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [showEsquemaModal, setShowEsquemaModal] = useState(false);
  const [editingEsquema, setEditingEsquema] = useState<Partial<Esquema> | null>(null);

  const [editingEscalonId, setEditingEscalonId] = useState<number | 'new' | null>(null);
  const [escalonFormData, setEscalonFormData] = useState<Partial<Escalon>>({
    limite_inferior: 0,
    limite_superior: 0,
    porcentaje_pago: 0
  });

  // Eliminación segura
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<Esquema | null>(null);
  const [dependientesColabs, setDependientesColabs] = useState<any[]>([]);
  const [dependientesMetas, setDependientesMetas] = useState<any[]>([]);
  const [destinoEsquemaId, setDestinoEsquemaId] = useState<number | null | undefined>(undefined);

  useEffect(() => {
    fetchEsquemas();
    fetchPlantillas();
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
      const { data, error: err } = await supabase.from('esquemas_pago').select('*').order('nombre');
      if (err) throw err;
      setEsquemas(data || []);
      if (data && data.length > 0 && !selectedEsquemaId) {
        setSelectedEsquemaId(data[0].id);
      }
    } catch (err: any) {
      setError(err.message);
    }
  };

  const fetchPlantillas = async () => {
    try {
      const { data, error: err } = await supabase
        .from('esquemas_pago')
        .select('*')
        .eq('fuente', 'plantilla')
        .order('nombre');
      if (err) throw err;
      setPlantillas(data || []);
    } catch (err: any) {
      setError(err.message);
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
      if (data && data.length > 0) {
        setEscalones(data as Escalon[]);
      } else {
        const seeded = PLANTILLA_RAPIDA.map(p => ({ ...p, esquema_id: esquemaId }));
        await supabase.from('escalones_bonos').insert(seeded);
        setEscalones(seeded as any);
      }
    } catch (err: any) {
      setError(err.message);
    }
  };

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
    const esquema = esquemas.find(e => e.id === id);
    if (!esquema) return;
    setDeleteTarget(esquema);
    setDeleteModalOpen(true);
    setDestinoEsquemaId(null);
    setDependientesColabs([]);
    setDependientesMetas([]);
    // cargar dependencias
    try {
      const [{ data: colabs }, { data: metas }] = await Promise.all([
        supabase.from('colaboradores').select('id,nombre,email,matricula').eq('esquema_pago_id', id),
        supabase.from('metas_indicadores').select('id,nombre_indicador,colaborador_id').eq('esquema_pago_id', id)
      ]);
      setDependientesColabs(colabs || []);
      setDependientesMetas(metas || []);
    } catch (e: any) {
      setError(e.message);
    }
  };

  const handleSaveEscalon = async () => {
    if (!selectedEsquemaId) return;
    try {
      if (
        escalonFormData.limite_inferior === undefined ||
        escalonFormData.limite_superior === undefined ||
        escalonFormData.porcentaje_pago === undefined
      ) {
        setError('Completa todos los campos del escalón.');
        return;
      }
      const li = Number(escalonFormData.limite_inferior);
      const ls = Number(escalonFormData.limite_superior);
      const pp = Number(escalonFormData.porcentaje_pago);
      if (isNaN(li) || isNaN(ls) || isNaN(pp)) {
        setError('Usa valores numéricos para rango y porcentaje.');
        return;
      }
      if (ls < li) {
        setError('El límite superior debe ser mayor o igual al inferior.');
        return;
      }
      if (pp < 0 || pp > 200) {
        setError('El porcentaje debe estar entre 0 y 200.');
        return;
      }
      const overlaps = escalones.some(e => {
        if (editingEscalonId !== 'new' && e.id === editingEscalonId) return false;
        return !(ls < e.limite_inferior || li > e.limite_superior);
      });
      if (overlaps) {
        setError('El rango se sobrepone con otro escalón. Ajusta los límites.');
        return;
      }

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

  const cloneFromPlantilla = async (plantilla: Esquema) => {
    try {
      setSaving(true);
      const { data: nuevoEsq, error: errEsq } = await supabase
        .from('esquemas_pago')
        .insert([{
          nombre: `${plantilla.nombre} (copia)`,
          tipo: plantilla.tipo,
          descripcion: plantilla.descripcion,
          fuente: 'custom'
        }])
        .select('id')
        .single();
      if (errEsq) throw errEsq;

      const { data: escalonesTpl, error: errEsc } = await supabase
        .from('escalones_bonos')
        .select('limite_inferior, limite_superior, porcentaje_pago, valor_referencia')
        .eq('esquema_id', plantilla.id);
      if (errEsc) throw errEsc;

      if (escalonesTpl && escalonesTpl.length) {
        const payload = escalonesTpl.map((e: any) => ({
          esquema_id: nuevoEsq.id,
          limite_inferior: e.limite_inferior,
          limite_superior: e.limite_superior,
          porcentaje_pago: e.porcentaje_pago,
          valor_referencia: e.valor_referencia ?? null
        }));
        const { error: errIns } = await supabase.from('escalones_bonos').insert(payload);
        if (errIns) throw errIns;
      }

      await fetchEsquemas();
      setSelectedEsquemaId(nuevoEsq.id);
      setTab('esquemas');
      setEscalones([]);
      fetchEscalones(nuevoEsq.id);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  };

  const currentEsquema = esquemas.find(e => e.id === selectedEsquemaId);
  const esquemasDestino = esquemas.filter(e => !deleteTarget || e.id !== deleteTarget.id);

const helpCopy: Record<string, string[]> = {
    porcentaje: [
      'Define el piso: debajo del 70% no paga (ajusta tus rangos).',
      'Usa el tope en el último escalón para limitar el pago (>100%).',
      'Porcentaje de pago se aplica sobre el monto objetivo de ese indicador.',
    ],
    meses: [
      'Cada fila representa un mes de evaluación (mes1, mes2...).',
      'El porcentaje indica el pago relativo al monto objetivo de meses.',
      'Mantén los meses en orden (1,2,3...) para claridad.',
    ],
    monto: [
      'Usa los rangos de cumplimiento para disparar un pago fijo (porcentaje sobre monto fijo).',
      'Ajusta el tope en el último escalón si quieres limitar sobrecumplimientos.',
      'Si un tramo debe pagar 0, deja porcentaje_pago en 0.',
    ],
    ranking: [
      'Usa valor_referencia para nombrar la posición (ej. top3, top10).',
      'Ordena los rangos por posición ascendente para evitar solapes.',
      'El porcentaje se aplica sobre el monto objetivo del indicador.',
    ],
  };

  const rangoLabel = (tipo: string) => {
    if (tipo === 'monto') return 'Rango (%)';
    if (tipo === 'meses') return 'Rango (Meses)';
    if (tipo === 'porcentaje') return 'Rango (%)';
    if (tipo === 'ranking') return 'Rango (Posición)';
    return 'Rango';
  };

  const pagoLabel = (tipo: string) => {
    if (tipo === 'monto') return 'Pago ($)';
    if (tipo === 'meses') return 'Pago ($)';
    if (tipo === 'porcentaje') return 'Pago (%)';
    if (tipo === 'ranking') return 'Pago (%)';
    return 'Pago';
  };

  return (
    <div className="max-w-6xl mx-auto space-y-8 animate-in fade-in duration-700">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div className="space-y-2 w-full">
                  <div className="flex items-center gap-3">
                    <Layers className="text-indigo-500" size={32} />
                    <div>
                      <h1 className="text-3xl font-black text-gray-800 dark:text-white tracking-tight">Esquemas de Compensación</h1>
                      <p className="text-gray-500 dark:text-gray-400">Configura modelos de pago o parte de una plantilla.</p>
                    </div>
                  </div>
          <div className="flex gap-3 mt-2">
            <button
              onClick={() => setTab('esquemas')}
              className={`px-4 py-2 rounded-xl text-xs font-black uppercase tracking-widest border ${tab === 'esquemas' ? 'bg-indigo-600 text-white border-indigo-600' : 'bg-white/50 dark:bg-white/5 border-gray-200 dark:border-white/10 text-gray-500'}`}
            >Mis Esquemas</button>
            <button
              onClick={() => setTab('plantillas')}
              className={`px-4 py-2 rounded-xl text-xs font-black uppercase tracking-widest border ${tab === 'plantillas' ? 'bg-indigo-600 text-white border-indigo-600' : 'bg-white/50 dark:bg-white/5 border-gray-200 dark:border-white/10 text-gray-500'}`}
            >Plantillas</button>
          </div>
        </div>
        <button
          onClick={() => { setEditingEsquema({ nombre: '', tipo: 'porcentaje', descripcion: '' }); setShowEsquemaModal(true); }}
          className="flex items-center gap-2 px-6 py-3 bg-gray-900 dark:bg-white text-white dark:text-black font-bold rounded-2xl shadow-xl hover:scale-[1.02] transition-all"
        >
          <Plus size={20} /> Nuevo Esquema
        </button>
      </div>

      {tab === 'plantillas' ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {plantillas.map(p => (
            <div key={p.id} className="p-6 rounded-3xl border border-gray-100 dark:border-white/10 bg-white/60 dark:bg-white/5 shadow-sm flex flex-col gap-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">{p.tipo}</p>
                  <h3 className="text-lg font-bold text-gray-800 dark:text-white">{p.nombre}</h3>
                </div>
                <span className="px-2 py-1 text-[10px] font-black rounded-full bg-indigo-500/10 text-indigo-500">Plantilla</span>
              </div>
              <p className="text-sm text-gray-500 dark:text-gray-400 line-clamp-3">{p.descripcion || 'Sin descripción'}</p>
              <button
                disabled={saving}
                onClick={() => cloneFromPlantilla(p)}
                className="mt-auto inline-flex items-center justify-center gap-2 px-4 py-2 bg-indigo-600 text-white font-bold rounded-xl hover:bg-indigo-500 transition-all disabled:opacity-60"
              >
                <Copy size={16} /> Usar plantilla
              </button>
            </div>
          ))}
          {plantillas.length === 0 && (
            <div className="col-span-full p-8 text-center text-sm text-gray-500 dark:text-gray-400 border border-dashed rounded-2xl">
              No hay plantillas encontradas. Ejecuta el seed o crea alguna en BD.
            </div>
          )}
        </div>
      ) : (
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
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
                    {e.tipo === 'ranking' && <Percent size={16} />}
                  </div>
                  <div>
                    <p className="text-xs font-bold truncate max-w-[120px]">{e.nombre}</p>
                    <p className={`text-[9px] uppercase font-bold opacity-60`}>{e.tipo}{e.fuente === 'plantilla' ? ' · Plantilla' : ''}</p>
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

        <div className="lg:col-span-3 space-y-6">
          {currentEsquema ? (
            <div className="bg-white/40 dark:bg-black/20 backdrop-blur-xl border border-white/40 dark:border-white/10 rounded-[40px] p-8 shadow-xl">
               <div className="flex items-center justify-between mb-8">
                  <div>
                    <h2 className="text-2xl font-bold text-gray-800 dark:text-white">{currentEsquema.nombre}</h2>
                    <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">{currentEsquema.descripcion || 'Sin descripción'}</p>
                  </div>
                  <div className="flex gap-2">
                    <button
                      onClick={() => { setEditingEscalonId('new'); setEscalonFormData({ limite_inferior: 0, limite_superior: 0, porcentaje_pago: 0 }); }}
                      className="flex items-center gap-2 px-4 py-2 bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 font-bold rounded-xl hover:bg-indigo-500 hover:text-white transition-all text-xs"
                    >
                      <Plus size={16} /> Agregar Escalón
                    </button>
                    <button
                      onClick={async () => {
                        if (!selectedEsquemaId) return;
                        const seeded = PLANTILLA_RAPIDA.map(p => ({ ...p, esquema_id: selectedEsquemaId }));
                        await supabase.from('escalones_bonos').delete().eq('esquema_id', selectedEsquemaId);
                        await supabase.from('escalones_bonos').insert(seeded);
                        fetchEscalones(selectedEsquemaId);
                      }}
                      className="flex items-center gap-2 px-4 py-2 bg-gray-900/80 text-white font-bold rounded-xl hover:bg-gray-800 transition-all text-xs"
                    >
                      Plantilla rápida 90/100
                    </button>
                  </div>
               </div>

               {/* Ayuda contextual rÃ¡pida */}
               <div className="mb-6 grid grid-cols-1 md:grid-cols-3 gap-4">
                 <div className="col-span-2 p-4 rounded-2xl border border-indigo-100 dark:border-white/10 bg-indigo-50/60 dark:bg-white/5">
                   <p className="text-[10px] font-black text-indigo-500 uppercase tracking-[0.2em] mb-2">CÃ³mo configurar</p>
                   <ul className="text-sm text-gray-600 dark:text-gray-300 space-y-1">
                     {(helpCopy[currentEsquema.tipo] || []).map((h, i) => (
                       <li key={i} className="flex items-start gap-2">
                         <span className="mt-1 w-1.5 h-1.5 rounded-full bg-indigo-500" />
                         <span>{h}</span>
                       </li>
                     ))}
                   </ul>
                 </div>
                 <div className="p-4 rounded-2xl border border-gray-100 dark:border-white/10 bg-white/70 dark:bg-black/30">
                   <p className="text-[10px] font-black text-gray-400 uppercase tracking-[0.2em] mb-2">Consejo rÃ¡pido</p>
                   <p className="text-sm text-gray-700 dark:text-gray-200">
                     Ordena los rangos sin huecos ni solapes y usa el Ãºltimo escalÃ³n como tope.
                   </p>
                 </div>
               </div>

               <div className="overflow-hidden rounded-2xl border border-gray-100 dark:border-white/5">
                 <table className="w-full text-left">
                   <thead className="bg-gray-50/50 dark:bg-white/5">
                     <tr>
                       <th className="px-6 py-4 text-[10px] font-bold text-gray-400 uppercase tracking-widest">
                         {rangoLabel(currentEsquema.tipo)}
                       </th>
                       <th className="px-6 py-4 text-[10px] font-bold text-gray-400 uppercase tracking-widest text-center">Etiqueta/Nota</th>
                       <th className="px-6 py-4 text-[10px] font-bold text-gray-400 uppercase tracking-widest text-center">{pagoLabel(currentEsquema.tipo)}</th>
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
                        <td className="px-6 py-4 text-center text-xs text-gray-500">
                          {escalonFormData.valor_referencia || '—'}
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
                         <td className="px-6 py-4 text-center text-xs text-gray-500 dark:text-gray-300">
                           {esc.valor_referencia ? (
                             <span className="px-2 py-1 bg-indigo-500/10 text-indigo-500 rounded-lg text-[10px]">{esc.valor_referencia}</span>
                           ) : '—'}
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
      )}

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
                  <option value="ranking">Ranking</option>
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

      {deleteModalOpen && deleteTarget && (
        <div className="fixed inset-0 z-[110] flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={() => setDeleteModalOpen(false)} />
          <div className="relative w-full max-w-3xl bg-white dark:bg-gray-900 rounded-3xl p-6 shadow-2xl space-y-4">
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="text-[10px] font-black uppercase text-red-500 tracking-[0.3em]">Eliminar esquema</p>
                <h3 className="text-2xl font-bold text-gray-800 dark:text-white">{deleteTarget.nombre}</h3>
                <p className="text-sm text-gray-500 dark:text-gray-400">Selecciona a qué esquema se moverán las referencias antes de eliminar.</p>
              </div>
              <button onClick={() => setDeleteModalOpen(false)} className="p-2 text-gray-400 hover:text-white hover:bg-gray-800 rounded-full"><X size={16} /></button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="p-4 rounded-2xl border border-gray-100 dark:border-white/10 bg-gray-50/60 dark:bg-white/5">
                <p className="text-[10px] font-black text-gray-400 uppercase mb-2">Colaboradores afectados ({dependientesColabs.length})</p>
                {dependientesColabs.length === 0 ? (
                  <p className="text-sm text-gray-500">Ninguno.</p>
                ) : (
                  <ul className="text-sm text-gray-700 dark:text-gray-200 space-y-1 max-h-36 overflow-y-auto">
                    {dependientesColabs.map((c: any) => (
                      <li key={c.id} className="flex justify-between gap-2">
                        <span>{c.nombre || c.email || c.matricula}</span>
                      </li>
                    ))}
                  </ul>
                )}
              </div>
              <div className="p-4 rounded-2xl border border-gray-100 dark:border-white/10 bg-gray-50/60 dark:bg-white/5">
                <p className="text-[10px] font-black text-gray-400 uppercase mb-2">Metas/indicadores afectados ({dependientesMetas.length})</p>
                {dependientesMetas.length === 0 ? (
                  <p className="text-sm text-gray-500">Ninguno.</p>
                ) : (
                  <ul className="text-sm text-gray-700 dark:text-gray-200 space-y-1 max-h-36 overflow-y-auto">
                    {dependientesMetas.map((m: any) => (
                      <li key={m.id}>{m.nombre_indicador || `Meta ${m.id}`}</li>
                    ))}
                  </ul>
                )}
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-[10px] font-black text-gray-400 uppercase">Mover referencias a</label>
              <select
                className="w-full px-4 py-3 bg-gray-50 dark:bg-white/5 border border-gray-200 dark:border-white/10 rounded-2xl outline-none focus:ring-2 focus:ring-indigo-500"
                value={destinoEsquemaId === null ? 'null' : destinoEsquemaId === undefined ? '' : destinoEsquemaId}
                onChange={e => {
                  if (e.target.value === '') { setDestinoEsquemaId(undefined); return; }
                  if (e.target.value === 'null') { setDestinoEsquemaId(null); return; }
                  setDestinoEsquemaId(Number(e.target.value));
                }}
              >
                <option value="">Selecciona un esquema destino</option>
                <option value="null">Sin esquema (NULL)</option>
                {esquemasDestino.map(esq => (
                  <option key={esq.id} value={esq.id}>{esq.nombre} ({esq.tipo})</option>
                ))}
              </select>
            </div>

            <div className="flex justify-end gap-3 pt-2">
              <button onClick={() => setDeleteModalOpen(false)} className="px-4 py-3 rounded-xl bg-gray-100 dark:bg-white/5 text-gray-600 dark:text-white font-bold">Cancelar</button>
              <button
                disabled={saving || destinoEsquemaId === undefined}
                onClick={async () => {
                  if (!deleteTarget || destinoEsquemaId === undefined) return;
                  try {
                    setSaving(true);
                    const destinoValue = destinoEsquemaId === null ? null : destinoEsquemaId;
                    await supabase.from('metas_indicadores').update({ esquema_pago_id: destinoValue }).eq('esquema_pago_id', deleteTarget.id);
                    await supabase.from('colaboradores').update({ esquema_pago_id: destinoValue }).eq('esquema_pago_id', deleteTarget.id);
                    await supabase.from('escalones_bonos').delete().eq('esquema_id', deleteTarget.id);
                    const { error: delErr } = await supabase.from('esquemas_pago').delete().eq('id', deleteTarget.id);
                    if (delErr) {
                      setError('No se pudo eliminar el esquema (sigue en uso).');
                    } else {
                      setDeleteModalOpen(false);
                      setDeleteTarget(null);
                      setSelectedEsquemaId(null);
                      fetchEsquemas();
                    }
                  } catch (e: any) {
                    setError(e.message);
                  } finally {
                    setSaving(false);
                  }
                }}
                className="px-4 py-3 rounded-xl bg-red-600 text-white font-bold disabled:opacity-60"
              >
                Mover y eliminar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}


