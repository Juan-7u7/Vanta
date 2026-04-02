# Vanta Media – Sistema de Compensaciones 2026

Aplicacion web para gestionar y calcular planes de compensacion variable (COVAS). Stack: React 18 + TypeScript + Vite + TailwindCSS, Supabase como backend y auth, generacion de PDF con @react-pdf/renderer y jsPDF.

## Inicio rapido
- Requisitos: Node 20+, npm, acceso a Supabase (URL y keys), Git.
- Instalar dependencias: `npm install`
- Variables: copia `docs/secrets.example.env` a `.env` y completa tus claves.
- Desarrollo: `npm run dev`
- Lint: `npm run lint`
- Build: `npm run build`
- Previsualizar build: `npm run preview`
- Sembrar plantillas en BD: `npm run seed:plantillas` (requiere servicio Supabase con permisos de escritura).

## Arquitectura breve
- `src/pages` vistas principales (Dashboard, Bonos, Escalones, etc.).
- `src/components` modales y UI reutilizable, PDFs declarativos.
- `src/services` generadores PDF imperativo/declarativo y fetch de datos.
- `src/utils` motor financiero (covasLogic*).
- `src/config` plantillas de esquemas predefinidas.
- `src/lib/supabase.ts` inicializacion del cliente.

## Documentacion
Plantillas completas en `docs/`:
- `docs/setup.md` – instalacion, entorno, primer arranque.
- `docs/architecture.md` – modulos, flujos de datos y decisiones.
- `docs/operations.md` – despliegue, monitoreo, accesos.
- `docs/ci_cd.md` – pipelines y convenciones de calidad.
- `docs/db.md` – tablas clave, seeds y backup/restore.
- `docs/troubleshooting.md` – errores comunes y fixes rapidos.
- `docs/roadmap.md` – pendientes y mejoras sugeridas.
- `docs/secrets.example.env` – plantilla de variables sin secretos.

Docs especificas existentes:
- `DOCS_COLABORADOR.md` – generacion de PDFs.
- `README_LOGICA_FINANCIERA.md` – motor de calculos COVAS.

## Despliegue sugerido
- Vercel (ver `vercel.json` rewrite SPA).
- Configura `VITE_SUPABASE_URL` y `VITE_SUPABASE_ANON_KEY` en los env de Vercel. Para tareas de seed usa una clave de servicio solo en entorno seguro.

## Licencia y soporte
Licencia no especificada en el repo. Incluye en `LICENSE` si aplica. Contactos y accesos en `docs/operations.md`.
