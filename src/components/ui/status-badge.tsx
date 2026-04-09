import { cn } from '@/lib/utils';
import { TaskStatus, ProjectStatus } from '@/types';

interface StatusBadgeProps {
  status: TaskStatus | ProjectStatus;
  className?: string;
}

const taskStatusConfig: Record<TaskStatus, { label: string; className: string }> = {
  backlog: {
    label: 'Backlog',
    className: 'bg-status-backlog/15 text-status-backlog border-status-backlog/20',
  },
  'in-progress': {
    label: 'En progreso',
    className: 'bg-status-in-progress/15 text-status-in-progress border-status-in-progress/20',
  },
  review: {
    label: 'Revisión',
    className: 'bg-status-review/15 text-status-review border-status-review/20',
  },
  done: {
    label: 'Hecho',
    className: 'bg-status-done/15 text-status-done border-status-done/20',
  },
};

const projectStatusConfig: Record<ProjectStatus, { label: string; className: string }> = {
  active: {
    label: 'Activo',
    className: 'bg-status-in-progress/15 text-status-in-progress border-status-in-progress/20',
  },
  completed: {
    label: 'Completado',
    className: 'bg-status-done/15 text-status-done border-status-done/20',
  },
  'on-hold': {
    label: 'En pausa',
    className: 'bg-status-review/15 text-status-review border-status-review/20',
  },
};

export function StatusBadge({ status, className }: StatusBadgeProps) {
  const config = 
    status in taskStatusConfig 
      ? taskStatusConfig[status as TaskStatus]
      : projectStatusConfig[status as ProjectStatus];

  return (
    <span
      className={cn(
        'inline-flex items-center px-2 py-0.5 text-xs font-medium rounded-md border',
        config.className,
        className
      )}
    >
      {config.label}
    </span>
  );
}
