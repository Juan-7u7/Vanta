import { supabase } from '../lib/supabase';
import { calcularBonoBruto, calcularTotalesMensuales } from '../utils/covasLogicMonthly';
import type { IndicadorEntrada, IndicadorResultado } from '../utils/covasLogicMonthly';
import { calcularIndicadorQuarter, liquidarQuarter } from '../utils/covasLogicQuarterly';

const MONTHS_ORDER = ['enero','febrero','marzo','abril','mayo','junio','julio','agosto','septiembre','octubre','noviembre','diciembre'];
const QUARTER_MAP: Record<string, string[]> = {
  q1: ['enero','febrero','marzo'],
  q2: ['abril','mayo','junio'],
  q3: ['julio','agosto','septiembre'],
  q4: ['octubre','noviembre','diciembre']
};

function resolvePeriodMonths(periodo: string): string[] {
  const p = periodo.toLowerCase().trim();
  if (QUARTER_MAP[p]) return QUARTER_MAP[p];

  if (p.endsWith('_cierre')) {
    const base = p.replace('_cierre','');
    const idx = MONTHS_ORDER.indexOf(base);
    if (idx >= 0) return MONTHS_ORDER.slice(0, idx + 1);
  }

  if (MONTHS_ORDER.includes(p)) return [p];

  return [p];
}

function resolveCustomRange(desde?: string, hasta?: string): string[] {
  if (!desde) return [];
  const start = MONTHS_ORDER.indexOf(desde.toLowerCase().trim());
  const end = hasta ? MONTHS_ORDER.indexOf(hasta.toLowerCase().trim()) : start;
  if (start === -1 || end === -1) return [];
  const [lo, hi] = start <= end ? [start, end] : [end, start];
  return MONTHS_ORDER.slice(lo, hi + 1);
}

function sumColumns(row: any, months: string[]): number {
  if (!row) return 0;
  return months.reduce((acc, m) => acc + Number((row as any)[m] || 0), 0);
}

/**
 * Obtiene y transforma toda la información de un colaborador para el reporte COVAS (periodo simple: mes o acumulado).
 */
