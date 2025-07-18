import { useState, useRef, useEffect } from 'react';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { X, Send, MessageCircle } from "lucide-react";
import { toast } from "sonner";

interface MindMapNode {
  id: string;
  text: string;
  x: number;
  y: number;
  level: number;
  children: string[];
}

interface ChatMessage {
  role: 'user' | 'assistant';
  content: string;
}

interface SidePanelChatProps {
  isOpen: boolean;
  onClose: () => void;
  mindMapNodes: MindMapNode[];
  onMindMapUpdate: (nodes: MindMapNode[]) => void;
  mindmapId?: string | null;
}

export const SidePanelChat = ({ isOpen, onClose, mindMapNodes, onMindMapUpdate, mindmapId }: SidePanelChatProps) => {
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      role: 'assistant',
      content: "Hi! I'm here to help you improve your mind map. Just tell me what you'd like to change, add, or refine - I'll speak naturally and update your map accordingly!"
    }
  ]);
  const [inputMessage, setInputMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const scrollAreaRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (scrollAreaRef.current) {
      scrollAreaRef.current.scrollTop = scrollAreaRef.current.scrollHeight;
    }
  }, [messages]);

  const sendMessage = async () => {
    if (!inputMessage.trim() || isLoading) return;

    const userMessage = inputMessage.trim();
    setInputMessage('');
    setIsLoading(true);

    // Add user message
    const newMessages = [...messages, { role: 'user' as const, content: userMessage }];
    setMessages(newMessages);

    try {
      const response = await fetch('https://fznyckrgwplfoqjkltbq.functions.supabase.co/chat-assistant', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          message: userMessage,
          mindMapNodes,
          conversationHistory: messages
        }),
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const result = await response.json();
      
      if (result.error) {
        throw new Error(result.error);
      }

      // Add assistant response
      setMessages([...newMessages, { role: 'assistant', content: result.response }]);

      // Update mind map if provided
      if (result.updatedMindMap) {
        onMindMapUpdate(result.updatedMindMap);
        toast.success("mind map updated!");
      }

    } catch (error) {
      console.error('Error sending message:', error);
      toast.error("failed to send message. please try again.");
      setMessages([...newMessages, { 
        role: 'assistant', 
        content: "Sorry, I'm having trouble connecting right now. Please try again in a moment." 
      }]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed right-0 top-0 h-full w-96 bg-background border-l border-border/50 shadow-lg z-50 flex flex-col">
      {/* Header */}
      <div className="p-4 border-b border-border/50 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <MessageCircle className="w-5 h-5 text-primary" />
          <h3 className="font-semibold text-foreground lowercase">chat assistant</h3>
        </div>
        <Button variant="ghost" size="sm" onClick={onClose}>
          <X className="w-4 h-4" />
        </Button>
      </div>

      {/* Messages */}
      <ScrollArea className="flex-1 p-4" ref={scrollAreaRef}>
        <div className="space-y-4">
          {messages.map((message, index) => (
            <div
              key={index}
              className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}
            >
              <div
                className={`max-w-xs p-3 rounded-lg text-sm ${
                  message.role === 'user'
                    ? 'bg-primary text-primary-foreground'
                    : 'bg-secondary text-secondary-foreground'
                }`}
              >
                {message.content}
              </div>
            </div>
          ))}
          {isLoading && (
            <div className="flex justify-start">
              <div className="bg-secondary text-secondary-foreground max-w-xs p-3 rounded-lg text-sm">
                typing...
              </div>
            </div>
          )}
        </div>
      </ScrollArea>

      {/* Input */}
      <div className="p-4 border-t border-border/50">
        <div className="flex gap-2">
          <Input
            value={inputMessage}
            onChange={(e) => setInputMessage(e.target.value)}
            onKeyPress={handleKeyPress}
            placeholder="ask me to modify your mind map..."
            className="flex-1 lowercase"
            disabled={isLoading}
          />
          <Button 
            onClick={sendMessage} 
            disabled={!inputMessage.trim() || isLoading}
            size="sm"
          >
            <Send className="w-4 h-4" />
          </Button>
        </div>
      </div>
    </div>
  );
};