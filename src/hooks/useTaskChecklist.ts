import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

export interface ChecklistItem {
  id: string;
  task_id: string;
  content: string;
  is_completed: boolean;
  sort_order: number;
  created_at: string;
  updated_at: string;
}

export function useTaskChecklist(taskId?: string) {
  return useQuery({
    queryKey: ['task-checklist', taskId],
    queryFn: async () => {
      if (!taskId) return [];
      
      const { data, error } = await supabase
        .from('task_checklist_items')
        .select('*')
        .eq('task_id', taskId)
        .order('sort_order', { ascending: true });
      
      if (error) throw error;
      return data as ChecklistItem[];
    },
    enabled: !!taskId
  });
}

export function useCreateChecklistItem() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async ({ taskId, content }: { taskId: string; content: string }) => {
      // Get max sort_order
      const { data: existing } = await supabase
        .from('task_checklist_items')
        .select('sort_order')
        .eq('task_id', taskId)
        .order('sort_order', { ascending: false })
        .limit(1);
      
      const nextOrder = existing && existing.length > 0 ? existing[0].sort_order + 1 : 0;
      
      const { data, error } = await supabase
        .from('task_checklist_items')
        .insert({ task_id: taskId, content, sort_order: nextOrder })
        .select()
        .single();
      
      if (error) throw error;
      return data;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['task-checklist', variables.taskId] });
    }
  });
}

export function useUpdateChecklistItem() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async ({ 
      itemId, 
      taskId,
      updates 
    }: { 
      itemId: string; 
      taskId: string;
      updates: Partial<Pick<ChecklistItem, 'content' | 'is_completed' | 'sort_order'>> 
    }) => {
      const { data, error } = await supabase
        .from('task_checklist_items')
        .update(updates)
        .eq('id', itemId)
        .select()
        .single();
      
      if (error) throw error;
      return data;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['task-checklist', variables.taskId] });
    }
  });
}

export function useDeleteChecklistItem() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async ({ itemId, taskId }: { itemId: string; taskId: string }) => {
      const { error } = await supabase
        .from('task_checklist_items')
        .delete()
        .eq('id', itemId);
      
      if (error) throw error;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['task-checklist', variables.taskId] });
    }
  });
}
