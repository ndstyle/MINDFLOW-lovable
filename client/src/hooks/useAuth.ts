import { useState, useEffect } from 'react';

interface User {
  id: string;
  email: string;
}

interface AuthState {
  user: User | null;
  loading: boolean;
}

export const useAuth = () => {
  const [authState, setAuthState] = useState<AuthState>({
    user: null,
    loading: true,
  });

  useEffect(() => {
    checkSession();
  }, []);

  const checkSession = async () => {
    try {
      const token = localStorage.getItem('supabase_token');
      if (token) {
        const response = await fetch('/api/auth/session', {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        });
        
        if (response.ok) {
          const data = await response.json();
          setAuthState({
            user: data.user,
            loading: false,
          });
          return;
        }
      }
    } catch (error) {
      console.error('Session check error:', error);
    }
    
    setAuthState({
      user: null,
      loading: false,
    });
  };

  const signUp = async (email: string, password: string, username?: string) => {
    const response = await fetch('/api/auth/signup', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ email, password, username }),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Signup failed');
    }

    const data = await response.json();
    return data;
  };

  const signIn = async (email: string, password: string) => {
    const response = await fetch('/api/auth/signin', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ email, password }),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Signin failed');
    }

    const data = await response.json();
    
    // Store the session token
    if (data.session?.access_token) {
      localStorage.setItem('supabase_token', data.session.access_token);
      setAuthState({
        user: data.user,
        loading: false,
      });
    }

    return data;
  };

  const signOut = async () => {
    try {
      const token = localStorage.getItem('supabase_token');
      if (token) {
        await fetch('/api/auth/signout', {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${token}`
          }
        });
      }
    } catch (error) {
      console.error('Signout error:', error);
    } finally {
      localStorage.removeItem('supabase_token');
      setAuthState({
        user: null,
        loading: false,
      });
    }
  };

  return {
    ...authState,
    signUp,
    signIn,
    signOut,
  };
};