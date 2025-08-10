import { useState } from "react";
import { useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { MindMapVisualization } from "@/components/MindMapVisualization";
import { Header } from "@/components/Header";
import { Brain, Sparkles, ChevronRight, Mic, MicOff } from "lucide-react";

export default function Index() {
  const [, setLocation] = useLocation();
  const [input, setInput] = useState("");
  const [mindMap, setMindMap] = useState(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [isListening, setIsListening] = useState(false);

  const handleGenerateMindMap = async () => {
    if (!input.trim()) return;
    
    setIsGenerating(true);
    try {
      const response = await fetch('/api/generate-mindmap', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          input: input.trim(),
          category: 'General'
        })
      });
      
      if (response.ok) {
        const data = await response.json();
        setMindMap(data);
      }
    } catch (error) {
      console.error('Error generating mind map:', error);
    } finally {
      setIsGenerating(false);
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
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 via-white to-blue-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900">
      <Header />
      
      <main className="container mx-auto px-4 py-8">
        {!mindMap ? (
          <div className="max-w-4xl mx-auto">
            {/* Hero Section */}
            <div className="text-center mb-12">
              <div className="flex items-center justify-center mb-6">
                <div className="p-3 bg-gradient-to-r from-purple-500 to-blue-500 rounded-full">
                  <Brain className="h-8 w-8 text-white" />
                </div>
              </div>
              
              <h1 className="text-4xl md:text-6xl font-bold bg-gradient-to-r from-purple-600 to-blue-600 bg-clip-text text-transparent mb-4">
                Transform Ideas into Mind Maps
              </h1>
              
              <p className="text-xl text-gray-600 dark:text-gray-300 mb-8 max-w-2xl mx-auto">
                Turn your notes, thoughts, or any text into beautiful, interactive mind maps using AI. 
                Perfect for studying, brainstorming, and visual learning.
              </p>
            </div>

            {/* Input Section */}
            <Card className="mb-12">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Sparkles className="h-5 w-5" />
                  Create Your Mind Map
                </CardTitle>
                <CardDescription>
                  Enter your text below or use voice input to generate an interactive mind map
                </CardDescription>
              </CardHeader>
              
              <CardContent className="space-y-4">
                <Textarea
                  placeholder="Enter your notes, lecture content, or any text you want to visualize..."
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  className="min-h-32"
                />
                
                <div className="flex gap-2">
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
                    onClick={handleGenerateMindMap}
                    disabled={!input.trim() || isGenerating}
                    className="bg-gradient-to-r from-purple-500 to-blue-500 hover:from-purple-600 hover:to-blue-600"
                  >
                    {isGenerating ? (
                      "Generating..."
                    ) : (
                      <>
                        Generate Mind Map
                        <ChevronRight className="h-4 w-4 ml-2" />
                      </>
                    )}
                  </Button>
                </div>
              </CardContent>
            </Card>

            {/* Features Grid */}
            <div className="grid md:grid-cols-3 gap-6 mb-12">
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">🧠 AI-Powered</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-gray-600 dark:text-gray-300">
                    Advanced AI analyzes your content and creates meaningful connections
                  </p>
                </CardContent>
              </Card>
              
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">🎨 Interactive</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-gray-600 dark:text-gray-300">
                    Drag, zoom, and explore your mind maps with smooth animations
                  </p>
                </CardContent>
              </Card>
              
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">🚀 Fast & Easy</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-gray-600 dark:text-gray-300">
                    Generate beautiful mind maps in seconds from any text input
                  </p>
                </CardContent>
              </Card>
            </div>

            {/* CTA Section */}
            <div className="text-center">
              <Button
                onClick={() => setLocation('/auth')}
                size="lg"
                className="bg-gradient-to-r from-purple-500 to-blue-500 hover:from-purple-600 hover:to-blue-600"
              >
                Get Started Free
                <ChevronRight className="h-4 w-4 ml-2" />
              </Button>
            </div>
          </div>
        ) : (
          <div className="max-w-6xl mx-auto">
            <div className="mb-6">
              <h2 className="text-2xl font-bold mb-2">{mindMap.title}</h2>
              <p className="text-gray-600 dark:text-gray-300">
                Your generated mind map - explore the connections and relationships
              </p>
            </div>
            
            <Card>
              <CardContent className="p-6">
                <div className="h-96 w-full">
                  <MindMapVisualization
                    nodes={mindMap.content?.nodes || []}
                    onNodesChange={() => {}}
                    title={mindMap.title}
                  />
                </div>
              </CardContent>
            </Card>
            
            <div className="mt-6 text-center">
              <Button
                onClick={() => setLocation('/auth')}
                className="bg-gradient-to-r from-purple-500 to-blue-500 hover:from-purple-600 hover:to-blue-600"
              >
                Sign up to save and edit your mind maps
              </Button>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}