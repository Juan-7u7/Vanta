# Setup e instalacion

## Requisitos
- Node 20 o superior y npm.
- Acceso a Supabase: URL del proyecto, anon key para front y service role para seeds.
- Git y una cuenta en Vercel (o host equivalente) para despliegue.

## Primer arranque (5 minutos)
1) Clona el repo.
2) Duplica `docs/secrets.example.env` como `.env` y rellena valores.
3) Instala dependencias: `npm install`.
4) Arranca en modo desarrollo: `npm run dev` (Vite en http://localhost:5173).

## Scripts utiles
- `npm run dev` – servidor de desarrollo.
- `npm run lint` – ESLint con TypeScript.
- `npm run build` – compila TypeScript y Vite.
- `npm run preview` – sirve el build generado.
- `npm run seed:plantillas` – sincroniza plantillas de esquemas con Supabase (requiere service role).

## Variables de entorno
Usa `.env` en la raiz. Claves principales:
- `VITE_SUPABASE_URL`
- `VITE_SUPABASE_ANON_KEY`
- Opcional para seeds: `SUPABASE_URL`, `SUPABASE_SERVICE_ROLE` (o reutiliza las VITE*).

## Dependencias base
- React 18, React Router 7.
- Tailwind 4.
- Supabase JS v2.
- Generacion de PDF: @react-pdf/renderer y jsPDF (+ autotable).

## Estructura minima
- `src/pages` – vistas.
- `src/components` – modales/UI compartida y PDFs declarativos.
- `src/services` – generacion PDF y fetch de datos.
- `src/utils` – motor de calculo COVAS.
- `src/config` – plantillas de esquemas para seeds.
