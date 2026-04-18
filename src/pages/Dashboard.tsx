import { AppLayout } from '@/components/layout/AppLayout';
import { StatCard } from '@/components/dashboard/StatCard';
import { ActiveTasksCard } from '@/components/dashboard/ActiveTasksCard';
import { ClientDashboard } from '@/components/dashboard/ClientDashboard';
import { TaskActivityChart } from '@/components/dashboard/TaskActivityChart';
import { Project, useProjects, useTasks, useProfile } from '@/hooks/useData';
import { useTasksAssignees } from '@/hooks/useTaskAssignees';
import { useProfiles } from '@/hooks/useProfiles';
import { useCustomers } from '@/hooks/useCRM';
import { useAuth } from '@/hooks/useAuth';
import { Skeleton } from '@/components/ui/skeleton';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { FolderKanban, CheckSquare, AlertCircle, LifeBuoy, Plus, Upload, ArrowRight, CircleDot, CheckCircle2, CalendarDays, UsersRound } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useMemo, useState } from 'react';

function getMonthValue(date: Date) {
  const month = String(date.getMonth() + 1).padStart(2, '0');
  return `${date.getFullYear()}-${month}`;
}

function getMonthRange(monthValue: string) {
  const [year, month] = monthValue.split('-').map(Number);
  const start = new Date(year, month - 1, 1);
  const end = new Date(year, month, 0, 23, 59, 59, 999);
  return { start, end };
}

function isDateInRange(dateValue: string | null | undefined, start: Date, end: Date) {
  if (!dateValue) return false;
  const date = new Date(dateValue);
  if (Number.isNaN(date.getTime())) return false;
  return date >= start && date <= end;
}

function isDateBeforeOrInRange(dateValue: string | null | undefined, end: Date) {
  if (!dateValue) return false;
  const date = new Date(dateValue);
  if (Number.isNaN(date.getTime())) return false;
  return date <= end;
}

