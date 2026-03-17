/** final 1.3 - Elite Business Intelligence */
import { useEffect, useState } from 'react';
import { Routes, Route, Outlet } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { supabase } from '../lib/supabase';
import Sidebar from '../components/Sidebar';
import { 
  Users, TrendingUp, Target, 
  Clock, ShieldCheck,
  Zap, TrendingDown, Layers,
  Trophy, AlertTriangle, Award,
  ArrowUpRight
} from 'lucide-react';
import Colaboradores from './Colaboradores';
import Indicadores from './Indicadores';
import Salarios from './Salarios';
import Alcance from './Alcance';
import ComisionesDirectas from './ComisionesDirectas';
import OtrosIngresos from './OtrosIngresos';
import UnidadesNegocio from './UnidadesNegocio';
import PerfilesSeguridad from './PerfilesSeguridad';
import Usuarios from './Usuarios';
import Bonos from './Bonos';
import CargaMasiva from './CargaMasiva';
import ImprimirCovas from './ImprimirCovas';

// --- TYPES ---
interface ColabWithUnidad {
  id: string;
  nombre: string;
  unidad_negocio_id: number;
  unidades_negocio: { nombre: string } | null;
}

interface DashboardStats {
  totalColab: number;
  alcanceGlobal: number;
  invTotal: string;
  kpisActivos: number;
  unidades: any[];
  distribucion: any[];
  pasos: { total: number, completados: number, label: string }[];
  topPerformers: { nombre: string, pct: number, unidad: string }[];
  riskAreas: { count: number, label: string, color: string, sub: string, icon: any }[];
  financials: { base: number, variable: number };
}

// --- SUB-COMPONENTES UI PREMIUM ---

import { useNavigate } from 'react-router-dom';

const GlassCard = ({ children, className = "", title, icon: Icon, action, onClick }: any) => (
  <div 
    onClick={onClick}
    className={`group relative overflow-hidden bg-white/70 dark:bg-[#0f1117]/80 backdrop-blur-3xl border border-gray-100 dark:border-white/5 rounded-[48px] p-8 shadow-2xl shadow-gray-200/40 dark:shadow-none hover:shadow-indigo-500/10 transition-all duration-500 ${onClick ? 'cursor-pointer hover:border-indigo-500/30' : ''} ${className}`}
  >
     <div className="flex items-center justify-between mb-8">
        <div className="flex items-center gap-4">
          {Icon && (
            <div className="p-4 rounded-3xl bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 group-hover:scale-110 group-hover:bg-indigo-500 group-hover:text-white transition-all duration-500 shadow-inner">
              <Icon size={24} strokeWidth={2.5} />
            </div>
          )}
          <h3 className="text-sm font-black uppercase tracking-[0.25em] text-gray-400 dark:text-gray-500">{title}</h3>
        </div>
        {action}
     </div>
     {children}
  </div>
);

const MiniRing = ({ value, color = "stroke-indigo-500", size = 60 }: any) => {
  const radius = 24;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - (Math.min(value, 100) / 100) * circumference;
  return (
    <div className="relative" style={{ width: size, height: size }}>
       <svg className="w-full h-full -rotate-90 transform" viewBox="0 0 64 64">
          <circle cx="32" cy="32" r={radius} className="stroke-gray-100 dark:stroke-white/5" strokeWidth="6" fill="none" />
          <circle 
            cx="32" cy="32" r={radius} className={`${color} transition-all duration-[2000ms]`} 
            strokeWidth="6" fill="none" strokeDasharray={circumference} 
            style={{ strokeDashoffset: offset, strokeLinecap: 'round' }}
          />
       </svg>
       <div className="absolute inset-0 flex items-center justify-center text-[10px] font-black text-gray-800 dark:text-white">
          {Math.round(value)}%
       </div>
    </div>
  );
};

