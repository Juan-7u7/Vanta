#!/usr/bin/env node
/**
 * Seed / sincronización de plantillas de esquemas con Supabase.
 * Fase 2: lee plantillas versionadas en código y las upserta en la BD.
 *
 * Requisitos:
 * - Variables de entorno: SUPABASE_URL y SUPABASE_SERVICE_ROLE (o VITE_SUPABASE_URL/VITE_SUPABASE_ANON_KEY).
 * - Tablas: esquemas_pago (con columnas slug UNIQUE, fuente), escalones_bonos.
 * - Permisos: rol con capacidad de upsert/delete/insert sobre ambas tablas.
 */
import 'dotenv/config';
import { createClient } from '@supabase/supabase-js';
import { ESQUEMAS_PLANTILLA_BASE } from '../src/config/esquemasPlantilla';

const supabaseUrl = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL;
const supabaseKey =
  process.env.SUPABASE_SERVICE_ROLE ||
  process.env.SUPABASE_ANON_KEY ||
  process.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('Falta SUPABASE_URL y/o SUPABASE_SERVICE_ROLE (o anon key).');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function assertColumns() {
  // Verificar que existan slug y fuente; si no, avisar con SQL sugerido.
  const { error } = await supabase.from('esquemas_pago').select('slug, fuente').limit(1);
  if (error) {
    console.error('Columnas requeridas ausentes en esquemas_pago: slug, fuente.');
    console.error('Agrega en Supabase SQL: ALTER TABLE esquemas_pago ADD COLUMN slug text UNIQUE;');
    console.error('Agrega en Supabase SQL: ALTER TABLE esquemas_pago ADD COLUMN fuente text;');
    process.exit(1);
  }
}

async function upsertPlantilla(plantilla: (typeof ESQUEMAS_PLANTILLA_BASE)[number]) {
  const payload = {
    slug: plantilla.slug,
    nombre: plantilla.nombre,
    tipo: plantilla.tipo,
    descripcion: plantilla.descripcion || '',
    fuente: 'plantilla',
  };

  const { data: esquemaRow, error: upsertErr } = await supabase
    .from('esquemas_pago')
    .upsert(payload, { onConflict: 'slug' })
    .select('id')
    .single();
  if (upsertErr) throw upsertErr;

  const esquemaId = esquemaRow.id;

  // Reemplazar escalones del esquema por los de la plantilla
  const { error: delErr } = await supabase
    .from('escalones_bonos')
    .delete()
    .eq('esquema_id', esquemaId);
  if (delErr) throw delErr;

  const escalones = plantilla.escalones.map((e) => ({
    esquema_id: esquemaId,
    limite_inferior: e.limite_inferior,
    limite_superior: e.limite_superior,
    porcentaje_pago: e.porcentaje_pago,
    etiqueta: e.etiqueta ?? null,
  }));

  const { error: insErr } = await supabase.from('escalones_bonos').insert(escalones);
  if (insErr) throw insErr;

  return esquemaId;
}

async function main() {
  try {
    await assertColumns();

    const results: { slug: string; esquemaId: number }[] = [];
    for (const plantilla of ESQUEMAS_PLANTILLA_BASE) {
      const esquemaId = await upsertPlantilla(plantilla);
      results.push({ slug: plantilla.slug, esquemaId });
      console.log(`✔ Upsert plantilla ${plantilla.slug} -> esquema_id ${esquemaId}`);
    }

    console.log('Listo. Plantillas sincronizadas:', results.map((r) => r.slug).join(', '));
    console.log('Nota: se requieren permisos de escritura (service role) para ejecutar correctamente.');
  } catch (err: any) {
    console.error('Error durante seed de plantillas:', err.message || err);
    process.exit(1);
  }
}

main();
