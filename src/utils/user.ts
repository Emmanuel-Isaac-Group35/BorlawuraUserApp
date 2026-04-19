import { supabase } from '../lib/supabase';

/**
 * Resolves the real Supabase UUID for a user, handling legacy "user_" prefixes
 * by searching for the user in the database via phone or email.
 */
export async function resolveRealUserId(user: any): Promise<string | null> {
  if (!user) return null;
  
  let searchId = user.supabase_id || user.id;
  
  if (searchId && !String(searchId).startsWith('user_')) {
    return searchId;
  }
  
  try {
    let searchPhone = (user.phone_number || user.phoneNumber || '').replace(/\s+/g, '');
    if (searchPhone.startsWith('0')) {
      searchPhone = '+233' + searchPhone.substring(1);
    } else if (searchPhone && !searchPhone.startsWith('+')) {
      searchPhone = '+233' + searchPhone;
    }
    
    const searchEmail = user.email && user.email.includes('@') ? user.email : null;
    
    let query = supabase.from('users').select('id');
    
    if (searchPhone && searchEmail) {
      query = query.or(`phone_number.eq.${searchPhone},email.eq.${searchEmail}`);
    } else if (searchPhone) {
      query = query.eq('phone_number', searchPhone);
    } else if (searchEmail) {
      query = query.eq('email', searchEmail);
    } else {
      return null;
    }
    
    const { data: dbUser } = await query.single();
    return dbUser?.id || null;
  } catch (e) {
    console.error('Error resolving real user ID:', e);
    return null;
  }
}
