import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';
import { toast } from 'sonner';

export function useInitiativeShare(initiativeId: string | undefined) {
  return useQuery({
    queryKey: ['initiative-share', initiativeId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('initiative_shares' as any)
        .select('*')
        .eq('initiative_id', initiativeId!)
        .eq('is_active', true)
        .maybeSingle();
      if (error) throw error;
      return data as unknown as { id: string; share_token: string; initiative_id: string; is_active: boolean } | null;
    },
    enabled: !!initiativeId,
  });
}

export function useCreateInitiativeShare() {
  const queryClient = useQueryClient();
  const { user } = useAuth();

  return useMutation({
    mutationFn: async (initiativeId: string) => {
      if (!user?.id) throw new Error('Not authenticated');

      // Check if one already exists
      const { data: existing } = await supabase
        .from('initiative_shares' as any)
        .select('*')
        .eq('initiative_id', initiativeId)
        .eq('is_active', true)
        .maybeSingle();

      if (existing) return existing as unknown as { id: string; share_token: string };

      const { data, error } = await supabase
        .from('initiative_shares' as any)
        .insert({ initiative_id: initiativeId, created_by: user.id })
        .select()
        .single();
      if (error) throw error;
      return data as unknown as { id: string; share_token: string };
    },
    onSuccess: (_, initiativeId) => {
      queryClient.invalidateQueries({ queryKey: ['initiative-share', initiativeId] });
      toast.success('Link público generado');
    },
  });
}

export function useRevokeInitiativeShare() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ shareId, initiativeId }: { shareId: string; initiativeId: string }) => {
      const { error } = await supabase
        .from('initiative_shares' as any)
        .update({ is_active: false })
        .eq('id', shareId);
      if (error) throw error;
    },
    onSuccess: (_, { initiativeId }) => {
      queryClient.invalidateQueries({ queryKey: ['initiative-share', initiativeId] });
      toast.success('Link público revocado');
    },
  });
}

export function getShareUrl(token: string): string {
  return `${window.location.origin}/shared/${token}`;
}
