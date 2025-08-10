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

export const supabase = createClient<Database>(supabaseUrl, supabaseAnonKey)