import { Header } from "@/components/Header";
import { Button } from "@/components/ui/button";
import { FileText, Clock, Search } from "lucide-react";

const History = () => {
  return (
    <div className="min-h-screen bg-background">
      <Header />
      
      <main className="container mx-auto px-6 py-8">
        <div className="max-w-6xl mx-auto space-y-8">
          <div className="text-center space-y-4">
            <h1 className="text-3xl font-bold gradient-text lowercase">
              history
            </h1>
            <p className="text-muted-foreground lowercase max-w-2xl mx-auto">
              browse through all your created mind maps
            </p>
          </div>

          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Button variant="outline" size="sm" className="lowercase">
                <Search className="w-4 h-4 mr-2" />
                search maps
              </Button>
              <Button variant="outline" size="sm" className="lowercase">
                filter by date
              </Button>
            </div>
            <Button className="lowercase">
              export all
            </Button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[1, 2, 3, 4, 5, 6].map((i) => (
              <div key={i} className="p-6 bg-card rounded-lg border border-border/50 space-y-4">
                <div className="flex items-center justify-between">
                  <FileText className="w-8 h-8 text-primary" />
                  <span className="text-xs text-muted-foreground">2 days ago</span>
                </div>
                <h3 className="font-semibold text-foreground lowercase">
                  project planning mind map {i}
                </h3>
                <p className="text-sm text-muted-foreground lowercase">
                  a comprehensive mind map for organizing project tasks and deliverables
                </p>
                <div className="flex items-center gap-2">
                  <Button size="sm" variant="outline" className="flex-1 lowercase">
                    view
                  </Button>
                  <Button size="sm" variant="outline" className="flex-1 lowercase">
                    edit
                  </Button>
                </div>
              </div>
            ))}
          </div>

          <div className="text-center text-muted-foreground lowercase">
            <p>showing 6 of 12 mind maps</p>
            <Button variant="ghost" className="mt-4 lowercase">
              load more
            </Button>
          </div>
        </div>
      </main>
    </div>
  );
};

export default History;