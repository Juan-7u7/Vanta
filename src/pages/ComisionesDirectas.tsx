import { useState, useEffect } from 'react';
import { Search, Filter, Loader2, ChevronDown, TrendingUp, TrendingDown, Minus } from 'lucide-react';
import { supabase } from '../lib/supabase';

const MESES = ['enero', 'febrero', 'marzo', 'abril', 'mayo', 'junio', 'julio', 'agosto', 'septiembre', 'octubre', 'noviembre', 'diciembre'] as const;
const MESES_CORTOS = ['ENE', 'FEB', 'MAR', 'ABR', 'MAY', 'JUN', 'JUL', 'AGO', 'SEP', 'OCT', 'NOV', 'DIC'];

interface ComisionRow {
  colaborador_id: string;
  anio: number;
  nombre_indicador: string;
  tipo_indicador: string;
  colaborador: {
    nombre: string;
    apellido_paterno: string;
    email: string;
    unidades_negocio: { nombre: string; color_hex?: string } | null;
  } | null | any;
  meta: Record<typeof MESES[number], number>;
  alcance: Record<typeof MESES[number], number>;
}

const fmt = (val: number) =>
  val.toLocaleString('es-MX', { minimumFractionDigits: 2, maximumFractionDigits: 2 });

const pct = (alcance: number, meta: number): number =>
  meta > 0 ? Math.round((alcance / meta) * 10000) / 100 : 0;

const calcTotalMeta = (row: ComisionRow) =>
  MESES.reduce((s, m) => s + (row.meta[m] || 0), 0);

const calcTotalAlcance = (row: ComisionRow) =>
  MESES.reduce((s, m) => s + (row.alcance[m] || 0), 0);

// Color semáforo por % cumplimiento
function colorPct(p: number) {
  if (p >= 90) return { bar: 'bg-green-500', text: 'text-green-600 dark:text-green-400', bg: 'bg-green-500/10 border-green-500/20' };
  if (p >= 70) return { bar: 'bg-amber-500', text: 'text-amber-600 dark:text-amber-400', bg: 'bg-amber-500/10 border-amber-500/20' };
  return { bar: 'bg-red-500', text: 'text-red-600 dark:text-red-400', bg: 'bg-red-500/10 border-red-500/20' };
}

function MesCumplimiento({ meta, alcance, label, isCurrent }: {
  meta: number; alcance: number; label: string; isCurrent: boolean;
}) {
  const p = pct(alcance, meta);
  const { bar, text } = colorPct(p);

  return (
    <div className={`flex flex-col rounded-xl border p-2 transition-all ${isCurrent
      ? 'bg-orange-50 dark:bg-orange-500/10 border-orange-200 dark:border-orange-500/20'
      : 'bg-gray-50 dark:bg-white/5 border-gray-100 dark:border-white/5'}`}>
      <span className={`text-[9px] font-bold uppercase text-center ${isCurrent ? 'text-orange-600 dark:text-orange-400' : 'text-gray-400'}`}>
        {label}
      </span>
      {/* Barra de progreso */}
      <div className="mt-1.5 h-1.5 bg-gray-200 dark:bg-white/10 rounded-full overflow-hidden">
        <div
          className={`h-full rounded-full transition-all ${bar}`}
          style={{ width: `${Math.min(p, 100)}%` }}
        />
      </div>
      <span className={`text-[10px] font-mono font-bold mt-1 text-center ${meta === 0 ? 'text-gray-400' : text}`}>
        {meta === 0 ? '—' : `${p}%`}
      </span>
    </div>
  );
}

