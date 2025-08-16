import { useState, useEffect } from 'react';
import { useParams } from 'wouter';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Eye, Brain, HelpCircle, Share, Download, ArrowLeft } from 'lucide-react';
import { toast } from 'sonner';
import { useQuery, useMutation } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';
import { useLocation } from 'wouter';
import { MindMapCanvas } from '@/components/MindMapCanvas';
import { QuizPlayer } from '@/components/QuizPlayer';
import { ExportMindMap } from '@/components/ExportMindMap';

export default function DocumentView() {
  const params = useParams();
  const documentId = params.id;
  const [, setLocation] = useLocation();
  const [selectedNode, setSelectedNode] = useState<any>(null);
  const [showQuiz, setShowQuiz] = useState(false);

  // Fetch document details
  const { data: document, isLoading: documentLoading } = useQuery({
    queryKey: ['/api/documents', documentId],
    queryFn: async () => {
      const { data: { session }, error } = await supabase.auth.getSession();
      if (!session) throw new Error('Not authenticated');

      const response = await fetch(`/api/documents/${documentId}`, {
        headers: {
          'Authorization': `Bearer ${session.access_token}`
        }
      });
      
      if (!response.ok) throw new Error('Failed to fetch document');
      return response.json();
    },
    enabled: !!documentId
  });

  // Fetch mind map nodes
  const { data: mindMapData, isLoading: mindMapLoading } = useQuery({
    queryKey: ['/api/documents', documentId, 'nodes'],
    queryFn: async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) throw new Error('Not authenticated');

      const response = await fetch(`/api/documents/${documentId}/nodes`, {
        headers: {
          'Authorization': `Bearer ${session.access_token}`
        }
      });
      
      if (!response.ok) throw new Error('Failed to fetch mind map nodes');
      return response.json();
    },
    enabled: !!documentId && document?.status === 'completed'
  });

  // Fetch quiz questions for the document
  const { data: quizData } = useQuery({
    queryKey: ['/api/documents', documentId, 'quiz'],
    queryFn: async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) throw new Error('Not authenticated');

      const response = await fetch(`/api/documents/${documentId}/quiz`, {
        headers: {
          'Authorization': `Bearer ${session.access_token}`
        }
      });
      
      if (!response.ok) throw new Error('Failed to fetch quiz');
      return response.json();
    },
    enabled: !!documentId && document?.status === 'completed'
  });

  const nodes = mindMapData?.nodes || [];
  const questions = quizData?.questions || [];

  if (documentLoading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <Card>
          <CardContent className="text-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
            <p className="text-muted-foreground lowercase">loading document...</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (!document) {
    return (
      <div className="container mx-auto px-4 py-8">
        <Card>
          <CardContent className="text-center py-8">
            <h3 className="text-lg font-semibold mb-2 lowercase">document not found</h3>
            <Button onClick={() => setLocation('/library')} variant="outline" className="lowercase">
              <ArrowLeft className="w-4 h-4 mr-2" />
              back to library
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-4">
          <Button 
            onClick={() => setLocation('/library')} 
            variant="ghost" 
            size="sm"
            className="lowercase"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            back to library
          </Button>
          <div>
            <h1 className="text-2xl font-bold lowercase">{document.title}</h1>
            <div className="flex items-center gap-2 mt-1">
              <Badge variant={document.status === 'completed' ? 'default' : 'secondary'}>
                {document.status}
              </Badge>
              <span className="text-sm text-muted-foreground">
                {document.type?.toUpperCase()} • {new Date(document.created_at).toLocaleDateString()}
              </span>
            </div>
          </div>
        </div>
        
        {document.status === 'completed' && nodes.length > 0 && (
          <ExportMindMap 
            nodes={nodes}
            documentTitle={document.title}
            documentId={documentId}
          />
        )}
      </div>

      {document.status === 'processing' && (
        <Card className="mb-6">
          <CardContent className="text-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
            <h3 className="text-lg font-semibold mb-2 lowercase">processing document</h3>
            <p className="text-muted-foreground lowercase">
              we're analyzing your document and generating the mind map and quiz. this usually takes 1-2 minutes.
            </p>
          </CardContent>
        </Card>
      )}

      {document.status === 'failed' && (
        <Card className="mb-6">
          <CardContent className="text-center py-8">
            <h3 className="text-lg font-semibold mb-2 text-red-600 lowercase">processing failed</h3>
            <p className="text-muted-foreground lowercase">
              we couldn't process this document. please try uploading it again.
            </p>
            <Button onClick={() => setLocation('/upload')} className="mt-4 lowercase">
              upload new document
            </Button>
          </CardContent>
        </Card>
      )}

      {document.status === 'completed' && (
        <Tabs defaultValue="mindmap" className="w-full">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="mindmap" className="lowercase">
              <Brain className="w-4 h-4 mr-2" />
              mind map
            </TabsTrigger>
            <TabsTrigger value="quiz" className="lowercase">
              <HelpCircle className="w-4 h-4 mr-2" />
              quiz ({questions.length})
            </TabsTrigger>
            <TabsTrigger value="content" className="lowercase">
              <Eye className="w-4 h-4 mr-2" />
              content
            </TabsTrigger>
          </TabsList>

          <TabsContent value="mindmap" className="mt-6">
            {mindMapLoading ? (
              <Card>
                <CardContent className="text-center py-8">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
                  <p className="text-muted-foreground lowercase">loading mind map...</p>
                </CardContent>
              </Card>
            ) : nodes.length > 0 ? (
              <MindMapCanvas nodes={nodes} />
            ) : (
              <Card>
                <CardContent className="text-center py-8">
                  <Brain className="w-16 h-16 text-muted-foreground mx-auto mb-4" />
                  <h3 className="text-lg font-semibold mb-2 lowercase">mind map not available</h3>
                  <p className="text-muted-foreground lowercase">
                    the mind map is still being generated
                  </p>
                </CardContent>
              </Card>
            )}
          </TabsContent>

          <TabsContent value="quiz" className="mt-6">
            <QuizPlayer 
              questions={questions} 
              documentId={documentId} 
            />
          </TabsContent>

          <TabsContent value="content" className="mt-6">
            <Card>
              <CardHeader>
                <CardTitle className="lowercase">original content</CardTitle>
                <CardDescription className="lowercase">
                  the original text extracted from your document
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="prose prose-sm max-w-none">
                  <pre className="whitespace-pre-wrap font-sans text-sm leading-relaxed">
                    {document.content?.originalText || document.content?.text || 'No content available'}
                  </pre>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      )}
    </div>
  );
}
        headers: {
          'Authorization': `Bearer ${session.access_token}`,
          'Content-Type': 'application/json'
        }
      });

      if (!response.ok) throw new Error('Failed to generate questions');
      return response.json();
    },
    onSuccess: () => {
      toast.success('Questions generated successfully!');
    },
    onError: () => {
      toast.error('Failed to generate questions');
    }
  });

  const exportMutation = useMutation({
    mutationFn: async (format: string) => {
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

      if (!response.ok) throw new Error('Failed to export');
      
      if (format === 'markdown') {
        const blob = await response.blob();
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `${document?.title || 'mindmap'}.md`;
        a.click();
        URL.revokeObjectURL(url);
      }
    },
    onSuccess: () => {
      toast.success('Export completed!');
    },
    onError: () => {
      toast.error('Failed to export');
    }
  });

  const shareMutation = useMutation({
    mutationFn: async () => {
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

  const handleNodeClick = (node: Node) => {
    setSelectedNode(node);
    setShowQuiz(false);
  };

  const handleStartQuiz = () => {
    if (!questions || questions.length === 0) {
      generateQuestionsMutation.mutate(selectedNode!.id);
    }
    setShowQuiz(true);
  };

  if (!documentId) {
    return <div>Document not found</div>;
  }

  if (documentLoading) {
    return (
      <div className="min-h-screen bg-background">
        <div className="container mx-auto px-6 py-8">
          <div className="text-center py-12">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
            <p className="text-muted-foreground mt-4">loading document...</p>
          </div>
        </div>
      </div>
    );
  }

  if (!document) {
    return (
      <div className="min-h-screen bg-background">
        <div className="container mx-auto px-6 py-8">
          <div className="text-center py-12">
            <p className="text-muted-foreground">document not found</p>
            <Button onClick={() => setLocation('/library')} className="mt-4 lowercase">
              back to library
            </Button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-6 py-8">
        <div className="max-w-7xl mx-auto space-y-6">
          {/* Header */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Button 
                variant="ghost" 
                size="sm" 
                onClick={() => setLocation('/library')}
                className="lowercase"
              >
                <ArrowLeft className="w-4 h-4 mr-2" />
                back to library
              </Button>
              <div>
                <h1 className="text-2xl font-bold lowercase">{document.title}</h1>
                <div className="flex items-center gap-2 mt-1">
                  <Badge variant="secondary" className="lowercase">
                    {document.type.toUpperCase()}
                  </Badge>
                  <Badge 
                    variant={document.status === 'completed' ? 'default' : 'secondary'}
                    className="lowercase"
                  >
                    {document.status}
                  </Badge>
                </div>
              </div>
            </div>
            
            {document.status === 'completed' && (
              <div className="flex items-center gap-2">
                <Button 
                  variant="outline" 
                  size="sm"
                  onClick={() => shareMutation.mutate()}
                  disabled={shareMutation.isPending}
                  className="lowercase"
                >
                  <Share className="w-4 h-4 mr-2" />
                  share
                </Button>
                <Button 
                  variant="outline" 
                  size="sm"
                  onClick={() => exportMutation.mutate('markdown')}
                  disabled={exportMutation.isPending}
                  className="lowercase"
                >
                  <Download className="w-4 h-4 mr-2" />
                  export
                </Button>
              </div>
            )}
          </div>

          {/* Main Content */}
          {document.status === 'completed' ? (
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* Mind Map */}
              <div className="lg:col-span-2">
                <Card>
                  <CardHeader>
                    <CardTitle className="lowercase">mind map</CardTitle>
                    <CardDescription className="lowercase">
                      click on nodes to explore and generate quizzes
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    {mindMapLoading ? (
                      <div className="flex items-center justify-center h-96">
                        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
                      </div>
                    ) : (
                      <MindMapCanvas 
                        nodes={mindMapData?.nodes || []}
                        onNodeClick={handleNodeClick}
                        selectedNode={selectedNode}
                      />
                    )}
                  </CardContent>
                </Card>
              </div>

              {/* Sidebar */}
              <div className="space-y-6">
                {/* Node Details */}
                {selectedNode && (
                  <Card>
                    <CardHeader>
                      <CardTitle className="lowercase">{selectedNode.title}</CardTitle>
                      <CardDescription className="lowercase">
                        level {selectedNode.level} • {
                          selectedNode.level === 0 ? 'topic' :
                          selectedNode.level === 1 ? 'concept' : 'detail'
                        }
                      </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      {selectedNode.summary && (
                        <p className="text-sm text-muted-foreground">
                          {selectedNode.summary}
                        </p>
                      )}
                      
                      <div className="flex gap-2">
                        <Button 
                          size="sm" 
                          onClick={handleStartQuiz}
                          disabled={generateQuestionsMutation.isPending}
                          className="lowercase"
                        >
                          <HelpCircle className="w-4 h-4 mr-2" />
                          {questions && questions.length > 0 ? 'start quiz' : 'generate quiz'}
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                )}

                {/* Quiz Player */}
                {showQuiz && selectedNode && questions && questions.length > 0 && (
                  <Card>
                    <CardHeader>
                      <CardTitle className="lowercase">quiz: {selectedNode.title}</CardTitle>
                      <CardDescription className="lowercase">
                        test your knowledge
                      </CardDescription>
                    </CardHeader>
                    <CardContent>
                      <QuizPlayer 
                        questions={questions}
                        onComplete={() => setShowQuiz(false)}
                      />
                    </CardContent>
                  </Card>
                )}
              </div>
            </div>
          ) : (
            <Card>
              <CardContent className="flex items-center justify-center py-12">
                <div className="text-center">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
                  <p className="text-muted-foreground lowercase">
                    {document.status === 'processing' ? 'processing document...' : 'processing failed'}
                  </p>
                  {document.status === 'failed' && (
                    <Button 
                      onClick={() => setLocation('/library')} 
                      className="mt-4 lowercase"
                    >
                      back to library
                    </Button>
                  )}
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}