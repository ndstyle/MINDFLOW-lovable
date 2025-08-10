import Header from "@/components/Header";
import { Button } from "@/components/ui/button";
import { Plus, FileText, Calendar, Trash2 } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useState, useEffect } from "react";
import { useAuth } from "@/hooks/useAuth";
import { useLocation, Link } from "wouter";
import { toast } from "sonner";

interface MindMap {
  id: string;
  title: string;
  category: string;
  created_at: string;
  xp_earned: number;
}

const Dashboard = () => {
  const { user, loading } = useAuth();
  const [location, setLocation] = useLocation();
  const [mindmaps, setMindmaps] = useState<MindMap[]>([]);
  const [loadingMindmaps, setLoadingMindmaps] = useState(true);

  useEffect(() => {
    if (!loading && !user) {
      setLocation("/auth");
      return;
    }
    
    if (user) {
      fetchMindmaps();
    }
  }, [user, loading, setLocation]);

  const fetchMindmaps = async () => {
    try {
      const response = await fetch('/api/mindmaps?limit=6');
      if (response.ok) {
        const data = await response.json();
        setMindmaps(data);
      } else {
        toast.error("failed to load mind maps");
      }
    } catch (error) {
      console.error('Error fetching mindmaps:', error);
      toast.error("failed to load mind maps");
    } finally {
      setLoadingMindmaps(false);
    }
  };

  const deleteMindMap = async (id: string) => {
    try {
      const response = await fetch(`/api/mindmaps/${id}`, {
        method: 'DELETE',
      });

      if (response.ok) {
        setMindmaps(prev => prev.filter(m => m.id !== id));
        toast.success("mind map deleted");
      } else {
        toast.error("failed to delete mind map");
      }
    } catch (error) {
      console.error('Error deleting mindmap:', error);
      toast.error("failed to delete mind map");
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background">
        <Header />
        <main className="container mx-auto px-6 py-8">
          <div className="text-center">loading...</div>
        </main>
      </div>
    );
  }
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

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
            <Card>
              <CardHeader className="text-center space-y-4">
                <Plus className="w-12 h-12 mx-auto text-primary" />
                <CardTitle className="font-semibold text-foreground lowercase">create new</CardTitle>
                <CardDescription className="text-sm text-muted-foreground lowercase">start a fresh mind map</CardDescription>
              </CardHeader>
              <CardContent>
                <Link to="/">
                  <Button className="w-full lowercase">
                    <Plus className="w-4 h-4 mr-2" />
                    new mind map
                  </Button>
                </Link>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="text-center space-y-4">
                <FileText className="w-12 h-12 mx-auto text-accent" />
                <CardTitle className="font-semibold text-foreground lowercase">total maps</CardTitle>
                <CardDescription className="text-sm text-muted-foreground lowercase">{mindmaps.length} mind maps created</CardDescription>
              </CardHeader>
              <CardContent>
                <Link to="/history">
                  <Button variant="outline" className="w-full lowercase">
                    view all
                  </Button>
                </Link>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="text-center space-y-4">
                <Calendar className="w-12 h-12 mx-auto text-secondary" />
                <CardTitle className="font-semibold text-foreground lowercase">recent activity</CardTitle>
                <CardDescription className="text-sm text-muted-foreground lowercase">your latest creations</CardDescription>
              </CardHeader>
              <CardContent>
                <Button variant="outline" className="w-full lowercase" onClick={fetchMindmaps}>
                  refresh
                </Button>
              </CardContent>
            </Card>
          </div>

          <div className="space-y-6">
            <h2 className="text-2xl font-bold text-foreground lowercase">recent mind maps</h2>
            
            {loadingMindmaps ? (
              <div className="text-center text-muted-foreground lowercase">loading mind maps...</div>
            ) : mindmaps.length === 0 ? (
              <div className="text-center space-y-4">
                <p className="text-muted-foreground lowercase">no mind maps yet</p>
                <Link to="/">
                  <Button className="lowercase">create your first mind map</Button>
                </Link>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {mindmaps.map((mindmap) => (
                  <Card key={mindmap.id} className="hover:shadow-md transition-shadow">
                    <CardHeader>
                      <div className="flex items-start justify-between">
                        <div>
                          <CardTitle className="text-sm font-medium text-foreground lowercase line-clamp-2">
                            {mindmap.title}
                          </CardTitle>
                          <CardDescription className="text-xs text-muted-foreground lowercase">
                            {mindmap.category}
                          </CardDescription>
                        </div>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => deleteMindMap(mindmap.id)}
                          className="text-destructive hover:text-destructive"
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    </CardHeader>
                    <CardContent>
                      <div className="flex items-center justify-between text-xs text-muted-foreground">
                        <span className="lowercase">
                          {new Date(mindmap.created_at).toLocaleDateString()}
                        </span>
                        <span className="lowercase">
                          +{mindmap.xp_earned} xp
                        </span>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </div>
        </div>
      </main>
    </div>
  );
};

export default Dashboard;