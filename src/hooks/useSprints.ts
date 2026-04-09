import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';

export type SprintStatus = 'planning' | 'active' | 'review' | 'completed';
export type StoryStatus = 'backlog' | 'todo' | 'in_progress' | 'review' | 'done';
export type StoryPriority = 'must' | 'should' | 'could' | 'wont';

export interface Sprint {
  id: string;
  project_id: string;
  name: string;
  goal: string | null;
  start_date: string;
  end_date: string;
  status: SprintStatus;
  created_at: string;
  updated_at: string;
}

export interface UserStory {
  id: string;
  sprint_id: string | null;
  project_id: string;
  title: string;
  description: string | null;
  acceptance_criteria: string[];
  priority: StoryPriority;
  points: number | null;
  status: StoryStatus;
  assigned_to: string | null;
  is_ai_generated: boolean;
  source_feature_id: string | null;
  is_client_visible: boolean;
  client_input_required: boolean;
  created_at: string;
  updated_at: string;
}

export function useSprints(projectId?: string) {
  return useQuery({
    queryKey: ['sprints', projectId],
    queryFn: async () => {
      if (!projectId) return [];
      const { data, error } = await supabase
        .from('sprints')
        .select('*')
        .eq('project_id', projectId)
        .order('created_at', { ascending: false });
      if (error) throw error;
      return data as Sprint[];
    },
    enabled: !!projectId,
  });
}

export function useActiveSprint(projectId?: string) {
  return useQuery({
    queryKey: ['sprints', projectId, 'active'],
    queryFn: async () => {
      if (!projectId) return null;
      const { data, error } = await supabase
        .from('sprints')
        .select('*')
        .eq('project_id', projectId)
        .eq('status', 'active')
        .maybeSingle();
      if (error) throw error;
      return data as Sprint | null;
    },
    enabled: !!projectId,
  });
}

export function useCreateSprint() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (sprint: { project_id: string; name: string; goal?: string; start_date?: string; end_date?: string }) => {
      const { data, error } = await supabase
        .from('sprints')
        .insert(sprint)
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: (_, v) => {
      qc.invalidateQueries({ queryKey: ['sprints', v.project_id] });
    },
  });
}

export function useUpdateSprint() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, updates }: { id: string; updates: Partial<Pick<Sprint, 'name' | 'goal' | 'status' | 'start_date' | 'end_date'>> }) => {
      const { data, error } = await supabase
        .from('sprints')
        .update(updates)
        .eq('id', id)
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['sprints'] });
    },
  });
}

export function useUserStories(projectId?: string, sprintId?: string | null) {
  return useQuery({
    queryKey: ['user_stories', projectId, sprintId],
    queryFn: async () => {
      if (!projectId) return [];
      let query = supabase
        .from('user_stories')
        .select('*')
        .eq('project_id', projectId);
      
      if (sprintId === null) {
        // Backlog only (no sprint)
        query = query.is('sprint_id', null);
      } else if (sprintId) {
        query = query.eq('sprint_id', sprintId);
      }
      
      const { data, error } = await query.order('created_at', { ascending: true });
      if (error) throw error;
      return data as UserStory[];
    },
    enabled: !!projectId,
  });
}

export function useCreateUserStory() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (story: {
      project_id: string;
      sprint_id?: string | null;
      title: string;
      description?: string;
      acceptance_criteria?: string[];
      priority?: StoryPriority;
      points?: number;
      status?: StoryStatus;
      assigned_to?: string;
      is_ai_generated?: boolean;
      source_feature_id?: string;
    }) => {
      const { data, error } = await supabase
        .from('user_stories')
        .insert(story)
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: (d) => {
      qc.invalidateQueries({ queryKey: ['user_stories', d.project_id] });
    },
  });
}

export function useUpdateUserStory() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, updates }: { id: string; updates: Partial<Omit<UserStory, 'id' | 'created_at' | 'updated_at'>> }) => {
      const { data, error } = await supabase
        .from('user_stories')
        .update(updates)
        .eq('id', id)
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: (d) => {
      qc.invalidateQueries({ queryKey: ['user_stories'] });
    },
  });
}

export function useDeleteUserStory() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('user_stories')
        .delete()
        .eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['user_stories'] });
    },
  });
}

export function useCompleteSprint() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (sprintId: string) => {
      // Mark sprint as completed
      const { error: sprintError } = await supabase
        .from('sprints')
        .update({ status: 'completed' as any })
        .eq('id', sprintId);
      if (sprintError) throw sprintError;

      // Move incomplete stories back to backlog
      const { error: storiesError } = await supabase
        .from('user_stories')
        .update({ sprint_id: null, status: 'backlog' as any })
        .eq('sprint_id', sprintId)
        .neq('status', 'done');
      if (storiesError) throw storiesError;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['sprints'] });
      qc.invalidateQueries({ queryKey: ['user_stories'] });
    },
  });
}
