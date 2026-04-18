import { useState, useEffect } from 'react';
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
import { useCreateTask } from '@/hooks/useData';
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
    }
  }, [open, defaultStatus, defaultProjectId]);

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
