import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ClientProjectCard } from './ClientProjectCard';
import { TaskActivityChart } from './TaskActivityChart';
import type { Project, Task } from '@/hooks/useData';
import type { TaskAssignee } from '@/hooks/useTaskAssignees';
import type { Profile } from '@/hooks/useProfiles';
import { 
  FolderKanban, 
  MessageSquare, 
  CheckCircle2, 
  Clock, 
  ArrowRight,
  Sparkles
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';

interface ClientDashboardProps {
  userName: string;
  projects: Project[];
  tasks: Task[];
  assignees: TaskAssignee[];
  profiles: Profile[];
}

export function ClientDashboard({ userName, projects, tasks, assignees, profiles }: ClientDashboardProps) {
  const navigate = useNavigate();
  
  // Filter client-visible tasks
  const visibleTasks = tasks.filter(t => t.is_client_visible);
  
  // Key metrics for client
  const reviewTasks = visibleTasks.filter(t => t.status === 'review');
  const inProgress = visibleTasks.filter(t => t.status === 'in-progress');
  const completed = visibleTasks.filter(t => t.status === 'done');
  const totalProgress = visibleTasks.length > 0 
    ? Math.round((completed.length / visibleTasks.length) * 100) 
    : 0;

  return (
    <div className="max-w-7xl mx-auto space-y-8">
      {/* Welcome Header */}
      <div className="flex flex-col gap-2">
        <div className="flex items-center gap-2">
          <Sparkles className="h-5 w-5 text-primary" />
          <span className="text-sm font-medium text-primary">Portal de Cliente</span>
        </div>
        <h2 className="text-3xl font-bold tracking-tight">
          ¡Hola, {userName}!
        </h2>
        <p className="text-muted-foreground">
          Aquí está el estado actual de tus proyectos.
        </p>
      </div>

      {/* Stats Overview */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Card className="animate-fade-in">
          <CardContent className="pt-6">
            <div className="flex items-center gap-4">
              <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-primary/10">
                <FolderKanban className="h-6 w-6 text-primary" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Proyectos Activos</p>
                <p className="text-3xl font-bold">{projects.filter(p => p.status === 'active').length}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="animate-fade-in" style={{ animationDelay: '50ms' }}>
          <CardContent className="pt-6">
            <div className="flex items-center gap-4">
              <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-status-in-progress/15">
                <Clock className="h-6 w-6 text-status-in-progress" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">En Desarrollo</p>
                <p className="text-3xl font-bold">{inProgress.length}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="animate-fade-in" style={{ animationDelay: '100ms' }}>
          <CardContent className="pt-6">
            <div className="flex items-center gap-4">
              <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-status-review/15">
                <MessageSquare className="h-6 w-6 text-status-review" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Esperando Review</p>
                <p className="text-3xl font-bold">{reviewTasks.length}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="animate-fade-in" style={{ animationDelay: '150ms' }}>
          <CardContent className="pt-6">
            <div className="flex items-center gap-4">
              <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-status-done/15">
                <CheckCircle2 className="h-6 w-6 text-status-done" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Progreso Total</p>
                <p className="text-3xl font-bold">{totalProgress}%</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Main Content: Projects + Task chart */}
      <div className="grid gap-6 lg:grid-cols-3">
        {/* Projects List - Takes 2 columns */}
        <div className="lg:col-span-2 space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-semibold">Tus Proyectos</h3>
            <Button variant="ghost" size="sm" onClick={() => navigate('/projects')}>
              Ver todos
              <ArrowRight className="h-4 w-4 ml-1" />
            </Button>
          </div>
          
          {projects.length === 0 ? (
            <Card>
              <CardContent className="py-12 text-center">
                <FolderKanban className="h-12 w-12 text-muted-foreground/50 mx-auto mb-4" />
                <p className="text-muted-foreground">No tienes proyectos asignados aún</p>
              </CardContent>
            </Card>
          ) : (
            <div className="grid gap-4 sm:grid-cols-2">
              {projects.slice(0, 4).map(project => (
                <ClientProjectCard 
                  key={project.id} 
                  project={project} 
                  tasks={visibleTasks.filter(t => t.project_id === project.id)}
                />
              ))}
            </div>
          )}
        </div>

        {/* Task Activity */}
        <div className="space-y-4">
          <TaskActivityChart tasks={visibleTasks} assignees={assignees} profiles={profiles} />
        </div>
      </div>
    </div>
  );
}
