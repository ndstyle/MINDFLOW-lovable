import { useState, useCallback } from 'react';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Upload, FileText, AlertCircle, CheckCircle } from 'lucide-react';
import { toast } from 'sonner';
import { useMutation } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';
import { useLocation } from 'wouter';

interface UploadResult {
  id: string;
  title: string;
  status: string;
}

export default function UploadPage() {
  const [dragActive, setDragActive] = useState(false);
  const [uploadResult, setUploadResult] = useState<UploadResult | null>(null);
  const [, setLocation] = useLocation();

  const uploadMutation = useMutation({
    mutationFn: async (file: File) => {
      const { data: { session }, error } = await supabase.auth.getSession();
      if (!session) throw new Error('Not authenticated');

      const formData = new FormData();
      formData.append('file', file);

      const response = await fetch('/api/documents/upload', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${session.access_token}`
        },
        body: formData
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Upload failed');
      }

      return response.json();
    },
    onSuccess: (data) => {
      setUploadResult(data);
      toast.success('Document uploaded successfully!');
      // Poll for processing completion
      pollProcessingStatus(data.id);
    },
    onError: (error) => {
      toast.error(error instanceof Error ? error.message : 'Upload failed');
    }
  });

  const pollProcessingStatus = async (documentId: string) => {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) return;

    const checkStatus = async () => {
      try {
        const response = await fetch(`/api/documents/${documentId}/status`, {
          headers: {
            'Authorization': `Bearer ${session.access_token}`
          }
        });
        
        if (response.ok) {
          const { status } = await response.json();
          setUploadResult(prev => prev ? { ...prev, status } : null);
          
          if (status === 'completed') {
            toast.success('Document processing completed!');
          } else if (status === 'failed') {
            toast.error('Document processing failed');
          } else if (status === 'processing') {
            // Continue polling
            setTimeout(checkStatus, 2000);
          }
        }
      } catch (error) {
        console.error('Error checking status:', error);
      }
    };

    checkStatus();
  };

  const handleDrag = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFile(e.dataTransfer.files[0]);
    }
  }, []);

  const handleFileInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      handleFile(e.target.files[0]);
    }
  };

  const handleFile = (file: File) => {
    // Validate file type
    const allowedTypes = [
      'application/pdf',
      'text/plain',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
    ];
    
    if (!allowedTypes.includes(file.type)) {
      toast.error('Invalid file type. Only PDF, TXT, and DOCX files are allowed.');
      return;
    }

    // Validate file size (10MB)
    if (file.size > 10 * 1024 * 1024) {
      toast.error('File size must be less than 10MB.');
      return;
    }

    uploadMutation.mutate(file);
  };

  const getStatusDisplay = (status: string) => {
    switch (status) {
      case 'processing':
        return (
          <div className="flex items-center gap-2 text-yellow-600">
            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-yellow-600"></div>
            <span>Processing document...</span>
          </div>
        );
      case 'completed':
        return (
          <div className="flex items-center gap-2 text-green-600">
            <CheckCircle className="w-4 h-4" />
            <span>Processing completed!</span>
          </div>
        );
      case 'failed':
        return (
          <div className="flex items-center gap-2 text-red-600">
            <AlertCircle className="w-4 h-4" />
            <span>Processing failed</span>
          </div>
        );
      default:
        return null;
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-6 py-8">
        <div className="max-w-4xl mx-auto space-y-8">
          {/* Header */}
          <div className="text-center space-y-4">
            <h1 className="text-3xl font-bold lowercase">upload document</h1>
            <p className="text-muted-foreground lowercase max-w-2xl mx-auto">
              upload a PDF (≤10 pages), TXT, or DOCX file to generate an interactive mind map.
              only English documents are supported.
            </p>
          </div>

          {/* Upload Area */}
          <Card className="max-w-2xl mx-auto">
            <CardHeader>
              <CardTitle className="lowercase">select your document</CardTitle>
              <CardDescription className="lowercase">
                drag and drop or click to browse
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div
                className={`border-2 border-dashed rounded-lg p-12 text-center transition-colors ${
                  dragActive
                    ? 'border-primary bg-primary/5'
                    : 'border-muted-foreground/25 hover:border-primary/50'
                }`}
                onDragEnter={handleDrag}
                onDragLeave={handleDrag}
                onDragOver={handleDrag}
                onDrop={handleDrop}
              >
                <Upload className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
                <div className="space-y-2">
                  <p className="text-lg font-medium lowercase">
                    drop your document here
                  </p>
                  <p className="text-muted-foreground lowercase">
                    or click to browse your files
                  </p>
                  <input
                    type="file"
                    accept=".pdf,.txt,.docx"
                    onChange={handleFileInput}
                    className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                    disabled={uploadMutation.isPending}
                  />
                </div>
              </div>
              
              {/* Upload Progress */}
              {uploadMutation.isPending && (
                <div className="mt-6 space-y-2">
                  <div className="flex items-center justify-between text-sm">
                    <span className="lowercase">uploading...</span>
                    <span>Processing</span>
                  </div>
                  <Progress value={50} className="w-full" />
                </div>
              )}

              {/* Upload Result */}
              {uploadResult && (
                <div className="mt-6 p-4 border rounded-lg space-y-4">
                  <div className="flex items-center gap-2">
                    <FileText className="w-5 h-5" />
                    <span className="font-medium lowercase">{uploadResult.title}</span>
                  </div>
                  
                  {getStatusDisplay(uploadResult.status)}
                  
                  {uploadResult.status === 'completed' && (
                    <div className="flex gap-2">
                      <Button 
                        onClick={() => setLocation(`/document/${uploadResult.id}`)}
                        className="lowercase"
                      >
                        view mind map
                      </Button>
                      <Button 
                        variant="outline" 
                        onClick={() => setLocation('/library')}
                        className="lowercase"
                      >
                        go to library
                      </Button>
                    </div>
                  )}
                </div>
              )}

              {/* File Requirements */}
              <div className="mt-6 p-4 bg-muted/50 rounded-lg">
                <h4 className="font-medium mb-2 lowercase">file requirements:</h4>
                <ul className="text-sm text-muted-foreground space-y-1 lowercase">
                  <li>• PDF files: maximum 10 pages</li>
                  <li>• Text files: plain text format (.txt)</li>
                  <li>• Word documents: modern format (.docx)</li>
                  <li>• File size: maximum 10MB</li>
                  <li>• Language: English only</li>
                  <li>• Content: approximately 5,000 words maximum</li>
                </ul>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}