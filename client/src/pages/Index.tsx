import { useState } from 'react';
import { Button } from "@/components/ui/button";
import { FloatingParticles } from "@/components/FloatingParticles";
import Header from "@/components/Header";
import { InputArea } from "@/components/InputArea";
import { MindMapVisualization } from "@/components/MindMapVisualization";
import { CategorySelector } from "@/components/CategorySelector";
import { SidePanelChat } from "@/components/SidePanelChat";
import { Zap, Users, Download, ChevronRight, MessageCircle, Share, ArrowDown } from "lucide-react";
import { toast } from "sonner";
import { useLocation } from "wouter";

import { useProfile } from "@/hooks/useProfile";
import { useUnlockables } from "@/hooks/useUnlockables";
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
  const [showCategorySelector, setShowCategorySelector] = useState(false);
  const [showInputArea, setShowInputArea] = useState(false);
  const [inputText, setInputText] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('');
  const [isChatOpen, setIsChatOpen] = useState(false);
  const [currentMindmapId, setCurrentMindmapId] = useState<string | null>(null);
  const [, setLocation] = useLocation();
  
  const { awardXP } = useProfile();
  const { hasFeature } = useUnlockables();
  const handleCategorySelect = async (category: string) => {
    setSelectedCategory(category);
    setShowCategorySelector(false);
    setShowInputArea(true);
  };

  const handleTextSubmit = async (text: string) => {
    if (!text.trim()) {
      toast.error("Please enter some text first");
      return;
    }
    if (!selectedCategory) {
      toast.error("Please select a category first");
      return;
    }
    
    setInputText(text);
    setShowInputArea(false);
    setShowMindMap(true);
    setIsProcessing(true);
    toast.success("generating your ai-powered mind map...");

    try {
      const response = await fetch('/api/generate-mindmap', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          text: text,
          category: selectedCategory
        }),
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const result = await response.json();
      
      if (result.error) {
        throw new Error(result.error);
      }

      setMindMapNodes(result.nodes || []);
      
      // Save to database and award XP
      try {
        const title = text.substring(0, 50) + (text.length > 50 ? '...' : '');
        const mindmapResponse = await fetch('/api/mindmaps', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            title,
            content: { nodes: result.nodes || [], category: selectedCategory, originalText: text },
            category: selectedCategory,
            xp_earned: 10
          }),
        });

        if (mindmapResponse.ok) {
          const mindmap = await mindmapResponse.json();
          setCurrentMindmapId(mindmap.id);
          await awardXP(10, 'Created a mind map');
        }
      } catch (dbError) {
        console.error('Error saving mindmap:', dbError);
        // Don't show error to user, mindmap still works
      }
      
      toast.success("mind map created successfully!");
    } catch (error) {
      console.error('Error generating mind map:', error);
      toast.error("failed to generate mind map. please try again.");
      // Fallback to basic generation
      const fallbackNodes: MindMapNode[] = [{
        id: 'central',
        text: text.substring(0, 25),
        x: 400,
        y: 200,
        level: 0,
        children: []
      }];
      setMindMapNodes(fallbackNodes);
    } finally {
      setIsProcessing(false);
    }
  };
  const exportMindMapAsPNG = () => {
    const svgElement = document.querySelector('#mindmap-svg') as SVGElement;
    if (!svgElement) {
      toast.error("mind map not found");
      return;
    }
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    const img = new Image();
    const svgData = new XMLSerializer().serializeToString(svgElement);
    const svgBlob = new Blob([svgData], {
      type: 'image/svg+xml;charset=utf-8'
    });
    const url = URL.createObjectURL(svgBlob);
    img.onload = () => {
      canvas.width = img.width;
      canvas.height = img.height;
      ctx?.drawImage(img, 0, 0);
      URL.revokeObjectURL(url);
      canvas.toBlob(blob => {
        if (blob) {
          const link = document.createElement('a');
          link.download = 'mindmap.png';
          link.href = URL.createObjectURL(blob);
          link.click();
          URL.revokeObjectURL(link.href);
          toast.success("mind map exported as PNG!");
        }
      });
    };
    img.src = url;
  };
  const shareMindMap = () => {
    const shareData = {
      title: 'My Mind Map',
      text: 'Check out this mind map I created with QuickLearned!',
      url: window.location.href
    };
    if (navigator.share) {
      navigator.share(shareData);
    } else {
      navigator.clipboard.writeText(window.location.href);
      toast.success("link copied to clipboard!");
    }
  };
  const scrollToFeatures = () => {
    const featuresSection = document.getElementById('features');
    if (featuresSection) {
      featuresSection.scrollIntoView({
        behavior: 'smooth'
      });
    }
  };
  const handleTryNow = () => {
    setShowCategorySelector(true);
  };
  if (showCategorySelector || showInputArea || showMindMap) {
    return <div className="min-h-screen bg-background">
        <Header />
        
        <main className="container mx-auto px-6 py-8">
          <div className="max-w-6xl mx-auto space-y-8">
            <div className="text-center space-y-4">
              <h1 className="text-3xl font-bold gradient-text lowercase">
                {showCategorySelector && "what's this mind map for?"}
                {showInputArea && "share your thoughts"}
                {showMindMap && "your mind map"}
              </h1>
              <p className="text-muted-foreground lowercase max-w-2xl mx-auto text-lg">
                {showCategorySelector && "choose the type of mind map you want to create"}
                {showInputArea && "paste or speak your chaotic thoughts and let ai organize them"}
                {showMindMap && "transform your chaotic thoughts into structured, visual mind maps"}
              </p>
            </div>

            {showInputArea && <InputArea onSubmit={handleTextSubmit} isProcessing={isProcessing} />}
            
            <CategorySelector onCategorySelect={handleCategorySelect} isVisible={showCategorySelector} />

            {showMindMap && <div className="space-y-4 relative">
                <div className="flex items-center justify-between">
                  <h2 className="text-xl font-semibold text-foreground lowercase">
                    your mind map
                  </h2>
                  <Button 
                    onClick={() => setIsChatOpen(true)} 
                    className="fixed bottom-6 right-6 z-40 shadow-lg lowercase" 
                    size="lg"
                    disabled={!hasFeature('ai_chat')}
                    title={!hasFeature('ai_chat') ? 'Unlock AI Chat Assistant for 20 XP' : ''}
                  >
                    <MessageCircle className="w-5 h-5 mr-2" />
                    {hasFeature('ai_chat') ? 'make changes' : 'unlock chat (20 xp)'}
                  </Button>
                </div>
                
                <MindMapVisualization nodes={mindMapNodes} />
                
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <Button variant="outline" size="sm" className="lowercase" onClick={exportMindMapAsPNG}>
                      <Download className="w-4 h-4 mr-2" />
                      export as png
                    </Button>
                    <Button variant="outline" size="sm" className="lowercase" onClick={shareMindMap}>
                      <Share className="w-4 h-4 mr-2" />
                      share mind map
                    </Button>
                  </div>
                  <Button variant="ghost" size="sm" onClick={() => {
                setMindMapNodes([]);
                setShowMindMap(false);
                setShowCategorySelector(false);
                setShowInputArea(false);
                setInputText('');
                setSelectedCategory('');
                setCurrentMindmapId(null);
              }} className="lowercase">
                    clear & start over
                  </Button>
                </div>
              </div>}
          </div>
        </main>

        <SidePanelChat 
          isOpen={isChatOpen} 
          onClose={() => setIsChatOpen(false)} 
          mindMapNodes={mindMapNodes} 
          onMindMapUpdate={setMindMapNodes}
          mindmapId={currentMindmapId}
        />
      </div>;
  }
  return <div className="min-h-screen bg-background relative overflow-hidden">
      <FloatingParticles showOnlyOnHome={true} />
      <Header />
      
      <main className="relative z-10">
        {/* Hero Section */}
        <section className="container mx-auto px-6 py-16 text-center">
          <div className="max-w-5xl mx-auto space-y-8">
            <div className="inline-flex items-center gap-2 px-4 py-2 bg-secondary/50 border border-border/50 rounded-full text-sm text-muted-foreground lowercase">
              <Zap className="w-4 h-4 text-primary" />
              ai-powered mind mapping
            </div>

            <h1 className="text-5xl font-bold leading-tight md:text-5xl">
              <span className="text-foreground lowercase">transform </span>
              <span className="gradient-text lowercase">documents</span>
              <span className="text-foreground lowercase"> into</span>
              <br />
              <span className="gradient-text lowercase">structured mind maps</span>
            </h1>

            <p className="text-muted-foreground max-w-3xl mx-auto lowercase leading-relaxed text-base">
              upload PDFs, text files, or DOCX documents and watch ai instantly create
              beautiful, interactive mind maps with integrated quizzes. no manual effort
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
              <Button size="lg" onClick={() => setLocation('/upload')} className="lowercase text-base px-8 py-3">
                upload document
                <ChevronRight className="w-4 h-4 ml-2" />
              </Button>
              <Button variant="outline" size="lg" className="lowercase text-base px-8 py-3" onClick={scrollToFeatures}>
                see features
                <ArrowDown className="w-4 h-4 ml-2" />
              </Button>
            </div>
          </div>
        </section>

        {/* Features Section */}
        <section id="features" className="container mx-auto px-6 py-16">
          <div className="max-w-4xl mx-auto space-y-12">
            <div className="text-center space-y-4">
              <h2 className="text-3xl font-bold text-foreground lowercase">features</h2>
              <p className="text-muted-foreground lowercase">everything you need to transform ideas into organized mind maps</p>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              <div className="space-y-3 p-6 rounded-lg bg-card border border-border/50">
                <h3 className="font-semibold text-foreground lowercase">upload documents</h3>
                <p className="text-sm text-muted-foreground lowercase">PDF, TXT, or DOCX files</p>
              </div>
              
              <div className="space-y-3 p-6 rounded-lg bg-card border border-border/50">
                <h3 className="font-semibold text-foreground lowercase">ai-powered mind maps</h3>
                <p className="text-sm text-muted-foreground lowercase">generated automatically</p>
              </div>
              
              <div className="space-y-3 p-6 rounded-lg bg-card border border-border/50">
                <h3 className="font-semibold text-foreground lowercase">interactive quizzes</h3>
                <p className="text-sm text-muted-foreground lowercase">test your knowledge</p>
              </div>
              
              <div className="space-y-3 p-6 rounded-lg bg-card border border-border/50">
                <h3 className="font-semibold text-foreground lowercase">spaced repetition</h3>
                <p className="text-sm text-muted-foreground lowercase">optimized learning</p>
              </div>
              
              <div className="space-y-3 p-6 rounded-lg bg-card border border-border/50">
                <h3 className="font-semibold text-foreground lowercase">export & share</h3>
                <p className="text-sm text-muted-foreground lowercase">PDF exports and links</p>
              </div>
              
              <div className="space-y-3 p-6 rounded-lg bg-card border border-border/50">
                <h3 className="font-semibold text-foreground lowercase">chat with an ai</h3>
                <p className="text-sm text-muted-foreground lowercase">that helps expand or clean up your map</p>
              </div>
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
    </div>;
};
export default Index;