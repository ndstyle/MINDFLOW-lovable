import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";
import { Zap, Palette } from "lucide-react";
import { XPDisplay } from "@/components/XPDisplay";
import { UnlockablesModal } from "@/components/UnlockablesModal";
import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";

export const Header = () => {
  const [showUnlockables, setShowUnlockables] = useState(false);
  const [user, setUser] = useState(null);

  useEffect(() => {
    supabase.auth.getUser().then(({ data: { user } }) => {
      setUser(user);
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      setUser(session?.user || null);
    });

    return () => subscription.unsubscribe();
  }, []);

  return (
    <header className="sticky top-0 z-40 w-full border-b border-border/40 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container mx-auto px-6 h-16 flex items-center justify-between">
        <Link to="/" className="flex items-center gap-2 text-xl font-bold lowercase">
          <Zap className="w-6 h-6 text-primary" />
          mindflow
        </Link>
        
        <nav className="hidden md:flex items-center gap-6">
          <Link to="/" className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors lowercase">
            home
          </Link>
          <Link to="/dashboard" className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors lowercase">
            dashboard
          </Link>
          <Link to="/history" className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors lowercase">
            history
          </Link>
        </nav>
        
        <div className="flex items-center gap-3">
          {user && (
            <>
              <XPDisplay />
              <Button 
                size="sm" 
                variant="outline" 
                onClick={() => setShowUnlockables(true)}
                className="lowercase"
              >
                <Palette className="w-4 h-4 mr-2" />
                unlock
              </Button>
            </>
          )}
          <Button size="sm" className="lowercase">
            {user ? 'create' : 'get started'}
          </Button>
        </div>
      </div>

      <UnlockablesModal 
        isOpen={showUnlockables} 
        onClose={() => setShowUnlockables(false)} 
      />
    </header>
  );
};