import { X, Loader2, Save } from 'lucide-react';
import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';

const MESES = ['enero', 'febrero', 'marzo', 'abril', 'mayo', 'junio', 'julio', 'agosto', 'septiembre', 'octubre', 'noviembre', 'diciembre'] as const;
const MESES_CORTOS = ['ENE', 'FEB', 'MAR', 'ABR', 'MAY', 'JUN', 'JUL', 'AGO', 'SEP', 'OCT', 'NOV', 'DIC'];

interface OtrosIngresosModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  initialData?: any | null;
}

const parseMonto = (val: string | number): number => {
  if (typeof val === 'number') return val;
  const clean = String(val).replace(/,/g, '');
  const num = parseFloat(clean);
  return isNaN(num) ? 0 : num;
};

const inputClass = `
  w-full px-4 py-2.5 rounded-2xl text-sm outline-none transition-all
  bg-gray-50 dark:bg-[#1a1f2e]
  border border-gray-200 dark:border-white/10
  text-gray-800 dark:text-gray-200
  placeholder-gray-400 dark:placeholder-gray-600
  focus:ring-2 focus:ring-sky-500/40 focus:border-sky-500/40
`;

const labelClass = 'block text-[11px] font-bold text-gray-400 uppercase tracking-wider mb-1.5';

export default function OtrosIngresosModal({ isOpen, onClose, onSuccess, initialData }: OtrosIngresosModalProps) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [colaboradores, setColaboradores] = useState<{ id: string; nombre: string; apellido_paterno: string }[]>([]);

  const emptyForm = {
    colaborador_id: '',
    nombre_concepto: '',
    anio: new Date().getFullYear(),
    enero: '', febrero: '', marzo: '', abril: '',
    mayo: '', junio: '', julio: '', agosto: '',
    septiembre: '', octubre: '', noviembre: '', diciembre: '',
  };

  const [formData, setFormData] = useState(emptyForm);

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
        nombre_concepto: initialData.nombre_concepto || '',
        anio:           initialData.anio || new Date().getFullYear(),
        enero:          initialData.enero?.toString()      || '',
        febrero:        initialData.febrero?.toString()    || '',
        marzo:          initialData.marzo?.toString()      || '',
        abril:          initialData.abril?.toString()      || '',
        mayo:           initialData.mayo?.toString()       || '',
        junio:          initialData.junio?.toString()      || '',
        julio:          initialData.julio?.toString()      || '',
        agosto:         initialData.agosto?.toString()     || '',
        septiembre:     initialData.septiembre?.toString() || '',
        octubre:        initialData.octubre?.toString()    || '',
        noviembre:      initialData.noviembre?.toString()  || '',
        diciembre:      initialData.diciembre?.toString()  || '',
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
      const payload = {
        colaborador_id:  formData.colaborador_id,
        nombre_concepto: formData.nombre_concepto.trim(),
        anio:            Number(formData.anio),
        enero:           parseMonto(formData.enero),
        febrero:         parseMonto(formData.febrero),
        marzo:           parseMonto(formData.marzo),
        abril:           parseMonto(formData.abril),
        mayo:            parseMonto(formData.mayo),
        junio:           parseMonto(formData.junio),
        julio:           parseMonto(formData.julio),
        agosto:          parseMonto(formData.agosto),
        septiembre:      parseMonto(formData.septiembre),
        octubre:         parseMonto(formData.octubre),
        noviembre:       parseMonto(formData.noviembre),
        diciembre:       parseMonto(formData.diciembre),
      };

      // Upsert respetando la restricción unique_ingreso_concepto
      const { error: err } = await supabase
        .from('otros_ingresos')
        .upsert(payload, { onConflict: 'colaborador_id, nombre_concepto, anio' });

      if (err) throw err;

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
      <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={onClose} />

      <div className="relative w-full max-w-2xl bg-white dark:bg-[#0f1117] border border-gray-100 dark:border-white/10 rounded-[32px] shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-200 max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between px-7 pt-7 pb-5 border-b border-gray-100 dark:border-white/5">
          <div>
            <h2 className="text-xl font-bold text-gray-800 dark:text-white">
              {isEditing ? 'Editar Ingreso' : 'Nuevo Ingreso'}
            </h2>
            <p className="text-xs text-gray-400 mt-0.5">
              {isEditing ? 'Modifica los montos mensuales del concepto' : 'Registra un ingreso adicional por concepto'}
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

          {/* Concepto + Año */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className={labelClass}>Concepto del Ingreso</label>
              <input
                type="text"
                required
                value={formData.nombre_concepto}
                onChange={(e) => setFormData({ ...formData, nombre_concepto: e.target.value })}
                placeholder="Ej. Bono Mensual, Fondo de Ahorro"
                className={inputClass}
              />
            </div>
            <div>
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
          </div>

          {/* Montos mensuales */}
          <div>
            <label className={labelClass}>Montos Mensuales</label>
            <p className="text-[10px] text-gray-400 mb-3">
              Usa <strong className="text-gray-600 dark:text-gray-300">.</strong> como decimal y{' '}
              <strong className="text-gray-600 dark:text-gray-300">,</strong> como separador de miles.{' '}
              Ej: <code className="bg-gray-100 dark:bg-white/10 px-1 rounded">12,500.00</code>
            </p>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
              {MESES.map((mes, i) => (
                <div key={mes}>
                  <label className="text-[10px] font-bold text-gray-400 uppercase mb-1 block">{MESES_CORTOS[i]}</label>
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
              className="flex-1 flex items-center justify-center gap-2 py-3 rounded-2xl bg-sky-600 hover:bg-sky-500 text-white font-bold text-sm transition-all disabled:opacity-60 shadow-lg shadow-sky-500/20"
            >
              {loading ? <Loader2 size={18} className="animate-spin" /> : <Save size={18} />}
              {loading ? 'Guardando...' : isEditing ? 'Guardar Cambios' : 'Crear Ingreso'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
