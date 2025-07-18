import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Palette, Bot, Lock, CheckCircle } from 'lucide-react';
import { useUnlockables } from '@/hooks/useUnlockables';
import { useProfile } from '@/hooks/useProfile';

interface UnlockablesModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const UnlockablesModal = ({ isOpen, onClose }: UnlockablesModalProps) => {
  const { unlockables, userUnlockables, unlockItem, hasUnlocked } = useUnlockables();
  const { profile, spendXP } = useProfile();
  const [unlocking, setUnlocking] = useState<string | null>(null);

  const colorThemes = unlockables.filter(u => u.type === 'color_theme');
  const features = unlockables.filter(u => u.type === 'feature');

  const handleUnlock = async (unlockableId: string) => {
    setUnlocking(unlockableId);
    await unlockItem(unlockableId, spendXP);
    setUnlocking(null);
  };

  const canAfford = (cost: number) => profile ? profile.xp >= cost : false;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Palette className="w-5 h-5" />
            Unlock Themes & Features
          </DialogTitle>
        </DialogHeader>

        <Tabs defaultValue="themes" className="w-full">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="themes">Color Themes</TabsTrigger>
            <TabsTrigger value="features">Features</TabsTrigger>
          </TabsList>

          <TabsContent value="themes" className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {colorThemes.map((theme) => {
                const isUnlocked = hasUnlocked(theme.id);
                const affordable = canAfford(theme.xp_cost);

                return (
                  <div
                    key={theme.id}
                    className="p-4 border border-border rounded-lg space-y-3"
                  >
                    <div className="flex items-center justify-between">
                      <h3 className="font-semibold">{theme.name}</h3>
                      {isUnlocked && <CheckCircle className="w-5 h-5 text-green-500" />}
                    </div>

                    <p className="text-sm text-muted-foreground">
                      {theme.description}
                    </p>

                    <div className="flex items-center gap-2">
                      <div
                        className="w-6 h-6 rounded-full border-2 border-border"
                        style={{ backgroundColor: theme.config?.primary }}
                      />
                      <div
                        className="w-6 h-6 rounded-full border-2 border-border"
                        style={{ backgroundColor: theme.config?.secondary }}
                      />
                    </div>

                    <div className="flex items-center justify-between">
                      <Badge variant={isUnlocked ? "secondary" : "outline"}>
                        {theme.xp_cost} XP
                      </Badge>
                      {!isUnlocked && (
                        <Button
                          size="sm"
                          disabled={!affordable || unlocking === theme.id}
                          onClick={() => handleUnlock(theme.id)}
                        >
                          {unlocking === theme.id ? 'Unlocking...' : 'Unlock'}
                        </Button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </TabsContent>

          <TabsContent value="features" className="space-y-4">
            <div className="space-y-4">
              {features.map((feature) => {
                const isUnlocked = hasUnlocked(feature.id);
                const affordable = canAfford(feature.xp_cost);

                return (
                  <div
                    key={feature.id}
                    className="p-4 border border-border rounded-lg space-y-3"
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <Bot className="w-6 h-6" />
                        <div>
                          <h3 className="font-semibold">{feature.name}</h3>
                          <p className="text-sm text-muted-foreground">
                            {feature.description}
                          </p>
                        </div>
                      </div>
                      {isUnlocked && <CheckCircle className="w-5 h-5 text-green-500" />}
                    </div>

                    <div className="flex items-center justify-between">
                      <Badge variant={isUnlocked ? "secondary" : "outline"}>
                        {feature.xp_cost} XP
                      </Badge>
                      {!isUnlocked && (
                        <Button
                          size="sm"
                          disabled={!affordable || unlocking === feature.id}
                          onClick={() => handleUnlock(feature.id)}
                        >
                          {unlocking === feature.id ? 'Unlocking...' : 'Unlock'}
                        </Button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
};