import { useMemo, useState } from 'react';
import { CalendarDays, LineChart as LineChartIcon, UserRound } from 'lucide-react';
import { CartesianGrid, Line, LineChart, XAxis, YAxis } from 'recharts';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
  type ChartConfig,
} from '@/components/ui/chart';
import type { Task } from '@/hooks/useData';
import type { TaskAssignee } from '@/hooks/useTaskAssignees';
import type { Profile } from '@/hooks/useProfiles';
import { cn } from '@/lib/utils';

interface TaskActivityChartProps {
  tasks: Task[];
  assignees: TaskAssignee[];
  profiles: Profile[];
  selectedMonth?: string;
  onSelectedMonthChange?: (month: string) => void;
  className?: string;
}

const chartConfig = {
  creadas: {
    label: 'Creadas',
    color: 'hsl(var(--accent-blue))',
  },
  enProgreso: {
    label: 'En progreso',
    color: 'hsl(var(--accent-amber))',
  },
  finalizadas: {
    label: 'Finalizadas',
    color: 'hsl(var(--status-done))',
  },
} satisfies ChartConfig;

function getMonthValue(date: Date) {
  const month = String(date.getMonth() + 1).padStart(2, '0');
  return `${date.getFullYear()}-${month}`;
}

function getTaskMonthValue(dateValue: string) {
  const date = new Date(dateValue);
  if (Number.isNaN(date.getTime())) return null;
  return getMonthValue(date);
}

function getDayIndex(dateValue: string) {
  const date = new Date(dateValue);
  if (Number.isNaN(date.getTime())) return null;
  return date.getDate() - 1;
}

function getPersonName(userId: string, profiles: Profile[]) {
  const profile = profiles.find((item) => item.user_id === userId);
  return profile?.name || profile?.email || `Usuario ${userId.slice(0, 8)}`;
}

