import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { useProjectEvents, useCreateProjectEvent, useDeleteProjectEvent, ProjectEvent } from '@/hooks/useProjectEvents';
import { useAuth } from '@/hooks/useAuth';
import { CalendarDays, Plus, Trash2, Clock, X } from 'lucide-react';
import { format, isSameDay, parseISO } from 'date-fns';
import { es } from 'date-fns/locale';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { GoogleCalendarSyncButton } from '@/components/google/GoogleCalendarSyncButton';

interface ProjectCalendarProps {
  projectId: string;
}

const EVENT_TYPES: Record<string, { label: string; color: string }> = {
  checkpoint: { label: 'Checkpoint', color: 'bg-primary' },
  deadline: { label: 'Deadline', color: 'bg-destructive' },
  meeting: { label: 'Reunión', color: 'bg-accent-blue' },
  delivery: { label: 'Entrega', color: 'bg-accent-green' },
  other: { label: 'Otro', color: 'bg-muted-foreground' },
};

export function ProjectCalendar({ projectId }: ProjectCalendarProps) {
  const { data: events = [], isLoading } = useProjectEvents(projectId);
  const createEvent = useCreateProjectEvent();
  const deleteEvent = useDeleteProjectEvent();
  const { isAdmin } = useAuth();

  const [selectedDate, setSelectedDate] = useState<Date | undefined>(new Date());
  const [dialogOpen, setDialogOpen] = useState(false);
  const [newTitle, setNewTitle] = useState('');
  const [newDescription, setNewDescription] = useState('');
  const [newTime, setNewTime] = useState('');
  const [newEndTime, setNewEndTime] = useState('');
  const [newType, setNewType] = useState('checkpoint');

  const eventsForDate = selectedDate
    ? events.filter(e => isSameDay(parseISO(e.event_date), selectedDate))
    : [];

  const datesWithEvents = events.map(e => parseISO(e.event_date));

  const handleCreate = async () => {
    if (!newTitle.trim() || !selectedDate) return;
    try {
      await createEvent.mutateAsync({
        project_id: projectId,
        title: newTitle.trim(),
        description: newDescription.trim() || undefined,
        event_date: format(selectedDate, 'yyyy-MM-dd'),
        event_time: newTime || undefined,
        event_end_time: newEndTime || undefined,
        event_type: newType,
      });
      toast.success('Evento creado');
      setNewTitle('');
      setNewDescription('');
      setNewTime('');
      setNewEndTime('');
      setNewType('checkpoint');
      setDialogOpen(false);
    } catch {
      toast.error('Error al crear evento');
    }
  };

  const handleDelete = async (event: ProjectEvent) => {
    try {
      await deleteEvent.mutateAsync({ eventId: event.id, projectId });
      toast.success('Evento eliminado');
    } catch {
      toast.error('Error al eliminar evento');
    }
  };

  return (
    <div className="grid gap-6 md:grid-cols-2">
      {/* Calendar */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base font-medium flex items-center gap-2">
            <CalendarDays className="h-4 w-4" />
            Calendario
          </CardTitle>
        </CardHeader>
        <CardContent>
          <Calendar
            mode="single"
            selected={selectedDate}
            onSelect={setSelectedDate}
            locale={es}
            className={cn("p-3 pointer-events-auto")}
            modifiers={{
              hasEvent: datesWithEvents,
            }}
            modifiersStyles={{
              hasEvent: {
                fontWeight: 700,
                textDecoration: 'underline',
                textDecorationColor: 'hsl(var(--primary))',
                textUnderlineOffset: '4px',
              },
            }}
          />
        </CardContent>
      </Card>

      {/* Events for selected date */}
      <Card>
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <CardTitle className="text-base font-medium">
              {selectedDate
                ? format(selectedDate, "d 'de' MMMM, yyyy", { locale: es })
                : 'Seleccioná una fecha'}
            </CardTitle>
            {selectedDate && (
              <Button size="sm" variant="outline" onClick={() => setDialogOpen(true)} className="gap-1.5">
                <Plus className="h-3.5 w-3.5" />
                Agregar
              </Button>
            )}
          </div>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <p className="text-sm text-muted-foreground text-center py-8">Cargando...</p>
          ) : eventsForDate.length === 0 ? (
            <div className="text-center py-8">
              <CalendarDays className="h-10 w-10 mx-auto text-muted-foreground/40 mb-3" />
              <p className="text-sm text-muted-foreground">
                No hay eventos para esta fecha
              </p>
              {selectedDate && (
                <Button
                  variant="ghost"
                  size="sm"
                  className="mt-3 gap-1.5"
                  onClick={() => setDialogOpen(true)}
                >
                  <Plus className="h-3.5 w-3.5" />
                  Crear evento
                </Button>
              )}
            </div>
          ) : (
            <div className="space-y-3">
              {eventsForDate.map(event => {
                const typeConfig = EVENT_TYPES[event.event_type] || EVENT_TYPES.other;
                return (
                  <div
                    key={event.id}
                    className="flex items-start gap-3 p-3 rounded-lg border bg-muted/30"
                  >
                    <div className={cn('h-2.5 w-2.5 rounded-full mt-1.5 shrink-0', typeConfig.color)} />
                    <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <p className="text-sm font-medium">{event.title}</p>
                      <span className="text-[10px] px-1.5 py-0.5 rounded bg-muted text-muted-foreground">
                        {typeConfig.label}
                      </span>
                    </div>
                      {event.description && (
                        <p className="text-xs text-muted-foreground mt-1">{event.description}</p>
                      )}
                      {event.event_time && (
                        <div className="flex items-center gap-1 mt-1.5 text-xs text-muted-foreground">
                          <Clock className="h-3 w-3" />
                          {event.event_time.slice(0, 5)}
                          {event.event_end_time ? ` - ${event.event_end_time.slice(0, 5)}` : ''}
                        </div>
                      )}
                      <div className="mt-2">
                        <GoogleCalendarSyncButton sourceType="project_event" sourceId={event.id} />
                      </div>
                    </div>
                    {(isAdmin || true) && (
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-7 w-7 text-muted-foreground hover:text-destructive shrink-0"
                        onClick={() => handleDelete(event)}
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </Button>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Create Event Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="w-[calc(100vw-2rem)] sm:max-w-md max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Nuevo Evento</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <label className="text-sm text-muted-foreground mb-1.5 block">Fecha</label>
              <p className="text-sm font-medium">
                {selectedDate && format(selectedDate, "EEEE d 'de' MMMM, yyyy", { locale: es })}
              </p>
            </div>
            <div>
              <label className="text-sm text-muted-foreground mb-1.5 block">Título *</label>
              <Input
                value={newTitle}
                onChange={e => setNewTitle(e.target.value)}
                placeholder="Ej: Checkpoint semanal"
              />
            </div>
            <div>
              <label className="text-sm text-muted-foreground mb-1.5 block">Descripción</label>
              <Textarea
                value={newDescription}
                onChange={e => setNewDescription(e.target.value)}
                placeholder="Detalles del evento..."
                rows={2}
              />
            </div>
            <div className="grid gap-3 sm:grid-cols-3">
              <div>
                <label className="text-sm text-muted-foreground mb-1.5 block">Desde</label>
                <Input
                  type="time"
                  value={newTime}
                  onChange={e => setNewTime(e.target.value)}
                />
              </div>
              <div>
                <label className="text-sm text-muted-foreground mb-1.5 block">Hasta</label>
                <Input
                  type="time"
                  value={newEndTime}
                  onChange={e => setNewEndTime(e.target.value)}
                />
              </div>
              <div>
                <label className="text-sm text-muted-foreground mb-1.5 block">Tipo</label>
                <Select value={newType} onValueChange={setNewType}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {Object.entries(EVENT_TYPES).map(([key, config]) => (
                      <SelectItem key={key} value={key}>{config.label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogOpen(false)}>Cancelar</Button>
            <Button onClick={handleCreate} disabled={!newTitle.trim() || createEvent.isPending}>
              Crear evento
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
