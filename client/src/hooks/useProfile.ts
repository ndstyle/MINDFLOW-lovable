import { useAuth } from './useAuth';
import { supabase } from '../lib/supabase';
import { toast } from 'sonner';
import type { Database } from '../../../lib/supabase';

type Profile = Database['public']['Tables']['profiles']['Row'];

export const useProfile = () => {
  const { profile, user, loading } = useAuth();

  const awardXP = async (amount: number, reason: string) => {
    if (!user || !profile) {
      throw new Error('User not authenticated');
    }

    try {
      // Create XP transaction
      const { error: xpError } = await supabase
        .from('xp_transactions')
        .insert({
          profile_id: user.id,
          amount,
          reason,
        });

      if (xpError) {
        throw xpError;
      }

      // Update profile XP and level
      const newXP = profile.xp + amount;
      const newLevel = Math.floor(newXP / 100) + 1; // Simple leveling: 100 XP per level

      const { data: updatedProfile, error: profileError } = await supabase
        .from('profiles')
        .update({
          xp: newXP,
          level: newLevel,
          updated_at: new Date().toISOString(),
        })
        .eq('id', user.id)
        .select()
        .single();

      if (profileError) {
        throw profileError;
      }

      toast.success(`+${amount} XP earned! ${reason}`);
      
      if (newLevel > profile.level) {
        toast.success(`🎉 Level up! You're now level ${newLevel}!`);
      }

      return updatedProfile;
    } catch (error: any) {
      console.error('Error awarding XP:', error);
      toast.error('Failed to award XP');
      throw error;
    }
  };

  const spendXP = async (amount: number, reason: string) => {
    if (!user || !profile) {
      throw new Error('User not authenticated');
    }

    if (profile.xp < amount) {
      throw new Error('Insufficient XP');
    }

    try {
      // Create negative XP transaction
      const { error: xpError } = await supabase
        .from('xp_transactions')
        .insert({
          profile_id: user.id,
          amount: -amount,
          reason,
        });

      if (xpError) {
        throw xpError;
      }

      // Update profile XP
      const newXP = profile.xp - amount;
      const newLevel = Math.floor(newXP / 100) + 1;

      const { data: updatedProfile, error: profileError } = await supabase
        .from('profiles')
        .update({
          xp: newXP,
          level: newLevel,
          updated_at: new Date().toISOString(),
        })
        .eq('id', user.id)
        .select()
        .single();

      if (profileError) {
        throw profileError;
      }

      toast.success(`-${amount} XP spent on ${reason}`);
      return updatedProfile;
    } catch (error: any) {
      console.error('Error spending XP:', error);
      toast.error('Failed to spend XP');
      throw error;
    }
  };

  return {
    profile,
    loading,
    awardXP,
    spendXP,
  };
};