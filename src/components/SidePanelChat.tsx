import { useState, useRef, useEffect } from 'react';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import { X, Send, Bot, User } from "lucide-react";
import { toast } from "sonner";

interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
}

interface SidePanelChatProps {
  isOpen: boolean;
  onClose: () => void;
  mindMapContext: any[];
  onMindMapUpdate: (nodes: any[]) => void;
}

export const SidePanelChat = ({ isOpen, onClose, mindMapContext, onMindMapUpdate }: SidePanelChatProps) => {
  
  const updateMindMapFromResponse = async (response: string) => {
    // Simple logic to update mind map based on AI response
    // In a production app, this would be more sophisticated
    const currentNodes = [...mindMapContext];
    
    // Example: If AI mentions adding a topic, create a new node
    if (response.toLowerCase().includes('add') || response.toLowerCase().includes('include')) {
      const newNode = {
        id: `node-${Date.now()}`,
        text: 'new idea',
        x: Math.random() * 400 + 100,
        y: Math.random() * 300 + 100,
        level: 1
      };
      currentNodes.push(newNode);
      onMindMapUpdate(currentNodes);
    }
    
    // Trigger a small delay to show the update
    setTimeout(() => {
      toast.success("mind map updated!");
    }, 500);
  };
  const [messages, setMessages] = useState<Message[]>([
    {
      id: '1',
      role: 'assistant',
      content: 'hello! i can help you revise and expand your mind map. what changes would you like to make?',
      timestamp: new Date()
    }
  ]);
  const [inputValue, setInputValue] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const apiKey = 'sk-proj-JmTfBPuLXlNbI7u0t6YAT3BlbkFJvQP5zXaXlW3rY8Z4K2mN'; // Your API key
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleSendMessage = async () => {
    if (!inputValue.trim() || isLoading) return;
    

    const userMessage: Message = {
      id: Date.now().toString(),
      role: 'user',
      content: inputValue,
      timestamp: new Date()
    };

    setMessages(prev => [...prev, userMessage]);
    setInputValue('');
    setIsLoading(true);

    try {
      const systemPrompt = `You are a helpful AI assistant for a mind mapping app. Help users improve their mind maps in a friendly, simple way.

Current mind map: ${JSON.stringify(mindMapContext, null, 2)}

Instructions:
- speak in a casual, friendly tone (lowercase)
- when users ask for changes, describe what you'll do in simple terms
- don't mention technical details like "node-1" or "branch-2" 
- focus on the content and organization, not the technical structure
- be encouraging and supportive
- after explaining changes, always end with: "i'll update your map now!"

The user doesn't need to know how the system works - just help them improve their ideas.`;

      const response = await fetch('https://api.openai.com/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${apiKey}`
        },
        body: JSON.stringify({
          model: 'gpt-4',
          messages: [
            { role: 'system', content: systemPrompt },
            ...messages.map(m => ({ role: m.role, content: m.content })),
            { role: 'user', content: inputValue }
          ],
          max_tokens: 500,
          temperature: 0.7
        })
      });

      if (!response.ok) {
        throw new Error(`API error: ${response.status}`);
      }

      const data = await response.json();
      const assistantMessage: Message = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: data.choices[0].message.content,
        timestamp: new Date()
      };

      setMessages(prev => [...prev, assistantMessage]);
      
      // Parse AI response to update mind map
      try {
        await updateMindMapFromResponse(data.choices[0].message.content);
      } catch (error) {
        console.error('Failed to update mind map:', error);
      }
    } catch (error) {
      console.error('Chat error:', error);
      toast.error("failed to send message. check your api key and try again.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  if (!isOpen) return null;

  return (
    <div className={`fixed right-0 top-0 h-full w-80 bg-card border-l border-border z-40 transform transition-transform duration-300 ${
      isOpen ? 'translate-x-0' : 'translate-x-full'
    }`}>
      <div className="flex flex-col h-full">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-border">
          <div className="flex items-center gap-2">
            <Bot className="w-5 h-5 text-primary" />
            <h3 className="font-medium lowercase">mind map assistant</h3>
          </div>
          <Button variant="ghost" size="sm" onClick={onClose}>
            <X className="w-4 h-4" />
          </Button>
        </div>


        {/* Messages */}
        <div className="flex-1 overflow-y-auto p-4 space-y-4">
          {messages.map((message) => (
            <div
              key={message.id}
              className={`flex gap-2 ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}
            >
              {message.role === 'assistant' && (
                <Bot className="w-4 h-4 mt-1 text-primary flex-shrink-0" />
              )}
              <Card className={`max-w-[80%] p-3 ${
                message.role === 'user' 
                  ? 'bg-primary text-primary-foreground' 
                  : 'bg-secondary'
              }`}>
                <p className="text-sm lowercase">{message.content}</p>
              </Card>
              {message.role === 'user' && (
                <User className="w-4 h-4 mt-1 text-muted-foreground flex-shrink-0" />
              )}
            </div>
          ))}
          {isLoading && (
            <div className="flex gap-2 justify-start">
              <Bot className="w-4 h-4 mt-1 text-primary flex-shrink-0" />
              <Card className="bg-secondary p-3">
                <div className="flex space-x-1">
                  <div className="w-2 h-2 bg-primary rounded-full animate-bounce"></div>
                  <div className="w-2 h-2 bg-primary rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></div>
                  <div className="w-2 h-2 bg-primary rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
                </div>
              </Card>
            </div>
          )}
          <div ref={messagesEndRef} />
        </div>

        {/* Input */}
        <div className="p-4 border-t border-border">
          <div className="flex gap-2">
            <Input
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              onKeyPress={handleKeyPress}
              placeholder="ask me to modify your mind map..."
              disabled={isLoading}
              className="lowercase"
            />
            <Button
              onClick={handleSendMessage}
              disabled={isLoading || !inputValue.trim()}
              size="sm"
            >
              <Send className="w-4 h-4" />
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};