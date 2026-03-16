/** final 1.0 */
import { useState, useEffect } from 'react';
import { Edit2, Search, Filter, Plus, Loader2, ChevronDown } from 'lucide-react';
import { supabase } from '../lib/supabase';
import AlcanceModal from '../components/AlcanceModal';

const MESES = ['enero', 'febrero', 'marzo', 'abril', 'mayo', 'junio', 'julio', 'agosto', 'septiembre', 'octubre', 'noviembre', 'diciembre'] as const;
const MESES_CORTOS = ['ENE', 'FEB', 'MAR', 'ABR', 'MAY', 'JUN', 'JUL', 'AGO', 'SEP', 'OCT', 'NOV', 'DIC'];

// Columnas reales de alcance_real
interface Alcance {
  id: number;
  colaborador_id: string;
  anio: number;
  enero: number; febrero: number; marzo: number; abril: number;
  mayo: number; junio: number; julio: number; agosto: number;
  septiembre: number; octubre: number; noviembre: number; diciembre: number;
  // Join con colaboradores
  colaborador: {
    nombre: string;
    apellido_paterno: string;
    email: string;
    unidades_negocio: { nombre: string; color_hex?: string } | null;
  } | null | any;
  // Join secundario con metas_indicadores (por colaborador_id + anio)
  nombre_indicador?: string;
  tipo_indicador?: string;
  // Pasos de pasos_aprobacion
  pasos: {
    paso_captura: boolean;
    paso_validacion: boolean;
    paso_autorizacion: boolean;
    paso_direccion: boolean;
  } | null;
}

const fmt = (val: number) =>
  (val ?? 0).toLocaleString('es-MX', { minimumFractionDigits: 2, maximumFractionDigits: 2 });

const calcTotal = (a: Alcance) =>
  MESES.reduce((sum, mes) => sum + (a[mes] || 0), 0);

const PasoBadge = ({ active, label }: { active: boolean; label: string }) => (
  <div className="flex flex-col items-center gap-1">
    <div className={`w-7 h-7 rounded-xl flex items-center justify-center border transition-all ${active
      ? 'bg-green-500/20 border-green-500/40 shadow-sm'
      : 'bg-gray-100/60 dark:bg-white/5 border-gray-200 dark:border-white/10'}`}>
      {active && <div className="w-3 h-3 rounded-md bg-green-500" />}
    </div>
    <span className="text-[9px] font-bold text-gray-400 uppercase tracking-wide">{label}</span>
  </div>
);

