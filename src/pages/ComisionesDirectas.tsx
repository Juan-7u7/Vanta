/** final 2.0 - con %bono y monto calculado */
import { useState, useEffect } from 'react';
import { Search, Filter, Loader2, ChevronDown, TrendingUp, TrendingDown, Minus, Info } from 'lucide-react';
import { supabase } from '../lib/supabase';

const MESES = ['enero', 'febrero', 'marzo', 'abril', 'mayo', 'junio', 'julio', 'agosto', 'septiembre', 'octubre', 'noviembre', 'diciembre'] as const;
const MESES_CORTOS = ['ENE', 'FEB', 'MAR', 'ABR', 'MAY', 'JUN', 'JUL', 'AGO', 'SEP', 'OCT', 'NOV', 'DIC'];

interface ComisionIndicator {
  nombre_indicador: string;
  tipo_indicador: string;
  ponderacion: number;
  meta: Record<typeof MESES[number], number>;
  alcance: Record<typeof MESES[number], number>;
  porcentajeBono?: number;
  montoBonoComision?: number;
  mesesBono?: number;
  participacion?: number;
  sueldoMensualizado?: number;
  escalones?: { limite_inferior: number; limite_superior: number; porcentaje_pago: number }[];
}

interface ComisionRow {
  colaborador_id: string;
  anio: number;
  colaborador: {
    nombre: string;
    apellido_paterno: string;
    email: string;
    unidades_negocio: { nombre: string; color_hex?: string } | null;
  } | null | any;
  indicadores: ComisionIndicator[];
  aprobacion?: {
    mes: string;
    paso_captura: boolean;
    paso_validacion: boolean;
    paso_autorizacion: boolean;
    paso_direccion: boolean;
  };
}

