import { useMemo, useState } from 'react';
import {
  addMonths,
  eachDayOfInterval,
  endOfMonth,
  endOfWeek,
  endOfDay,
  format,
  isSameDay,
  isSameMonth,
  isToday,
  parseISO,
  startOfDay,
  startOfMonth,
  startOfWeek,
  subMonths,
} from 'date-fns';
import { es } from 'date-fns/locale';
import {
  CalendarClock,
  CalendarDays,
  ChevronLeft,
  ChevronRight,
  GripVertical,
  Link2,
  Loader2,
  Unlink,
  X,
} from 'lucide-react';
import { toast } from 'sonner';
import { AppLayout } from '@/components/layout/AppLayout';
import { TaskDetailSheet } from '@/components/tasks/TaskDetailSheet';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { StatusBadge } from '@/components/ui/status-badge';
import {
  useGoogleCalendarAvailability,
  useGoogleCalendarConnect,
  useGoogleCalendarDisconnect,
  useGoogleCalendarStatus,
  type GoogleCalendarAvailabilityEvent,
} from '@/hooks/useGoogleCalendar';
import { useMyTasks } from '@/hooks/useMyTasks';
import { Task, useProjects, useUpdateTask } from '@/hooks/useData';
import { cn } from '@/lib/utils';

const weekdayLabels = ['Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb', 'Dom'];
const workdayStartHour = 9;
const workdayEndHour = 18;

type AvailabilitySlot = {
  start: Date;
  end: Date;
};

function parseGoogleEventDate(value: string | null) {
  if (!value) return null;
  if (/^\d{4}-\d{2}-\d{2}$/.test(value)) {
    return parseISO(`${value}T00:00:00`);
  }

  return parseISO(value);
}

function formatHourRange(start: Date, end: Date) {
  return `${format(start, 'HH:mm')} - ${format(end, 'HH:mm')}`;
}

function getAvailabilitySlots(date: Date, events: GoogleCalendarAvailabilityEvent[]) {
  if (events.some((event) => event.all_day)) {
    return [] as AvailabilitySlot[];
  }

  const dayStart = startOfDay(date);
  dayStart.setHours(workdayStartHour, 0, 0, 0);
  const dayEnd = startOfDay(date);
  dayEnd.setHours(workdayEndHour, 0, 0, 0);

  const busySlots = events
    .map((event) => {
      const start = parseGoogleEventDate(event.start);
      const end = parseGoogleEventDate(event.end);
      if (!start || !end || event.all_day) return null;

      const busyStart = start < dayStart ? dayStart : start;
      const busyEnd = end > dayEnd ? dayEnd : end;

      if (busyEnd <= dayStart || busyStart >= dayEnd || busyEnd <= busyStart) {
        return null;
      }

      return { start: busyStart, end: busyEnd };
    })
    .filter((slot): slot is AvailabilitySlot => !!slot)
    .sort((a, b) => a.start.getTime() - b.start.getTime());

  if (busySlots.length === 0) {
    return [{ start: dayStart, end: dayEnd }];
  }

  const slots: AvailabilitySlot[] = [];
  let cursor = dayStart;

  busySlots.forEach((slot) => {
    if (slot.start > cursor) {
      slots.push({ start: cursor, end: slot.start });
    }

    if (slot.end > cursor) {
      cursor = slot.end;
    }
  });

  if (cursor < dayEnd) {
    slots.push({ start: cursor, end: dayEnd });
  }

  return slots.filter((slot) => slot.end > slot.start);
}

