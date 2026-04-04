# Guía rápida para nuevos desarrolladores

## Stack y entrypoints
- **Frontend**: React 19 + TypeScript + Vite + Tailwind v4 (modo JIT).  
- **Auth/datos**: Supabase (client en `src/lib/supabase.ts`).  
- **PDF**: Declarativo con `@react-pdf/renderer` (`src/services/CovasPDFGenerator.tsx`) y HTML->PDF para reportes (`ImprimirCovas.tsx`).
- **Estado**: Contexto de auth (`src/context/AuthContext.tsx`); resto de datos se cargan por vista (sin React Query).

## Rutas clave
- `src/App.tsx` define rutas protegidas (login ↔ dashboard).
- `src/pages/*` vistas principales:  
  - `Dashboard.tsx`: overview y subrutas.  
  - `EscalonesBonos.tsx`: gestión de esquemas y escalones.  
  - `ImprimirCovas.tsx`: generación de COVAS.  
  - `Login.tsx`: acceso Supabase.  

## Supabase: tablas que usa hoy la app
- alcance_real, cat_bonos, colaboradores, comisiones_directas, escalones_bonos, esquemas_pago,
  imagenes, metas_indicadores, otros_ingresos, pagos_realizados, pasos_aprobacion,
  perfiles_seguridad, salarios_mensuales, unidades_negocio.
- Seed de plantillas: `npm run seed:plantillas` (requiere SUPABASE_URL + SUPABASE_SERVICE_ROLE).

## Roles rápidos (UI)
- Si el email empieza con `contralor`, la UI limita menú (solo indicadores, salarios, alcance, escalones, ver comisiones, imprimir COVAS). No hay RLS aplicada aún: si se necesita seguridad real, agregar policies en Supabase.

## PDFs y COVAS
- Declarativo: `src/services/CovasPDFGenerator.tsx` (usa `CovasDocument`).
- Lógica de datos: `src/services/CovasGenerator.ts` (mensual/trimestral).
- Vista HTML+PDF: `src/pages/ImprimirCovas.tsx` (descarga, previsualización).

## Semillas y plantillas
- Base de esquemas en `src/config/esquemasPlantilla.ts`.
- Script: `scripts/seedPlantillas.ts` (upsert a `esquemas_pago` + `escalones_bonos`).

## Estilo y accesibilidad
- Tailwind v4; dark mode activo. Inputs en modales han sido ajustados con `dark:text-white`.
- Evita copiar código con acentos rotos; guarda archivos en UTF-8.

## Comandos útiles
- `npm run dev` | `npm run build` | `npm run lint`.
- `npm run seed:plantillas` para reponer plantillas en BD.

## Pendientes sugeridos
- Aplicar RLS para contralores (bloquear insert/delete) y guardar rol en JWT.
- Añadir cache de datos (React Query) y paginación en vistas grandes.
- Tests básicos (unit de lógica covas + smoke e2e).

## Contactos y secretos
- Variables de entorno: ver `.env` y `docs/secrets.example.env`.
- Para despliegue: configurar Vercel con `VITE_SUPABASE_URL` y `VITE_SUPABASE_ANON_KEY`; usar clave de servicio solo en entorno seguro para seeds.