function AlcanceCard({ item, onEdit }: { item: Alcance; onEdit: () => void }) {
  const [expanded, setExpanded] = useState(false);
  const total = calcTotal(item);
  const mesActual = new Date().getMonth();
  const valorMesActual = item[MESES[mesActual]] || 0;

  return (
    <div className="border-b border-gray-100 dark:border-white/5 last:border-0 transition-all">
      {/* Fila principal */}
      <div
        className="px-5 py-4 flex items-center cursor-pointer hover:bg-white/40 dark:hover:bg-white/5 transition-colors"
        onClick={() => setExpanded(!expanded)}
      >
        {/* Avatar */}
        <div className="w-10 h-10 shrink-0 rounded-xl bg-gradient-to-tr from-violet-500/20 to-purple-500/20 flex items-center justify-center border border-violet-500/10 mr-3">
          <span className="text-[10px] font-bold text-violet-600 dark:text-violet-400">
            {item.colaborador?.nombre?.[0]}{item.colaborador?.apellido_paterno?.[0]}
          </span>
        </div>

        {/* Info principal */}
        <div className="flex-1 min-w-0 pr-4">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="text-sm font-bold text-gray-800 dark:text-white truncate">
              {item.colaborador?.nombre} {item.colaborador?.apellido_paterno}
            </span>
            {item.nombre_indicador && (
              <span className="hidden sm:inline text-[10px] px-2 py-0.5 rounded-full bg-violet-500/10 text-violet-600 dark:text-violet-400 font-bold shrink-0 max-w-[200px] truncate">
                {item.nombre_indicador}
              </span>
            )}
          </div>
          <div className="flex items-center gap-2 mt-0.5">
            <span className="text-[10px] font-bold text-violet-600 dark:text-violet-400 uppercase">
              {item.colaborador?.unidades_negocio?.nombre || 'N/A'}
            </span>
            {item.tipo_indicador && (
              <>
                <span className="text-[10px] text-gray-400">·</span>
                <span className="text-[10px] text-gray-500 dark:text-gray-400 truncate">{item.tipo_indicador}</span>
              </>
            )}
            <span className="text-[10px] text-gray-400">·</span>
            <span className="text-[10px] text-gray-400">{item.anio}</span>
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
            { label: 'CAP', val: item.pasos?.paso_captura },
            { label: 'REV', val: item.pasos?.paso_validacion },
            { label: 'VAL', val: item.pasos?.paso_autorizacion },
            { label: 'APR', val: item.pasos?.paso_direccion },
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
            className="p-2 rounded-xl text-gray-400 hover:text-violet-600 hover:bg-violet-500/10 transition-all"
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
          {/* Indicador completo (móvil) */}
          {item.nombre_indicador && (
            <div className="sm:hidden p-3 rounded-2xl bg-violet-50 dark:bg-violet-500/10 border border-violet-200 dark:border-violet-500/20">
              <p className="text-[10px] font-bold text-violet-500 uppercase mb-0.5">Indicador</p>
              <p className="text-sm font-bold text-violet-700 dark:text-violet-300">{item.nombre_indicador}</p>
              {item.tipo_indicador && (
                <p className="text-[11px] text-violet-500/70 mt-0.5">{item.tipo_indicador}</p>
              )}
            </div>
          )}

          {/* Alcance por mes */}
          <div>
            <p className="text-[10px] font-bold text-gray-400 uppercase mb-2">Alcance por Mes</p>
            <div className="grid grid-cols-6 sm:grid-cols-12 gap-2">
              {MESES.map((mes, i) => {
                const val = item[mes] || 0;
                const isCurrent = i === mesActual;
                return (
                  <div key={mes} className={`flex flex-col items-center p-2 rounded-xl border transition-all ${isCurrent
                    ? 'bg-violet-50 dark:bg-violet-500/10 border-violet-200 dark:border-violet-500/20'
                    : 'bg-gray-50 dark:bg-white/5 border-gray-100 dark:border-white/5'}`}>
                    <span className={`text-[9px] font-bold uppercase ${isCurrent ? 'text-violet-600 dark:text-violet-400' : 'text-gray-400'}`}>
                      {MESES_CORTOS[i]}
                    </span>
                    <span className={`text-[11px] font-mono font-bold mt-0.5 ${val > 0
                      ? (isCurrent ? 'text-violet-700 dark:text-violet-300' : 'text-gray-700 dark:text-gray-300')
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
              <PasoBadge active={item.pasos?.paso_captura ?? false} label="Captura" />
              <div className="h-px flex-1 bg-gray-100 dark:bg-white/5" />
              <PasoBadge active={item.pasos?.paso_validacion ?? false} label="Revisión" />
              <div className="h-px flex-1 bg-gray-100 dark:bg-white/5" />
              <PasoBadge active={item.pasos?.paso_autorizacion ?? false} label="Validación" />
              <div className="h-px flex-1 bg-gray-100 dark:bg-white/5" />
              <PasoBadge active={item.pasos?.paso_direccion ?? false} label="Aprobación" />
            </div>
          </div>

          {/* Resumen en móvil */}
          <div className="flex sm:hidden justify-between border-t border-gray-100 dark:border-white/5 pt-3">
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

export default function Alcance() {
  const [items, setItems] = useState<Alcance[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [showFilters, setShowFilters] = useState(false);
  const [filters, setFilters] = useState({ unidad: '', anio: '2026' });
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedItem, setSelectedItem] = useState<Alcance | null>(null);

  useEffect(() => { fetchAlcance(); }, []);

  const fetchAlcance = async () => {
    try {
      setLoading(true);

      // 1. Query principal: alcance_real + join colaboradores
      const { data: alcanceData, error: err } = await supabase
        .from('alcance_real')
        .select(`
          id, colaborador_id, anio,
          enero, febrero, marzo, abril, mayo, junio,
          julio, agosto, septiembre, octubre, noviembre, diciembre,
          colaborador:colaborador_id(
            nombre, apellido_paterno, email,
            unidades_negocio:unidad_negocio_id(nombre, color_hex)
          )
        `);

      if (err) throw err;
      if (!alcanceData || alcanceData.length === 0) {
        setItems([]);
        return;
      }

      const ids = alcanceData.map(d => d.colaborador_id).filter(Boolean);

      // 2. Query secundaria: metas_indicadores para obtener nombre/tipo por colaborador
      //    Vinculamos por colaborador_id + anio
      const { data: metasData } = await supabase
        .from('metas_indicadores')
        .select('colaborador_id, anio, nombre_indicador, tipo_indicador')
        .in('colaborador_id', ids);

      // Mapa: "colaborador_id-anio" → indicador
      const metasMap: Record<string, { nombre_indicador: string; tipo_indicador: string }> = {};
      (metasData || []).forEach(m => {
        const key = `${m.colaborador_id}-${m.anio}`;
        // Si hay varios indicadores por colaborador, tomamos el primero
        if (!metasMap[key]) {
          metasMap[key] = { nombre_indicador: m.nombre_indicador, tipo_indicador: m.tipo_indicador };
        }
      });

      // 3. Query de pasos de aprobación
      const mesActual = MESES[new Date().getMonth()];
      const { data: pasosData } = await supabase
        .from('pasos_aprobacion')
        .select('colaborador_id, paso_captura, paso_validacion, paso_autorizacion, paso_direccion')
        .in('colaborador_id', ids)
        .eq('mes', mesActual)
        .eq('anio', 2026);

      const pasosMap = Object.fromEntries((pasosData || []).map(p => [p.colaborador_id, p]));

      // 4. Merge de los tres conjuntos
      const enriched: Alcance[] = alcanceData.map(d => {
        const metaKey = `${d.colaborador_id}-${d.anio}`;
        const meta = metasMap[metaKey];
        return {
          ...d,
          nombre_indicador: meta?.nombre_indicador,
          tipo_indicador: meta?.tipo_indicador,
          pasos: pasosMap[d.colaborador_id] || null,
        };
      });

      setItems(enriched);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const filteredData = items.filter(item => {
    const nombre = `${item.colaborador?.nombre || ''} ${item.colaborador?.apellido_paterno || ''}`;
    const matchesSearch = !searchTerm || nombre.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesUnidad = !filters.unidad || item.colaborador?.unidades_negocio?.nombre === filters.unidad;
    const matchesAnio = !filters.anio || item.anio?.toString() === filters.anio;
    return matchesSearch && matchesUnidad && matchesAnio;
  });

  const unidades = Array.from(new Set(items.map(i => i.colaborador?.unidades_negocio?.nombre).filter(Boolean)));
  const hasFilters = !!(filters.unidad || filters.anio !== '2026');

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      {/* Encabezado */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-gray-800 dark:text-white">Alcance</h1>
          <p className="text-gray-500 dark:text-gray-400 mt-1">Alcance real vs. metas de indicadores</p>
        </div>
        <button
          onClick={() => { setSelectedItem(null); setIsModalOpen(true); }}
          className="flex items-center justify-center gap-2 px-6 py-3 bg-violet-600 hover:bg-violet-500 text-white font-bold rounded-2xl shadow-lg shadow-violet-500/20 transition-all transform hover:scale-[1.02] active:scale-[0.98]">
          <Plus size={20} />
          Nuevo Alcance
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
            className="w-full pl-12 pr-4 py-3.5 bg-white/50 dark:bg-black/20 border border-gray-200 dark:border-white/10 rounded-2xl focus:ring-2 focus:ring-violet-500/50 outline-none transition-all dark:text-white"
          />
        </div>
        <div className="relative">
          <button
            onClick={() => setShowFilters(!showFilters)}
            className={`flex items-center justify-center gap-2 px-5 py-3 border rounded-2xl transition-all ${showFilters
              ? 'bg-violet-600 border-violet-600 text-white shadow-lg shadow-violet-500/20'
              : 'bg-white dark:bg-black/20 border-gray-200 dark:border-white/10 text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-white/5'}`}
          >
            <Filter size={20} />
            Filtros
            {hasFilters && <span className="w-2 h-2 rounded-full bg-red-500 animate-pulse ml-1" />}
          </button>

          {showFilters && (
            <div className="absolute right-0 mt-3 bg-white dark:bg-gray-900 border border-gray-100 dark:border-white/10 rounded-[24px] shadow-2xl p-5 z-50 animate-in fade-in zoom-in-95 duration-200" style={{ width: '280px' }}>
              <div className="space-y-4">
                <div className="flex items-center justify-between border-b border-gray-100 dark:border-white/5 pb-2">
                  <span className="text-sm font-bold text-gray-800 dark:text-white">Filtros</span>
                  <button onClick={() => setFilters({ unidad: '', anio: '2026' })} className="text-[11px] font-bold text-violet-600 hover:text-violet-500 uppercase tracking-wider">
                    Limpiar
                  </button>
                </div>

                <div className="space-y-1.5">
                  <label className="text-[10px] font-bold text-gray-400 uppercase ml-1">Año</label>
                  <div className="grid grid-cols-3 gap-2">
                    {['2024', '2025', '2026'].map(y => (
                      <button key={y} onClick={() => setFilters({ ...filters, anio: y })}
                        className={`py-1.5 px-2 rounded-xl text-[10px] font-bold transition-all border ${filters.anio === y
                          ? 'bg-violet-600 border-violet-600 text-white'
                          : 'bg-gray-50 dark:bg-white/5 border-gray-100 dark:border-white/5 text-gray-500'}`}>
                        {y}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="space-y-1.5">
                  <label className="text-[10px] font-bold text-gray-400 uppercase ml-1">Unidad de Negocio</label>
                  <select
                    value={filters.unidad}
                    onChange={(e) => setFilters({ ...filters, unidad: e.target.value })}
                    className="w-full px-3 py-2.5 bg-gray-50 dark:bg-[#1a1f2e] border border-gray-100 dark:border-white/5 rounded-2xl text-xs dark:text-white outline-none focus:ring-2 focus:ring-violet-500/50 cursor-pointer appearance-none"
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

      {/* Lista */}
      <div className="bg-white/40 dark:bg-black/20 backdrop-blur-xl border border-white/40 dark:border-white/10 rounded-[32px] shadow-xl overflow-hidden relative min-h-[400px]">
        {loading ? (
          <div className="absolute inset-0 flex flex-col items-center justify-center gap-3">
            <Loader2 className="w-8 h-8 text-violet-500 animate-spin" />
            <p className="text-sm text-gray-500">Cargando datos de alcance...</p>
          </div>
        ) : filteredData.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20">
            <p className="text-gray-400 dark:text-gray-500 text-sm">No se encontraron registros</p>
          </div>
        ) : (
          <>
            {/* Cabecera de columnas */}
            <div className="px-5 py-3 border-b border-gray-100 dark:border-white/5 flex items-center">
              <div className="w-10 shrink-0 mr-3" />
              <div className="flex-1 pr-4">
                <span className="text-[11px] font-bold text-gray-400 uppercase tracking-wider">Colaborador / Indicador</span>
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

            {filteredData.map((item) => (
              <AlcanceCard
                key={item.id}
                item={item}
                onEdit={() => { setSelectedItem(item); setIsModalOpen(true); }}
              />
            ))}
          </>
        )}
      </div>

      <AlcanceModal
        isOpen={isModalOpen}
        onClose={() => { setIsModalOpen(false); setSelectedItem(null); }}
        onSuccess={fetchAlcance}
        initialData={selectedItem}
      />
    </div>
  );
}
