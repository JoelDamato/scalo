import { useState, useCallback, useRef, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

// Type declarations for Web Speech API
interface SpeechRecognitionEvent extends Event {
  results: SpeechRecognitionResultList;
}

interface SpeechRecognitionErrorEvent extends Event {
  error: string;
}

interface SpeechRecognitionInstance extends EventTarget {
  lang: string;
  interimResults: boolean;
  maxAlternatives: number;
  onstart: (() => void) | null;
  onresult: ((event: SpeechRecognitionEvent) => void) | null;
  onerror: ((event: SpeechRecognitionErrorEvent) => void) | null;
  onend: (() => void) | null;
  start: () => void;
  stop: () => void;
  abort: () => void;
}

declare global {
  interface Window {
    SpeechRecognition: new () => SpeechRecognitionInstance;
    webkitSpeechRecognition: new () => SpeechRecognitionInstance;
  }
}

export type AssistantState = 'idle' | 'listening' | 'processing' | 'confirming' | 'speaking';

export interface PendingAction {
  tool: string;
  args: Record<string, unknown>;
  message: string;
}

export function useVoiceAssistant() {
  const [state, setState] = useState<AssistantState>('idle');
  const [transcript, setTranscript] = useState('');
  const [response, setResponse] = useState('');
  const [pendingAction, setPendingAction] = useState<PendingAction | null>(null);
  const [isSupported, setIsSupported] = useState(true);
  
  const recognitionRef = useRef<SpeechRecognitionInstance | null>(null);
  const synthRef = useRef<SpeechSynthesisUtterance | null>(null);

  // Check browser support
  useEffect(() => {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    console.log('VoiceAssistant: Checking browser support', { 
      SpeechRecognition: !!SpeechRecognition,
      webkitSpeechRecognition: !!window.webkitSpeechRecognition 
    });
    if (!SpeechRecognition) {
      setIsSupported(false);
      console.warn('Speech Recognition not supported');
    }
  }, []);

  const speak = useCallback((text: string) => {
    if (!window.speechSynthesis) return;
    
    // Cancel any ongoing speech
    window.speechSynthesis.cancel();
    
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = 'es-AR';
    utterance.rate = 1.1;
    
    utterance.onstart = () => setState('speaking');
    utterance.onend = () => setState('idle');
    utterance.onerror = () => setState('idle');
    
    synthRef.current = utterance;
    window.speechSynthesis.speak(utterance);
  }, []);

  const stopSpeaking = useCallback(() => {
    window.speechSynthesis?.cancel();
    setState('idle');
  }, []);

  const processMessage = useCallback(async (message: string) => {
    setState('processing');
    setResponse('');
    
    try {
      const { data, error } = await supabase.functions.invoke('assistant', {
        body: { message }
      });

      if (error) throw error;

      if (data.type === 'tool_call') {
        // AI wants to execute an action - show confirmation
        setPendingAction({
          tool: data.tool,
          args: data.args,
          message: data.message,
        });
        setResponse(data.message);
        setState('confirming');
        speak(data.message);
      } else {
        // Regular message response
        setResponse(data.message);
        setState('idle');
        speak(data.message);
      }
    } catch (error) {
      console.error('Assistant error:', error);
      const errorMsg = 'Hubo un error, intentá de nuevo.';
      setResponse(errorMsg);
      setState('idle');
      toast.error(errorMsg);
    }
  }, [speak]);

  const startListening = useCallback(() => {
    console.log('VoiceAssistant: startListening called');
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SpeechRecognition) {
      console.error('VoiceAssistant: SpeechRecognition not available');
      toast.error('Tu navegador no soporta reconocimiento de voz');
      return;
    }

    // Stop any ongoing speech
    stopSpeaking();
    setPendingAction(null);
    
    const recognition = new SpeechRecognition();
    recognition.lang = 'es-AR';
    recognition.interimResults = true;
    recognition.maxAlternatives = 1;

    recognition.onstart = () => {
      setState('listening');
      setTranscript('');
      setResponse('');
    };

    recognition.onresult = (event) => {
      const result = event.results[event.results.length - 1];
      const text = result[0].transcript;
      setTranscript(text);
      
      if (result.isFinal) {
        processMessage(text);
      }
    };

    recognition.onerror = (event) => {
      console.error('Speech recognition error:', event.error);
      setState('idle');
      
      if (event.error === 'not-allowed') {
        toast.error('Permiso de micrófono denegado');
      } else if (event.error !== 'aborted') {
        toast.error('Error de reconocimiento de voz');
      }
    };

    recognition.onend = () => {
      if (state === 'listening') {
        setState('idle');
      }
    };

    recognitionRef.current = recognition;
    recognition.start();
  }, [processMessage, state, stopSpeaking]);

  const stopListening = useCallback(() => {
    recognitionRef.current?.stop();
    setState('idle');
  }, []);

  const confirmAction = useCallback(async () => {
    if (!pendingAction) return;
    
    setState('processing');
    
    try {
      const { data: { session } } = await supabase.auth.getSession();
      
      const { data, error } = await supabase.functions.invoke('assistant-execute', {
        body: { 
          tool: pendingAction.tool, 
          args: pendingAction.args 
        },
        headers: {
          Authorization: `Bearer ${session?.access_token}`,
        }
      });

      if (error) throw error;

      if (data.success) {
        setResponse(data.message);
        speak(data.message);
        toast.success(data.message);
      } else {
        setResponse(data.message);
        speak(data.message);
        toast.error(data.message);
      }
      
      setPendingAction(null);
      setState('idle');
    } catch (error) {
      console.error('Execute error:', error);
      const errorMsg = 'Error al ejecutar la acción';
      setResponse(errorMsg);
      toast.error(errorMsg);
      setState('idle');
    }
  }, [pendingAction, speak]);

  const cancelAction = useCallback(() => {
    setPendingAction(null);
    setResponse('');
    setState('idle');
    speak('Cancelado');
  }, [speak]);

  return {
    state,
    transcript,
    response,
    pendingAction,
    isSupported,
    startListening,
    stopListening,
    confirmAction,
    cancelAction,
    stopSpeaking,
  };
}
