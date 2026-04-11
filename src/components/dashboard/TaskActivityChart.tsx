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
  className?: string;
}

const chartConfig = {
  tareas: {
    label: 'Tareas',
    color: 'hsl(var(--primary))',
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

function getPersonName(userId: string, profiles: Profile[]) {
  const profile = profiles.find((item) => item.user_id === userId);
  return profile?.name || profile?.email || `Usuario ${userId.slice(0, 8)}`;
}

export function TaskActivityChart({ tasks, assignees, profiles, className }: TaskActivityChartProps) {
  const [selectedMonth, setSelectedMonth] = useState(() => getMonthValue(new Date()));
  const [personFilter, setPersonFilter] = useState('all');

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
      tareas: 0,
    }));

    tasks.forEach((task) => {
      if (getTaskMonthValue(task.created_at) !== selectedMonth) return;

      const assignedPeople = taskAssigneesByTaskId.get(task.id) || new Set<string>();
      const matchesPerson =
        personFilter === 'all'
        || (personFilter === 'unassigned' && assignedPeople.size === 0)
        || assignedPeople.has(personFilter);

      if (!matchesPerson) return;

      const createdAt = new Date(task.created_at);
      const dayIndex = createdAt.getDate() - 1;
      if (baseData[dayIndex]) {
        baseData[dayIndex].tareas += 1;
      }
    });

    return baseData;
  }, [personFilter, selectedMonth, taskAssigneesByTaskId, tasks]);

  const totalTasks = chartData.reduce((total, day) => total + day.tareas, 0);
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
                Tareas creadas por día durante {selectedMonthLabel}
              </p>
            </div>
          </div>
          <div className="rounded-xl border border-border/70 bg-muted/20 px-3 py-2 text-right">
            <p className="text-[11px] uppercase tracking-wide text-muted-foreground">Total del mes</p>
            <p className="text-2xl font-semibold leading-none">{totalTasks}</p>
          </div>
        </div>

        <div className="grid gap-3 sm:grid-cols-2">
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
        <ChartContainer config={chartConfig} className="h-[260px] w-full">
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
              dataKey="tareas"
              type="monotone"
              stroke="var(--color-tareas)"
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
