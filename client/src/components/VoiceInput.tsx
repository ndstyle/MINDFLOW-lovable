
import { useState, useRef } from 'react';
import { Button } from "@/components/ui/button";
import { Mic, MicOff, Loader2 } from "lucide-react";
import { toast } from "sonner";

interface VoiceInputProps {
  onTranscription: (text: string) => void;
  disabled?: boolean;
}

declare global {
  interface Window {
    SpeechRecognition: any;
    webkitSpeechRecognition: any;
  }
}

export const VoiceInput = ({ onTranscription, disabled }: VoiceInputProps) => {
  const [isListening, setIsListening] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const recognitionRef = useRef<any>(null);

  const startListening = async () => {
    try {
      const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
      
      if (!SpeechRecognition) {
        toast.error("Speech recognition not supported in this browser");
        return;
      }

      const recognition = new SpeechRecognition();
      recognitionRef.current = recognition;

      recognition.continuous = false;
      recognition.interimResults = false;
      recognition.lang = 'en-US';
      recognition.maxAlternatives = 1;

      recognition.onstart = () => {
        setIsListening(true);
        toast.success("Listening... speak now!");
      };

      recognition.onresult = (event: any) => {
        const transcript = event.results[0][0].transcript;
        console.log('Speech recognition result:', transcript);
        onTranscription(transcript);
        toast.success("Voice input transcribed successfully!");
      };

      recognition.onerror = (event: any) => {
        console.error('Speech recognition error:', event.error);
        setIsListening(false);
        setIsProcessing(false);
        
        if (event.error === 'no-speech') {
          toast.error("No speech detected. Please try again.");
        } else if (event.error === 'not-allowed') {
          toast.error("Microphone access denied. Please allow microphone permissions.");
        } else {
          toast.error("Speech recognition failed. Please try again.");
        }
      };

      recognition.onend = () => {
        setIsListening(false);
        setIsProcessing(false);
      };

      recognition.start();
      
    } catch (error) {
      console.error('Error starting speech recognition:', error);
      toast.error("Could not start voice input. Please check microphone permissions.");
      setIsListening(false);
      setIsProcessing(false);
    }
  };

  const stopListening = () => {
    if (recognitionRef.current && isListening) {
      recognitionRef.current.stop();
      setIsListening(false);
      setIsProcessing(true);
      toast.info("Processing your speech...");
    }
  };

  const handleToggleListening = () => {
    if (isListening) {
      stopListening();
    } else {
      startListening();
    }
  };

  return (
    <Button
      variant="outline"
      size="sm"
      className="lowercase"
      onClick={handleToggleListening}
      disabled={disabled || isProcessing}
    >
      {isProcessing ? (
        <>
          <Loader2 className="w-4 h-4 mr-2 animate-spin" />
          processing...
        </>
      ) : isListening ? (
        <>
          <MicOff className="w-4 h-4 mr-2 text-destructive" />
          stop listening
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
