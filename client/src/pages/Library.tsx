import { useState, useEffect } from 'react';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { FileText, Upload, Eye, Trash2, Share, Download } from 'lucide-react';
import { toast } from 'sonner';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';
import type { Document } from '../../../shared/schema';
import { useLocation } from 'wouter';

interface DocumentWithMetadata extends Document {
  node_count?: number;
}

export default function Library() {
  const [, setLocation] = useLocation();
  const queryClient = useQueryClient();

  // Fetch user's documents
  const { data: documents, isLoading } = useQuery({
    queryKey: ['/api/documents'],
    queryFn: async () => {
      const { data: { session }, error } = await supabase.auth.getSession();
      if (!session) throw new Error('Not authenticated');

      const response = await fetch('/api/documents', {
        headers: {
          'Authorization': `Bearer ${session.access_token}`
        }
      });
      
      if (!response.ok) throw new Error('Failed to fetch documents');
      const result = await response.json();
      return result.documents as DocumentWithMetadata[];
    }
  });

  const deleteMutation = useMutation({
    mutationFn: async (documentId: string) => {
      const { data: { session }, error } = await supabase.auth.getSession();
      if (!session) throw new Error('Not authenticated');

      const response = await fetch(`/api/documents/${documentId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${session.access_token}`
        }
      });

      if (!response.ok) throw new Error('Failed to delete document');
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/documents'] });
      toast.success('Document deleted successfully');
    },
    onError: () => {
      toast.error('Failed to delete document');
    }
  });

  const shareMutation = useMutation({
    mutationFn: async (documentId: string) => {
      const { data: { session }, error } = await supabase.auth.getSession();
      if (!session) throw new Error('Not authenticated');

      const response = await fetch(`/api/share/${documentId}`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${session.access_token}`,
          'Content-Type': 'application/json'
        }
      });

      if (!response.ok) throw new Error('Failed to create share link');
      return response.json();
    },
    onSuccess: (data) => {
      navigator.clipboard.writeText(data.shareUrl);
      toast.success('Share link copied to clipboard!');
    },
    onError: () => {
      toast.error('Failed to create share link');
    }
  });

  const exportMutation = useMutation({
    mutationFn: async ({ documentId, format }: { documentId: string; format: string }) => {
      const { data: { session }, error } = await supabase.auth.getSession();
      if (!session) throw new Error('Not authenticated');

      const response = await fetch(`/api/export/${documentId}`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${session.access_token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ format })
      });

      if (!response.ok) throw new Error('Failed to export document');
      
      if (format === 'markdown') {
        const blob = await response.blob();
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = 'mindmap.md';
        a.click();
        URL.revokeObjectURL(url);
      }
    },
    onSuccess: () => {
      toast.success('Document exported successfully!');
    },
    onError: () => {
      toast.error('Failed to export document');
    }
  });

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed': return 'bg-green-500';
      case 'processing': return 'bg-yellow-500';
      case 'failed': return 'bg-red-500';
      default: return 'bg-gray-500';
    }
  };

  const getTypeIcon = (type: string) => {
    return <FileText className="w-4 h-4" />;
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background">
        <div className="container mx-auto px-6 py-8">
          <div className="max-w-6xl mx-auto">
            <div className="space-y-4">
              <h1 className="text-3xl font-bold lowercase">your library</h1>
              <div className="text-center py-12">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
                <p className="text-muted-foreground mt-4">loading your documents...</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-6 py-8">
        <div className="max-w-6xl mx-auto space-y-8">
          {/* Header */}
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold lowercase">your library</h1>
              <p className="text-muted-foreground lowercase">
                manage your uploaded documents and mind maps
              </p>
            </div>
            <Button 
              onClick={() => setLocation('/upload')}
              className="lowercase"
            >
              <Upload className="w-4 h-4 mr-2" />
              upload document
            </Button>
          </div>

          {/* Documents Grid */}
          {documents && documents.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {documents.map((doc) => (
                <Card key={doc.id} className="hover:shadow-lg transition-shadow">
                  <CardHeader className="pb-4">
                    <div className="flex items-start justify-between">
                      <div className="flex items-center gap-2">
                        {getTypeIcon(doc.type)}
                        <CardTitle className="text-lg lowercase truncate">
                          {doc.title}
                        </CardTitle>
                      </div>
                      <Badge 
                        variant="secondary" 
                        className={`${getStatusColor(doc.status)} text-white lowercase`}
                      >
                        {doc.status}
                      </Badge>
                    </div>
                    <CardDescription className="lowercase">
                      {doc.type.toUpperCase()} • {new Date(doc.created_at).toLocaleDateString()}
                    </CardDescription>
                  </CardHeader>
                  
                  <CardContent className="pt-0">
                    <div className="flex items-center justify-between gap-2">
                      <div className="flex items-center gap-2">
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => setLocation(`/document/${doc.id}`)}
                          disabled={doc.status !== 'completed'}
                          className="lowercase"
                        >
                          <Eye className="w-4 h-4 mr-1" />
                          view
                        </Button>
                        
                        {doc.status === 'completed' && (
                          <>
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => shareMutation.mutate(doc.id)}
                              disabled={shareMutation.isPending}
                              className="lowercase"
                            >
                              <Share className="w-4 h-4" />
                            </Button>
                            
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => exportMutation.mutate({ documentId: doc.id, format: 'markdown' })}
                              disabled={exportMutation.isPending}
                              className="lowercase"
                            >
                              <Download className="w-4 h-4" />
                            </Button>
                          </>
                        )}
                      </div>
                      
                      <Button
                        size="sm"
                        variant="destructive"
                        onClick={() => deleteMutation.mutate(doc.id)}
                        disabled={deleteMutation.isPending}
                        className="lowercase"
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : (
            <div className="text-center py-12">
              <FileText className="w-16 h-16 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-xl font-semibold mb-2 lowercase">no documents yet</h3>
              <p className="text-muted-foreground mb-6 lowercase">
                upload your first document to create a mind map
              </p>
              <Button onClick={() => setLocation('/upload')} className="lowercase">
                <Upload className="w-4 h-4 mr-2" />
                upload document
              </Button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}