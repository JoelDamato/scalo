import { useState } from 'react';
import { ArrowRight, CheckCircle2, Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { SupportTicket, useConvertTicketToTask } from '@/hooks/useTickets';

interface ConvertTicketToTaskDialogProps {
  ticket: SupportTicket;
  variant?: 'default' | 'outline' | 'secondary' | 'ghost';
  size?: 'default' | 'sm';
  className?: string;
}

type TaskStatus = 'backlog' | 'in-progress' | 'review' | 'done';

export function ConvertTicketToTaskDialog({
  ticket,
  variant = 'outline',
  size = 'sm',
  className,
}: ConvertTicketToTaskDialogProps) {
  const [open, setOpen] = useState(false);
  const [status, setStatus] = useState<TaskStatus>('backlog');
  const [scheduledDate, setScheduledDate] = useState('');
  const [scheduledTime, setScheduledTime] = useState('');
  const [scheduledEndTime, setScheduledEndTime] = useState('');
  const convertTicket = useConvertTicketToTask();

  const isConverted = !!ticket.converted_task_id;

  const handleConvert = async () => {
    try {
      await convertTicket.mutateAsync({
        ticket,
        status,
        scheduledDate: scheduledDate || null,
        scheduledTime: scheduledTime || null,
        scheduledEndTime: scheduledEndTime || null,
      });
      toast.success('Ticket convertido en tarea');
      setOpen(false);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'No pude convertir el ticket');
    }
  };

  if (isConverted) {
    return (
      <Button variant="secondary" size={size} className={className} disabled>
        <CheckCircle2 className="mr-2 h-4 w-4" />
        Ya es tarea
      </Button>
    );
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant={variant} size={size} className={className}>
          <ArrowRight className="mr-2 h-4 w-4" />
          Pasar a tarea
        </Button>
      </DialogTrigger>
      <DialogContent className="w-[calc(100vw-2rem)] max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Pasar ticket a tarea</DialogTitle>
          <DialogDescription>
            Se creará una tarea vinculada a este ticket. Si el ticket tiene proyecto, la tarea queda dentro de ese proyecto; si no, queda como tarea interna.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <div className="rounded-lg border bg-muted/30 p-3">
            <p className="text-sm font-medium">{ticket.subject}</p>
            {ticket.description && (
              <p className="mt-1 line-clamp-3 text-sm text-muted-foreground">{ticket.description}</p>
            )}
          </div>

          <div className="space-y-2">
            <Label>Estado inicial</Label>
            <Select value={status} onValueChange={(value) => setStatus(value as TaskStatus)}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="backlog">Backlog</SelectItem>
                <SelectItem value="in-progress">En progreso</SelectItem>
                <SelectItem value="review">Revisión</SelectItem>
                <SelectItem value="done">Hecho</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label>Agenda opcional</Label>
            <div className="grid gap-3 sm:grid-cols-3">
              <Input
                type="date"
                value={scheduledDate}
                onChange={(event) => setScheduledDate(event.target.value)}
                aria-label="Fecha de la tarea"
              />
              <Input
                type="time"
                value={scheduledTime}
                onChange={(event) => setScheduledTime(event.target.value)}
                aria-label="Hora de inicio"
              />
              <Input
                type="time"
                value={scheduledEndTime}
                onChange={(event) => setScheduledEndTime(event.target.value)}
                aria-label="Hora de fin"
              />
            </div>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => setOpen(false)}>
            Cancelar
          </Button>
          <Button onClick={handleConvert} disabled={convertTicket.isPending}>
            {convertTicket.isPending ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <ArrowRight className="mr-2 h-4 w-4" />}
            Crear tarea
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
