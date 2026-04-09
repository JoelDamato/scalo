import type { Task } from '@/hooks/useData';
import { Eye, EyeOff, AlertCircle } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useUpdateTask } from '@/hooks/useData';
import { useAuth } from '@/hooks/useAuth';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import { AssigneesAvatars } from './AssigneesAvatars';
import type { Profile } from '@/hooks/useProfiles';

interface TaskCardProps {
  task: Task;
  isDragging?: boolean;
  onClick?: () => void;
  isReadOnly?: boolean;
  assignees?: { user_id: string }[];
  profiles?: Profile[];
}

export function TaskCard({ task, isDragging, onClick, isReadOnly, assignees = [], profiles = [] }: TaskCardProps) {
  const { isAdmin } = useAuth();
  const updateTask = useUpdateTask();

  const handleVisibilityToggle = (e: React.MouseEvent) => {
    e.stopPropagation();
    updateTask.mutate({
      taskId: task.id,
      updates: { is_client_visible: !task.is_client_visible }
    });
  };

  const handleInputRequiredToggle = (e: React.MouseEvent) => {
    e.stopPropagation();
    updateTask.mutate({
      taskId: task.id,
      updates: { client_input_required: !task.client_input_required }
    });
  };

  return (
    <div
      onClick={onClick}
      className={cn(
        'kanban-card group',
        !isReadOnly && 'cursor-pointer',
        isDragging && 'kanban-card-dragging'
      )}
    >
      <div className="flex items-start justify-between gap-2">
        <p className="text-sm font-medium leading-tight group-hover:text-foreground/80 transition-colors flex-1">
          {task.title}
        </p>
      </div>
      
      {task.description && (
        <p className="text-xs text-muted-foreground mt-1 line-clamp-2">
          {task.description}
        </p>
      )}

      <div className="flex items-center justify-between mt-3 pt-2 border-t border-border">
        <div className="flex items-center gap-2">
          <AssigneesAvatars 
            assignees={assignees} 
            profiles={profiles} 
            maxDisplay={3}
            size="xs"
          />
        </div>

        {/* Admin inline controls - compact toggles */}
        {isAdmin && (
          <div className="flex items-center gap-1" onClick={(e) => e.stopPropagation()}>
            <Tooltip>
              <TooltipTrigger asChild>
                <button
                  onClick={handleVisibilityToggle}
                  className={cn(
                    'p-1.5 rounded transition-colors',
                    task.is_client_visible 
                      ? 'bg-primary/20 text-primary hover:bg-primary/30' 
                      : 'bg-muted text-muted-foreground hover:bg-muted/80'
                  )}
                >
                  {task.is_client_visible ? <Eye className="h-3 w-3" /> : <EyeOff className="h-3 w-3" />}
                </button>
              </TooltipTrigger>
              <TooltipContent>{task.is_client_visible ? 'Visible to client' : 'Hidden from client'}</TooltipContent>
            </Tooltip>
            <Tooltip>
              <TooltipTrigger asChild>
                <button
                  onClick={handleInputRequiredToggle}
                  className={cn(
                    'p-1.5 rounded transition-colors',
                    task.client_input_required 
                      ? 'bg-status-review/20 text-status-review hover:bg-status-review/30' 
                      : 'bg-muted text-muted-foreground hover:bg-muted/80'
                  )}
                >
                  <AlertCircle className="h-3 w-3" />
                </button>
              </TooltipTrigger>
              <TooltipContent>{task.client_input_required ? 'Needs client input' : 'No input needed'}</TooltipContent>
            </Tooltip>
          </div>
        )}
      </div>
    </div>
  );
}
