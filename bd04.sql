-- WARNING: This schema is for context only and is not meant to be run.
-- Table order and constraints may not be valid for execution.

CREATE TABLE public.alcance_real (
  id integer NOT NULL DEFAULT nextval('alcance_real_id_seq'::regclass),
  colaborador_id uuid,
  anio integer DEFAULT 2026,
  enero numeric DEFAULT 0,
  febrero numeric DEFAULT 0,
  marzo numeric DEFAULT 0,
  abril numeric DEFAULT 0,
  mayo numeric DEFAULT 0,
  junio numeric DEFAULT 0,
  julio numeric DEFAULT 0,
  agosto numeric DEFAULT 0,
  septiembre numeric DEFAULT 0,
  octubre numeric DEFAULT 0,
  noviembre numeric DEFAULT 0,
  diciembre numeric DEFAULT 0,
  indicador_id integer,
  CONSTRAINT alcance_real_pkey PRIMARY KEY (id),
  CONSTRAINT alcance_real_colaborador_id_fkey FOREIGN KEY (colaborador_id) REFERENCES public.colaboradores(id),
  CONSTRAINT alcance_real_indicador_id_fkey FOREIGN KEY (indicador_id) REFERENCES public.metas_indicadores(id)
);
CREATE TABLE public.aprobaciones_covas (
  id bigint NOT NULL DEFAULT nextval('aprobaciones_covas_id_seq'::regclass),
  colaborador_id uuid NOT NULL,
  periodo_consolidado_id bigint NOT NULL,
  paso_captura boolean NOT NULL DEFAULT false,
  paso_validacion boolean NOT NULL DEFAULT false,
  paso_autorizacion boolean NOT NULL DEFAULT false,
  paso_direccion boolean NOT NULL DEFAULT false,
  responsable_captura text,
  responsable_validacion text,
  responsable_autorizacion text,
  responsable_direccion text,
  fecha_captura timestamp with time zone,
  fecha_validacion timestamp with time zone,
  fecha_autorizacion timestamp with time zone,
  fecha_direccion timestamp with time zone,
  observaciones text,
  updated_at timestamp with time zone NOT NULL DEFAULT now(),
  CONSTRAINT aprobaciones_covas_pkey PRIMARY KEY (id),
  CONSTRAINT aprobaciones_covas_colaborador_id_fkey FOREIGN KEY (colaborador_id) REFERENCES public.colaboradores_v2(id),
  CONSTRAINT aprobaciones_covas_periodo_consolidado_id_fkey FOREIGN KEY (periodo_consolidado_id) REFERENCES public.periodos_consolidado(id)
);
CREATE TABLE public.bitacora_calculo_covas (
  id bigint NOT NULL DEFAULT nextval('bitacora_calculo_covas_id_seq'::regclass),
  colaborador_id uuid NOT NULL,
  periodo_consolidado_id bigint NOT NULL,
  version_calculo integer NOT NULL,
  accion text NOT NULL CHECK (accion = ANY (ARRAY['calculo'::text, 'recalculo'::text, 'regeneracion_pdf'::text, 'ajuste_manual'::text])),
  detalle text,
  ejecutado_por text,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  CONSTRAINT bitacora_calculo_covas_pkey PRIMARY KEY (id),
  CONSTRAINT bitacora_calculo_covas_colaborador_id_fkey FOREIGN KEY (colaborador_id) REFERENCES public.colaboradores_v2(id),
  CONSTRAINT bitacora_calculo_covas_periodo_consolidado_id_fkey FOREIGN KEY (periodo_consolidado_id) REFERENCES public.periodos_consolidado(id)
);
CREATE TABLE public.cat_bonos (
  id integer NOT NULL DEFAULT nextval('cat_bonos_id_seq'::regclass),
  nombre_bono text NOT NULL,
  descripcion text,
  esta_activo boolean DEFAULT true,
  created_at timestamp with time zone DEFAULT now(),
  CONSTRAINT cat_bonos_pkey PRIMARY KEY (id)
);
CREATE TABLE public.cat_grupos_indicadores (
  id integer NOT NULL DEFAULT nextval('cat_grupos_indicadores_id_seq'::regclass),
  nombre_grupo text NOT NULL,
  orden_visual integer DEFAULT 0,
  created_at timestamp with time zone DEFAULT now(),
  CONSTRAINT cat_grupos_indicadores_pkey PRIMARY KEY (id)
);
CREATE TABLE public.colaboradores (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  auth_id uuid UNIQUE,
  email text NOT NULL UNIQUE,
  nombre text,
  apellido_paterno text,
  apellido_materno text,
  puesto text,
  area text,
  razon_social text,
  unidad_negocio_id integer,
  perfil_id integer,
  jefe_id uuid,
  esta_activo boolean DEFAULT true,
  fecha_ingreso date DEFAULT CURRENT_DATE,
  matricula text,
  tipo_colaborador USER-DEFINED DEFAULT 'Ejecutivo'::tipo_empleado,
  esquema_pago_id integer,
  CONSTRAINT colaboradores_pkey PRIMARY KEY (id),
  CONSTRAINT colaboradores_unidad_negocio_id_fkey FOREIGN KEY (unidad_negocio_id) REFERENCES public.unidades_negocio(id),
  CONSTRAINT colaboradores_perfil_id_fkey FOREIGN KEY (perfil_id) REFERENCES public.perfiles_seguridad(id),
  CONSTRAINT colaboradores_jefe_id_fkey FOREIGN KEY (jefe_id) REFERENCES public.colaboradores(id),
  CONSTRAINT colaboradores_esquema_pago_id_fkey FOREIGN KEY (esquema_pago_id) REFERENCES public.esquemas_pago(id)
);
CREATE TABLE public.colaboradores_v2 (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  auth_id uuid UNIQUE,
  unidad_negocio_id bigint NOT NULL,
  tipo_colaborador_id bigint,
  nivel_organizacional_id bigint,
  jefe_directo_id uuid,
  email text NOT NULL UNIQUE,
  nombre text NOT NULL,
  apellido_paterno text,
  apellido_materno text,
  puesto text,
  area text,
  matricula text,
  fecha_ingreso date DEFAULT CURRENT_DATE,
  mostrar_jefe_directo boolean NOT NULL DEFAULT true,
  esta_activo boolean NOT NULL DEFAULT true,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now(),
  CONSTRAINT colaboradores_v2_pkey PRIMARY KEY (id),
  CONSTRAINT colaboradores_v2_nivel_organizacional_id_fkey FOREIGN KEY (nivel_organizacional_id) REFERENCES public.niveles_organizacionales(id),
  CONSTRAINT colaboradores_v2_jefe_directo_id_fkey FOREIGN KEY (jefe_directo_id) REFERENCES public.colaboradores_v2(id),
  CONSTRAINT colaboradores_v2_unidad_negocio_id_fkey FOREIGN KEY (unidad_negocio_id) REFERENCES public.unidades_negocio_v2(id),
  CONSTRAINT colaboradores_v2_tipo_colaborador_id_fkey FOREIGN KEY (tipo_colaborador_id) REFERENCES public.tipos_colaborador(id)
);
CREATE TABLE public.configuracion_unidad_negocio (
  id bigint NOT NULL DEFAULT nextval('configuracion_unidad_negocio_id_seq'::regclass),
  unidad_negocio_id bigint NOT NULL,
  usa_jefe_directo boolean NOT NULL DEFAULT true,
  max_overheads integer NOT NULL DEFAULT 2,
  permite_bonos_fijos boolean NOT NULL DEFAULT true,
  permite_periodos_personalizados boolean NOT NULL DEFAULT true,
  mostrar_jefe_directo_en_pdf boolean NOT NULL DEFAULT true,
  vigente_desde date NOT NULL DEFAULT CURRENT_DATE,
  vigente_hasta date,
  esta_activa boolean NOT NULL DEFAULT true,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  CONSTRAINT configuracion_unidad_negocio_pkey PRIMARY KEY (id),
  CONSTRAINT configuracion_unidad_negocio_unidad_negocio_id_fkey FOREIGN KEY (unidad_negocio_id) REFERENCES public.unidades_negocio_v2(id)
);
CREATE TABLE public.escalones_bonos (
  id integer NOT NULL DEFAULT nextval('escalones_bonos_id_seq'::regclass),
  bono_id integer,
  limite_inferior numeric NOT NULL,
  limite_superior numeric NOT NULL,
  porcentaje_pago numeric NOT NULL,
  created_at timestamp with time zone DEFAULT now(),
  esquema_id integer,
  valor_referencia text,
  descripcion_regla text,
  etiqueta text,
  CONSTRAINT escalones_bonos_pkey PRIMARY KEY (id),
  CONSTRAINT escalones_bonos_bono_id_fkey FOREIGN KEY (bono_id) REFERENCES public.cat_bonos(id),
  CONSTRAINT escalones_bonos_esquema_id_fkey FOREIGN KEY (esquema_id) REFERENCES public.esquemas_pago(id)
);
CREATE TABLE public.escalones_compensacion_v2 (
  id bigint NOT NULL DEFAULT nextval('escalones_compensacion_v2_id_seq'::regclass),
  esquema_compensacion_id bigint NOT NULL,
  orden integer NOT NULL,
  limite_inferior numeric NOT NULL,
  limite_superior numeric NOT NULL,
  porcentaje_pago numeric NOT NULL CHECK (porcentaje_pago >= 0::numeric),
  etiqueta text,
  descripcion text,
  esta_activo boolean NOT NULL DEFAULT true,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  CONSTRAINT escalones_compensacion_v2_pkey PRIMARY KEY (id),
  CONSTRAINT escalones_compensacion_v2_esquema_compensacion_id_fkey FOREIGN KEY (esquema_compensacion_id) REFERENCES public.esquemas_compensacion_v2(id)
);
CREATE TABLE public.esquemas_compensacion_v2 (
  id bigint NOT NULL DEFAULT nextval('esquemas_compensacion_v2_id_seq'::regclass),
  unidad_negocio_id bigint,
  tipo_esquema_id bigint NOT NULL,
  metodo_evaluacion_id bigint NOT NULL,
  clave text,
  nombre text NOT NULL,
  descripcion text,
  version integer NOT NULL DEFAULT 1,
  vigente_desde date NOT NULL,
  vigente_hasta date,
  esta_activo boolean NOT NULL DEFAULT true,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now(),
  CONSTRAINT esquemas_compensacion_v2_pkey PRIMARY KEY (id),
  CONSTRAINT esquemas_compensacion_v2_unidad_negocio_id_fkey FOREIGN KEY (unidad_negocio_id) REFERENCES public.unidades_negocio_v2(id),
  CONSTRAINT esquemas_compensacion_v2_tipo_esquema_id_fkey FOREIGN KEY (tipo_esquema_id) REFERENCES public.tipos_esquema_compensacion(id),
  CONSTRAINT esquemas_compensacion_v2_metodo_evaluacion_id_fkey FOREIGN KEY (metodo_evaluacion_id) REFERENCES public.metodos_evaluacion(id)
);
CREATE TABLE public.esquemas_pago (
  id integer NOT NULL DEFAULT nextval('esquemas_pago_id_seq'::regclass),
  nombre text NOT NULL,
  tipo text NOT NULL CHECK (tipo = ANY (ARRAY['porcentaje'::text, 'meses'::text, 'monto'::text, 'ranking'::text])),
  descripcion text,
  created_at timestamp with time zone DEFAULT now(),
  metodo_evaluacion text DEFAULT 'rango'::text CHECK (metodo_evaluacion = ANY (ARRAY['rango'::text, 'valor_exacto'::text, 'ranking'::text])),
  slug text UNIQUE,
  fuente text,
  regla_calculo text,
  metadata jsonb,
  CONSTRAINT esquemas_pago_pkey PRIMARY KEY (id)
);
CREATE TABLE public.grupos_indicadores_v2 (
  id bigint NOT NULL DEFAULT nextval('grupos_indicadores_v2_id_seq'::regclass),
  unidad_negocio_id bigint,
  clave text,
  nombre text NOT NULL,
  orden_visual integer NOT NULL DEFAULT 0,
  esta_activo boolean NOT NULL DEFAULT true,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  CONSTRAINT grupos_indicadores_v2_pkey PRIMARY KEY (id),
  CONSTRAINT grupos_indicadores_v2_unidad_negocio_id_fkey FOREIGN KEY (unidad_negocio_id) REFERENCES public.unidades_negocio_v2(id)
);
CREATE TABLE public.indicador_alcance_captura (
  id bigint NOT NULL DEFAULT nextval('indicador_alcance_captura_id_seq'::regclass),
  asignacion_id bigint NOT NULL,
  periodo_captura_id bigint NOT NULL,
  valor_real numeric NOT NULL CHECK (valor_real >= 0::numeric),
  observaciones text,
  capturado_por text,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now(),
  CONSTRAINT indicador_alcance_captura_pkey PRIMARY KEY (id),
  CONSTRAINT indicador_alcance_captura_asignacion_id_fkey FOREIGN KEY (asignacion_id) REFERENCES public.indicador_colaborador_asignacion(id),
  CONSTRAINT indicador_alcance_captura_periodo_captura_id_fkey FOREIGN KEY (periodo_captura_id) REFERENCES public.periodos_captura(id)
);
CREATE TABLE public.indicador_colaborador_asignacion (
  id bigint NOT NULL DEFAULT nextval('indicador_colaborador_asignacion_id_seq'::regclass),
  indicador_id bigint NOT NULL,
  colaborador_id uuid NOT NULL,
  fecha_inicio date NOT NULL DEFAULT CURRENT_DATE,
  fecha_fin date,
  esta_activo boolean NOT NULL DEFAULT true,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  ponderacion numeric NOT NULL DEFAULT 0 CHECK (ponderacion >= 0::numeric),
  bono_base numeric NOT NULL DEFAULT 0 CHECK (bono_base >= 0::numeric),
  CONSTRAINT indicador_colaborador_asignacion_pkey PRIMARY KEY (id),
  CONSTRAINT indicador_colaborador_asignacion_indicador_id_fkey FOREIGN KEY (indicador_id) REFERENCES public.indicadores_v2(id),
  CONSTRAINT indicador_colaborador_asignacion_colaborador_id_fkey FOREIGN KEY (colaborador_id) REFERENCES public.colaboradores_v2(id)
);
CREATE TABLE public.indicador_meta_captura (
  id bigint NOT NULL DEFAULT nextval('indicador_meta_captura_id_seq'::regclass),
  asignacion_id bigint NOT NULL,
  periodo_captura_id bigint NOT NULL,
  valor_meta numeric NOT NULL CHECK (valor_meta >= 0::numeric),
  observaciones text,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now(),
  CONSTRAINT indicador_meta_captura_pkey PRIMARY KEY (id),
  CONSTRAINT indicador_meta_captura_asignacion_id_fkey FOREIGN KEY (asignacion_id) REFERENCES public.indicador_colaborador_asignacion(id),
  CONSTRAINT indicador_meta_captura_periodo_captura_id_fkey FOREIGN KEY (periodo_captura_id) REFERENCES public.periodos_captura(id)
);
CREATE TABLE public.indicadores_v2 (
  id bigint NOT NULL DEFAULT nextval('indicadores_v2_id_seq'::regclass),
  unidad_negocio_id bigint NOT NULL,
  grupo_indicador_id bigint,
  esquema_compensacion_id bigint NOT NULL,
  tipo_asignacion_id bigint NOT NULL,
  unidad_medida_id bigint NOT NULL,
  clave text,
  nombre text NOT NULL,
  descripcion text,
  tipo_indicador text,
  esta_activo boolean NOT NULL DEFAULT true,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now(),
  CONSTRAINT indicadores_v2_pkey PRIMARY KEY (id),
  CONSTRAINT indicadores_v2_unidad_negocio_id_fkey FOREIGN KEY (unidad_negocio_id) REFERENCES public.unidades_negocio_v2(id),
  CONSTRAINT indicadores_v2_grupo_indicador_id_fkey FOREIGN KEY (grupo_indicador_id) REFERENCES public.grupos_indicadores_v2(id),
  CONSTRAINT indicadores_v2_esquema_compensacion_id_fkey FOREIGN KEY (esquema_compensacion_id) REFERENCES public.esquemas_compensacion_v2(id),
  CONSTRAINT indicadores_v2_tipo_asignacion_id_fkey FOREIGN KEY (tipo_asignacion_id) REFERENCES public.tipos_asignacion_indicador(id),
  CONSTRAINT indicadores_v2_unidad_medida_id_fkey FOREIGN KEY (unidad_medida_id) REFERENCES public.unidades_medida(id)
);
CREATE TABLE public.metas_indicadores (
  id integer NOT NULL DEFAULT nextval('metas_indicadores_id_seq'::regclass),
  colaborador_id uuid,
  nombre_indicador text,
  tipo_indicador text,
  anio integer DEFAULT 2026,
  enero numeric DEFAULT 0,
  febrero numeric DEFAULT 0,
  marzo numeric DEFAULT 0,
  abril numeric DEFAULT 0,
  mayo numeric DEFAULT 0,
  junio numeric DEFAULT 0,
  julio numeric DEFAULT 0,
  agosto numeric DEFAULT 0,
  septiembre numeric DEFAULT 0,
  octubre numeric DEFAULT 0,
  noviembre numeric DEFAULT 0,
  diciembre numeric DEFAULT 0,
  grupo_id integer,
  esquema_pago_id integer,
  unidad_medida text DEFAULT 'moneda'::text CHECK (unidad_medida = ANY (ARRAY['moneda'::text, 'cantidad'::text, 'porcentaje'::text])),
  ponderacion numeric DEFAULT 0,
  CONSTRAINT metas_indicadores_pkey PRIMARY KEY (id),
  CONSTRAINT metas_indicadores_colaborador_id_fkey FOREIGN KEY (colaborador_id) REFERENCES public.colaboradores(id),
  CONSTRAINT metas_indicadores_esquema_pago_id_fkey FOREIGN KEY (esquema_pago_id) REFERENCES public.esquemas_pago(id),
  CONSTRAINT fk_metas_grupos FOREIGN KEY (grupo_id) REFERENCES public.cat_grupos_indicadores(id)
);
CREATE TABLE public.metodos_evaluacion (
  id bigint NOT NULL DEFAULT nextval('metodos_evaluacion_id_seq'::regclass),
  clave text NOT NULL UNIQUE,
  nombre text NOT NULL,
  descripcion text,
  esta_activo boolean NOT NULL DEFAULT true,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  CONSTRAINT metodos_evaluacion_pkey PRIMARY KEY (id)
);
CREATE TABLE public.niveles_organizacionales (
  id bigint NOT NULL DEFAULT nextval('niveles_organizacionales_id_seq'::regclass),
  unidad_negocio_id bigint NOT NULL,
  clave text,
  nombre text NOT NULL,
  orden integer NOT NULL,
  es_overhead boolean NOT NULL DEFAULT false,
  esta_activo boolean NOT NULL DEFAULT true,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  CONSTRAINT niveles_organizacionales_pkey PRIMARY KEY (id),
  CONSTRAINT niveles_organizacionales_unidad_negocio_id_fkey FOREIGN KEY (unidad_negocio_id) REFERENCES public.unidades_negocio_v2(id)
);
CREATE TABLE public.otros_ingresos (
  id integer NOT NULL DEFAULT nextval('otros_ingresos_id_seq'::regclass),
  colaborador_id uuid,
  nombre_concepto text,
  anio integer DEFAULT 2026,
  enero numeric DEFAULT 0,
  febrero numeric DEFAULT 0,
  marzo numeric DEFAULT 0,
  abril numeric DEFAULT 0,
  mayo numeric DEFAULT 0,
  junio numeric DEFAULT 0,
  julio numeric DEFAULT 0,
  agosto numeric DEFAULT 0,
  septiembre numeric DEFAULT 0,
  octubre numeric DEFAULT 0,
  noviembre numeric DEFAULT 0,
  diciembre numeric DEFAULT 0,
  CONSTRAINT otros_ingresos_pkey PRIMARY KEY (id),
  CONSTRAINT otros_ingresos_colaborador_id_fkey FOREIGN KEY (colaborador_id) REFERENCES public.colaboradores(id)
);
CREATE TABLE public.otros_ingresos_captura (
  id bigint NOT NULL DEFAULT nextval('otros_ingresos_captura_id_seq'::regclass),
  colaborador_id uuid NOT NULL,
  periodo_captura_id bigint NOT NULL,
  nombre_concepto text NOT NULL,
  monto numeric NOT NULL CHECK (monto >= 0::numeric),
  visible_en_pdf boolean NOT NULL DEFAULT true,
  observaciones text,
  capturado_por text,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now(),
  CONSTRAINT otros_ingresos_captura_pkey PRIMARY KEY (id),
  CONSTRAINT otros_ingresos_captura_colaborador_id_fkey FOREIGN KEY (colaborador_id) REFERENCES public.colaboradores_v2(id),
  CONSTRAINT otros_ingresos_captura_periodo_captura_id_fkey FOREIGN KEY (periodo_captura_id) REFERENCES public.periodos_captura(id)
);
CREATE TABLE public.pagos_realizados (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  colaborador_id uuid,
  anio integer NOT NULL,
  periodo text NOT NULL,
  monto_bono_calculado numeric,
  monto_pagado_anticipo numeric,
  es_ajuste_anual boolean DEFAULT false,
  notas text,
  created_at timestamp with time zone DEFAULT now(),
  monto_total_calculado_periodo numeric DEFAULT 0,
  saldo_pendiente_arrastrado numeric DEFAULT 0,
  neto_final_pagado numeric DEFAULT 0,
  CONSTRAINT pagos_realizados_pkey PRIMARY KEY (id),
  CONSTRAINT pagos_realizados_colaborador_id_fkey FOREIGN KEY (colaborador_id) REFERENCES public.colaboradores(id)
);
CREATE TABLE public.pasos_aprobacion (
  id integer NOT NULL DEFAULT nextval('pasos_aprobacion_id_seq'::regclass),
  colaborador_id uuid,
  mes text NOT NULL,
  anio integer DEFAULT 2026,
  paso_captura boolean DEFAULT false,
  paso_validacion boolean DEFAULT false,
  paso_autorizacion boolean DEFAULT false,
  paso_direccion boolean DEFAULT false,
  CONSTRAINT pasos_aprobacion_pkey PRIMARY KEY (id),
  CONSTRAINT pasos_aprobacion_colaborador_id_fkey FOREIGN KEY (colaborador_id) REFERENCES public.colaboradores(id)
);
CREATE TABLE public.perfiles_seguridad (
  id integer NOT NULL DEFAULT nextval('perfiles_seguridad_id_seq'::regclass),
  nombre_perfil text NOT NULL,
  nivel_acceso integer NOT NULL,
  CONSTRAINT perfiles_seguridad_pkey PRIMARY KEY (id)
);
CREATE TABLE public.periodos_captura (
  id bigint NOT NULL DEFAULT nextval('periodos_captura_id_seq'::regclass),
  unidad_negocio_id bigint NOT NULL,
  anio integer NOT NULL,
  mes integer NOT NULL CHECK (mes >= 1 AND mes <= 12),
  nombre text NOT NULL,
  fecha_inicio date NOT NULL,
  fecha_fin date NOT NULL,
  esta_activo boolean NOT NULL DEFAULT true,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  CONSTRAINT periodos_captura_pkey PRIMARY KEY (id),
  CONSTRAINT periodos_captura_unidad_negocio_id_fkey FOREIGN KEY (unidad_negocio_id) REFERENCES public.unidades_negocio_v2(id)
);
CREATE TABLE public.periodos_consolidado (
  id bigint NOT NULL DEFAULT nextval('periodos_consolidado_id_seq'::regclass),
  unidad_negocio_id bigint NOT NULL,
  tipo_periodo_id bigint NOT NULL,
  nombre text NOT NULL,
  anio integer NOT NULL,
  fecha_inicio date NOT NULL,
  fecha_fin date NOT NULL,
  orden_anual integer,
  esta_activo boolean NOT NULL DEFAULT true,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  CONSTRAINT periodos_consolidado_pkey PRIMARY KEY (id),
  CONSTRAINT periodos_consolidado_unidad_negocio_id_fkey FOREIGN KEY (unidad_negocio_id) REFERENCES public.unidades_negocio_v2(id),
  CONSTRAINT periodos_consolidado_tipo_periodo_id_fkey FOREIGN KEY (tipo_periodo_id) REFERENCES public.tipos_periodo(id)
);
CREATE TABLE public.periodos_consolidado_detalle (
  id bigint NOT NULL DEFAULT nextval('periodos_consolidado_detalle_id_seq'::regclass),
  periodo_consolidado_id bigint NOT NULL,
  periodo_captura_id bigint NOT NULL,
  orden integer NOT NULL,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  CONSTRAINT periodos_consolidado_detalle_pkey PRIMARY KEY (id),
  CONSTRAINT periodos_consolidado_detalle_periodo_consolidado_id_fkey FOREIGN KEY (periodo_consolidado_id) REFERENCES public.periodos_consolidado(id),
  CONSTRAINT periodos_consolidado_detalle_periodo_captura_id_fkey FOREIGN KEY (periodo_captura_id) REFERENCES public.periodos_captura(id)
);
CREATE TABLE public.resultado_covas (
  id bigint NOT NULL DEFAULT nextval('resultado_covas_id_seq'::regclass),
  colaborador_id uuid NOT NULL,
  unidad_negocio_id bigint NOT NULL,
  periodo_consolidado_id bigint NOT NULL,
  salario_total_periodo numeric NOT NULL DEFAULT 0 CHECK (salario_total_periodo >= 0::numeric),
  total_bonos_indicadores numeric NOT NULL DEFAULT 0 CHECK (total_bonos_indicadores >= 0::numeric),
  total_otros_ingresos numeric NOT NULL DEFAULT 0 CHECK (total_otros_ingresos >= 0::numeric),
  total_percepcion numeric NOT NULL DEFAULT 0 CHECK (total_percepcion >= 0::numeric),
  version_calculo integer NOT NULL DEFAULT 1,
  generado_en timestamp with time zone NOT NULL DEFAULT now(),
  generado_por text,
  notas text,
  CONSTRAINT resultado_covas_pkey PRIMARY KEY (id),
  CONSTRAINT resultado_covas_colaborador_id_fkey FOREIGN KEY (colaborador_id) REFERENCES public.colaboradores_v2(id),
  CONSTRAINT resultado_covas_unidad_negocio_id_fkey FOREIGN KEY (unidad_negocio_id) REFERENCES public.unidades_negocio_v2(id),
  CONSTRAINT resultado_covas_periodo_consolidado_id_fkey FOREIGN KEY (periodo_consolidado_id) REFERENCES public.periodos_consolidado(id)
);
CREATE TABLE public.resultado_covas_detalle (
  id bigint NOT NULL DEFAULT nextval('resultado_covas_detalle_id_seq'::regclass),
  resultado_covas_id bigint NOT NULL,
  tipo_linea text NOT NULL CHECK (tipo_linea = ANY (ARRAY['salario'::text, 'indicador'::text, 'otro_ingreso'::text, 'resumen'::text])),
  referencia_id bigint,
  nombre text NOT NULL,
  descripcion text,
  valor_1 numeric,
  valor_2 numeric,
  valor_3 numeric,
  monto numeric NOT NULL DEFAULT 0 CHECK (monto >= 0::numeric),
  orden_visual integer NOT NULL DEFAULT 0,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  CONSTRAINT resultado_covas_detalle_pkey PRIMARY KEY (id),
  CONSTRAINT resultado_covas_detalle_resultado_covas_id_fkey FOREIGN KEY (resultado_covas_id) REFERENCES public.resultado_covas(id)
);
CREATE TABLE public.resultado_indicador_consolidado (
  id bigint NOT NULL DEFAULT nextval('resultado_indicador_consolidado_id_seq'::regclass),
  asignacion_id bigint NOT NULL,
  colaborador_id uuid NOT NULL,
  indicador_id bigint NOT NULL,
  periodo_consolidado_id bigint NOT NULL,
  ponderacion numeric NOT NULL CHECK (ponderacion >= 0::numeric),
  bono_base numeric NOT NULL CHECK (bono_base >= 0::numeric),
  meta_total numeric NOT NULL DEFAULT 0 CHECK (meta_total >= 0::numeric),
  alcance_total numeric NOT NULL DEFAULT 0 CHECK (alcance_total >= 0::numeric),
  porcentaje_alcance numeric NOT NULL DEFAULT 0,
  esquema_compensacion_id bigint NOT NULL,
  escalon_id bigint,
  porcentaje_pago_aplicado numeric NOT NULL DEFAULT 0,
  monto_bono_resultado numeric NOT NULL DEFAULT 0,
  version_calculo integer NOT NULL DEFAULT 1,
  calculado_en timestamp with time zone NOT NULL DEFAULT now(),
  CONSTRAINT resultado_indicador_consolidado_pkey PRIMARY KEY (id),
  CONSTRAINT resultado_indicador_consolidado_asignacion_id_fkey FOREIGN KEY (asignacion_id) REFERENCES public.indicador_colaborador_asignacion(id),
  CONSTRAINT resultado_indicador_consolidado_colaborador_id_fkey FOREIGN KEY (colaborador_id) REFERENCES public.colaboradores_v2(id),
  CONSTRAINT resultado_indicador_consolidado_indicador_id_fkey FOREIGN KEY (indicador_id) REFERENCES public.indicadores_v2(id),
  CONSTRAINT resultado_indicador_consolidado_periodo_consolidado_id_fkey FOREIGN KEY (periodo_consolidado_id) REFERENCES public.periodos_consolidado(id),
  CONSTRAINT resultado_indicador_consolidado_esquema_compensacion_id_fkey FOREIGN KEY (esquema_compensacion_id) REFERENCES public.esquemas_compensacion_v2(id),
  CONSTRAINT resultado_indicador_consolidado_escalon_id_fkey FOREIGN KEY (escalon_id) REFERENCES public.escalones_compensacion_v2(id)
);
CREATE TABLE public.salario_captura (
  id bigint NOT NULL DEFAULT nextval('salario_captura_id_seq'::regclass),
  colaborador_id uuid NOT NULL,
  periodo_captura_id bigint NOT NULL,
  salario_mensual numeric NOT NULL CHECK (salario_mensual >= 0::numeric),
  observaciones text,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now(),
  CONSTRAINT salario_captura_pkey PRIMARY KEY (id),
  CONSTRAINT salario_captura_colaborador_id_fkey FOREIGN KEY (colaborador_id) REFERENCES public.colaboradores_v2(id),
  CONSTRAINT salario_captura_periodo_captura_id_fkey FOREIGN KEY (periodo_captura_id) REFERENCES public.periodos_captura(id)
);
CREATE TABLE public.salarios_mensuales (
  id integer NOT NULL DEFAULT nextval('salarios_mensuales_id_seq'::regclass),
  colaborador_id uuid,
  anio integer DEFAULT 2026,
  enero numeric DEFAULT 0,
  febrero numeric DEFAULT 0,
  marzo numeric DEFAULT 0,
  abril numeric DEFAULT 0,
  mayo numeric DEFAULT 0,
  junio numeric DEFAULT 0,
  julio numeric DEFAULT 0,
  agosto numeric DEFAULT 0,
  septiembre numeric DEFAULT 0,
  octubre numeric DEFAULT 0,
  noviembre numeric DEFAULT 0,
  diciembre numeric DEFAULT 0,
  CONSTRAINT salarios_mensuales_pkey PRIMARY KEY (id),
  CONSTRAINT salarios_mensuales_colaborador_id_fkey FOREIGN KEY (colaborador_id) REFERENCES public.colaboradores(id)
);
CREATE TABLE public.tipos_asignacion_indicador (
  id bigint NOT NULL DEFAULT nextval('tipos_asignacion_indicador_id_seq'::regclass),
  clave text NOT NULL UNIQUE,
  nombre text NOT NULL,
  descripcion text,
  esta_activo boolean NOT NULL DEFAULT true,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  CONSTRAINT tipos_asignacion_indicador_pkey PRIMARY KEY (id)
);
CREATE TABLE public.tipos_colaborador (
  id bigint NOT NULL DEFAULT nextval('tipos_colaborador_id_seq'::regclass),
  clave text NOT NULL UNIQUE,
  nombre text NOT NULL,
  descripcion text,
  es_overhead boolean NOT NULL DEFAULT false,
  esta_activo boolean NOT NULL DEFAULT true,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  CONSTRAINT tipos_colaborador_pkey PRIMARY KEY (id)
);
CREATE TABLE public.tipos_esquema_compensacion (
  id bigint NOT NULL DEFAULT nextval('tipos_esquema_compensacion_id_seq'::regclass),
  clave text NOT NULL UNIQUE,
  nombre text NOT NULL,
  descripcion text,
  usa_escalones boolean NOT NULL DEFAULT false,
  esta_activo boolean NOT NULL DEFAULT true,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  CONSTRAINT tipos_esquema_compensacion_pkey PRIMARY KEY (id)
);
CREATE TABLE public.tipos_periodo (
  id bigint NOT NULL DEFAULT nextval('tipos_periodo_id_seq'::regclass),
  clave text NOT NULL UNIQUE,
  nombre text NOT NULL,
  meses_duracion integer,
  es_personalizado boolean NOT NULL DEFAULT false,
  esta_activo boolean NOT NULL DEFAULT true,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  CONSTRAINT tipos_periodo_pkey PRIMARY KEY (id)
);
CREATE TABLE public.unidades_medida (
  id bigint NOT NULL DEFAULT nextval('unidades_medida_id_seq'::regclass),
  clave text NOT NULL UNIQUE,
  nombre text NOT NULL,
  descripcion text,
  esta_activo boolean NOT NULL DEFAULT true,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  CONSTRAINT unidades_medida_pkey PRIMARY KEY (id)
);
CREATE TABLE public.unidades_negocio (
  id integer NOT NULL DEFAULT nextval('unidades_negocio_id_seq'::regclass),
  nombre text NOT NULL,
  color_hex text DEFAULT '#1e3a8a'::text,
  logo_url text,
  CONSTRAINT unidades_negocio_pkey PRIMARY KEY (id)
);
CREATE TABLE public.unidades_negocio_v2 (
  id bigint NOT NULL DEFAULT nextval('unidades_negocio_v2_id_seq'::regclass),
  clave text UNIQUE,
  nombre text NOT NULL,
  razon_social text,
  color_hex text DEFAULT '#1e3a8a'::text,
  logo_url text,
  moneda text NOT NULL DEFAULT 'MXN'::text,
  esta_activa boolean NOT NULL DEFAULT true,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now(),
  CONSTRAINT unidades_negocio_v2_pkey PRIMARY KEY (id)
);