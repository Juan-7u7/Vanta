import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
dotenv.config();

const supabase = createClient(process.env.VITE_SUPABASE_URL, process.env.VITE_SUPABASE_ANON_KEY);

async function checkEscalones() {
  const { data, error } = await supabase
    .from('escalones_bonos')
    .select('*')
    .order('limite_inferior', { ascending: true });
  
  if (error) {
    console.error('Error:', error);
  } else {
    console.log('ESCALONES:', JSON.stringify(data));
  }
}

checkEscalones();
