/** final 1.0 */
/**
 * Determina el porcentaje de bono basado en el alcance de metas.
 * @param alcance Porcentaje de cumplimiento (ej. 95 para 95%)
 * @returns Multiplicador de bono (ej. 0.80 para 80% de bono)
 */
export function calculateBonoPercent(alcance: number): number {
  const pct = alcance;
  if (pct < 90) return 0;
  if (pct < 92) return 0.70;
  if (pct < 95) return 0.80;
  if (pct < 97) return 0.90;
  if (pct < 100) return 0.95;
  
  // Si alcance >= 100%
  if (pct >= 150) return 2.00; // Tope en 200% si supera 150%
  return 1.00; // 100% de bono
}

/**
 * Lógica de Brackets Vanta Media 2026
 * Calcula el monto final del bono basado en el alcance.
 * @param alcance - Porcentaje de cumplimiento (0-200+)
 * @param bonoObjetivo - Monto base del bono pactado
 */
export function calculateBono(alcance: number, bonoObjetivo: number): number {
  const percent = calculateBonoPercent(alcance);
  return bonoObjetivo * percent;
}

/**
 * Formatea un número a moneda mexicana (MXN).
 * @param amount Cantidad numérica
 */
export function formatCurrency(amount: number): string {
  return new Intl.NumberFormat('es-MX', {
    style: 'currency',
    currency: 'MXN',
    minimumFractionDigits: 2
  }).format(amount);
}

