import { createClient } from '@supabase/supabase-js';
const supabase = createClient("https://fusoaqqtamfjgqwyzugl.supabase.co", "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImZ1c29hcXF0YW1mamdxd3l6dWdsIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzM1MTgxOTQsImV4cCI6MjA4OTA5NDE5NH0.n4GyWvLp5PdqJOTY5oMf2DHr9Dq9sQRghHMsCeWZfQA");
async function check() {
  const { data: cols } = await supabase.from('metas_indicadores').select('*').limit(5);
  console.log('METAS:', JSON.stringify(cols));
  
  // Also check escalones_bonos
  const { data: esc } = await supabase.from('escalones_bonos').select('*').limit(5);
  console.log('ESCALONES:', JSON.stringify(esc));
}
check();