function ComisionCard({ row }: { row: ComisionRow }) {
  const [expanded, setExpanded] = useState(false);
  const totalMeta = calcTotalMeta(row);
  const totalAlcance = calcTotalAlcance(row);
  const totalPct = pct(totalAlcance, totalMeta);
  const mesIdx = new Date().getMonth();
  const mesKey = MESES[mesIdx];
  const mesPct = pct(row.alcance[mesKey] || 0, row.meta[mesKey] || 0);
  const { text: colorText, bg: colorBg } = colorPct(totalPct);

  const TrendIcon = totalPct >= 90 ? TrendingUp : totalPct >= 70 ? Minus : TrendingDown;

  return (
    <div className="border-b border-gray-100 dark:border-white/5 last:border-0">
      {/* Fila principal */}
      <div
        className="px-5 py-4 flex items-center cursor-pointer hover:bg-white/40 dark:hover:bg-white/5 transition-colors"
        onClick={() => setExpanded(!expanded)}
      >
        {/* Avatar */}
        <div className="w-10 h-10 shrink-0 rounded-xl bg-gradient-to-tr from-orange-500/20 to-amber-500/20 flex items-center justify-center border border-orange-500/10 mr-3">
          <span className="text-[10px] font-bold text-orange-600 dark:text-orange-400">
            {row.colaborador?.nombre?.[0]}{row.colaborador?.apellido_paterno?.[0]}
          </span>
        </div>

        {/* Info */}
        <div className="flex-1 min-w-0 pr-4">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="text-sm font-bold text-gray-800 dark:text-white truncate">
              {row.colaborador?.nombre} {row.colaborador?.apellido_paterno}
            </span>
            {row.nombre_indicador && (
              <span className="hidden sm:inline text-[10px] px-2 py-0.5 rounded-full bg-orange-500/10 text-orange-600 dark:text-orange-400 font-bold shrink-0 max-w-[200px] truncate">
                {row.nombre_indicador}
              </span>
            )}
          </div>
          <div className="flex items-center gap-2 mt-0.5">
            <span className="text-[10px] font-bold text-orange-600 dark:text-orange-400 uppercase">
              {row.colaborador?.unidades_negocio?.nombre || 'N/A'}
            </span>
            {row.tipo_indicador && (
              <>
                <span className="text-[10px] text-gray-400">·</span>
                <span className="text-[10px] text-gray-500 dark:text-gray-400">{row.tipo_indicador}</span>
              </>
            )}
            <span className="text-[10px] text-gray-400">·</span>
            <span className="text-[10px] text-gray-400">{row.anio}</span>
          </div>
        </div>

        {/* % global — sm+ */}
        <div className="hidden sm:flex w-32 flex-col items-end gap-1 shrink-0">
          <div className={`flex items-center gap-1.5 px-2.5 py-1 rounded-xl border ${colorBg}`}>
            <TrendIcon size={12} className={colorText} />
            <span className={`text-sm font-mono font-bold ${colorText}`}>
              {totalPct}%
            </span>
          </div>
          <span className="text-[9px] text-gray-400 uppercase">Cumplimiento</span>
        </div>

        {/* Mes actual — md+ */}
        <div className="hidden md:flex w-36 flex-col gap-1 items-center shrink-0">
          <div className="w-full h-1.5 bg-gray-100 dark:bg-white/10 rounded-full overflow-hidden">
            <div
              className={`h-full rounded-full ${colorPct(mesPct).bar}`}
              style={{ width: `${Math.min(mesPct, 100)}%` }}
            />
          </div>
          <div className="flex items-center gap-2 w-full justify-between">
            <span className="text-[9px] text-gray-400 uppercase">{MESES_CORTOS[mesIdx]}</span>
            <span className={`text-[11px] font-mono font-bold ${colorPct(mesPct).text}`}>
              {mesPct > 0 ? `${mesPct}%` : '—'}
            </span>
          </div>
        </div>

        {/* Chevron */}
        <div className={`ml-3 p-1.5 rounded-xl text-gray-400 transition-all duration-200 ${expanded ? 'rotate-180' : ''}`}>
          <ChevronDown size={16} />
        </div>
      </div>

      {/* Panel expandido */}
      {expanded && (
        <div className="px-5 pb-5 space-y-5 animate-in slide-in-from-top-2 duration-200">

          {/* Tarjetas resumen */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            {[
              { label: 'Meta Anual', value: fmt(totalMeta), sub: 'Total esperado', color: 'text-blue-600 dark:text-blue-400' },
              { label: 'Alcance Anual', value: fmt(totalAlcance), sub: 'Total logrado', color: 'text-violet-600 dark:text-violet-400' },
              { label: 'Cumplimiento', value: `${totalPct}%`, sub: 'Alcance / Meta', color: colorPct(totalPct).text },
              {
                label: 'Mes Actual',
                value: pct(row.alcance[mesKey] || 0, row.meta[mesKey] || 0) > 0
                  ? `${pct(row.alcance[mesKey] || 0, row.meta[mesKey] || 0)}%`
                  : '—',
                sub: MESES_CORTOS[mesIdx],
                color: colorPct(mesPct).text
              },
            ].map(({ label, value, sub, color }) => (
              <div key={label} className="bg-white/60 dark:bg-white/5 rounded-2xl p-3 border border-gray-100 dark:border-white/10">
                <p className="text-[10px] font-bold text-gray-400 uppercase">{label}</p>
                <p className={`text-lg font-mono font-bold mt-0.5 ${color}`}>{value}</p>
                <p className="text-[10px] text-gray-400 mt-0.5">{sub}</p>
              </div>
            ))}
          </div>

          {/* Grid de 12 meses */}
          <div>
            <p className="text-[10px] font-bold text-gray-400 uppercase mb-2">Cumplimiento por Mes</p>
            <div className="grid grid-cols-6 sm:grid-cols-12 gap-2">
              {MESES.map((mes, i) => (
                <MesCumplimiento
                  key={mes}
                  meta={row.meta[mes] || 0}
                  alcance={row.alcance[mes] || 0}
                  label={MESES_CORTOS[i]}
                  isCurrent={i === mesIdx}
                />
              ))}
            </div>
          </div>

          {/* Tabla meta vs alcance */}
          <div>
            <p className="text-[10px] font-bold text-gray-400 uppercase mb-2">Meta vs Alcance Detallado</p>
            <div className="overflow-x-auto rounded-2xl border border-gray-100 dark:border-white/10">
              <table className="w-full text-xs">
                <thead>
                  <tr className="bg-gray-50 dark:bg-white/5 border-b border-gray-100 dark:border-white/10">
                    <th className="text-left px-3 py-2 font-bold text-gray-400 uppercase text-[10px]">Concepto</th>
                    {MESES_CORTOS.map(m => (
                      <th key={m} className="text-center px-1 py-2 font-bold text-gray-400 uppercase text-[9px] min-w-[48px]">{m}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  <tr className="border-b border-gray-100 dark:border-white/5">
                    <td className="px-3 py-2 font-bold text-blue-600 dark:text-blue-400 text-[10px]">Meta</td>
                    {MESES.map(mes => (
                      <td key={mes} className="px-1 py-2 text-center font-mono text-[10px] text-gray-600 dark:text-gray-400">
                        {row.meta[mes] > 0 ? row.meta[mes].toLocaleString('es-MX', { maximumFractionDigits: 0 }) : '—'}
                      </td>
                    ))}
                  </tr>
                  <tr className="border-b border-gray-100 dark:border-white/5">
                    <td className="px-3 py-2 font-bold text-violet-600 dark:text-violet-400 text-[10px]">Alcance</td>
                    {MESES.map(mes => (
                      <td key={mes} className="px-1 py-2 text-center font-mono text-[10px] text-gray-600 dark:text-gray-400">
                        {row.alcance[mes] > 0 ? row.alcance[mes].toLocaleString('es-MX', { maximumFractionDigits: 0 }) : '—'}
                      </td>
                    ))}
                  </tr>
                  <tr>
                    <td className="px-3 py-2 font-bold text-orange-600 dark:text-orange-400 text-[10px]">%</td>
                    {MESES.map(mes => {
                      const p = pct(row.alcance[mes] || 0, row.meta[mes] || 0);
                      const { text } = colorPct(p);
                      return (
                        <td key={mes} className={`px-1 py-2 text-center font-mono font-bold text-[10px] ${row.meta[mes] > 0 ? text : 'text-gray-300 dark:text-gray-700'}`}>
                          {row.meta[mes] > 0 ? `${p}%` : '—'}
                        </td>
                      );
                    })}
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default function ComisionesDirectas() {
  const [rows, setRows] = useState<ComisionRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [showFilters, setShowFilters] = useState(false);
  const [filters, setFilters] = useState({ unidad: '', anio: '2026' });

  useEffect(() => { fetchData(); }, []);

  const fetchData = async () => {
    try {
      setLoading(true);

      // 1. Metas (objetivos) — con datos del colaborador
      const { data: metasData, error: errMetas } = await supabase
        .from('metas_indicadores')
        .select(`
          colaborador_id, anio, nombre_indicador, tipo_indicador,
          enero, febrero, marzo, abril, mayo, junio,
          julio, agosto, septiembre, octubre, noviembre, diciembre,
          colaborador:colaborador_id(
            nombre, apellido_paterno, email,
            unidades_negocio:unidad_negocio_id(nombre, color_hex)
          )
        `);
      if (errMetas) throw errMetas;
      if (!metasData || metasData.length === 0) { setRows([]); return; }

      const ids = metasData.map(m => m.colaborador_id).filter(Boolean);

      // 2. Alcances reales
      const { data: alcanceData } = await supabase
        .from('alcance_real')
        .select('colaborador_id, anio, enero, febrero, marzo, abril, mayo, junio, julio, agosto, septiembre, octubre, noviembre, diciembre')
        .in('colaborador_id', ids);

      // Mapa alcance: "colaborador_id-anio"
      const alcanceMap: Record<string, Record<typeof MESES[number], number>> = {};
      (alcanceData || []).forEach(a => {
        const key = `${a.colaborador_id}-${a.anio}`;
        alcanceMap[key] = {
          enero: a.enero || 0, febrero: a.febrero || 0, marzo: a.marzo || 0,
          abril: a.abril || 0, mayo: a.mayo || 0, junio: a.junio || 0,
          julio: a.julio || 0, agosto: a.agosto || 0, septiembre: a.septiembre || 0,
          octubre: a.octubre || 0, noviembre: a.noviembre || 0, diciembre: a.diciembre || 0,
        };
      });

      // 3. Merge
      const enriched: ComisionRow[] = metasData.map(m => {
        const key = `${m.colaborador_id}-${m.anio}`;
        const emptyMeses = { enero: 0, febrero: 0, marzo: 0, abril: 0, mayo: 0, junio: 0, julio: 0, agosto: 0, septiembre: 0, octubre: 0, noviembre: 0, diciembre: 0 };
        return {
          colaborador_id: m.colaborador_id,
          anio: m.anio,
          nombre_indicador: m.nombre_indicador || '',
          tipo_indicador: m.tipo_indicador || '',
          colaborador: Array.isArray(m.colaborador) ? m.colaborador[0] : m.colaborador,
          meta: {
            enero: m.enero || 0, febrero: m.febrero || 0, marzo: m.marzo || 0,
            abril: m.abril || 0, mayo: m.mayo || 0, junio: m.junio || 0,
            julio: m.julio || 0, agosto: m.agosto || 0, septiembre: m.septiembre || 0,
            octubre: m.octubre || 0, noviembre: m.noviembre || 0, diciembre: m.diciembre || 0,
          },
          alcance: alcanceMap[key] || emptyMeses,
        };
      });

      setRows(enriched);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const filteredData = rows.filter(row => {
    const nombre = `${row.colaborador?.nombre || ''} ${row.colaborador?.apellido_paterno || ''}`;
    const matchesSearch = !searchTerm || nombre.toLowerCase().includes(searchTerm.toLowerCase()) ||
      row.nombre_indicador.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesUnidad = !filters.unidad || row.colaborador?.unidades_negocio?.nombre === filters.unidad;
    const matchesAnio = !filters.anio || row.anio?.toString() === filters.anio;
    return matchesSearch && matchesUnidad && matchesAnio;
  });

  const unidades = Array.from(new Set(rows.map(r => r.colaborador?.unidades_negocio?.nombre).filter(Boolean)));
  const hasFilters = !!(filters.unidad || filters.anio !== '2026');

  // Resumen global
  const totalMeta = rows.reduce((s, r) => s + calcTotalMeta(r), 0);
  const totalAlcance = rows.reduce((s, r) => s + calcTotalAlcance(r), 0);
  const totalGlobalPct = pct(totalAlcance, totalMeta);

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      {/* Encabezado */}
      <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-gray-800 dark:text-white">Comisiones Directas</h1>
          <p className="text-gray-500 dark:text-gray-400 mt-1">Meta vs. Alcance real · Cumplimiento por colaborador</p>
        </div>

        {/* KPIs rápidos */}
        <div className="flex gap-3 flex-wrap sm:flex-nowrap">
          {[
            { label: 'Meta Total', value: `$${(totalMeta / 1000).toFixed(0)}k`, color: 'text-blue-600 dark:text-blue-400', bg: 'bg-blue-500/10 border-blue-500/20' },
            { label: 'Alcance Total', value: `$${(totalAlcance / 1000).toFixed(0)}k`, color: 'text-violet-600 dark:text-violet-400', bg: 'bg-violet-500/10 border-violet-500/20' },
            { label: 'Cumplimiento', value: `${totalGlobalPct}%`, color: colorPct(totalGlobalPct).text, bg: colorPct(totalGlobalPct).bg },
          ].map(({ label, value, color, bg }) => (
            <div key={label} className={`flex flex-col px-4 py-2.5 rounded-2xl border ${bg} min-w-[90px]`}>
              <span className="text-[9px] font-bold text-gray-400 uppercase">{label}</span>
              <span className={`text-xl font-mono font-bold ${color}`}>{value}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Barra de herramientas */}
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
          <input
            type="text"
            placeholder="Buscar por colaborador o indicador..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-12 pr-4 py-3.5 bg-white/50 dark:bg-black/20 border border-gray-200 dark:border-white/10 rounded-2xl focus:ring-2 focus:ring-orange-500/50 outline-none transition-all dark:text-white"
          />
        </div>
        <div className="relative">
          <button
            onClick={() => setShowFilters(!showFilters)}
            className={`flex items-center justify-center gap-2 px-5 py-3 border rounded-2xl transition-all ${showFilters
              ? 'bg-orange-600 border-orange-600 text-white shadow-lg shadow-orange-500/20'
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
                  <button onClick={() => setFilters({ unidad: '', anio: '2026' })} className="text-[11px] font-bold text-orange-600 hover:text-orange-500 uppercase tracking-wider">
                    Limpiar
                  </button>
                </div>

                <div className="space-y-1.5">
                  <label className="text-[10px] font-bold text-gray-400 uppercase ml-1">Año</label>
                  <div className="grid grid-cols-3 gap-2">
                    {['2024', '2025', '2026'].map(y => (
                      <button key={y} onClick={() => setFilters({ ...filters, anio: y })}
                        className={`py-1.5 px-2 rounded-xl text-[10px] font-bold transition-all border ${filters.anio === y
                          ? 'bg-orange-600 border-orange-600 text-white'
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
                    className="w-full px-3 py-2.5 bg-gray-50 dark:bg-[#1a1f2e] border border-gray-100 dark:border-white/5 rounded-2xl text-xs dark:text-white outline-none focus:ring-2 focus:ring-orange-500/50 cursor-pointer appearance-none"
                  >
                    <option value="" className="bg-white dark:bg-[#1a1f2e]">Todas las unidades</option>
                    {unidades.map(u => <option key={u} value={u} className="bg-white dark:bg-[#1a1f2e]">{u}</option>)}
                  </select>
                </div>

                {/* Leyenda semáforo */}
                <div className="border-t border-gray-100 dark:border-white/5 pt-3 space-y-1.5">
                  <p className="text-[10px] font-bold text-gray-400 uppercase">Semáforo de cumplimiento</p>
                  {[
                    { color: 'bg-green-500', label: '≥ 90% — En objetivo' },
                    { color: 'bg-amber-500', label: '70–89% — Por mejorar' },
                    { color: 'bg-red-500', label: '< 70% — Crítico' },
                  ].map(({ color, label }) => (
                    <div key={label} className="flex items-center gap-2">
                      <div className={`w-2.5 h-2.5 rounded-full ${color} shrink-0`} />
                      <span className="text-[10px] text-gray-500 dark:text-gray-400">{label}</span>
                    </div>
                  ))}
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
            <Loader2 className="w-8 h-8 text-orange-500 animate-spin" />
            <p className="text-sm text-gray-500">Calculando comisiones...</p>
          </div>
        ) : filteredData.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20">
            <p className="text-gray-400 dark:text-gray-500 text-sm">No se encontraron registros</p>
          </div>
        ) : (
          <>
            {/* Cabecera */}
            <div className="px-5 py-3 border-b border-gray-100 dark:border-white/5 flex items-center">
              <div className="w-10 shrink-0 mr-3" />
              <div className="flex-1 pr-4">
                <span className="text-[11px] font-bold text-gray-400 uppercase tracking-wider">Colaborador / Indicador</span>
              </div>
              <div className="hidden sm:flex w-32 justify-end shrink-0">
                <span className="text-[11px] font-bold text-gray-400 uppercase tracking-wider">Cumplimiento</span>
              </div>
              <div className="hidden md:flex w-36 justify-center shrink-0">
                <span className="text-[11px] font-bold text-gray-400 uppercase tracking-wider">Mes actual</span>
              </div>
              <div className="w-8 shrink-0" />
            </div>

            {filteredData.map((row, i) => (
              <ComisionCard key={`${row.colaborador_id}-${row.anio}-${i}`} row={row} />
            ))}
          </>
        )}
      </div>
    </div>
  );
}