export default function Dashboard() {
  const { user, isAdmin } = useAuth();
  const { data: profile } = useProfile(user?.id);
  const { data: projects = [], isLoading: projectsLoading } = useProjects();
  const { data: tasks = [], isLoading: tasksLoading } = useTasks();
  const { data: customers = [], isLoading: customersLoading } = useCustomers();
  const taskIds = useMemo(() => (isAdmin ? tasks.map((task) => task.id) : []), [isAdmin, tasks]);
  const { data: taskAssignees = [], isLoading: taskAssigneesLoading } = useTasksAssignees(taskIds);
  const { data: profiles = [] } = useProfiles();
  const navigate = useNavigate();
  const [selectedMonth, setSelectedMonth] = useState(() => getMonthValue(new Date()));

  const isLoading = projectsLoading || tasksLoading || customersLoading || (isAdmin && taskAssigneesLoading);
  const userName = profile?.name?.split(' ')[0] || 'there';

  // Contextual greeting
  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return 'Buenos días';
    if (hour < 18) return 'Buenas tardes';
    return 'Buenas noches';
  };

  // Stats
  const selectedMonthRange = useMemo(() => getMonthRange(selectedMonth), [selectedMonth]);
  const selectedMonthLabel = useMemo(() => (
    new Intl.DateTimeFormat('es-AR', { month: 'long', year: 'numeric' }).format(selectedMonthRange.start)
  ), [selectedMonthRange.start]);
  const activeCustomers = customers.filter((customer) =>
    customer.stage === 'client' && isDateBeforeOrInRange(customer.created_at, selectedMonthRange.end)
  ).length;
  const activeProjects = projects.filter((project) =>
    project.status === 'active' && isDateBeforeOrInRange(project.created_at, selectedMonthRange.end)
  ).length;
  const supportActiveProjects = projects
    .filter((project) => project.support_active && isDateBeforeOrInRange(project.created_at, selectedMonthRange.end))
    .sort((a, b) => {
      if (a.status === 'active' && b.status !== 'active') return -1;
      if (a.status !== 'active' && b.status === 'active') return 1;
      return new Date(b.updated_at).getTime() - new Date(a.updated_at).getTime();
    });
  const createdTasks = tasks.filter((task) =>
    isDateInRange(task.created_at, selectedMonthRange.start, selectedMonthRange.end)
  ).length;
  const finishedTasks = tasks.filter((task) =>
    task.status === 'done' && isDateInRange(task.updated_at, selectedMonthRange.start, selectedMonthRange.end)
  ).length;
  const inProgressTasks = tasks.filter((task) =>
    task.status === 'in-progress' && isDateInRange(task.updated_at, selectedMonthRange.start, selectedMonthRange.end)
  ).length;
  const openIssues = tasks.filter((task) =>
    task.status === 'review'
    && task.client_input_required
    && isDateInRange(task.updated_at, selectedMonthRange.start, selectedMonthRange.end)
  ).length;

  if (isLoading) {
    return (
      <AppLayout title="Dashboard" description="Resumen de tus proyectos">
        <div className="max-w-7xl mx-auto space-y-8">
          <div className="flex items-center justify-between">
            <Skeleton className="h-12 w-96" />
            <Skeleton className="h-10 w-40" />
          </div>
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4 xl:grid-cols-7">
            {[1, 2, 3, 4, 5, 6, 7].map(i => <Skeleton key={i} className="h-28" />)}
          </div>
          <div className="grid gap-6 lg:grid-cols-2">
            <Skeleton className="h-80" />
            <Skeleton className="h-80" />
          </div>
        </div>
      </AppLayout>
    );
  }

  // Client Dashboard - Focused on their projects
  if (!isAdmin) {
    return (
      <AppLayout title="Dashboard" description="Estado de tus proyectos">
        <ClientDashboard 
          userName={userName}
          projects={projects}
          tasks={tasks}
        />
      </AppLayout>
    );
  }

  // Admin Dashboard
  return (
    <AppLayout title="Dashboard" description="Resumen de tus proyectos">
      <div className="max-w-7xl mx-auto space-y-8">
        {/* Header with welcome and actions */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h2 className="text-2xl font-semibold tracking-tight">
              {getGreeting()}, {userName}!
            </h2>
            <p className="text-muted-foreground mt-1">
              Acá tenés un resumen de {selectedMonthLabel}.
            </p>
          </div>
          <div className="flex flex-col gap-3 sm:flex-row sm:items-end">
            <div className="space-y-1.5">
              <Label htmlFor="dashboard-month" className="flex items-center gap-1.5 text-xs text-muted-foreground">
                <CalendarDays className="h-3.5 w-3.5" />
                Mes
              </Label>
              <Input
                id="dashboard-month"
                type="month"
                value={selectedMonth}
                onChange={(event) => {
                  if (event.target.value) setSelectedMonth(event.target.value);
                }}
                className="w-full sm:w-44"
              />
            </div>
            <Button variant="outline" size="sm" className="gap-2">
              <Upload className="h-4 w-4" />
              Importar
            </Button>
            <Button size="sm" className="gap-2" onClick={() => navigate('/projects')}>
              <Plus className="h-4 w-4" />
              Nuevo Proyecto
            </Button>
          </div>
        </div>

        {/* Stat cards row */}
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4 xl:grid-cols-7">
          <StatCard
            title="Clientes activos"
            value={activeCustomers}
            icon={UsersRound}
            accentColor="green"
            delay={0}
          />
          <StatCard
            title="Proyectos activos"
            value={activeProjects}
            icon={FolderKanban}
            accentColor="blue"
            delay={50}
          />
          <StatCard
            title="Tareas creadas"
            value={createdTasks}
            icon={CheckSquare}
            accentColor="amber"
            delay={100}
          />
          <StatCard
            title="Tareas finalizadas"
            value={finishedTasks}
            icon={CheckCircle2}
            accentColor="green"
            delay={150}
          />
          <StatCard
            title="Issues abiertos"
            value={openIssues}
            icon={AlertCircle}
            accentColor="rose"
            delay={200}
          />
          <StatCard
            title="Tareas en progreso"
            value={inProgressTasks}
            icon={CheckSquare}
            accentColor="amber"
            delay={250}
          />
          <StatCard
            title="Soporte activo"
            value={supportActiveProjects.length}
            icon={LifeBuoy}
            accentColor="blue"
            delay={300}
          />
        </div>

        {/* Main content grid */}
        <div className="grid gap-5 lg:grid-cols-2">
          <TaskActivityChart
            tasks={tasks}
            assignees={taskAssignees}
            profiles={profiles}
            selectedMonth={selectedMonth}
            onSelectedMonthChange={setSelectedMonth}
          />

          {/* Active support projects */}
          <Card className="animate-fade-in border-border/80 hover:border-border transition-colors" style={{ animationDelay: '50ms' }}>
            <CardHeader className="flex flex-row items-center justify-between pb-4">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-500/10">
                  <LifeBuoy className="h-5 w-5 text-emerald-500" />
                </div>
                <div>
                  <CardTitle className="text-base font-semibold">Proyectos con soporte activo</CardTitle>
                  <p className="text-xs text-muted-foreground mt-0.5">Seguimiento rápido de mantenimiento y soporte vigente</p>
                </div>
              </div>
              <Button variant="ghost" size="sm" onClick={() => navigate('/projects')} className="text-muted-foreground hover:text-foreground">
                Ver proyectos
              </Button>
            </CardHeader>
            <CardContent>
              <SupportActiveProjectsList projects={supportActiveProjects} onOpenProject={(projectId) => navigate(`/projects/${projectId}`)} />
            </CardContent>
          </Card>

          {/* Active Work */}
          <ActiveTasksCard tasks={tasks} />
        </div>
      </div>
    </AppLayout>
  );
}

