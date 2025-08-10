import { useState } from 'react';
import { useLocation } from 'wouter';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Loader2, ArrowLeft } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { Header } from '@/components/Header';

export default function Create() {
  const [, setLocation] = useLocation();
  const [text, setText] = useState('');
  const [intent, setIntent] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);
  const { toast } = useToast();

  const handleGenerate = async () => {
    if (!text.trim()) {
      toast({
        title: "Input required",
        description: "Please enter some text to generate a mind map.",
        variant: "destructive"
      });
      return;
    }

    if (!intent) {
      toast({
        title: "Intent required", 
        description: "Please select what you want to do with this mind map.",
        variant: "destructive"
      });
      return;
    }

    setIsGenerating(true);

    try {
      const response = await fetch('/api/generate-mindmap', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          text: text.trim(),
          category: intent
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to generate mind map');
      }

      const mindmapData = await response.json();
      
      // Navigate to dashboard with the generated mind map
      setLocation('/dashboard', { 
        state: { 
          newMindmap: {
            title: text.substring(0, 50) + (text.length > 50 ? '...' : ''),
            content: mindmapData,
            intent
          }
        }
      });

      toast({
        title: "Mind map created!",
        description: "Your mind map has been generated successfully."
      });

    } catch (error) {
      console.error('Error generating mind map:', error);
      toast({
        title: "Generation failed",
        description: "Failed to generate mind map. Please try again.",
        variant: "destructive"
      });
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <Header />
      
      <main className="container mx-auto px-4 py-8">
        <div className="max-w-4xl mx-auto">
          <div className="mb-6">
            <Button 
              variant="ghost" 
              onClick={() => setLocation('/')}
              className="mb-4"
            >
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back to Home
            </Button>
            
            <h1 className="text-4xl font-bold bg-gradient-to-r from-primary to-primary/60 bg-clip-text text-transparent mb-2">
              Create Mind Map
            </h1>
            <p className="text-xl text-muted-foreground">
              Transform your ideas into visual mind maps with AI
            </p>
          </div>

          <Card>
            <CardHeader>
              <CardTitle>Generate Your Mind Map</CardTitle>
              <CardDescription>
                Enter your text or ideas below, and our AI will create a structured mind map for you.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-2">
                <label htmlFor="intent" className="text-sm font-medium">
                  What do you want to do with this mind map?
                </label>
                <Select value={intent} onValueChange={setIntent}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select your purpose..." />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="study">Study & Learn</SelectItem>
                    <SelectItem value="teach">Teach Others</SelectItem>
                    <SelectItem value="project">Plan a Project</SelectItem>
                    <SelectItem value="brainstorm">Brainstorm Ideas</SelectItem>
                    <SelectItem value="presentation">Create Presentation</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <label htmlFor="text" className="text-sm font-medium">
                  Your Ideas or Text
                </label>
                <Textarea
                  id="text"
                  placeholder="Enter your ideas, notes, or any text you want to transform into a mind map..."
                  value={text}
                  onChange={(e) => setText(e.target.value)}
                  className="min-h-[200px] resize-none"
                />
              </div>

              <Button 
                onClick={handleGenerate}
                disabled={isGenerating}
                className="w-full"
                size="lg"
              >
                {isGenerating ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Generating Mind Map...
                  </>
                ) : (
                  'Generate Mind Map'
                )}
              </Button>
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  );
}