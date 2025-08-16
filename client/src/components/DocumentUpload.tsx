import React, { useState, useCallback } from 'react';
import { useDropzone } from 'react-dropzone';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { AlertCircle, CheckCircle, Upload, FileText, X } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/lib/supabase';
import { useLocation } from 'wouter';

interface UploadedFile {
  file: File;
  progress: number;
  status: 'uploading' | 'processing' | 'completed' | 'error';
  documentId?: string;
  error?: string;
}

export function DocumentUpload() {
  const [uploadedFiles, setUploadedFiles] = useState<UploadedFile[]>([]);
  const { toast } = useToast();
  const [, setLocation] = useLocation();

  const onDrop = useCallback(async (acceptedFiles: File[]) => {
    // Validate files
    const validFiles = acceptedFiles.filter(file => {
      const validTypes = [
        'application/pdf',
        'text/plain', 
        'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
      ];
      
      if (!validTypes.includes(file.type)) {
        toast({
          title: "Invalid file type",
          description: `${file.name} is not a supported file type. Only PDF, TXT, and DOCX files are allowed.`,
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

    // Add files to upload queue
    const newUploads: UploadedFile[] = validFiles.map(file => ({
      file,
      progress: 0,
      status: 'uploading' as const
    }));

    setUploadedFiles(prev => [...prev, ...newUploads]);

    // Upload each file
    for (let i = 0; i < validFiles.length; i++) {
      const file = validFiles[i];
      const uploadIndex = uploadedFiles.length + i;
      
      try {
        await uploadFile(file, uploadIndex);
      } catch (error) {
        console.error('Upload error:', error);
      }
    }
  }, [uploadedFiles.length, toast]);

  const uploadFile = async (file: File, index: number) => {
    try {
      // Get current session
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        throw new Error('Not authenticated');
      }

      // Create form data
      const formData = new FormData();
      formData.append('file', file);

      // Simulate progress updates
      const progressInterval = setInterval(() => {
        setUploadedFiles(prev => prev.map((upload, i) => 
          i === index && upload.progress < 90 
            ? { ...upload, progress: upload.progress + 10 }
            : upload
        ));
      }, 200);

      // Upload file
      const response = await fetch('/api/documents/upload', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${session.access_token}`
        },
        body: formData
      });

      clearInterval(progressInterval);

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Upload failed');
      }

      const result = await response.json();

      // Update file status
      setUploadedFiles(prev => prev.map((upload, i) => 
        i === index 
          ? { 
              ...upload, 
              progress: 100, 
              status: 'processing' as const,
              documentId: result.documentId 
            }
          : upload
      ));

      toast({
        title: "Upload successful!",
        description: `${file.name} has been uploaded and is being processed.`,
      });

      // Poll for processing completion
      if (result.documentId) {
        pollProcessingStatus(result.documentId, index);
      }

    } catch (error) {
      setUploadedFiles(prev => prev.map((upload, i) => 
        i === index 
          ? { 
              ...upload, 
              status: 'error' as const,
              error: error instanceof Error ? error.message : 'Upload failed'
            }
          : upload
      ));

      toast({
        title: "Upload failed",
        description: error instanceof Error ? error.message : 'An unexpected error occurred.',
        variant: "destructive"
      });
    }
  };

  const pollProcessingStatus = async (documentId: string, index: number) => {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) return;

      const checkStatus = async () => {
        const response = await fetch(`/api/documents/${documentId}`, {
          headers: {
            'Authorization': `Bearer ${session.access_token}`
          }
        });

        if (response.ok) {
          const document = await response.json();
          
          if (document.status === 'completed') {
            setUploadedFiles(prev => prev.map((upload, i) => 
              i === index ? { ...upload, status: 'completed' as const } : upload
            ));

            toast({
              title: "Processing complete!",
              description: `${document.title} is ready for learning.`,
            });

            // Auto-navigate to document after a delay
            setTimeout(() => {
              setLocation(`/document/${documentId}`);
            }, 2000);

          } else if (document.status === 'failed') {
            setUploadedFiles(prev => prev.map((upload, i) => 
              i === index 
                ? { ...upload, status: 'error' as const, error: 'Processing failed' }
                : upload
            ));
          } else {
            // Still processing, check again
            setTimeout(checkStatus, 3000);
          }
        }
      };

      // Start polling after a short delay
      setTimeout(checkStatus, 2000);

    } catch (error) {
      console.error('Status polling error:', error);
    }
  };

  const removeFile = (index: number) => {
    setUploadedFiles(prev => prev.filter((_, i) => i !== index));
  };

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      'application/pdf': ['.pdf'],
      'text/plain': ['.txt'],
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document': ['.docx']
    },
    maxSize: 10 * 1024 * 1024, // 10MB
    multiple: true
  });

  return (
    <div className="container mx-auto px-4 py-8 max-w-4xl">
      <div className="text-center mb-8">
        <h1 className="text-3xl font-bold mb-2 lowercase">upload documents</h1>
        <p className="text-muted-foreground lowercase">
          transform your pdf, txt, or docx files into interactive learning experiences
        </p>
      </div>

      <Card className="mb-6">
        <CardContent className="p-6">
          <div
            {...getRootProps()}
            className={`border-2 border-dashed rounded-lg p-8 text-center cursor-pointer transition-colors ${
              isDragActive 
                ? 'border-primary bg-primary/5' 
                : 'border-muted-foreground/25 hover:border-primary/50'
            }`}
          >
            <input {...getInputProps()} />
            <Upload className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
            
            {isDragActive ? (
              <div>
                <p className="text-lg font-medium lowercase">drop files here</p>
                <p className="text-sm text-muted-foreground lowercase">
                  release to upload your documents
                </p>
              </div>
            ) : (
              <div>
                <p className="text-lg font-medium lowercase">drag & drop files here</p>
                <p className="text-sm text-muted-foreground mb-4 lowercase">
                  or click to browse your files
                </p>
                <Button variant="outline" className="lowercase">
                  choose files
                </Button>
              </div>
            )}
            
            <div className="mt-4 text-xs text-muted-foreground space-y-1">
              <p>• Supported formats: PDF, TXT, DOCX</p>
              <p>• Maximum file size: 10MB</p>
              <p>• PDF files limited to 10 pages</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {uploadedFiles.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="lowercase">upload progress</CardTitle>
            <CardDescription className="lowercase">
              track your document uploads and processing status
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {uploadedFiles.map((upload, index) => (
              <div key={index} className="flex items-center gap-4 p-4 border rounded-lg">
                <FileText className="w-8 h-8 text-muted-foreground flex-shrink-0" />
                
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between mb-2">
                    <p className="font-medium truncate">{upload.file.name}</p>
                    <div className="flex items-center gap-2">
                      {upload.status === 'uploading' && (
                        <span className="text-sm text-muted-foreground">uploading...</span>
                      )}
                      {upload.status === 'processing' && (
                        <span className="text-sm text-muted-foreground">processing...</span>
                      )}
                      {upload.status === 'completed' && (
                        <CheckCircle className="w-5 h-5 text-green-500" />
                      )}
                      {upload.status === 'error' && (
                        <AlertCircle className="w-5 h-5 text-red-500" />
                      )}
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => removeFile(index)}
                        className="h-8 w-8 p-0"
                      >
                        <X className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                  
                  {(upload.status === 'uploading' || upload.status === 'processing') && (
                    <Progress value={upload.progress} className="w-full" />
                  )}
                  
                  {upload.status === 'error' && upload.error && (
                    <p className="text-sm text-red-600">{upload.error}</p>
                  )}
                  
                  {upload.status === 'completed' && upload.documentId && (
                    <div className="flex items-center gap-2 mt-2">
                      <Button
                        size="sm"
                        onClick={() => setLocation(`/document/${upload.documentId}`)}
                        className="lowercase"
                      >
                        view document
                      </Button>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </CardContent>
        </Card>
      )}
    </div>
  );
}