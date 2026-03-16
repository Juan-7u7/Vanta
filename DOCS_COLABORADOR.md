# Guía para el Desarrollo de PDFs (COVAS y Libro)

¡Bienvenido al equipo! Esta guía te ayudará a entender cómo está estructurada la generación de documentos en el proyecto.

## 🛠️ Tecnologías Utilizadas
Tenemos dos enfoques dependiendo del grado de personalización visual requerido:

1.  **@react-pdf/renderer** (`src/components/CovasPDF.tsx`):
    *   **Uso**: Generación declarativa (tipo React).
    *   **Ideal para**: Vista previa en tiempo real en la web antes de descargar.
    *   **Tip**: Los estilos se definen en un objeto `StyleSheet.create`. No intentes usar clases de Tailwind aquí, usa propiedades de CSS estándar (pero sin abreviaturas como `p-4`, usa `padding: 4`).

2.  **jsPDF** (`src/services/CovasPDFGenerator.ts`):
    *   **Uso**: Generación imperativa (coordenadas x, y).
    *   **Ideal para**: El "Libro de Compensaciones" (unión de múltiples hojas, tablas de datos pesadas).
    *   **Tip**: Es más rápido para documentos muy largos. Usa `service.nuevaPagina()` para separar las secciones del libro.

## 📊 Origen de los Datos
Para alimentar los PDFs, necesitarás consultar las siguientes tablas en Supabase:
- `colaboradores`: Datos personales (Nombre, Matrícula, Unidad).
- `indicadores`: Metas y alcances para el cálculo de bonos.
- `ingresos_mensuales`: Salarios base y variables.

## 💡 Recomendaciones para Escalabilidad
- **Modulariza**: Crea funciones pequeñas para dibujar componentes repetitivos (ej. un encabezado de unidad de negocio o una firma).
- **Formatos**: Siempre usa la función `formatCurrency` de `src/utils/covasLogic.ts` para mantener consistencia en los montos.
- **Logos**: Los recursos están en la carpeta `/public`. Úsalos con rutas absolutas como `/vanta-logo.png`.

## 🚀 Próximos Pasos (TODO sugeridos)
- [ ] Implementar la lógica de "Brackets" en el PDF usando `calculateBonoPercent`.
- [ ] Crear la función `generarLibroCompleto` que itere sobre un array de colaboradores.
- [ ] Añadir sección de firmas al final del documento.

¡Cualquier duda, revisa los comentarios en los archivos de servicio!
