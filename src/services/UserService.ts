import { supabase } from '../lib/supabase';
import { UserProfile } from '../types';

export class UserService {
  /**
   * Fetches a user profile by ID.
   */
  static async getProfile(userId: string): Promise<UserProfile | null> {
    const { data, error } = await supabase
      .from('users')
      .select('*')
      .eq('id', userId)
      .maybeSingle();

    if (error) {
       console.error('[UserService.getProfile]:', error.message);
       return null;
    }
    return data as UserProfile;
  }

  /**
   * Updates a user's profile data.
   */
  static async updateProfile(userId: string, updates: Partial<UserProfile>): Promise<void> {
    const { error } = await supabase
      .from('users')
      .update(updates)
      .eq('id', userId);

    if (error) {
      console.error('[UserService.updateProfile]:', error.message);
      throw error;
    }
  }
}
