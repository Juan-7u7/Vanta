# Documentación Técnica: Motor de Cálculos COVAS 2026

Este documento describe la lógica financiera y la estructura de datos del sistema **COVAS (Compensación Variable)**. Está diseñado para servir como guía al desarrollador encargado de implementar la interfaz de impresión y generación de PDF.

---

## 1. Arquitectura de Procesamiento

El flujo de datos sigue tres etapas:
1.  **Capa de Extracción (`src/services/CovasGenerator.ts`)**: Consulta Supabase, normaliza nombres de meses y fuerza los tipos de datos a `Number`.
2.  **Capa Lógica (`src/utils/covasLogic.ts`)**: Contiene las funciones puras que aplican las reglas de negocio (Pisos, Escalones, Ajustes).
3.  **Capa de Salida**: Un objeto JSON estructurado listo para ser mapeado en componentes visuales.

---

## 2. Reglas de Negocio Financiero

La lógica central reside en la función `calcularBonoMensual`. El cálculo se realiza siguiendo este orden:

### A. Cálculo de Cumplimiento
Se obtiene el desempeño porcentual del colaborador.
*   **Fórmula**: `(Alcance Real / Meta Mensual) * 100`

### B. Regla de Piso (Filtro de Cobro)
Dependiendo del `tipo_colaborador`, se valida si tiene derecho a percibir bono:
*   **Gerente**: Debe cumplir $\ge$ 85%.
*   **Ejecutivo**: Debe cumplir $\ge$ 70%.
*   **Operativo**: Debe cumplir $>$ 0%.
*   *Si no se alcanza el piso, el bono es automáticamente $0.*

### C. Selección de Escalón (Brackets)
El sistema busca en la tabla `escalones_bonos` el porcentaje de pago correspondiente.
*   **Búsqueda Inteligente**: Los escalones se ordenan de mayor a menor. Se selecciona el primero donde el cumplimiento sea mayor o igual al `limite_inferior`.
*   **Cumplimiento Excedente**: Si el cumplimiento supera el tope máximo de la tabla, se asigna el porcentaje del escalón más alto.

### D. Base de Cálculo Dinámica (Crucial para el PDF)
Existen dos formas de calcular el monto final según el `esquemaTipo`:
1.  **Tipo `monto` (Comisiones Directas)**:
    *   **Lógica**: Se paga un porcentaje sobre lo vendido.
    *   **Fórmula**: `Alcance Real * (Porcentaje del Escalón / 100)`
2.  **Tipo `porcentaje` (Bonos Fijos)**:
    *   **Lógica**: Se paga un porcentaje sobre un bono pactado.
    *   **Fórmula**: `Monto Pactado * (Porcentaje del Escalón / 100)`

---

## 3. Estructura del Objeto de Salida

El servicio `getColaboradorDataForReport` devuelve un objeto con la siguiente forma:

```typescript
{
  nombre: string,          // Nombre completo
  matricula: string,       // ID de empleado
  puesto: string,          // Puesto oficial
  sueldoBase: number,      // Sueldo mensual base
  esquema_tipo: string,    // 'monto' o 'porcentaje'
  comisiones: [            // Array de indicadores (Filas de la tabla principal)
    {
      nombre: string,      // Nombre del indicador (ej. "Ventas")
      meta: number,        // Valor de la meta
      alcance: number,     // Valor logrado
      cumplimiento: number,// % calculado
      montoBono: number    // RESULTADO FINAL EN DINERO (Sumar esto al total)
    }
  ],
  otrosIngresos: [         // Otros conceptos (Vales, etc)
    { concepto: string, monto: number }
  ],
  aprobaciones: {          // Estado para la sección de firmas
    paso_captura: boolean,
    paso_validacion: boolean,
    paso_autorizacion: boolean,
    paso_direccion: boolean
  }
}
```

---

## 4. Guía para la Implementación del PDF

1.  **Totales**: La "Percepción Total" del PDF debe ser la suma de:
    `sueldoBase + Suma de comisiones.montoBono + Suma de otrosIngresos.monto + Ajuste Grupal`.
2.  **Formateo**: Utilizar la función `formatCurrency(valor)` de `covasLogic.ts` para asegurar que todos los montos tengan el símbolo `$` y dos decimales.
3.  **Precisión**: Mostrar los porcentajes de cumplimiento con un decimal (`.toFixed(1) + '%'`).
4.  **Firmas**: Cada paso de aprobación en `true` debe mostrar la leyenda "APROBADO" o una marca visual en el recuadro de firmas correspondiente.

---
*Documentación generada para la versión del Motor de Cálculos 2.0 (Marzo 2026).*