const fmt = (val: number) => {
  const n = Number(val) || 0;
  return n.toLocaleString('es-MX', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
};

const pct = (alcance: number, meta: number): number =>
  meta > 0 ? Math.round((alcance / meta) * 10000) / 100 : 0;

const calcTotalMetaIndicador = (ind: ComisionIndicator) =>
  MESES.reduce((s, m) => s + (ind.meta[m] || 0), 0);

const calcTotalAlcanceIndicador = (ind: ComisionIndicator) =>
  MESES.reduce((s, m) => s + (ind.alcance[m] || 0), 0);

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
  // Promedio ponderado
  const pesos = row.indicadores.reduce((s, ind) => s + (ind.ponderacion || 0), 0) || row.indicadores.length;
  const totalPct = Math.round((
    row.indicadores.reduce((s, ind) => {
      const m = calcTotalMetaIndicador(ind);
      const a = calcTotalAlcanceIndicador(ind);
      const p = m > 0 ? a / m : 0;
      return s + p * (ind.ponderacion || (1 / row.indicadores.length));
    }, 0) / (pesos || 1)) * 10000) / 100;

  const mesIdx = new Date().getMonth();
  const mesKey = MESES[mesIdx];
  const mesPct = (() => {
    const sumMeta = row.indicadores.reduce((s, ind) => s + (ind.meta[mesKey] || 0), 0);
    const sumAlc = row.indicadores.reduce((s, ind) => s + (ind.alcance[mesKey] || 0), 0);
    return pct(sumAlc, sumMeta);
  })();
  const totalMeta = row.indicadores.reduce((s, ind) => s + calcTotalMetaIndicador(ind), 0);
  const totalAlcance = row.indicadores.reduce((s, ind) => s + calcTotalAlcanceIndicador(ind), 0);
  const { text: colorText, bg: colorBg } = colorPct(totalPct);

  const TrendIcon = totalPct >= 90 ? TrendingUp : totalPct >= 70 ? Minus : TrendingDown;

  // Datos de comisión directa (primer indicador con datos, o promedio)
  const primerConComision = row.indicadores.find(ind => (ind.porcentajeBono ?? 0) > 0);
  const pctBonoMostrar = primerConComision?.porcentajeBono ?? 0;
  const montoMostrar = row.indicadores.reduce((s, ind) => s + (ind.montoBonoComision ?? 0), 0);
  const mesesBonoInd = primerConComision?.mesesBono ?? 0;
  const sueldoMensualInd = primerConComision?.sueldoMensualizado ?? 0;

  const ApprovalDot = ({ active, label }: { active: boolean; label: string }) => (
    <div className="flex items-center gap-1">
      <span className={`w-3 h-3 rounded-full border ${active
        ? 'bg-green-500 border-green-500 shadow-[0_0_0_3px_rgba(34,197,94,0.2)]'
        : 'bg-gray-300 dark:bg-gray-700 border-gray-300 dark:border-gray-700'}`} />
      <span className="text-[10px] font-bold text-gray-500 dark:text-gray-400 uppercase">{label}</span>
    </div>
  );

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
            <span className="hidden sm:inline text-[10px] px-2 py-0.5 rounded-full bg-orange-500/10 text-orange-600 dark:text-orange-400 font-bold shrink-0">
              {row.indicadores.length} indicadores
            </span>
          </div>
          <div className="flex items-center gap-2 mt-0.5">
            <span className="text-[10px] font-bold text-orange-600 dark:text-orange-400 uppercase">
              {row.colaborador?.unidades_negocio?.nombre || 'N/A'}
            </span>
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

        {/* % Bono + Monto — md+ */}
        {pctBonoMostrar > 0 && (
          <div className="hidden md:flex flex-col items-center gap-0.5 shrink-0 min-w-[80px] relative group">
            <div className="flex items-center gap-1">
              <span className="text-sm font-mono font-bold text-emerald-600 dark:text-emerald-400">
                {pctBonoMostrar}%
              </span>
              <Info size={10} className="text-gray-300 dark:text-gray-600" />
            </div>
            <span className="text-[10px] font-mono font-bold text-emerald-600 dark:text-emerald-400">
              ${fmt(montoMostrar)}
            </span>
            <span className="text-[9px] text-gray-400 uppercase leading-tight">Bono · Monto</span>
            <div className="absolute bottom-full mb-2 hidden group-hover:block bg-gray-900 text-white text-[10px] rounded-xl px-3 py-2 shadow-xl whitespace-nowrap z-50">
              % bono según escalón · Sueldo mensualizado: ${fmt(sueldoMensualInd)} × {mesesBonoInd} meses
            </div>
          </div>
        )}

        {/* Mes actual — lg+ */}
        <div className="hidden lg:flex w-36 flex-col gap-1 items-center shrink-0">
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

        {/* Aprobaciones */}
        <div className="hidden xl:flex items-center gap-2 ml-4">
          {[
            { key: 'CAP', active: row.aprobacion?.paso_captura },
            { key: 'REV', active: row.aprobacion?.paso_direccion },
            { key: 'VAL', active: row.aprobacion?.paso_validacion },
            { key: 'APR', active: row.aprobacion?.paso_autorizacion },
          ].map(step => (
            <ApprovalDot key={step.key} active={!!step.active} label={step.key} />
          ))}
        </div>

        {/* Chevron */}
        <div className={`ml-3 p-1.5 rounded-xl text-gray-400 transition-all duration-200 ${expanded ? 'rotate-180' : ''}`}>
          <ChevronDown size={16} />
        </div>
      </div>

      {/* Panel expandido */}
      {expanded && (
        <div className="px-5 pb-5 space-y-5 animate-in slide-in-from-top-2 duration-200">
          {/* Tarjetas resumen globales */}
          <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
            {[
              { label: 'Meta Anual', value: fmt(totalMeta), sub: 'Total esperado', color: 'text-blue-600 dark:text-blue-400' },
              { label: 'Alcance Anual', value: fmt(totalAlcance), sub: 'Total logrado', color: 'text-violet-600 dark:text-violet-400' },
              { label: 'Cumplimiento', value: `${totalPct}%`, sub: 'Alcance / Meta', color: colorPct(totalPct).text },
              {
                label: 'Mes Actual',
                value: (() => {
                  const m = row.indicadores.reduce((s, ind) => s + (ind.meta[mesKey] || 0), 0);
                  const a = row.indicadores.reduce((s, ind) => s + (ind.alcance[mesKey] || 0), 0);
                  const p = pct(a, m);
                  return p > 0 ? `${p}%` : '—';
                })(),
                sub: MESES_CORTOS[mesIdx],
                color: colorPct(mesPct).text
              },
              ...(montoMostrar > 0 ? [{
                label: 'Comisión Total',
                value: `$${fmt(montoMostrar)}`,
                sub: `${pctBonoMostrar}% bono · ${mesesBonoInd} meses`,
                color: 'text-emerald-600 dark:text-emerald-400'
              }] : []),
            ].map(({ label, value, sub, color }) => (
              <div key={label} className="bg-white/60 dark:bg-white/5 rounded-2xl p-3 border border-gray-100 dark:border-white/10">
                <p className="text-[10px] font-bold text-gray-400 uppercase">{label}</p>
                <p className={`text-lg font-mono font-bold mt-0.5 ${color}`}>{value}</p>
                <p className="text-[10px] text-gray-400 mt-0.5">{sub}</p>
              </div>
            ))}
          </div>

          {/* Bloques por indicador */}
          <div className="space-y-4">
            {row.indicadores.map((ind, idx) => {
              const totMetaInd = calcTotalMetaIndicador(ind);
              const totAlcInd = calcTotalAlcanceIndicador(ind);
              const pctInd = pct(totAlcInd, totMetaInd);
              return (
                <div key={`${ind.nombre_indicador}-${idx}`} className="rounded-2xl border border-gray-100 dark:border-white/10 bg-white/60 dark:bg-white/5 p-4 space-y-3">
                  <div className="flex items-center justify-between gap-3">
                    <div className="flex items-center gap-2">
                      <div className="w-8 h-8 rounded-xl bg-orange-500/10 border border-orange-500/20 flex items-center justify-center">
                        <span className="text-[11px] font-bold text-orange-600 dark:text-orange-400">{idx + 1}</span>
                      </div>
                      <div>
                        <p className="text-sm font-bold text-gray-800 dark:text-white">{ind.nombre_indicador}</p>
                        <p className="text-[10px] text-gray-400">Ponderación: {(ind.ponderacion || (100 / row.indicadores.length)).toFixed(2)}%</p>
                      </div>
                    </div>
                    <div className={`px-3 py-1 rounded-xl text-sm font-mono font-bold border ${colorPct(pctInd).bg} ${colorPct(pctInd).text}`}>
                      {pctInd}%
                    </div>
                  </div>

                  {/* Cumplimiento mensual por indicador */}
                  <div>
                    <p className="text-[10px] font-bold text-gray-400 uppercase mb-2">Cumplimiento por Mes</p>
                    <div className="grid grid-cols-6 sm:grid-cols-12 gap-2">
                      {MESES.map((mes, i) => (
                        <MesCumplimiento
                          key={mes}
                          meta={ind.meta[mes] || 0}
                          alcance={ind.alcance[mes] || 0}
                          label={MESES_CORTOS[i]}
                          isCurrent={i === mesIdx}
                        />
                      ))}
                    </div>
                  </div>

                  {/* Tabla meta vs alcance por indicador */}
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
                        <tbody className="divide-y divide-gray-100 dark:divide-white/10">
                          <tr className="hover:bg-gray-50/60 dark:hover:bg-white/5">
                            <td className="px-3 py-2 font-bold text-gray-700 dark:text-white">Meta</td>
                            {MESES.map(m => (
                              <td key={m} className="px-1 py-2 text-center font-mono text-[11px] text-gray-600 dark:text-gray-300">
                                {fmt(ind.meta[m] || 0)}
                              </td>
                            ))}
                          </tr>
                          <tr className="hover:bg-gray-50/60 dark:hover:bg-white/5">
                            <td className="px-3 py-2 font-bold text-gray-700 dark:text-white">Alcance</td>
                            {MESES.map(m => (
                              <td key={m} className="px-1 py-2 text-center font-mono text-[11px] text-gray-600 dark:text-gray-300">
                                {fmt(ind.alcance[m] || 0)}
                              </td>
                            ))}
                          </tr>
                          <tr className="hover:bg-gray-50/60 dark:hover:bg-white/5">
                            <td className="px-3 py-2 font-bold text-gray-700 dark:text-white">%</td>
                            {MESES.map(m => {
                              const p = pct(ind.alcance[m] || 0, ind.meta[m] || 0);
                              return (
                                <td key={m} className="px-1 py-2 text-center font-mono text-[11px] font-bold">
                                  <span className={colorPct(p).text}>{p ? `${p}%` : '—'}</span>
                                </td>
                              );
                            })}
                          </tr>
                        </tbody>
                      </table>
                    </div>
                  </div>

                  {/* Comisión directa: %bono y monto */}
                  {(ind.porcentajeBono ?? 0) > 0 && (
                    <div className="rounded-2xl border border-emerald-200 dark:border-emerald-500/20 bg-emerald-50/60 dark:bg-emerald-500/5 p-4 space-y-3">
                      <div className="flex items-center gap-2">
                        <div className="w-2 h-2 rounded-full bg-emerald-500" />
                        <span className="text-[10px] font-bold text-emerald-600 dark:text-emerald-400 uppercase tracking-wider">Comisión Directa</span>
                      </div>
                      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                        <div>
                          <p className="text-[10px] text-gray-500 uppercase">% ALCANCE LOGRADO</p>
                          <p className="text-lg font-mono font-bold text-emerald-600 dark:text-emerald-400">{ind.porcentajeBono}%</p>
                        </div>
                        <div>
                          <p className="text-[10px] text-gray-500 uppercase">Comisión por pagar</p>
                          <p className="text-lg font-mono font-bold text-emerald-600 dark:text-emerald-400">${fmt(ind.montoBonoComision ?? 0)}</p>
                        </div>
                        <div>
                          <p className="text-[10px] text-gray-500 uppercase">Participación Q</p>
                          <p className="text-lg font-mono font-bold text-gray-700 dark:text-gray-300">{((ind.participacion ?? 0) * 100).toFixed(2)}%</p>
                        </div>
                        <div>
                          <p className="text-[10px] text-gray-500 uppercase">Sueldo mensualizado</p>
                          <p className="text-lg font-mono font-bold text-gray-700 dark:text-gray-300">${fmt(ind.sueldoMensualizado ?? 0)}</p>
                        </div>
                      </div>
                      <div className="text-[11px] text-gray-500 dark:text-gray-400 font-mono bg-white/60 dark:bg-black/20 rounded-xl p-3 border border-emerald-100 dark:border-emerald-500/10">
                        {fmt(ind.sueldoMensualizado ?? 0)} × {ind.mesesBono ?? 0} meses × {((ind.participacion ?? 0) * 100).toFixed(2)}% × {ind.porcentajeBono}% = ${fmt(ind.montoBonoComision ?? 0)}
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
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

      // 1. Metas (objetivos) — múltiples indicadores por colaborador
      const { data: metasData, error: errMetas } = await supabase
        .from('metas_indicadores')
        .select(`
          id, colaborador_id, anio, nombre_indicador, tipo_indicador, ponderacion, esquema_pago_id,
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
      const metaIds = metasData.map(m => m.id).filter(Boolean);

      // 2. Alcances reales por indicador
      const { data: alcanceData } = await supabase
        .from('alcance_real')
        .select('colaborador_id, indicador_id, anio, enero, febrero, marzo, abril, mayo, junio, julio, agosto, septiembre, octubre, noviembre, diciembre')
        .in('colaborador_id', ids)
        .in('indicador_id', metaIds);

      const alcanceMap: Record<string, Record<typeof MESES[number], number>> = {};
      (alcanceData || []).forEach(a => {
        const key = `${a.colaborador_id}-${a.anio}-${a.indicador_id}`;
        alcanceMap[key] = {
          enero: a.enero || 0, febrero: a.febrero || 0, marzo: a.marzo || 0,
          abril: a.abril || 0, mayo: a.mayo || 0, junio: a.junio || 0,
          julio: a.julio || 0, agosto: a.agosto || 0, septiembre: a.septiembre || 0,
          octubre: a.octubre || 0, noviembre: a.noviembre || 0, diciembre: a.diciembre || 0,
        };
      });

      // 3. Pasos de aprobación (mes actual, anio filtro)
      const mesActual = MESES[new Date().getMonth()];
      const { data: pasosData } = await supabase
        .from('pasos_aprobacion')
        .select('colaborador_id, mes, anio, paso_captura, paso_validacion, paso_autorizacion, paso_direccion')
        .in('colaborador_id', ids)
        .eq('anio', filters.anio)
        .eq('mes', mesActual);

      const pasosMap: Record<string, any> = {};
      (pasosData || []).forEach(p => {
        const key = `${p.colaborador_id}-${p.anio}`;
        pasosMap[key] = p;
      });

      // 3. Agrupar por colaborador
      const grouped: Record<string, ComisionRow> = {};
      metasData.forEach(m => {
        const key = `${m.colaborador_id}-${m.anio}`;
        if (!grouped[key]) {
          grouped[key] = {
            colaborador_id: m.colaborador_id,
            anio: m.anio,
            colaborador: Array.isArray(m.colaborador) ? m.colaborador[0] : m.colaborador,
            indicadores: [],
            aprobacion: pasosMap[key] ? {
              mes: pasosMap[key].mes,
              paso_captura: !!pasosMap[key].paso_captura,
              paso_validacion: !!pasosMap[key].paso_validacion,
              paso_autorizacion: !!pasosMap[key].paso_autorizacion,
              paso_direccion: !!pasosMap[key].paso_direccion,
            } : undefined
          };
        }
        const alc = alcanceMap[`${m.colaborador_id}-${m.anio}-${m.id}`];
        grouped[key].indicadores.push({
          nombre_indicador: m.nombre_indicador || '',
          tipo_indicador: m.tipo_indicador || '',
          ponderacion: m.ponderacion ?? 0,
          meta: {
            enero: m.enero || 0, febrero: m.febrero || 0, marzo: m.marzo || 0,
            abril: m.abril || 0, mayo: m.mayo || 0, junio: m.junio || 0,
            julio: m.julio || 0, agosto: m.agosto || 0, septiembre: m.septiembre || 0,
            octubre: m.octubre || 0, noviembre: m.noviembre || 0, diciembre: m.diciembre || 0,
          },
          alcance: alc || {
            enero: 0, febrero: 0, marzo: 0, abril: 0, mayo: 0, junio: 0,
            julio: 0, agosto: 0, septiembre: 0, octubre: 0, noviembre: 0, diciembre: 0,
          }
        });
      });

      // 4. Calcular %bono y monto para cada indicador
      const anosUnicos = [...new Set(metasData.map(m => m.anio))];

      // 4a. Salarios mensuales
      const { data: salariosData } = await supabase
        .from('salarios_mensuales')
        .select('*')
        .in('colaborador_id', ids)
        .in('anio', anosUnicos);
      const salarioMap: Record<string, any> = {};
      (salariosData || []).forEach(s => { salarioMap[`${s.colaborador_id}-${s.anio}`] = s; });

      // 4b. Config meses_bono
      const { data: bonosConfig } = await supabase
        .from('bonos_colaborador_config')
        .select('*')
        .in('colaborador_id', ids)
        .in('anio', anosUnicos);
      const bonoConfigMap: Record<string, any> = {};
      (bonosConfig || []).forEach(b => { bonoConfigMap[`${b.colaborador_id}-${b.anio}`] = b; });

      // 4c. Esquemas de pago y escalones
      const esquemaIds = [...new Set(metasData.map((m: any) => m.esquema_pago_id).filter(Boolean))] as number[];
      let escalonesPorEsquema: Record<number, any[]> = {};
      if (esquemaIds.length > 0) {
        const { data: todosEscalones } = await supabase
          .from('escalones_bonos')
          .select('*')
          .in('esquema_id', esquemaIds)
          .order('limite_inferior', { ascending: false });
        (todosEscalones || []).forEach(e => {
          if (!escalonesPorEsquema[e.esquema_id]) escalonesPorEsquema[e.esquema_id] = [];
          escalonesPorEsquema[e.esquema_id].push(e);
        });
      }

      // 4d. Enriquecer cada indicador con cálculo de comisión directa
      Object.values(grouped).forEach(row => {
        const key = `${row.colaborador_id}-${row.anio}`;
        const salario = salarioMap[key];
        const config = bonoConfigMap[key];
        const mesesBono = config?.meses_bono ?? 0;
        if (mesesBono <= 0 || !salario) return;

        const mesesConSalario = MESES.filter(m => Number((salario as any)[m] || 0) > 0);
        const salarioTotalAnual = mesesConSalario.reduce((s, m) => s + Number((salario as any)[m] || 0), 0);
        const sueldoMensualizado = mesesConSalario.length > 0 ? salarioTotalAnual / mesesConSalario.length : 0;

        // Sumar metas anuales del colaborador
        const metasColab = metasData.filter(m => m.colaborador_id === row.colaborador_id && m.anio === row.anio);
        let sumaMetasAnual = 0;
        metasColab.forEach(m => {
          MESES.forEach(mes => { sumaMetasAnual += Number((m as any)[mes] || 0); });
        });

        row.indicadores.forEach((ind, idx) => {
          // Usar solo meses con alcance > 0 (el Q activo) para cumplimiento
          const mesesConAlcance = MESES.filter(m => (ind.alcance[m] || 0) > 0);
          const mesesConMeta = mesesConAlcance.length > 0
            ? mesesConAlcance
            : MESES.filter(m => (ind.meta[m] || 0) > 0);
          const metaQ = mesesConMeta.reduce((s, m) => s + (ind.meta[m] || 0), 0);
          const alcQ = mesesConMeta.reduce((s, m) => s + (ind.alcance[m] || 0), 0);
          if (metaQ <= 0) return;

          // Suma anual de LAS 4 Q de ESTE indicador (para %participación)
          const metaAnualIndicador = MESES.reduce((s, m) => s + (ind.meta[m] || 0), 0);

          // Buscar escalones según esquema_pago_id de la meta
          const metaRow = metasColab[idx];
          const esquemaId = (metaRow as any)?.esquema_pago_id;
          let escalones = [
            { limite_inferior: 0, limite_superior: 89.9, porcentaje_pago: 0 },
            { limite_inferior: 90, limite_superior: 9999, porcentaje_pago: 100 }
          ];
          if (esquemaId && escalonesPorEsquema[esquemaId]) {
            escalones = escalonesPorEsquema[esquemaId];
          }

          const cumplimiento = metaQ > 0 ? (alcQ / metaQ) * 100 : 0;
          const ordenados = [...escalones].sort((a, b) => b.limite_inferior - a.limite_inferior);
          const match = ordenados.find(e => cumplimiento >= e.limite_inferior);
          const porcentajeBono = match ? Number(match.porcentaje_pago) : 0;
          const participacion = metaAnualIndicador > 0 ? metaQ / metaAnualIndicador : 0;
          const montoBono = mesesBono * sueldoMensualizado * participacion * (porcentajeBono / 100);

          ind.porcentajeBono = porcentajeBono;
          ind.montoBonoComision = montoBono;
          ind.mesesBono = mesesBono;
          ind.participacion = participacion;
          ind.sueldoMensualizado = sueldoMensualizado;
          ind.escalones = escalones;
        });
      });

      setRows(Object.values(grouped));
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const filteredData = rows.filter(row => {
    const nombre = `${row.colaborador?.nombre || ''} ${row.colaborador?.apellido_paterno || ''}`;
    const matchesSearch = !searchTerm || nombre.toLowerCase().includes(searchTerm.toLowerCase()) ||
      row.indicadores.some(ind => ind.nombre_indicador.toLowerCase().includes(searchTerm.toLowerCase()));
    const matchesUnidad = !filters.unidad || row.colaborador?.unidades_negocio?.nombre === filters.unidad;
    const matchesAnio = !filters.anio || row.anio?.toString() === filters.anio;
    return matchesSearch && matchesUnidad && matchesAnio;
  });

  const unidades = Array.from(new Set(rows.map(r => r.colaborador?.unidades_negocio?.nombre).filter(Boolean)));
  const hasFilters = !!(filters.unidad || filters.anio !== '2026');

  // Resumen global
  const totalMeta = rows.reduce((s, r) => s + r.indicadores.reduce((si, ind) => si + calcTotalMetaIndicador(ind), 0), 0);
  const totalAlcance = rows.reduce((s, r) => s + r.indicadores.reduce((si, ind) => si + calcTotalAlcanceIndicador(ind), 0), 0);
  const totalGlobalPct = pct(totalAlcance, totalMeta);
  const totalComisionesGlobal = rows.reduce((s, r) => s + r.indicadores.reduce((si, ind) => si + (ind.montoBonoComision ?? 0), 0), 0);

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
            { label: 'Comisiones', value: `$${fmt(totalComisionesGlobal)}`, color: 'text-emerald-600 dark:text-emerald-400', bg: 'bg-emerald-500/10 border-emerald-500/20' },
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
              <div className="hidden md:flex w-32 justify-center shrink-0">
                <span className="text-[11px] font-bold text-gray-400 uppercase tracking-wider">Bono · Monto</span>
              </div>
              <div className="hidden lg:flex w-36 justify-center shrink-0">
                <span className="text-[11px] font-bold text-gray-400 uppercase tracking-wider">Mes actual</span>
              </div>
              <div className="hidden xl:flex items-center gap-2 ml-4 shrink-0">
                <span className="text-[11px] font-bold text-gray-400 uppercase tracking-wider">Aprob.</span>
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
