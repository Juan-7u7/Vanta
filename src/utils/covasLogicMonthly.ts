/**
 * Lógica mensual especializada para COVAS.
 * - Pondera cada indicador con un techo financiero.
 * - Soporta indicadores numéricos y de ranking.
 * - Aplica ajuste grupal ±10% según cumplimiento >=85% de todos.
 */

export type UnidadMedida = 'moneda' | 'cantidad' | 'porcentaje' | 'ranking' | string;
export type EsquemaTipo = 'monto' | 'porcentaje' | 'meses' | string;

export interface EscalonPago {
  limite_inferior: number;
  limite_superior: number;
  porcentaje_pago: number;
  etiqueta?: string; // para rankings (texto exacto)
}

export interface IndicadorEntrada {
  nombre: string;
  meta: number;
  alcance: number;
  meta_texto?: string;
  alcance_texto?: string;
  categoria?: 'ranking' | 'numerico';
  unidad_medida: UnidadMedida;
  esquema_tipo: EsquemaTipo;
  bonoObjetivo: number; // monto pactado fijo para esquema porcentaje
  bonoTotalColaborador: number; // techo global del bono
  ponderacion: number; // 0-1
  escalones: EscalonPago[];
  tipo_colaborador: string; // Gerente | Ejecutivo | Operativo | etc
}

export interface IndicadorResultado {
  nombre: string;
  meta: number;
  alcance: number;
  cumplimiento: number;
  aplicaPiso: boolean;
  porcentajePago: number;
  montoBono: number;
  techoFinanciero: number;
  esquema_tipo: EsquemaTipo;
  unidad_medida: UnidadMedida;
}

export interface TotalesMensuales {
  subtotalBonos: number;
  ajusteGrupal: number;
  totalBonosConAjuste: number;
  totalOtrosIngresos: number;
  totalNetoMensual: number;
}

const PISOS: Record<string, number> = {
  gerente: 85,
  ejecutivo: 70,
};

function normalizarNumero(val: any, unidad: UnidadMedida): number {
  const n = Number(val) || 0;
  if (unidad === 'moneda') return Number(n);
  return n;
}

function obtenerPiso(tipoColaborador: string): number {
  const key = (tipoColaborador || '').toLowerCase();
  if (PISOS[key] !== undefined) return PISOS[key];
  return 0; // default sin piso
}

export function calcularCumplimiento(meta: number, alcance: number): number {
  if (!meta || meta === 0) return 0;
  return (alcance / meta) * 100;
}

export function aplicarPiso(cumplimiento: number, tipoColaborador: string): { aplica: boolean; cumplimiento: number } {
  const piso = obtenerPiso(tipoColaborador);
  if (piso === 0) return { aplica: true, cumplimiento };
  return { aplica: cumplimiento >= piso, cumplimiento };
}

function buscarEscalonFlexible(cumplimiento: number, escalones: EscalonPago[], cumplimientoTexto?: string): number {
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

export function calcularBonoBruto(indicador: IndicadorEntrada): IndicadorResultado {
  const meta = normalizarNumero(indicador.meta, indicador.unidad_medida);
  const alcance = normalizarNumero(indicador.alcance, indicador.unidad_medida);

  const techoFinanciero = (indicador.bonoTotalColaborador || indicador.bonoObjetivo || meta) * (indicador.ponderacion || 0);

  let cumplimiento = 0;
  let cumplimientoTexto: string | undefined;
  if (indicador.categoria === 'ranking' || indicador.unidad_medida === 'ranking') {
    cumplimientoTexto = (indicador.alcance_texto || '').trim();
    cumplimiento = indicador.alcance_texto && indicador.meta_texto && indicador.alcance_texto.toLowerCase() === indicador.meta_texto.toLowerCase()
      ? 100 : 0;
  } else {
    cumplimiento = calcularCumplimiento(meta, alcance);
  }

  const piso = aplicarPiso(cumplimiento, indicador.tipo_colaborador);

  if (!piso.aplica) {
    return {
      nombre: indicador.nombre,
      meta,
      alcance,
      cumplimiento,
      aplicaPiso: false,
      porcentajePago: 0,
      montoBono: 0,
      techoFinanciero,
      esquema_tipo: indicador.esquema_tipo,
      unidad_medida: indicador.unidad_medida,
    };
  }

  const porcentajePago = buscarEscalonFlexible(cumplimiento, indicador.escalones, cumplimientoTexto);
  const montoBono = techoFinanciero * (porcentajePago / 100);

  return {
    nombre: indicador.nombre,
    meta,
    alcance,
    cumplimiento,
    aplicaPiso: true,
    porcentajePago,
    montoBono,
    techoFinanciero,
    esquema_tipo: indicador.esquema_tipo,
    unidad_medida: indicador.unidad_medida,
  };
}

export function calcularAjusteGrupal(resultados: IndicadorResultado[]): number {
  if (resultados.length === 0) return 0;
  const subtotal = resultados.reduce((acc, r) => acc + (r.montoBono || 0), 0);
  if (subtotal <= 0) return 0;
  const todos85 = resultados.every(r => r.cumplimiento >= 85);
  const algunoBajo = resultados.some(r => r.cumplimiento < 85.01);
  if (todos85) return subtotal * 0.10;
  if (algunoBajo) return -subtotal * 0.10;
  return 0;
}

export function calcularTotalesMensuales(resultados: IndicadorResultado[], otrosIngresos: number): TotalesMensuales {
  const subtotalBonos = resultados.reduce((acc, r) => acc + (r.montoBono || 0), 0);
  const ajuste = calcularAjusteGrupal(resultados);
  const totalBonosConAjuste = subtotalBonos + ajuste;
  const totalOtrosIngresos = Number(otrosIngresos || 0);
  const totalNetoMensual = totalBonosConAjuste + totalOtrosIngresos;

  return {
    subtotalBonos,
    ajusteGrupal: ajuste,
    totalBonosConAjuste,
    totalOtrosIngresos,
    totalNetoMensual,
  };
}
