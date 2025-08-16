import { useState } from 'react';
import { useLocation } from 'wouter';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { ArrowLeft, Brain, Share } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { toast } from '@/hooks/use-toast';
import { MindMapCanvas } from '@/components/MindMapCanvas';
import { QuizPlayer } from '@/components/QuizPlayer';
import { ExportMindMap } from '@/components/ExportMindMap';

type Document = {
  id: string;
  title: string;
  type: string;
  status: 'processing' | 'completed' | 'failed';
  created_at: string;
  content?: {
    text?: string;
    originalText?: string;
  };
};

type Node = {
  id: string;
  document_id: string;
  title: string;
  summary: string;
  level: number;
  position_x: number;
  position_y: number;
  parent_id: string | null;
  metadata?: any;
};

type Question = {
  id: string;
  question: string;
  options: string[];
  correct_answer: number;
  explanation: string;
};

export default function Document() {
  const [, setLocation] = useLocation();
  const [selectedNode, setSelectedNode] = useState<Node | null>(null);
  const [showQuiz, setShowQuiz] = useState(false);
  const queryClient = useQueryClient();

  // Get document ID from URL
  const documentId = window.location.pathname.split('/').pop();

  // Fetch document data
  const { data: document, isLoading: documentLoading } = useQuery({
    queryKey: ['/api/documents', documentId],
    enabled: !!documentId,
  });

  // Fetch mind map nodes
  const { data: nodes = [] } = useQuery({
    queryKey: ['/api/nodes', documentId],
    enabled: !!documentId && document?.status === 'completed',
  });

  // Fetch questions for selected node
  const { data: questions } = useQuery({
    queryKey: ['/api/questions', selectedNode?.id],
    enabled: !!selectedNode?.id && showQuiz,
  });

  // Generate questions mutation
  const generateQuestionsMutation = useMutation({
    mutationFn: async (nodeId: string) => {
      const response = await fetch(`/api/questions/${nodeId}`, {
        method: 'POST',
      });
      if (!response.ok) throw new Error('Failed to generate questions');
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/questions', selectedNode?.id] });
    },
    onError: () => {
      toast({
        title: 'Error',
        description: 'Failed to generate questions',
        variant: 'destructive',
      });
    },
  });

  // Share mutation
  const shareMutation = useMutation({
    mutationFn: async () => {
      const response = await fetch(`/api/share/${documentId}`, {
        method: 'POST',
      });
      if (!response.ok) throw new Error('Failed to create share link');
      return response.json();
    },
    onSuccess: (data) => {
      navigator.clipboard.writeText(data.shareUrl);
      toast({
        title: 'Success',
        description: 'Share link copied to clipboard!',
      });
    },
    onError: () => {
      toast({
        title: 'Error',
        description: 'Failed to create share link',
        variant: 'destructive',
      });
    },
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

  const handleQuizComplete = () => {
    setShowQuiz(false);
  };

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
                <ExportMindMap 
                  documentId={documentId || ''} 
                  documentTitle={document.title} 
                  mindMapData={nodes} 
                />
              </div>
            )}
          </div>

          {/* Main Content */}
          {document.status === 'completed' && nodes.length > 0 ? (
            <Tabs defaultValue="mindmap" className="w-full">
              <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger value="mindmap" className="lowercase">mind map</TabsTrigger>
                <TabsTrigger value="content" className="lowercase">original content</TabsTrigger>
              </TabsList>

              <TabsContent value="mindmap" className="mt-6">
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                  {/* Mind Map Canvas */}
                  <div className="lg:col-span-2">
                    <Card>
                      <CardHeader>
                        <CardTitle className="lowercase">interactive mind map</CardTitle>
                        <CardDescription className="lowercase">
                          click on nodes to explore details and generate quizzes
                        </CardDescription>
                      </CardHeader>
                      <CardContent>
                        <MindMapCanvas 
                          nodes={nodes} 
                          onNodeClick={handleNodeClick}
                          selectedNode={selectedNode}
                        />
                      </CardContent>
                    </Card>
                  </div>

                  {/* Side Panel */}
                  <div className="space-y-6">
                    {/* Node Details */}
                    {selectedNode && (
                      <Card>
                        <CardHeader>
                          <CardTitle className="lowercase">node details</CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-4">
                          <div>
                            <h3 className="font-semibold lowercase">{selectedNode.title}</h3>
                            <p className="text-sm text-muted-foreground mt-2">
                              {selectedNode.summary}
                            </p>
                          </div>
                          
                          {selectedNode.metadata?.evidence && (
                            <div>
                              <h4 className="font-medium text-sm lowercase mb-2">supporting evidence</h4>
                              <p className="text-xs text-muted-foreground bg-muted p-3 rounded">
                                {selectedNode.metadata.evidence}
                              </p>
                            </div>
                          )}

                          <Button 
                            onClick={handleStartQuiz}
                            className="w-full lowercase"
                            disabled={generateQuestionsMutation.isPending}
                          >
                            <Brain className="w-4 h-4 mr-2" />
                            {generateQuestionsMutation.isPending ? 'generating...' : 'start quiz'}
                          </Button>
                        </CardContent>
                      </Card>
                    )}

                    {/* Quiz Section */}
                    {showQuiz && questions && questions.length > 0 && (
                      <Card>
                        <CardHeader>
                          <CardTitle className="lowercase">quiz</CardTitle>
                          <CardDescription className="lowercase">
                            test your understanding of this concept
                          </CardDescription>
                        </CardHeader>
                        <CardContent>
                          <QuizPlayer 
                            questions={questions}
                            onComplete={handleQuizComplete}
                          />
                        </CardContent>
                      </Card>
                    )}
                  </div>
                </div>
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