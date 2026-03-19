import { useMemo } from 'react';
import { supabase } from '../lib/supabase';

const MOCK_COL = {
  puesto: 'DIRECTOR DE PRODUCCIÓN',
  sueldo: 180.8,
  bonoMeses: 10,
  bonoMonto: 1808.28,
  nombre: 'OSCAR DANIEL SALCEDO MENDOZA',
  trimestres: [
    { label: '1Q', base: 180.8, bono: 452.07 },
    { label: '2Q', base: 180.8, bono: 452.07 },
    { label: '3Q', base: 180.8, bono: 452.07 },
    { label: '4Q', base: 180.8, bono: 452.07 },
  ],
};

const TIERS = [
  { alcance: '<90%', bono: '0.00%' },
  { alcance: '90.00%', bono: '70.00%' },
  { alcance: '92.00%', bono: '80.00%' },
  { alcance: '95.00%', bono: '90.00%' },
  { alcance: '97.00%', bono: '95.00%' },
  { alcance: '100.00%', bono: '100.00%', highlight: true },
  { alcance: '101.00%', bono: '115.00%' },
  { alcance: '110.00%', bono: '125.00%' },
  { alcance: '120.00%', bono: '140.00%' },
  { alcance: '130.00%', bono: '165.00%' },
  { alcance: '140.00%', bono: '180.00%' },
  { alcance: '150.00%', bono: '200.00%' },
];

const INDICADORES = [
  {
    nombre: 'EBITDA VANTA MEDIA S/C, s/OGyOI ,y s/R',
    participacion: ['16,542', '21,659', '33,526', '52,428', '124,156'],
    anual: ['13.3%', '17.4%', '27.0%', '42.2%', '100.0%'],
  },
  {
    nombre: 'RATING',
    participacion: ['5,000', '5,000', '5,000', '5,000', '20,000'],
    anual: ['25.0%', '25.0%', '25.0%', '25.0%', '100.0%'],
  },
];

const APROB = [
  { rol: 'Captura', nombre: 'JOHANNA MENDOZA', correo: 'JOHANNA_MENDOZA@AVALANZMEDIA.COM', aprobado: true, fecha: '19/03/2026' },
  { rol: 'Revisa', nombre: 'EDUARDO LACADENA', correo: 'EDUARDO_LACADENA@AVALANZMEDIA.COM', aprobado: true, fecha: '19/03/2026' },
  { rol: 'Aprueba', nombre: 'CESAR RIVERA', correo: 'CESAR_RIVERA@AVALANZMEDIA.COM', aprobado: false, fecha: '' },
  { rol: 'Autoriza', nombre: 'JOAQUIN ANAYA', correo: 'JOAQUIN_ANAYA@AVALANZMEDIA.COM', aprobado: false, fecha: '' },
];

const Notas = [
  'La empresa se reserva el derecho de cambiar o modificar el plan de compensación de acuerdo a la situación de la empresa, conducta y desempeño del titular.',
  'Calculado y pagadero mensual, trimestral y anualmente según sea el caso.',
  'Trimestralmente se informa al Consejo la compensación obtenida por el periodo evaluado.',
  'Para pagar el pago se presenta en condición NO NEGOCIABLE, contar con los soportes de los resultados debidamente autorizados.',
  'Si el pago del presente esquema de compensación variable, estará sujeto a que el EBITDA sea igual o mayor al año anterior en los casos que el desempeño sea por debajo del EBITDA.',
  'En caso de que el EBITDA no sea el esperado se ajustará el pago en los Indicadores Intraños trimestrales y/o trimestres que tengan 60 días de ejecución en el trimestre.',
  'Se tienen en cuenta los cálculos trimestrales con anticipos del COVA anual, en dado caso que el cálculo anual sea diferente a los anticipos trimestrales se establecerá un ajuste final anual. Según el porcentaje de cumplimiento.',
  'El pago de este esquema será en un periodo de 8 semanas después de cerrar el periodo evaluado.',
];

