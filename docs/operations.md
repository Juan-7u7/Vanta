# Operaciones y despliegue

## Despliegue
- Objetivo recomendado: Vercel (SPA). Archivo `vercel.json` ya reescribe todo a `index.html`.
- Variables en Vercel:
  - `VITE_SUPABASE_URL`
  - `VITE_SUPABASE_ANON_KEY`
- No subas `SUPABASE_SERVICE_ROLE` a entornos publicos. Usala solo en pipelines privados o en local para seeds.

## Ramas y releases sugeridas
- Prefijo `codex/` para ramas de trabajo (opcional); main/prod despliega a Vercel.
- Usa PRs con lint obligatorio (`npm run lint`) y build (`npm run build`).

## Monitoreo y logging
- Frontend: inspecciona consola del navegador y logs de Vercel (Functions no usadas por ahora).
- Supabase: usa panel de logs para errores SQL y auditoria.
- Healthcheck: la SPA responde 200 en `/`; no hay endpoint dedicado.

## Accesos y roles
- Supabase: administrador con rol de servicio para seeds y migraciones.
- Vercel: acceso al proyecto para configurar envs y redeploy.
- Repositorio: mantener Owners y Write; proteger rama principal con CI opcional.

## Backup/restore
- Base de datos Postgres gestionada por Supabase:
  - Backup automatico en Supabase (segun plan). Export manual via `pg_dump` desde la consola.
  - Para restaurar localmente: usa `pg_restore` o carga CSV desde Supabase SQL editor.
- Seeds: `npm run seed:plantillas` repuebla `esquemas_pago` y `escalones_bonos` sin tocar otros datos.

## Tareas recurrentes
- Revisar vencimiento de keys anon cada 30 dias y rotar claves en `.env` y Vercel.
- Revalidar permisos de tablas cuando cambien columnas (ver `src/config/esquemasPlantilla.ts`).
