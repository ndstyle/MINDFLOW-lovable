import { Header } from "@/components/Header";
import { Button } from "@/components/ui/button";
import { Plus, FileText, Calendar } from "lucide-react";

const Dashboard = () => {
  return (
    <div className="min-h-screen bg-background">
      <Header />
      
      <main className="container mx-auto px-6 py-8">
        <div className="max-w-6xl mx-auto space-y-8">
          <div className="text-center space-y-4">
            <h1 className="text-3xl font-bold gradient-text lowercase">
              dashboard
            </h1>
            <p className="text-muted-foreground lowercase max-w-2xl mx-auto">
              manage and organize all your mind maps
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="p-6 bg-card rounded-lg border border-border/50 text-center space-y-4">
              <Plus className="w-12 h-12 mx-auto text-primary" />
              <h3 className="font-semibold text-foreground lowercase">create new</h3>
              <p className="text-sm text-muted-foreground lowercase">start a fresh mind map</p>
              <Button className="w-full lowercase">
                <Plus className="w-4 h-4 mr-2" />
                new mind map
              </Button>
            </div>

            <div className="p-6 bg-card rounded-lg border border-border/50 text-center space-y-4">
              <FileText className="w-12 h-12 mx-auto text-accent" />
              <h3 className="font-semibold text-foreground lowercase">recent maps</h3>
              <p className="text-sm text-muted-foreground lowercase">view your latest work</p>
              <Button variant="outline" className="w-full lowercase">
                view recent
              </Button>
            </div>

            <div className="p-6 bg-card rounded-lg border border-border/50 text-center space-y-4">
              <Calendar className="w-12 h-12 mx-auto text-secondary" />
              <h3 className="font-semibold text-foreground lowercase">scheduled</h3>
              <p className="text-sm text-muted-foreground lowercase">planned mind maps</p>
              <Button variant="outline" className="w-full lowercase">
                view schedule
              </Button>
            </div>
          </div>

          <div className="text-center text-muted-foreground lowercase">
            <p>dashboard functionality coming soon...</p>
          </div>
        </div>
      </main>
    </div>
  );
};

export default Dashboard;