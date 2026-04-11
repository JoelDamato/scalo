import { useState, useMemo } from 'react';
import { DragDropContext, DropResult } from '@hello-pangea/dnd';
import { KanbanColumn } from './KanbanColumn';
import { TaskDetailSheet } from './TaskDetailSheet';
import { useTasks, useUpdateTaskStatus, Task } from '@/hooks/useData';
import { useAuth } from '@/hooks/useAuth';
import { Skeleton } from '@/components/ui/skeleton';
import { useTasksAssignees } from '@/hooks/useTaskAssignees';
import { useProfiles } from '@/hooks/useProfiles';
import { ProjectTicketsColumn } from './ProjectTicketsColumn';

interface KanbanBoardProps {
  projectId?: string;
  mode?: 'project' | 'internal';
}

type TaskStatus = 'backlog' | 'in-progress' | 'review' | 'done';
const columns: TaskStatus[] = ['backlog', 'in-progress', 'review', 'done'];

export function KanbanBoard({ projectId, mode = 'project' }: KanbanBoardProps) {
  // If mode is 'internal', fetch tasks with no project_id
  // If projectId is provided, fetch tasks for that project
  const queryParam = mode === 'internal' ? 'internal' : projectId;
  
  const { data: tasks = [], isLoading } = useTasks(queryParam);
  const { data: profiles = [] } = useProfiles();
  const taskIds = useMemo(() => tasks.map(t => t.id), [tasks]);
  const { data: assignees = [] } = useTasksAssignees(taskIds);
  const updateStatus = useUpdateTaskStatus();
  const { isAdmin } = useAuth();
  const [selectedTask, setSelectedTask] = useState<Task | null>(null);

  if (isLoading) {
    return (
      <div className="flex gap-4">
        {columns.map(status => (
          <Skeleton key={status} className="h-96 w-72" />
        ))}
      </div>
    );
  }

  const handleDragEnd = (result: DropResult) => {
    // Clients cannot drag
    if (!isAdmin) return;
    
    const { destination, source, draggableId } = result;

    if (!destination) return;
    if (
      destination.droppableId === source.droppableId &&
      destination.index === source.index
    ) return;

    const newStatus = destination.droppableId as TaskStatus;
    updateStatus.mutate({ taskId: draggableId, status: newStatus });
  };

  const getTasksByStatus = (status: TaskStatus) =>
    tasks.filter(task => task.status === status);

  // For clients, show read-only view without DragDropContext
  if (!isAdmin) {
    return (
      <>
        <div className="flex gap-4 overflow-x-auto pb-4 flex-1 min-h-0">
          {columns.map(status => (
            <KanbanColumn
              key={status}
              status={status}
              tasks={getTasksByStatus(status)}
              onTaskClick={setSelectedTask}
              isReadOnly
              projectId={projectId}
              mode={mode}
              assignees={assignees}
              profiles={profiles}
            />
          ))}
          {projectId && mode === 'project' && (
            <ProjectTicketsColumn projectId={projectId} isReadOnly />
          )}
        </div>

        <TaskDetailSheet
          task={selectedTask}
          open={!!selectedTask}
          onOpenChange={(open) => !open && setSelectedTask(null)}
        />
      </>
    );
  }

  return (
    <>
      <DragDropContext onDragEnd={handleDragEnd}>
        <div className="flex gap-4 overflow-x-auto pb-4 flex-1 min-h-0">
          {columns.map(status => (
            <KanbanColumn
              key={status}
              status={status}
              tasks={getTasksByStatus(status)}
              onTaskClick={setSelectedTask}
              projectId={projectId}
              mode={mode}
              assignees={assignees}
              profiles={profiles}
            />
          ))}
          {projectId && mode === 'project' && (
            <ProjectTicketsColumn projectId={projectId} />
          )}
        </div>
      </DragDropContext>

      <TaskDetailSheet
        task={selectedTask}
        open={!!selectedTask}
        onOpenChange={(open) => !open && setSelectedTask(null)}
      />
    </>
  );
}
