import { useEffect, useState } from 'react';
import { useLocation, useParams } from 'wouter';
import { useAuth } from '@/hooks/useAuth';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { ArrowLeft, Share2, Download, Edit3 } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { default as Header } from '@/components/Header';
import { MindMapVisualization } from '@/components/MindMapVisualization';

interface MindMapData {
  title: string;
  content: any;
  intent?: string;
  created_at?: string;
}

export default function View() {
  const { user, loading } = useAuth();
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const [mindMapData, setMindMapData] = useState<MindMapData | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Get mind map data from sessionStorage or location state
  useEffect(() => {
    if (!loading && !user) {
      setLocation('/auth');
      return;
    }

    // First check sessionStorage for current mindmap
    const storedMindmap = sessionStorage.getItem('currentMindmap');
    if (storedMindmap) {
      try {
        const parsedMindmap = JSON.parse(storedMindmap);
        console.log('Loaded mindmap from storage:', parsedMindmap);
        setMindMapData(parsedMindmap);
        setIsLoading(false);
        return;
      } catch (error) {
        console.error('Error parsing stored mindmap:', error);
      }
    }

    // Fallback: check if data was passed via navigation state
    const state = history.state?.state;
    if (state?.newMindmap) {
      setMindMapData(state.newMindmap);
      setIsLoading(false);
    } else {
      // If no data available, redirect back to create page
      setLocation('/create');
    }
  }, [user, loading, setLocation]);

  if (loading || isLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Loading mind map...</p>
        </div>
      </div>
    );
  }

  if (!mindMapData) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <p className="text-muted-foreground mb-4">No mind map data available</p>
          <Button onClick={() => setLocation('/create')}>
            Create New Mind Map
          </Button>
        </div>
      </div>
    );
  }

  const handleShare = async () => {
    try {
      if (navigator.share) {
        await navigator.share({
          title: mindMapData.title,
          text: 'Check out my mind map!',
          url: window.location.href,
        });
      } else {
        await navigator.clipboard.writeText(window.location.href);
        toast({
          title: "Link copied!",
          description: "Mind map link has been copied to clipboard.",
        });
      }
    } catch (error) {
      console.error('Error sharing:', error);
      toast({
        title: "Share failed",
        description: "Could not share mind map. Please try again.",
        variant: "destructive"
      });
    }
  };

  const handleDownload = () => {
    const dataStr = JSON.stringify(mindMapData.content, null, 2);
    const dataBlob = new Blob([dataStr], { type: 'application/json' });
    const url = URL.createObjectURL(dataBlob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `${mindMapData.title.replace(/[^a-z0-9]/gi, '_')}_mindmap.json`;
    link.click();
    URL.revokeObjectURL(url);
    
    toast({
      title: "Download started",
      description: "Mind map data is being downloaded.",
    });
  };

  return (
    <div className="min-h-screen bg-background">
      <Header />

      <main className="container mx-auto px-4 py-8">
        <div className="max-w-6xl mx-auto">
          <div className="mb-6">
            <Button
              variant="ghost"
              onClick={() => setLocation('/dashboard')}
              className="mb-4"
            >
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back to Dashboard
            </Button>

            <div className="flex items-center justify-between mb-4">
              <div>
                <h1 className="text-4xl font-bold bg-gradient-to-r from-primary to-primary/60 bg-clip-text text-transparent mb-2">
                  {mindMapData.title}
                </h1>
                {mindMapData.intent && (
                  <p className="text-muted-foreground">
                    Category: {mindMapData.intent}
                  </p>
                )}
                {mindMapData.created_at && (
                  <p className="text-sm text-muted-foreground">
                    Created: {new Date(mindMapData.created_at).toLocaleDateString()}
                  </p>
                )}
              </div>

              <div className="flex items-center gap-2">
                <Button variant="outline" onClick={handleShare}>
                  <Share2 className="w-4 h-4 mr-2" />
                  Share
                </Button>
                <Button variant="outline" onClick={handleDownload}>
                  <Download className="w-4 h-4 mr-2" />
                  Export JSON
                </Button>
              </div>
            </div>

            {/* Mind Map Visualization */}
            <MindMapVisualization 
              nodes={mindMapData.content.nodes || []}
              title={mindMapData.title}
            />
          </div>
        </div>
      </main>
    </div>
  );
}