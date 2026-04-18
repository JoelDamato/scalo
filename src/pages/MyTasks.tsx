import { useMemo, useState } from 'react';
import { DragDropContext, Draggable, Droppable, type DropResult } from '@hello-pangea/dnd';
import { CalendarClock, CheckSquare, GripVertical, Plus } from 'lucide-react';
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
import { useProjects, useUpdateTaskStatus, Task } from '@/hooks/useData';
import { cn } from '@/lib/utils';

type TaskStatus = 'backlog' | 'in-progress' | 'review' | 'done';

const columns: TaskStatus[] = ['backlog', 'in-progress', 'review', 'done'];

const columnConfig: Record<TaskStatus, { title: string; dotColor: string; empty: string }> = {
  backlog: { title: 'Backlog', dotColor: 'bg-status-backlog', empty: 'Sin pendientes' },
  'in-progress': { title: 'En progreso', dotColor: 'bg-status-in-progress', empty: 'Nada en progreso' },
  review: { title: 'Revisión', dotColor: 'bg-status-review', empty: 'Nada para revisar' },
  done: { title: 'Hecho', dotColor: 'bg-status-done', empty: 'Sin completadas' },
};

export default function MyTasks() {
  const { data: tasks = [], isLoading } = useMyTasks();
  const { data: projects = [] } = useProjects();
  const updateStatus = useUpdateTaskStatus();
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

  const getTasksByStatus = (status: TaskStatus) => filteredTasks.filter((task) => task.status === status);

  const handleDragEnd = (result: DropResult) => {
    const { destination, source, draggableId } = result;

    if (!destination) return;
    if (
      destination.droppableId === source.droppableId &&
      destination.index === source.index
    ) return;

    updateStatus.mutate({
      taskId: draggableId,
      status: destination.droppableId as TaskStatus,
    });
  };

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
              Board de mis tareas
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
              <DragDropContext onDragEnd={handleDragEnd}>
                <div className="flex gap-4 overflow-x-auto pb-3">
                  {columns.map((status) => {
                    const columnTasks = getTasksByStatus(status);
                    const config = columnConfig[status];

                    return (
                      <div key={status} className="flex min-h-[460px] w-72 shrink-0 flex-col">
                        <div className="mb-3 flex items-center justify-between px-1">
                          <div className="flex items-center gap-2">
                            <div className={cn('h-2 w-2 rounded-full', config.dotColor)} />
                            <h3 className="text-sm font-medium">{config.title}</h3>
                            <span className="rounded bg-muted px-1.5 py-0.5 text-xs text-muted-foreground">
                              {columnTasks.length}
                            </span>
                          </div>
                        </div>

                        <Droppable droppableId={status}>
                          {(provided, snapshot) => (
                            <div
                              ref={provided.innerRef}
                              {...provided.droppableProps}
                              className={cn(
                                'flex-1 space-y-2 rounded-xl border border-border/60 bg-muted/20 p-2 transition-colors',
                                snapshot.isDraggingOver && 'border-primary/30 bg-primary/5 ring-2 ring-primary/10'
                              )}
                            >
                              {columnTasks.length === 0 && (
                                <div className="flex min-h-[120px] items-center justify-center rounded-lg border border-dashed border-border/70 px-4 text-center text-sm text-muted-foreground">
                                  {config.empty}
                                </div>
                              )}

                              {columnTasks.map((task, index) => {
                                const project = task.project_id ? projectById.get(task.project_id) : null;

                                return (
                                  <Draggable key={task.id} draggableId={task.id} index={index}>
                                    {(dragProvided, dragSnapshot) => (
                                      <div
                                        ref={dragProvided.innerRef}
                                        {...dragProvided.draggableProps}
                                      >
                                        <div
                                          className={cn(
                                            'w-full rounded-xl border border-border/70 bg-card p-3 text-left shadow-sm transition hover:border-primary/40 hover:bg-muted/30',
                                            dragSnapshot.isDragging && 'rotate-1 border-primary/50 shadow-lg'
                                          )}
                                        >
                                          <div className="flex items-start gap-2">
                                            <button
                                              type="button"
                                              className="mt-0.5 rounded-md p-1 text-muted-foreground transition hover:bg-muted hover:text-foreground active:cursor-grabbing"
                                              aria-label="Arrastrar tarea"
                                              {...dragProvided.dragHandleProps}
                                            >
                                              <GripVertical className="h-4 w-4" />
                                            </button>
                                            <button
                                              type="button"
                                              onClick={() => setSelectedTask(task)}
                                              className="min-w-0 flex-1 text-left"
                                            >
                                              <div className="flex flex-wrap items-center gap-2">
                                                {project ? (
                                                  <Badge variant="outline" className="max-w-full truncate">
                                                    {project.name}
                                                  </Badge>
                                                ) : (
                                                  <Badge variant="secondary">Interna</Badge>
                                                )}
                                                <StatusBadge status={task.status} />
                                              </div>
                                              <h3 className="mt-3 text-sm font-medium leading-snug">{task.title}</h3>
                                              {task.description && (
                                                <p className="mt-2 line-clamp-2 text-xs leading-5 text-muted-foreground">
                                                  {task.description}
                                                </p>
                                              )}
                                              {task.scheduled_date && (
                                                <div className="mt-3 flex items-center gap-1.5 border-t border-border/70 pt-2 text-xs text-muted-foreground">
                                                  <CalendarClock className="h-3.5 w-3.5" />
                                                  <span>
                                                    {task.scheduled_date}
                                                    {task.scheduled_time ? ` · ${task.scheduled_time.slice(0, 5)}` : ''}
                                                  </span>
                                                </div>
                                              )}
                                            </button>
                                          </div>
                                        </div>
                                      </div>
                                    )}
                                  </Draggable>
                                );
                              })}
                              {provided.placeholder}
                            </div>
                          )}
                        </Droppable>
                      </div>
                    );
                  })}
                </div>
              </DragDropContext>
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
        assignToCurrentUser
      />
    </AppLayout>
  );
}
