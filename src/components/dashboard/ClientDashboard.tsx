import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { StatusBadge } from '@/components/ui/status-badge';
import { ClientProjectCard } from './ClientProjectCard';
import type { Project, Task, Activity } from '@/hooks/useData';
import { 
  FolderKanban, 
  MessageSquare, 
  CheckCircle2, 
  Clock, 
  ArrowRight,
  Sparkles,
  Bell
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { formatDistanceToNow } from 'date-fns';
import { es } from 'date-fns/locale';

interface ClientDashboardProps {
  userName: string;
  projects: Project[];
  tasks: Task[];
  activities: Activity[];
}

export function ClientDashboard({ userName, projects, tasks, activities }: ClientDashboardProps) {
  const navigate = useNavigate();
  
  // Filter client-visible tasks
  const visibleTasks = tasks.filter(t => t.is_client_visible);
  
  // Key metrics for client
  const needsInput = visibleTasks.filter(t => t.status === 'review' && t.client_input_required);
  const inProgress = visibleTasks.filter(t => t.status === 'in-progress');
  const completed = visibleTasks.filter(t => t.status === 'done');
  const totalProgress = visibleTasks.length > 0 
    ? Math.round((completed.length / visibleTasks.length) * 100) 
    : 0;

  // Recent project activities
  const recentActivities = activities.slice(0, 5);

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

      {/* Quick Action: Needs Input */}
      {needsInput.length > 0 && (
        <Card className="border-status-review/30 bg-status-review/5 animate-fade-in">
          <CardContent className="py-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <div className="flex h-12 w-12 items-center justify-center rounded-full bg-status-review/20">
                  <Bell className="h-6 w-6 text-status-review animate-pulse" />
                </div>
                <div>
                  <h3 className="font-semibold text-lg">
                    {needsInput.length} tarea{needsInput.length > 1 ? 's' : ''} necesita{needsInput.length > 1 ? 'n' : ''} tu feedback
                  </h3>
                  <p className="text-sm text-muted-foreground">
                    Tu input es clave para continuar con el desarrollo
                  </p>
                </div>
              </div>
              <Button onClick={() => navigate('/projects')} className="gap-2">
                Ver tareas
                <ArrowRight className="h-4 w-4" />
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

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
                <p className="text-3xl font-bold">{needsInput.length}</p>
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

      {/* Main Content: Projects + Activity */}
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

        {/* Activity Feed */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-semibold">Actividad Reciente</h3>
            <Button variant="ghost" size="sm" onClick={() => navigate('/activity')}>
              Ver todo
            </Button>
          </div>
          
          <Card>
            <CardContent className="pt-4">
              {recentActivities.length === 0 ? (
                <p className="text-sm text-muted-foreground py-8 text-center">
                  Sin actividad reciente
                </p>
              ) : (
                <div className="space-y-4">
                  {recentActivities.map((activity) => (
                    <div key={activity.id} className="flex gap-3 pb-4 border-b border-border/50 last:border-0 last:pb-0">
                      <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-muted">
                        <Clock className="h-3.5 w-3.5 text-muted-foreground" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm leading-relaxed">{activity.message}</p>
                        <p className="text-xs text-muted-foreground mt-1">
                          {formatDistanceToNow(new Date(activity.created_at), { 
                            addSuffix: true, 
                            locale: es 
                          })}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Tasks Requiring Input */}
          {needsInput.length > 0 && (
            <>
              <h3 className="text-lg font-semibold pt-2">Esperando tu Feedback</h3>
              <Card className="border-status-review/30">
                <CardContent className="pt-4 space-y-3">
                  {needsInput.slice(0, 3).map(task => (
                    <div 
                      key={task.id} 
                      className="flex items-center justify-between p-3 rounded-lg bg-status-review/5 border border-status-review/20 hover:bg-status-review/10 transition-colors cursor-pointer"
                      onClick={() => navigate(`/projects/${task.project_id}`)}
                    >
                      <div className="min-w-0 flex-1">
                        <p className="text-sm font-medium truncate">{task.title}</p>
                      </div>
                      <StatusBadge status={task.status} />
                    </div>
                  ))}
                </CardContent>
              </Card>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
