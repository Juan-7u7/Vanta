import type { EscalonPago, UnidadMedida, EsquemaTipo } from './covasLogicMonthly';

export interface IndicadorQuarterInput {
  nombre: string;
  metasMes: number[];        // largo 3
  alcancesMes: number[];     // largo 3
  unidad_medida: UnidadMedida;
  esquema_tipo: EsquemaTipo;
  bonoObjetivoPeriodo: number; // total bono objetivo del Q
  escalones: EscalonPago[];
  tipo_colaborador: string;
  ponderacion: number; // 0-1
  categoria?: 'ranking' | 'numerico';
  meta_texto?: string;
  alcance_texto?: string;
}

export interface IndicadorQuarterResult {
  nombre: string;
  metaTotal: number;
  alcanceTotal: number;
  cumplimiento: number;
  aplicaPiso: boolean;
  porcentajePago: number;
  bonoBruto: number;
  techoFinanciero: number;
  unidad_medida: UnidadMedida;
  esquema_tipo: EsquemaTipo;
}

export interface QuarterLiquidacion {
  subtotalBonos: number;
  ajusteGrupal: number;
  otrosIngresos: number;
  anticiposAplicados: number;
  saldoArrastradoPrevio: number;
  netoAPagar: number;
  saldoPendienteNuevo: number; // si neto < 0 se convierte en deuda siguiente Q
}

function normalizar(val: any): number {
  return Number(val) || 0;
}

function sumar(nums: number[]): number {
  return nums.reduce((a, b) => a + normalizar(b), 0);
}

function obtenerPiso(tipoColaborador: string): number {
  const key = (tipoColaborador || '').toLowerCase();
  if (key === 'gerente') return 85;
  if (key === 'ejecutivo') return 70;
  return 0;
}

function buscarEscalonFlexible(
  cumplimiento: number,
  escalones: EscalonPago[],
  cumplimientoTexto?: string
): number {
  if (!escalones || escalones.length === 0) return 0;
  if (cumplimientoTexto) {
    const m = escalones.find(e => (e.etiqueta || '').toLowerCase() === cumplimientoTexto.toLowerCase());
    if (m) return Number(m.porcentaje_pago || 0);
  }
  const ordenados = [...escalones].sort((a, b) => a.limite_inferior - b.limite_inferior);
  const match = ordenados.find(e => cumplimiento >= e.limite_inferior && cumplimiento <= e.limite_superior);
  if (match) return Number(match.porcentaje_pago || 0);
  return Number(ordenados[ordenados.length - 1]?.porcentaje_pago || 0);
}

export function calcularIndicadorQuarter(
  ind: IndicadorQuarterInput
): IndicadorQuarterResult {
  const metaTotal = sumar(ind.metasMes);
  const alcanceTotal = sumar(ind.alcancesMes);

  let cumplimiento = metaTotal > 0 ? (alcanceTotal / metaTotal) * 100 : 0;
  let cumplimientoTexto: string | undefined;

  if (ind.categoria === 'ranking' || ind.unidad_medida === 'ranking') {
    cumplimientoTexto = (ind.alcance_texto || '').trim();
    cumplimiento = ind.alcance_texto && ind.meta_texto && ind.alcance_texto.toLowerCase() === ind.meta_texto.toLowerCase()
      ? 100 : 0;
  }

  const piso = obtenerPiso(ind.tipo_colaborador);
  const aplicaPiso = piso === 0 ? true : cumplimiento >= piso;

  const techoFinanciero = (ind.bonoObjetivoPeriodo || 0) * (ind.ponderacion || 0);

  let porcentajePago = 0;
  let bonoBruto = 0;

  if (aplicaPiso) {
    porcentajePago = buscarEscalonFlexible(cumplimiento, ind.escalones, cumplimientoTexto);
    bonoBruto = techoFinanciero * (porcentajePago / 100);
  }

  return {
    nombre: ind.nombre,
    metaTotal,
    alcanceTotal,
    cumplimiento,
    aplicaPiso,
    porcentajePago,
    bonoBruto,
    techoFinanciero,
    unidad_medida: ind.unidad_medida,
    esquema_tipo: ind.esquema_tipo,
  };
}

export function liquidarQuarter(
  indicadores: IndicadorQuarterResult[],
  otrosIngresosTotal: number,
  anticiposTotal: number,
  saldoArrastradoPrevio: number
): QuarterLiquidacion {
  const subtotalBonos = indicadores.reduce((acc, r) => acc + (r.bonoBruto || 0), 0);

  // Ajuste grupal ±10%
  const todos85 = indicadores.every(r => r.cumplimiento >= 85);
  const algunoBajo = indicadores.some(r => r.cumplimiento < 85.01);
  let ajusteGrupal = 0;
  if (todos85) ajusteGrupal = subtotalBonos * 0.10;
  else if (algunoBajo) ajusteGrupal = -subtotalBonos * 0.10;

  const subtotalConAjuste = subtotalBonos + ajusteGrupal;

  const anticipos = normalizar(anticiposTotal);
  const saldoPrevio = normalizar(saldoArrastradoPrevio);
  const otros = normalizar(otrosIngresosTotal);

  const netoAntesSaldo = subtotalConAjuste + otros - anticipos;
  const netoAPagar = netoAntesSaldo + saldoPrevio;

  let pago = netoAPagar;
  let saldoPendienteNuevo = 0;
  if (netoAPagar < 0) {
    saldoPendienteNuevo = Math.abs(netoAPagar);
    pago = 0;
  }

  return {
    subtotalBonos,
    ajusteGrupal,
    otrosIngresos: otros,
    anticiposAplicados: anticipos,
    saldoArrastradoPrevio: saldoPrevio,
    netoAPagar: pago,
    saldoPendienteNuevo,
  };
}
