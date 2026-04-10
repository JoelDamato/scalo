import { AppLayout } from '@/components/layout/AppLayout';
import { StatCard } from '@/components/dashboard/StatCard';
import { ActiveTasksCard } from '@/components/dashboard/ActiveTasksCard';
import { NeedsInputCard } from '@/components/dashboard/NeedsInputCard';
import { ClientDashboard } from '@/components/dashboard/ClientDashboard';
import { Project, useProjects, useTasks, useActivities, useProfile } from '@/hooks/useData';
import { useAuth } from '@/hooks/useAuth';
import { Skeleton } from '@/components/ui/skeleton';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { FolderKanban, CheckSquare, AlertCircle, LifeBuoy, Plus, Upload, ArrowRight, CircleDot, Users } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

export default function Dashboard() {
  const { user, isAdmin } = useAuth();
  const { data: profile } = useProfile(user?.id);
  const { data: projects = [], isLoading: projectsLoading } = useProjects();
  const { data: tasks = [], isLoading: tasksLoading } = useTasks();
  const { data: activities = [], isLoading: activitiesLoading } = useActivities();
  const navigate = useNavigate();

  const isLoading = projectsLoading || tasksLoading || activitiesLoading;
  const userName = profile?.name?.split(' ')[0] || 'there';

  // Contextual greeting
  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return 'Buenos días';
    if (hour < 18) return 'Buenas tardes';
    return 'Buenas noches';
  };

  // Stats
  const activeProjects = projects.filter(p => p.status === 'active').length;
  const supportActiveProjects = projects
    .filter(p => p.support_active)
    .sort((a, b) => {
      if (a.status === 'active' && b.status !== 'active') return -1;
      if (a.status !== 'active' && b.status === 'active') return 1;
      return new Date(b.updated_at).getTime() - new Date(a.updated_at).getTime();
    });
  const tasksDueToday = tasks.filter(t => t.status === 'in-progress').length;
  const openIssues = tasks.filter(t => t.status === 'review' && t.client_input_required).length;

  if (isLoading) {
    return (
      <AppLayout title="Dashboard" description="Resumen de tus proyectos">
        <div className="max-w-7xl mx-auto space-y-8">
          <div className="flex items-center justify-between">
            <Skeleton className="h-12 w-96" />
            <Skeleton className="h-10 w-40" />
          </div>
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            {[1, 2, 3, 4].map(i => <Skeleton key={i} className="h-28" />)}
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
          activities={activities}
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
              Acá tenés un resumen de lo que está pasando hoy.
            </p>
          </div>
          <div className="flex items-center gap-3">
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
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <StatCard
            title="Proyectos activos"
            value={activeProjects}
            icon={FolderKanban}
            accentColor="blue"
            delay={0}
          />
          <StatCard
            title="Tareas en progreso"
            value={tasksDueToday}
            icon={CheckSquare}
            accentColor="amber"
            delay={50}
          />
          <StatCard
            title="Issues abiertos"
            value={openIssues}
            icon={AlertCircle}
            accentColor="rose"
            delay={100}
          />
          <StatCard
            title="Soporte activo"
            value={supportActiveProjects.length}
            icon={LifeBuoy}
            accentColor="green"
            delay={150}
          />
        </div>

        {/* Main content grid */}
        <div className="grid gap-5 lg:grid-cols-2">
          {/* Recent Activity with View All */}
          <Card className="animate-fade-in border-border/80 hover:border-border transition-colors">
            <CardHeader className="flex flex-row items-center justify-between pb-4">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-accent-violet/10">
                  <Users className="h-5 w-5 text-accent-violet" />
                </div>
                <div>
                  <CardTitle className="text-base font-semibold">Actividad reciente</CardTitle>
                  <p className="text-xs text-muted-foreground mt-0.5">Últimas actualizaciones de proyectos</p>
                </div>
              </div>
              <Button variant="ghost" size="sm" onClick={() => navigate('/activity')} className="text-muted-foreground hover:text-foreground">
                Ver todo
              </Button>
            </CardHeader>
            <CardContent>
              <RecentActivityInline activities={activities} />
            </CardContent>
          </Card>

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

          {/* Needs Input */}
          <NeedsInputCard tasks={tasks} />

          {/* Active Work */}
          <ActiveTasksCard tasks={tasks} />
        </div>
      </div>
    </AppLayout>
  );
}

// Inline activity list component
function RecentActivityInline({ activities }: { activities: any[] }) {
  const recentActivity = activities.slice(0, 6);
  
  if (recentActivity.length === 0) {
    return <p className="text-sm text-muted-foreground py-4 text-center">Sin actividad reciente</p>;
  }

  return (
    <div className="space-y-0 divide-y divide-border">
      {recentActivity.map((item) => (
        <div key={item.id} className="flex items-center gap-4 py-3">
          <div className="text-xs text-muted-foreground w-16 shrink-0">
            {new Date(item.created_at).toLocaleTimeString('es-AR', { 
              hour: 'numeric', 
              minute: '2-digit',
              hour12: false 
            })}
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm text-foreground truncate">{item.message}</p>
          </div>
        </div>
      ))}
    </div>
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
