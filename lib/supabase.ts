import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL || ''
const supabaseAnonKey = process.env.SUPABASE_ANON_KEY || process.env.VITE_SUPABASE_ANON_KEY || ''

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error('Missing Supabase environment variables')
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey)

// Database types based on the provided schema
export interface Database {
  public: {
    Tables: {
      profiles: {
        Row: {
          id: string
          username: string
          xp: number
          level: number
          created_at: string
          updated_at: string
        }
        Insert: {
          id: string
          username: string
          xp?: number
          level?: number
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          username?: string
          xp?: number
          level?: number
          created_at?: string
          updated_at?: string
        }
      }
      mindmaps: {
        Row: {
          id: string
          owner_id: string
          title: string
          intent: 'study' | 'teach' | 'project' | 'brainstorm' | 'presentation'
          content: any
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          owner_id: string
          title: string
          intent: 'study' | 'teach' | 'project' | 'brainstorm' | 'presentation'
          content: any
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          owner_id?: string
          title?: string
          intent?: 'study' | 'teach' | 'project' | 'brainstorm' | 'presentation'
          content?: any
          created_at?: string
          updated_at?: string
        }
      }
      unlockables: {
        Row: {
          id: string
          name: string
          type: 'theme' | 'feature'
          cost: number
        }
        Insert: {
          id?: string
          name: string
          type: 'theme' | 'feature'
          cost: number
        }
        Update: {
          id?: string
          name?: string
          type?: 'theme' | 'feature'
          cost?: number
        }
      }
      user_unlockables: {
        Row: {
          id: string
          profile_id: string
          unlockable_id: string
          unlocked_at: string
        }
        Insert: {
          id?: string
          profile_id: string
          unlockable_id: string
          unlocked_at?: string
        }
        Update: {
          id?: string
          profile_id?: string
          unlockable_id?: string
          unlocked_at?: string
        }
      }
      xp_transactions: {
        Row: {
          id: string
          profile_id: string
          amount: number
          reason: string
          created_at: string
        }
        Insert: {
          id?: string
          profile_id: string
          amount: number
          reason: string
          created_at?: string
        }
        Update: {
          id?: string
          profile_id?: string
          amount?: number
          reason?: string
          created_at?: string
        }
      }
      quizzes: {
        Row: {
          id: string
          mindmap_id: string
          questions: any
          created_at: string
        }
        Insert: {
          id?: string
          mindmap_id: string
          questions: any
          created_at?: string
        }
        Update: {
          id?: string
          mindmap_id?: string
          questions?: any
          created_at?: string
        }
      }
      flashcards: {
        Row: {
          id: string
          mindmap_id: string
          cards: any
          created_at: string
        }
        Insert: {
          id?: string
          mindmap_id: string
          cards: any
          created_at?: string
        }
        Update: {
          id?: string
          mindmap_id?: string
          cards?: any
          created_at?: string
        }
      }
      collab_sessions: {
        Row: {
          id: string
          mindmap_id: string
          session_token: string
          created_at: string
        }
        Insert: {
          id?: string
          mindmap_id: string
          session_token: string
          created_at?: string
        }
        Update: {
          id?: string
          mindmap_id?: string
          session_token?: string
          created_at?: string
        }
      }
    }
  }
}