const DashboardOverview = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState<DashboardStats>({
    totalColab: 0,
    alcanceGlobal: 0,
    invTotal: '$0',
    kpisActivos: 0,
    unidades: [],
    distribucion: [],
    pasos: [],
    topPerformers: [],
    riskAreas: [],
    financials: { base: 0, variable: 0 }
  });

  const MES_ACTUAL = 'marzo';

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      
      const { count: countColab } = await supabase.from('colaboradores').select('*', { count: 'exact', head: true });
      const { count: countKPIs } = await supabase.from('metas_indicadores').select('*', { count: 'exact', head: true }).eq('anio', 2026);
      
      const { data: colabsRaw } = await supabase.from('colaboradores').select('id, nombre, unidad_negocio_id, unidades_negocio(nombre)');
      const colabs = (colabsRaw as unknown as ColabWithUnidad[]) || [];

      // 1. Inversión Detallada
      const [{ data: salReg }, { data: comsReg }, { data: intsReg }] = await Promise.all([
        supabase.from('salarios_mensuales').select(MES_ACTUAL).eq('anio', 2026),
        supabase.from('comisiones_directas').select(MES_ACTUAL).eq('anio', 2026),
        supabase.from('otros_ingresos').select(MES_ACTUAL).eq('anio', 2026)
      ]);

      const sum = (arr: any[]) => arr?.reduce((acc, x) => acc + Number(x[MES_ACTUAL] || 0), 0) || 0;
      const baseSalary = sum(salReg || []);
      const variablePay = sum(comsReg || []) + sum(intsReg || []);
      const totalInv = baseSalary + variablePay;
      const formattedInv = totalInv >= 1000000 ? (totalInv / 1000000).toFixed(2) + 'M' : (totalInv/1000).toFixed(0) + 'K';

      // 2. Análisis de Rendimiento (Top & Risks)
      const { data: metasRaw } = await supabase.from('metas_indicadores').select(`colaborador_id, ${MES_ACTUAL}`).eq('anio', 2026);
      const { data: realesRaw } = await supabase.from('alcance_real').select(`colaborador_id, ${MES_ACTUAL}`).eq('anio', 2026);
      const metasMap = Object.fromEntries((metasRaw || []).map(m => [m.colaborador_id, m[MES_ACTUAL]]));
      const realesMap = Object.fromEntries((realesRaw || []).map(r => [r.colaborador_id, r[MES_ACTUAL]]));

      let totalPct = 0, countMeasured = 0;
      const unityStats: Record<string, { total: number, count: number }> = {};
      const calculatedPerformers: any[] = [];
      let riskCount = 0;

      colabs.forEach(c => {
        const meta = Number(metasMap[c.id] || 0);
        const real = Number(realesMap[c.id] || 0);
        if (meta > 0) {
          const pct = Math.min((real / meta) * 100, 150);
          totalPct += pct; countMeasured++;

          calculatedPerformers.push({
            nombre: c.nombre,
            pct: pct,
            unidad: c.unidades_negocio?.nombre || 'General'
          });

          if (pct < 80) riskCount++;

          const uName = c.unidades_negocio?.nombre || 'General';
          if (!unityStats[uName]) unityStats[uName] = { total: 0, count: 0 };
          unityStats[uName].total += pct; unityStats[uName].count++;
        }
      });

      // 3. Pasos de Aprobación
      const { data: pasosRaw } = await supabase.from('pasos_aprobacion').select('*').eq('mes', MES_ACTUAL).eq('anio', 2026);
      const stepsCount = { cap: 0, rev: 0, val: 0, aut: 0 };
      pasosRaw?.forEach(p => {
        if (p.paso_captura) stepsCount.cap++;
        if (p.paso_validacion) stepsCount.rev++;
        if (p.paso_autorizacion) stepsCount.val++;
        if (p.paso_direccion) stepsCount.aut++;
      });

      setStats({
        totalColab: countColab || 0,
        alcanceGlobal: countMeasured > 0 ? totalPct / countMeasured : 0,
        invTotal: '$' + formattedInv,
        kpisActivos: countKPIs || 0,
        unidades: Object.entries(unityStats).map(([name, s]) => ({ 
          name, pct: (s.total / s.count).toFixed(0), count: s.count
        })).sort((a,b) => Number(b.pct) - Number(a.pct)),
        distribucion: Object.entries(unityStats).map(([name, s]) => ({ name, count: s.count })),
        pasos: [
          { label: 'Capturado', completados: stepsCount.cap, total: countColab || 0 },
          { label: 'Revisado', completados: stepsCount.rev, total: countColab || 0 },
          { label: 'Validado', completados: stepsCount.val, total: countColab || 0 },
          { label: 'Autorizado', completados: stepsCount.aut, total: countColab || 0 },
        ],
        topPerformers: calculatedPerformers.sort((a,b) => b.pct - a.pct).slice(0, 5),
        riskAreas: [
          { count: riskCount, label: 'Bajo Rendimiento', color: 'bg-rose-500', sub: '< 80% Meta', icon: TrendingDown },
          { count: countColab ? countColab - stepsCount.aut : 0, label: 'Pendientes', color: 'bg-amber-500', sub: 'Autorización', icon: Clock }
        ],
        financials: { base: baseSalary, variable: variablePay }
      });

    } catch (err) { console.error(err); } finally { setLoading(false); }
  };

  if (loading) return (
    <div className="flex flex-col items-center justify-center h-[70vh] gap-8">
      <div className="w-24 h-24 relative">
        <div className="absolute inset-0 border-8 border-indigo-500/10 rounded-full" />
        <div className="absolute inset-0 border-8 border-indigo-500 border-t-transparent rounded-full animate-spin" />
      </div>
      <p className="text-xs font-black uppercase tracking-[0.5em] text-gray-400 animate-pulse">Optimizando Inteligencia...</p>
    </div>
  );

  return (
    <div className="max-w-[1600px] mx-auto space-y-12 pb-24 animate-in fade-in slide-in-from-bottom-4 duration-1000">
      
      {/* SECCIÓN SUPERIOR: MÉTRICAS MAESTRAS */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
        
        <div 
          onClick={() => navigate('/dashboard/salarios')}
          className="relative group bg-indigo-600 rounded-[56px] p-10 text-white overflow-hidden shadow-2xl shadow-indigo-500/30 cursor-pointer hover:scale-[1.02] transition-all"
        >
          <div className="absolute -right-10 -top-10 w-40 h-40 bg-white/10 rounded-full blur-3xl" />
          <p className="text-[10px] font-black uppercase tracking-[0.3em] opacity-60 mb-2">Presupuesto Ejecutado</p>
          <h2 className="text-5xl font-black tracking-tight">{stats.invTotal}</h2>
          <div className="mt-8 flex items-center justify-between">
            <div className="flex flex-col">
               <span className="text-[10px] font-black text-white/50 uppercase">Base: ${(stats.financials.base / 1000).toFixed(0)}K</span>
               <span className="text-[10px] font-black text-white/50 uppercase">Var: ${(stats.financials.variable / 1000).toFixed(0)}K</span>
            </div>
            <TrendingUp size={24} className="opacity-40" />
          </div>
        </div>

        <GlassCard 
          title="Alcance Global" 
          icon={Target} 
          onClick={() => navigate('/dashboard/alcance')}
          className="flex flex-col justify-between"
        >
          <div className="flex items-end justify-between">
            <h2 className="text-5xl font-black text-gray-800 dark:text-white tracking-tighter leading-none">{Math.round(stats.alcanceGlobal)}%</h2>
            <div className="p-3 bg-emerald-500/10 text-emerald-500 rounded-2xl"><ArrowUpRight size={20} /></div>
          </div>
          <div className="mt-8 h-3 w-full bg-gray-100 dark:bg-white/5 rounded-full overflow-hidden">
            <div className="h-full bg-emerald-500 rounded-full transition-all duration-1000" style={{ width: `${stats.alcanceGlobal}%` }} />
          </div>
        </GlassCard>

        <GlassCard 
          title="Plantilla" 
          icon={Users} 
          onClick={() => navigate('/dashboard/colaboradores')}
          className="flex flex-col justify-between"
        >
           <div className="flex items-end justify-between">
              <h2 className="text-5xl font-black text-gray-800 dark:text-white tracking-tighter leading-none">{stats.totalColab}</h2>
              <span className="text-[10px] font-black text-indigo-500 uppercase tracking-widest">Registros</span>
           </div>
           <p className="text-[10px] font-bold text-gray-400 mt-8 uppercase">Actividad: {(100 - (stats.riskAreas[0]?.count / (stats.totalColab || 1)) * 100).toFixed(0)}% Eficiencia</p>
        </GlassCard>

        <GlassCard 
          title="KPIs Activos" 
          icon={Zap} 
          onClick={() => navigate('/dashboard/indicadores')}
          className="flex flex-col justify-between"
        >
           <div className="flex items-end justify-between">
              <h2 className="text-5xl font-black text-gray-800 dark:text-white tracking-tighter leading-none">{stats.kpisActivos}</h2>
              <span className="text-[10px] font-black text-amber-500 uppercase tracking-widest">Metas</span>
           </div>
           <div className="mt-8 h-1 w-full bg-amber-500/20 rounded-full">
              <div className="h-full w-[100%] bg-amber-500 rounded-full" />
           </div>
        </GlassCard>

      </div>

      {/* SECCIÓN CENTRAL: TOP PERFORMERS & RISK AREAS */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        
        {/* LIDERES DEL MES */}
        <GlassCard title="Líderes del Mes" icon={Trophy} className="lg:col-span-8">
           <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-4 sm:gap-6">
              {stats.topPerformers.map((p, i) => (
                <div key={i} className="flex flex-col items-center group/card p-4 sm:p-6 bg-gray-50 dark:bg-white/5 rounded-[32px] sm:rounded-[40px] border border-transparent hover:border-indigo-500/20 transition-all hover:bg-white dark:hover:bg-[#1a1c22]">
                   <div className="relative">
                      <div className="w-20 h-20 rounded-full bg-gradient-to-br from-indigo-500 to-indigo-700 flex items-center justify-center text-white text-2xl font-black border-4 border-white dark:border-[#0f1117] shadow-xl">
                        {p.nombre.charAt(0)}
                      </div>
                      <div className="absolute -bottom-2 -right-2 p-2 bg-amber-500 text-white rounded-xl shadow-lg border-2 border-white dark:border-[#0f1117]">
                        <Award size={14} />
                      </div>
                   </div>
                   <div className="mt-6 text-center">
                      <p className="text-xs font-black text-gray-800 dark:text-white truncate max-w-[120px]">{p.nombre.split(' ')[0]}</p>
                      <p className="text-[9px] font-bold text-gray-400 uppercase mt-1 leading-none">{p.unidad}</p>
                      <div className="mt-4 px-3 py-1.5 bg-emerald-500/10 text-emerald-500 text-[11px] font-black rounded-xl">
                         {Math.round(p.pct)}%
                      </div>
                   </div>
                </div>
              ))}
           </div>
           <div className="mt-10 p-5 sm:p-6 bg-indigo-500/5 rounded-[32px] border border-indigo-500/10 flex flex-col sm:flex-row items-center justify-between gap-4">
              <div className="flex items-center gap-4">
                 <div className="w-10 h-10 shrink-0 rounded-2xl bg-indigo-500 text-white flex items-center justify-center shadow-lg shadow-indigo-500/20">
                   <Target size={20} />
                 </div>
                 <p className="text-[11px] sm:text-xs font-bold text-gray-600 dark:text-gray-300">Resumen de objetivos superados por el equipo elite.</p>
              </div>
              <button 
                type="button"
                onClick={() => navigate('/dashboard/alcance')}
                className="w-full sm:w-auto text-[10px] font-black uppercase text-indigo-500 tracking-[0.2em] bg-indigo-500/10 sm:bg-transparent py-3 sm:py-0 rounded-xl hover:underline px-4 cursor-pointer whitespace-nowrap"
              >
                Analizar Detalle
              </button>
           </div>
        </GlassCard>

        {/* RISK & NOTIFICATIONS */}
        <GlassCard title="Atención Crítica" icon={AlertTriangle} className="lg:col-span-4 h-full flex flex-col justify-between">
           <div className="space-y-6">
              {stats.riskAreas.map((r, i) => (
                <div 
                  key={i} 
                  onClick={() => navigate('/dashboard/alcance')}
                  className="p-6 bg-gray-50 dark:bg-white/5 rounded-[32px] border-l-4 border-transparent hover:border-l-indigo-500 transition-all flex items-center justify-between cursor-pointer group/risk"
                >
                   <div className="flex items-center gap-4">
                      <div className={`w-12 h-12 rounded-2xl ${r.color} flex items-center justify-center text-white shadow-lg`}>
                         <r.icon size={20} strokeWidth={2.5} />
                      </div>
                      <div>
                         <p className="text-[10px] font-black text-gray-400 uppercase leading-none mb-1">{r.label}</p>
                         <p className="text-xl font-black text-gray-800 dark:text-white flex items-baseline gap-1.5">
                           {r.count} 
                           <span className="text-[9px] font-bold opacity-40 uppercase tracking-tighter">{r.sub}</span>
                         </p>
                      </div>
                   </div>
                   <ArrowUpRight size={16} className="text-gray-300 group-hover/risk:text-indigo-500 transition-colors" />
                </div>
              ))}
           </div>
           <div className="mt-8 p-6 bg-rose-500 rounded-[32px] text-white flex items-center gap-4 shadow-xl shadow-rose-500/20">
              <AlertTriangle size={24} className="opacity-60" />
              <p className="text-[10px] font-black uppercase tracking-widest leading-relaxed">Requiere revisión inmediata de metas para {stats.riskAreas[0]?.count} perfiles.</p>
           </div>
        </GlassCard>

      </div>

      {/* SECCIÓN INFERIOR: PIPELINE & RANKING UNIDADES */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
         <GlassCard title="Ranking Operativo" icon={Layers} className="lg:col-span-5 h-full">
            <div className="space-y-6">
              {stats.unidades.map((u, i) => (
                <div key={i} className="flex items-center gap-5 group/u">
                  <div className={`w-10 h-10 rounded-xl flex items-center justify-center font-black text-xs ${i === 0 ? 'bg-amber-500 text-white' : 'bg-gray-100 dark:bg-white/5 text-gray-400'}`}>
                    {i + 1}
                  </div>
                  <div className="flex-1">
                    <div className="flex justify-between items-baseline mb-2">
                      <p className="text-[10px] font-black uppercase text-gray-500 tracking-tight">{u.name}</p>
                      <span className="text-xs font-black text-gray-800 dark:text-white">{u.pct}%</span>
                    </div>
                    <div className="h-1.5 w-full bg-gray-100 dark:bg-white/5 rounded-full overflow-hidden">
                      <div className="h-full bg-indigo-500 rounded-full transition-all duration-1000" style={{ width: `${u.pct}%` }} />
                    </div>
                  </div>
                </div>
              ))}
            </div>
         </GlassCard>

         <GlassCard title="Monitor del Corte" icon={ShieldCheck} className="lg:col-span-7">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
               {stats.pasos.map((p, i) => {
                 const pct = (p.completados / (p.total || 1)) * 100;
                 return (
                   <div key={i} className="flex flex-col items-center gap-4 text-center">
                      <MiniRing value={pct} color={i === 3 ? "stroke-emerald-500" : "stroke-indigo-500"} />
                      <div>
                         <p className="text-[9px] font-black uppercase text-gray-400 tracking-tight mb-1">{p.label}</p>
                         <p className="text-xl font-black text-gray-800 dark:text-white leading-none">{p.completados}</p>
                      </div>
                   </div>
                 );
               })}
            </div>
         </GlassCard>
      </div>

    </div>
  );
};

export default function Dashboard() {
  const { signOut } = useAuth();
  useEffect(() => { document.title = 'Avanta Media - Inteligencia Estratégica'; }, []);

  return (
    <div className="min-h-screen relative z-0 flex bg-[#fdfdfe] dark:bg-[#06070a]">
      <Sidebar onLogout={signOut} />
      <main className="flex-1 min-w-0 overflow-x-hidden transition-all duration-[400ms] lg:pl-[120px] pt-20 px-4 pb-6 lg:pt-16 lg:px-16 lg:pb-16">
        
        {/* TITULO CONGELADO */}
        <div className="max-w-[1600px] mx-auto mb-16">
           <h1 className="text-[11px] font-black text-indigo-500 uppercase tracking-[0.6em] mb-4">Inteligencia de Negocio</h1>
           <h2 className="text-7xl font-black text-gray-800 dark:text-white tracking-tighter leading-none mb-2">Panel de <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-500 to-emerald-500">Control</span></h2>
           <p className="text-gray-400 font-medium text-lg tracking-tight">Supervisión táctica de compensaciones y rendimiento operativo.</p>
        </div>

        <Routes>
          <Route path="colaboradores" element={<Colaboradores />} />
          <Route path="indicadores" element={<Indicadores />} />
          <Route path="salarios" element={<Salarios />} />
          <Route path="alcance" element={<Alcance />} />
          <Route path="comisiones-directas" element={<ComisionesDirectas />} />
          <Route path="otros-ingresos" element={<OtrosIngresos />} />
          <Route path="unidad-negocio" element={<UnidadesNegocio />} />
          <Route path="perfiles" element={<PerfilesSeguridad />} />
          <Route path="usuarios" element={<Usuarios />} />
          <Route path="bonos" element={<Bonos />} />
          <Route path="carga-masiva" element={<CargaMasiva />} />
          <Route path="covas" element={<ImprimirCovas />} />
          <Route path="/" element={<DashboardOverview />} />
        </Routes>
        <Outlet />
      </main>
    </div>
  );
}
