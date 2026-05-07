import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

export interface ProjectInstruction {
  category: string | null;
  id: string;
  project_id: string;
  title: string;
  description: string;
  instruction_url: string | null;
  created_by: string | null;
  created_at: string;
  updated_at: string;
}

export interface ProjectInstructionPayload {
  project_id: string;
  category?: string | null;
  title: string;
  description: string;
  instruction_url?: string | null;
}

export function useProjectInstructions(projectId?: string) {
  return useQuery({
    queryKey: ['project-instructions', projectId],
    queryFn: async () => {
      if (!projectId) return [];

      const { data, error } = await supabase
        .from('project_instructions')
        .select('*')
        .eq('project_id', projectId)
        .order('category', { ascending: true, nullsFirst: false })
        .order('updated_at', { ascending: false });

      if (error) throw error;
      return data as ProjectInstruction[];
    },
    enabled: !!projectId,
  });
}

export function useCreateProjectInstruction() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (payload: ProjectInstructionPayload) => {
      const { data, error } = await supabase
        .from('project_instructions')
        .insert(payload)
        .select()
        .single();

      if (error) throw error;
      return data as ProjectInstruction;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['project-instructions', variables.project_id] });
    },
  });
}

export function useUpdateProjectInstruction() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      id,
      projectId,
      updates,
    }: {
      id: string;
      projectId: string;
      updates: Partial<Omit<ProjectInstruction, 'id' | 'project_id' | 'created_at' | 'updated_at'>>;
    }) => {
      const { data, error } = await supabase
        .from('project_instructions')
        .update(updates)
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      return data as ProjectInstruction;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['project-instructions', variables.projectId] });
    },
  });
}

export function useDeleteProjectInstruction() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, projectId }: { id: string; projectId: string }) => {
      const { error } = await supabase
        .from('project_instructions')
        .delete()
        .eq('id', id);

      if (error) throw error;
      return projectId;
    },
    onSuccess: (projectId) => {
      queryClient.invalidateQueries({ queryKey: ['project-instructions', projectId] });
    },
  });
}
