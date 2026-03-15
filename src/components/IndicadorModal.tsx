import { X, Loader2, Save } from 'lucide-react';
import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';

const MESES = ['enero', 'febrero', 'marzo', 'abril', 'mayo', 'junio', 'julio', 'agosto', 'septiembre', 'octubre', 'noviembre', 'diciembre'] as const;
const MESES_CORTOS = ['ENE', 'FEB', 'MAR', 'ABR', 'MAY', 'JUN', 'JUL', 'AGO', 'SEP', 'OCT', 'NOV', 'DIC'];

interface IndicadorModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  initialData?: any | null;
}

// Convierte texto con formato "7,890.45" → número 7890.45
const parseMonto = (val: string | number): number => {
  if (typeof val === 'number') return val;
  const clean = String(val).replace(/,/g, ''); // elimina separadores de miles
  const num = parseFloat(clean);
  return isNaN(num) ? 0 : num;
};

const inputClass = `
  w-full px-4 py-2.5 rounded-2xl text-sm outline-none transition-all
  bg-gray-50 dark:bg-[#1a1f2e]
  border border-gray-200 dark:border-white/10
  text-gray-800 dark:text-gray-200
  placeholder-gray-400 dark:placeholder-gray-600
  focus:ring-2 focus:ring-blue-500/40 focus:border-blue-500/40
`;

const labelClass = 'block text-[11px] font-bold text-gray-400 uppercase tracking-wider mb-1.5';

