import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { Loader2, Download, FileText, ChevronRight, Filter, AlertCircle } from 'lucide-react';
import { calculateBonoPercent } from '../utils/covasLogic';

const MESES = ['enero', 'febrero', 'marzo', 'abril', 'mayo', 'junio', 'julio', 'agosto', 'septiembre', 'octubre', 'noviembre', 'diciembre'] as const;

export default function ImprimirCovas() {
  const [generating, setGenerating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [dataReady, setDataReady] = useState(false);
  const [processedData, setProcessedData] = useState<any[]>([]);
  
  // Filtros
  const [mes, setMes] = useState<typeof MESES[number]>(MESES[new Date().getMonth()]);
  const [anio] = useState(2026);
  const [unidadId, setUnidadId] = useState<string>('');
  const [unidades, setUnidades] = useState<{id: number, nombre: string}[]>([]);

  useEffect(() => {
    fetchUnidades();
  }, []);

  const fetchUnidades = async () => {
    const { data } = await supabase.from('unidades_negocio').select('id, nombre');
    if (data) setUnidades(data);
  };

  const processDataForPDF = async () => {
    try {
      setGenerating(true);
      setError(null);
      setDataReady(false);

      // 1. Obtener colaboradores activos
      let query = supabase
        .from('colaboradores')
        .select(`
          *,
          unidades_negocio:unidad_negocio_id(nombre)
        `)
        .eq('esta_activo', true);
      
      if (unidadId) {
        query = query.eq('unidad_negocio_id', parseInt(unidadId));
      }

      const { data: cols, error: errCols } = await query;
      if (errCols) throw errCols;
      if (!cols || cols.length === 0) throw new Error("No hay colaboradores activos que coincidan con los filtros.");

      const colIds = cols.map(c => c.id);

      // 2. Obtener Salarios fijos para el año seleccionado
      const { data: salariosData } = await supabase
        .from('salarios_mensuales')
        .select('*')
        .in('colaborador_id', colIds)
        .eq('anio', anio);

      // 3. Obtener Metas de Indicadores
      const { data: metasData } = await supabase
        .from('metas_indicadores')
        .select('*')
        .in('colaborador_id', colIds)
        .eq('anio', anio);

      // 4. Obtener Alcance Real
      const { data: alcancesData } = await supabase
        .from('alcance_real')
        .select('*')
        .in('colaborador_id', colIds)
        .eq('anio', anio);

      // 5. Obtener Otros Ingresos (Bonos) para el periodo
      // Supongamos que otros_ingresos tiene fecha_registro y extraemos mes/anio
      // O si tiene columnas mes/anio (depende de cómo se implementó antes)
      // Reviso otros_ingresos structure: id, colaborador_id, bono_id, monto, fecha_pago, anio, mes
      const { data: bonosData } = await supabase
        .from('otros_ingresos')
        .select('*')
        .in('colaborador_id', colIds)
        .eq('anio', anio);

      // 6. Cruzar y Procesar
      const finalReport = cols.map(col => {
        const salarioRow = salariosData?.find(s => s.colaborador_id === col.id);
        const sueldoM = salarioRow ? (salarioRow as any)[mes] : 0;

        // Comisiones (Indicadores)
        const misMetas = metasData?.filter(m => m.colaborador_id === col.id) || [];
        const misAlcances = alcancesData?.find(a => a.colaborador_id === col.id);
        
        const comisiones = misMetas.map(m => {
          const metaVal = (m as any)[mes] || 0;
          const alcanceVal = misAlcances ? (misAlcances as any)[mes] : 0;
          const pct = metaVal > 0 ? (alcanceVal / metaVal) * 100 : 0;
          
          // Lógica de Brackets 2026
          const bonoPct = calculateBonoPercent(pct);
          // Suponiendo que el bono base es 400 (ejemplificado en la imagen 2) o viene de la meta
          // Por ahora calcularemos 400 * bonoPct como ejemplo, o si hay un 'monto_bono' en la tabla
          const comisionCalc = 400 * bonoPct; 
          
          return {
            nombre: m.nombre_indicador,
            meta: metaVal,
            alcance: alcanceVal,
            pct: pct,
            comision: comisionCalc
          };
        });

        // Bonos
        const misBonos = bonosData?.filter(b => b.colaborador_id === col.id && (b as any)[mes] > 0).map(b => ({
          nombre: b.nombre_concepto || 'Bono General',
          monto: (b as any)[mes] || 0
        })) || [];

        const totalVariable = comisiones.reduce((s, c) => s + c.comision, 0) + misBonos.reduce((s, b) => s + b.monto, 0);

        return {
          ...col,
          sueldoMensual: sueldoM,
          comisiones,
          bonos: misBonos,
          totalVariable
        };
      });

      setProcessedData(finalReport);
      setDataReady(true);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setGenerating(false);
    }
  };

  return (
    <div className="max-w-6xl mx-auto space-y-8 animate-in fade-in duration-700">
      {/* Header Estilizado */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
        <div className="space-y-2">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-indigo-500/10 border border-indigo-500/20 text-indigo-500 text-[10px] font-bold uppercase tracking-wider">
            Reportes Corporativos
          </div>
          <h1 className="text-4xl font-black text-gray-800 dark:text-white tracking-tight">
            Impresión de COVAS
          </h1>
          <p className="text-gray-500 dark:text-gray-400 max-w-lg">
            Genera el Plan de Compensación Variable oficial en formato PDF premium. 
            Incluye desgloses de metas, indicadores y bonos mensuales.
          </p>
        </div>
        
        <div className="bg-white/50 dark:bg-black/20 backdrop-blur-md p-2 rounded-[24px] border border-gray-100 dark:border-white/10 flex gap-2">
           <div className="flex flex-col items-center px-4 py-2 bg-indigo-500/10 rounded-2xl border border-indigo-500/20">
              <span className="text-[10px] font-bold text-gray-400 uppercase">Año</span>
              <span className="text-lg font-black text-indigo-600 dark:text-indigo-400">2026</span>
           </div>
           <div className="flex flex-col items-center px-4 py-2">
              <span className="text-[10px] font-bold text-gray-400 uppercase">Plantilla</span>
              <span className="text-lg font-black text-gray-800 dark:text-white">COVAS v2</span>
           </div>
        </div>
      </div>

      {/* Panel de Configuración */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 bg-white/40 dark:bg-black/20 backdrop-blur-xl border border-white/40 dark:border-white/10 rounded-[32px] p-8 shadow-xl">
           <h3 className="text-lg font-bold text-gray-800 dark:text-white mb-6 flex items-center gap-2">
             <Filter size={20} className="text-indigo-500" />
             Configuración del Reporte
           </h3>

           <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              <div className="space-y-2">
                <label className="text-xs font-bold text-gray-400 uppercase ml-2">Mes de Reporte</label>
                <div className="grid grid-cols-4 gap-2">
                  {MESES.map(m => (
                    <button
                      key={m}
                      onClick={() => { setMes(m); setDataReady(false); }}
                      className={`py-2 rounded-xl text-[10px] font-bold uppercase transition-all border ${mes === m ? 'bg-indigo-600 border-indigo-600 text-white shadow-lg shadow-indigo-500/30' : 'bg-white dark:bg-white/5 border-gray-100 dark:border-white/5 text-gray-500 hover:border-indigo-500/50'}`}
                    >
                      {m.substring(0, 3)}
                    </button>
                  ))}
                </div>
              </div>

              <div className="space-y-6">
                <div className="space-y-2">
                   <label className="text-xs font-bold text-gray-400 uppercase ml-2">Unidad de Negocio</label>
                   <select
                     value={unidadId}
                     onChange={(e) => { setUnidadId(e.target.value); setDataReady(false); }}
                     className="w-full px-4 py-3 bg-white dark:bg-[#1a1f2e] border border-gray-100 dark:border-white/5 rounded-2xl text-sm dark:text-white outline-none focus:ring-4 focus:ring-indigo-500/20 transition-all cursor-pointer appearance-none"
                   >
                     <option value="">Todas las unidades</option>
                     {unidades.map(u => <option key={u.id} value={u.id}>{u.nombre}</option>)}
                   </select>
                </div>

                <div className="pt-4">
                  {!dataReady ? (
                    <button
                      onClick={processDataForPDF}
                      disabled={generating}
                      className="w-full py-4 bg-gray-900 dark:bg-white text-white dark:text-black rounded-2xl font-bold flex items-center justify-center gap-3 hover:scale-[1.02] active:scale-[0.98] transition-all disabled:opacity-50 shadow-xl"
                    >
                      {generating ? <Loader2 className="animate-spin" /> : <FileText size={20} />}
                      {generating ? 'Procesando Datos...' : 'Preparar Documento'}
                    </button>
                  ) : (
                    <div className="space-y-4">
                      <div className="flex items-center gap-3 p-4 bg-green-500/10 border border-green-500/20 rounded-2xl text-green-600 dark:text-green-400">
                        <div className="w-8 h-8 rounded-full bg-green-500 flex items-center justify-center text-white shrink-0">
                          <Download size={16} />
                        </div>
                        <div>
                          <p className="text-xs font-bold">Documento Listo</p>
                          <p className="text-[10px] opacity-80">Se procesaron {processedData.length} colaboradores correctamente.</p>
                        </div>
                      </div>

                      <button
                        onClick={() => {}}
                        className="w-full py-4 bg-indigo-300 dark:bg-indigo-900/50 text-white/50 rounded-2xl font-bold flex items-center justify-center gap-3 cursor-not-allowed shadow-none"
                      >
                        <Download size={20} />
                        Descargar PDF Corporativo (Desactivado)
                      </button>
                      
                      <button 
                        onClick={() => setDataReady(false)}
                        className="w-full py-2 text-[10px] font-bold text-gray-400 uppercase hover:text-indigo-500 transition-colors"
                      >
                        Limpiar y Cambiar Filtros
                      </button>
                    </div>
                  )}
                </div>
              </div>
           </div>

           {error && (
             <div className="mt-6 p-4 bg-red-500/10 border border-red-500/20 rounded-2xl flex items-center gap-3 text-red-600 dark:text-red-400">
               <AlertCircle size={20} />
               <p className="text-sm font-medium">{error}</p>
             </div>
           )}
        </div>

        {/* Preview / Tips */}
        <div className="bg-gradient-to-tr from-indigo-600 to-violet-700 rounded-[32px] p-8 text-white shadow-2xl relative overflow-hidden group">
           <div className="absolute top-0 right-0 p-8 opacity-10 group-hover:scale-110 transition-transform duration-700">
             <FileText size={180} />
           </div>
           
           <div className="relative z-10 space-y-6">
             <div className="w-12 h-12 rounded-2xl bg-white/20 flex items-center justify-center backdrop-blur-md border border-white/30">
               <FileText size={24} />
             </div>
             <div>
               <h4 className="text-xl font-bold">¿Qué incluye el PDF?</h4>
               <div className="mt-4 space-y-3">
                 {[
                   'Portada de COVAS 2026.',
                   'Índice dinámico de personal.',
                   'Separadores por Unidad de Negocio.',
                   'Cédulas individuales detalladas.',
                   'Sección de firmas regulatorias.'
                 ].map((tip, i) => (
                   <div key={i} className="flex items-center gap-2 text-sm opacity-90">
                     <ChevronRight size={14} className="text-cyan-400" />
                     {tip}
                   </div>
                 ))}
               </div>
             </div>
             
             <div className="pt-6 border-t border-white/10">
               <p className="text-[10px] font-bold uppercase tracking-widest text-indigo-200">Requerimiento</p>
               <p className="text-xs mt-1 text-white/80 leading-relaxed">
                 Asegúrate de que los indicadores y alcances del mes de <strong>{mes}</strong> estén capturados y validados para un reporte preciso.
               </p>
             </div>
           </div>
        </div>
      </div>
    </div>
  );
}
