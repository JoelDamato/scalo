import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';

export interface Report {
  id: string;
  title: string;
  content: string;
  report_date: string;
  created_by: string;
  created_at: string;
}

export function useReports() {
  return useQuery({
    queryKey: ['reports'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('reports')
        .select('*')
        .order('report_date', { ascending: false })
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data as Report[];
    },
  });
}

export function useCreateReport() {
  const queryClient = useQueryClient();
  const { user } = useAuth();

  return useMutation({
    mutationFn: async ({ title, content }: { title: string; content: string }) => {
      if (!user?.id) {
        throw new Error('Not authenticated');
      }

      const { data, error } = await supabase
        .from('reports')
        .insert({
          title: title.trim(),
          content: content.trim(),
          created_by: user.id,
        })
        .select()
        .single();

      if (error) throw error;
      return data as Report;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['reports'] });
      toast.success('Reporte cargado');
    },
    onError: (error) => {
      toast.error(error instanceof Error ? error.message : 'No se pudo cargar el reporte');
    },
  });
}
