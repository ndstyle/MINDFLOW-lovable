import React, { useState } from 'react';
import { useLocation } from 'wouter';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Brain, Mic, MicOff, Loader2, Zap, BookOpen, Users } from 'lucide-react';
import { toast } from 'sonner';
import { useAuth } from '@/hooks/useAuth';
import { MindMapVisualization } from '@/components/MindMapVisualization';
import { AIChat } from '@/components/AIChat';
import { Header } from '@/components/Header';

export default function Create() {
  const { user, loading } = useAuth();
  const [, setLocation] = useLocation();
  const [input, setInput] = useState('');
  const [isListening, setIsListening] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);
  const [mindmap, setMindmap] = useState<any>(null);
  const [showChat, setShowChat] = useState(false);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  if (!user) {
    setLocation('/auth');
    return null;
  }

  const generateMindMap = async () => {
    if (!input.trim()) {
      toast.error('Please enter some content first');
      return;
    }

    setIsGenerating(true);
    try {
      const token = localStorage.getItem('mindflow_token');
      const response = await fetch('/api/generate-mindmap', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          input: input.trim(),
          category: 'Generated'
        })
      });

      if (!response.ok) {
        throw new Error('Failed to generate mind map');
      }

      const data = await response.json();
      setMindmap(data);
      setShowChat(true);
      toast.success('Mind map generated successfully!');
    } catch (error) {
      console.error('Error generating mind map:', error);
      toast.error('Failed to generate mind map');
    } finally {
      setIsGenerating(false);
    }
  };

  const handleGenerateQuiz = async () => {
    if (!mindmap) return;
    
    try {
      const token = localStorage.getItem('mindflow_token');
      const response = await fetch('/api/quizzes/generate', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ mindmapId: mindmap.id })
      });

      if (!response.ok) {
        throw new Error('Failed to generate quiz');
      }

      const quiz = await response.json();
      setLocation(`/quiz/${quiz.id}`);
      toast.success('Quiz generated! Redirecting...');
    } catch (error) {
      console.error('Error generating quiz:', error);
      toast.error('Failed to generate quiz');
    }
  };

  const handleGenerateFlashcards = async () => {
    if (!mindmap) return;
    
    try {
      const token = localStorage.getItem('mindflow_token');
      const response = await fetch('/api/flashcards/generate', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ mindmapId: mindmap.id })
      });

      if (!response.ok) {
        throw new Error('Failed to generate flashcards');
      }

      const flashcards = await response.json();
      setLocation(`/flashcards/${flashcards.id}`);
      toast.success('Flashcards generated! Redirecting...');
    } catch (error) {
      console.error('Error generating flashcards:', error);
      toast.error('Failed to generate flashcards');
    }
  };

  const handleShare = async () => {
    if (!mindmap) return;
    
    try {
      const token = localStorage.getItem('mindflow_token');
      const response = await fetch(`/api/mindmaps/${mindmap.id}/share`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ permissions: 'read', expiresInDays: 7 })
      });

      if (!response.ok) {
        throw new Error('Failed to create share link');
      }

      const data = await response.json();
      navigator.clipboard.writeText(data.shareUrl);
      toast.success('Share link copied to clipboard!');
    } catch (error) {
      console.error('Error sharing mindmap:', error);
      toast.error('Failed to create share link');
    }
  };

  const startListening = () => {
    if ('webkitSpeechRecognition' in window) {
      const recognition = new (window as any).webkitSpeechRecognition();
      recognition.continuous = true;
      recognition.interimResults = true;
      recognition.lang = 'en-US';

      recognition.onstart = () => setIsListening(true);
      recognition.onend = () => setIsListening(false);

      recognition.onresult = (event: any) => {
        let transcript = '';
        for (let i = 0; i < event.results.length; i++) {
          transcript += event.results[i][0].transcript;
        }
        setInput(transcript);
      };

      recognition.start();
    } else {
      toast.error('Speech recognition not supported in this browser');
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 to-blue-50 dark:from-gray-900 dark:to-purple-900">
      <Header />
      
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-4xl mx-auto">
          <div className="text-center mb-8">
            <h1 className="text-4xl font-bold bg-gradient-to-r from-purple-600 to-blue-600 bg-clip-text text-transparent mb-4">
              Create Your Mind Map
            </h1>
            <p className="text-gray-600 dark:text-gray-300">
              Transform your ideas into interactive, AI-powered visual learning experiences
            </p>
          </div>

          {!mindmap ? (
            <Card className="mb-8">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Brain className="h-5 w-5" />
                  Input Your Content
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <Textarea
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  placeholder="Enter your notes, lecture content, or any text you want to turn into a mind map..."
                  className="min-h-32"
                />
                
                <div className="flex items-center gap-2">
                  <Button
                    onClick={startListening}
                    variant="outline"
                    disabled={isListening}
                  >
                    {isListening ? (
                      <>
                        <MicOff className="h-4 w-4 mr-2" />
                        Listening...
                      </>
                    ) : (
                      <>
                        <Mic className="h-4 w-4 mr-2" />
                        Voice Input
                      </>
                    )}
                  </Button>
                  
                  <Button
                    onClick={generateMindMap}
                    disabled={isGenerating || !input.trim()}
                    className="bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700"
                  >
                    {isGenerating ? (
                      <>
                        <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                        Generating...
                      </>
                    ) : (
                      <>
                        <Zap className="h-4 w-4 mr-2" />
                        Generate Mind Map
                      </>
                    )}
                  </Button>
                </div>

                <div className="flex gap-2 flex-wrap">
                  <Badge variant="outline">AI-Powered</Badge>
                  <Badge variant="outline">Interactive</Badge>
                  <Badge variant="outline">Collaborative</Badge>
                </div>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center justify-between">
                    <span className="flex items-center gap-2">
                      <Brain className="h-5 w-5" />
                      {mindmap.title}
                    </span>
                    <div className="flex gap-2">
                      <Button onClick={handleGenerateQuiz} size="sm" variant="outline">
                        <BookOpen className="h-4 w-4 mr-1" />
                        Generate Quiz
                      </Button>
                      <Button onClick={handleGenerateFlashcards} size="sm" variant="outline">
                        <Zap className="h-4 w-4 mr-1" />
                        Create Flashcards
                      </Button>
                      <Button onClick={handleShare} size="sm" variant="outline">
                        <Users className="h-4 w-4 mr-1" />
                        Share
                      </Button>
                    </div>
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="h-96 border rounded-lg overflow-hidden">
                    <MindMapVisualization
                      nodes={mindmap.content?.nodes || []}
                      onNodesChange={(nodes) => 
                        setMindmap({...mindmap, content: {...mindmap.content, nodes}})
                      }
                      title={mindmap.title}
                      onGenerateQuiz={handleGenerateQuiz}
                      onGenerateFlashcards={handleGenerateFlashcards}
                      onShare={handleShare}
                    />
                  </div>
                </CardContent>
              </Card>

              {showChat && (
                <AIChat
                  mindmapId={mindmap.id}
                  mindmapNodes={mindmap.content?.nodes || []}
                  onMindmapUpdate={(nodes) => 
                    setMindmap({...mindmap, content: {...mindmap.content, nodes}})
                  }
                  onGenerateQuiz={handleGenerateQuiz}
                  onGenerateFlashcards={handleGenerateFlashcards}
                />
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}