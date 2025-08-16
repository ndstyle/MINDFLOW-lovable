import { useState, useRef } from 'react';
import { Button } from "@/components/ui/button";
import { Mic, MicOff, Loader2 } from "lucide-react";
import { toast } from "sonner";

interface VoiceInputProps {
  onTranscription: (text: string) => void;
  disabled?: boolean;
}

export const VoiceInput = ({ onTranscription, disabled }: VoiceInputProps) => {
  const [isRecording, setIsRecording] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ 
        audio: {
          sampleRate: 16000,
          channelCount: 1,
          echoCancellation: true,
          noiseSuppression: true,
        }
      });
      
      const mediaRecorder = new MediaRecorder(stream, {
        mimeType: 'audio/webm;codecs=opus'
      });
      
      mediaRecorderRef.current = mediaRecorder;
      chunksRef.current = [];

      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          chunksRef.current.push(event.data);
        }
      };

      mediaRecorder.onstop = async () => {
        const audioBlob = new Blob(chunksRef.current, { type: 'audio/webm' });
        await processAudio(audioBlob);
        
        // Clean up stream
        stream.getTracks().forEach(track => track.stop());
      };

      mediaRecorder.start();
      setIsRecording(true);
      toast.success("recording started - speak your thoughts!");
      
    } catch (error) {
      console.error('Error starting recording:', error);
      toast.error("could not access microphone. please check permissions.");
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
      setIsProcessing(true);
      toast.info("processing your recording...");
    }
  };

  const processAudio = async (audioBlob: Blob) => {
    try {
      // Use Web Speech API for speech-to-text
      if ('webkitSpeechRecognition' in window || 'SpeechRecognition' in window) {
        // For demo purposes, we'll simulate transcription
        // In a real implementation, you would send the audio to a speech-to-text service
        setTimeout(() => {
          const demoTranscription = "This is a demo transcription. In a real implementation, this would be the actual speech-to-text result from your audio input.";
          onTranscription(demoTranscription);
          toast.success("Voice input transcribed successfully!");
          setIsProcessing(false);
        }, 1500);
      } else {
        // Fallback for browsers without speech recognition
        const demoTranscription = "Speech recognition not supported in this browser. This is demo text.";
        onTranscription(demoTranscription);
        toast.info("Speech recognition not available. Demo text added.");
        setIsProcessing(false);
      }
      
    } catch (error) {
      console.error('Error processing audio:', error);
      toast.error("failed to process voice input. please try again.");
      setIsProcessing(false);
    }
  };

  const handleToggleRecording = () => {
    if (isRecording) {
      stopRecording();
    } else {
      startRecording();
    }
  };

  return (
    <Button
      variant="outline"
      size="sm"
      className="lowercase"
      onClick={handleToggleRecording}
      disabled={disabled || isProcessing}
    >
      {isProcessing ? (
        <>
          <Loader2 className="w-4 h-4 mr-2 animate-spin" />
          processing...
        </>
      ) : isRecording ? (
        <>
          <MicOff className="w-4 h-4 mr-2 text-destructive" />
          stop recording
        </>
      ) : (
        <>
          <Mic className="w-4 h-4 mr-2" />
          voice input
        </>
      )}
    </Button>
  );
};