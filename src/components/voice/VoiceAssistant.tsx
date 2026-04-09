import { useState } from 'react';
import { Mic, MicOff, X, Check, Loader2, Volume2, VolumeX } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { useVoiceAssistant, AssistantState } from '@/hooks/useVoiceAssistant';
import { cn } from '@/lib/utils';

const stateLabels: Record<AssistantState, string> = {
  idle: 'Listo',
  listening: 'Escuchando...',
  processing: 'Procesando...',
  confirming: 'Confirmar acción',
  speaking: 'Hablando...',
};

const stateColors: Record<AssistantState, string> = {
  idle: 'bg-muted',
  listening: 'bg-red-500/20 text-red-500',
  processing: 'bg-amber-500/20 text-amber-500',
  confirming: 'bg-primary/20 text-primary',
  speaking: 'bg-emerald-500/20 text-emerald-500',
};

export function VoiceAssistant() {
  const [isOpen, setIsOpen] = useState(false);
  const {
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
  } = useVoiceAssistant();

  if (!isSupported) {
    return null;
  }

  const handleMicClick = () => {
    console.log('VoiceAssistant: Mic clicked, current state:', state, 'isSupported:', isSupported);
    if (state === 'listening') {
      stopListening();
    } else if (state === 'speaking') {
      stopSpeaking();
    } else if (state === 'idle') {
      console.log('VoiceAssistant: Starting listening...');
      startListening();
    }
  };

  const getToolLabel = (tool: string) => {
    switch (tool) {
      case 'create_task':
        return 'Crear Tarea';
      case 'create_customer':
        return 'Crear Cliente';
      case 'move_customer_stage':
        return 'Mover Cliente';
      default:
        return tool;
    }
  };

  // Floating button when closed
  if (!isOpen) {
    return (
      <Button
        onClick={() => setIsOpen(true)}
        size="lg"
        className="fixed bottom-6 right-6 h-14 w-14 rounded-full shadow-lg bg-primary hover:bg-primary/90 z-50"
      >
        <Mic className="h-6 w-6" />
      </Button>
    );
  }

  return (
    <Card className="fixed bottom-6 right-6 w-80 shadow-2xl border-border/50 bg-card/95 backdrop-blur-sm z-50">
      <CardContent className="p-4 space-y-4">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="h-8 w-8 rounded-lg bg-gradient-to-br from-primary to-primary/60 flex items-center justify-center">
              <Mic className="h-4 w-4 text-primary-foreground" />
            </div>
            <div>
              <p className="text-sm font-medium">Portal Assistant</p>
              <Badge variant="secondary" className={cn("text-[10px]", stateColors[state])}>
                {stateLabels[state]}
              </Badge>
            </div>
          </div>
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8"
            onClick={() => setIsOpen(false)}
          >
            <X className="h-4 w-4" />
          </Button>
        </div>

        {/* Transcript */}
        {transcript && (
          <div className="p-3 rounded-lg bg-muted/50 border border-border/50">
            <p className="text-xs text-muted-foreground mb-1">Tu mensaje:</p>
            <p className="text-sm">{transcript}</p>
          </div>
        )}

        {/* Response */}
        {response && (
          <div className="p-3 rounded-lg bg-primary/5 border border-primary/20">
            <p className="text-xs text-muted-foreground mb-1">Respuesta:</p>
            <p className="text-sm">{response}</p>
          </div>
        )}

        {/* Pending Action Confirmation */}
        {state === 'confirming' && pendingAction && (
          <div className="p-3 rounded-lg bg-amber-500/10 border border-amber-500/30 space-y-3">
            <div className="flex items-center gap-2">
              <Badge variant="outline" className="text-xs">
                {getToolLabel(pendingAction.tool)}
              </Badge>
            </div>
            <div className="text-xs text-muted-foreground">
              <pre className="whitespace-pre-wrap font-mono">
                {JSON.stringify(pendingAction.args, null, 2)}
              </pre>
            </div>
            <div className="flex gap-2">
              <Button
                size="sm"
                className="flex-1"
                onClick={confirmAction}
              >
                <Check className="h-4 w-4 mr-1" />
                Confirmar
              </Button>
              <Button
                size="sm"
                variant="outline"
                className="flex-1"
                onClick={cancelAction}
              >
                <X className="h-4 w-4 mr-1" />
                Cancelar
              </Button>
            </div>
          </div>
        )}

        {/* Main Action Button */}
        <div className="flex justify-center pt-2">
          <Button
            size="lg"
            variant={state === 'listening' ? 'destructive' : 'default'}
            className={cn(
              "h-16 w-16 rounded-full transition-all",
              state === 'listening' && "animate-pulse",
              state === 'processing' && "opacity-50 cursor-not-allowed"
            )}
            onClick={handleMicClick}
            disabled={state === 'processing' || state === 'confirming'}
          >
            {state === 'processing' ? (
              <Loader2 className="h-6 w-6 animate-spin" />
            ) : state === 'listening' ? (
              <MicOff className="h-6 w-6" />
            ) : state === 'speaking' ? (
              <VolumeX className="h-6 w-6" />
            ) : (
              <Mic className="h-6 w-6" />
            )}
          </Button>
        </div>

        {/* Instructions */}
        <p className="text-xs text-center text-muted-foreground">
          {state === 'idle' && 'Presioná el micrófono para hablar'}
          {state === 'listening' && 'Hablá ahora...'}
          {state === 'processing' && 'Procesando tu mensaje...'}
          {state === 'confirming' && 'Confirmá o cancelá la acción'}
          {state === 'speaking' && 'Tocá para silenciar'}
        </p>
      </CardContent>
    </Card>
  );
}
