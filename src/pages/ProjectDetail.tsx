import { useState } from 'react';
import { useParams, Navigate, useNavigate } from 'react-router-dom';
import { AppLayout } from '@/components/layout/AppLayout';
import { useProject, useTasks, calculateProgress, useUpdateProject, useDeleteProject } from '@/hooks/useData';
import { useInitiatives } from '@/hooks/useInitiatives';
import { useAuth } from '@/hooks/useAuth';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { StatusBadge } from '@/components/ui/status-badge';
import { Progress } from '@/components/ui/progress';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { KanbanBoard } from '@/components/tasks/KanbanBoard';
import { InitiativeCard } from '@/components/initiatives/InitiativeCard';
import { CreateInitiativeDialog } from '@/components/initiatives/CreateInitiativeDialog';
import { Skeleton } from '@/components/ui/skeleton';
import { ProjectMembersSelector } from '@/components/projects/ProjectMembersSelector';
import { ProjectCredentialsTab } from '@/components/projects/ProjectCredentialsTab';
import { ProjectInstructionsTab } from '@/components/projects/ProjectInstructionsTab';
import { ProjectPagesTab } from '@/components/projects/ProjectPagesTab';
import { Badge } from '@/components/ui/badge';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { CheckSquare, LayoutDashboard, Rocket, Plus, Users, Trash2, Pencil, Save, X, CalendarDays, Zap, KeyRound, FileText, Globe } from 'lucide-react';
import { SprintBoard } from '@/components/sprints/SprintBoard';
import { ProjectCalendar } from '@/components/projects/ProjectCalendar';
import { toast } from 'sonner';

