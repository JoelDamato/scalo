import { useMemo, useState } from 'react';
import { CalendarClock, CheckSquare, Plus } from 'lucide-react';
import { AppLayout } from '@/components/layout/AppLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { StatusBadge } from '@/components/ui/status-badge';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { TaskDetailSheet } from '@/components/tasks/TaskDetailSheet';
import { CreateTaskDialog } from '@/components/tasks/CreateTaskDialog';
import { useMyTasks } from '@/hooks/useMyTasks';
import { useProjects, Task } from '@/hooks/useData';

export default function MyTasks() {
  const { data: tasks = [], isLoading } = useMyTasks();
  const { data: projects = [] } = useProjects();
  const [selectedTask, setSelectedTask] = useState<Task | null>(null);
  const [projectFilter, setProjectFilter] = useState('all');
  const [createDialogOpen, setCreateDialogOpen] = useState(false);

  const projectById = useMemo(
    () => new Map(projects.map((project) => [project.id, project])),
    [projects],
  );

  const availableProjects = useMemo(() => {
    const ids = new Set(tasks.map((task) => task.project_id).filter(Boolean));
    return projects.filter((project) => ids.has(project.id));
  }, [projects, tasks]);

  const hasInternalTasks = tasks.some((task) => !task.project_id);

  const filteredTasks = useMemo(() => {
    if (projectFilter === 'all') return tasks;
    if (projectFilter === 'internal') return tasks.filter((task) => !task.project_id);
    return tasks.filter((task) => task.project_id === projectFilter);
  }, [projectFilter, tasks]);

  const openTasks = filteredTasks.filter((task) => task.status !== 'done');
  const doneTasks = filteredTasks.filter((task) => task.status === 'done');

  return (
    <AppLayout title="Mis tareas" description="Todo lo que está asignado a tu cuenta">
      <div className="space-y-6">
        <div className="grid gap-4 sm:grid-cols-3">
          <Card>
            <CardContent className="p-4">
              <p className="text-sm text-muted-foreground">Asignadas</p>
              <p className="mt-1 text-2xl font-semibold">{filteredTasks.length}</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <p className="text-sm text-muted-foreground">Pendientes</p>
              <p className="mt-1 text-2xl font-semibold">{openTasks.length}</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <p className="text-sm text-muted-foreground">Terminadas</p>
              <p className="mt-1 text-2xl font-semibold">{doneTasks.length}</p>
            </CardContent>
          </Card>
        </div>

        <Card>
          <CardHeader className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <CardTitle className="flex items-center gap-2 text-lg">
              <CheckSquare className="h-5 w-5" />
              Lista de tareas
            </CardTitle>
            <div className="flex w-full flex-col gap-3 sm:w-auto sm:flex-row sm:items-center">
              <Select value={projectFilter} onValueChange={setProjectFilter}>
                <SelectTrigger className="sm:w-64">
                  <SelectValue placeholder="Filtrar por proyecto" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todas</SelectItem>
                  {availableProjects.map((project) => (
                    <SelectItem key={project.id} value={project.id}>
                      {project.name}
                    </SelectItem>
                  ))}
                  {hasInternalTasks && (
                    <SelectItem value="internal">Internas</SelectItem>
                  )}
                </SelectContent>
              </Select>
              <Button className="gap-2" onClick={() => setCreateDialogOpen(true)}>
                <Plus className="h-4 w-4" />
                Crear tarea
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="space-y-3">
                {[1, 2, 3].map((item) => (
                  <Skeleton key={item} className="h-24 w-full" />
                ))}
              </div>
            ) : tasks.length === 0 ? (
              <div className="rounded-xl border border-dashed border-border/70 bg-muted/20 px-6 py-12 text-center">
                <CheckSquare className="mx-auto h-10 w-10 text-muted-foreground/40" />
                <p className="mt-3 text-sm font-medium">No tenés tareas asignadas</p>
                <p className="mt-1 text-sm text-muted-foreground">
                  Cuando alguien te asigne una tarea, va a aparecer acá.
                </p>
              </div>
            ) : filteredTasks.length === 0 ? (
              <div className="rounded-xl border border-dashed border-border/70 bg-muted/20 px-6 py-12 text-center">
                <CheckSquare className="mx-auto h-10 w-10 text-muted-foreground/40" />
                <p className="mt-3 text-sm font-medium">No hay tareas en este filtro</p>
                <p className="mt-1 text-sm text-muted-foreground">
                  Cambiá el proyecto o volvé a ver todas.
                </p>
              </div>
            ) : (
              <div className="space-y-3">
                {filteredTasks.map((task) => {
                  const project = task.project_id ? projectById.get(task.project_id) : null;

                  return (
                    <button
                      key={task.id}
                      type="button"
                      onClick={() => setSelectedTask(task)}
                      className="w-full rounded-xl border border-border/70 bg-card/60 p-4 text-left transition hover:border-primary/40 hover:bg-muted/30"
                    >
                      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                        <div className="min-w-0">
                          <div className="flex flex-wrap items-center gap-2">
                            <h3 className="font-medium">{task.title}</h3>
                            <StatusBadge status={task.status} />
                            {project ? (
                              <Badge variant="outline">{project.name}</Badge>
                            ) : (
                              <Badge variant="secondary">Interna</Badge>
                            )}
                          </div>
                          {task.description && (
                            <p className="mt-2 line-clamp-2 text-sm text-muted-foreground">{task.description}</p>
                          )}
                        </div>
                        {task.scheduled_date && (
                          <div className="flex shrink-0 items-center gap-1.5 text-sm text-muted-foreground">
                            <CalendarClock className="h-4 w-4" />
                            <span>
                              {task.scheduled_date}
                              {task.scheduled_time ? ` · ${task.scheduled_time.slice(0, 5)}` : ''}
                            </span>
                          </div>
                        )}
                      </div>
                    </button>
                  );
                })}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      <TaskDetailSheet
        task={selectedTask}
        open={!!selectedTask}
        onOpenChange={(open) => !open && setSelectedTask(null)}
      />
      <CreateTaskDialog
        open={createDialogOpen}
        onOpenChange={setCreateDialogOpen}
        defaultProjectId={projectFilter !== 'all' && projectFilter !== 'internal' ? projectFilter : undefined}
        mode={projectFilter === 'internal' ? 'internal' : 'project'}
      />
    </AppLayout>
  );
}
