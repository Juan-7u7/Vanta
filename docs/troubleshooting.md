# Troubleshooting rapido

- **401/403 desde Supabase**: verifica que `.env` tenga `VITE_SUPABASE_URL` y `VITE_SUPABASE_ANON_KEY` vigentes; tokens expiran si fueron rotados.
- **Seed falla por columnas**: mensaje indica agregar `slug` y `fuente` a `esquemas_pago` (ver `docs/db.md`).
- **Seed falla por permisos**: necesitas `SUPABASE_SERVICE_ROLE`; el anon key no puede borrar/insertar en tablas protegidas.
- **Build rompe por Tailwind**: asegúrate de usar Node 20+, reinstala deps (`rm -rf node_modules && npm install`); Tailwind 4 requiere Vite 8 (ya presente).
- **Rutas 404 en deploy**: en hosting distinto a Vercel activa rewrite al `index.html`.
- **PDF sin estilos**: revisa rutas de logos en `/public` y usa `formatCurrency` de `src/utils/covasLogic.ts`.
- **Lint falla**: ejecuta `npm run lint -- --fix` para ajustes triviales; revisa reglas en `eslint.config.js`.
