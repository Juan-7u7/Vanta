# Vanta Media - Sistema de Compensaciones 2026

Sistema integral para la gestión, cálculo y generación de Planes de Compensación Variable (COVAS) para Vanta Media.

## 🚀 Tecnologías Principales
- **Frontend**: React 18 + TypeScript + Vite
- **Estilos**: Tailwind CSS (Lucide React para iconos)
- **Base de Datos & Auth**: Supabase
- **PDF**: @react-pdf/renderer (Generación dinámica de documentos)

## 📁 Estructura del Proyecto
- `/src/components`: Componentes reutilizables de UI y componentes complejos como los visualizadores de PDF.
- `/src/context`: Contextos globales (ej. AuthContext para manejo de sesiones).
- `/src/lib`: Configuraciones de librerías externas (Supabase client).
- `/src/pages`: Vistas principales del sistema (Dashboard, Usuarios, Indicadores, etc.).
- `/src/services`: Lógica de negocio pesada, como la orquestación de generación de archivos.
- `/src/utils`: Funciones de utilidad puras y lógica de cálculo matemático/financiero.

## 🛠️ Instalación y Desarrollo
1. Clonar el repositorio.
2. Instalar dependencias: `npm install`
3. Configurar variables de entorno (`.env`):
   ```env
   VITE_SUPABASE_URL=tu_url
   VITE_SUPABASE_ANON_KEY=tu_key
   ```
4. Iniciar servidor de desarrollo: `npm run dev`

## 📖 Mantenimiento y Escalabilidad
El proyecto sigue un enfoque modular:
1. **Lógica separada**: Los cálculos de bonos residen en `utils/covasLogic.ts` para facilitar pruebas unitarias.
2. **Servicios**: La generación de PDFs está aislada en servicios para permitir cambios de librería sin afectar la UI.
3. **Tipado Estricto**: Se utiliza TypeScript en todo el proyecto para minimizar errores en tiempo de ejecución.

## 📝 Documentación de Funciones Especiales
Las funciones críticas de cálculo y seguridad están documentadas con JSDoc dentro del código para referencia rápida en el IDE.

