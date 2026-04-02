-- Esquema base para entorno local/QA.
-- Ordenado para respetar dependencias. Ajusta tipos enum según tu instancia si difieren.

CREATE TABLE IF NOT EXISTS public.unidades_negocio (
  id SERIAL PRIMARY KEY,
  nombre TEXT NOT NULL,
  color_hex TEXT DEFAULT '#1e3a8a',
  logo_url TEXT
);

CREATE TABLE IF NOT EXISTS public.perfiles_seguridad (
  id SERIAL PRIMARY KEY,
  nombre_perfil TEXT NOT NULL,
  nivel_acceso INTEGER NOT NULL
);

CREATE TABLE IF NOT EXISTS public.esquemas_pago (
  id SERIAL PRIMARY KEY,
  nombre TEXT NOT NULL,
  tipo TEXT NOT NULL CHECK (tipo IN ('porcentaje','meses','monto','ranking')),
  descripcion TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  metodo_evaluacion TEXT DEFAULT 'rango' CHECK (metodo_evaluacion IN ('rango','valor_exacto','ranking')),
  slug TEXT UNIQUE,
  fuente TEXT,
  regla_calculo TEXT,
  metadata JSONB
);

CREATE TABLE IF NOT EXISTS public.escalones_bonos (
  id SERIAL PRIMARY KEY,
  bono_id INTEGER,
  limite_inferior NUMERIC NOT NULL,
  limite_superior NUMERIC NOT NULL,
  porcentaje_pago NUMERIC NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now(),
  esquema_id INTEGER REFERENCES public.esquemas_pago(id),
  valor_referencia TEXT,
  descripcion_regla TEXT
);

CREATE TABLE IF NOT EXISTS public.colaboradores (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  auth_id UUID UNIQUE,
  email TEXT NOT NULL UNIQUE,
  nombre TEXT,
  apellido_paterno TEXT,
  apellido_materno TEXT,
  puesto TEXT,
  area TEXT,
  razon_social TEXT,
  unidad_negocio_id INTEGER REFERENCES public.unidades_negocio(id),
  perfil_id INTEGER REFERENCES public.perfiles_seguridad(id),
  jefe_id UUID REFERENCES public.colaboradores(id),
  esta_activo BOOLEAN DEFAULT true,
  fecha_ingreso DATE DEFAULT CURRENT_DATE,
  matricula TEXT,
  tipo_colaborador TEXT DEFAULT 'Ejecutivo',
  esquema_pago_id INTEGER REFERENCES public.esquemas_pago(id)
);

CREATE TABLE IF NOT EXISTS public.metas_indicadores (
  id SERIAL PRIMARY KEY,
  colaborador_id UUID REFERENCES public.colaboradores(id),
  nombre_indicador TEXT,
  tipo_indicador TEXT,
  anio INTEGER DEFAULT 2026,
  enero NUMERIC DEFAULT 0,
  febrero NUMERIC DEFAULT 0,
  marzo NUMERIC DEFAULT 0,
  abril NUMERIC DEFAULT 0,
  mayo NUMERIC DEFAULT 0,
  junio NUMERIC DEFAULT 0,
  julio NUMERIC DEFAULT 0,
  agosto NUMERIC DEFAULT 0,
  septiembre NUMERIC DEFAULT 0,
  octubre NUMERIC DEFAULT 0,
  noviembre NUMERIC DEFAULT 0,
  diciembre NUMERIC DEFAULT 0,
  grupo_id INTEGER,
  esquema_pago_id INTEGER REFERENCES public.esquemas_pago(id),
  unidad_medida TEXT DEFAULT 'moneda' CHECK (unidad_medida IN ('moneda','cantidad','porcentaje')),
  ponderacion NUMERIC DEFAULT 0
);

CREATE TABLE IF NOT EXISTS public.alcance_real (
  id SERIAL PRIMARY KEY,
  colaborador_id UUID REFERENCES public.colaboradores(id),
  anio INTEGER DEFAULT 2026,
  enero NUMERIC DEFAULT 0,
  febrero NUMERIC DEFAULT 0,
  marzo NUMERIC DEFAULT 0,
  abril NUMERIC DEFAULT 0,
  mayo NUMERIC DEFAULT 0,
  junio NUMERIC DEFAULT 0,
  julio NUMERIC DEFAULT 0,
  agosto NUMERIC DEFAULT 0,
  septiembre NUMERIC DEFAULT 0,
  octubre NUMERIC DEFAULT 0,
  noviembre NUMERIC DEFAULT 0,
  diciembre NUMERIC DEFAULT 0,
  indicador_id INTEGER REFERENCES public.metas_indicadores(id)
);

CREATE TABLE IF NOT EXISTS public.salarios_mensuales (
  id SERIAL PRIMARY KEY,
  colaborador_id UUID REFERENCES public.colaboradores(id),
  anio INTEGER DEFAULT 2026,
  enero NUMERIC DEFAULT 0,
  febrero NUMERIC DEFAULT 0,
  marzo NUMERIC DEFAULT 0,
  abril NUMERIC DEFAULT 0,
  mayo NUMERIC DEFAULT 0,
  junio NUMERIC DEFAULT 0,
  julio NUMERIC DEFAULT 0,
  agosto NUMERIC DEFAULT 0,
  septiembre NUMERIC DEFAULT 0,
  octubre NUMERIC DEFAULT 0,
  noviembre NUMERIC DEFAULT 0,
  diciembre NUMERIC DEFAULT 0
);

CREATE TABLE IF NOT EXISTS public.otros_ingresos (
  id SERIAL PRIMARY KEY,
  colaborador_id UUID REFERENCES public.colaboradores(id),
  nombre_concepto TEXT,
  anio INTEGER DEFAULT 2026,
  enero NUMERIC DEFAULT 0,
  febrero NUMERIC DEFAULT 0,
  marzo NUMERIC DEFAULT 0,
  abril NUMERIC DEFAULT 0,
  mayo NUMERIC DEFAULT 0,
  junio NUMERIC DEFAULT 0,
  julio NUMERIC DEFAULT 0,
  agosto NUMERIC DEFAULT 0,
  septiembre NUMERIC DEFAULT 0,
  octubre NUMERIC DEFAULT 0,
  noviembre NUMERIC DEFAULT 0,
  diciembre NUMERIC DEFAULT 0
);

CREATE TABLE IF NOT EXISTS public.pasos_aprobacion (
  id SERIAL PRIMARY KEY,
  colaborador_id UUID REFERENCES public.colaboradores(id),
  mes TEXT NOT NULL,
  anio INTEGER DEFAULT 2026,
  paso_captura BOOLEAN DEFAULT false,
  paso_validacion BOOLEAN DEFAULT false,
  paso_autorizacion BOOLEAN DEFAULT false,
  paso_direccion BOOLEAN DEFAULT false
);

CREATE TABLE IF NOT EXISTS public.pagos_realizados (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  colaborador_id UUID REFERENCES public.colaboradores(id),
  anio INTEGER NOT NULL,
  periodo TEXT NOT NULL,
  monto_bono_calculado NUMERIC,
  monto_pagado_anticipo NUMERIC,
  es_ajuste_anual BOOLEAN DEFAULT false,
  notas TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  monto_total_calculado_periodo NUMERIC DEFAULT 0,
  saldo_pendiente_arrastrado NUMERIC DEFAULT 0,
  neto_final_pagado NUMERIC DEFAULT 0
);
