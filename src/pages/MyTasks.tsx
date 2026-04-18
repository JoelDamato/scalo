import { memo, useEffect, useMemo, useState } from 'react';
import { DragDropContext, Draggable, Droppable, type DropResult } from '@hello-pangea/dnd';
import { CalendarClock, CheckSquare, GripVertical, Plus, Users } from 'lucide-react';
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
import { useProjects, useTasks, useUpdateTaskStatus, Task } from '@/hooks/useData';
import { useAuth } from '@/hooks/useAuth';
import { useProfiles } from '@/hooks/useProfiles';
import { useTasksAssignees } from '@/hooks/useTaskAssignees';
import { cn } from '@/lib/utils';

type TaskStatus = 'backlog' | 'in-progress' | 'review' | 'done';

const columns: TaskStatus[] = ['backlog', 'in-progress', 'review', 'done'];

const columnConfig: Record<TaskStatus, { title: string; dotColor: string; empty: string }> = {
  backlog: { title: 'Backlog', dotColor: 'bg-status-backlog', empty: 'Sin pendientes' },
  'in-progress': { title: 'En progreso', dotColor: 'bg-status-in-progress', empty: 'Nada en progreso' },
  review: { title: 'Revisión', dotColor: 'bg-status-review', empty: 'Nada para revisar' },
  done: { title: 'Finalizadas', dotColor: 'bg-status-done', empty: 'Sin finalizadas' },
};

type MyTaskCardProps = {
  task: Task;
  projectName?: string;
  assigneeNames?: string[];
  isDragging: boolean;
  dragHandleProps: React.HTMLAttributes<HTMLElement> | null;
  onOpen: (task: Task) => void;
};

const MyTaskCard = memo(function MyTaskCard({
  task,
  projectName,
  assigneeNames = [],
  isDragging,
  dragHandleProps,
  onOpen,
}: MyTaskCardProps) {
  return (
    <div
      className={cn(
        'w-full rounded-lg border border-border/70 bg-card p-3 text-left shadow-sm transition-colors hover:border-primary/40 hover:bg-muted/30',
        'touch-manipulation will-change-transform',
        isDragging && 'border-primary/50 shadow-lg ring-2 ring-primary/10'
      )}
      {...dragHandleProps}
    >
      <div className="flex items-start gap-2">
        <span
          className={cn(
            'mt-0.5 rounded-md p-1 text-muted-foreground transition group-hover:text-foreground',
            isDragging ? 'cursor-grabbing bg-muted text-foreground' : 'cursor-grab'
          )}
          aria-hidden="true"
        >
          <GripVertical className="h-4 w-4" />
        </span>
        <button
          type="button"
          onClick={() => onOpen(task)}
          className="min-w-0 flex-1 text-left"
        >
          <div className="flex flex-wrap items-center gap-2">
            {projectName ? (
              <Badge variant="outline" className="max-w-full truncate">
                {projectName}
              </Badge>
            ) : (
              <Badge variant="secondary">Interna</Badge>
            )}
            <StatusBadge status={task.status} />
          </div>
          {assigneeNames.length > 0 && (
            <div className="mt-2 flex flex-wrap gap-1.5">
              {assigneeNames.slice(0, 2).map((name) => (
                <Badge key={name} variant="outline" className="max-w-full truncate text-[10px]">
                  {name}
                </Badge>
              ))}
              {assigneeNames.length > 2 && (
                <Badge variant="outline" className="text-[10px]">
                  +{assigneeNames.length - 2}
                </Badge>
              )}
            </div>
          )}
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
  );
});

