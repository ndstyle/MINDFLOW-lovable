import { useState, useEffect } from 'react';
import { useAuth } from './useAuth';
import { supabase } from '../lib/supabase';
import { toast } from 'sonner';
import type { Database } from '../../../lib/supabase';

type Unlockable = Database['public']['Tables']['unlockables']['Row'];
type UserUnlockable = Database['public']['Tables']['user_unlockables']['Row'];

export const useUnlockables = () => {
  const { user } = useAuth();
  const [unlockables, setUnlockables] = useState<Unlockable[]>([]);
  const [userUnlockables, setUserUnlockables] = useState<UserUnlockable[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchUnlockables();
    if (user) {
      fetchUserUnlockables();
    }
  }, [user]);

  const fetchUnlockables = async () => {
    try {
      const { data, error } = await supabase
        .from('unlockables')
        .select('*')
        .order('cost', { ascending: true });

      if (error) {
        console.error('Error fetching unlockables:', error);
        return;
      }

      setUnlockables(data || []);
    } catch (error) {
      console.error('Error fetching unlockables:', error);
    }
  };

  const fetchUserUnlockables = async () => {
    if (!user) return;

    try {
      const { data, error } = await supabase
        .from('user_unlockables')
        .select('*')
        .eq('profile_id', user.id);

      if (error) {
        console.error('Error fetching user unlockables:', error);
        return;
      }

      setUserUnlockables(data || []);
    } catch (error) {
      console.error('Error fetching user unlockables:', error);
    } finally {
      setLoading(false);
    }
  };

  const unlockItem = async (unlockableId: string, spendXPCallback: (amount: number, reason: string) => Promise<any>) => {
    if (!user) {
      toast.error('Please sign in to unlock items');
      return;
    }

    const unlockable = unlockables.find(u => u.id === unlockableId);
    if (!unlockable) {
      toast.error('Unlockable item not found');
      return;
    }

    if (hasUnlocked(unlockableId)) {
      toast.error('Item already unlocked');
      return;
    }

    try {
      // Spend XP first
      await spendXPCallback(unlockable.cost, `Unlocking ${unlockable.name}`);

      // Create user unlockable record
      const { error } = await supabase
        .from('user_unlockables')
        .insert({
          profile_id: user.id,
          unlockable_id: unlockableId,
        });

      if (error) {
        throw error;
      }

      // Refresh user unlockables
      await fetchUserUnlockables();
      toast.success(`${unlockable.name} unlocked!`);
    } catch (error: any) {
      console.error('Error unlocking item:', error);
      toast.error(error.message || 'Failed to unlock item');
    }
  };

  const hasUnlocked = (unlockableId: string): boolean => {
    return userUnlockables.some(uu => uu.unlockable_id === unlockableId);
  };

  const hasFeature = (featureName: string): boolean => {
    const featureUnlockable = unlockables.find(u => u.type === 'feature' && u.name === featureName);
    return featureUnlockable ? hasUnlocked(featureUnlockable.id) : false;
  };

  return {
    unlockables,
    userUnlockables,
    loading,
    unlockItem,
    hasUnlocked,
    hasFeature,
  };
};