import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

export interface ProjectPage {
  id: string;
  project_id: string;
  title: string;
  page_url: string;
  description: string | null;
  created_by: string | null;
  created_at: string;
  updated_at: string;
}

export interface ProjectPagePayload {
  project_id: string;
  title: string;
  page_url: string;
  description?: string | null;
}

export function useProjectPages(projectId?: string) {
  return useQuery({
    queryKey: ['project-pages', projectId],
    queryFn: async () => {
      if (!projectId) return [];

      const { data, error } = await supabase
        .from('project_pages')
        .select('*')
        .eq('project_id', projectId)
        .order('updated_at', { ascending: false });

      if (error) throw error;
      return data as ProjectPage[];
    },
    enabled: !!projectId,
  });
}

export function useCreateProjectPage() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (payload: ProjectPagePayload) => {
      const { data, error } = await supabase
        .from('project_pages')
        .insert(payload)
        .select()
        .single();

      if (error) throw error;
      return data as ProjectPage;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['project-pages', variables.project_id] });
    },
  });
}

export function useUpdateProjectPage() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      id,
      projectId,
      updates,
    }: {
      id: string;
      projectId: string;
      updates: Partial<Omit<ProjectPage, 'id' | 'project_id' | 'created_at' | 'updated_at'>>;
    }) => {
      const { data, error } = await supabase
        .from('project_pages')
        .update(updates)
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      return data as ProjectPage;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['project-pages', variables.projectId] });
    },
  });
}

export function useDeleteProjectPage() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, projectId }: { id: string; projectId: string }) => {
      const { error } = await supabase
        .from('project_pages')
        .delete()
        .eq('id', id);

      if (error) throw error;
      return projectId;
    },
    onSuccess: (projectId) => {
      queryClient.invalidateQueries({ queryKey: ['project-pages', projectId] });
    },
  });
}
