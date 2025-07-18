import { Button } from "@/components/ui/button";
import { User } from "lucide-react";
import { Link, useLocation } from "react-router-dom";

export const Header = () => {
  const location = useLocation();
  return (
    <header className="w-full px-6 py-4 flex items-center justify-between border-b border-border/50">
      <div className="flex items-center gap-8">
        <Link to="/" className="text-xl font-medium text-foreground lowercase hover:text-primary transition-colors">
          mindflow
        </Link>
        <nav className="hidden md:flex items-center gap-6">
          <Link to="/" className="text-sm text-muted-foreground hover:text-foreground transition-colors lowercase">
            home
          </Link>
          <Link to="/create" className="text-sm text-muted-foreground hover:text-foreground transition-colors lowercase">
            create
          </Link>
          <Link to="/dashboard" className="text-sm text-muted-foreground hover:text-foreground transition-colors lowercase">
            dashboard
          </Link>
          <Link to="/history" className="text-sm text-muted-foreground hover:text-foreground transition-colors lowercase">
            history
          </Link>
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