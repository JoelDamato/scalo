import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';
import type { Task } from './useData';
import { sortTasks } from '@/lib/task-priority';

export function useMyTasks() {
  const { user } = useAuth();

  return useQuery({
    queryKey: ['my-tasks', user?.id],
    queryFn: async () => {
      if (!user?.id) return [];

      const { data: assignees, error: assigneesError } = await supabase
        .from('task_assignees')
        .select('task_id')
        .eq('user_id', user.id);

      if (assigneesError) throw assigneesError;

      const assignedTaskIds = (assignees || []).map((item) => item.task_id);

      const taskResults = await Promise.all([
        supabase
          .from('tasks')
          .select('*')
          .eq('assignee_id', user.id),
        assignedTaskIds.length > 0
          ? supabase
              .from('tasks')
              .select('*')
              .in('id', assignedTaskIds)
          : Promise.resolve({ data: [], error: null }),
      ]);

      const [legacyAssigneeTasks, multiAssigneeTasks] = taskResults;

      if (legacyAssigneeTasks.error) throw legacyAssigneeTasks.error;
      if (multiAssigneeTasks.error) throw multiAssigneeTasks.error;

      const taskById = new Map<string, Task>();

      [...(legacyAssigneeTasks.data || []), ...(multiAssigneeTasks.data || [])].forEach((task) => {
        taskById.set(task.id, task as Task);
      });

      return sortTasks(Array.from(taskById.values()), 'priority');
    },
    enabled: !!user?.id,
  });
}
