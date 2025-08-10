import { default as Header } from "@/components/Header";
import { Button } from "@/components/ui/button";
import { Search, Filter, Clock, Trash2 } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { useState, useEffect } from "react";
import { useAuth } from "@/hooks/useAuth";
import { useLocation } from "wouter";
import { toast } from "sonner";
import { supabase } from "@/lib/supabase";

interface MindMap {
  id: string;
  title: string;
  category: string;
  created_at: string;
  xp_earned: number;
  content: any;
}

const History = () => {
  const { user, loading } = useAuth();
  const [location, setLocation] = useLocation();
  const [mindmaps, setMindmaps] = useState<MindMap[]>([]);
  const [loadingMindmaps, setLoadingMindmaps] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("all");

  useEffect(() => {
    if (!loading && !user) {
      console.log('History: No user, redirecting to auth');
      setLocation("/auth");
      return;
    }
    
    if (user && !loading) {
      fetchMindmaps();
    }
  }, [user, loading, setLocation]);

  const fetchMindmaps = async () => {
    try {
      setLoadingMindmaps(true);
      
      // Get auth token from Supabase
      const { data: { session } } = await supabase.auth.getSession();
      if (!session?.access_token) {
        console.warn('No auth token available');
        setMindmaps([]);
        return;
      }

      // Add timeout to API call
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 10000);

      const response = await fetch('/api/mindmaps', {
        headers: {
          'Authorization': `Bearer ${session.access_token}`
        },
        signal: controller.signal
      });
      
      clearTimeout(timeoutId);
      
      if (response.ok) {
        const data = await response.json();
        setMindmaps(Array.isArray(data) ? data : []);
      } else if (response.status === 401) {
        console.warn('Authentication failed, redirecting to login');
        setLocation('/auth');
      } else {
        console.error('API error:', response.status, response.statusText);
        setMindmaps([]);
        toast.error("failed to load mind maps");
      }
    } catch (error: any) {
      console.error('Error fetching mindmaps:', error);
      setMindmaps([]);
      
      if (error.name === 'AbortError') {
        toast.error("request timed out");
      } else {
        toast.error("failed to load mind maps");
      }
    } finally {
      setLoadingMindmaps(false);
    }
  };

  const deleteMindMap = async (id: string) => {
    try {
      // Get auth token from Supabase
      const { data: { session } } = await supabase.auth.getSession();
      if (!session?.access_token) {
        throw new Error('No authentication token');
      }

      const response = await fetch(`/api/mindmaps/${id}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${session.access_token}`
        }
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

  const filteredMindmaps = mindmaps.filter(mindmap => {
    const matchesSearch = mindmap.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         mindmap.category.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory = selectedCategory === "all" || mindmap.category === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  const categories = ["all", ...Array.from(new Set(mindmaps.map(m => m.category)))];

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
              history
            </h1>
            <p className="text-muted-foreground lowercase max-w-2xl mx-auto">
              browse through all your created mind maps
            </p>
          </div>

          <div className="flex flex-col md:flex-row items-center gap-4 mb-8">
            <div className="relative flex-1 max-w-md">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
              <Input
                type="text"
                placeholder="search your mind maps..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10 lowercase placeholder:lowercase"
              />
            </div>
            <div className="flex items-center gap-2">
              <Filter className="w-4 h-4" />
              <select
                value={selectedCategory}
                onChange={(e) => setSelectedCategory(e.target.value)}
                className="px-3 py-2 border border-border rounded-lg bg-background text-foreground lowercase"
              >
                {categories.map(category => (
                  <option key={category} value={category} className="lowercase">
                    {category}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {loadingMindmaps ? (
            <div className="text-center text-muted-foreground lowercase">loading mind maps...</div>
          ) : filteredMindmaps.length === 0 ? (
            <div className="text-center space-y-4">
              <p className="text-muted-foreground lowercase">
                {searchTerm || selectedCategory !== "all" ? "no mind maps match your search" : "no mind maps yet"}
              </p>
              <Button onClick={() => setLocation("/")} className="lowercase">
                create your first mind map
              </Button>
            </div>
          ) : (
            <>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {filteredMindmaps.map((mindmap) => (
                  <Card key={mindmap.id} className="hover:shadow-md transition-shadow">
                    <CardHeader>
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
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
                        <div className="flex items-center gap-2">
                          <Clock className="w-4 h-4" />
                          <span className="lowercase">
                            {new Date(mindmap.created_at).toLocaleDateString()}
                          </span>
                        </div>
                        <span className="lowercase">
                          +{mindmap.xp_earned} xp
                        </span>
                      </div>
                      <div className="mt-2 text-xs text-muted-foreground lowercase">
                        {mindmap.content?.nodes?.length || 0} nodes
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
              
              {filteredMindmaps.length > 0 && (
                <div className="text-center mt-8">
                  <Button variant="outline" onClick={fetchMindmaps} className="lowercase">
                    refresh
                  </Button>
                </div>
              )}
            </>
          )}
        </div>
      </main>
    </div>
  );
};

export default History;