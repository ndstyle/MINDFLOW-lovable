import { supabase } from '../lib/supabase'
import type { Database } from '../lib/supabase'

type Profile = Database['public']['Tables']['profiles']['Row']
type ProfileInsert = Database['public']['Tables']['profiles']['Insert']

export interface IStorage {
  getUser(id: string): Promise<Profile | undefined>;
  getUserByUsername(username: string): Promise<Profile | undefined>;
  createUser(insertUser: ProfileInsert): Promise<Profile>;
}

export class SupabaseStorage implements IStorage {
  async getUser(id: string): Promise<Profile | undefined> {
    const { data, error } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', id)
      .single();
    
    if (error) {
      console.error('Error fetching user:', error);
      return undefined;
    }
    
    return data;
  }

  async getUserByUsername(username: string): Promise<Profile | undefined> {
    const { data, error } = await supabase
      .from('profiles')
      .select('*')
      .eq('username', username)
      .single();
    
    if (error) {
      console.error('Error fetching user by username:', error);
      return undefined;
    }
    
    return data;
  }

  async createUser(insertUser: ProfileInsert): Promise<Profile> {
    const { data, error } = await supabase
      .from('profiles')
      .insert(insertUser)
      .select()
      .single();
    
    if (error) {
      console.error('Error creating user:', error);
      throw new Error(`Database error creating new user: ${error.message}`);
    }
    
    return data;
  }
}

export const storage = new SupabaseStorage();