export default function CalendarPage() {
  const { data: tasks = [], isLoading } = useMyTasks();
  const { data: projects = [] } = useProjects();
  const updateTask = useUpdateTask();
  const googleCalendarStatus = useGoogleCalendarStatus();
  const connectGoogleCalendar = useGoogleCalendarConnect();
  const disconnectGoogleCalendar = useGoogleCalendarDisconnect();

  const [currentMonth, setCurrentMonth] = useState(() => startOfMonth(new Date()));
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());
  const [selectedTask, setSelectedTask] = useState<Task | null>(null);
  const [draggedTaskId, setDraggedTaskId] = useState<string | null>(null);

  const calendarRangeStart = startOfWeek(startOfMonth(currentMonth), { weekStartsOn: 1 });
  const calendarRangeEnd = endOfWeek(endOfMonth(currentMonth), { weekStartsOn: 1 });
  const googleAvailability = useGoogleCalendarAvailability({
    start: calendarRangeStart.toISOString(),
    end: endOfDay(calendarRangeEnd).toISOString(),
    enabled: !!googleCalendarStatus.data?.connected,
  });

  const projectById = useMemo(
    () => new Map(projects.map((project) => [project.id, project])),
    [projects],
  );

  const pendingTasks = useMemo(
    () =>
      [...tasks]
        .filter((task) => task.status !== 'done')
        .sort((a, b) => {
          if (!a.scheduled_date && b.scheduled_date) return -1;
          if (a.scheduled_date && !b.scheduled_date) return 1;
          const dateA = a.scheduled_date || a.updated_at;
          const dateB = b.scheduled_date || b.updated_at;
          return dateA.localeCompare(dateB);
        }),
    [tasks],
  );

  const calendarDays = useMemo(() => {
    const monthStart = startOfMonth(currentMonth);
    const monthEnd = endOfMonth(currentMonth);
    const gridStart = startOfWeek(monthStart, { weekStartsOn: 1 });
    const gridEnd = endOfWeek(monthEnd, { weekStartsOn: 1 });

    return eachDayOfInterval({ start: gridStart, end: gridEnd });
  }, [currentMonth]);

  const tasksByDate = useMemo(() => {
    const grouped = new Map<string, Task[]>();

    tasks.forEach((task) => {
      if (!task.scheduled_date) return;
      const current = grouped.get(task.scheduled_date) || [];
      current.push(task);
      grouped.set(task.scheduled_date, current);
    });

    grouped.forEach((value) => {
      value.sort((a, b) => {
        const timeA = a.scheduled_time || '99:99';
        const timeB = b.scheduled_time || '99:99';
        if (timeA !== timeB) return timeA.localeCompare(timeB);
        return a.title.localeCompare(b.title);
      });
    });

    return grouped;
  }, [tasks]);

  const selectedDateKey = format(selectedDate, 'yyyy-MM-dd');
  const selectedDateTasks = tasksByDate.get(selectedDateKey) || [];
  const googleEvents = useMemo(
    () => googleAvailability.data?.events || [],
    [googleAvailability.data?.events],
  );

  const googleEventsByDate = useMemo(() => {
    const grouped = new Map<string, GoogleCalendarAvailabilityEvent[]>();

    googleEvents.forEach((event) => {
      const start = parseGoogleEventDate(event.start);
      if (!start) return;

      const dayKey = format(start, 'yyyy-MM-dd');
      const current = grouped.get(dayKey) || [];
      current.push(event);
      grouped.set(dayKey, current);
    });

    grouped.forEach((eventsForDay) => {
      eventsForDay.sort((a, b) => {
        const startA = parseGoogleEventDate(a.start)?.getTime() || 0;
        const startB = parseGoogleEventDate(b.start)?.getTime() || 0;
        return startA - startB;
      });
    });

    return grouped;
  }, [googleEvents]);

  const selectedDateGoogleEvents = useMemo(
    () => googleEventsByDate.get(selectedDateKey) || [],
    [googleEventsByDate, selectedDateKey],
  );
  const availabilitySlots = useMemo(
    () => getAvailabilitySlots(selectedDate, selectedDateGoogleEvents),
    [selectedDate, selectedDateGoogleEvents],
  );

  const handleDropTask = async (taskId: string, date: Date) => {
    const task = tasks.find((item) => item.id === taskId);
    if (!task) return;

    const nextDate = format(date, 'yyyy-MM-dd');

    try {
      await updateTask.mutateAsync({
        taskId,
        updates: { scheduled_date: nextDate },
      });
      setSelectedDate(date);
      toast.success(`"${task.title}" quedó para el ${format(date, "d 'de' MMMM", { locale: es })}`);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'No pude mover la tarea');
    } finally {
      setDraggedTaskId(null);
    }
  };

  const handleClearDate = async (task: Task) => {
    try {
      await updateTask.mutateAsync({
        taskId: task.id,
        updates: { scheduled_date: null, scheduled_time: null, scheduled_end_time: null },
      });
      toast.success('La tarea volvió a quedar sin fecha');
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'No pude quitar la fecha');
    }
  };

  return (
    <AppLayout
      title="Calendario"
      description="Arrastrá tus tareas pendientes al día en que querés trabajarlas."
    >
      <div className="space-y-6">
        <Card>
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between gap-3">
              <CardTitle className="flex items-center gap-2 text-base font-medium">
                <CalendarClock className="h-4 w-4" />
                Google Calendar
              </CardTitle>
              {googleCalendarStatus.data?.connected ? (
                <Badge variant="outline">Conectado</Badge>
              ) : (
                <Badge variant="secondary">Sin conectar</Badge>
              )}
            </div>
          </CardHeader>
          <CardContent className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
            <div className="space-y-1">
              {googleCalendarStatus.data?.connected ? (
                <>
                  <p className="text-sm font-medium">
                    Conectado como {googleCalendarStatus.data.connection?.google_email || 'tu cuenta de Google'}
                  </p>
                  <p className="text-sm text-muted-foreground">
                    Si ya lo vinculaste, abajo vas a ver tus bloques ocupados y los huecos libres del día.
                  </p>
                </>
              ) : (
                <>
                  <p className="text-sm font-medium">Todavía no conectaste tu calendario de trabajo.</p>
                  <p className="text-sm text-muted-foreground">
                    Conectalo desde acá para ver tu disponibilidad real mientras acomodás tareas.
                  </p>
                </>
              )}
            </div>
            {googleCalendarStatus.data?.connected ? (
              <Button
                variant="outline"
                className="gap-2"
                disabled={disconnectGoogleCalendar.isPending}
                onClick={() => disconnectGoogleCalendar.mutate()}
              >
                {disconnectGoogleCalendar.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Unlink className="h-4 w-4" />}
                Desconectar
              </Button>
            ) : (
              <Button
                className="gap-2"
                disabled={connectGoogleCalendar.isPending}
                onClick={() => connectGoogleCalendar.mutate()}
              >
                {connectGoogleCalendar.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Link2 className="h-4 w-4" />}
                Conectar Google Calendar
              </Button>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between gap-3">
              <CardTitle className="flex items-center gap-2 text-base font-medium">
                <CalendarDays className="h-4 w-4" />
                Tareas para calendarizar
              </CardTitle>
              <Badge variant="outline">{pendingTasks.length} activas</Badge>
            </div>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
                {Array.from({ length: 4 }).map((_, index) => (
                  <Skeleton key={index} className="h-24 rounded-lg" />
                ))}
              </div>
            ) : pendingTasks.length === 0 ? (
              <div className="rounded-lg border border-dashed border-border/70 px-4 py-8 text-center text-sm text-muted-foreground">
                No tenés tareas pendientes para arrastrar. Las finalizadas quedan afuera de esta vista.
              </div>
            ) : (
              <div className="flex flex-wrap gap-3">
                {pendingTasks.map((task) => (
                  <button
                    key={task.id}
                    type="button"
                    draggable
                    onDragStart={(event) => {
                      event.dataTransfer.setData('text/plain', task.id);
                      event.dataTransfer.effectAllowed = 'move';
                      setDraggedTaskId(task.id);
                    }}
                    onDragEnd={() => setDraggedTaskId(null)}
                    onClick={() => setSelectedTask(task)}
                    className={cn(
                      'flex min-h-16 w-full items-start gap-2.5 rounded-lg border border-border/70 bg-card px-2.5 py-2.5 text-left shadow-sm transition-colors hover:border-primary/40 hover:bg-muted/30 sm:w-[calc(50%-0.375rem)] lg:w-[calc(33.333%-0.5rem)] xl:w-[calc(20%-0.6rem)]',
                      draggedTaskId === task.id && 'border-primary/50 opacity-70',
                    )}
                  >
                    <span className="rounded-md bg-muted p-1 text-muted-foreground">
                      <GripVertical className="h-3.5 w-3.5" />
                    </span>
                    <div className="min-w-0 flex-1 space-y-1.5">
                      <div className="flex flex-wrap items-center gap-1.5">
                        {task.project_id ? (
                          <Badge variant="outline" className="max-w-full truncate text-[10px]">
                            {projectById.get(task.project_id)?.name || 'Proyecto'}
                          </Badge>
                        ) : (
                          <Badge variant="secondary" className="text-[10px]">Interna</Badge>
                        )}
                        <StatusBadge status={task.status} className="text-[10px]" />
                      </div>
                      <p className="line-clamp-2 text-xs font-medium leading-snug">{task.title}</p>
                      <p className="text-[11px] text-muted-foreground">
                        {task.scheduled_date
                          ? `Programada para ${task.scheduled_date}${task.scheduled_time ? ` · ${task.scheduled_time.slice(0, 5)}` : ''}`
                          : 'Todavía sin fecha'}
                      </p>
                    </div>
                  </button>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        <div className="grid gap-6 xl:grid-cols-[minmax(0,1.6fr)_minmax(320px,0.9fr)]">
          <Card>
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between gap-3">
                <div>
                  <CardTitle className="text-base font-medium capitalize">
                    {format(currentMonth, 'MMMM yyyy', { locale: es })}
                  </CardTitle>
                  <p className="mt-1 text-sm text-muted-foreground">
                    Soltá una tarea sobre un día para asignarle esa fecha.
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <Button
                    variant="outline"
                    size="icon"
                    className="h-8 w-8"
                    onClick={() => setCurrentMonth((month) => subMonths(month, 1))}
                  >
                    <ChevronLeft className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      const today = new Date();
                      setCurrentMonth(startOfMonth(today));
                      setSelectedDate(today);
                    }}
                  >
                    Hoy
                  </Button>
                  <Button
                    variant="outline"
                    size="icon"
                    className="h-8 w-8"
                    onClick={() => setCurrentMonth((month) => addMonths(month, 1))}
                  >
                    <ChevronRight className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-7 gap-2">
                {weekdayLabels.map((label) => (
                  <div
                    key={label}
                    className="px-1 pb-1 text-center text-[11px] font-semibold uppercase tracking-wide text-muted-foreground"
                  >
                    {label}
                  </div>
                ))}
                {calendarDays.map((day) => {
                  const dayKey = format(day, 'yyyy-MM-dd');
                  const dayTasks = tasksByDate.get(dayKey) || [];
                  const dayGoogleEvents = googleEventsByDate.get(dayKey) || [];
                  const isCurrentMonth = isSameMonth(day, currentMonth);
                  const isSelected = isSameDay(day, selectedDate);
                  const isDropActive = draggedTaskId !== null;

                  return (
                    <button
                      key={dayKey}
                      type="button"
                      onClick={() => setSelectedDate(day)}
                      onDragOver={(event) => event.preventDefault()}
                      onDrop={(event) => {
                        event.preventDefault();
                        const taskId = event.dataTransfer.getData('text/plain') || draggedTaskId;
                        if (taskId) {
                          void handleDropTask(taskId, day);
                        }
                      }}
                      className={cn(
                        'min-h-28 rounded-lg border p-2 text-left transition-colors sm:min-h-32',
                        isCurrentMonth ? 'border-border/70 bg-card hover:bg-muted/20' : 'border-border/40 bg-muted/20 text-muted-foreground/70',
                        isSelected && 'border-primary ring-2 ring-primary/10',
                        isDropActive && 'hover:border-primary/60',
                      )}
                    >
                      <div className="flex items-center justify-between gap-2">
                        <span
                          className={cn(
                            'inline-flex h-7 w-7 items-center justify-center rounded-md text-sm font-medium',
                            isToday(day) && 'bg-primary text-primary-foreground',
                          )}
                        >
                          {format(day, 'd')}
                        </span>
                        {dayTasks.length > 0 && (
                          <Badge variant="outline" className="h-6 px-2 text-[10px]">
                            {dayTasks.length}
                          </Badge>
                        )}
                      </div>
                      {dayGoogleEvents.length > 0 && (
                        <div className="mt-1.5 flex flex-wrap gap-1">
                          {dayGoogleEvents.slice(0, 3).map((event) => (
                            <span key={event.id} className="h-1.5 w-1.5 rounded-full bg-accent-blue" />
                          ))}
                          {dayGoogleEvents.length > 3 && (
                            <span className="text-[10px] text-muted-foreground">+{dayGoogleEvents.length - 3}</span>
                          )}
                        </div>
                      )}
                      <div className="mt-2 space-y-1.5">
                        {dayTasks.slice(0, 3).map((task) => (
                          <div
                            key={task.id}
                            className="rounded-md bg-muted px-2 py-1 text-[11px] leading-tight text-foreground"
                          >
                            <div className="truncate font-medium">{task.title}</div>
                            <div className="truncate text-[10px] text-muted-foreground">
                              {task.scheduled_time ? task.scheduled_time.slice(0, 5) : 'Sin hora'}
                            </div>
                          </div>
                        ))}
                        {dayTasks.length > 3 && (
                          <div className="text-[11px] text-muted-foreground">
                            +{dayTasks.length - 3} más
                          </div>
                        )}
                      </div>
                    </button>
                  );
                })}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base font-medium capitalize">
                {format(selectedDate, "EEEE d 'de' MMMM", { locale: es })}
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-5">
              {googleCalendarStatus.data?.connected && (
                <div className="space-y-3 rounded-lg border border-border/70 bg-muted/20 p-3">
                  <div className="flex items-center justify-between gap-3">
                    <div>
                      <p className="text-sm font-medium">Disponibilidad de Google Calendar</p>
                      <p className="text-xs text-muted-foreground">
                        Tus bloques ocupados y huecos libres entre las 09:00 y las 18:00.
                      </p>
                    </div>
                    {googleAvailability.isLoading && <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />}
                  </div>

                  {selectedDateGoogleEvents.length === 0 ? (
                    <div className="rounded-md border border-dashed border-border/70 px-3 py-2 text-xs text-muted-foreground">
                      Libre todo el día.
                    </div>
                  ) : (
                    <div className="space-y-2">
                      {selectedDateGoogleEvents.map((event) => {
                        const start = parseGoogleEventDate(event.start);
                        const end = parseGoogleEventDate(event.end);

                        return (
                          <div key={event.id} className="rounded-md border border-border/70 bg-card px-3 py-2">
                            <div className="text-xs font-medium">{event.title}</div>
                            <div className="mt-1 text-[11px] text-muted-foreground">
                              {event.all_day || !start || !end ? 'Todo el día' : formatHourRange(start, end)}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}

                  <div className="space-y-2">
                    <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                      Huecos disponibles
                    </p>
                    {availabilitySlots.length === 0 ? (
                      <div className="rounded-md border border-dashed border-border/70 px-3 py-2 text-xs text-muted-foreground">
                        Ese día no te queda hueco libre dentro del horario laboral.
                      </div>
                    ) : (
                      <div className="flex flex-wrap gap-2">
                        {availabilitySlots.map((slot) => (
                          <Badge key={`${slot.start.toISOString()}-${slot.end.toISOString()}`} variant="outline">
                            {formatHourRange(slot.start, slot.end)}
                          </Badge>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              )}

              <div className="space-y-3">
              {isLoading ? (
                <div className="space-y-3">
                  {Array.from({ length: 3 }).map((_, index) => (
                    <Skeleton key={index} className="h-24 rounded-lg" />
                  ))}
                </div>
              ) : selectedDateTasks.length === 0 ? (
                <div className="rounded-lg border border-dashed border-border/70 px-4 py-8 text-center text-sm text-muted-foreground">
                  No hay tareas programadas para este día.
                </div>
              ) : (
                <div className="space-y-3">
                  {selectedDateTasks.map((task) => (
                    <div
                      key={task.id}
                      className="rounded-lg border border-border/70 bg-card p-3"
                    >
                      <div className="flex items-start justify-between gap-3">
                        <button
                          type="button"
                          onClick={() => setSelectedTask(task)}
                          className="min-w-0 flex-1 text-left"
                        >
                          <div className="flex flex-wrap items-center gap-2">
                            {task.project_id ? (
                              <Badge variant="outline" className="max-w-full truncate">
                                {projectById.get(task.project_id)?.name || 'Proyecto'}
                              </Badge>
                            ) : (
                              <Badge variant="secondary">Interna</Badge>
                            )}
                            <StatusBadge status={task.status} />
                          </div>
                          <p className="mt-3 text-sm font-medium leading-snug">{task.title}</p>
                          <p className="mt-1 text-xs text-muted-foreground">
                            {task.scheduled_time ? `Desde ${task.scheduled_time.slice(0, 5)}` : 'Sin horario definido'}
                          </p>
                        </button>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8 shrink-0 text-muted-foreground"
                          disabled={updateTask.isPending}
                          onClick={() => void handleClearDate(task)}
                        >
                          {updateTask.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <X className="h-4 w-4" />}
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      <TaskDetailSheet
        task={selectedTask}
        open={!!selectedTask}
        onOpenChange={(open) => {
          if (!open) setSelectedTask(null);
        }}
      />
    </AppLayout>
  );
}
