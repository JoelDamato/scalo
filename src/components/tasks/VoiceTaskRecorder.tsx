import { useState } from 'react';
import { Mic, MicOff, X, Check, Loader2, Trash2, Edit2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { useVoiceTaskCreator, VoiceTaskState, ExtractedTask } from '@/hooks/useVoiceTaskCreator';
import { useCreateTask } from '@/hooks/useData';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';

const stateLabels: Record<VoiceTaskState, string> = {
  idle: 'Listo para grabar',
  recording: 'Grabando...',
  processing: 'Extrayendo tareas...',
  confirming: 'Confirmar tareas',
};

interface VoiceTaskRecorderProps {
  mode?: 'project' | 'internal';
  projectId?: string;
}

export function VoiceTaskRecorder({ mode = 'internal', projectId }: VoiceTaskRecorderProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [editingIndex, setEditingIndex] = useState<number | null>(null);
  
  const {
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
  } = useVoiceTaskCreator();

  const createTask = useCreateTask();

  if (!isSupported) {
    return null;
  }

  const handleMicClick = () => {
    if (state === 'recording') {
      stopRecording();
    } else if (state === 'idle') {
      startRecording();
    }
  };

  const handleClose = () => {
    reset();
    setIsOpen(false);
    setEditingIndex(null);
  };

  const handleCreateTasks = async () => {
    if (extractedTasks.length === 0) {
      toast.info('No hay tareas para crear');
      return;
    }

    try {
      for (const task of extractedTasks) {
        await createTask.mutateAsync({
          title: task.title,
          description: task.description || undefined,
          project_id: mode === 'internal' ? null : projectId || null,
          status: 'backlog',
          is_client_visible: mode !== 'internal',
          client_input_required: false,
        });
      }
      
      toast.success(`${extractedTasks.length} tarea${extractedTasks.length > 1 ? 's' : ''} creada${extractedTasks.length > 1 ? 's' : ''}`);
      handleClose();
    } catch (error) {
      toast.error('Error al crear las tareas');
    }
  };

  return (
    <>
      {/* Floating Button */}
      <Button
        onClick={() => setIsOpen(true)}
        size="lg"
        variant="outline"
        className="gap-2"
      >
        <Mic className="h-5 w-5" />
        Crear con voz
      </Button>

      {/* Dialog */}
      <Dialog open={isOpen} onOpenChange={(open) => !open && handleClose()}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Mic className="h-5 w-5 text-primary" />
              Crear tareas con voz
            </DialogTitle>
          </DialogHeader>

          <div className="space-y-4">
            {/* Status Badge */}
            <div className="flex justify-center">
              <Badge 
                variant="secondary" 
                className={cn(
                  "text-sm px-4 py-1",
                  state === 'recording' && "bg-red-500/20 text-red-500 animate-pulse",
                  state === 'processing' && "bg-amber-500/20 text-amber-500",
                  state === 'confirming' && "bg-emerald-500/20 text-emerald-500"
                )}
              >
                {stateLabels[state]}
              </Badge>
            </div>

            {/* Record Button */}
            {(state === 'idle' || state === 'recording') && (
              <div className="flex flex-col items-center gap-4 py-4">
                <Button
                  size="lg"
                  variant={state === 'recording' ? 'destructive' : 'default'}
                  className={cn(
                    "h-20 w-20 rounded-full transition-all",
                    state === 'recording' && "animate-pulse"
                  )}
                  onClick={handleMicClick}
                >
                  {state === 'recording' ? (
                    <MicOff className="h-8 w-8" />
                  ) : (
                    <Mic className="h-8 w-8" />
                  )}
                </Button>
                <p className="text-sm text-muted-foreground text-center">
                  {state === 'idle' 
                    ? 'Presioná para grabar y decir qué tareas querés crear' 
                    : 'Hablá ahora... Presioná de nuevo para terminar'}
                </p>
              </div>
            )}

            {/* Transcript Preview */}
            {transcript && state === 'recording' && (
              <Card className="bg-muted/50">
                <CardContent className="p-3">
                  <p className="text-sm text-muted-foreground mb-1">Escuchando:</p>
                  <p className="text-sm">{transcript}</p>
                </CardContent>
              </Card>
            )}

            {/* Processing State */}
            {state === 'processing' && (
              <div className="flex flex-col items-center gap-4 py-8">
                <Loader2 className="h-10 w-10 animate-spin text-primary" />
                <p className="text-sm text-muted-foreground">Analizando lo que dijiste...</p>
              </div>
            )}

            {/* Confirming Tasks */}
            {state === 'confirming' && (
              <div className="space-y-4">
                {summary && (
                  <Card className="bg-primary/5 border-primary/20">
                    <CardContent className="p-3">
                      <p className="text-sm">{summary}</p>
                    </CardContent>
                  </Card>
                )}

                <div className="space-y-2">
                  <p className="text-sm font-medium">Tareas a crear ({extractedTasks.length}):</p>
                  
                  {extractedTasks.map((task, index) => (
                    <TaskPreviewCard
                      key={index}
                      task={task}
                      isEditing={editingIndex === index}
                      onEdit={() => setEditingIndex(index)}
                      onSave={(updates) => {
                        updateTask(index, updates);
                        setEditingIndex(null);
                      }}
                      onCancel={() => setEditingIndex(null)}
                      onRemove={() => removeTask(index)}
                    />
                  ))}
                </div>

                <div className="flex gap-2 pt-2">
                  <Button
                    variant="outline"
                    className="flex-1"
                    onClick={handleClose}
                  >
                    <X className="h-4 w-4 mr-2" />
                    Cancelar
                  </Button>
                  <Button
                    className="flex-1"
                    onClick={handleCreateTasks}
                    disabled={extractedTasks.length === 0 || createTask.isPending}
                  >
                    {createTask.isPending ? (
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    ) : (
                      <Check className="h-4 w-4 mr-2" />
                    )}
                    Crear {extractedTasks.length} tarea{extractedTasks.length !== 1 ? 's' : ''}
                  </Button>
                </div>
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}

// Subcomponent for task preview
interface TaskPreviewCardProps {
  task: ExtractedTask;
  isEditing: boolean;
  onEdit: () => void;
  onSave: (updates: Partial<ExtractedTask>) => void;
  onCancel: () => void;
  onRemove: () => void;
}

function TaskPreviewCard({ task, isEditing, onEdit, onSave, onCancel, onRemove }: TaskPreviewCardProps) {
  const [editTitle, setEditTitle] = useState(task.title);
  const [editDescription, setEditDescription] = useState(task.description || '');

  if (isEditing) {
    return (
      <Card>
        <CardContent className="p-3 space-y-2">
          <Input
            value={editTitle}
            onChange={(e) => setEditTitle(e.target.value)}
            placeholder="Título de la tarea"
            autoFocus
          />
          <Textarea
            value={editDescription}
            onChange={(e) => setEditDescription(e.target.value)}
            placeholder="Descripción (opcional)"
            rows={2}
          />
          <div className="flex gap-2">
            <Button size="sm" variant="outline" onClick={onCancel}>
              Cancelar
            </Button>
            <Button 
              size="sm" 
              onClick={() => onSave({ title: editTitle, description: editDescription || undefined })}
            >
              Guardar
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="group">
      <CardContent className="p-3">
        <div className="flex items-start justify-between gap-2">
          <div className="flex-1 min-w-0">
            <p className="font-medium text-sm">{task.title}</p>
            {task.description && (
              <p className="text-xs text-muted-foreground mt-1 line-clamp-2">{task.description}</p>
            )}
          </div>
          <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
            <Button size="icon" variant="ghost" className="h-7 w-7" onClick={onEdit}>
              <Edit2 className="h-3.5 w-3.5" />
            </Button>
            <Button size="icon" variant="ghost" className="h-7 w-7 text-destructive" onClick={onRemove}>
              <Trash2 className="h-3.5 w-3.5" />
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
