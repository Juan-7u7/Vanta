import { createClient } from '@supabase/supabase-js';
const supabase = createClient("https://fusoaqqtamfjgqwyzugl.supabase.co", "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImZ1c29hcXF0YW1mamdxd3l6dWdsIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzM1MTgxOTQsImV4cCI6MjA4OTA5NDE5NH0.n4GyWvLp5PdqJOTY5oMf2DHr9Dq9sQRghHMsCeWZfQA");
async function check() {
  const { data: units } = await supabase.from('unidades_negocio').select('nombre');
  const { data: profiles } = await supabase.from('perfiles_seguridad').select('nombre_perfil');
  const { data: cols } = await supabase.from('colaboradores').select('email, matricula');
  console.log('UNITS:', JSON.stringify(units));
  console.log('PROFILES:', JSON.stringify(profiles));
  console.log('COLS:', JSON.stringify(cols));
}
check();
