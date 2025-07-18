import { Button } from "@/components/ui/button";
import { User } from "lucide-react";
import { useLocation } from "react-router-dom";

export const Header = () => {
  const location = useLocation();

  const scrollToFeatures = () => {
    const featuresSection = document.getElementById('features');
    if (featuresSection) {
      featuresSection.scrollIntoView({ behavior: 'smooth' });
    }
  };

  return (
    <header className="w-full px-6 py-4 flex items-center justify-between border-b border-border/50">
      <div className="flex items-center gap-8">
        <div className="text-xl font-medium text-foreground lowercase">
          Mindflow
        </div>
        <nav className="hidden md:flex items-center gap-6">
          <a href="/" className="text-sm text-muted-foreground hover:text-foreground transition-colors lowercase">
            home
          </a>
          <a href="/create" className="text-sm text-muted-foreground hover:text-foreground transition-colors lowercase">
            create
          </a>
          <a href="/dashboard" className="text-sm text-muted-foreground hover:text-foreground transition-colors lowercase">
            dashboard
          </a>
          <a href="/history" className="text-sm text-muted-foreground hover:text-foreground transition-colors lowercase">
            history
          </a>
        </nav>
      </div>
      
      <div className="flex items-center gap-4">
        <span className="text-sm text-muted-foreground lowercase">user@example.com</span>
        <Button variant="ghost" size="sm" className="lowercase">
          <User className="w-4 h-4 mr-2" />
          sign out
        </Button>
      </div>
    </header>
  );
};