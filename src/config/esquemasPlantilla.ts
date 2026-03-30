/**
 * Plantillas de esquemas de pago versionadas en código.
 *
 * Estas plantillas sirven como fuente de verdad para poblar/actualizar
 * la tabla `esquemas_pago` y sus `escalones_bonos` en Supabase durante
 * fases posteriores (seed/sync). No se usan todavía en tiempo de ejecución.
 */

export type TipoEsquema = 'porcentaje' | 'meses' | 'monto' | 'ranking';

export interface EscalonPlantilla {
  limite_inferior: number;
  limite_superior: number;
  porcentaje_pago: number;
  etiqueta?: string; // opcional para rankings
}

export interface EsquemaPlantilla {
  slug: string;               // identificador estable para upserts
  nombre: string;
  tipo: TipoEsquema;
  descripcion?: string;
  escalones: EscalonPlantilla[];
  metadata?: Record<string, any>; // parámetros adicionales de lógica
}

/**
 * Colección base de plantillas listas para sincronizar con BD.
 * - SLUGS son estables y se usarán como clave única.
 * - Se mantiene simple para evitar dependencias con la BD actual.
 */
export const ESQUEMAS_PLANTILLA_BASE: EsquemaPlantilla[] = [
  {
    slug: 'porcentaje-70-lineal-cap',
    nombre: 'Porcentaje 70% lineal con tope',
    tipo: 'porcentaje',
    descripcion: 'Activa pago después del 70% de cumplimiento; paga 1% del cumplimiento (lineal) con tope configurable.',
    escalones: [
      { limite_inferior: 0, limite_superior: 69.99, porcentaje_pago: 0 },
      { limite_inferior: 70, limite_superior: 99.99, porcentaje_pago: 100 },
      { limite_inferior: 100, limite_superior: 120, porcentaje_pago: 120 },
      { limite_inferior: 120.01, limite_superior: 9999, porcentaje_pago: 120 }, // tope por defecto
    ],
    metadata: { regla_calculo: 'lineal_desde_70', slope: 1, tope: 120 },
  },
  {
    slug: 'meses-creciente',
    nombre: 'Meses creciente por periodo',
    tipo: 'meses',
    descripcion: 'Incrementa % de pago por mes de evaluación (ej. ene 100, feb 120, mar 140). El admin edita los valores.',
    escalones: [
      { limite_inferior: 1, limite_superior: 1, porcentaje_pago: 100, etiqueta: 'mes1' },
      { limite_inferior: 2, limite_superior: 2, porcentaje_pago: 120, etiqueta: 'mes2' },
      { limite_inferior: 3, limite_superior: 3, porcentaje_pago: 140, etiqueta: 'mes3' },
    ],
    metadata: { regla_calculo: 'meses_creciente', editable: true },
  },
  {
    slug: 'comision-directa-monto-fijo',
    nombre: 'Comisión directa (monto fijo por cumplimiento)',
    tipo: 'monto',
    descripcion: 'Paga un monto fijo según tramo de cumplimiento. Tope editable por admin.',
    escalones: [
      { limite_inferior: 0, limite_superior: 69.99, porcentaje_pago: 0 },
      { limite_inferior: 70, limite_superior: 89.99, porcentaje_pago: 50 },
      { limite_inferior: 90, limite_superior: 99.99, porcentaje_pago: 100 },
      { limite_inferior: 100, limite_superior: 120, porcentaje_pago: 120 },
    ],
    metadata: { regla_calculo: 'monto_fijo_por_tramo', base: 'monto_fijo' },
  },
];

export default ESQUEMAS_PLANTILLA_BASE;