export default function ReporteDirectivo() {
  const onPrint = () => {
    window.print();
  };

  const renderMatriz = () => (
    <table className="w-full text-[11px] border border-black border-collapse">
      <thead>
        <tr className="bg-slate-900 text-white text-[11px]">
          <th className="p-2 text-left">Alcance</th>
          <th className="p-2 text-right">1Q</th>
          <th className="p-2 text-right">2Q</th>
          <th className="p-2 text-right">3Q</th>
          <th className="p-2 text-right">4Q</th>
          <th className="p-2 text-right">TOTAL</th>
        </tr>
      </thead>
      <tbody>
        {TIERS.map((t, idx) => (
          <tr key={idx} className={t.highlight ? 'bg-sky-100' : ''}>
            <td className="p-2 font-semibold">{t.alcance}</td>
            <td className="p-2 text-right">{t.bono}</td>
            <td className="p-2 text-right">{t.bono}</td>
            <td className="p-2 text-right">{t.bono}</td>
            <td className="p-2 text-right">{t.bono}</td>
            <td className="p-2 text-right">{t.bono}</td>
          </tr>
        ))}
      </tbody>
    </table>
  );

  return (
    <div className="bg-white text-gray-900 min-h-screen print:bg-white">
      <div className="fixed bottom-6 right-6 print:hidden">
        <button onClick={onPrint} className="px-4 py-2 bg-indigo-600 text-white rounded shadow">
          Imprimir
        </button>
      </div>

      <div className="mx-auto max-w-5xl p-6 border border-black print:shadow-none print:border-black bg-white print:w-[210mm] print:h-auto">
        <header className="flex items-center justify-between border-b border-black pb-2 mb-4">
          <div className="text-center flex-1">
            <h1 className="text-xl font-extrabold tracking-[0.2em]">PLAN DE COMPENSACIÓN VARIABLE</h1>
          </div>
          <div className="ml-4 border border-black px-3 py-2 text-center font-black text-lg">
            2026
          </div>
        </header>

        {/* Colaborador */}
        <section className="grid grid-cols-3 gap-4 mb-4">
          <div className="col-span-2 border border-black p-3">
            <p className="text-sm font-bold uppercase">Capital Humano</p>
            <p className="text-sm font-bold mt-2">Puesto: <span className="font-extrabold">{MOCK_COL.puesto}</span></p>
            <p className="text-sm mt-1">Sueldo Fijo Mensualizado: <span className="font-bold">$ {MOCK_COL.sueldo}</span></p>
            <p className="text-sm mt-1">Bono Total: <span className="font-bold">Meses {MOCK_COL.bonoMeses}</span> <span className="font-bold">Monto $ {MOCK_COL.bonoMonto}</span></p>
            <p className="text-lg font-black mt-3">{MOCK_COL.nombre}</p>
          </div>
          <div className="col-span-1 border border-black p-3">
            <table className="w-full text-xs border border-black border-collapse">
              <thead className="bg-slate-900 text-white">
                <tr>
                  <th className="p-1 text-center">1Q</th>
                  <th className="p-1 text-center">2Q</th>
                  <th className="p-1 text-center">3Q</th>
                  <th className="p-1 text-center">4Q</th>
                  <th className="p-1 text-center">Total</th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  {MOCK_COL.trimestres.map((t, i) => (
                    <td key={i} className="p-1 text-center">{t.base}</td>
                  ))}
                  <td className="p-1 text-center">{MOCK_COL.trimestres.reduce((a,b)=>a+b.base,0).toFixed(2)}</td>
                </tr>
                <tr>
                  {MOCK_COL.trimestres.map((t, i) => (
                    <td key={i} className="p-1 text-center">{t.bono}</td>
                  ))}
                  <td className="p-1 text-center">{MOCK_COL.trimestres.reduce((a,b)=>a+b.bono,0).toFixed(2)}</td>
                </tr>
              </tbody>
            </table>
          </div>
        </section>

        {/* Indicadores */}
        {INDICADORES.map((ind, idx) => (
          <section key={idx} className="mb-6 break-after-page print:break-after-page">
            <div className="bg-slate-900 text-white font-bold px-2 py-1 flex items-center justify-between">
              <span>{ind.nombre}</span>
              <div className="flex items-center gap-2 text-xs">
                {['1Q','2Q','3Q','4Q','TOTAL'].map((q,i)=>(
                  <div key={q} className="text-right">
                    <div>{q === 'TOTAL' ? 'TOTAL' : `${q}`}</div>
                    <div className="font-black">{ind.participacion[i]}</div>
                  </div>
                ))}
              </div>
            </div>
            <div className="border-x border-b border-black p-2 text-xs">
              <div className="flex gap-2 text-sm font-semibold mb-2">
                <span>Participación Anual:</span>
                <span className="flex-1 text-right">{ind.anual.join(' | ')}</span>
              </div>
              {renderMatriz()}
              <div className="mt-2 text-xs">
                <div className="font-bold">RESULTADO REAL</div>
                <table className="w-full text-[11px] border border-black border-collapse">
                  <thead className="bg-slate-50">
                    <tr>
                      <th className="p-1 text-left">% ALCANCE</th>
                      <th className="p-1 text-right">1Q</th><th className="p-1 text-right">2Q</th><th className="p-1 text-right">3Q</th><th className="p-1 text-right">4Q</th><th className="p-1 text-right">TOTAL</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr>
                      <td className="p-1">% ALCANCE LOGRADO:</td>
                      <td className="p-1 text-right">0.00%</td>
                      <td className="p-1 text-right">0.00%</td>
                      <td className="p-1 text-right">0.00%</td>
                      <td className="p-1 text-right">0.00%</td>
                      <td className="p-1 text-right">0.00%</td>
                    </tr>
                    <tr>
                      <td className="p-1">MONTO DE BONO ALCANZADO:</td>
                      <td className="p-1 text-right">$ 0.00</td>
                      <td className="p-1 text-right">$ 0.00</td>
                      <td className="p-1 text-right">$ 0.00</td>
                      <td className="p-1 text-right">$ 0.00</td>
                      <td className="p-1 text-right">$ 0.00</td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>
          </section>
        ))}

        {/* Totales finales */}
        <section className="border border-black p-3 text-sm">
          <div className="flex justify-between border-b border-black pb-2 mb-2 font-semibold">
            <span>TOTAL PERCEPCIÓN</span>
            <span className="text-right">$ 0.00</span>
          </div>
          <div className="flex justify-between border-b border-black pb-2 mb-2">
            <span>PTTO DE COMISIONES</span>
            <span className="text-right">$ 0.00</span>
          </div>
          <div className="flex justify-between">
            <span>COMISIONES POR PAGAR</span>
            <span className="text-right">$ 0.00</span>
          </div>
        </section>

        {/* Notas */}
        <section className="mt-4 text-[10px] leading-4">
          <ol className="list-decimal ml-4 space-y-1">
            {Notas.map((n,i)=> <li key={i}>{n}</li>)}
          </ol>
        </section>

        {/* Autorizaciones */}
        <section className="mt-4 grid grid-cols-4 gap-3 text-xs">
          {APROB.map((a,idx)=>(
            <div key={idx} className="border border-black p-2">
              <div className="font-bold uppercase text-[11px]">{a.rol}</div>
              <div className="font-semibold mt-1">{a.nombre}</div>
              <div className="text-[10px] text-gray-600">{a.correo}</div>
              <div className={`mt-2 text-center font-black ${a.aprobado ? 'text-green-700' : 'text-gray-500'}`}>
                {a.aprobado ? 'APROBADO' : 'PENDIENTE'}
              </div>
              <div className="text-[10px] text-right mt-1">{a.fecha || ''}</div>
            </div>
          ))}
        </section>
      </div>
    </div>
  );
}
