# Base de datos y seeds

## Motor
- Supabase Postgres. Cliente en `src/lib/supabase.ts`.

## Tablas relevantes
- `esquemas_pago`:
  - Columnas clave: `id`, `slug` (UNIQUE), `nombre`, `tipo`, `descripcion`, `fuente`.
- `escalones_bonos`:
  - Columnas: `id`, `esquema_id` (FK a esquemas_pago), `limite_inferior`, `limite_superior`, `porcentaje_pago`, `etiqueta`.
- Tablas operativas usadas en PDF (segun DOCS_COLABORADOR): `colaboradores`, `indicadores`, `ingresos_mensuales`, etc.

## Seeds
- Script: `npm run seed:plantillas` (ejecuta `scripts/seedPlantillas.ts`).
- Requiere variables:
  - `SUPABASE_URL` o `VITE_SUPABASE_URL`
  - `SUPABASE_SERVICE_ROLE` o `SUPABASE_ANON_KEY` (mejor service role).
- Que hace:
  - Upsert plantillas de `src/config/esquemasPlantilla.ts` en `esquemas_pago` usando `slug`.
  - Borra y vuelve a insertar escalones asociados en `escalones_bonos`.
- Prechequeos: valida que `esquemas_pago` tenga columnas `slug` y `fuente`; si faltan, sugiere:
```
ALTER TABLE esquemas_pago ADD COLUMN slug text UNIQUE;
ALTER TABLE esquemas_pago ADD COLUMN fuente text;
```

## Datos de prueba
- Agrega registros dummy en `colaboradores`, `indicadores`, `ingresos_mensuales` para probar PDFs.
- Usa seeds separados o importa CSV desde Supabase si ya existen.

## Backups
- Desde consola Supabase: `pg_dump` para export; `pg_restore` para importar.
- Mantener backup antes de correr seeds en produccion si dudas.
