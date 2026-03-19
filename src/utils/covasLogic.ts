/** 
 * COVAS 2026 - Lógica de Cálculos v2.0 (Reconstrucción Total)
 * Este archivo centraliza las reglas de negocio financiero.
 */

/**
 * Paso A y B: Calcula cumplimiento y aplica Regla de Piso.
 */
function aplicarReglaDePiso(real: number, meta: number, tipo: string): { cumplimiento: number; califica: boolean } {
  const cumplimiento = meta <= 0 ? 0 : (real / meta) * 100;
  let califica = true;

  if (tipo === 'Gerente' && cumplimiento < 85) califica = false;
  if (tipo === 'Ejecutivo' && cumplimiento < 70) califica = false;
  if (tipo === 'Operativo' && cumplimiento <= 0) califica = false;

  return { cumplimiento, califica };
}

/**
 * Paso C: Busca el escalón correspondiente ordenando de mayor a menor.
 */
function buscarEscalon(valorReferencia: number, escalones: any[]): number {
  if (!escalones || escalones.length === 0) return 0;

  // Ordenar de mayor a menor por límite inferior
  const ordenados = [...escalones].sort((a, b) => b.limite_inferior - a.limite_inferior);
  
  // Encontrar el primer escalón que el valor iguale o supere
  const match = ordenados.find(e => valorReferencia >= e.limite_inferior);
  
  return match ? Number(match.porcentaje_pago) : 0;
}

/**
 * Función Maestra: calcularBonoMensual
 * Implementa el Paso D (Cálculo Final Dinámico)
 */
export function calcularBonoMensual(
  alcanceReal: number,
  metaMensual: number,
  montoPactado: number,
  tipoColaborador: string,
  escalones: any[],
  esquemaTipo: 'porcentaje' | 'monto' | 'meses' = 'porcentaje',
  valorDeReferencia: number = 0
): any {
  
  // 1. Obtener Cumplimiento y Piso
  const { cumplimiento, califica } = aplicarReglaDePiso(alcanceReal, metaMensual, tipoColaborador);

  if (!califica) {
    console.log(`[LOG] ${tipoColaborador} no alcanza piso (${cumplimiento.toFixed(2)}%). Resultado: $0`);
    return { montoBono: 0, cumplimiento, aplicaBono: false };
  }

  // 2. Determinar qué valor usar para buscar en la tabla
  // Si es 'meses', usamos la antigüedad. Si es 'porcentaje' o 'monto', usamos el cumplimiento.
  const ref = (esquemaTipo === 'meses') ? valorDeReferencia : cumplimiento;
  const porcentajePago = buscarEscalon(ref, escalones);

  // 3. Paso D: Cálculo Dinámico según Esquema
  let montoFinal = 0;
  const baseUsada = (esquemaTipo === 'monto') ? alcanceReal : montoPactado;

  montoFinal = baseUsada * (porcentajePago / 100);

  console.log(`[LOG] Calculando ${tipoColaborador} con esquema [${esquemaTipo}]. Base: $${baseUsada}, Escalón: ${porcentajePago}%, Total: $${montoFinal}`);

  return { 
    montoBono: montoFinal, 
    cumplimiento, 
    aplicaBono: porcentajePago > 0 
  };
}

/**
 * Función para ajustes grupales (Bono Extra / Penalización)
 */
export function aplicarAjustePorGrupo(
  indicadores: { montoBono: number; cumplimiento: number }[]
): { montoFinal: number; ajuste: number; motivo: string } {
  const totalInicial = indicadores.reduce((acc, curr) => acc + (curr.montoBono || 0), 0);
  if (totalInicial <= 0) return { montoFinal: 0, ajuste: 0, motivo: 'Sin bonos base' };

  const todosPasan85 = indicadores.every(i => i.cumplimiento >= 85);
  const algunoBajo85 = indicadores.some(i => i.cumplimiento < 85);

  let ajuste = 0;
  let motivo = 'Sin ajustes';

  if (algunoBajo85) {
    ajuste = -(totalInicial * 0.10);
    motivo = 'Penalización: Al menos un indicador < 85%';
  } else if (todosPasan85) {
    ajuste = totalInicial * 0.10;
    motivo = 'Bono Extra: Todos los indicadores >= 85%';
  }

  return { montoFinal: totalInicial + ajuste, ajuste, motivo };
}

/**
 * Formateo de Moneda
 */
export function formatCurrency(amount: number): string {
  const val = isNaN(amount) ? 0 : amount;
  return new Intl.NumberFormat('es-MX', { 
    style: 'currency', 
    currency: 'MXN', 
    minimumFractionDigits: 2 
  }).format(val);
}

// --- Funciones de Compatibilidad (Legacy) ---
export function calculateBonoPercent(alcance: number): number {
  if (alcance < 90) return 0;
  if (alcance < 100) return 0.95;
  return 1.00;
}

export function calculateBono(alcance: number, objective: number): number {
  return objective * calculateBonoPercent(alcance);
}

export function calcularCierrePeriodo(bonos: number[], anticipos: number, _esAnual: boolean) {
  const total = bonos.reduce((a, b) => a + b, 0);
  return { montoFinalAPagar: total - anticipos, saldoPendiente: total - anticipos };
}
