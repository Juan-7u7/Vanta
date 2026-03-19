/** final 1.0 */
import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { Loader2, Download, FileText, ChevronRight, Filter, AlertCircle } from 'lucide-react';
import { aplicarAjustePorGrupo } from '../utils/covasLogic';
import { PDFDownloadLink } from '@react-pdf/renderer';
import { CovasDocument } from '../services/CovasPDFGenerator';
import { getColaboradorDataForReport, getColaboradorDataForQuarter } from '../services/CovasGenerator';

const MESES = ['enero', 'febrero', 'marzo', 'abril', 'mayo', 'junio', 'julio', 'agosto', 'septiembre', 'octubre', 'noviembre', 'diciembre'] as const;
const QUARTERS = [
  { id: 'Q1', label: 'Q1 (ene - mar)', months: ['enero', 'febrero', 'marzo'] },
  { id: 'Q2', label: 'Q2 (abr - jun)', months: ['abril', 'mayo', 'junio'] },
  { id: 'Q3', label: 'Q3 (jul - sep)', months: ['julio', 'agosto', 'septiembre'] },
  { id: 'Q4', label: 'Q4 (oct - dic)', months: ['octubre', 'noviembre', 'diciembre'] },
] as const;

type PeriodoTipo = 'mes' | 'trimestre';

