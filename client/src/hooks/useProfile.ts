import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
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
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        setLoading(false);
        return;
      }

      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('user_id', user.id)
        .single();

      if (error) {
        console.error('Error fetching profile:', error);
      } else {
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
      const { data: { user } } = await supabase.auth.getUser();
      if (!user || !profile) return;

      // Add XP transaction
      const { error: transactionError } = await supabase
        .from('xp_transactions')
        .insert({
          user_id: user.id,
          amount,
          type: 'earned',
          reason,
          mindmap_id: mindmapId
        });

      if (transactionError) throw transactionError;

      // Update profile XP
      const newXP = profile.xp + amount;
      const newLevel = Math.floor(newXP / 100) + 1; // Level up every 100 XP

      const { error: profileError } = await supabase
        .from('profiles')
        .update({ xp: newXP, level: newLevel })
        .eq('user_id', user.id);

      if (profileError) throw profileError;

      setProfile({ ...profile, xp: newXP, level: newLevel });
      toast.success(`+${amount} XP earned! ${reason}`);

      if (newLevel > profile.level) {
        toast.success(`🎉 Level up! You're now level ${newLevel}!`);
      }
    } catch (error) {
      console.error('Error awarding XP:', error);
    }
  };

  const spendXP = async (amount: number, reason: string) => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user || !profile || profile.xp < amount) return false;

      // Add XP transaction
      const { error: transactionError } = await supabase
        .from('xp_transactions')
        .insert({
          user_id: user.id,
          amount: -amount,
          type: 'spent',
          reason
        });

      if (transactionError) throw transactionError;

      // Update profile XP
      const newXP = profile.xp - amount;
      const { error: profileError } = await supabase
        .from('profiles')
        .update({ xp: newXP })
        .eq('user_id', user.id);

      if (profileError) throw profileError;

      setProfile({ ...profile, xp: newXP });
      toast.success(`Spent ${amount} XP for ${reason}`);
      return true;
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