export default function MyTasks() {
  const { user, isAdmin } = useAuth();
  const { data: myTasks = [], isLoading: myTasksLoading } = useMyTasks();
  const { data: teamTasks = [], isLoading: teamTasksLoading } = useTasks();
  const { data: projects = [] } = useProjects();
  const { data: profiles = [] } = useProfiles();
  const updateStatus = useUpdateTaskStatus();
  const [selectedTask, setSelectedTask] = useState<Task | null>(null);
  const [projectFilter, setProjectFilter] = useState('all');
  const [assigneeFilter, setAssigneeFilter] = useState('mine');
  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [visibleTasks, setVisibleTasks] = useState<Task[]>([]);

  const tasks = isAdmin ? teamTasks : myTasks;
  const isLoading = isAdmin ? teamTasksLoading : myTasksLoading;
  const taskIds = useMemo(() => tasks.map((task) => task.id), [tasks]);
  const { data: taskAssignees = [], isLoading: assigneesLoading } = useTasksAssignees(taskIds);

  const profileByUserId = useMemo(
    () => new Map(profiles.map((profile) => [profile.user_id, profile])),
    [profiles],
  );

  const assigneeIdsByTaskId = useMemo(() => {
    const grouped = new Map<string, Set<string>>();

    tasks.forEach((task) => {
      if (!task.assignee_id) return;
      grouped.set(task.id, new Set([task.assignee_id]));
    });

    taskAssignees.forEach((assignee) => {
      const current = grouped.get(assignee.task_id) || new Set<string>();
      current.add(assignee.user_id);
      grouped.set(assignee.task_id, current);
    });

    return grouped;
  }, [taskAssignees, tasks]);

  const assigneeOptions = useMemo(() => {
    const ids = new Set<string>();

    assigneeIdsByTaskId.forEach((taskAssigneeIds) => {
      taskAssigneeIds.forEach((userId) => ids.add(userId));
    });

    return Array.from(ids)
      .map((userId) => ({
        userId,
        name: profileByUserId.get(userId)?.name || profileByUserId.get(userId)?.email || 'Usuario',
      }))
      .sort((a, b) => a.name.localeCompare(b.name));
  }, [assigneeIdsByTaskId, profileByUserId]);

  const assigneeFilteredTasks = useMemo(() => {
    if (!isAdmin) return tasks;
    if (assigneeFilter === 'all') return tasks;

    return tasks.filter((task) => {
      const taskAssigneeIds = assigneeIdsByTaskId.get(task.id) || new Set<string>();

      if (assigneeFilter === 'mine') return !!user?.id && taskAssigneeIds.has(user.id);
      if (assigneeFilter === 'unassigned') return taskAssigneeIds.size === 0;
      return taskAssigneeIds.has(assigneeFilter);
    });
  }, [assigneeFilter, assigneeIdsByTaskId, isAdmin, tasks, user?.id]);

  useEffect(() => {
    setVisibleTasks(assigneeFilteredTasks);
  }, [assigneeFilteredTasks]);

  const projectById = useMemo(
    () => new Map(projects.map((project) => [project.id, project])),
    [projects],
  );

  const availableProjects = useMemo(() => {
    const ids = new Set(visibleTasks.map((task) => task.project_id).filter(Boolean));
    return projects.filter((project) => ids.has(project.id));
  }, [projects, visibleTasks]);

  const hasInternalTasks = visibleTasks.some((task) => !task.project_id);

  const filteredTasks = useMemo(() => {
    if (projectFilter === 'all') return visibleTasks;
    if (projectFilter === 'internal') return visibleTasks.filter((task) => !task.project_id);
    return visibleTasks.filter((task) => task.project_id === projectFilter);
  }, [projectFilter, visibleTasks]);

  const tasksByStatus = useMemo(() => {
    const grouped: Record<TaskStatus, Task[]> = {
      backlog: [],
      'in-progress': [],
      review: [],
      done: [],
    };

    filteredTasks.forEach((task) => {
      grouped[task.status].push(task);
    });

    return grouped;
  }, [filteredTasks]);

  const openTaskCount = filteredTasks.length - tasksByStatus.done.length;
  const selectedAssigneeName = assigneeFilter === 'all'
    ? 'Todo el equipo'
    : assigneeFilter === 'mine'
      ? 'Mis tareas'
      : assigneeFilter === 'unassigned'
        ? 'Sin asignar'
        : assigneeOptions.find((option) => option.userId === assigneeFilter)?.name || 'Miembro';

  const handleDragEnd = (result: DropResult) => {
    const { destination, source, draggableId } = result;

    if (!destination) return;
    if (
      destination.droppableId === source.droppableId &&
      destination.index === source.index
    ) return;

    const newStatus = destination.droppableId as TaskStatus;
    const previousTasks = visibleTasks;
    const draggedTask = visibleTasks.find((task) => task.id === draggableId);

    if (!draggedTask) return;

    setVisibleTasks((currentTasks) => {
      const nextTasks = [...currentTasks];
      const currentIndex = nextTasks.findIndex((task) => task.id === draggableId);

      if (currentIndex === -1) return currentTasks;

      const [movedTask] = nextTasks.splice(currentIndex, 1);
      const updatedTask = { ...movedTask, status: newStatus };
      const destinationTasks = nextTasks.filter((task) => {
        if (task.status !== newStatus) return false;
        if (projectFilter === 'all') return true;
        if (projectFilter === 'internal') return !task.project_id;
        return task.project_id === projectFilter;
      });
      const beforeTask = destinationTasks[destination.index];

      if (!beforeTask) {
        nextTasks.push(updatedTask);
        return nextTasks;
      }

      const insertIndex = nextTasks.findIndex((task) => task.id === beforeTask.id);
      nextTasks.splice(insertIndex, 0, updatedTask);
      return nextTasks;
    });

    setSelectedTask((currentTask) => (
      currentTask?.id === draggableId ? { ...currentTask, status: newStatus } : currentTask
    ));

    updateStatus.mutate({
      taskId: draggableId,
      status: newStatus,
    }, {
      onError: () => {
        setVisibleTasks(previousTasks);
        setSelectedTask((currentTask) => (
          currentTask?.id === draggableId ? draggedTask : currentTask
        ));
      },
    });
  };

  return (
    <AppLayout
      title="Mis tareas"
      description={isAdmin ? 'Tus tareas y las del equipo en un solo board' : 'Todo lo que está asignado a tu cuenta'}
    >
      <div className="space-y-6">
        <div className="grid gap-4 sm:grid-cols-3">
          <Card>
            <CardContent className="p-4">
              <p className="text-sm text-muted-foreground">{isAdmin ? selectedAssigneeName : 'Asignadas'}</p>
              <p className="mt-1 text-2xl font-semibold">{filteredTasks.length}</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <p className="text-sm text-muted-foreground">Pendientes</p>
              <p className="mt-1 text-2xl font-semibold">{openTaskCount}</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <p className="text-sm text-muted-foreground">Finalizadas</p>
              <p className="mt-1 text-2xl font-semibold">{tasksByStatus.done.length}</p>
            </CardContent>
          </Card>
        </div>

        <Card>
          <CardHeader className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <CardTitle className="flex items-center gap-2 text-lg">
              <CheckSquare className="h-5 w-5" />
              {isAdmin ? 'Board del equipo' : 'Board de mis tareas'}
            </CardTitle>
            <div className="flex w-full flex-col gap-3 sm:w-auto sm:flex-row sm:items-center">
              {isAdmin && (
                <Select value={assigneeFilter} onValueChange={setAssigneeFilter}>
                  <SelectTrigger className="sm:w-56">
                    <Users className="mr-2 h-4 w-4 text-muted-foreground" />
                    <SelectValue placeholder="Filtrar por responsable" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="mine">Mis tareas</SelectItem>
                    <SelectItem value="all">Todo el equipo</SelectItem>
                    {assigneeOptions.map((option) => (
                      <SelectItem key={option.userId} value={option.userId}>
                        {option.name}
                      </SelectItem>
                    ))}
                    <SelectItem value="unassigned">Sin asignar</SelectItem>
                  </SelectContent>
                </Select>
              )}
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
            {isLoading || (isAdmin && assigneesLoading) ? (
              <div className="space-y-3">
                {[1, 2, 3].map((item) => (
                  <Skeleton key={item} className="h-24 w-full" />
                ))}
              </div>
            ) : visibleTasks.length === 0 ? (
              <div className="rounded-xl border border-dashed border-border/70 bg-muted/20 px-6 py-12 text-center">
                <CheckSquare className="mx-auto h-10 w-10 text-muted-foreground/40" />
                <p className="mt-3 text-sm font-medium">
                  {isAdmin ? 'No hay tareas para este responsable' : 'No tenés tareas asignadas'}
                </p>
                <p className="mt-1 text-sm text-muted-foreground">
                  {isAdmin ? 'Probá ver todo el equipo o cambiar de miembro.' : 'Cuando alguien te asigne una tarea, va a aparecer acá.'}
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
                    const columnTasks = tasksByStatus[status];
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
                                'flex-1 space-y-2 rounded-lg border border-border/60 bg-muted/20 p-2 transition-colors',
                                snapshot.isDraggingOver && 'border-primary/30 bg-primary/5 ring-2 ring-primary/10'
                              )}
                            >
                              {columnTasks.length === 0 && (
                                <div className="flex min-h-[120px] items-center justify-center rounded-lg border border-dashed border-border/70 px-4 text-center text-sm text-muted-foreground">
                                  {config.empty}
                                </div>
                              )}

                              {columnTasks.map((task, index) => {
                                const projectName = task.project_id ? projectById.get(task.project_id)?.name : undefined;
                                const assigneeNames = isAdmin
                                  ? Array.from(assigneeIdsByTaskId.get(task.id) || [])
                                      .map((userId) => profileByUserId.get(userId)?.name || profileByUserId.get(userId)?.email || 'Usuario')
                                  : [];

                                return (
                                  <Draggable key={task.id} draggableId={task.id} index={index}>
                                    {(dragProvided, dragSnapshot) => (
                                      <div
                                        ref={dragProvided.innerRef}
                                        {...dragProvided.draggableProps}
                                        className="group"
                                      >
                                        <MyTaskCard
                                          task={task}
                                          projectName={projectName}
                                          assigneeNames={assigneeNames}
                                          isDragging={dragSnapshot.isDragging}
                                          dragHandleProps={dragProvided.dragHandleProps}
                                          onOpen={setSelectedTask}
                                        />
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
