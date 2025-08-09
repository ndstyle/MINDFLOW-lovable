// Database types for Supabase integration
export interface Database {
  public: {
    Tables: {
      profiles: {
        Row: {
          id: string;
          user_id: string;
          username: string | null;
          email: string | null;
          xp: number;
          level: number;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          username?: string | null;
          email?: string | null;
          xp?: number;
          level?: number;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          username?: string | null;
          email?: string | null;
          xp?: number;
          level?: number;
          created_at?: string;
          updated_at?: string;
        };
      };
      mindmaps: {
        Row: {
          id: string;
          user_id: string;
          title: string;
          content: any;
          category: string | null;
          xp_earned: number;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          title: string;
          content: any;
          category?: string | null;
          xp_earned?: number;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          title?: string;
          content?: any;
          category?: string | null;
          xp_earned?: number;
          created_at?: string;
          updated_at?: string;
        };
      };
      xp_transactions: {
        Row: {
          id: string;
          user_id: string;
          amount: number;
          type: string;
          reason: string;
          mindmap_id: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          amount: number;
          type: string;
          reason: string;
          mindmap_id?: string | null;
          created_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          amount?: number;
          type?: string;
          reason?: string;
          mindmap_id?: string | null;
          created_at?: string;
        };
      };
      unlockables: {
        Row: {
          id: string;
          name: string;
          type: string;
          xp_cost: number;
          description: string | null;
          config: any;
          created_at: string;
        };
        Insert: {
          id?: string;
          name: string;
          type: string;
          xp_cost: number;
          description?: string | null;
          config?: any;
          created_at?: string;
        };
        Update: {
          id?: string;
          name?: string;
          type?: string;
          xp_cost?: number;
          description?: string | null;
          config?: any;
          created_at?: string;
        };
      };
      user_unlockables: {
        Row: {
          id: string;
          user_id: string;
          unlockable_id: string;
          unlocked_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          unlockable_id: string;
          unlocked_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          unlockable_id?: string;
          unlocked_at?: string;
        };
      };
      quizzes: {
        Row: {
          id: string;
          mindmap_id: string;
          user_id: string;
          questions: any;
          created_at: string;
        };
        Insert: {
          id?: string;
          mindmap_id: string;
          user_id: string;
          questions: any;
          created_at?: string;
        };
        Update: {
          id?: string;
          mindmap_id?: string;
          user_id?: string;
          questions?: any;
          created_at?: string;
        };
      };
      flashcards: {
        Row: {
          id: string;
          mindmap_id: string;
          user_id: string;
          cards: any;
          created_at: string;
        };
        Insert: {
          id?: string;
          mindmap_id: string;
          user_id: string;
          cards: any;
          created_at?: string;
        };
        Update: {
          id?: string;
          mindmap_id?: string;
          user_id?: string;
          cards?: any;
          created_at?: string;
        };
      };
      collab_sessions: {
        Row: {
          id: string;
          mindmap_id: string;
          session_token: string;
          permissions: string;
          created_by: string;
          expires_at: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          mindmap_id: string;
          session_token: string;
          permissions?: string;
          created_by: string;
          expires_at?: string | null;
          created_at?: string;
        };
        Update: {
          id?: string;
          mindmap_id?: string;
          session_token?: string;
          permissions?: string;
          created_by?: string;
          expires_at?: string | null;
          created_at?: string;
        };
      };
    };
  };
}

// Convenience type aliases
export type Profile = Database['public']['Tables']['profiles']['Row'];
export type InsertProfile = Database['public']['Tables']['profiles']['Insert'];
export type UpdateProfile = Database['public']['Tables']['profiles']['Update'];

export type Mindmap = Database['public']['Tables']['mindmaps']['Row'];
export type InsertMindmap = Database['public']['Tables']['mindmaps']['Insert'];
export type UpdateMindmap = Database['public']['Tables']['mindmaps']['Update'];

export type XpTransaction = Database['public']['Tables']['xp_transactions']['Row'];
export type InsertXpTransaction = Database['public']['Tables']['xp_transactions']['Insert'];

export type Unlockable = Database['public']['Tables']['unlockables']['Row'];
export type UserUnlockable = Database['public']['Tables']['user_unlockables']['Row'];
export type InsertUserUnlockable = Database['public']['Tables']['user_unlockables']['Insert'];

export type Quiz = Database['public']['Tables']['quizzes']['Row'];
export type InsertQuiz = Database['public']['Tables']['quizzes']['Insert'];

export type Flashcard = Database['public']['Tables']['flashcards']['Row'];
export type InsertFlashcard = Database['public']['Tables']['flashcards']['Insert'];

export type CollabSession = Database['public']['Tables']['collab_sessions']['Row'];
export type InsertCollabSession = Database['public']['Tables']['collab_sessions']['Insert'];