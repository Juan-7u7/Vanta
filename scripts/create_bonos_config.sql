-- FASE 0: Crear tabla de configuración de bonos por colaborador
-- Ejecutar en el SQL Editor de Supabase (DEV primero, luego PROD)

CREATE TABLE IF NOT EXISTS public.bonos_colaborador_config (
    colaborador_id UUID NOT NULL REFERENCES public.colaboradores(id) ON DELETE CASCADE,
    anio INTEGER NOT NULL,
    meses_bono INTEGER NOT NULL DEFAULT 8,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    PRIMARY KEY (colaborador_id, anio)
);

ALTER TABLE public.bonos_colaborador_config ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Enable all for anon" ON public.bonos_colaborador_config
    FOR ALL USING (true) WITH CHECK (true);

-- Insert para Virgilio Reyes (colaborador_id = a1d4371f-d182-4a9d-a9ee-1dbb6dcc029f)
INSERT INTO public.bonos_colaborador_config (colaborador_id, anio, meses_bono)
VALUES ('a1d4371f-d182-4a9d-a9ee-1dbb6dcc029f', 2026, 8)
ON CONFLICT (colaborador_id, anio) DO NOTHING;
