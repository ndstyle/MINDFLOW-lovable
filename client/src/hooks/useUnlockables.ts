import { useState, useEffect } from 'react';
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
      const response = await fetch('/api/unlockables');
      if (response.ok) {
        const data = await response.json();
        setUnlockables(data);
      }
    } catch (error) {
      console.error('Error fetching unlockables:', error);
    }
  };

  const fetchUserUnlockables = async () => {
    try {
      const response = await fetch('/api/user-unlockables');
      if (response.ok) {
        const data = await response.json();
        setUserUnlockables(data);
      }
    } catch (error) {
      console.error('Error fetching user unlockables:', error);
    } finally {
      setLoading(false);
    }
  };

  const unlockItem = async (unlockableId: string, spendXPFunction: (amount: number, reason: string) => Promise<boolean>) => {
    try {
      const unlockable = unlockables.find(u => u.id === unlockableId);
      if (!unlockable) return false;

      // Check if already unlocked
      if (userUnlockables.some(u => u.unlockable_id === unlockableId)) {
        toast.error('Already unlocked!');
        return false;
      }

      // Spend XP first
      const success = await spendXPFunction(unlockable.xp_cost, unlockable.name);
      if (!success) {
        return false;
      }

      // Unlock item
      const response = await fetch('/api/unlock-item', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ unlockableId }),
      });

      if (response.ok) {
        await fetchUserUnlockables();
        toast.success(`${unlockable.name} unlocked!`);
        return true;
      } else {
        const error = await response.json();
        toast.error(error.error || 'Failed to unlock item');
        return false;
      }
    } catch (error) {
      console.error('Error unlocking item:', error);
      toast.error('Failed to unlock item');
      return false;
    }
  };

  const hasUnlocked = (unlockableId: string) => {
    return userUnlockables.some(u => u.unlockable_id === unlockableId);
  };

  const hasFeature = (featureName: string) => {
    const unlockable = unlockables.find(u => u.name === featureName && u.type === 'feature');
    if (!unlockable) return false;
    return hasUnlocked(unlockable.id);
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