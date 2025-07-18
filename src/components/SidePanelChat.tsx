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
  const [apiKey, setApiKey] = useState('');
  const [showApiKeyInput, setShowApiKeyInput] = useState(true);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleSendMessage = async () => {
    if (!inputValue.trim() || isLoading) return;
    
    if (!apiKey.trim()) {
      toast.error("please enter your openai api key first");
      return;
    }

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
      const systemPrompt = `You are an AI assistant that helps users modify and improve their mind maps. 

Current mind map context: ${JSON.stringify(mindMapContext, null, 2)}

Your role:
- Understand the current mind map structure and content
- Help users revise, expand, or reorganize their mind maps
- Provide clear reasoning for suggested changes
- Be conversational and helpful
- Respond in lowercase and keep responses concise
- Focus on practical improvements to the mind map structure

When suggesting changes, be specific about what nodes to add, remove, or modify.`;

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

        {/* API Key Input */}
        {showApiKeyInput && (
          <div className="p-4 bg-secondary/20 border-b border-border">
            <div className="space-y-2">
              <label className="text-xs text-muted-foreground lowercase">
                openai api key
              </label>
              <Input
                type="password"
                placeholder="sk-..."
                value={apiKey}
                onChange={(e) => setApiKey(e.target.value)}
                className="text-xs"
              />
              <Button
                size="sm"
                onClick={() => setShowApiKeyInput(false)}
                disabled={!apiKey.trim()}
                className="w-full lowercase text-xs"
              >
                continue
              </Button>
            </div>
          </div>
        )}

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
              disabled={isLoading || showApiKeyInput}
              className="lowercase"
            />
            <Button
              onClick={handleSendMessage}
              disabled={isLoading || !inputValue.trim() || showApiKeyInput}
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