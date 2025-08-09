import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

export interface Unlockable {
  id: string;
  name: string;
  type: 'color_theme' | 'feature';
  xp_cost: number;
  description: string | null;
  config: any;
  created_at: string;
}

export interface UserUnlockable {
  id: string;
  user_id: string;
  unlockable_id: string;
  unlocked_at: string;
  unlockable: Unlockable;
}

export const useUnlockables = () => {
  const [unlockables, setUnlockables] = useState<Unlockable[]>([]);
  const [userUnlockables, setUserUnlockables] = useState<UserUnlockable[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchUnlockables();
    fetchUserUnlockables();
  }, []);

  const fetchUnlockables = async () => {
    try {
      const { data, error } = await supabase
        .from('unlockables')
        .select('*')
        .order('xp_cost');

      if (error) throw error;
      setUnlockables((data || []) as Unlockable[]);
    } catch (error) {
      console.error('Error fetching unlockables:', error);
    }
  };

  const fetchUserUnlockables = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        setLoading(false);
        return;
      }

      const { data, error } = await supabase
        .from('user_unlockables')
        .select(`
          *,
          unlockable:unlockables(*)
        `)
        .eq('user_id', user.id);

      if (error) throw error;
      setUserUnlockables((data || []) as UserUnlockable[]);
    } catch (error) {
      console.error('Error fetching user unlockables:', error);
    } finally {
      setLoading(false);
    }
  };

  const unlockItem = async (unlockableId: string, spendXPFunction: (amount: number, reason: string) => Promise<boolean>) => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return false;

      const unlockable = unlockables.find(u => u.id === unlockableId);
      if (!unlockable) return false;

      // Check if already unlocked
      if (userUnlockables.some(u => u.unlockable_id === unlockableId)) {
        toast.error('Already unlocked!');
        return false;
      }

      // Spend XP
      const success = await spendXPFunction(unlockable.xp_cost, unlockable.name);
      if (!success) {
        toast.error('Not enough XP!');
        return false;
      }

      // Unlock item
      const { data, error } = await supabase
        .from('user_unlockables')
        .insert({
          user_id: user.id,
          unlockable_id: unlockableId
        })
        .select(`
          *,
          unlockable:unlockables(*)
        `)
        .single();

      if (error) throw error;

      setUserUnlockables([...userUnlockables, data as UserUnlockable]);
      toast.success(`🎉 Unlocked ${unlockable.name}!`);
      return true;
    } catch (error) {
      console.error('Error unlocking item:', error);
      return false;
    }
  };

  const hasUnlocked = (unlockableId: string) => {
    return userUnlockables.some(u => u.unlockable_id === unlockableId);
  };

  const hasFeature = (featureName: string) => {
    return userUnlockables.some(u => 
      u.unlockable.type === 'feature' && 
      u.unlockable.config?.feature === featureName
    );
  };

  return {
    unlockables,
    userUnlockables,
    loading,
    unlockItem,
    hasUnlocked,
    hasFeature,
    fetchUserUnlockables
  };
};