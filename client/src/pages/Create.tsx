import { useState, useEffect, useCallback } from 'react';
import { useLocation } from 'wouter';
import { useAuth } from '@/hooks/useAuth';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Textarea } from '@/components/ui/textarea';
import { Loader2, ArrowLeft, Upload, FileText, Mic, Type } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { useDropzone } from 'react-dropzone';
import { default as Header } from '@/components/Header';
import { VoiceInput } from '@/components/VoiceInput';
import { supabase } from '@/lib/supabase';

interface UploadedFile {
  file: File;
  progress: number;
  status: 'uploading' | 'processing' | 'completed' | 'error';
  error?: string;
}

export default function Create() {
  const { user, loading } = useAuth();
  const [, setLocation] = useLocation();
  const [text, setText] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);
  const [uploadedFiles, setUploadedFiles] = useState<UploadedFile[]>([]);
  const [activeTab, setActiveTab] = useState<'text' | 'file' | 'voice'>('text');
  const { toast } = useToast();

  useEffect(() => {
    if (!loading && !user) {
      console.log('Create: No user, redirecting to auth');
      setLocation('/auth');
    }
  }, [user, loading, setLocation]);

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Loading...</p>
        </div>
      </div>
    );
  }

  // File upload handling
  const onDrop = useCallback(async (acceptedFiles: File[]) => {
    const validFiles = acceptedFiles.filter(file => {
      const validTypes = [
        'application/pdf',
        'text/plain', 
        'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
      ];

      if (!validTypes.includes(file.type)) {
        toast({
          title: "Invalid file type",
          description: `${file.name} is not supported. Only PDF, TXT, and DOCX files are allowed.`,
          variant: "destructive"
        });
        return false;
      }

      if (file.size > 10 * 1024 * 1024) {
        toast({
          title: "File too large",
          description: `${file.name} exceeds the 10MB limit.`,
          variant: "destructive"
        });
        return false;
      }

      return true;
    });

    // Process files and extract text content
    for (const file of validFiles) {
      const newFile: UploadedFile = {
        file,
        progress: 0,
        status: 'processing'
      };

      setUploadedFiles(prev => [...prev, newFile]);

      try {
        const fileText = await extractTextFromFile(file);
        setText(prev => prev + (prev ? '\n\n' : '') + `[From ${file.name}]\n${fileText}`);

        setUploadedFiles(prev => 
          prev.map(f => 
            f.file === file 
              ? { ...f, status: 'completed', progress: 100 }
              : f
          )
        );

        toast({
          title: "File processed",
          description: `Content from ${file.name} has been added to your text.`
        });
      } catch (error) {
        setUploadedFiles(prev => 
          prev.map(f => 
            f.file === file 
              ? { ...f, status: 'error', error: 'Failed to process file' }
              : f
          )
        );

        toast({
          title: "Processing failed",
          description: `Could not extract text from ${file.name}.`,
          variant: "destructive"
        });
      }
    }
  }, [toast]);

  const extractTextFromFile = async (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();

      reader.onload = (e) => {
        const result = e.target?.result;
        if (typeof result === 'string') {
          if (file.type === 'text/plain') {
            resolve(result);
          } else {
            // For non-text files, provide a placeholder
            resolve(`[Content extracted from ${file.name} - ${file.type}]`);
          }
        } else {
          reject(new Error('Failed to read file'));
        }
      };

      reader.onerror = () => reject(new Error('File reading failed'));

      if (file.type === 'text/plain') {
        reader.readAsText(file);
      } else {
        // For other file types, we'd need proper parsing libraries
        // For now, just indicate the file was uploaded
        resolve(`[Document: ${file.name}]\nThis is placeholder text. In a real implementation, the actual content would be extracted from the ${file.type} file.`);
      }
    });
  };

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      'application/pdf': ['.pdf'],
      'text/plain': ['.txt'],
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document': ['.docx']
    },
    multiple: true
  });

  // Voice input handling
  const handleVoiceTranscription = (transcription: string) => {
    setText(prev => prev + (prev ? ' ' : '') + transcription);
  };

  const handleGenerate = async () => {
    const requestId = Date.now();
    console.log(`[${requestId}] FRONTEND: Starting mind map generation process`);
    console.log(`[${requestId}] FRONTEND: Input text length:`, text.trim().length);

    if (!text.trim()) {
      console.log(`[${requestId}] FRONTEND: Validation failed - no text input`);
      toast({
        title: "Input required",
        description: "Please enter some text, upload a file, or use voice input to generate a mind map.",
        variant: "destructive"
      });
      return;
    }

    setIsGenerating(true);
    console.log(`[${requestId}] FRONTEND: Set loading state to true`);

    try {
      // Get auth session for authenticated requests
      console.log(`[${requestId}] FRONTEND: Getting Supabase auth session...`);
      const { data: { session }, error: sessionError } = await supabase.auth.getSession();
      
      if (sessionError) {
        console.error(`[${requestId}] FRONTEND: Session error:`, sessionError);
        throw new Error(`Authentication error: ${sessionError.message}`);
      }
      
      if (!session) {
        console.error(`[${requestId}] FRONTEND: No session found`);
        throw new Error('No authentication session found');
      }

      console.log(`[${requestId}] FRONTEND: Auth session valid, user ID:`, session.user?.id);
      console.log(`[${requestId}] FRONTEND: Token length:`, session.access_token?.length);

      const requestPayload = {
        text: text.trim(),
        category: 'general',
        requestId: requestId // Add request ID for tracking
      };

      console.log(`[${requestId}] FRONTEND: Making API request to /api/generate-mindmap`);
      console.log(`[${requestId}] FRONTEND: Request payload:`, requestPayload);

      const requestStartTime = Date.now();
      
      // Add timeout to the fetch request
      const controller = new AbortController();
      const timeoutId = setTimeout(() => {
        console.error(`[${requestId}] FRONTEND: Request timeout after 30 seconds`);
        controller.abort();
      }, 30000);

      const response = await fetch('/api/generate-mindmap', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session.access_token}`
        },
        body: JSON.stringify(requestPayload),
        signal: controller.signal
      });

      clearTimeout(timeoutId);
      const requestDuration = Date.now() - requestStartTime;
      console.log(`[${requestId}] FRONTEND: Request completed in ${requestDuration}ms`);
      console.log(`[${requestId}] FRONTEND: Response status:`, response.status);
      console.log(`[${requestId}] FRONTEND: Response ok:`, response.ok);

      if (!response.ok) {
        const errorText = await response.text();
        console.error(`[${requestId}] FRONTEND: API error response:`, errorText);
        throw new Error(`API Error ${response.status}: ${errorText}`);
      }

      console.log(`[${requestId}] FRONTEND: Parsing response JSON...`);
      const savedMindmap = await response.json();
      console.log(`[${requestId}] FRONTEND: Generated and saved mindmap:`, savedMindmap);
      console.log(`[${requestId}] FRONTEND: Mindmap ID:`, savedMindmap.id);

      // Navigate to view page using the database ID
      console.log(`[${requestId}] FRONTEND: Navigating to /mindmap/${savedMindmap.id}`);
      setLocation(`/mindmap/${savedMindmap.id}`);

      toast({
        title: "Mind map created!",
        description: "Your mind map has been generated successfully."
      });

      console.log(`[${requestId}] FRONTEND: Success! Process completed`);

    } catch (error: any) {
      console.error(`[${requestId}] FRONTEND: Error in mind map generation:`, error);
      console.error(`[${requestId}] FRONTEND: Error name:`, error.name);
      console.error(`[${requestId}] FRONTEND: Error message:`, error.message);
      console.error(`[${requestId}] FRONTEND: Error stack:`, error.stack);

      let errorMessage = "Failed to generate mind map. Please try again.";
      
      if (error.name === 'AbortError') {
        errorMessage = "Request timed out. Please check your connection and try again.";
      } else if (error.message.includes('Authentication')) {
        errorMessage = "Authentication failed. Please sign in again.";
        setLocation('/auth');
        return;
      } else if (error.message.includes('API Error')) {
        errorMessage = error.message;
      }

      toast({
        title: "Generation failed",
        description: errorMessage,
        variant: "destructive"
      });
    } finally {
      console.log(`[${requestId}] FRONTEND: Setting loading state to false`);
      setIsGenerating(false);
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <Header />

      <main className="container mx-auto px-4 py-8">
        <div className="max-w-4xl mx-auto">
          <div className="mb-6">
            <Button
              variant="ghost"
              onClick={() => setLocation('/')}
              className="mb-4"
            >
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back to Home
            </Button>

            <h1 className="text-4xl font-bold bg-gradient-to-r from-primary to-primary/60 bg-clip-text text-transparent mb-2">
              Create Mind Map
            </h1>
            <p className="text-xl text-muted-foreground">
              Transform your ideas into visual mind maps with AI
            </p>
          </div>

          <Card>
            <CardHeader>
              <CardTitle>Generate Your Mind Map</CardTitle>
              <CardDescription>
                Choose your input method: type text, upload files, or use voice input
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Input Method Tabs */}
              <div className="flex gap-2 p-1 bg-muted rounded-lg">
                <Button
                  variant={activeTab === 'text' ? 'default' : 'ghost'}
                  size="sm"
                  onClick={() => setActiveTab('text')}
                  className="flex-1"
                >
                  <Type className="w-4 h-4 mr-2" />
                  Text Input
                </Button>
                <Button
                  variant={activeTab === 'file' ? 'default' : 'ghost'}
                  size="sm"
                  onClick={() => setActiveTab('file')}
                  className="flex-1"
                >
                  <FileText className="w-4 h-4 mr-2" />
                  File Upload
                </Button>
                <Button
                  variant={activeTab === 'voice' ? 'default' : 'ghost'}
                  size="sm"
                  onClick={() => setActiveTab('voice')}
                  className="flex-1"
                >
                  <Mic className="w-4 h-4 mr-2" />
                  Voice Input
                </Button>
              </div>

              {/* Text Input Tab */}
              {activeTab === 'text' && (
                <div className="space-y-4">
                  <div className="space-y-2">
                    <label htmlFor="text" className="text-sm font-medium">
                      Your Ideas or Text
                    </label>
                    <Textarea
                      id="text"
                      placeholder="Enter your ideas, notes, or any text you want to transform into a mind map..."
                      value={text}
                      onChange={(e) => setText(e.target.value)}
                      className="min-h-[300px] resize-none"
                    />
                  </div>
                </div>
              )}

              {/* File Upload Tab */}
              {activeTab === 'file' && (
                <div className="space-y-4">
                  <div
                    {...getRootProps()}
                    className={`border-2 border-dashed rounded-lg p-8 text-center cursor-pointer transition-colors ${
                      isDragActive
                        ? 'border-primary bg-primary/5'
                        : 'border-muted-foreground/25 hover:border-primary/50'
                    }`}
                  >
                    <input {...getInputProps()} />
                    <Upload className="w-12 h-12 mx-auto mb-4 text-muted-foreground" />
                    <h3 className="text-lg font-medium mb-2">
                      {isDragActive ? 'Drop files here' : 'Upload Documents'}
                    </h3>
                    <p className="text-muted-foreground mb-4">
                      Drag & drop PDF, TXT, or DOCX files here, or click to browse
                    </p>
                    <p className="text-xs text-muted-foreground">
                      Maximum file size: 10MB
                    </p>
                  </div>

                  {/* Upload Progress */}
                  {uploadedFiles.length > 0 && (
                    <div className="space-y-2">
                      <h4 className="text-sm font-medium">Uploaded Files:</h4>
                      {uploadedFiles.map((file, index) => (
                        <div key={index} className="flex items-center gap-3 p-3 border rounded-lg">
                          <FileText className="w-4 h-4 text-muted-foreground" />
                          <span className="text-sm flex-1">{file.file.name}</span>
                          <span className={`text-xs px-2 py-1 rounded ${
                            file.status === 'completed' ? 'bg-green-100 text-green-700' :
                            file.status === 'error' ? 'bg-red-100 text-red-700' :
                            'bg-blue-100 text-blue-700'
                          }`}>
                            {file.status}
                          </span>
                        </div>
                      ))}
                    </div>
                  )}

                  {/* Combined Text Area for Files */}
                  <div className="space-y-2">
                    <label htmlFor="text" className="text-sm font-medium">
                      Extracted Text Content
                    </label>
                    <Textarea
                      id="text"
                      placeholder="File content will appear here after upload..."
                      value={text}
                      onChange={(e) => setText(e.target.value)}
                      className="min-h-[200px] resize-none"
                    />
                  </div>
                </div>
              )}

              {/* Voice Input Tab */}
              {activeTab === 'voice' && (
                <div className="space-y-4">
                  <div className="text-center py-8">
                    <Mic className="w-16 h-16 mx-auto mb-4 text-muted-foreground" />
                    <h3 className="text-lg font-medium mb-2">Voice Input</h3>
                    <p className="text-muted-foreground mb-6">
                      Click the button below to start recording your voice
                    </p>
                    <VoiceInput 
                      onTranscription={handleVoiceTranscription}
                      disabled={isGenerating}
                    />
                  </div>

                  {/* Combined Text Area for Voice */}
                  <div className="space-y-2">
                    <label htmlFor="text" className="text-sm font-medium">
                      Transcribed Text
                    </label>
                    <Textarea
                      id="text"
                      placeholder="Voice transcription will appear here..."
                      value={text}
                      onChange={(e) => setText(e.target.value)}
                      className="min-h-[200px] resize-none"
                      readOnly // Make the voice transcription box read-only
                    />
                  </div>
                </div>
              )}

              {/* Generate Button */}
              <Button
                onClick={handleGenerate}
                disabled={isGenerating || !text.trim()}
                className="w-full"
                size="lg"
              >
                {isGenerating ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Generating Mind Map...
                  </>
                ) : (
                  'Generate Mind Map'
                )}
              </Button>
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  );
}