import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

export interface ProjectKnowledgeBase {
  id: string;
  project_id: string;
  responses: Record<string, any>;
  is_completed: boolean;
  created_at: string;
  updated_at: string;
}

export function useProjectKnowledgeBase(projectId?: string) {
  return useQuery({
    queryKey: ['project-knowledge-base', projectId],
    queryFn: async () => {
      if (!projectId) return null;
      const { data, error } = await supabase
        .from('project_knowledge_base' as any)
        .select('*')
        .eq('project_id', projectId)
        .maybeSingle();
      if (error) throw error;
      return data as unknown as ProjectKnowledgeBase | null;
    },
    enabled: !!projectId,
  });
}

export function useUpsertKnowledgeBase() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ projectId, responses }: { projectId: string; responses: Record<string, any> }) => {
      // Try update first
      const { data: existing } = await supabase
        .from('project_knowledge_base' as any)
        .select('id')
        .eq('project_id', projectId)
        .maybeSingle();

      if (existing) {
        const { error } = await supabase
          .from('project_knowledge_base' as any)
          .update({ responses, updated_at: new Date().toISOString() })
          .eq('project_id', projectId);
        if (error) throw error;
      } else {
        const { error } = await supabase
          .from('project_knowledge_base' as any)
          .insert({ project_id: projectId, responses });
        if (error) throw error;
      }
    },
    onSuccess: (_, { projectId }) => {
      queryClient.invalidateQueries({ queryKey: ['project-knowledge-base', projectId] });
    },
  });
}
