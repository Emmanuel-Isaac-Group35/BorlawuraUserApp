import { supabase } from './src/lib/supabase';

async function checkTables() {
  const { data, error } = await supabase.from('services').select('*').limit(1);
  if (error) {
    console.log('Services table does not exist or is inaccessible:', error.message);
  } else {
    console.log('Services table exists. Sample:', data);
  }
}

checkTables();
