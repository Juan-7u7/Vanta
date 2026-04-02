-- Datos dummy para entorno local/QA. No contiene informacion sensible.

-- Unidades y perfiles
INSERT INTO public.unidades_negocio (id, nombre, color_hex) VALUES
  (1, 'Unidad Norte', '#1e3a8a')
ON CONFLICT (id) DO NOTHING;

INSERT INTO public.perfiles_seguridad (id, nombre_perfil, nivel_acceso) VALUES
  (1, 'Administrador', 10),
  (2, 'Analista', 5)
ON CONFLICT (id) DO NOTHING;

-- Esquema y escalones
INSERT INTO public.esquemas_pago (id, nombre, tipo, slug, fuente, descripcion)
VALUES (1, 'Bono Ventas', 'monto', 'bono-ventas', 'plantilla', 'Pago por ventas mensuales')
ON CONFLICT (id) DO NOTHING;

INSERT INTO public.escalones_bonos (id, esquema_id, limite_inferior, limite_superior, porcentaje_pago, descripcion_regla)
VALUES
  (1, 1, 0, 80, 0, 'Sin pago bajo 80%'),
  (2, 1, 80, 100, 50, 'Pago del 50% del bono base'),
  (3, 1, 100, 200, 100, 'Pago completo del bono base')
ON CONFLICT (id) DO NOTHING;

-- Colaborador demo
INSERT INTO public.colaboradores (id, email, nombre, apellido_paterno, puesto, unidad_negocio_id, perfil_id, tipo_colaborador, esquema_pago_id, matricula)
VALUES ('00000000-0000-0000-0000-000000000001', 'demo@vanta.test', 'Alex', 'Lopez', 'Ejecutivo de Ventas', 1, 1, 'Ejecutivo', 1, 'MAT-001')
ON CONFLICT (id) DO NOTHING;

-- Metas y alcance
INSERT INTO public.metas_indicadores (id, colaborador_id, nombre_indicador, tipo_indicador, anio, enero, febrero, marzo, esquema_pago_id, unidad_medida, ponderacion)
VALUES (1, '00000000-0000-0000-0000-000000000001', 'Ventas mensuales', 'monto', 2026, 100000, 100000, 100000, 1, 'moneda', 100)
ON CONFLICT (id) DO NOTHING;

INSERT INTO public.alcance_real (id, colaborador_id, indicador_id, anio, enero, febrero, marzo)
VALUES (1, '00000000-0000-0000-0000-000000000001', 1, 2026, 95000, 120000, 130000)
ON CONFLICT (id) DO NOTHING;

-- Salario y otros ingresos
INSERT INTO public.salarios_mensuales (id, colaborador_id, anio, enero, febrero, marzo)
VALUES (1, '00000000-0000-0000-0000-000000000001', 2026, 30000, 30000, 30000)
ON CONFLICT (id) DO NOTHING;

INSERT INTO public.otros_ingresos (id, colaborador_id, nombre_concepto, anio, enero, febrero, marzo)
VALUES (1, '00000000-0000-0000-0000-000000000001', 'Vales de despensa', 2026, 2000, 2000, 2000)
ON CONFLICT (id) DO NOTHING;

-- Pasos de aprobacion demo
INSERT INTO public.pasos_aprobacion (id, colaborador_id, mes, anio, paso_captura, paso_validacion)
VALUES (1, '00000000-0000-0000-0000-000000000001', 'enero', 2026, true, true)
ON CONFLICT (id) DO NOTHING;
