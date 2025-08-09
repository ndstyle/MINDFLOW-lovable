import { supabaseAdmin } from './supabase';
import type { 
  Profile, 
  InsertProfile, 
  UpdateProfile,
  Mindmap, 
  InsertMindmap, 
  UpdateMindmap,
  XpTransaction, 
  InsertXpTransaction,
  Unlockable, 
  UserUnlockable, 
  InsertUserUnlockable 
} from '@shared/supabase-types';

export interface IStorage {
  // Profile operations (using Supabase Auth)
  getProfile(userId: string): Promise<Profile | undefined>;
  createProfile(profile: InsertProfile): Promise<Profile>;
  updateProfile(userId: string, updates: UpdateProfile): Promise<Profile>;
  
  // Mindmap operations
  getMindmaps(userId: string, limit?: number): Promise<Mindmap[]>;
  getMindmap(id: string, userId: string): Promise<Mindmap | undefined>;
  createMindmap(mindmap: InsertMindmap): Promise<Mindmap>;
  updateMindmap(id: string, userId: string, updates: UpdateMindmap): Promise<Mindmap | undefined>;
  deleteMindmap(id: string, userId: string): Promise<boolean>;
  
  // XP operations
  createXpTransaction(transaction: InsertXpTransaction): Promise<XpTransaction>;
  getXpTransactions(userId: string): Promise<XpTransaction[]>;
  
  // Unlockables operations
  getUnlockables(): Promise<Unlockable[]>;
  getUserUnlockables(userId: string): Promise<UserUnlockable[]>;
  createUserUnlockable(userUnlockable: InsertUserUnlockable): Promise<UserUnlockable>;
}

export class SupabaseStorage implements IStorage {
  async getProfile(userId: string): Promise<Profile | undefined> {
    const { data, error } = await supabaseAdmin
      .from('profiles')
      .select('*')
      .eq('user_id', userId)
      .single();
    
    if (error) {
      console.error('Error fetching profile:', error);
      return undefined;
    }
    
    return data;
  }

  async createProfile(profile: InsertProfile): Promise<Profile> {
    const { data, error } = await supabaseAdmin
      .from('profiles')
      .insert(profile)
      .select()
      .single();
    
    if (error) {
      throw new Error(`Failed to create profile: ${error.message}`);
    }
    
    return data;
  }

  async updateProfile(userId: string, updates: UpdateProfile): Promise<Profile> {
    const { data, error } = await supabaseAdmin
      .from('profiles')
      .update({ ...updates, updated_at: new Date().toISOString() })
      .eq('user_id', userId)
      .select()
      .single();
    
    if (error) {
      throw new Error(`Failed to update profile: ${error.message}`);
    }
    
    return data;
  }

  async getMindmaps(userId: string, limit = 20): Promise<Mindmap[]> {
    const { data, error } = await supabaseAdmin
      .from('mindmaps')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
      .limit(limit);
    
    if (error) {
      throw new Error(`Failed to fetch mindmaps: ${error.message}`);
    }
    
    return data || [];
  }

  async getMindmap(id: string, userId: string): Promise<Mindmap | undefined> {
    const { data, error } = await supabaseAdmin
      .from('mindmaps')
      .select('*')
      .eq('id', id)
      .eq('user_id', userId)
      .single();
    
    if (error) {
      console.error('Error fetching mindmap:', error);
      return undefined;
    }
    
    return data;
  }

  async createMindmap(mindmap: InsertMindmap): Promise<Mindmap> {
    const { data, error } = await supabaseAdmin
      .from('mindmaps')
      .insert(mindmap)
      .select()
      .single();
    
    if (error) {
      throw new Error(`Failed to create mindmap: ${error.message}`);
    }
    
    return data;
  }

  async updateMindmap(id: string, userId: string, updates: UpdateMindmap): Promise<Mindmap | undefined> {
    const { data, error } = await supabaseAdmin
      .from('mindmaps')
      .update({ ...updates, updated_at: new Date().toISOString() })
      .eq('id', id)
      .eq('user_id', userId)
      .select()
      .single();
    
    if (error) {
      console.error('Error updating mindmap:', error);
      return undefined;
    }
    
    return data;
  }

  async deleteMindmap(id: string, userId: string): Promise<boolean> {
    const { error } = await supabaseAdmin
      .from('mindmaps')
      .delete()
      .eq('id', id)
      .eq('user_id', userId);
    
    if (error) {
      console.error('Error deleting mindmap:', error);
      return false;
    }
    
    return true;
  }

  async createXpTransaction(transaction: InsertXpTransaction): Promise<XpTransaction> {
    const { data, error } = await supabaseAdmin
      .from('xp_transactions')
      .insert(transaction)
      .select()
      .single();
    
    if (error) {
      throw new Error(`Failed to create XP transaction: ${error.message}`);
    }
    
    return data;
  }

  async getXpTransactions(userId: string): Promise<XpTransaction[]> {
    const { data, error } = await supabaseAdmin
      .from('xp_transactions')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false });
    
    if (error) {
      throw new Error(`Failed to fetch XP transactions: ${error.message}`);
    }
    
    return data || [];
  }

  async getUnlockables(): Promise<Unlockable[]> {
    const { data, error } = await supabaseAdmin
      .from('unlockables')
      .select('*')
      .order('created_at', { ascending: true });
    
    if (error) {
      throw new Error(`Failed to fetch unlockables: ${error.message}`);
    }
    
    return data || [];
  }

  async getUserUnlockables(userId: string): Promise<UserUnlockable[]> {
    const { data, error } = await supabaseAdmin
      .from('user_unlockables')
      .select('*')
      .eq('user_id', userId)
      .order('unlocked_at', { ascending: false });
    
    if (error) {
      throw new Error(`Failed to fetch user unlockables: ${error.message}`);
    }
    
    return data || [];
  }

  async createUserUnlockable(userUnlockable: InsertUserUnlockable): Promise<UserUnlockable> {
    const { data, error } = await supabaseAdmin
      .from('user_unlockables')
      .insert(userUnlockable)
      .select()
      .single();
    
    if (error) {
      throw new Error(`Failed to create user unlockable: ${error.message}`);
    }
    
    return data;
  }
}

export const storage = new SupabaseStorage();