export default function ImprimirCovas() {
  const [generating, setGenerating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [dataReady, setDataReady] = useState(false);
  const [processedData, setProcessedData] = useState<any[]>([]);
  const [pdfRequested, setPdfRequested] = useState(false);
  
  // Filtros
  const [periodoTipo, setPeriodoTipo] = useState<PeriodoTipo>('mes');
  const [mes, setMes] = useState<typeof MESES[number]>(MESES[new Date().getMonth()]);
  const defaultQuarter = QUARTERS[Math.floor(new Date().getMonth() / 3)].id;
  const [quarterId, setQuarterId] = useState<(typeof QUARTERS)[number]['id']>(defaultQuarter);
  const [periodoLabel, setPeriodoLabel] = useState<string>(mes);
  const [anio] = useState(2026);
  const [unidadId, setUnidadId] = useState<string>('');
  const [unidades, setUnidades] = useState<{id: number, nombre: string}[]>([]);
  const selectedQuarter = QUARTERS.find(q => q.id === quarterId)!;
  const [showResultados, setShowResultados] = useState(false);

  useEffect(() => {
    fetchUnidades();
  }, []);

  const fetchUnidades = async () => {
    const { data } = await supabase.from('unidades_negocio').select('id, nombre');
    if (data) setUnidades(data);
  };

  const formatCurrency = (n: number) => new Intl.NumberFormat('es-MX',{style:'currency',currency:'MXN'}).format(n || 0);
  const toQuarter = (p: string) => {
    const pm = p.toLowerCase();
    if (pm.startsWith('q1')) return 'Q1';
    if (pm.startsWith('q2')) return 'Q2';
    if (pm.startsWith('q3')) return 'Q3';
    if (pm.startsWith('q4')) return 'Q4';
    const idx = MESES.findIndex(m => m === pm || m === p);
    if (idx >= 0) return ['Q1','Q1','Q1','Q2','Q2','Q2','Q3','Q3','Q3','Q4','Q4','Q4'][idx];
    return 'Q?';
  };

  const openResultsTab = (data: any[], periodo: string, year: number) => {
    const win = window.open('', '_blank');
    if (!win) return;
    const rowsHtml = data.map(col => {
      const totalBonos = col.totales?.subtotalBonos || 0;
      const otros = col.totales?.totalOtrosIngresos || 0;
      const anticipos = col.anticipos_aplicables || 0;
      const saldoArr = col.saldo_pendiente_arrastrado || 0;
      const sueldoBase = col.sueldoBase || 0;
      const totalPercepcion = sueldoBase + totalBonos + otros - anticipos + saldoArr;
      const qMark = toQuarter(periodo);
      const qCols: Record<string,string> = { Q1:'-',Q2:'-',Q3:'-',Q4:'-',TOTAL: formatCurrency(totalPercepcion) };
      if (['Q1','Q2','Q3','Q4'].includes(qMark)) qCols[qMark] = formatCurrency(totalPercepcion);

      const comiRows = (col.comisiones || []).map((c: any, idx: number) => `
        <tr>
          <td>${idx+1}</td>
          <td>${c.nombre || '-'}</td>
          <td class="num">${c.meta?.toLocaleString('es-MX') || '-'}</td>
          <td class="num">${c.alcance?.toLocaleString('es-MX') || '-'}</td>
          <td class="num">${(c.cumplimiento || 0).toFixed(1)}%</td>
          <td class="num">${c.porcentajePago !== undefined ? c.porcentajePago+'%' : '-'}</td>
          <td class="num">${formatCurrency(c.montoBono || 0)}</td>
        </tr>
      `).join('');

      return `
      <section class="sheet">
        <header class="header">
          <div class="title">PLAN DE COMPENSACIÓN VARIABLE</div>
          <div class="year">${year}</div>
        </header>

        <table class="frame">
          <tr class="row-legend">
            <td class="label wide" colspan="2">CAPITAL HUMANO</td>
            <td class="label">1Q</td><td class="label">2Q</td><td class="label">3Q</td><td class="label">4Q</td><td class="label">TOTAL</td>
          </tr>
          <tr>
            <td class="sub" colspan="2">SUELDO FIJO MENSUALIZADO</td>
            <td class="num">${qCols.Q1}</td>
            <td class="num">${qCols.Q2}</td>
            <td class="num">${qCols.Q3}</td>
            <td class="num">${qCols.Q4}</td>
            <td class="num strong">${qCols.TOTAL}</td>
          </tr>
          <tr>
            <td class="sub" colspan="2">BONO TOTAL (antes anticipos)</td>
            <td colspan="5" class="num">${formatCurrency(totalBonos)}</td>
          </tr>
         <tr>
            <td class="sub" colspan="2">OTROS INGRESOS</td>
            <td colspan="5" class="num">${formatCurrency(otros)}</td>
          </tr>
          <tr>
            <td class="sub" colspan="2">SALDO ARRASTRADO</td>
            <td colspan="5" class="num">${formatCurrency(saldoArr)}</td>
          </tr>
          <tr class="total-row">
            <td class="sub" colspan="2">TOTAL PERCEPCIÓN ESTIMADA</td>
            <td class="num">${qCols.Q1}</td>
            <td class="num">${qCols.Q2}</td>
            <td class="num">${qCols.Q3}</td>
            <td class="num">${qCols.Q4}</td>
            <td class="num strong">${qCols.TOTAL}</td>
          </tr>
          <tr class="block-title-row">
            <td colspan="7">DETALLE DE INDICADORES</td>
          </tr>
          <tr>
            <td colspan="7">
              <table class="detail">
                <colgroup>
                  <col style="width:6%"><col style="width:34%"><col style="width:12%"><col style="width:12%"><col style="width:12%"><col style="width:12%"><col style="width:12%">
                </colgroup>
                <thead>
                  <tr><th>#</th><th>Indicador</th><th>Meta</th><th>Alcance</th><th>% Cumpl.</th><th>% Pago</th><th>Bono</th></tr>
                </thead>
                <tbody>
                  ${comiRows || `<tr><td colspan="7" class="empty">Sin indicadores</td></tr>`}
                </tbody>
              </table>
            </td>
          </tr>
        </table>

        <div class="footnotes">
          <p><strong>Colaborador:</strong> ${col.nombre} &nbsp;|&nbsp; <strong>Puesto:</strong> ${col.puesto || '-'} &nbsp;|&nbsp; <strong>Matrícula:</strong> ${col.matricula || '-'}</p>
          <p>Periodo: ${periodo} &nbsp;|&nbsp; Otros ingresos: ${formatCurrency(otros)}</p>
        </div>

        <div class="notes">
          <ol>
            <li>La empresa se reserva el derecho de cambiar o modificar el plan de compensación de acuerdo a la situación de la empresa, conducta y desempeño del titular.</li>
            <li>Calculado y pagadero mensual, trimestral y anualmente según sea el caso.</li>
            <li>Trimestralmente se informará a Consejo la compensación obtenida por el periodo evaluado.</li>
            <li>Para el pago de este plan será condición NO NEGOCIABLE, contar con los soportes de los resultados debidamente autorizados.</li>
            <li>El pago del presente esquema de compensación variable, estará sujeto a que el EBITDA sea igual o mayor al año anterior en los casos que el esquema no sea por EBITDA.</li>
            <li>En este esquema de COVA solo participan los titulares que tengan 90 días cubiertos en el trimestre.</li>
            <li>Se entiende que los cálculos trimestrales son anticipos del COVA anual, en dado caso que el cálculo anual sea diferente a los anticipos.</li>
            <li>El pago de este esquema será en un periodo de 8 semanas después del cierre al periodo evaluado.</li>
          </ol>
        </div>
      </section>
      `;
    }).join('');

    const indexRows = data.map((col, i) => `
      <tr>
        <td class="num">${i + 1}</td>
        <td>${col.nombre || '-'}</td>
        <td>${col.puesto || '-'}</td>
        <td>${col.matricula || '-'}</td>
        <td>${(col.unidades_negocio && col.unidades_negocio.nombre) || (col.unidad_negocio && col.unidad_negocio.nombre) || col.unidad || '-'}</td>
      </tr>
    `).join('');

    const coverHtml = `
      <section class="sheet cover">
        <div class="cover-overlay">
          <div class="brand">vanta <span class="brand-accent">media</span></div>
          <div class="cover-center">
            <div class="cover-title">COVAS</div>
            <div class="cover-year">${year}</div>
            <div class="cover-periodo">${periodo}</div>
          </div>
        </div>
      </section>
    `;

    const indexHtml = `
      <section class="sheet index">
        <header class="header">
          <div class="title">ÍNDICE DE COLABORADORES</div>
          <div class="year">${year}</div>
        </header>
        <table class="index-table">
          <thead>
            <tr><th>#</th><th>Colaborador</th><th>Puesto</th><th>Matrícula</th><th>Unidad</th></tr>
          </thead>
          <tbody>
            ${indexRows}
          </tbody>
        </table>
      </section>
    `;

    const content = `
      <html>
      <head>
        <title>Resultados COVAS ${periodo} ${year}</title>
        <style>
          @page { size: A4; margin: 0; }
          html, body{ width:100%; height:100%; margin:0; padding:0;}
          body{
            font-family: 'Inter', system-ui, -apple-system, sans-serif;
            background:#0b1224;
            -webkit-print-color-adjust: exact;
            print-color-adjust: exact;
          }
          .sheet{
            background:#fff;
            padding:18px 22px;
            margin:12px auto;
            width:794px;  /* A4 width at 96dpi */
            max-width:794px;
            min-height:1123px; /* A4 height at 96dpi */
            box-shadow:0 12px 30px rgba(0,0,0,0.08);
            border:1px solid #111827;
            box-sizing:border-box;
            page-break-after: always;
          }
          .cover{
            padding:0;
            width:794px;
            max-width:794px;
            height:1123px;
            border:none;
            box-shadow:none;
            page-break-after: always;
            overflow:hidden;
          }
          .cover-overlay{
            height:100%;
            max-height:1123px;
            border-radius:12px;
            padding:80px 70px;
            color:#f8fafc;
            background: radial-gradient(circle at 18% 20%, rgba(124,58,237,0.45), transparent 35%),
                        radial-gradient(circle at 85% 25%, rgba(14,165,233,0.35), transparent 40%),
                        linear-gradient(145deg, #0b1224 0%, #161e35 45%, #0c2432 100%);
            display:flex; flex-direction:column; align-items:center; justify-content:center; gap:20px;
            box-sizing:border-box;
          }
          .brand{font-size:44px; font-weight:800; letter-spacing:0.05em; text-transform:lowercase;}
          .brand-accent{color:#7de2ff;}
          .cover-center{text-align:center; margin-top:40px;}
          .cover-title{font-size:92px; font-weight:900; letter-spacing:0.08em;}
          .cover-year{font-size:38px; font-weight:700; letter-spacing:0.14em; margin-top:8px;}
          .cover-periodo{font-size:22px; font-weight:600; letter-spacing:0.06em; color:#c7e7ff; margin-top:4px;}
          .header{display:flex; justify-content:space-between; align-items:center; border-bottom:2px solid #111827; padding-bottom:8px;}
          .title{font-size:18px; font-weight:900; letter-spacing:0.04em;}
          .year{font-size:20px; font-weight:900;}
          table{width:100%; border-collapse:collapse;}
          .index-table{margin-top:14px;}
          .index-table th{background:#111827; color:#fff; padding:8px; text-align:left; letter-spacing:0.04em;}
          .index-table td{padding:8px; border-bottom:1px solid #e5e7eb; font-size:12px;}
          .index-table tr:nth-child(even){background:#f8fafc;}
          .frame{border:1px solid #111827;}
          .frame td{border:1px solid #111827; padding:6px 8px; font-size:12px;}
          .row-legend td{font-weight:800; background:#f4f4f5; text-align:center;}
          .label{text-align:center;}
          .wide{text-align:left;}
          .sub{font-weight:700;}
          .meta{font-size:11px; text-align:center;}
          .detail{table-layout:fixed;}
          .detail th{background:#111827; color:#fff; padding:6px 8px; font-size:12px; text-align:center;}
          .detail td{padding:6px 8px; font-size:12px; border-bottom:1px solid #e5e7eb; text-align:center;}
          .num{text-align:center;}
          .neg{color:#b91c1c;}
          .strong{font-weight:800; color:#111827;}
          .block-title{margin:12px 0 6px; font-size:13px; font-weight:800; letter-spacing:0.03em;}
          .block-title-row td{background:#111827; color:#fff; text-align:center; font-weight:800;}
          .empty{text-align:center; color:#9ca3af;}
          .notes{font-size:11px; color:#4b5563; margin-top:10px;}
          .notes ul{margin:4px 0 0 16px; padding:0;}
          .notes li{margin-bottom:3px;}
          .total-row td{font-weight:800; background:#f9fafb;}
          .footnotes{font-size:11px; color:#374151; margin-top:8px;}
          #print-btn{
            position:fixed; top:16px; right:16px; z-index:9999;
            background:#111827; color:#fff; border:none; border-radius:12px;
            padding:10px 14px; font-weight:800; letter-spacing:0.03em;
            box-shadow:0 8px 20px rgba(0,0,0,0.25); cursor:pointer;
          }
          #print-btn:hover{background:#0b1224;}
          @media print{
            #print-btn{display:none;}
            body{background:#fff; padding:0;}
            .sheet{margin:0 auto; box-shadow:none; border:1px solid #e5e7eb;}
          }
        </style>
      </head>
      <body>
        <button id="print-btn" onclick="window.print()">Descargar PDF</button>
        ${coverHtml}${indexHtml}${rowsHtml}
      </body>
      </html>
    `;
    win.document.write(content);
    win.document.close();
  };

  const processDataForPDF = async () => {
    try {
      setGenerating(true);
      setError(null);
      setDataReady(false);

      // 1. Obtener IDs de colaboradores segun filtros
      let query = supabase.from('colaboradores').select('id').eq('esta_activo', true);
      if (unidadId) query = query.eq('unidad_negocio_id', parseInt(unidadId));

      const { data: cols, error: errCols } = await query;
      if (errCols) throw errCols;
      if (!cols || cols.length === 0) throw new Error("No hay colaboradores activos.");

      const selectedQuarter = QUARTERS.find(q => q.id === quarterId)!;
      const labelPeriodo = periodoTipo === 'mes' ? mes : selectedQuarter.label;
      setPeriodoLabel(labelPeriodo);

      // 2. Obtener datos detallados usando el servicio centralizado (mes o trimestre)
      // Esto garantiza que traigamos las firmas, metas y alcances correctamente calculados.
      const reports = await Promise.all(
        cols.map(c => periodoTipo === 'mes'
          ? getColaboradorDataForReport(c.id, mes, anio)
          : getColaboradorDataForQuarter(c.id, selectedQuarter.months as any, anio)
        )
      );

      // Filtrar los que fallaron (null)
      const finalReport = reports.filter(r => r !== null);

      if (finalReport.length === 0) throw new Error("No se pudo obtener informacion de los colaboradores.");

      setProcessedData(finalReport);
      setDataReady(true);
      setPdfRequested(false);
      setShowResultados(false); // ocultar panel de resultados
      openResultsTab(finalReport, labelPeriodo, anio);
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
            Impresion de COVAS
          </h1>
          <p className="text-gray-500 dark:text-gray-400 max-w-lg">
            Genera el Plan de Compensacion Variable oficial en formato PDF premium. 
            Incluye desgloses de metas, indicadores y bonos por mes o por trimestre.
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

      {/* Panel de Configuracion */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 bg-white/40 dark:bg-black/20 backdrop-blur-xl border border-white/40 dark:border-white/10 rounded-[32px] p-8 shadow-xl">
           <h3 className="text-lg font-bold text-gray-800 dark:text-white mb-6 flex items-center gap-2">
             <Filter size={20} className="text-indigo-500" />
              Configuracion del Reporte
           </h3>

           <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              <div className="space-y-4">
                <label className="text-xs font-bold text-gray-400 uppercase ml-2">Tipo de periodo</label>
                <div className="flex gap-2">
                  <button
                    onClick={() => { setPeriodoTipo('mes'); setPeriodoLabel(mes); setDataReady(false); }}
                    className={`flex-1 py-3 rounded-2xl font-bold text-sm border transition-all ${periodoTipo === 'mes' ? 'bg-indigo-600 border-indigo-600 text-white shadow-lg shadow-indigo-500/30' : 'bg-white dark:bg-white/5 border-gray-100 dark:border-white/5 text-gray-500 hover:border-indigo-500/50'}`}
                  >
                    Mes
                  </button>
                  <button
                    onClick={() => { setPeriodoTipo('trimestre'); setPeriodoLabel(selectedQuarter.label); setDataReady(false); }}
                    className={`flex-1 py-3 rounded-2xl font-bold text-sm border transition-all ${periodoTipo === 'trimestre' ? 'bg-indigo-600 border-indigo-600 text-white shadow-lg shadow-indigo-500/30' : 'bg-white dark:bg-white/5 border-gray-100 dark:border-white/5 text-gray-500 hover:border-indigo-500/50'}`}
                  >
                    Trimestre (Q)
                  </button>
                </div>

                {periodoTipo === 'mes' ? (
                  <div className="space-y-2">
                    <label className="text-xs font-bold text-gray-400 uppercase ml-2">Mes de Reporte</label>
                    <div className="grid grid-cols-4 gap-2">
                      {MESES.map(m => (
                        <button
                          key={m}
                          onClick={() => { setMes(m); setPeriodoLabel(m); setDataReady(false); }}
                          className={`py-2 rounded-xl text-[10px] font-bold uppercase transition-all border ${mes === m ? 'bg-indigo-600 border-indigo-600 text-white shadow-lg shadow-indigo-500/30' : 'bg-white dark:bg-white/5 border-gray-100 dark:border-white/5 text-gray-500 hover:border-indigo-500/50'}`}
                        >
                          {m.substring(0, 3)}
                        </button>
                      ))}
                    </div>
                  </div>
                ) : (
                  <div className="space-y-2">
                    <label className="text-xs font-bold text-gray-400 uppercase ml-2">Trimestre</label>
                    <div className="grid grid-cols-2 gap-2">
                      {QUARTERS.map(q => (
                        <button
                          key={q.id}
                          onClick={() => { setQuarterId(q.id); setPeriodoLabel(q.label); setDataReady(false); }}
                          className={`p-3 rounded-2xl text-left border transition-all ${quarterId === q.id ? 'bg-indigo-600 border-indigo-600 text-white shadow-lg shadow-indigo-500/30' : 'bg-white dark:bg-white/5 border-gray-100 dark:border-white/5 text-gray-500 hover:border-indigo-500/50'}`}
                        >
                          <div className="text-[11px] font-black uppercase">{q.id}</div>
                          <div className="text-[10px] opacity-80">{q.label}</div>
                        </button>
                      ))}
                    </div>
                  </div>
                )}
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
                      {generating ? 'Calculando Reportes...' : 'Calcular y Validar Datos'}
                    </button>
                  ) : (
                    <div className="space-y-4">
                      <div className="p-4 bg-indigo-500/5 border border-indigo-500/20 rounded-2xl">
                        <p className="text-[10px] font-bold text-indigo-500 uppercase mb-3">Resumen de Calculos</p>
                        <div className="space-y-2 max-h-40 overflow-y-auto pr-2 custom-scrollbar">
                          {processedData.map((col, i) => {
                            const totalBonos = col.comisiones.reduce((acc: number, c: any) => acc + (c.montoBono || 0), 0);
                            const totalOtros = (col.otrosIngresos || []).reduce((acc: number, o: any) => acc + (o.monto || 0), 0);
                            const resAjuste = aplicarAjustePorGrupo(col.comisiones.map((c: any) => ({
                              montoBono: c.montoBono,
                              cumplimiento: c.cumplimiento
                            })));
                            const totalFinal = col.sueldoBase + totalBonos + totalOtros + resAjuste.ajuste;
                            
                            return (
                              <div key={i} className="flex justify-between items-center text-[10px] border-b border-gray-100 dark:border-white/5 pb-1">
                                <span className="text-gray-600 dark:text-gray-300 truncate max-w-[120px] font-medium">{col.nombre}</span>
                                <span className="font-bold text-gray-800 dark:text-white">
                                  {new Intl.NumberFormat('es-MX', { style: 'currency', currency: 'MXN' }).format(totalFinal)}
                                </span>
                              </div>
                            );
                          })}
                        </div>
                      </div>

                      {!pdfRequested ? (
                        <button
                          onClick={() => setPdfRequested(true)}
                          className="w-full py-4 bg-indigo-600 text-white rounded-2xl font-bold flex items-center justify-center gap-3 hover:scale-[1.02] active:scale-[0.98] transition-all shadow-xl shadow-indigo-500/20"
                        >
                          <Download size={20} />
                          Preparar PDF para Descarga
                        </button>
                      ) : (
                        <PDFDownloadLink
                          document={<CovasDocument data={processedData} periodo={{ mes: periodoLabel, anio }} />}
                          fileName={`COVAS_CORPORATIVO_${periodoLabel.replace(/\s+/g, '_').toUpperCase()}_${anio}.pdf`}
                          className="w-full py-4 bg-green-600 text-white rounded-2xl font-bold flex items-center justify-center gap-3 hover:scale-[1.02] active:scale-[0.98] transition-all shadow-xl shadow-green-500/20"
                        >
                          {({ loading }) => (
                            <>
                              <Download size={20} />
                              {loading ? 'Generando Archivo...' : 'Descargar PDF Ahora'}
                            </>
                          )}
                        </PDFDownloadLink>
                      )}
                      
                      <button 
                        onClick={() => { setDataReady(false); setPdfRequested(false); }}
                        className="w-full py-2 text-[10px] font-bold text-gray-400 uppercase hover:text-indigo-500 transition-colors"
                      >
                        Recalcular o Cambiar Filtros
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

          {false && dataReady && (
             <div className="mt-6 space-y-4">
              <h4 className="text-sm font-bold text-gray-700 dark:text-gray-100 uppercase tracking-wide">Resultados del calculo ({periodoLabel})</h4>
               <div className="space-y-3 max-h-96 overflow-y-auto pr-2 custom-scrollbar">
                 {processedData.map((col: any, idx: number) => (
                   <div key={idx} className="rounded-2xl border border-gray-100 dark:border-white/10 bg-white/60 dark:bg-black/20 p-4">
                     <div className="flex justify-between items-start">
                       <div>
                         <p className="text-xs uppercase font-bold text-gray-400">{col.matricula}</p>
                         <p className="text-lg font-black text-gray-800 dark:text-white">{col.nombre}</p>
                         <p className="text-sm text-gray-500 dark:text-gray-400">{col.puesto}</p>
                       </div>
                       <div className="text-right">
                         <p className="text-xs text-gray-400 uppercase font-bold">Total Neto</p>
                         <p className="text-lg font-black text-green-600 dark:text-green-400">
                           {new Intl.NumberFormat('es-MX',{style:'currency',currency:'MXN'}).format(col.totales?.totalNetoMensual || 0)}
                         </p>
                         <p className="text-[11px] text-gray-500 dark:text-gray-400">Bonos: {new Intl.NumberFormat('es-MX',{style:'currency',currency:'MXN'}).format(col.totales?.subtotalBonos || 0)}</p>
                         <p className="text-[11px] text-gray-500 dark:text-gray-400">Otros: {new Intl.NumberFormat('es-MX',{style:'currency',currency:'MXN'}).format(col.totales?.totalOtrosIngresos || 0)}</p>
                         <p className="text-[11px] text-gray-500 dark:text-gray-400">Anticipos: {new Intl.NumberFormat('es-MX',{style:'currency',currency:'MXN'}).format(col.anticipos_aplicables || 0)}</p>
                       </div>
                     </div>

                     <div className="mt-3 border-t border-gray-100 dark:border-white/10 pt-3 space-y-2">
                       {(col.comisiones || []).map((c: any, i: number) => (
                         <div key={i} className="flex justify-between text-sm">
                           <div>
                             <p className="font-semibold text-gray-800 dark:text-white">{c.nombre}</p>
                             <p className="text-[11px] text-gray-500 dark:text-gray-400">Unidad: {c.unidad_medida || '-'} | Esquema: {c.esquema_tipo}</p>
                           </div>
                           <div className="text-right">
                             <p className="text-[11px] text-gray-500 dark:text-gray-400">Cumplimiento: {c.cumplimiento?.toFixed(1)}%</p>
                             <p className="text-[11px] text-gray-500 dark:text-gray-400">Pago: {c.porcentajePago ? `${c.porcentajePago}%` : '0%'}</p>
                             <p className="text-sm font-bold text-indigo-600 dark:text-indigo-300">
                               {new Intl.NumberFormat('es-MX',{style:'currency',currency:'MXN'}).format(c.montoBono || 0)}
                             </p>
                           </div>
                         </div>
                       ))}
                     </div>
                   </div>
                 ))}
               </div>
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
                  'Indice dinamico de personal.',
                  'Separadores por Unidad de Negocio.',
                  'Cedulas individuales detalladas.',
                  'Seccion de firmas regulatorias.'
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
                Asegurate de que los indicadores y alcances del periodo <strong>{periodoLabel}</strong> esten capturados y validados para un reporte preciso.
               </p>
             </div>
           </div>
        </div>
      </div>
    </div>
  );
}






