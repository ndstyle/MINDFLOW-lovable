import { useState, useEffect, createContext, useContext } from 'react';
import { toast } from 'sonner';

interface User {
  id: string;
  email: string;
}

interface Profile {
  id: string;
  user_id: string;
  username: string;
  email: string;
  xp: number;
  level: number;
}

interface AuthContextType {
  user: User | null;
  profile: Profile | null;
  loading: boolean;
  signUp: (email: string, password: string, username?: string) => Promise<void>;
  signIn: (email: string, password: string) => Promise<void>;
  signOut: () => Promise<void>;
  refreshProfile: () => Promise<void>;
}

export const AuthContext = createContext<AuthContextType | null>(null);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export const useAuthHook = () => {
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);

  const getAuthHeaders = () => {
    const token = localStorage.getItem('mindflow_token');
    return token ? { 'Authorization': `Bearer ${token}` } : {};
  };

  const refreshProfile = async () => {
    try {
      const response = await fetch('/api/auth/session', {
        headers: getAuthHeaders()
      });

      if (response.ok) {
        const data = await response.json();
        setUser(data.user);
        setProfile(data.profile);
      } else {
        // Token invalid, clear local storage
        localStorage.removeItem('mindflow_token');
        setUser(null);
        setProfile(null);
      }
    } catch (error) {
      console.error('Error refreshing profile:', error);
      localStorage.removeItem('mindflow_token');
      setUser(null);
      setProfile(null);
    }
  };

  const signUp = async (email: string, password: string, username?: string) => {
    try {
      const response = await fetch('/api/auth/signup', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ email, password, username })
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Signup failed');
      }

      // Store token and set user data
      localStorage.setItem('mindflow_token', data.session.access_token);
      setUser(data.user);
      setProfile(data.profile);
      
      toast.success('Account created successfully!');
    } catch (error: any) {
      console.error('Signup error:', error);
      toast.error(error.message || 'Failed to create account');
      throw error;
    }
  };

  const signIn = async (email: string, password: string) => {
    try {
      const response = await fetch('/api/auth/signin', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ email, password })
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Sign in failed');
      }

      // Store token and set user data
      localStorage.setItem('mindflow_token', data.session.access_token);
      setUser(data.user);
      setProfile(data.profile);
      
      toast.success('Signed in successfully!');
    } catch (error: any) {
      console.error('Sign in error:', error);
      toast.error(error.message || 'Failed to sign in');
      throw error;
    }
  };

  const signOut = async () => {
    try {
      await fetch('/api/auth/signout', {
        method: 'POST',
        headers: getAuthHeaders()
      });
    } catch (error) {
      console.error('Sign out error:', error);
    } finally {
      localStorage.removeItem('mindflow_token');
      setUser(null);
      setProfile(null);
      toast.success('Signed out successfully');
    }
  };

  useEffect(() => {
    const initAuth = async () => {
      const token = localStorage.getItem('mindflow_token');
      if (token) {
        await refreshProfile();
      }
      setLoading(false);
    };

    initAuth();
  }, []);

  return {
    user,
    profile,
    loading,
    signUp,
    signIn,
    signOut,
    refreshProfile
  };
};