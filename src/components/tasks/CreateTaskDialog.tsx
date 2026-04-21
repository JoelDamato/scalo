import { useState, useEffect } from 'react';
import { ImageIcon, X } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { MAX_TASK_IMAGE_SIZE, useCreateTask } from '@/hooks/useData';
import { useProjects } from '@/hooks/useData';
import { useAuth } from '@/hooks/useAuth';
import { toast } from 'sonner';

interface CreateTaskDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  defaultStatus?: 'backlog' | 'in-progress' | 'review' | 'done';
  defaultProjectId?: string;
  mode?: 'project' | 'internal';
  assignToCurrentUser?: boolean;
}

export function CreateTaskDialog({ 
  open, 
  onOpenChange, 
  defaultStatus = 'backlog',
  defaultProjectId,
  mode = 'project',
  assignToCurrentUser = false
}: CreateTaskDialogProps) {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [projectId, setProjectId] = useState(defaultProjectId || '');
  const [status, setStatus] = useState<'backlog' | 'in-progress' | 'review' | 'done'>(defaultStatus);
  const [scheduledDate, setScheduledDate] = useState('');
  const [scheduledTime, setScheduledTime] = useState('');
  const [scheduledEndTime, setScheduledEndTime] = useState('');
  const [images, setImages] = useState<File[]>([]);

  const { data: projects = [] } = useProjects();
  const createTask = useCreateTask();
  const { user } = useAuth();

  const isInternal = mode === 'internal';

  // Reset form and sync values when dialog opens
  useEffect(() => {
    if (open) {
      setTitle('');
      setDescription('');
      setStatus(defaultStatus);
      setProjectId(defaultProjectId || '');
      setScheduledDate('');
      setScheduledTime('');
      setScheduledEndTime('');
      setImages([]);
    }
  }, [open, defaultStatus, defaultProjectId]);

  const handleImageChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(event.target.files || []);
    const invalidFile = files.find((file) => !file.type.startsWith('image/'));

    if (invalidFile) {
      toast.error('Solo podés adjuntar imágenes');
      event.target.value = '';
      return;
    }

    const oversizedFile = files.find((file) => file.size > MAX_TASK_IMAGE_SIZE);
    if (oversizedFile) {
      toast.error('Cada imagen debe pesar menos de 10 MB');
      event.target.value = '';
      return;
    }

    setImages((current) => [...current, ...files]);
    event.target.value = '';
  };

  const removeImage = (index: number) => {
    setImages((current) => current.filter((_, currentIndex) => currentIndex !== index));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!title.trim()) {
      toast.error('El título es requerido');
      return;
    }
    
    // Only require project for non-internal tasks
    if (!isInternal && !projectId) {
      toast.error('Selecciona un proyecto');
      return;
    }

    try {
      await createTask.mutateAsync({
        title: title.trim(),
        description: description.trim() || undefined,
        project_id: isInternal ? null : projectId,
        status,
        scheduled_date: scheduledDate || null,
        scheduled_time: scheduledTime || null,
        scheduled_end_time: scheduledEndTime || null,
        images,
        is_client_visible: !isInternal, // Internal tasks are not client visible
        client_input_required: false,
        assignee_id: assignToCurrentUser ? user?.id : undefined,
      });
      
      toast.success('Tarea creada');
      onOpenChange(false);
      setTitle('');
      setDescription('');
      setScheduledDate('');
      setScheduledTime('');
      setScheduledEndTime('');
      setImages([]);
      if (!defaultProjectId) setProjectId('');
    } catch (error) {
      toast.error('Error al crear la tarea');
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="w-[calc(100vw-2rem)] sm:max-w-[520px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>
            {isInternal ? 'Nueva Tarea Interna' : 'Nueva Tarea'}
          </DialogTitle>
        </DialogHeader>
        
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="title">Título *</Label>
            <Input
              id="title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Nombre de la tarea"
              autoFocus
            />
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="description">Descripción</Label>
            <Textarea
              id="description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Descripción opcional"
              rows={3}
            />
          </div>
          
          {/* Only show project selector for project mode without default */}
          {!isInternal && !defaultProjectId && (
            <div className="space-y-2">
              <Label htmlFor="project">Proyecto *</Label>
              <Select value={projectId} onValueChange={setProjectId}>
                <SelectTrigger>
                  <SelectValue placeholder="Selecciona un proyecto" />
                </SelectTrigger>
                <SelectContent>
                  {projects.map((project) => (
                    <SelectItem key={project.id} value={project.id}>
                      {project.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}
          
          <div className="space-y-2">
            <Label htmlFor="status">Estado</Label>
            <Select value={status} onValueChange={(v) => setStatus(v as typeof status)}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="backlog">Backlog</SelectItem>
                <SelectItem value="in-progress">En progreso</SelectItem>
                <SelectItem value="review">Revisión</SelectItem>
                <SelectItem value="done">Finalizada</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label>Agenda</Label>
            <div className="grid grid-cols-3 gap-3">
              <Input
                type="date"
                value={scheduledDate}
                onChange={(e) => setScheduledDate(e.target.value)}
                aria-label="Fecha de la tarea"
              />
              <Input
                type="time"
                value={scheduledTime}
                onChange={(e) => setScheduledTime(e.target.value)}
                aria-label="Hora de inicio"
              />
              <Input
                type="time"
                value={scheduledEndTime}
                onChange={(e) => setScheduledEndTime(e.target.value)}
                aria-label="Hora de fin"
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="task-images">Imágenes</Label>
            <Input
              id="task-images"
              type="file"
              accept="image/*"
              multiple
              onChange={handleImageChange}
            />
            {images.length > 0 && (
              <div className="space-y-2 rounded-lg border border-border/70 bg-muted/20 p-3">
                {images.map((image, index) => (
                  <div key={`${image.name}-${index}`} className="flex items-center justify-between gap-3 text-sm">
                    <div className="flex min-w-0 items-center gap-2">
                      <ImageIcon className="h-4 w-4 shrink-0 text-muted-foreground" />
                      <span className="truncate">{image.name}</span>
                    </div>
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      className="h-7 w-7 shrink-0"
                      onClick={() => removeImage(index)}
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  </div>
                ))}
              </div>
            )}
          </div>
          
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancelar
            </Button>
            <Button type="submit" disabled={createTask.isPending}>
              {createTask.isPending ? 'Creando...' : 'Crear Tarea'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