function SupportActiveProjectsList({
  projects,
  onOpenProject,
}: {
  projects: Project[];
  onOpenProject: (projectId: string) => void;
}) {
  if (projects.length === 0) {
    return (
      <div className="rounded-xl border border-dashed border-border/70 bg-muted/20 px-4 py-8 text-center">
        <LifeBuoy className="mx-auto h-10 w-10 text-muted-foreground/40" />
        <p className="mt-3 text-sm font-medium">No hay proyectos con soporte activo</p>
        <p className="mt-1 text-xs text-muted-foreground">
          Puedes activarlo desde el detalle o al crear un proyecto.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {projects.slice(0, 5).map((project) => (
        <button
          key={project.id}
          type="button"
          onClick={() => onOpenProject(project.id)}
          className="flex w-full items-center justify-between rounded-xl border border-border/70 bg-background/40 px-4 py-3 text-left transition-colors hover:bg-muted/40"
        >
          <div className="min-w-0">
            <div className="flex items-center gap-2">
              <CircleDot className={`h-3.5 w-3.5 shrink-0 ${project.status === 'active' ? 'text-emerald-500' : 'text-amber-500'}`} />
              <p className="truncate font-medium">{project.name}</p>
            </div>
            <p className="mt-1 truncate text-xs text-muted-foreground">
              {project.description || 'Sin descripción cargada'}
            </p>
          </div>
          <div className="ml-4 flex shrink-0 items-center gap-2">
            <Badge
              variant="outline"
              className={project.status === 'active'
                ? 'border-emerald-500/30 bg-emerald-500/10 text-emerald-400'
                : 'border-amber-500/30 bg-amber-500/10 text-amber-400'}
            >
              {project.status === 'active' ? 'Activo' : 'No operativo'}
            </Badge>
            <ArrowRight className="h-4 w-4 text-muted-foreground" />
          </div>
        </button>
      ))}
    </div>
  );
}
