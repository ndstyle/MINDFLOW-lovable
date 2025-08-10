import { createClient } from '@supabase/supabase-js'
import type { Database } from '../../../lib/supabase'

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY

console.log('Supabase URL available:', !!supabaseUrl)
console.log('Supabase Key available:', !!supabaseAnonKey)
console.log('Supabase URL:', supabaseUrl?.substring(0, 30) + '...')
console.log('Supabase Key length:', supabaseAnonKey?.length)

if (!supabaseUrl || !supabaseAnonKey) {
  console.error('Missing Supabase environment variables')
  console.error('VITE_SUPABASE_URL:', supabaseUrl)
  console.error('VITE_SUPABASE_ANON_KEY available:', !!supabaseAnonKey)
  throw new Error('Missing Supabase environment variables')
}

export const supabase = createClient<Database>(supabaseUrl, supabaseAnonKey, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
  },
  global: {
    headers: {
      'apikey': supabaseAnonKey,
    },
  },
});

// Add auth header to all requests
supabase.auth.onAuthStateChange((event, session) => {
  if (session) {
    // Set up axios defaults or fetch interceptor here if needed
    console.log('Auth state changed:', event, session?.user?.id);
  }
});