export default function IndicadorModal({ isOpen, onClose, onSuccess, initialData }: IndicadorModalProps) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [colaboradores, setColaboradores] = useState<{ id: string; nombre: string; apellido_paterno: string }[]>([]);

  const emptyForm = {
    colaborador_id: '',
    nombre_indicador: '',
    tipo_indicador: '',
    anio: new Date().getFullYear(),
    enero: '', febrero: '', marzo: '', abril: '',
    mayo: '', junio: '', julio: '', agosto: '',
    septiembre: '', octubre: '', noviembre: '', diciembre: '',
    // Pasos de aprobación
    paso_captura: false,
    paso_validacion: false,
    paso_autorizacion: false,
    paso_direccion: false,
  };

  const [formData, setFormData] = useState(emptyForm);

  // Cargar catálogos y datos iniciales al abrir
  useEffect(() => {
    if (!isOpen) return;

    const fetchColaboradores = async () => {
      const { data } = await supabase
        .from('colaboradores')
        .select('id, nombre, apellido_paterno')
        .eq('esta_activo', true)
        .order('nombre');
      setColaboradores(data || []);
    };

    fetchColaboradores();

    if (initialData) {
      setFormData({
        colaborador_id: initialData.colaborador_id || '',
        nombre_indicador: initialData.nombre_indicador || '',
        tipo_indicador: initialData.tipo_indicador || '',
        anio: initialData.anio || new Date().getFullYear(),
        enero: initialData.enero?.toString() || '',
        febrero: initialData.febrero?.toString() || '',
        marzo: initialData.marzo?.toString() || '',
        abril: initialData.abril?.toString() || '',
        mayo: initialData.mayo?.toString() || '',
        junio: initialData.junio?.toString() || '',
        julio: initialData.julio?.toString() || '',
        agosto: initialData.agosto?.toString() || '',
        septiembre: initialData.septiembre?.toString() || '',
        octubre: initialData.octubre?.toString() || '',
        noviembre: initialData.noviembre?.toString() || '',
        diciembre: initialData.diciembre?.toString() || '',
        // Pasos desde initialData.pasos (join)
        paso_captura: initialData.pasos?.paso_captura ?? false,
        paso_validacion: initialData.pasos?.paso_validacion ?? false,
        paso_autorizacion: initialData.pasos?.paso_autorizacion ?? false,
        paso_direccion: initialData.pasos?.paso_direccion ?? false,
      });
    } else {
      setFormData(emptyForm);
    }

    setError(null);
  }, [isOpen, initialData]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      // ─── Solo campos de metas_indicadores (sin paso_*) ───────────────────
      const indicadorPayload = {
        colaborador_id: formData.colaborador_id,
        nombre_indicador: formData.nombre_indicador,
        tipo_indicador: formData.tipo_indicador,
        anio: Number(formData.anio),
        enero:      parseMonto(formData.enero),
        febrero:    parseMonto(formData.febrero),
        marzo:      parseMonto(formData.marzo),
        abril:      parseMonto(formData.abril),
        mayo:       parseMonto(formData.mayo),
        junio:      parseMonto(formData.junio),
        julio:      parseMonto(formData.julio),
        agosto:     parseMonto(formData.agosto),
        septiembre: parseMonto(formData.septiembre),
        octubre:    parseMonto(formData.octubre),
        noviembre:  parseMonto(formData.noviembre),
        diciembre:  parseMonto(formData.diciembre),
      };

      if (initialData?.id) {
        const { error: err } = await supabase
          .from('metas_indicadores')
          .update(indicadorPayload)
          .eq('id', initialData.id);
        if (err) throw err;
      } else {
        const { error: err } = await supabase
          .from('metas_indicadores')
          .insert([indicadorPayload]);
        if (err) throw err;
      }

      // ─── Tabla separada: pasos_aprobacion ────────────────────────────────
      // Filtra por colaborador_id + mes + anio; actualiza si existe, inserta si no.
      if (formData.colaborador_id) {
        const MESES_NAMES = ['enero','febrero','marzo','abril','mayo','junio','julio','agosto','septiembre','octubre','noviembre','diciembre'];
        const mesActual = MESES_NAMES[new Date().getMonth()];

        const { error: pasosErr } = await supabase
          .from('pasos_aprobacion')
          .upsert(
            {
              colaborador_id:    formData.colaborador_id,
              mes:               mesActual,
              anio:              Number(formData.anio),
              paso_captura:      formData.paso_captura,
              paso_validacion:   formData.paso_validacion,
              paso_autorizacion: formData.paso_autorizacion,
              paso_direccion:    formData.paso_direccion,
            },
            { onConflict: 'colaborador_id, mes, anio' }
          );
        if (pasosErr) throw new Error(`Error en aprobación: ${pasosErr.message}`);
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

  const isEditing = !!initialData?.id;

  return (
    <div className="fixed inset-0 z-[100] flex items-start justify-center p-4 pt-10 sm:pt-16">
      {/* Capa de fondo */}
      <div
        className="absolute inset-0 bg-black/40 backdrop-blur-sm"
        onClick={onClose}
      />

      {/* Modal */}
      <div className="relative w-full max-w-2xl bg-white dark:bg-[#0f1117] border border-gray-100 dark:border-white/10 rounded-[32px] shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-200 max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between px-7 pt-7 pb-5 border-b border-gray-100 dark:border-white/5">
          <div>
            <h2 className="text-xl font-bold text-gray-800 dark:text-white">
              {isEditing ? 'Editar Indicador' : 'Nuevo Indicador'}
            </h2>
            <p className="text-xs text-gray-400 mt-0.5">
              {isEditing ? 'Modifica las metas del indicador' : 'Define las metas mensuales del indicador'}
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-2.5 rounded-2xl text-gray-400 hover:text-gray-700 dark:hover:text-gray-200 hover:bg-gray-100 dark:hover:bg-white/10 transition-all"
          >
            <X size={20} />
          </button>
        </div>

        {/* Formulario */}
        <form onSubmit={handleSubmit} className="px-7 py-6 space-y-5">
          {/* Colaborador */}
          <div>
            <label className={labelClass}>Colaborador</label>
            <select
              required
              value={formData.colaborador_id}
              onChange={(e) => setFormData({ ...formData, colaborador_id: e.target.value })}
              className={inputClass}
            >
              <option value="" className="bg-white dark:bg-[#1a1f2e]">Seleccionar colaborador</option>
              {colaboradores.map(c => (
                <option key={c.id} value={c.id} className="bg-white dark:bg-[#1a1f2e]">
                  {c.nombre} {c.apellido_paterno}
                </option>
              ))}
            </select>
          </div>

          {/* Nombre del indicador y tipo */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className={labelClass}>Nombre del Indicador</label>
              <input
                type="text"
                required
                value={formData.nombre_indicador}
                onChange={(e) => setFormData({ ...formData, nombre_indicador: e.target.value })}
                placeholder="Ej. Ventas Totales"
                className={inputClass}
              />
            </div>
            <div>
              <label className={labelClass}>Tipo de Indicador</label>
              <input
                type="text"
                value={formData.tipo_indicador}
                onChange={(e) => setFormData({ ...formData, tipo_indicador: e.target.value })}
                placeholder="Ej. Comisión, KPI, Bono"
                className={inputClass}
              />
            </div>
          </div>

          {/* Año */}
          <div className="w-1/3">
            <label className={labelClass}>Año</label>
            <input
              type="number"
              required
              min={2020}
              max={2030}
              value={formData.anio}
              onChange={(e) => setFormData({ ...formData, anio: Number(e.target.value) })}
              className={inputClass}
            />
          </div>

          {/* Metas mensuales */}
          <div>
            <label className={labelClass}>Metas Mensuales</label>
            <p className="text-[10px] text-gray-400 mb-3">
              Usa <strong className="text-gray-600 dark:text-gray-300">.</strong> como decimal y <strong className="text-gray-600 dark:text-gray-300">,</strong> como separador de miles.&nbsp;
              Ejemplos: <code className="bg-gray-100 dark:bg-white/10 px-1 rounded">78.85</code> · <code className="bg-gray-100 dark:bg-white/10 px-1 rounded">7,890.45</code>
            </p>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
              {MESES.map((mes, i) => (
                <div key={mes}>
                  <label className="text-[10px] font-bold text-gray-400 uppercase mb-1 block">
                    {MESES_CORTOS[i]}
                  </label>
                  <input
                    type="text"
                    inputMode="decimal"
                    value={formData[mes]}
                    onChange={(e) => setFormData({ ...formData, [mes]: e.target.value })}
                    placeholder="0.00"
                    className={inputClass}
                  />
                </div>
              ))}
            </div>
          </div>

          {/* Pasos de aprobación */}
          <div>
            <label className={labelClass}>Estado de Aprobación</label>
            <div className="grid grid-cols-2 gap-3">
              {[
                { key: 'paso_captura',      label: 'Captura',    desc: 'El dato fue registrado' },
                { key: 'paso_validacion',   label: 'Revisión',   desc: 'El dato fue revisado' },
                { key: 'paso_autorizacion', label: 'Validación', desc: 'El dato fue validado' },
                { key: 'paso_direccion',    label: 'Aprobación', desc: 'Dirección aprobó' },
              ].map(({ key, label, desc }) => {
                const active = formData[key as keyof typeof formData] as boolean;
                return (
                  <button
                    key={key}
                    type="button"
                    onClick={() => setFormData({ ...formData, [key]: !active })}
                    className={`flex items-center justify-between px-4 py-3 rounded-2xl border-2 font-bold text-sm transition-all duration-200 ${
                      active
                        ? 'bg-green-500/10 border-green-500/30 text-green-700 dark:text-green-400 hover:bg-green-500/20'
                        : 'bg-gray-50 dark:bg-white/5 border-gray-200 dark:border-white/10 text-gray-400 hover:bg-gray-100 dark:hover:bg-white/10'
                    }`}
                  >
                    <span className="flex items-center gap-2">
                      <span className={`w-2 h-2 rounded-full flex-shrink-0 ${
                        active ? 'bg-green-500 shadow-[0_0_6px_rgba(34,197,94,0.6)]' : 'bg-gray-300 dark:bg-gray-600'
                      }`} />
                      <span className="flex flex-col items-start">
                        <span className="text-[11px] font-bold leading-tight">{label}</span>
                        <span className="text-[9px] font-normal opacity-60 leading-tight">{desc}</span>
                      </span>
                    </span>
                    <span className={`text-[9px] uppercase font-bold px-1.5 py-0.5 rounded-lg ${
                      active ? 'bg-green-500/20 text-green-600 dark:text-green-400' : 'bg-gray-200 dark:bg-white/10 text-gray-400'
                    }`}>
                      {active ? 'SÍ' : 'NO'}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Error */}
          {error && (
            <div className="p-4 bg-red-500/10 border border-red-500/20 rounded-2xl text-red-600 dark:text-red-400 text-sm">
              {error}
            </div>
          )}

          {/* Botones */}
          <div className="flex gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 py-3 rounded-2xl border border-gray-200 dark:border-white/10 text-gray-600 dark:text-gray-400 font-bold text-sm hover:bg-gray-50 dark:hover:bg-white/5 transition-all"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={loading}
              className="flex-1 flex items-center justify-center gap-2 py-3 rounded-2xl bg-blue-600 hover:bg-blue-500 text-white font-bold text-sm transition-all disabled:opacity-60 shadow-lg shadow-blue-500/20"
            >
              {loading ? <Loader2 size={18} className="animate-spin" /> : <Save size={18} />}
              {loading ? 'Guardando...' : isEditing ? 'Guardar Cambios' : 'Crear Indicador'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
