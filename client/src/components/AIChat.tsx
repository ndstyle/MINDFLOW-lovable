import React, { useState, useRef, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Send, Bot, User, Zap, Plus, Trash2, Palette } from 'lucide-react';
import { toast } from 'sonner';

interface ChatMessage {
  id: string;
  type: 'user' | 'assistant';
  content: string;
  timestamp: Date;
  updatedMindMap?: any;
}

interface AIChatProps {
  mindmapId: string;
  mindmapNodes: any[];
  onMindmapUpdate: (nodes: any[]) => void;
  onGenerateQuiz: () => void;
  onGenerateFlashcards: () => void;
}

export const AIChat: React.FC<AIChatProps> = ({
  mindmapId,
  mindmapNodes,
  onMindmapUpdate,
  onGenerateQuiz,
  onGenerateFlashcards
}) => {
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: '1',
      type: 'assistant',
      content: "Hi! I'm your AI assistant. I can help you edit your mind map, generate quizzes, create flashcards, and more. Try commands like:\n\n• \"Add a branch about [topic]\"\n• \"Change the color of [node] to blue\"\n• \"Generate a quiz for this mindmap\"\n• \"Create flashcards from [section]\"",
      timestamp: new Date()
    }
  ]);
  const [inputValue, setInputValue] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isOpen, setIsOpen] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const getAuthHeaders = () => {
    const token = localStorage.getItem('supabase_token');
    return token ? { 'Authorization': `Bearer ${token}` } : {};
  };

  const handleSendMessage = async () => {
    if (!inputValue.trim() || isLoading) return;

    const userMessage: ChatMessage = {
      id: Date.now().toString(),
      type: 'user',
      content: inputValue,
      timestamp: new Date()
    };

    setMessages(prev => [...prev, userMessage]);
    setInputValue('');
    setIsLoading(true);

    try {
      // Check for specific commands
      const message = inputValue.toLowerCase();
      
      if (message.includes('generate quiz') || message.includes('create quiz')) {
        onGenerateQuiz();
        const assistantMessage: ChatMessage = {
          id: (Date.now() + 1).toString(),
          type: 'assistant',
          content: "I'll generate a quiz from your mind map content! This will include multiple choice, true/false, and fill-in-the-blank questions based on the key concepts.",
          timestamp: new Date()
        };
        setMessages(prev => [...prev, assistantMessage]);
        setIsLoading(false);
        return;
      }

      if (message.includes('generate flashcard') || message.includes('create flashcard')) {
        onGenerateFlashcards();
        const assistantMessage: ChatMessage = {
          id: (Date.now() + 1).toString(),
          type: 'assistant',
          content: "I'll create flashcards from your mind map! These will help you study the key concepts with question and answer pairs.",
          timestamp: new Date()
        };
        setMessages(prev => [...prev, assistantMessage]);
        setIsLoading(false);
        return;
      }

      // Send to backend for AI processing
      const response = await fetch('/api/mindmap-chat', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...getAuthHeaders()
        },
        body: JSON.stringify({
          mindmapId,
          message: inputValue,
          mindMapNodes,
          conversationHistory: messages.slice(-10).map(m => ({
            role: m.type === 'user' ? 'user' : 'assistant',
            content: m.content
          }))
        })
      });

      if (!response.ok) {
        throw new Error('Failed to get AI response');
      }

      const data = await response.json();
      
      const assistantMessage: ChatMessage = {
        id: (Date.now() + 1).toString(),
        type: 'assistant',
        content: data.response,
        timestamp: new Date(),
        updatedMindMap: data.updatedMindMap
      };

      setMessages(prev => [...prev, assistantMessage]);

      // Update mindmap if AI made changes
      if (data.updatedMindMap) {
        onMindmapUpdate(data.updatedMindMap);
        toast.success('Mind map updated by AI assistant');
      }

    } catch (error) {
      console.error('Error sending message:', error);
      const errorMessage: ChatMessage = {
        id: (Date.now() + 1).toString(),
        type: 'assistant',
        content: "Sorry, I encountered an error. Please try again or use simpler commands like 'add node', 'change color', or 'generate quiz'.",
        timestamp: new Date()
      };
      setMessages(prev => [...prev, errorMessage]);
      toast.error('Failed to process your request');
    } finally {
      setIsLoading(false);
    }
  };

  const quickCommands = [
    { label: 'Add Node', command: 'Add a new branch about', icon: Plus },
    { label: 'Change Color', command: 'Change the color to', icon: Palette },
    { label: 'Generate Quiz', command: 'Generate a quiz from this mindmap', icon: Zap },
    { label: 'Create Cards', command: 'Create flashcards from this content', icon: Zap }
  ];

  if (!isOpen) {
    return (
      <Button
        onClick={() => setIsOpen(true)}
        className="fixed bottom-4 right-4 rounded-full w-14 h-14 shadow-lg bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700"
      >
        <Bot className="h-6 w-6" />
      </Button>
    );
  }

  return (
    <Card className="fixed bottom-4 right-4 w-96 h-[500px] shadow-xl bg-white/95 backdrop-blur-sm">
      <CardContent className="p-0 flex flex-col h-full">
        {/* Header */}
        <div className="p-4 border-b bg-gradient-to-r from-purple-600 to-blue-600 text-white rounded-t-lg">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Bot className="h-5 w-5" />
              <span className="font-semibold">AI Assistant</span>
            </div>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setIsOpen(false)}
              className="text-white hover:bg-white/20"
            >
              ×
            </Button>
          </div>
        </div>

        {/* Quick Commands */}
        <div className="p-3 border-b bg-gray-50">
          <div className="text-xs text-gray-600 mb-2">Quick Commands:</div>
          <div className="flex flex-wrap gap-1">
            {quickCommands.map((cmd) => (
              <Button
                key={cmd.label}
                variant="outline"
                size="sm"
                onClick={() => setInputValue(cmd.command)}
                className="text-xs h-6"
              >
                <cmd.icon className="h-3 w-3 mr-1" />
                {cmd.label}
              </Button>
            ))}
          </div>
        </div>

        {/* Messages */}
        <div className="flex-1 overflow-y-auto p-4 space-y-4">
          {messages.map((message) => (
            <div
              key={message.id}
              className={`flex gap-3 ${message.type === 'user' ? 'justify-end' : 'justify-start'}`}
            >
              {message.type === 'assistant' && (
                <div className="w-8 h-8 rounded-full bg-gradient-to-r from-purple-600 to-blue-600 flex items-center justify-center flex-shrink-0">
                  <Bot className="h-4 w-4 text-white" />
                </div>
              )}
              
              <div
                className={`max-w-[250px] rounded-lg p-3 ${
                  message.type === 'user'
                    ? 'bg-blue-600 text-white ml-8'
                    : 'bg-gray-100 text-gray-800'
                }`}
              >
                <div className="text-sm whitespace-pre-wrap">{message.content}</div>
                {message.updatedMindMap && (
                  <Badge variant="outline" className="mt-2">
                    <Zap className="h-3 w-3 mr-1" />
                    Mind map updated
                  </Badge>
                )}
                <div className="text-xs opacity-70 mt-1">
                  {message.timestamp.toLocaleTimeString()}
                </div>
              </div>

              {message.type === 'user' && (
                <div className="w-8 h-8 rounded-full bg-blue-600 flex items-center justify-center flex-shrink-0">
                  <User className="h-4 w-4 text-white" />
                </div>
              )}
            </div>
          ))}
          
          {isLoading && (
            <div className="flex gap-3">
              <div className="w-8 h-8 rounded-full bg-gradient-to-r from-purple-600 to-blue-600 flex items-center justify-center">
                <Bot className="h-4 w-4 text-white" />
              </div>
              <div className="bg-gray-100 rounded-lg p-3">
                <div className="flex space-x-1">
                  <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"></div>
                  <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></div>
                  <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
                </div>
              </div>
            </div>
          )}
          <div ref={messagesEndRef} />
        </div>

        {/* Input */}
        <div className="p-4 border-t">
          <div className="flex gap-2">
            <Input
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && handleSendMessage()}
              placeholder="Ask me to edit your mind map..."
              disabled={isLoading}
              className="flex-1"
            />
            <Button
              onClick={handleSendMessage}
              disabled={isLoading || !inputValue.trim()}
              size="sm"
            >
              <Send className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};