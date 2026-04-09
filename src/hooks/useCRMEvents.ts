import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';

export interface CRMEvent {
  id: string;
  title: string;
  description: string | null;
  event_date: string;
  event_time: string | null;
  end_time: string | null;
  event_type: string;
  created_by: string;
  created_at: string;
  updated_at: string;
}

export interface CRMAnnouncement {
  id: string;
  title: string;
  content: string;
  is_pinned: boolean;
  created_by: string;
  created_at: string;
  updated_at: string;
}

export function useCRMEvents() {
  return useQuery({
    queryKey: ['crm-events'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('crm_events' as any)
        .select('*')
        .order('event_date', { ascending: true });
      if (error) throw error;
      return data as unknown as CRMEvent[];
    },
  });
}

export function useCreateCRMEvent() {
  const qc = useQueryClient();
  const { user } = useAuth();
  return useMutation({
    mutationFn: async (event: { title: string; description?: string; event_date: string; event_time?: string; end_time?: string; event_type?: string }) => {
      const { data, error } = await supabase
        .from('crm_events' as any)
        .insert({ ...event, created_by: user?.id })
        .select()
        .single();
      if (error) throw error;
      return data as unknown as CRMEvent;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['crm-events'] }),
  });
}

export function useDeleteCRMEvent() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from('crm_events' as any).delete().eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['crm-events'] }),
  });
}

export function useCRMAnnouncements() {
  return useQuery({
    queryKey: ['crm-announcements'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('crm_announcements' as any)
        .select('*')
        .order('is_pinned', { ascending: false })
        .order('created_at', { ascending: false });
      if (error) throw error;
      return data as unknown as CRMAnnouncement[];
    },
  });
}

export function useCreateCRMAnnouncement() {
  const qc = useQueryClient();
  const { user } = useAuth();
  return useMutation({
    mutationFn: async (ann: { title: string; content: string; is_pinned?: boolean }) => {
      const { data, error } = await supabase
        .from('crm_announcements' as any)
        .insert({ ...ann, created_by: user?.id })
        .select()
        .single();
      if (error) throw error;
      return data as unknown as CRMAnnouncement;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['crm-announcements'] }),
  });
}

export function useDeleteCRMAnnouncement() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from('crm_announcements' as any).delete().eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['crm-announcements'] }),
  });
}

export function useTogglePinAnnouncement() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, is_pinned }: { id: string; is_pinned: boolean }) => {
      const { error } = await supabase
        .from('crm_announcements' as any)
        .update({ is_pinned })
        .eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['crm-announcements'] }),
  });
}
