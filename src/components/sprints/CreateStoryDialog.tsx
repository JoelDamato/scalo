import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useCreateUserStory, StoryPriority } from '@/hooks/useSprints';
import { toast } from 'sonner';

interface CreateStoryDialogProps {
  projectId: string;
  sprintId?: string | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function CreateStoryDialog({ projectId, sprintId, open, onOpenChange }: CreateStoryDialogProps) {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [priority, setPriority] = useState<StoryPriority>('should');
  const [points, setPoints] = useState('');
  const [criteria, setCriteria] = useState('');
  const createStory = useCreateUserStory();

  const handleCreate = async () => {
    if (!title.trim()) return;
    try {
      await createStory.mutateAsync({
        project_id: projectId,
        sprint_id: sprintId,
        title: title.trim(),
        description: description.trim() || undefined,
        priority,
        points: points ? parseInt(points) : undefined,
        acceptance_criteria: criteria.trim() ? criteria.split('\n').filter(Boolean) : [],
      });
      toast.success('User story creada');
      setTitle('');
      setDescription('');
      setPriority('should');
      setPoints('');
      setCriteria('');
      onOpenChange(false);
    } catch {
      toast.error('Error al crear user story');
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>Nueva User Story</DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          <div>
            <Label>Título</Label>
            <Input value={title} onChange={e => setTitle(e.target.value)} placeholder="Como usuario, quiero..." />
          </div>
          <div>
            <Label>Descripción</Label>
            <Textarea value={description} onChange={e => setDescription(e.target.value)} placeholder="Como [usuario], quiero [acción], para [beneficio]" rows={3} />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label>Prioridad</Label>
              <Select value={priority} onValueChange={v => setPriority(v as StoryPriority)}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="must">Must</SelectItem>
                  <SelectItem value="should">Should</SelectItem>
                  <SelectItem value="could">Could</SelectItem>
                  <SelectItem value="wont">Won't</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Story Points</Label>
              <Input type="number" value={points} onChange={e => setPoints(e.target.value)} placeholder="Ej: 3" />
            </div>
          </div>
          <div>
            <Label>Criterios de aceptación (uno por línea)</Label>
            <Textarea value={criteria} onChange={e => setCriteria(e.target.value)} placeholder="El usuario puede..." rows={3} />
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>Cancelar</Button>
          <Button onClick={handleCreate} disabled={!title.trim() || createStory.isPending}>Crear</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
