# Calidad, CI y convenciones

## Comandos de calidad
- `npm run lint` – ESLint con TypeScript, react-hooks, react-refresh.
- (No hay tests automatizados aun). Sugerido: añadir vitest/react-testing-library para logica en `utils`.

## Pipeline sugerido
1) Instalar dependencias.
2) Ejecutar `npm run lint`.
3) Ejecutar `npm run build`.
4) Desplegar a Vercel solo si build pasa.

## Convenciones de codigo
- TypeScript estricto; evita `any`.
- Estilos con Tailwind; evita CSS global salvo `index.css`/`App.css`.
- Mantener calculos en `utils/*` y vistas limpias.

## Convenciones de ramas/PR
- Rama feature: `codex/<feature>` o similar.
- PR con descripcion corta, checklist: lint/build ok, notas de migracion si aplica.

## Integracion continua pendiente
- No hay configuracion CI en repo. Recomendado GitHub Actions:
```yaml
name: ci
on: [push, pull_request]
jobs:
  build:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with: { node-version: 20 }
      - run: npm ci
      - run: npm run lint
      - run: npm run build
```
