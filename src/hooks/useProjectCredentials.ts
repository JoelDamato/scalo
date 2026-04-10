import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

export interface ProjectCredential {
  id: string;
  project_id: string;
  tool_name: string;
  access_url: string | null;
  username: string | null;
  password: string;
  notes: string | null;
  created_by: string | null;
  created_at: string;
  updated_at: string;
}

export interface ProjectCredentialPayload {
  project_id: string;
  tool_name: string;
  access_url?: string | null;
  username?: string | null;
  password: string;
  notes?: string | null;
}

export function useProjectCredentials(projectId?: string) {
  return useQuery({
    queryKey: ['project-credentials', projectId],
    queryFn: async () => {
      if (!projectId) return [];

      const { data, error } = await supabase
        .from('project_credentials')
        .select('*')
        .eq('project_id', projectId)
        .order('updated_at', { ascending: false });

      if (error) throw error;
      return data as ProjectCredential[];
    },
    enabled: !!projectId,
  });
}

export function useCreateProjectCredential() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (payload: ProjectCredentialPayload) => {
      const { data, error } = await supabase
        .from('project_credentials')
        .insert(payload)
        .select()
        .single();

      if (error) throw error;
      return data as ProjectCredential;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['project-credentials', variables.project_id] });
    },
  });
}

export function useUpdateProjectCredential() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      id,
      projectId,
      updates,
    }: {
      id: string;
      projectId: string;
      updates: Partial<Omit<ProjectCredential, 'id' | 'project_id' | 'created_at' | 'updated_at'>>;
    }) => {
      const { data, error } = await supabase
        .from('project_credentials')
        .update(updates)
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;

      return {
        credential: data as ProjectCredential,
        projectId,
      };
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['project-credentials', variables.projectId] });
    },
  });
}

export function useDeleteProjectCredential() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, projectId }: { id: string; projectId: string }) => {
      const { error } = await supabase
        .from('project_credentials')
        .delete()
        .eq('id', id);

      if (error) throw error;
      return projectId;
    },
    onSuccess: (projectId) => {
      queryClient.invalidateQueries({ queryKey: ['project-credentials', projectId] });
    },
  });
}
