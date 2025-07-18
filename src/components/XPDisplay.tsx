import { Zap, Trophy } from 'lucide-react';
import { useProfile } from '@/hooks/useProfile';

export const XPDisplay = () => {
  const { profile, loading } = useProfile();

  if (loading || !profile) return null;

  const xpToNextLevel = 100 - (profile.xp % 100);
  const progressPercent = (profile.xp % 100);

  return (
    <div className="flex items-center gap-3 px-4 py-2 bg-secondary/50 border border-border/50 rounded-full">
      <div className="flex items-center gap-2">
        <Trophy className="w-4 h-4 text-accent" />
        <span className="text-sm font-medium">Level {profile.level}</span>
      </div>
      
      <div className="flex items-center gap-2">
        <Zap className="w-4 h-4 text-primary" />
        <span className="text-sm font-medium">{profile.xp} XP</span>
      </div>
      
      <div className="w-16 h-2 bg-muted rounded-full overflow-hidden">
        <div 
          className="h-full bg-primary transition-all duration-300"
          style={{ width: `${progressPercent}%` }}
        />
      </div>
      
      <span className="text-xs text-muted-foreground">
        {xpToNextLevel} to next level
      </span>
    </div>
  );
};