import { useState } from 'react';
import { Button } from "@/components/ui/button";
import { FloatingParticles } from "@/components/FloatingParticles";
import { Header } from "@/components/Header";
import { InputArea } from "@/components/InputArea";
import { MindMapVisualization } from "@/components/MindMapVisualization";
import { generateMindMapFromText } from "@/utils/mindMapGenerator";
import { Zap, Users, Download, ChevronRight } from "lucide-react";
import { toast } from "sonner";

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

  const handleTextSubmit = async (text: string) => {
    setIsProcessing(true);
    toast.success("generating your mind map...");
    
    // Simulate processing time
    setTimeout(() => {
      const nodes = generateMindMapFromText(text);
      setMindMapNodes(nodes);
      setShowMindMap(true);
      setIsProcessing(false);
      toast.success("mind map created successfully!");
    }, 2000);
  };

  const handleTryNow = () => {
    setShowMindMap(true);
  };

  if (showMindMap) {
    return (
      <div className="min-h-screen bg-background">
        <FloatingParticles />
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

            <InputArea onSubmit={handleTextSubmit} isProcessing={isProcessing} />

            {mindMapNodes.length > 0 && (
              <div className="space-y-4">
                <h2 className="text-xl font-semibold text-foreground lowercase">
                  your mind map
                </h2>
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
                    onClick={() => setMindMapNodes([])}
                    className="lowercase"
                  >
                    clear & start over
                  </Button>
                </div>
              </div>
            )}
          </div>
        </main>
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

            <p className="text-xl text-muted-foreground max-w-3xl mx-auto lowercase leading-relaxed">
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
                className="lowercase text-base px-8 py-3"
              >
                see features
              </Button>
            </div>
          </div>
        </section>

        {/* Stats Section */}
        <section className="container mx-auto px-6 py-16">
          <div className="max-w-4xl mx-auto">
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
    </div>
  );
};

export default Index;
