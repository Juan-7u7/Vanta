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
 * @param alcance - Porcentaje de cumplimiento (0-200+)
 * @param bonoObjetivo - Monto base del bono pactado
 */
export function calculateBono(alcance: number, bonoObjetivo: number): number {
  const percent = calculateBonoPercent(alcance);
  return bonoObjetivo * percent;
}

export function formatCurrency(amount: number): string {
  return new Intl.NumberFormat('es-MX', {
    style: 'currency',
    currency: 'MXN',
    minimumFractionDigits: 2
  }).format(amount);
}
