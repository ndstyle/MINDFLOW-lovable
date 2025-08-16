import { useEffect, useState } from 'react';
import { useLocation, useParams, useRoute } from 'wouter';
import { useAuth } from '@/hooks/useAuth';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { 
  ArrowLeft, 
  Share2, 
  Download, 
  Trash2, 
  Loader2, 
  AlertTriangle 
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { default as Header } from '@/components/Header';
import { MindMapVisualization } from '@/components/MindMapVisualization';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { supabase } from '@/lib/supabase';
import { Mindmap } from 'shared/schema';

export default function MindMapView() {
  const { user, loading: authLoading } = useAuth();
  const [, setLocation] = useLocation();
  const [, params] = useRoute('/mindmap/:id');
  const { toast } = useToast();
  const [mindMapData, setMindMapData] = useState<Mindmap | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isDeleting, setIsDeleting] = useState(false);

  const mindMapId = params?.id;

  useEffect(() => {
    if (!authLoading && !user) {
      console.log('MindMapView: No user, redirecting to auth');
      setLocation('/auth');
      return;
    }

    if (user && mindMapId) {
      fetchMindMap();
    }
  }, [user, authLoading, mindMapId, setLocation]);

  const fetchMindMap = async () => {
    if (!mindMapId) {
      setLocation('/dashboard');
      return;
    }

    try {
      const { data: { session }, error: sessionError } = await supabase.auth.getSession();
      if (sessionError || !session) {
        console.error('Session error:', sessionError);
        setLocation('/auth');
        return;
      }

      const response = await fetch(`/api/mindmaps/${mindMapId}`, {
        headers: {
          'Authorization': `Bearer ${session.access_token}`
        }
      });

      if (!response.ok) {
        if (response.status === 404) {
          toast({
            title: "Mindmap not found",
            description: "The mindmap you're looking for doesn't exist or has been deleted.",
            variant: "destructive"
          });
          setLocation('/dashboard');
          return;
        }
        throw new Error('Failed to fetch mindmap');
      }

      const data = await response.json();
      setMindMapData(data);
    } catch (error) {
      console.error('Error fetching mindmap:', error);
      toast({
        title: "Failed to load mindmap",
        description: "Please try refreshing the page.",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleDelete = async () => {
    if (!mindMapId) return;
    
    setIsDeleting(true);
    try {
      const { data: { session }, error: sessionError } = await supabase.auth.getSession();
      if (sessionError || !session) {
        console.error('Session error:', sessionError);
        return;
      }

      const response = await fetch(`/api/mindmaps/${mindMapId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${session.access_token}`
        }
      });

      if (!response.ok) {
        throw new Error('Failed to delete mindmap');
      }

      toast({
        title: "Mindmap deleted",
        description: "Your mindmap has been successfully deleted."
      });

      // Redirect to dashboard
      setLocation('/dashboard');
    } catch (error) {
      console.error('Error deleting mindmap:', error);
      toast({
        title: "Delete failed",
        description: "Could not delete mindmap. Please try again.",
        variant: "destructive"
      });
    } finally {
      setIsDeleting(false);
    }
  };

  const handleShare = async () => {
    if (!mindMapData) return;

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
    if (!mindMapData) return;

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

  if (authLoading || isLoading) {
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
          <div className="w-24 h-24 bg-muted rounded-full flex items-center justify-center mx-auto mb-6">
            <AlertTriangle className="w-12 h-12 text-muted-foreground" />
          </div>
          <h3 className="text-xl font-semibold mb-2">Mind map not found</h3>
          <p className="text-muted-foreground mb-6">
            The mind map you're looking for doesn't exist or has been deleted.
          </p>
          <Button onClick={() => setLocation('/dashboard')}>
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Dashboard
          </Button>
        </div>
      </div>
    );
  }

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
                <h1 className="text-4xl font-bold bg-gradient-to-r from-primary to-primary/60 bg-clip-text text-transparent mb-2 lowercase">
                  {mindMapData.title}
                </h1>
                {mindMapData.intent && (
                  <p className="text-muted-foreground">
                    Category: {mindMapData.intent}
                  </p>
                )}
                <p className="text-sm text-muted-foreground">
                  Created: {new Date(mindMapData.created_at).toLocaleDateString()}
                </p>
              </div>

              <div className="flex items-center gap-2">
                {/* Delete Button with Confirmation Dialog */}
                <AlertDialog>
                  <AlertDialogTrigger asChild>
                    <Button 
                      variant="outline" 
                      size="sm"
                      className="text-destructive hover:text-destructive border-destructive/20 hover:border-destructive/40 hover:bg-destructive/5"
                      disabled={isDeleting}
                    >
                      {isDeleting ? (
                        <Loader2 className="w-4 h-4 animate-spin" />
                      ) : (
                        <Trash2 className="w-4 h-4" />
                      )}
                    </Button>
                  </AlertDialogTrigger>
                  <AlertDialogContent>
                    <AlertDialogHeader>
                      <AlertDialogTitle>Delete Mind Map</AlertDialogTitle>
                      <AlertDialogDescription>
                        Are you sure you want to delete "{mindMapData.title}"? This action cannot be undone.
                      </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                      <AlertDialogCancel>Cancel</AlertDialogCancel>
                      <AlertDialogAction
                        onClick={handleDelete}
                        className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                        disabled={isDeleting}
                      >
                        {isDeleting ? (
                          <>
                            <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                            Deleting...
                          </>
                        ) : (
                          <>
                            <Trash2 className="w-4 h-4 mr-2" />
                            Delete
                          </>
                        )}
                      </AlertDialogAction>
                    </AlertDialogFooter>
                  </AlertDialogContent>
                </AlertDialog>

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