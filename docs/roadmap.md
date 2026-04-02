# Roadmap y deudas conocidas

- PDF libro completo: agregar funcion `generarLibroCompleto` iterando colaboradores (ver `DOCS_COLABORADOR.md`).
- Brackets/ajustes avanzados: completar logica de "Brackets" en PDF imperativo usando `calculateBonoPercent`.
- Firmas PDF: añadir seccion de firmas en documento final.
- Tests automatizados: agregar suite con Vitest/RTL para `src/utils/covasLogic*.ts` y componentes criticos.
- Observabilidad: capturar errores en front (Sentry/LogRocket) y métricas basicas.
- CI: incorporar GitHub Actions (lint + build) y gates para PRs.
- Accesos y seguridad: rotar claves Supabase y documentar pipeline de rotacion; añadir supabase RLS si aplica.
