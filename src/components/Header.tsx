import { Button } from "@/components/ui/button";
import { Link, useNavigate } from "react-router-dom";
import { Zap, Palette, LogOut } from "lucide-react";
import { XPDisplay } from "@/components/XPDisplay";
import { UnlockablesModal } from "@/components/UnlockablesModal";
import { useState } from "react";
import { useAuth } from "@/hooks/useAuth";
import { toast } from "sonner";

export const Header = () => {
  const { user, signOut } = useAuth();
  const navigate = useNavigate();
  const [showUnlockables, setShowUnlockables] = useState(false);

  const handleSignOut = async () => {
    try {
      await signOut();
      toast.success("signed out successfully");
      navigate("/auth");
    } catch (error: any) {
      toast.error("error signing out");
    }
  };

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
          {user && (
            <>
              <Link to="/dashboard" className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors lowercase">
                dashboard
              </Link>
              <Link to="/history" className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors lowercase">
                history
              </Link>
            </>
          )}
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
          {user ? (
            <>
              <Link to="/create">
                <Button size="sm" className="lowercase">
                  create
                </Button>
              </Link>
              <Button
                size="sm"
                variant="ghost"
                onClick={handleSignOut}
                className="lowercase"
              >
                <LogOut className="w-4 h-4 mr-2" />
                sign out
              </Button>
            </>
          ) : (
            <Link to="/auth">
              <Button size="sm" className="lowercase">
                sign in
              </Button>
            </Link>
          )}
        </div>
      </div>

      <UnlockablesModal 
        isOpen={showUnlockables} 
        onClose={() => setShowUnlockables(false)} 
      />
    </header>
  );
};