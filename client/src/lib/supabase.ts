
import { createClient } from '@supabase/supabase-js';
import type { Database } from '@shared/supabase-types';

// Get Supabase credentials from environment variables
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || 'https://placeholder.supabase.co';
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || 'placeholder-key';

export const supabase = createClient<Database>(supabaseUrl, supabaseAnonKey, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
    detectSessionInUrl: true
  }
});

// Helper function to get the current session token
export const getSessionToken = async () => {
  const { data: { session } } = await supabase.auth.getSession();
  return session?.access_token || null;
};

// Helper function to check if user is authenticated
export const isAuthenticated = async () => {
  const { data: { user } } = await supabase.auth.getUser();
  return !!user;
};
