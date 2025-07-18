import { Button } from "@/components/ui/button";
import { User } from "lucide-react";

export const Header = () => {
  return (
    <header className="w-full px-6 py-4 flex items-center justify-between border-b border-border/50">
      <div className="flex items-center gap-8">
        <div className="text-xl font-medium text-foreground lowercase">
          mindflow
        </div>
        <nav className="hidden md:flex items-center gap-6">
          <a href="#" className="text-sm text-muted-foreground hover:text-foreground transition-colors lowercase">
            home
          </a>
          <a href="#" className="text-sm text-muted-foreground hover:text-foreground transition-colors lowercase">
            create
          </a>
          <a href="#" className="text-sm text-muted-foreground hover:text-foreground transition-colors lowercase">
            dashboard
          </a>
          <a href="#" className="text-sm text-muted-foreground hover:text-foreground transition-colors lowercase">
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