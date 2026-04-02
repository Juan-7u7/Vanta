# Arquitectura y decisiones

## Visión general
- SPA con React + Vite; estado local y algunos contextos (AuthContext).
- Supabase como backend (auth + base de datos Postgres).
- Generacion de PDF en dos sabores:
  - Declarativo con `@react-pdf/renderer` para previsualizacion (`src/components/CovasPDF.tsx`).
  - Imperativo con `jsPDF` para el libro completo (`src/services/CovasPDFGenerator.tsx`).

## Flujos principales
- Login: `src/context/AuthContext.tsx` inicializa cliente Supabase desde `src/lib/supabase.ts`.
- Datos: paginas en `src/pages/*` consultan Supabase para colaboradores, indicadores, escalones y generan vistas/tablas.
- Calculos financieros: funciones puras en `src/utils/covasLogic*.ts` (mensual, quarterly, monthly). Se usan desde servicios y paginas.
- Plantillas: `src/config/esquemasPlantilla.ts` define esquemas base que el seed sube a `esquemas_pago` y `escalones_bonos`.
- PDF: `src/services/CovasGenerator.ts` arma DTOs; `CovasPDF.tsx` renderiza; `CovasPDFGenerator.tsx` arma libro via jsPDF.

## Decisiones clave
- Tipado estricto con TypeScript para evitar regresiones en calculo financiero.
- Separacion de UI y motor de calculo: `utils` no dependende de React.
- Tailwind 4 para estilos utilitarios rapidos; iconos con lucide-react.
- Router 7 para paginas protegidas y navegacion declarativa.

## Puntos sensibles
- Dependencia fuerte de Supabase: network errors/roles impactan toda la app; maneja tokens y expiracion.
- Semillas requieren rol de servicio; evita correr en prod sin revisarlas.
- Formato de moneda y porcentajes centralizado en `covasLogic.ts` para consistencia en PDF y UI.
