import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { useCreateSprint, useSprints } from '@/hooks/useSprints';
import { toast } from 'sonner';
import { format, addDays } from 'date-fns';

interface CreateSprintDialogProps {
  projectId: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function CreateSprintDialog({ projectId, open, onOpenChange }: CreateSprintDialogProps) {
  const { data: sprints = [] } = useSprints(projectId);
  const nextNumber = sprints.length + 1;
  const [name, setName] = useState(`Sprint ${nextNumber}`);
  const [goal, setGoal] = useState('');
  const today = format(new Date(), 'yyyy-MM-dd');
  const twoWeeks = format(addDays(new Date(), 14), 'yyyy-MM-dd');
  const [startDate, setStartDate] = useState(today);
  const [endDate, setEndDate] = useState(twoWeeks);
  const createSprint = useCreateSprint();

  const handleCreate = async () => {
    if (!name.trim()) return;
    try {
      await createSprint.mutateAsync({
        project_id: projectId,
        name: name.trim(),
        goal: goal.trim() || undefined,
        start_date: startDate,
        end_date: endDate,
      });
      toast.success('Sprint creado');
      onOpenChange(false);
    } catch {
      toast.error('Error al crear sprint');
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Nuevo Sprint</DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          <div>
            <Label>Nombre</Label>
            <Input value={name} onChange={e => setName(e.target.value)} />
          </div>
          <div>
            <Label>Objetivo del Sprint</Label>
            <Textarea value={goal} onChange={e => setGoal(e.target.value)} placeholder="¿Qué queremos lograr?" rows={2} />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label>Inicio</Label>
              <Input type="date" value={startDate} onChange={e => setStartDate(e.target.value)} />
            </div>
            <div>
              <Label>Fin</Label>
              <Input type="date" value={endDate} onChange={e => setEndDate(e.target.value)} />
            </div>
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>Cancelar</Button>
          <Button onClick={handleCreate} disabled={!name.trim() || createSprint.isPending}>Crear Sprint</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
