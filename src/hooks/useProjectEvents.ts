import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';

export interface ProjectEvent {
  id: string;
  project_id: string;
  title: string;
  description: string | null;
  event_date: string;
  event_time: string | null;
  event_end_time: string | null;
  event_type: string;
  created_by: string;
  created_at: string;
  updated_at: string;
}

export function useProjectEvents(projectId?: string) {
  return useQuery({
    queryKey: ['project-events', projectId],
    queryFn: async () => {
      if (!projectId) return [];
      const { data, error } = await supabase
        .from('project_events' as any)
        .select('*')
        .eq('project_id', projectId)
        .order('event_date', { ascending: true });
      if (error) throw error;
      return data as unknown as ProjectEvent[];
    },
    enabled: !!projectId,
  });
}

export function useCreateProjectEvent() {
  const queryClient = useQueryClient();
  const { user } = useAuth();

  return useMutation({
    mutationFn: async (event: { project_id: string; title: string; description?: string; event_date: string; event_time?: string; event_end_time?: string; event_type?: string }) => {
      const { data, error } = await supabase
        .from('project_events' as any)
        .insert({ ...event, created_by: user?.id })
        .select()
        .single();
      if (error) throw error;
      return data as unknown as ProjectEvent;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['project-events', variables.project_id] });
    },
  });
}

export function useDeleteProjectEvent() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ eventId, projectId }: { eventId: string; projectId: string }) => {
      const { error } = await supabase
        .from('project_events' as any)
        .delete()
        .eq('id', eventId);
      if (error) throw error;
      return projectId;
    },
    onSuccess: (projectId) => {
      queryClient.invalidateQueries({ queryKey: ['project-events', projectId] });
    },
  });
}