export function TaskActivityChart({
  tasks,
  assignees,
  profiles,
  selectedMonth: selectedMonthProp,
  onSelectedMonthChange,
  className,
}: TaskActivityChartProps) {
  const [internalSelectedMonth, setInternalSelectedMonth] = useState(() => getMonthValue(new Date()));
  const [personFilter, setPersonFilter] = useState('all');
  const hasExternalMonth = !!selectedMonthProp && !!onSelectedMonthChange;
  const selectedMonth = selectedMonthProp || internalSelectedMonth;
  const setSelectedMonth = (month: string) => {
    if (onSelectedMonthChange) {
      onSelectedMonthChange(month);
      return;
    }

    setInternalSelectedMonth(month);
  };

  const taskAssigneesByTaskId = useMemo(() => {
    const grouped = new Map<string, Set<string>>();

    tasks.forEach((task) => {
      grouped.set(task.id, new Set(task.assignee_id ? [task.assignee_id] : []));
    });

    assignees.forEach((assignee) => {
      const current = grouped.get(assignee.task_id) || new Set<string>();
      current.add(assignee.user_id);
      grouped.set(assignee.task_id, current);
    });

    return grouped;
  }, [assignees, tasks]);

  const peopleOptions = useMemo(() => {
    const personIds = new Set<string>();
    let hasUnassigned = false;

    tasks.forEach((task) => {
      const assignedPeople = taskAssigneesByTaskId.get(task.id) || new Set<string>();
      if (assignedPeople.size === 0) {
        hasUnassigned = true;
        return;
      }

      assignedPeople.forEach((userId) => personIds.add(userId));
    });

    const people = Array.from(personIds)
      .map((userId) => ({ userId, name: getPersonName(userId, profiles) }))
      .sort((a, b) => a.name.localeCompare(b.name));

    return { people, hasUnassigned };
  }, [profiles, taskAssigneesByTaskId, tasks]);

  const chartData = useMemo(() => {
    const [yearValue, monthValue] = selectedMonth.split('-').map(Number);
    const monthIndex = monthValue - 1;
    const daysInMonth = new Date(yearValue, monthIndex + 1, 0).getDate();
    const baseData = Array.from({ length: daysInMonth }, (_, index) => ({
      day: String(index + 1).padStart(2, '0'),
      creadas: 0,
      enProgreso: 0,
      finalizadas: 0,
    }));

    tasks.forEach((task) => {
      const assignedPeople = taskAssigneesByTaskId.get(task.id) || new Set<string>();
      const matchesPerson =
        personFilter === 'all'
        || (personFilter === 'unassigned' && assignedPeople.size === 0)
        || assignedPeople.has(personFilter);

      if (!matchesPerson) return;

      if (getTaskMonthValue(task.created_at) === selectedMonth) {
        const createdDayIndex = getDayIndex(task.created_at);
        if (createdDayIndex !== null && baseData[createdDayIndex]) {
          baseData[createdDayIndex].creadas += 1;
        }
      }

      if (task.status === 'in-progress' && getTaskMonthValue(task.updated_at) === selectedMonth) {
        const progressDayIndex = getDayIndex(task.updated_at);
        if (progressDayIndex !== null && baseData[progressDayIndex]) {
          baseData[progressDayIndex].enProgreso += 1;
        }
      }

      if (task.status === 'done' && getTaskMonthValue(task.updated_at) === selectedMonth) {
        const finishedDayIndex = getDayIndex(task.updated_at);
        if (finishedDayIndex !== null && baseData[finishedDayIndex]) {
          baseData[finishedDayIndex].finalizadas += 1;
        }
      }
    });

    return baseData;
  }, [personFilter, selectedMonth, taskAssigneesByTaskId, tasks]);

  const totals = chartData.reduce(
    (currentTotals, day) => ({
      creadas: currentTotals.creadas + day.creadas,
      enProgreso: currentTotals.enProgreso + day.enProgreso,
      finalizadas: currentTotals.finalizadas + day.finalizadas,
    }),
    { creadas: 0, enProgreso: 0, finalizadas: 0 },
  );
  const selectedMonthLabel = useMemo(() => {
    const [yearValue, monthValue] = selectedMonth.split('-').map(Number);
    return new Intl.DateTimeFormat('es-AR', { month: 'long', year: 'numeric' }).format(
      new Date(yearValue, monthValue - 1, 1),
    );
  }, [selectedMonth]);

  return (
    <Card className={cn('animate-fade-in border-border/80 hover:border-border transition-colors', className)}>
      <CardHeader className="space-y-4 pb-4">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10">
              <LineChartIcon className="h-5 w-5 text-primary" />
            </div>
            <div>
              <CardTitle className="text-base font-semibold">Actividad diaria de tareas</CardTitle>
              <p className="text-xs text-muted-foreground mt-0.5">
                Creadas, en progreso y finalizadas durante {selectedMonthLabel}
              </p>
            </div>
          </div>
          <div className="grid grid-cols-3 gap-2 rounded-xl border border-border/70 bg-muted/20 px-3 py-2 text-right">
            <div>
              <p className="text-[10px] uppercase tracking-wide text-muted-foreground">Creadas</p>
              <p className="text-xl font-semibold leading-none">{totals.creadas}</p>
            </div>
            <div>
              <p className="text-[10px] uppercase tracking-wide text-muted-foreground">En progreso</p>
              <p className="text-xl font-semibold leading-none">{totals.enProgreso}</p>
            </div>
            <div>
              <p className="text-[10px] uppercase tracking-wide text-muted-foreground">Finalizadas</p>
              <p className="text-xl font-semibold leading-none">{totals.finalizadas}</p>
            </div>
          </div>
        </div>

        <div className={cn('grid gap-3', hasExternalMonth ? 'sm:grid-cols-1' : 'sm:grid-cols-2')}>
          {!hasExternalMonth && (
            <div className="space-y-1.5">
              <Label htmlFor="task-activity-month" className="flex items-center gap-1.5 text-xs text-muted-foreground">
                <CalendarDays className="h-3.5 w-3.5" />
                Mes
              </Label>
              <Input
                id="task-activity-month"
                type="month"
                value={selectedMonth}
                onChange={(event) => {
                  if (event.target.value) setSelectedMonth(event.target.value);
                }}
              />
            </div>
          )}
          <div className="space-y-1.5">
            <Label className="flex items-center gap-1.5 text-xs text-muted-foreground">
              <UserRound className="h-3.5 w-3.5" />
              Persona
            </Label>
            <Select value={personFilter} onValueChange={setPersonFilter}>
              <SelectTrigger>
                <SelectValue placeholder="Seleccionar persona" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todas las personas</SelectItem>
                {peopleOptions.people.map((person) => (
                  <SelectItem key={person.userId} value={person.userId}>
                    {person.name}
                  </SelectItem>
                ))}
                {peopleOptions.hasUnassigned && (
                  <SelectItem value="unassigned">Sin asignar</SelectItem>
                )}
              </SelectContent>
            </Select>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <ChartContainer config={chartConfig} className="h-[380px] w-full">
          <LineChart data={chartData} margin={{ top: 12, right: 16, left: 0, bottom: 0 }}>
            <CartesianGrid vertical={false} strokeDasharray="4 4" />
            <XAxis
              dataKey="day"
              tickLine={false}
              axisLine={false}
              minTickGap={14}
              tickMargin={10}
            />
            <YAxis allowDecimals={false} tickLine={false} axisLine={false} width={28} />
            <ChartTooltip
              cursor={false}
              content={
                <ChartTooltipContent
                  labelFormatter={(value) => `Día ${value}`}
                  indicator="line"
                />
              }
            />
            <Line
              dataKey="creadas"
              type="monotone"
              stroke="var(--color-creadas)"
              strokeWidth={3}
              dot={{ r: 2.5 }}
              activeDot={{ r: 5 }}
            />
            <Line
              dataKey="enProgreso"
              type="monotone"
              stroke="var(--color-enProgreso)"
              strokeWidth={3}
              dot={{ r: 2.5 }}
              activeDot={{ r: 5 }}
            />
            <Line
              dataKey="finalizadas"
              type="monotone"
              stroke="var(--color-finalizadas)"
              strokeWidth={3}
              dot={{ r: 2.5 }}
              activeDot={{ r: 5 }}
            />
          </LineChart>
        </ChartContainer>
      </CardContent>
    </Card>
  );
}
