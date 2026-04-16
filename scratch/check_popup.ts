import { supabase } from './src/lib/supabase';

async function checkPopUpConfig() {
  const { data, error } = await supabase
    .from('system_settings')
    .select('settings')
    .eq('id', 'global_config')
    .single();

  if (error) {
    console.error('Error fetching settings:', error.message);
  } else {
    console.log('Global Config Settings:', JSON.stringify(data.settings.mobileApp, null, 2));
  }
}

checkPopUpConfig();
