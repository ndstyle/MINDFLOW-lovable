
import { useState, useEffect } from 'react';
import { supabase, getSessionToken } from '../lib/supabase';
import type { User } from '@supabase/supabase-js';

interface AuthUser {
  id: string;
  email: string;
}

interface Profile {
  id: string;
  user_id: string;
  username: string | null;
  email: string | null;
  xp: number;
  level: number;
  created_at: string;
  updated_at: string;
}

export const useAuth = () => {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Get initial session
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session?.user) {
        setUser({
          id: session.user.id,
          email: session.user.email!
        });
        fetchProfile(session.user.id);
      } else {
        setLoading(false);
      }
    });

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      if (session?.user) {
        setUser({
          id: session.user.id,
          email: session.user.email!
        });
        await fetchProfile(session.user.id);
      } else {
        setUser(null);
        setProfile(null);
        setLoading(false);
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  const fetchProfile = async (userId: string) => {
    try {
      const token = await getSessionToken();
      if (!token) return;

      const response = await fetch('/api/profile', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (response.ok) {
        const profileData = await response.json();
        setProfile(profileData);
      }
    } catch (error) {
      console.error('Error fetching profile:', error);
    } finally {
      setLoading(false);
    }
  };

  const signUp = async (email: string, password: string, username?: string) => {
    try {
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            username: username || null
          }
        }
      });

      if (error) throw error;

      // If user is created, make API call to create profile
      if (data.user) {
        const response = await fetch('/api/auth/signup', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({ email, password, username })
        });

        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(errorData.error || 'Signup failed');
        }

        const result = await response.json();
        setUser(result.user);
        setProfile(result.profile);
      }

      return { user: data.user, error: null };
    } catch (error) {
      console.error('Signup error:', error);
      return { user: null, error: error as Error };
    }
  };

  const signIn = async (email: string, password: string) => {
    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password
      });

      if (error) throw error;

      if (data.user) {
        setUser({
          id: data.user.id,
          email: data.user.email!
        });
        await fetchProfile(data.user.id);
      }

      return { user: data.user, error: null };
    } catch (error) {
      console.error('Signin error:', error);
      return { user: null, error: error as Error };
    }
  };

  const signOut = async () => {
    try {
      const { error } = await supabase.auth.signOut();
      if (error) throw error;

      setUser(null);
      setProfile(null);
    } catch (error) {
      console.error('Signout error:', error);
    }
  };

  return {
    user,
    profile,
    loading,
    signUp,
    signIn,
    signOut,
    refreshProfile: () => user ? fetchProfile(user.id) : Promise.resolve()
  };
};
