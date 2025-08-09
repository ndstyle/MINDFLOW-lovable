import { useState, useEffect } from 'react';
import { toast } from 'sonner';

export interface Profile {
  id: string;
  user_id: string;
  username: string | null;
  email: string | null;
  xp: number;
  level: number;
  created_at: string;
  updated_at: string;
}

export const useProfile = () => {
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchProfile();
  }, []);

  const fetchProfile = async () => {
    try {
      const token = localStorage.getItem('supabase_token');
      const headers = token ? { 'Authorization': `Bearer ${token}` } : {};
      
      const response = await fetch('/api/profile', { headers });
      if (response.ok) {
        const data = await response.json();
        setProfile(data);
      }
    } catch (error) {
      console.error('Error fetching profile:', error);
    } finally {
      setLoading(false);
    }
  };

  const awardXP = async (amount: number, reason: string, mindmapId?: string) => {
    try {
      const token = localStorage.getItem('supabase_token');
      const headers: Record<string, string> = {
        'Content-Type': 'application/json',
      };
      if (token) {
        headers['Authorization'] = `Bearer ${token}`;
      }
      
      const response = await fetch('/api/xp-transactions', {
        method: 'POST',
        headers,
        body: JSON.stringify({ amount, type: 'earned', reason, mindmap_id: mindmapId }),
      });

      if (response.ok) {
        const updatedProfile = await response.json();
        setProfile(updatedProfile);
        toast.success(`+${amount} XP earned! ${reason}`);

        if (updatedProfile.level > (profile?.level || 0)) {
          toast.success(`🎉 Level up! You're now level ${updatedProfile.level}!`);
        }
      }
    } catch (error) {
      console.error('Error awarding XP:', error);
    }
  };

  const spendXP = async (amount: number, reason: string) => {
    try {
      const response = await fetch('/api/profile/spend-xp', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ amount, reason }),
      });

      if (response.ok) {
        const data = await response.json();
        setProfile(data.profile);
        return true;
      } else {
        const error = await response.json();
        toast.error(error.error || 'Failed to spend XP');
        return false;
      }
    } catch (error) {
      console.error('Error spending XP:', error);
      return false;
    }
  };

  return {
    profile,
    loading,
    fetchProfile,
    awardXP,
    spendXP
  };
};