import { useState } from 'react';
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Send, Sparkles } from "lucide-react";
import { toast } from "sonner";
import { VoiceInput } from "./VoiceInput";

interface InputAreaProps {
  onSubmit: (text: string) => void;
  isProcessing: boolean;
}

export const InputArea = ({ onSubmit, isProcessing }: InputAreaProps) => {
  const [inputText, setInputText] = useState('');

  const handleSubmit = () => {
    if (!inputText.trim()) {
      toast.error("please enter some text to create a mind map");
      return;
    }
    
    onSubmit(inputText);
    setInputText('');
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) {
      handleSubmit();
    }
  };

  const handleVoiceTranscript = (transcript: string) => {
    setInputText(prev => prev + (prev ? ' ' : '') + transcript);
  };

  return (
    <div className="w-full max-w-4xl mx-auto space-y-4">
      <div className="gradient-border">
        <Textarea
          placeholder="paste your chaotic thoughts here... we'll transform them into a beautiful mind map"
          value={inputText}
          onChange={(e) => setInputText(e.target.value)}
          onKeyDown={handleKeyDown}
          className="min-h-32 bg-background border-0 text-foreground placeholder:text-muted-foreground lowercase resize-none"
          disabled={isProcessing}
        />
      </div>
      
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2 text-xs text-muted-foreground lowercase">
          <Sparkles className="w-3 h-3" />
          ai-powered mind mapping
        </div>
        
        <div className="flex items-center gap-2">
          <VoiceInput
            onTranscript={handleVoiceTranscript}
            disabled={isProcessing}
          />
          
          <Button
            onClick={handleSubmit}
            disabled={isProcessing || !inputText.trim()}
            className="lowercase"
          >
            <Send className="w-4 h-4 mr-2" />
            {isProcessing ? 'processing...' : 'create mind map'}
          </Button>
        </div>
      </div>
    </div>
  );
};