import { useState } from 'react';
import { Header } from "@/components/Header";
import { InputArea } from "@/components/InputArea";
import { ContextQuestions } from "@/components/ContextQuestions";
import { MindMapVisualization } from "@/components/MindMapVisualization";
import { SidePanelChat } from "@/components/SidePanelChat";
import { generateMindMapFromText } from "@/utils/mindMapGenerator";
import { generateMindMapWithLLM } from "@/utils/llmMindMapGenerator";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Edit, Download } from "lucide-react";
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
  const [showContextQuestions, setShowContextQuestions] = useState(false);
  const [pendingText, setPendingText] = useState('');
  const [selectedContext, setSelectedContext] = useState('');
  const [isChatOpen, setIsChatOpen] = useState(false);
  const [apiKey, setApiKey] = useState('');

  const handleTextSubmit = async (text: string) => {
    setPendingText(text);
    setShowContextQuestions(true);
  };

  const handleContextSelect = async (context: string) => {
    setSelectedContext(context);
    setShowContextQuestions(false);
    setIsProcessing(true);
    
    toast.success("generating your mind map...");
    
    try {
      let nodes: MindMapNode[];
      
      if (apiKey) {
        nodes = await generateMindMapWithLLM(pendingText, context, apiKey);
        toast.success("ai-powered mind map created successfully!");
      } else {
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
      
      <ContextQuestions
        isVisible={showContextQuestions}
        onContextSelect={handleContextSelect}
      />
      
      <SidePanelChat
        isOpen={isChatOpen}
        onClose={() => setIsChatOpen(false)}
        mindMapContext={mindMapNodes}
        onMindMapUpdate={setMindMapNodes}
      />
    </div>
  );
};

export default Create;