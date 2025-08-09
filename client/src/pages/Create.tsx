import { useState } from 'react';
import { Header } from "@/components/Header";
import { InputArea } from "@/components/InputArea";
import { CategorySelector } from "@/components/CategorySelector";
import { MindMapVisualization } from "@/components/MindMapVisualization";
import { SidePanelChat } from "@/components/SidePanelChat";
import { Button } from "@/components/ui/button";
import { Download, Share, MessageCircle } from "lucide-react";
import { toast } from "sonner";

interface MindMapNode {
  id: string;
  text: string;
  x: number;
  y: number;
  level: number;
  children: string[];
}

const Create = () => {
  const [mindMapNodes, setMindMapNodes] = useState<MindMapNode[]>([]);
  const [isProcessing, setIsProcessing] = useState(false);
  const [showMindMap, setShowMindMap] = useState(false);
  const [showCategorySelector, setShowCategorySelector] = useState(false);
  const [inputText, setInputText] = useState('');
  const [isChatOpen, setIsChatOpen] = useState(false);

  const handleTextSubmit = async (text: string) => {
    setInputText(text);
    setShowCategorySelector(true);
  };

  const handleCategorySelect = async (category: string) => {
    setIsProcessing(true);
    setShowCategorySelector(false);
    setShowMindMap(true);
    toast.success("generating your ai-powered mind map...");

    try {
      const response = await fetch('/api/generate-mindmap', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          text: inputText,
          category: category
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
      toast.success("mind map created successfully!");
      
    } catch (error) {
      console.error('Error generating mind map:', error);
      toast.error("failed to generate mind map. please try again.");
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
    const svgBlob = new Blob([svgData], {type: 'image/svg+xml;charset=utf-8'});
    const url = URL.createObjectURL(svgBlob);
    
    img.onload = () => {
      canvas.width = img.width;
      canvas.height = img.height;
      ctx?.drawImage(img, 0, 0);
      URL.revokeObjectURL(url);
      
      canvas.toBlob((blob) => {
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
      text: 'Check out this mind map I created with Mindflow!',
      url: window.location.href
    };

    if (navigator.share) {
      navigator.share(shareData);
    } else {
      navigator.clipboard.writeText(window.location.href);
      toast.success("link copied to clipboard!");
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <Header />
      
      <main className="container mx-auto px-6 py-8">
        <div className="max-w-6xl mx-auto space-y-8">
          <div className="text-center space-y-4">
            <h1 className="text-3xl font-bold gradient-text lowercase">
              create your mind map
            </h1>
            <p className="text-muted-foreground lowercase max-w-2xl mx-auto text-lg">
              transform your chaotic thoughts into structured, visual mind maps
            </p>
          </div>

          {!showCategorySelector && !showMindMap && (
            <InputArea onSubmit={handleTextSubmit} isProcessing={isProcessing} />
          )}
          
          <CategorySelector 
            onCategorySelect={handleCategorySelect}
            isVisible={showCategorySelector}
          />

          {showMindMap && (
            <div className="space-y-4 relative">
              <div className="flex items-center justify-between">
                <h2 className="text-xl font-semibold text-foreground lowercase">
                  your mind map
                </h2>
                <Button
                  onClick={() => setIsChatOpen(true)}
                  className="fixed bottom-6 right-6 z-40 shadow-lg lowercase"
                  size="lg"
                >
                  <MessageCircle className="w-5 h-5 mr-2" />
                  make changes
                </Button>
              </div>
              
              <MindMapVisualization nodes={mindMapNodes} />
              
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <Button 
                    variant="outline" 
                    size="sm" 
                    className="lowercase"
                    onClick={exportMindMapAsPNG}
                  >
                    <Download className="w-4 h-4 mr-2" />
                    export as png
                  </Button>
                  <Button 
                    variant="outline" 
                    size="sm" 
                    className="lowercase"
                    onClick={shareMindMap}
                  >
                    <Share className="w-4 h-4 mr-2" />
                    share mind map
                  </Button>
                </div>
                <Button 
                  variant="ghost" 
                  size="sm" 
                  onClick={() => {
                    setMindMapNodes([]);
                    setShowMindMap(false);
                    setShowCategorySelector(false);
                    setInputText('');
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
        mindMapNodes={mindMapNodes}
        onMindMapUpdate={setMindMapNodes}
      />
    </div>
  );
};

export default Create;