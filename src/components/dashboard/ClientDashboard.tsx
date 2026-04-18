import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ClientProjectCard } from './ClientProjectCard';
import type { Project, Task } from '@/hooks/useData';
import { 
  FolderKanban, 
  MessageSquare, 
  CheckCircle2, 
  Clock, 
  ArrowRight,
  Sparkles,
  Eye,
  LifeBuoy,
  ShieldCheck,
  Workflow,
  type LucideIcon
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';

interface ClientDashboardProps {
  userName: string;
  projects: Project[];
  tasks: Task[];
}

export function ClientDashboard({ userName, projects, tasks }: ClientDashboardProps) {
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
      <div className="rounded-3xl border border-border/80 bg-gradient-to-br from-card via-card to-muted/30 p-5 shadow-sm sm:p-7">
        <div className="flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between">
          <div className="max-w-3xl">
            <div className="flex items-center gap-2">
              <Sparkles className="h-5 w-5 text-primary" />
              <span className="text-sm font-medium text-primary">Portal de Cliente</span>
            </div>
            <h2 className="mt-3 text-3xl font-bold tracking-tight">
              ¡Hola, {userName}! Este es tu espacio de seguimiento.
            </h2>
            <p className="mt-3 text-muted-foreground leading-7">
              Acá vas a encontrar el estado de tu proyecto, las tareas visibles para vos, los puntos en revisión y los canales para pedir soporte. La idea es que siempre tengas claridad sobre qué estamos construyendo, qué sigue y dónde necesitamos tu feedback.
            </p>
          </div>
          <div className="grid gap-3 sm:grid-cols-2 lg:w-[360px]">
            <div className="rounded-2xl border border-border/70 bg-background/60 p-4">
              <Eye className="mb-3 h-5 w-5 text-primary" />
              <p className="text-sm font-medium">Ves solo lo relevante</p>
              <p className="mt-1 text-xs leading-5 text-muted-foreground">Mostramos tareas y recursos preparados para cliente.</p>
            </div>
            <div className="rounded-2xl border border-border/70 bg-background/60 p-4">
              <ShieldCheck className="mb-3 h-5 w-5 text-emerald-500" />
              <p className="text-sm font-medium">Seguimiento ordenado</p>
              <p className="mt-1 text-xs leading-5 text-muted-foreground">Todo queda centralizado por proyecto.</p>
            </div>
          </div>
        </div>
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

      {/* Main Content */}
      <div className="grid gap-6 lg:grid-cols-[1.45fr_0.85fr]">
        <div className="space-y-4">
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

        <Card className="border-border/80 bg-muted/20">
          <CardContent className="space-y-5 p-5">
            <div>
              <div className="mb-3 flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10">
                <Workflow className="h-5 w-5 text-primary" />
              </div>
              <h3 className="text-lg font-semibold">Cómo leer tu portal</h3>
              <p className="mt-2 text-sm leading-6 text-muted-foreground">
                Este panel resume lo que está pasando sin mostrarte la operación interna del equipo. Si algo requiere tu revisión, lo vas a ver marcado en el proyecto o en soporte.
              </p>
            </div>

            <div className="space-y-3">
              <ClientGuideItem
                title="Proyectos"
                description="Entrá para ver el detalle, avances visibles y recursos compartidos."
                icon={FolderKanban}
              />
              <ClientGuideItem
                title="En revisión"
                description="Son puntos donde puede hacer falta validar algo con vos."
                icon={MessageSquare}
              />
              <ClientGuideItem
                title="Soporte"
                description="Usalo para reportar bugs, pedir cambios o dejar consultas."
                icon={LifeBuoy}
              />
            </div>

            <Button variant="outline" className="w-full" onClick={() => navigate('/support')}>
              Ir a soporte
              <ArrowRight className="ml-2 h-4 w-4" />
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

function ClientGuideItem({
  title,
  description,
  icon: Icon,
}: {
  title: string;
  description: string;
  icon: LucideIcon;
}) {
  return (
    <div className="flex gap-3 rounded-2xl border border-border/70 bg-background/60 p-4">
      <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-muted">
        <Icon className="h-4 w-4 text-muted-foreground" />
      </div>
      <div>
        <p className="text-sm font-medium">{title}</p>
        <p className="mt-1 text-xs leading-5 text-muted-foreground">{description}</p>
      </div>
    </div>
  );
}
