import { createClient } from '@supabase/supabase-js';

// For development, we'll use a placeholder that gets the actual values from the server
const supabaseUrl = 'https://placeholder.supabase.co';
const supabaseAnonKey = 'placeholder-key';

// Create a client that will be properly configured after authentication
export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    persistSession: false, // We'll handle sessions through our own API
    autoRefreshToken: false,
  }
});

// Helper function to configure supabase with real credentials
export const configureSupabase = (url: string, key: string) => {
  return createClient(url, key);
};