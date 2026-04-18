import { useState } from 'react';
import { Droppable, Draggable } from '@hello-pangea/dnd';
import type { Task } from '@/hooks/useData';
import { TaskCard } from './TaskCard';
import { Plus } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { CreateTaskDialog } from './CreateTaskDialog';
import type { Profile } from '@/hooks/useProfiles';
import type { TaskAssignee } from '@/hooks/useTaskAssignees';

type TaskStatus = 'backlog' | 'in-progress' | 'review' | 'done';

interface KanbanColumnProps {
  status: TaskStatus;
  tasks: Task[];
  onTaskClick: (task: Task) => void;
  isReadOnly?: boolean;
  projectId?: string;
  mode?: 'project' | 'internal';
  assignees?: TaskAssignee[];
  profiles?: Profile[];
}

const columnConfig: Record<TaskStatus, { title: string; dotColor: string }> = {
  backlog: { title: 'Backlog', dotColor: 'bg-status-backlog' },
  'in-progress': { title: 'En progreso', dotColor: 'bg-status-in-progress' },
  review: { title: 'Revisión', dotColor: 'bg-status-review' },
  done: { title: 'Finalizadas', dotColor: 'bg-status-done' },
};

export function KanbanColumn({ status, tasks, onTaskClick, isReadOnly, projectId, mode = 'project', assignees = [], profiles = [] }: KanbanColumnProps) {
  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const config = columnConfig[status];

  return (
    <div className="flex flex-col w-72 shrink-0 min-h-0 flex-1">
      <div className="flex items-center justify-between mb-3 px-1">
        <div className="flex items-center gap-2">
          <div className={cn('w-2 h-2 rounded-full', config.dotColor)} />
          <h3 className="text-sm font-medium">{config.title}</h3>
          <span className="text-xs text-muted-foreground bg-muted px-1.5 py-0.5 rounded">
            {tasks.length}
          </span>
        </div>
        {!isReadOnly && (
          <Button 
            variant="ghost" 
            size="sm" 
            className="h-7 px-2 text-muted-foreground hover:text-foreground hover:bg-primary/10"
            onClick={() => setCreateDialogOpen(true)}
          >
            <Plus className="h-4 w-4" />
          </Button>
        )}
      </div>

      <CreateTaskDialog
        open={createDialogOpen}
        onOpenChange={setCreateDialogOpen}
        defaultStatus={status}
        defaultProjectId={projectId}
        mode={mode}
      />

      {/* Empty state is rendered inside the Droppable for admins to preserve drag & drop */}


      {isReadOnly ? (
        // Read-only mode for clients - no drag & drop
        <div className="kanban-column flex-1 space-y-2">
          {tasks.length === 0 && (
            <p className="text-sm text-muted-foreground text-center py-8">Sin tareas</p>
          )}
          {tasks.map((task) => (
            <TaskCard
              key={task.id}
              task={task}
              onClick={() => onTaskClick(task)}
              isReadOnly
              assignees={assignees.filter(a => a.task_id === task.id)}
              profiles={profiles}
            />
          ))}
        </div>
      ) : (
        // Admin mode with drag & drop - always render Droppable
        <Droppable droppableId={status}>
          {(provided, snapshot) => (
            <div
              ref={provided.innerRef}
              {...provided.droppableProps}
              className={cn(
                'kanban-column flex-1 space-y-2 transition-colors min-h-[120px]',
                snapshot.isDraggingOver && 'bg-muted ring-2 ring-primary/10'
              )}
            >
              {tasks.length === 0 && (
                <button
                  onClick={() => setCreateDialogOpen(true)}
                  className="w-full p-4 border-2 border-dashed border-muted-foreground/20 rounded-lg 
                    hover:border-primary/40 hover:bg-primary/5 transition-all duration-200 
                    flex flex-col items-center justify-center gap-2 group cursor-pointer"
                >
                  <div className="h-8 w-8 rounded-full bg-muted flex items-center justify-center group-hover:bg-primary/10 transition-colors">
                    <Plus className="h-4 w-4 text-muted-foreground group-hover:text-primary transition-colors" />
                  </div>
                  <span className="text-sm text-muted-foreground group-hover:text-foreground transition-colors">
                    Añadir tarea
                  </span>
                </button>
              )}
              {tasks.map((task, index) => (
                <Draggable key={task.id} draggableId={task.id} index={index}>
                  {(provided, snapshot) => (
                    <div
                      ref={provided.innerRef}
                      {...provided.draggableProps}
                      {...provided.dragHandleProps}
                    >
                      <TaskCard
                        task={task}
                        isDragging={snapshot.isDragging}
                        onClick={() => onTaskClick(task)}
                        assignees={assignees.filter(a => a.task_id === task.id)}
                        profiles={profiles}
                      />
                    </div>
                  )}
                </Draggable>
              ))}
              {provided.placeholder}
            </div>
          )}
        </Droppable>
      )}
    </div>
  );
}
