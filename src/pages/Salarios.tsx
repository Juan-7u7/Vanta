/** final 1.0 */
import { useState, useEffect } from 'react';
import { Edit2, Search, Filter, Plus, Loader2, ChevronDown } from 'lucide-react';
import { supabase } from '../lib/supabase';
import SalarioModal from '../components/SalarioModal';

const MESES = ['enero', 'febrero', 'marzo', 'abril', 'mayo', 'junio', 'julio', 'agosto', 'septiembre', 'octubre', 'noviembre', 'diciembre'] as const;
const MESES_CORTOS = ['ENE', 'FEB', 'MAR', 'ABR', 'MAY', 'JUN', 'JUL', 'AGO', 'SEP', 'OCT', 'NOV', 'DIC'];

interface Salario {
  id: number;
  colaborador_id: string;
  anio: number;
  enero: number; febrero: number; marzo: number; abril: number;
  mayo: number; junio: number; julio: number; agosto: number;
  septiembre: number; octubre: number; noviembre: number; diciembre: number;
  colaborador: {
    nombre: string;
    apellido_paterno: string;
    email: string;
    unidades_negocio: { nombre: string; color_hex?: string; logo_url?: string } | null;
  } | null;
  pasos: {
    paso_captura: boolean;
    paso_validacion: boolean;
    paso_autorizacion: boolean;
    paso_direccion: boolean;
  } | null;
}

const fmt = (val: number) =>
  val?.toLocaleString('es-MX', { minimumFractionDigits: 2, maximumFractionDigits: 2 }) ?? '—';

const calcTotal = (s: Salario) =>
  MESES.reduce((sum, mes) => sum + (s[mes] || 0), 0);

// Badge de paso de aprobación
const PasoBadge = ({ active, label }: { active: boolean; label: string }) => (
  <div className="flex flex-col items-center gap-1">
    <div className={`w-7 h-7 rounded-xl flex items-center justify-center border transition-all ${active
      ? 'bg-green-500/20 border-green-500/40 shadow-sm shadow-green-500/10'
      : 'bg-gray-100/60 dark:bg-white/5 border-gray-200 dark:border-white/10'}`}>
      {active && <div className="w-3 h-3 rounded-md bg-green-500" />}
    </div>
    <span className="text-[9px] font-bold text-gray-400 uppercase tracking-wide">{label}</span>
  </div>
);