export default function ProjectDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { isAdmin } = useAuth();
  const { data: project, isLoading: projectLoading } = useProject(id || '');
  const { data: tasks = [], isLoading: tasksLoading } = useTasks(id);
  const { data: initiatives = [] } = useInitiatives(id);
  const updateProject = useUpdateProject();
  const deleteProject = useDeleteProject();
  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [editName, setEditName] = useState('');
  const [editDescription, setEditDescription] = useState('');
  const [editStatus, setEditStatus] = useState<'active' | 'completed' | 'on-hold'>('active');
  const [editSupportActive, setEditSupportActive] = useState(false);

  if (!id) {
    return <Navigate to="/projects" replace />;
  }

  if (projectLoading || tasksLoading) {
    return (
      <AppLayout title="Cargando...">
        <div className="space-y-6">
          <Skeleton className="h-32 w-full" />
          <Skeleton className="h-64 w-full" />
        </div>
      </AppLayout>
    );
  }

  if (!project) {
    return (
      <AppLayout title="Proyecto no encontrado">
        <div className="text-center py-12">
          <p className="text-muted-foreground">Este proyecto no existe o no tenés acceso.</p>
        </div>
      </AppLayout>
    );
  }

  const progress = calculateProgress(tasks);
  const tasksByStatus = {
    done: tasks.filter(t => t.status === 'done').length,
    'in-progress': tasks.filter(t => t.status === 'in-progress').length,
    review: tasks.filter(t => t.status === 'review').length,
    backlog: tasks.filter(t => t.status === 'backlog').length,
  };

  const visibleTasks = isAdmin ? tasks : tasks.filter(t => t.is_client_visible);

  const getCurrentPhase = () => {
    if (tasksByStatus['in-progress'] > 0) return 'En desarrollo';
    if (tasksByStatus['review'] > 0) return 'En revisión';
    if (tasksByStatus['done'] === tasks.length && tasks.length > 0) return 'Completado';
    return 'Planificación';
  };

  const startEditing = () => {
    setEditName(project.name);
    setEditDescription(project.description || '');
    setEditStatus(project.status);
    setEditSupportActive(project.support_active);
    setIsEditing(true);
  };

  const cancelEditing = () => {
    setIsEditing(false);
  };

  const saveChanges = async () => {
    try {
      await updateProject.mutateAsync({
        projectId: id!,
        updates: {
          name: editName,
          description: editDescription,
          status: editStatus,
          support_active: editSupportActive,
        },
      });
      toast.success('Proyecto actualizado');
      setIsEditing(false);
    } catch {
      toast.error('Error al actualizar el proyecto');
    }
  };

  const statusLabels: Record<string, string> = {
    active: 'Activo',
    completed: 'Completado',
    paused: 'Pausado',
    planning: 'Planificación',
  };

  return (
    <AppLayout title={project.name} description={project.description || undefined}>
      <div className="space-y-6">
        {/* Resumen del Proyecto */}
        <Card>
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <CardTitle className="text-lg font-medium">Resumen</CardTitle>
                <StatusBadge status={project.status} />
                <Badge
                  variant="outline"
                  className={project.support_active
                    ? 'border-emerald-500/30 bg-emerald-500/10 text-emerald-400'
                    : 'border-border/60 bg-muted/40 text-muted-foreground'}
                >
                  {project.support_active ? 'Soporte activo' : 'Sin soporte activo'}
                </Badge>
              </div>
              <div className="flex items-center gap-1">
                {isAdmin && (
                  <AlertDialog>
                    <AlertDialogTrigger asChild>
                      <Button variant="ghost" size="icon" className="text-muted-foreground hover:text-destructive">
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </AlertDialogTrigger>
                    <AlertDialogContent>
                      <AlertDialogHeader>
                        <AlertDialogTitle>¿Eliminar proyecto?</AlertDialogTitle>
                        <AlertDialogDescription>
                          Esta acción eliminará permanentemente <strong>{project.name}</strong> y todas sus tareas asociadas. No se puede deshacer.
                        </AlertDialogDescription>
                      </AlertDialogHeader>
                      <AlertDialogFooter>
                        <AlertDialogCancel>Cancelar</AlertDialogCancel>
                        <AlertDialogAction
                          onClick={async () => {
                            try {
                              await deleteProject.mutateAsync(id!);
                              toast.success('Proyecto eliminado');
                              navigate('/projects');
                            } catch {
                              toast.error('Error al eliminar proyecto');
                            }
                          }}
                          className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                        >
                          Eliminar
                        </AlertDialogAction>
                      </AlertDialogFooter>
                    </AlertDialogContent>
                  </AlertDialog>
                )}
              </div>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <div className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground">Avance general</span>
                <span className="font-medium">{progress}%</span>
              </div>
              <Progress value={progress} className="h-2" />
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 md:gap-4 pt-2">
              <div className="text-center p-3 rounded-lg bg-muted/50">
                <p className="text-2xl font-semibold">{tasksByStatus.done}</p>
                <p className="text-xs text-muted-foreground">Completadas</p>
              </div>
              <div className="text-center p-3 rounded-lg bg-muted/50">
                <p className="text-2xl font-semibold">{tasksByStatus['in-progress']}</p>
                <p className="text-xs text-muted-foreground">En desarrollo</p>
              </div>
              <div className="text-center p-3 rounded-lg bg-muted/50">
                <p className="text-2xl font-semibold">{tasksByStatus.review}</p>
                <p className="text-xs text-muted-foreground">En revisión</p>
              </div>
              <div className="text-center p-3 rounded-lg bg-muted/50">
                <p className="text-2xl font-semibold">{tasksByStatus.backlog}</p>
                <p className="text-xs text-muted-foreground">Pendientes</p>
              </div>
            </div>
            <div className="pt-2 border-t">
              <p className="text-sm">
                <span className="text-muted-foreground">Etapa actual: </span>
                <span className="font-medium">{getCurrentPhase()}</span>
              </p>
            </div>
          </CardContent>
        </Card>

        {/* Tabs */}
        <Tabs defaultValue="overview" className="w-full">
          <TabsList>
            <TabsTrigger value="overview" className="gap-2">
              <LayoutDashboard className="h-4 w-4" />
              Detalles
            </TabsTrigger>
            <TabsTrigger value="initiatives" className="gap-2">
              <Rocket className="h-4 w-4" />
              Productos
            </TabsTrigger>
            <TabsTrigger value="tasks" className="gap-2">
              <CheckSquare className="h-4 w-4" />
              Tareas
            </TabsTrigger>
            <TabsTrigger value="calendar" className="gap-2">
              <CalendarDays className="h-4 w-4" />
              Calendario
            </TabsTrigger>
            <TabsTrigger value="sprints" className="gap-2">
              <Zap className="h-4 w-4" />
              Sprints
            </TabsTrigger>
            <TabsTrigger value="instructions" className="gap-2">
              <FileText className="h-4 w-4" />
              Instructivos
            </TabsTrigger>
            <TabsTrigger value="pages" className="gap-2">
              <Globe className="h-4 w-4" />
              Páginas
            </TabsTrigger>
            {isAdmin && (
              <TabsTrigger value="credentials" className="gap-2">
                <KeyRound className="h-4 w-4" />
                Contraseñas
              </TabsTrigger>
            )}
          </TabsList>

          <TabsContent value="overview" className="mt-6">
            <div className="grid gap-6 md:grid-cols-2">
              <Card>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-base font-medium">Información del Proyecto</CardTitle>
                    {isAdmin && !isEditing && (
                      <Button variant="ghost" size="sm" onClick={startEditing} className="gap-1.5">
                        <Pencil className="h-3.5 w-3.5" />
                        Editar
                      </Button>
                    )}
                    {isEditing && (
                      <div className="flex items-center gap-1">
                        <Button variant="ghost" size="sm" onClick={cancelEditing}>
                          <X className="h-3.5 w-3.5" />
                        </Button>
                        <Button size="sm" onClick={saveChanges} disabled={updateProject.isPending} className="gap-1.5">
                          <Save className="h-3.5 w-3.5" />
                          Guardar
                        </Button>
                      </div>
                    )}
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  {isEditing ? (
                    <>
                      <div>
                        <p className="text-sm text-muted-foreground mb-1.5">Nombre</p>
                        <Input value={editName} onChange={(e) => setEditName(e.target.value)} />
                      </div>
                      <div>
                        <p className="text-sm text-muted-foreground mb-1.5">Descripción</p>
                        <Textarea
                          value={editDescription}
                          onChange={(e) => setEditDescription(e.target.value)}
                          rows={4}
                        />
                      </div>
                      <div>
                        <p className="text-sm text-muted-foreground mb-1.5">Estado</p>
                        <Select value={editStatus} onValueChange={(v) => setEditStatus(v as 'active' | 'completed' | 'on-hold')}>
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="active">Activo</SelectItem>
                            <SelectItem value="completed">Completado</SelectItem>
                            <SelectItem value="on-hold">En pausa</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="flex items-center justify-between rounded-lg border border-border/50 bg-muted/20 p-4">
                        <div>
                          <p className="text-sm font-medium">Soporte activo</p>
                          <p className="text-xs text-muted-foreground mt-1">
                            Activalo si este proyecto está actualmente cubierto por soporte o mantenimiento.
                          </p>
                        </div>
                        <Switch checked={editSupportActive} onCheckedChange={setEditSupportActive} />
                      </div>
                    </>
                  ) : (
                    <>
                      {project.description && (
                        <div>
                          <p className="text-sm text-muted-foreground mb-1">Descripción</p>
                          <p className="text-sm">{project.description}</p>
                        </div>
                      )}
                      <div className="grid grid-cols-2 gap-4 text-sm">
                        <div>
                          <p className="text-muted-foreground mb-1">Estado</p>
                          <StatusBadge status={project.status} />
                        </div>
                        <div>
                          <p className="text-muted-foreground mb-1">Total de tareas</p>
                          <p className="font-medium">{tasks.length}</p>
                        </div>
                        <div>
                          <p className="text-muted-foreground mb-1">Soporte</p>
                          <p className="font-medium">{project.support_active ? 'Activo' : 'Inactivo'}</p>
                        </div>
                      </div>
                    </>
                  )}
                </CardContent>
              </Card>

              {/* Equipo del Proyecto */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-base font-medium flex items-center gap-2">
                    <Users className="h-4 w-4" />
                    Equipo del Proyecto
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <ProjectMembersSelector projectId={id!} isAdmin={isAdmin} />
                </CardContent>
              </Card>
            </div>
          </TabsContent>




          <TabsContent value="initiatives" className="mt-6">
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-semibold">Productos</h3>
                {isAdmin && (
                  <Button onClick={() => setCreateDialogOpen(true)}>
                    <Plus className="w-4 h-4 mr-2" />
                    Nuevo Producto
                  </Button>
                )}
              </div>
              {initiatives.length === 0 ? (
                <Card>
                  <CardContent className="py-12 text-center">
                    <Rocket className="h-12 w-12 mx-auto text-muted-foreground/50 mb-4" />
                    <p className="text-muted-foreground mb-4">Todavía no hay productos definidos</p>
                    {isAdmin && (
                      <Button onClick={() => setCreateDialogOpen(true)}>
                        <Plus className="w-4 h-4 mr-2" />
                        Crear Primer Producto
                      </Button>
                    )}
                  </CardContent>
                </Card>
              ) : (
                <div className="grid gap-4 md:grid-cols-2">
                  {initiatives.map(initiative => (
                    <InitiativeCard key={initiative.id} initiative={initiative} projectId={id} />
                  ))}
                </div>
              )}
            </div>
          </TabsContent>

          <TabsContent value="tasks" className="mt-6">
            {isAdmin ? (
              <KanbanBoard projectId={id} />
            ) : (
              <Card>
                <CardHeader>
                  <CardTitle className="text-base font-medium">Tus Tareas</CardTitle>
                </CardHeader>
                <CardContent>
                  {visibleTasks.length === 0 ? (
                    <p className="text-sm text-muted-foreground text-center py-8">
                      No hay tareas visibles por el momento.
                    </p>
                  ) : (
                    <div className="space-y-3">
                      {visibleTasks.map(task => (
                        <div key={task.id} className="flex items-center justify-between p-3 border rounded-lg">
                          <div>
                            <p className="font-medium text-sm">{task.title}</p>
                            {task.description && (
                              <p className="text-xs text-muted-foreground mt-0.5">{task.description}</p>
                            )}
                          </div>
                          <StatusBadge status={task.status} />
                        </div>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>
            )}
          </TabsContent>

          <TabsContent value="calendar" className="mt-6">
            <ProjectCalendar projectId={id!} />
          </TabsContent>

          <TabsContent value="sprints" className="mt-6">
            <SprintBoard projectId={id!} />
          </TabsContent>

          <TabsContent value="instructions" className="mt-6">
            <ProjectInstructionsTab projectId={id!} isAdmin={isAdmin} />
          </TabsContent>

          <TabsContent value="pages" className="mt-6">
            <ProjectPagesTab projectId={id!} isAdmin={isAdmin} />
          </TabsContent>

          {isAdmin && (
            <TabsContent value="credentials" className="mt-6">
              <ProjectCredentialsTab projectId={id!} />
            </TabsContent>
          )}
        </Tabs>

        <CreateInitiativeDialog
          projectId={id}
          open={createDialogOpen}
          onOpenChange={setCreateDialogOpen}
        />
      </div>
    </AppLayout>
  );
}
