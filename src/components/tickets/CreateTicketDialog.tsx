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
import { MAX_TICKET_IMAGE_SIZE, useCreateTicket, TicketCategory, TicketPriority } from '@/hooks/useTickets';
import { useProjects } from '@/hooks/useData';
import { toast } from 'sonner';

interface CreateTicketDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  defaultProjectId?: string;
}

const categoryLabels: Record<TicketCategory, string> = {
  bug: 'Bug / Error',
  feature_request: 'Solicitud de funcionalidad',
  question: 'Consulta',
  other: 'Otro',
};

const priorityLabels: Record<TicketPriority, string> = {
  low: 'Baja',
  medium: 'Media',
  high: 'Alta',
  urgent: 'Urgente',
};

export function CreateTicketDialog({ 
  open, 
  onOpenChange,
  defaultProjectId 
}: CreateTicketDialogProps) {
  const [subject, setSubject] = useState('');
  const [description, setDescription] = useState('');
  const [category, setCategory] = useState<TicketCategory>('question');
  const [priority, setPriority] = useState<TicketPriority>('medium');
  const [projectId, setProjectId] = useState(defaultProjectId || '');
  const [images, setImages] = useState<File[]>([]);

  const { data: projects = [] } = useProjects();
  const createTicket = useCreateTicket();

  useEffect(() => {
    if (open) {
      setSubject('');
      setDescription('');
      setCategory('question');
      setPriority('medium');
      setProjectId(defaultProjectId || '');
      setImages([]);
    }
  }, [open, defaultProjectId]);

  const handleImageChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(event.target.files || []);

    const invalidFile = files.find((file) => !file.type.startsWith('image/'));
    if (invalidFile) {
      toast.error('Solo podés adjuntar imágenes');
      event.target.value = '';
      return;
    }

    const oversizedFile = files.find((file) => file.size > MAX_TICKET_IMAGE_SIZE);
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
    
    if (!subject.trim()) {
      toast.error('El asunto es requerido');
      return;
    }

    try {
      await createTicket.mutateAsync({
        subject: subject.trim(),
        description: description.trim() || undefined,
        category,
        priority,
        project_id: projectId && projectId !== 'none' ? projectId : undefined,
        images,
      });
      
      toast.success('Ticket creado exitosamente');
      onOpenChange(false);
    } catch (error) {
      toast.error('Error al crear el ticket');
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="w-[calc(100vw-2rem)] sm:max-w-[500px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Nuevo Ticket de Soporte</DialogTitle>
        </DialogHeader>
        
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="subject">Asunto *</Label>
            <Input
              id="subject"
              value={subject}
              onChange={(e) => setSubject(e.target.value)}
              placeholder="Describe brevemente tu solicitud"
              autoFocus
            />
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="description">Descripción</Label>
            <Textarea
              id="description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Proporciona más detalles sobre tu solicitud..."
              rows={4}
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="category">Categoría</Label>
              <Select value={category} onValueChange={(v) => setCategory(v as TicketCategory)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {Object.entries(categoryLabels).map(([value, label]) => (
                    <SelectItem key={value} value={value}>
                      {label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="priority">Prioridad</Label>
              <Select value={priority} onValueChange={(v) => setPriority(v as TicketPriority)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {Object.entries(priorityLabels).map(([value, label]) => (
                    <SelectItem key={value} value={value}>
                      {label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          {projects.length > 0 && (
            <div className="space-y-2">
              <Label htmlFor="project">Proyecto (opcional)</Label>
              <Select value={projectId} onValueChange={setProjectId}>
                <SelectTrigger>
                  <SelectValue placeholder="Selecciona un proyecto" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">Sin proyecto</SelectItem>
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
            <Label htmlFor="ticket-images">Imágenes</Label>
            <Input
              id="ticket-images"
              type="file"
              accept="image/*"
              multiple
              onChange={handleImageChange}
            />
            <p className="text-xs text-muted-foreground">
              Podés subir capturas o fotos, hasta 10 MB cada una.
            </p>
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
            <Button type="submit" disabled={createTicket.isPending}>
              {createTicket.isPending ? 'Creando...' : 'Crear Ticket'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