export async function getColaboradorDataForReport(
  colaborador_id: string, 
  mes: string,
  anio: number,
  mesesCustom?: string[]
) {
  const mesesPeriodo = mesesCustom && mesesCustom.length > 0
    ? resolveCustomRange(mesesCustom[0], mesesCustom[mesesCustom.length - 1])
    : resolvePeriodMonths(mes);
  if (!mesesPeriodo.length) return null;
  const columnasMes = mesesPeriodo.join(', ');
  
  try {
    // 1. Datos del colaborador y esquema (para tipo_colaborador)
    const { data: col, error: errCol } = await supabase
      .from('colaboradores')
      .select('*, unidades_negocio:unidad_negocio_id(nombre)')
      .eq('id', colaborador_id)
      .single();

    if (errCol || !col) throw new Error("Colaborador no encontrado");

    // Traer esquema de pago de forma explícita para evitar errores de join
    let esquemaPago: any = null;
    if ((col as any).esquema_pago_id) {
      const { data: esq } = await supabase
        .from('esquemas_pago')
        .select('id, tipo, descripcion')
        .eq('id', (col as any).esquema_pago_id)
        .single();
      esquemaPago = esq;
    }

    // 2. Metas/bonos por indicador con esquema y unidad
    const { data: rawIndicadores, error: errInd } = await supabase
      .from('metas_indicadores')
      .select(`id, nombre_indicador, tipo_indicador, unidad_medida, ponderacion, esquema_pago_id, ${columnasMes}`)
      .eq('colaborador_id', colaborador_id)
      .eq('anio', anio);
    if (errInd) throw errInd;

    // 3. Alcance real por indicador
    const indicadoresData = (rawIndicadores || []) as any[];
    const indicadorIds = indicadoresData.map((i: any) => i.id).filter(Boolean);
    const { data: rawAlcance } = indicadorIds.length
      ? await supabase
          .from('alcance_real')
          .select(`indicador_id, ${columnasMes}`)
          .eq('colaborador_id', colaborador_id)
          .eq('anio', anio)
          .in('indicador_id', indicadorIds)
      : { data: [] as any[] };
    const alcanceMap: Record<number, any> = {};
    (rawAlcance || []).forEach((a: any) => { alcanceMap[a.indicador_id] = a; });

    // 4. Salario base
    const { data: salarioRow, error: errSal } = await supabase
      .from('salarios_mensuales')
      .select('*')
      .eq('colaborador_id', colaborador_id)
      .eq('anio', anio)
      .maybeSingle();
    const salarioSafe = errSal ? null : salarioRow;

    // 5. Aprobaciones del periodo
    const { data: aprobRows } = await supabase
      .from('pasos_aprobacion')
      .select('mes, paso_captura, paso_validacion, paso_autorizacion, paso_direccion')
      .eq('colaborador_id', colaborador_id)
      .eq('anio', anio)
      .in('mes', mesesPeriodo);

    // 6. Otros ingresos
    const { data: otrosIngresosRows } = await supabase
      .from('otros_ingresos')
      .select(`nombre_concepto, ${columnasMes}`)
      .eq('colaborador_id', colaborador_id)
      .eq('anio', anio);

    const otrosIngresosData = (otrosIngresosRows || []) as any[];
    const otrosIngresos = otrosIngresosData.map(oi => ({
      concepto: (oi as any).nombre_concepto,
      monto: sumColumns(oi, mesesPeriodo)
    }));

    // 7. Anticipos y saldos
    const { data: pagos } = await supabase
      .from('pagos_realizados')
      .select('monto_pagado_anticipo, saldo_pendiente_arrastrado')
      .eq('colaborador_id', colaborador_id)
      .eq('anio', anio)
      .eq('periodo', mes);

    const anticipos_aplicables = (pagos || []).reduce((acc, p) => acc + Number(p.monto_pagado_anticipo || 0), 0);
    const saldo_pendiente_arrastrado = (pagos || []).reduce((acc, p) => acc + Number(p.saldo_pendiente_arrastrado || 0), 0);

    // 8. Preparar entradas por indicador y calcular con lógica mensual
    const indicadoresEntrada: IndicadorEntrada[] = [];
    const totalIndicadores = (rawIndicadores || []).length || 1;
    const ponderacionDefault = 1 / totalIndicadores;
    const bonoTotalColaborador = 0; // sin monto_base en esquema, fallback se usa más abajo

    for (const mInd of indicadoresData) {
      // escalones por indicador; si no hay esquema_id, usar fallback sin llamar API
      const esquemaId = (mInd as any).esquema_pago_id;
      let escalones = [
        { limite_inferior: 0, limite_superior: 89.9, porcentaje_pago: 0 },
        { limite_inferior: 90, limite_superior: 9999, porcentaje_pago: 100 }
      ];

      if (esquemaId) {
      const { data: escalonesData } = await supabase
        .from('escalones_bonos')
        .select('limite_inferior, limite_superior, porcentaje_pago')
        .eq('esquema_id', esquemaId)
        .order('limite_inferior', { ascending: true });
        if (escalonesData && escalonesData.length) escalones = escalonesData as any;
      }

      const ponderacionRaw = Number((mInd as any).ponderacion);
      const ponderacion = ponderacionRaw > 0 ? ponderacionRaw : ponderacionDefault;
      const categoria = ((mInd as any).unidad_medida === 'ranking' || ((mInd as any).tipo_indicador || '').toLowerCase().includes('ranking')) ? 'ranking' : 'numerico';

      indicadoresEntrada.push({
        nombre: (mInd as any).nombre_indicador,
        meta: sumColumns(mInd, mesesPeriodo),
        alcance: sumColumns(alcanceMap[mInd.id], mesesPeriodo),
        unidad_medida: (mInd as any).unidad_medida,
        esquema_tipo: ((mInd as any).esquemas_pago as any)?.tipo || 'porcentaje',
        bonoObjetivo: sumColumns(mInd, mesesPeriodo),
        bonoTotalColaborador: bonoTotalColaborador || sumColumns(mInd, mesesPeriodo),
        ponderacion,
        categoria,
        escalones,
        tipo_colaborador: col.tipo_colaborador || col.puesto || ''
      });
    }

    const resultados: IndicadorResultado[] = indicadoresEntrada.map((i) => {
      const res = calcularBonoBruto(i);
      return {
        ...res,
        bonoObjetivo: i.bonoObjetivo, // necesario para cálculos trimestrales
        escalones: i.escalones
      } as any;
    });
    const totales = calcularTotalesMensuales(resultados, otrosIngresos.reduce((a,b)=>a+(b.monto||0),0));

    return {
      nombre: `${col.nombre} ${col.apellido_paterno || ''}`.trim(),
      matricula: col.matricula,
      puesto: col.puesto,
      unidades_negocio: (col as any).unidades_negocio || null,
      sueldoBase: salarioSafe ? sumColumns(salarioSafe, mesesPeriodo) : 0,
      comisiones: resultados,
      otrosIngresos,
      esquema_tipo: (esquemaPago as any)?.tipo || 'porcentaje',
      anticipos_aplicables,
      saldo_pendiente_arrastrado,
      totales,
      ajuste_desempeno: totales.ajusteGrupal,
      aprobaciones: {
        paso_captura: (aprobRows || []).every(a => a.paso_captura),
        paso_validacion: (aprobRows || []).every(a => a.paso_validacion),
        paso_autorizacion: (aprobRows || []).every(a => a.paso_autorizacion),
        paso_direccion: (aprobRows || []).every(a => a.paso_direccion)
      }
    };

  } catch (err) {
    console.error("Error financiero en getColaboradorDataForReport:", err);
    return null;
  }
}

