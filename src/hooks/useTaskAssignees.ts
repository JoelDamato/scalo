import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import type { Profile } from './useProfiles';

export interface TaskAssignee {
  id: string;
  task_id: string;
  user_id: string;
  created_at: string;
  profile?: Profile;
}

export function useTaskAssignees(taskId?: string) {
  return useQuery({
    queryKey: ['task-assignees', taskId],
    queryFn: async () => {
      if (!taskId) return [];
      
      const { data, error } = await supabase
        .from('task_assignees')
        .select('*')
        .eq('task_id', taskId);
      
      if (error) throw error;
      return data as TaskAssignee[];
    },
    enabled: !!taskId
  });
}

export function useTasksAssignees(taskIds: string[]) {
  return useQuery({
    queryKey: ['tasks-assignees', taskIds],
    queryFn: async () => {
      if (taskIds.length === 0) return [];
      
      const { data, error } = await supabase
        .from('task_assignees')
        .select('*')
        .in('task_id', taskIds);
      
      if (error) throw error;
      return data as TaskAssignee[];
    },
    enabled: taskIds.length > 0
  });
}

export function useAddTaskAssignee() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async ({ taskId, userId }: { taskId: string; userId: string }) => {
      const { data, error } = await supabase
        .from('task_assignees')
        .insert({ task_id: taskId, user_id: userId })
        .select()
        .single();
      
      if (error) throw error;
      return data;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['task-assignees', variables.taskId] });
      queryClient.invalidateQueries({ queryKey: ['tasks-assignees'] });
    }
  });
}

export function useRemoveTaskAssignee() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async ({ taskId, userId }: { taskId: string; userId: string }) => {
      const { error } = await supabase
        .from('task_assignees')
        .delete()
        .eq('task_id', taskId)
        .eq('user_id', userId);
      
      if (error) throw error;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['task-assignees', variables.taskId] });
      queryClient.invalidateQueries({ queryKey: ['tasks-assignees'] });
    }
  });
}

export function useSetTaskAssignees() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async ({ taskId, userIds }: { taskId: string; userIds: string[] }) => {
      // First delete all existing assignees
      const { error: deleteError } = await supabase
        .from('task_assignees')
        .delete()
        .eq('task_id', taskId);
      
      if (deleteError) throw deleteError;
      
      // Then insert new ones
      if (userIds.length > 0) {
        const { error: insertError } = await supabase
          .from('task_assignees')
          .insert(userIds.map(userId => ({ task_id: taskId, user_id: userId })));
        
        if (insertError) throw insertError;
      }
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['task-assignees', variables.taskId] });
      queryClient.invalidateQueries({ queryKey: ['tasks-assignees'] });
    }
  });
}
