import { useState, useCallback, useRef, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

export interface ExtractedTask {
  title: string;
  description?: string;
}

export type VoiceTaskState = 'idle' | 'recording' | 'processing' | 'confirming';

export function useVoiceTaskCreator() {
  const [state, setState] = useState<VoiceTaskState>('idle');
  const [transcript, setTranscript] = useState('');
  const [extractedTasks, setExtractedTasks] = useState<ExtractedTask[]>([]);
  const [summary, setSummary] = useState('');
  const [isSupported, setIsSupported] = useState(true);
  
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const recognitionRef = useRef<any>(null);

  // Check browser support
  useEffect(() => {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SpeechRecognition) {
      setIsSupported(false);
    }
  }, []);

  const extractTasks = useCallback(async (text: string) => {
    setState('processing');
    
    try {
      const { data, error } = await supabase.functions.invoke('extract-tasks-from-audio', {
        body: { transcript: text }
      });

      if (error) throw error;

      if (data.tasks && data.tasks.length > 0) {
        setExtractedTasks(data.tasks);
        setSummary(data.summary || '');
        setState('confirming');
      } else {
        toast.info('No encontré tareas en lo que dijiste');
        reset();
      }
    } catch (error) {
      console.error('Extract tasks error:', error);
      toast.error('Error al procesar el audio');
      reset();
    }
  }, []);

  const startRecording = useCallback(() => {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SpeechRecognition) {
      toast.error('Tu navegador no soporta reconocimiento de voz');
      return;
    }

    // Reset state
    setTranscript('');
    setExtractedTasks([]);
    setSummary('');
    
    const recognition = new SpeechRecognition();
    recognition.lang = 'es-AR';
    recognition.interimResults = true;
    recognition.maxAlternatives = 1;
    (recognition as any).continuous = true;

    recognition.onstart = () => {
      setState('recording');
    };

    recognition.onresult = (event) => {
      let finalTranscript = '';
      let interimTranscript = '';
      
      for (let i = 0; i < event.results.length; i++) {
        const result = event.results[i];
        if (result.isFinal) {
          finalTranscript += result[0].transcript + ' ';
        } else {
          interimTranscript += result[0].transcript;
        }
      }
      
      setTranscript(finalTranscript + interimTranscript);
    };

    recognition.onerror = (event) => {
      console.error('Speech recognition error:', event.error);
      
      if (event.error === 'not-allowed') {
        toast.error('Permiso de micrófono denegado');
      } else if (event.error !== 'aborted' && event.error !== 'no-speech') {
        toast.error('Error de reconocimiento de voz');
      }
      
      reset();
    };

    recognition.onend = () => {
      // Only process if we were recording and have transcript
      if (state === 'recording') {
        const currentTranscript = transcript;
        if (currentTranscript.trim()) {
          extractTasks(currentTranscript);
        } else {
          reset();
        }
      }
    };

    recognitionRef.current = recognition;
    recognition.start();
  }, [state, transcript, extractTasks]);

  const stopRecording = useCallback(() => {
    if (recognitionRef.current) {
      recognitionRef.current.stop();
      
      // Process the current transcript
      if (transcript.trim()) {
        extractTasks(transcript);
      } else {
        toast.info('No detecté ningún audio');
        reset();
      }
    }
  }, [transcript, extractTasks]);

  const reset = useCallback(() => {
    setState('idle');
    setTranscript('');
    setExtractedTasks([]);
    setSummary('');
    recognitionRef.current?.abort();
  }, []);

  const updateTask = useCallback((index: number, updates: Partial<ExtractedTask>) => {
    setExtractedTasks(prev => prev.map((task, i) => 
      i === index ? { ...task, ...updates } : task
    ));
  }, []);

  const removeTask = useCallback((index: number) => {
    setExtractedTasks(prev => prev.filter((_, i) => i !== index));
  }, []);

  return {
    state,
    transcript,
    extractedTasks,
    summary,
    isSupported,
    startRecording,
    stopRecording,
    reset,
    updateTask,
    removeTask,
  };
}