/**
 * Consolidado trimestral usando la lógica quarterly dedicada.
 */
export async function getColaboradorDataForQuarter(
  colaborador_id: string,
  mesesDelQ: string[],
  anio: number
) {
  // obtener data mensual para cada mes del Q
  const mensual = await Promise.all(
    mesesDelQ.map(m => getColaboradorDataForReport(colaborador_id, m, anio))
  );

  const valid = mensual.filter(r => r !== null) as any[];
  if (valid.length === 0) return null;

  // mapear metas/alcances por indicador
  const indicadoresMap: Record<string, any> = {};
  valid.forEach(m => {
    (m.comisiones || []).forEach((c: any) => {
      const key = c.nombre;
      const ponderacionCalc = c.techoFinanciero && (c.bonoObjetivo || c.meta)
        ? c.techoFinanciero / (c.bonoObjetivo || c.meta)
        : 1 / ((m.comisiones || []).length || 1);
      if (!indicadoresMap[key]) {
        indicadoresMap[key] = {
          nombre: c.nombre,
          metasMes: [],
          alcancesMes: [],
          unidad_medida: c.unidad_medida,
          esquema_tipo: c.esquema_tipo,
          bonoObjetivoPeriodo: c.bonoObjetivo,
          escalones: [], // se llenará con último disponible
          tipo_colaborador: m.puesto || '',
          ponderacion: ponderacionCalc
        };
      }
      indicadoresMap[key].metasMes.push(c.meta || 0);
      indicadoresMap[key].alcancesMes.push(c.alcance || 0);
      indicadoresMap[key].esquema_tipo = c.esquema_tipo;
      indicadoresMap[key].bonoObjetivoPeriodo = (indicadoresMap[key].bonoObjetivoPeriodo || 0) + (c.bonoObjetivo || 0);
      indicadoresMap[key].ponderacion = ponderacionCalc;
      if (c.escalones) indicadoresMap[key].escalones = c.escalones;
    });
  });

  // necesitamos escalones: tomar del primer mes válido vía supabase si faltan
  for (const key of Object.keys(indicadoresMap)) {
    if (!indicadoresMap[key].escalones || indicadoresMap[key].escalones.length === 0) {
      // fallback básico
      indicadoresMap[key].escalones = [
        { limite_inferior: 0, limite_superior: 89.9, porcentaje_pago: 0 },
        { limite_inferior: 90, limite_superior: 9999, porcentaje_pago: 100 }
      ];
    }
  }

  const indicadoresResultados = Object.values(indicadoresMap).map(ind => {
    const r = calcularIndicadorQuarter(ind);
    return {
      ...r,
      meta: r.metaTotal,
      alcance: r.alcanceTotal,
      montoBono: r.bonoBruto,
      bonoObjetivo: ind.bonoObjetivoPeriodo,
      porcentajePago: r.porcentajePago,
      escalones: ind.escalones,
    };
  });

  const otrosIngresosTotal = valid.reduce((acc, r) => acc + (r.otrosIngresos || []).reduce((a: number, o: any) => a + (o.monto || 0), 0), 0);
  const anticiposTotal = valid.reduce((acc, r) => acc + (r.anticipos_aplicables || 0), 0);
  const saldoPrevio = valid.reduce((acc, r) => acc + (r.saldo_pendiente_arrastrado || 0), 0);

  const liquidacion = liquidarQuarter(indicadoresResultados, otrosIngresosTotal, anticiposTotal, saldoPrevio);

  return {
    ...valid[0],
    comisiones: indicadoresResultados,
    otrosIngresos: valid[0].otrosIngresos, // referencial
    anticipos_aplicables: anticiposTotal,
    saldo_pendiente_arrastrado: liquidacion.saldoPendienteNuevo,
    totales: {
      subtotalBonos: liquidacion.subtotalBonos,
      ajusteGrupal: 0, // ajuste grupal no definido para Q en requisitos
      totalBonosConAjuste: liquidacion.subtotalBonos,
      totalOtrosIngresos: liquidacion.otrosIngresos,
      totalNetoMensual: liquidacion.netoAPagar
    },
    aprobaciones: valid[0].aprobaciones,
    sueldoBase: valid.reduce((acc, r) => acc + (r.sueldoBase || 0), 0) // sumar los 3 meses del Q
  };
}
