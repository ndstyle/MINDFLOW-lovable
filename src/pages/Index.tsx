import { useState } from 'react';
import { Button } from "@/components/ui/button";
import { FloatingParticles } from "@/components/FloatingParticles";
import { Header } from "@/components/Header";
import { InputArea } from "@/components/InputArea";
import { MindMapVisualization } from "@/components/MindMapVisualization";
import { ContextQuestions } from "@/components/ContextQuestions";
import { SidePanelChat } from "@/components/SidePanelChat";
import { generateMindMapFromText } from "@/utils/mindMapGenerator";
import { generateMindMapWithLLM } from "@/utils/llmMindMapGenerator";
import { Zap, Users, Download, ChevronRight, Edit } from "lucide-react";
import { toast } from "sonner";
import { Input } from "@/components/ui/input";

interface MindMapNode {
  id: string;
  text: string;
  x: number;
  y: number;
  level: number;
  children: string[];
}

const Index = () => {
  const [mindMapNodes, setMindMapNodes] = useState<MindMapNode[]>([]);
  const [isProcessing, setIsProcessing] = useState(false);
  const [showMindMap, setShowMindMap] = useState(false);
  const [showContextQuestions, setShowContextQuestions] = useState(false);
  const [pendingText, setPendingText] = useState('');
  const [selectedContext, setSelectedContext] = useState('');
  const [isChatOpen, setIsChatOpen] = useState(false);
  const [apiKey, setApiKey] = useState('');
  const [showApiKeyInput, setShowApiKeyInput] = useState(false);

  const handleTextSubmit = async (text: string) => {
    setPendingText(text);
    setShowContextQuestions(true);
  };

  const handleContextSelect = async (context: string) => {
    setSelectedContext(context);
    setShowContextQuestions(false);
    setIsProcessing(true);
    setShowMindMap(true);
    
    toast.success("generating your mind map...");
    
    try {
      let nodes: MindMapNode[];
      
      if (apiKey) {
        // Use LLM for enhanced mind map generation
        nodes = await generateMindMapWithLLM(pendingText, context, apiKey);
        toast.success("ai-powered mind map created successfully!");
      } else {
        // Fallback to local generation
        nodes = generateMindMapFromText(pendingText);
        toast.success("mind map created successfully!");
      }
      
      setMindMapNodes(nodes);
    } catch (error) {
      console.error('Mind map generation error:', error);
      toast.error("failed to generate mind map. using fallback method...");
      const nodes = generateMindMapFromText(pendingText);
      setMindMapNodes(nodes);
    } finally {
      setIsProcessing(false);
    }
  };

  const handleTryNow = () => {
    setShowMindMap(true);
  };

  const scrollToFeatures = () => {
    const featuresSection = document.getElementById('features-section');
    if (featuresSection) {
      featuresSection.scrollIntoView({ behavior: 'smooth' });
    }
  };

  if (showMindMap) {
    return (
      <div className="min-h-screen bg-background">
        <Header />
        
        <main className="container mx-auto px-6 py-8">
          <div className="max-w-6xl mx-auto space-y-8">
            <div className="text-center space-y-4">
              <h1 className="text-3xl font-bold gradient-text lowercase">
                create your mind map
              </h1>
              <p className="text-muted-foreground lowercase max-w-2xl mx-auto">
                transform your chaotic thoughts into structured, visual mind maps
              </p>
            </div>

            {/* API Key Input */}
            {!apiKey && (
              <div className="bg-secondary/20 border border-border rounded-lg p-4 space-y-3">
                <p className="text-sm text-muted-foreground lowercase">
                  optional: add your openai api key for enhanced ai-powered mind mapping
                </p>
                <div className="flex gap-2">
                  <Input
                    type="password"
                    placeholder="sk-..."
                    value={apiKey}
                    onChange={(e) => setApiKey(e.target.value)}
                    className="lowercase"
                  />
                  <Button
                    variant="outline"
                    onClick={() => toast.success("api key saved for this session")}
                    disabled={!apiKey.trim()}
                    className="lowercase"
                  >
                    save
                  </Button>
                </div>
              </div>
            )}

            <InputArea onSubmit={handleTextSubmit} isProcessing={isProcessing} />

            {mindMapNodes.length > 0 && (
              <div className="space-y-4 relative">
                <div className="flex items-center justify-between">
                  <h2 className="text-xl font-semibold text-foreground lowercase">
                    your mind map
                  </h2>
                  <Button
                    onClick={() => setIsChatOpen(true)}
                    variant="outline"
                    size="sm"
                    className="lowercase"
                  >
                    <Edit className="w-4 h-4 mr-2" />
                    make changes
                  </Button>
                </div>
                <MindMapVisualization nodes={mindMapNodes} />
                
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <Button variant="outline" size="sm" className="lowercase">
                      <Download className="w-4 h-4 mr-2" />
                      export as png
                    </Button>
                    <Button variant="outline" size="sm" className="lowercase">
                      share mind map
                    </Button>
                  </div>
                  <Button 
                    variant="ghost" 
                    size="sm" 
                    onClick={() => {
                      setMindMapNodes([]);
                      setShowMindMap(false);
                      setSelectedContext('');
                      setPendingText('');
                    }}
                    className="lowercase"
                  >
                    clear & start over
                  </Button>
                </div>
              </div>
            )}
          </div>
        </main>
        
        <SidePanelChat
          isOpen={isChatOpen}
          onClose={() => setIsChatOpen(false)}
          mindMapContext={mindMapNodes}
          onMindMapUpdate={setMindMapNodes}
        />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background relative overflow-hidden">
      <FloatingParticles />
      <Header />
      
      <main className="relative z-10">
        {/* Hero Section */}
        <section className="container mx-auto px-6 py-16 text-center">
          <div className="max-w-5xl mx-auto space-y-8">
            <div className="inline-flex items-center gap-2 px-4 py-2 bg-secondary/50 border border-border/50 rounded-full text-sm text-muted-foreground lowercase">
              <Zap className="w-4 h-4 text-primary" />
              ai-powered mind mapping
            </div>

            <h1 className="text-5xl md:text-7xl font-bold leading-tight">
              <span className="text-foreground lowercase">transform </span>
              <span className="gradient-text lowercase">messy notes</span>
              <span className="text-foreground lowercase"> into</span>
              <br />
              <span className="gradient-text lowercase">structured mind maps</span>
            </h1>

            <p className="text-base text-muted-foreground max-w-3xl mx-auto lowercase leading-relaxed">
              paste or voice your chaotic thoughts and watch ai instantly create
              beautiful, interactive mind maps and project plans. no manual effort
              required.
            </p>

            <div className="flex items-center justify-center gap-4 pt-4">
              <div className="flex items-center gap-2 text-sm text-muted-foreground lowercase">
                <Zap className="w-4 h-4 text-primary" />
                instant ai processing
              </div>
              <div className="flex items-center gap-2 text-sm text-muted-foreground lowercase">
                <Users className="w-4 h-4 text-accent" />
                interactive editing
              </div>
              <div className="flex items-center gap-2 text-sm text-muted-foreground lowercase">
                <Download className="w-4 h-4 text-gradient-green" />
                export & share
              </div>
            </div>

            <div className="flex items-center justify-center gap-4 pt-8">
              <Button 
                size="lg" 
                onClick={handleTryNow}
                className="lowercase text-base px-8 py-3"
              >
                try it now
                <ChevronRight className="w-4 h-4 ml-2" />
              </Button>
              <Button 
                variant="outline" 
                size="lg" 
                onClick={scrollToFeatures}
                className="lowercase text-base px-8 py-3"
              >
                see features
              </Button>
            </div>
          </div>
        </section>

        {/* Features Section */}
        <section id="features-section" className="container mx-auto px-6 py-16">
          <div className="max-w-4xl mx-auto">
            <div className="text-center space-y-4 mb-12">
              <h2 className="text-3xl font-bold gradient-text lowercase">features</h2>
              <p className="text-muted-foreground lowercase">powerful tools for visual thinking</p>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8 text-center">
              <div className="space-y-2">
                <div className="text-4xl font-bold text-foreground">10x</div>
                <div className="text-muted-foreground lowercase">faster planning</div>
              </div>
              <div className="space-y-2">
                <div className="text-4xl font-bold text-foreground">95%</div>
                <div className="text-muted-foreground lowercase">time saved</div>
              </div>
              <div className="space-y-2">
                <div className="text-4xl font-bold text-foreground">∞</div>
                <div className="text-muted-foreground lowercase">possibilities</div>
              </div>
            </div>
          </div>
        </section>
      </main>
      
      <ContextQuestions
        isVisible={showContextQuestions}
        onContextSelect={handleContextSelect}
      />
    </div>
  );
};

export default Index;
