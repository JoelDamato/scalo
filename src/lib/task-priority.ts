import type { Task } from '@/hooks/useData';

export type TaskPriority = 'low' | 'medium' | 'high' | 'urgent';
export type TaskSortOption = 'manual' | 'priority' | 'scheduled' | 'recent';

export const taskPriorityLabel: Record<TaskPriority, string> = {
  low: 'Baja',
  medium: 'Media',
  high: 'Alta',
  urgent: 'Urgente',
};

export const taskPriorityClassName: Record<TaskPriority, string> = {
  low: 'border-slate-300 text-slate-600',
  medium: 'border-sky-300 text-sky-700',
  high: 'border-amber-300 text-amber-700',
  urgent: 'border-red-300 text-red-700',
};

const priorityWeight: Record<TaskPriority, number> = {
  urgent: 0,
  high: 1,
  medium: 2,
  low: 3,
};

export function compareTasksByPriority(
  a: Pick<Task, 'priority' | 'scheduled_date' | 'updated_at' | 'created_at'>,
  b: Pick<Task, 'priority' | 'scheduled_date' | 'updated_at' | 'created_at'>,
) {
  const priorityDiff = priorityWeight[a.priority] - priorityWeight[b.priority];
  if (priorityDiff !== 0) return priorityDiff;

  const scheduledA = a.scheduled_date || '';
  const scheduledB = b.scheduled_date || '';
  if (scheduledA && scheduledB && scheduledA !== scheduledB) {
    return scheduledA.localeCompare(scheduledB);
  }
  if (scheduledA && !scheduledB) return -1;
  if (!scheduledA && scheduledB) return 1;

  return b.updated_at.localeCompare(a.updated_at);
}

export function sortTasks(tasks: Task[], sortBy: TaskSortOption) {
  const items = [...tasks];

  switch (sortBy) {
    case 'priority':
      return items.sort(compareTasksByPriority);
    case 'scheduled':
      return items.sort((a, b) => {
        const dateA = a.scheduled_date || a.updated_at;
        const dateB = b.scheduled_date || b.updated_at;
        return dateA.localeCompare(dateB);
      });
    case 'recent':
      return items.sort((a, b) => b.created_at.localeCompare(a.created_at));
    case 'manual':
    default:
      return items;
  }
}