function SalarioCard({ sal, onEdit }: { sal: Salario; onEdit: () => void }) {
  const [expanded, setExpanded] = useState(false);
  const total = calcTotal(sal);
  const mesActual = new Date().getMonth();
  const valorMesActual = sal[MESES[mesActual]] || 0;

  return (
    <div className="border-b border-gray-100 dark:border-white/5 last:border-0 transition-all">
      {/* Fila principal */}
      <div
        className="px-5 py-4 flex items-center cursor-pointer hover:bg-white/40 dark:hover:bg-white/5 transition-colors"
        onClick={() => setExpanded(!expanded)}
      >
        {/* Avatar / Logo */}
        <div className="w-10 h-10 shrink-0 rounded-xl bg-white dark:bg-black/20 flex items-center justify-center border border-gray-100 dark:border-white/10 shadow-inner overflow-hidden mr-3">
          {sal.colaborador?.unidades_negocio?.logo_url ? (
            <img 
              src={sal.colaborador.unidades_negocio.logo_url} 
              alt={sal.colaborador.unidades_negocio.nombre} 
              className="w-full h-full object-contain p-1.5"
            />
          ) : (
            <div 
              className="w-full h-full flex items-center justify-center font-bold text-[10px]"
              style={{ 
                backgroundColor: `${sal.colaborador?.unidades_negocio?.color_hex || '#10b981'}15`, 
                color: sal.colaborador?.unidades_negocio?.color_hex || '#10b981' 
              }}
            >
              {sal.colaborador?.nombre?.[0]}{sal.colaborador?.apellido_paterno?.[0]}
            </div>
          )}
        </div>

        {/* Info principal */}
        <div className="flex-1 min-w-0 pr-4">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="text-sm font-bold text-gray-800 dark:text-white truncate">
              {sal.colaborador?.nombre} {sal.colaborador?.apellido_paterno}
            </span>
          </div>
          <div className="flex items-center gap-2 mt-0.5">
            <span className="text-[10px] font-bold text-emerald-600 dark:text-emerald-400 uppercase">
              {sal.colaborador?.unidades_negocio?.nombre || 'N/A'}
            </span>
            <span className="text-[10px] text-gray-400">·</span>
            <span className="text-[10px] text-gray-400">{sal.anio}</span>
          </div>
        </div>

        {/* Total — sm+ */}
        <div className="hidden sm:flex w-32 flex-col items-end gap-0.5 shrink-0">
          <span className="text-[12px] font-mono font-bold text-gray-700 dark:text-gray-300">
            {total > 0 ? fmt(total) : '—'}
          </span>
          <span className="text-[9px] text-gray-400 uppercase">Total anual</span>
        </div>

        {/* Mes actual — md+ */}
        <div className="hidden md:flex w-32 flex-col items-center shrink-0">
          <span className="text-[12px] font-mono font-bold text-gray-700 dark:text-gray-300">
            {valorMesActual > 0 ? fmt(valorMesActual) : '—'}
          </span>
          <span className="text-[9px] text-gray-400 uppercase">{MESES_CORTOS[mesActual]}</span>
        </div>

        {/* Pasos — lg+ */}
        <div className="hidden lg:flex w-40 items-center justify-center gap-1.5 shrink-0">
          {[
            { label: 'CAP', val: sal.pasos?.paso_captura },
            { label: 'REV', val: sal.pasos?.paso_validacion },
            { label: 'VAL', val: sal.pasos?.paso_autorizacion },
            { label: 'APR', val: sal.pasos?.paso_direccion },
          ].map(({ label, val }) => (
            <div key={label} className={`w-8 h-7 rounded-lg flex items-center justify-center border text-[8px] font-bold ${val
              ? 'bg-green-500/20 border-green-500/40 text-green-600 dark:text-green-400'
              : 'bg-gray-100/50 dark:bg-white/5 border-gray-200 dark:border-white/10 text-gray-400'}`}>
              {label}
            </div>
          ))}
        </div>

        {/* Acciones */}
        <div className="w-16 flex items-center justify-end gap-1 shrink-0">
          <button
            onClick={(e) => { e.stopPropagation(); onEdit(); }}
            className="p-2 rounded-xl text-gray-400 hover:text-emerald-600 hover:bg-emerald-500/10 transition-all"
          >
            <Edit2 size={15} />
          </button>
          <div className={`p-1.5 rounded-xl text-gray-400 transition-all duration-200 ${expanded ? 'rotate-180' : ''}`}>
            <ChevronDown size={16} />
          </div>
        </div>
      </div>

      {/* Panel expandido */}
      {expanded && (
        <div className="px-5 pb-5 space-y-4 animate-in slide-in-from-top-2 duration-200">
          {/* Meses */}
          <div>
            <p className="text-[10px] font-bold text-gray-400 uppercase mb-2">Salario por Mes</p>
            <div className="grid grid-cols-6 sm:grid-cols-12 gap-2">
              {MESES.map((mes, i) => {
                const val = sal[mes] || 0;
                const isCurrent = i === mesActual;
                return (
                  <div key={mes} className={`flex flex-col items-center p-2 rounded-xl border transition-all ${isCurrent
                    ? 'bg-emerald-50 dark:bg-emerald-500/10 border-emerald-200 dark:border-emerald-500/20'
                    : 'bg-gray-50 dark:bg-white/5 border-gray-100 dark:border-white/5'}`}>
                    <span className={`text-[9px] font-bold uppercase ${isCurrent ? 'text-emerald-600 dark:text-emerald-400' : 'text-gray-400'}`}>
                      {MESES_CORTOS[i]}
                    </span>
                    <span className={`text-[11px] font-mono font-bold mt-0.5 ${val > 0
                      ? (isCurrent ? 'text-emerald-700 dark:text-emerald-300' : 'text-gray-700 dark:text-gray-300')
                      : 'text-gray-300 dark:text-gray-600'}`}>
                      {val > 0 ? val.toLocaleString('es-MX', { maximumFractionDigits: 0 }) : '—'}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Pasos de aprobación */}
          <div>
            <p className="text-[10px] font-bold text-gray-400 uppercase mb-2">Estado de Aprobación</p>
            <div className="flex items-center gap-4">
              <PasoBadge active={sal.pasos?.paso_captura ?? false} label="Captura" />
              <div className="h-px flex-1 bg-gray-100 dark:bg-white/5" />
              <PasoBadge active={sal.pasos?.paso_validacion ?? false} label="Revisión" />
              <div className="h-px flex-1 bg-gray-100 dark:bg-white/5" />
              <PasoBadge active={sal.pasos?.paso_autorizacion ?? false} label="Validación" />
              <div className="h-px flex-1 bg-gray-100 dark:bg-white/5" />
              <PasoBadge active={sal.pasos?.paso_direccion ?? false} label="Aprobación" />
            </div>
          </div>

          {/* Resumen en móvil */}
          <div className="flex sm:hidden justify-between text-xs border-t border-gray-100 dark:border-white/5 pt-3">
            <div>
              <p className="text-[10px] text-gray-400 uppercase font-bold">Total anual</p>
              <p className="font-mono font-bold text-gray-700 dark:text-gray-300">{total > 0 ? fmt(total) : '—'}</p>
            </div>
            <div className="text-right">
              <p className="text-[10px] text-gray-400 uppercase font-bold">Mes actual</p>
              <p className="font-mono font-bold text-gray-700 dark:text-gray-300">
                {valorMesActual > 0 ? fmt(valorMesActual) : '—'}
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default function Salarios() {
  const [salarios, setSalarios] = useState<Salario[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [showFilters, setShowFilters] = useState(false);
  const [filters, setFilters] = useState({ unidad: '', anio: '2026' });
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedSalario, setSelectedSalario] = useState<Salario | null>(null);

  useEffect(() => {
    fetchSalarios();
  }, []);

  const fetchSalarios = async () => {
    try {
      setLoading(true);
      const { data, error: err } = await supabase
        .from('salarios_mensuales')
        .select(`
          *,
          colaborador:colaborador_id(
            nombre, apellido_paterno, email,
            unidades_negocio:unidad_negocio_id(nombre, color_hex, logo_url)
          )
        `);

      if (err) throw err;

      const mesActual = MESES[new Date().getMonth()];
      const ids = (data || []).map(d => d.colaborador_id).filter(Boolean);

      const { data: pasosData } = await supabase
        .from('pasos_aprobacion')
        .select('colaborador_id, paso_captura, paso_validacion, paso_autorizacion, paso_direccion')
        .in('colaborador_id', ids)
        .eq('mes', mesActual)
        .eq('anio', 2026);

      const pasosMap = Object.fromEntries((pasosData || []).map(p => [p.colaborador_id, p]));
      const enriched = (data || []).map(d => ({ ...d, pasos: pasosMap[d.colaborador_id] || null }));

      setSalarios(enriched);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const filteredData = salarios.filter(sal => {
    const nombre = `${sal.colaborador?.nombre || ''} ${sal.colaborador?.apellido_paterno || ''}`;
    const matchesSearch =
      !searchTerm ||
      nombre.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesUnidad = !filters.unidad || sal.colaborador?.unidades_negocio?.nombre === filters.unidad;
    const matchesAnio = !filters.anio || sal.anio?.toString() === filters.anio;

    return matchesSearch && matchesUnidad && matchesAnio;
  });

  const unidades = Array.from(new Set(salarios.map(s => s.colaborador?.unidades_negocio?.nombre).filter(Boolean)));
  const hasFilters = !!(filters.unidad || filters.anio !== '2026');

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      {/* Encabezado */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-gray-800 dark:text-white">Salarios</h1>
          <p className="text-gray-500 dark:text-gray-400 mt-1">Registro de salarios por colaborador y mes</p>
        </div>
        <button
          onClick={() => { setSelectedSalario(null); setIsModalOpen(true); }}
          className="flex items-center justify-center gap-2 px-6 py-3 bg-emerald-600 hover:bg-emerald-500 text-white font-bold rounded-2xl shadow-lg shadow-emerald-500/20 transition-all transform hover:scale-[1.02] active:scale-[0.98]"
        >
          <Plus size={20} />
          Nuevo Salario
        </button>
      </div>

      {/* Barra de herramientas */}
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
          <input
            type="text"
            placeholder="Buscar por colaborador..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-12 pr-4 py-3.5 bg-white/50 dark:bg-black/20 border border-gray-200 dark:border-white/10 rounded-2xl focus:ring-2 focus:ring-emerald-500/50 outline-none transition-all dark:text-white"
          />
        </div>
        <div className="relative">
          <button
            onClick={() => setShowFilters(!showFilters)}
            className={`flex items-center justify-center gap-2 px-5 py-3 border rounded-2xl transition-all ${showFilters
              ? 'bg-emerald-600 border-emerald-600 text-white shadow-lg shadow-emerald-500/20'
              : 'bg-white dark:bg-black/20 border-gray-200 dark:border-white/10 text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-white/5'}`}
          >
            <Filter size={20} />
            Filtros
            {hasFilters && <span className="w-2 h-2 rounded-full bg-red-500 animate-pulse ml-1" />}
          </button>

          {showFilters && (
            <div className="absolute right-0 mt-3 w-68 bg-white dark:bg-gray-900 border border-gray-100 dark:border-white/10 rounded-[24px] shadow-2xl p-5 z-50 animate-in fade-in zoom-in-95 duration-200" style={{ width: '280px' }}>
              <div className="space-y-4">
                <div className="flex items-center justify-between border-b border-gray-100 dark:border-white/5 pb-2">
                  <span className="text-sm font-bold text-gray-800 dark:text-white">Filtros</span>
                  <button
                    onClick={() => setFilters({ unidad: '', anio: '2026' })}
                    className="text-[11px] font-bold text-emerald-600 hover:text-emerald-500 uppercase tracking-wider"
                  >
                    Limpiar
                  </button>
                </div>

                {/* Año */}
                <div className="space-y-1.5">
                  <label className="text-[10px] font-bold text-gray-400 uppercase ml-1">Año</label>
                  <div className="grid grid-cols-3 gap-2">
                    {['2024', '2025', '2026'].map(y => (
                      <button
                        key={y}
                        onClick={() => setFilters({ ...filters, anio: y })}
                        className={`py-1.5 px-2 rounded-xl text-[10px] font-bold transition-all border ${filters.anio === y
                          ? 'bg-emerald-600 border-emerald-600 text-white'
                          : 'bg-gray-50 dark:bg-white/5 border-gray-100 dark:border-white/5 text-gray-500'}`}
                      >
                        {y}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Unidad de Negocio */}
                <div className="space-y-1.5">
                  <label className="text-[10px] font-bold text-gray-400 uppercase ml-1">Unidad de Negocio</label>
                  <select
                    value={filters.unidad}
                    onChange={(e) => setFilters({ ...filters, unidad: e.target.value })}
                    className="w-full px-3 py-2.5 bg-gray-50 dark:bg-[#1a1f2e] border border-gray-100 dark:border-white/5 rounded-2xl text-xs dark:text-white outline-none focus:ring-2 focus:ring-emerald-500/50 cursor-pointer appearance-none"
                  >
                    <option value="" className="bg-white dark:bg-[#1a1f2e]">Todas las unidades</option>
                    {unidades.map(u => <option key={u} value={u} className="bg-white dark:bg-[#1a1f2e]">{u}</option>)}
                  </select>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {error && (
        <div className="p-4 bg-red-500/10 border border-red-500/20 rounded-2xl text-red-600 dark:text-red-400 text-sm font-medium">
          Error al cargar datos: {error}
        </div>
      )}

      {/* Lista de salarios */}
      <div className="bg-white/40 dark:bg-black/20 backdrop-blur-xl border border-white/40 dark:border-white/10 rounded-[32px] shadow-xl overflow-hidden relative min-h-[400px]">
        {loading ? (
          <div className="absolute inset-0 flex flex-col items-center justify-center gap-3">
            <Loader2 className="w-8 h-8 text-emerald-500 animate-spin" />
            <p className="text-sm text-gray-500">Cargando salarios...</p>
          </div>
        ) : filteredData.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20">
            <p className="text-gray-400 dark:text-gray-500 text-sm">No se encontraron registros</p>
          </div>
        ) : (
          <>
            {/* Encabezado de columnas */}
            <div className="px-5 py-3 border-b border-gray-100 dark:border-white/5 flex items-center">
              <div className="w-10 shrink-0 mr-3" />
              <div className="flex-1 pr-4">
                <span className="text-[11px] font-bold text-gray-400 uppercase tracking-wider">Colaborador / Descripción</span>
              </div>
              <div className="hidden sm:flex w-32 justify-end shrink-0">
                <span className="text-[11px] font-bold text-gray-400 uppercase tracking-wider">Total</span>
              </div>
              <div className="hidden md:flex w-32 justify-center shrink-0">
                <span className="text-[11px] font-bold text-gray-400 uppercase tracking-wider">Mes actual</span>
              </div>
              <div className="hidden lg:flex w-40 justify-center shrink-0">
                <span className="text-[11px] font-bold text-gray-400 uppercase tracking-wider">Aprobación</span>
              </div>
              <div className="w-16 shrink-0" />
            </div>

            {filteredData.map((sal) => (
              <SalarioCard
                key={sal.id}
                sal={sal}
                onEdit={() => { setSelectedSalario(sal); setIsModalOpen(true); }}
              />
            ))}
          </>
        )}
      </div>

      <SalarioModal
        isOpen={isModalOpen}
        onClose={() => { setIsModalOpen(false); setSelectedSalario(null); }}
        onSuccess={fetchSalarios}
        initialData={selectedSalario}
      />
    </div>
  );
}
