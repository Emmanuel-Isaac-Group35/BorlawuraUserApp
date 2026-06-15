import { supabase } from './src/lib/supabase';

async function checkSchema() {
  const { data, error } = await supabase.from('notifications').select('*').limit(1);
  if (error) {
    console.log('Error fetching notifications:', error);
  } else if (data && data.length > 0) {
    console.log('Notification Columns:', Object.keys(data[0]));
  } else {
    console.log('No notifications found to check schema.');
  }
}

checkSchema();
