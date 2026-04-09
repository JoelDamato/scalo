import { AppLayout } from '@/components/layout/AppLayout';
import { StatCard } from '@/components/dashboard/StatCard';
import { ActiveTasksCard } from '@/components/dashboard/ActiveTasksCard';
import { NeedsInputCard } from '@/components/dashboard/NeedsInputCard';
import { ClientDashboard } from '@/components/dashboard/ClientDashboard';
import { useProjects, useTasks, useActivities, useProfile } from '@/hooks/useData';
import { useAuth } from '@/hooks/useAuth';
import { Skeleton } from '@/components/ui/skeleton';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { FolderKanban, CheckSquare, AlertCircle, Users, Plus, Upload } from 'lucide-react';
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
            title="Total de tareas"
            value={tasks.length}
            icon={Users}
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

          {/* Tasks Card with Chart placeholder */}
          <Card className="animate-fade-in border-border/80 hover:border-border transition-colors" style={{ animationDelay: '50ms' }}>
            <CardHeader className="flex flex-row items-center justify-between pb-4">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-accent-blue/10">
                  <CheckSquare className="h-5 w-5 text-accent-blue" />
                </div>
                <div>
                  <CardTitle className="text-base font-semibold">Velocidad de tareas</CardTitle>
                  <p className="text-xs text-muted-foreground mt-0.5">Tareas completadas vs agregadas</p>
                </div>
              </div>
              <div className="flex items-center gap-3 text-xs">
                <span className="flex items-center gap-1.5">
                  <span className="h-2.5 w-2.5 rounded-full bg-accent-green" />
                  <span className="text-muted-foreground">Hechas</span>
                </span>
                <span className="flex items-center gap-1.5">
                  <span className="h-2.5 w-2.5 rounded-full bg-accent-blue" />
                  <span className="text-muted-foreground">Agregadas</span>
                </span>
              </div>
            </CardHeader>
            <CardContent>
              <TasksChart tasks={tasks} />
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

// Simple tasks chart placeholder
function TasksChart({ tasks }: { tasks: any[] }) {
  const days = ['Lun', 'Mar', 'Mié', 'Jue', 'Vie'];
  const maxHeight = 120;
  
  // Generate some mock data based on tasks
  const data = days.map((day, i) => ({
    day,
    done: Math.floor(Math.random() * 15) + 5,
    added: Math.floor(Math.random() * 10) + 3,
  }));

  const maxValue = Math.max(...data.flatMap(d => [d.done, d.added]));

  return (
    <div className="flex items-end justify-between gap-3 h-36 pt-4">
      {data.map((item) => (
        <div key={item.day} className="flex-1 flex flex-col items-center gap-2">
          <div className="w-full flex gap-1 items-end h-28">
            <div 
              className="flex-1 bg-accent-green/80 rounded-t transition-all hover:bg-accent-green"
              style={{ height: `${(item.done / maxValue) * maxHeight}px` }}
            />
            <div 
              className="flex-1 bg-accent-blue/80 rounded-t transition-all hover:bg-accent-blue"
              style={{ height: `${(item.added / maxValue) * maxHeight}px` }}
            />
          </div>
          <span className="text-xs text-muted-foreground font-medium">{item.day}</span>
        </div>
      ))}
    </div>
  );
}
