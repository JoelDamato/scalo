import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Calendar } from '@/components/ui/calendar';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { useCRMEvents, useCreateCRMEvent, useDeleteCRMEvent, CRMEvent } from '@/hooks/useCRMEvents';
import { useAuth } from '@/hooks/useAuth';
import { CalendarDays, Plus, Trash2, Clock, Video, Users, BookOpen } from 'lucide-react';
import { format, isSameDay, parseISO } from 'date-fns';
import { es } from 'date-fns/locale';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';

const EVENT_TYPES: Record<string, { label: string; color: string; icon: typeof Video }> = {
  meeting: { label: 'Reunión', color: 'bg-accent-blue', icon: Video },
  workshop: { label: 'Workshop', color: 'bg-primary', icon: BookOpen },
  checkpoint: { label: 'Checkpoint', color: 'bg-accent-green', icon: Users },
  other: { label: 'Otro', color: 'bg-muted-foreground', icon: CalendarDays },
};

export function CRMCalendar() {
  const { data: events = [], isLoading } = useCRMEvents();
  const createEvent = useCreateCRMEvent();
  const deleteEvent = useDeleteCRMEvent();
  const { isAdmin } = useAuth();

  const [selectedDate, setSelectedDate] = useState<Date | undefined>(new Date());
  const [dialogOpen, setDialogOpen] = useState(false);
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [time, setTime] = useState('');
  const [endTime, setEndTime] = useState('');
  const [type, setType] = useState('meeting');

  const eventsForDate = selectedDate
    ? events.filter(e => isSameDay(parseISO(e.event_date), selectedDate))
    : [];

  const datesWithEvents = events.map(e => parseISO(e.event_date));

  const upcomingEvents = events
    .filter(e => parseISO(e.event_date) >= new Date(new Date().setHours(0, 0, 0, 0)))
    .slice(0, 5);

  const handleCreate = async () => {
    if (!title.trim() || !selectedDate) return;
    try {
      await createEvent.mutateAsync({
        title: title.trim(),
        description: description.trim() || undefined,
        event_date: format(selectedDate, 'yyyy-MM-dd'),
        event_time: time || undefined,
        end_time: endTime || undefined,
        event_type: type,
      });
      toast.success('Evento creado');
      setTitle(''); setDescription(''); setTime(''); setEndTime(''); setType('meeting');
      setDialogOpen(false);
    } catch {
      toast.error('Error al crear evento');
    }
  };

  const handleDelete = async (event: CRMEvent) => {
    try {
      await deleteEvent.mutateAsync(event.id);
      toast.success('Evento eliminado');
    } catch {
      toast.error('Error al eliminar');
    }
  };

  return (
    <div className="space-y-6">
      {/* Upcoming events banner */}
      {upcomingEvents.length > 0 && (
        <Card className="border-primary/20 bg-primary/5">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <CalendarDays className="h-4 w-4 text-primary" />
              Próximos eventos
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex flex-wrap gap-2">
              {upcomingEvents.map(ev => {
                const cfg = EVENT_TYPES[ev.event_type] || EVENT_TYPES.other;
                return (
                  <div key={ev.id} className="flex items-center gap-2 rounded-lg border bg-card px-3 py-2 text-sm">
                    <div className={cn('h-2 w-2 rounded-full', cfg.color)} />
                    <span className="font-medium">{ev.title}</span>
                    <span className="text-muted-foreground">
                      {format(parseISO(ev.event_date), "d MMM", { locale: es })}
                      {ev.event_time && ` · ${ev.event_time.slice(0, 5)}`}
                    </span>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>
      )}

      <div className="grid gap-6 md:grid-cols-2">
        {/* Calendar */}
        <Card>
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardTitle className="text-base font-medium flex items-center gap-2">
                <CalendarDays className="h-4 w-4" />
                Calendario
              </CardTitle>
              {isAdmin && (
                <Button size="sm" variant="outline" onClick={() => setDialogOpen(true)} className="gap-1.5">
                  <Plus className="h-3.5 w-3.5" />
                  Nuevo
                </Button>
              )}
            </div>
          </CardHeader>
          <CardContent>
            <Calendar
              mode="single"
              selected={selectedDate}
              onSelect={setSelectedDate}
              locale={es}
              className={cn("p-3 pointer-events-auto")}
              modifiers={{ hasEvent: datesWithEvents }}
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
            <CardTitle className="text-base font-medium">
              {selectedDate
                ? format(selectedDate, "EEEE d 'de' MMMM", { locale: es })
                : 'Seleccioná una fecha'}
            </CardTitle>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <p className="text-sm text-muted-foreground text-center py-8">Cargando...</p>
            ) : eventsForDate.length === 0 ? (
              <div className="text-center py-8">
                <CalendarDays className="h-10 w-10 mx-auto text-muted-foreground/40 mb-3" />
                <p className="text-sm text-muted-foreground">No hay eventos para esta fecha</p>
                {isAdmin && selectedDate && (
                  <Button variant="ghost" size="sm" className="mt-3 gap-1.5" onClick={() => setDialogOpen(true)}>
                    <Plus className="h-3.5 w-3.5" /> Crear evento
                  </Button>
                )}
              </div>
            ) : (
              <div className="space-y-3">
                {eventsForDate.map(event => {
                  const cfg = EVENT_TYPES[event.event_type] || EVENT_TYPES.other;
                  const Icon = cfg.icon;
                  return (
                    <div key={event.id} className="flex items-start gap-3 p-3 rounded-lg border bg-muted/30">
                      <div className={cn('p-1.5 rounded-md', cfg.color, 'text-white')}>
                        <Icon className="h-3.5 w-3.5" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium">{event.title}</p>
                        {event.description && (
                          <p className="text-xs text-muted-foreground mt-1">{event.description}</p>
                        )}
                        {(event.event_time || event.end_time) && (
                          <div className="flex items-center gap-1 mt-1.5 text-xs text-muted-foreground">
                            <Clock className="h-3 w-3" />
                            {event.event_time?.slice(0, 5)}
                            {event.end_time && ` – ${event.end_time.slice(0, 5)}`}
                          </div>
                        )}
                      </div>
                      {isAdmin && (
                        <Button
                          variant="ghost" size="icon"
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
      </div>

      {/* Create Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="sm:max-w-md">
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
              <Input value={title} onChange={e => setTitle(e.target.value)} placeholder="Ej: Daily standup con Lumina" />
            </div>
            <div>
              <label className="text-sm text-muted-foreground mb-1.5 block">Descripción</label>
              <Textarea value={description} onChange={e => setDescription(e.target.value)} placeholder="Detalles..." rows={2} />
            </div>
            <div className="grid grid-cols-3 gap-3">
              <div>
                <label className="text-sm text-muted-foreground mb-1.5 block">Inicio</label>
                <Input type="time" value={time} onChange={e => setTime(e.target.value)} />
              </div>
              <div>
                <label className="text-sm text-muted-foreground mb-1.5 block">Fin</label>
                <Input type="time" value={endTime} onChange={e => setEndTime(e.target.value)} />
              </div>
              <div>
                <label className="text-sm text-muted-foreground mb-1.5 block">Tipo</label>
                <Select value={type} onValueChange={setType}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {Object.entries(EVENT_TYPES).map(([key, cfg]) => (
                      <SelectItem key={key} value={key}>{cfg.label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogOpen(false)}>Cancelar</Button>
            <Button onClick={handleCreate} disabled={!title.trim() || createEvent.isPending}>Crear</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
