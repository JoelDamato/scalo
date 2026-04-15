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

export interface ReportComment {
  id: string;
  report_id: string;
  author_id: string;
  content: string;
  created_at: string;
}

export interface ReportAddendum {
  id: string;
  report_id: string;
  author_id: string;
  title: string | null;
  content: string;
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

export function useReportAddendums(reportId: string) {
  return useQuery({
    queryKey: ['report-addendums', reportId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('report_addendums')
        .select('*')
        .eq('report_id', reportId)
        .order('created_at', { ascending: true });

      if (error) throw error;
      return data as ReportAddendum[];
    },
    enabled: !!reportId,
  });
}

export function useReportComments(reportId: string) {
  return useQuery({
    queryKey: ['report-comments', reportId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('report_comments')
        .select('*')
        .eq('report_id', reportId)
        .order('created_at', { ascending: true });

      if (error) throw error;
      return data as ReportComment[];
    },
    enabled: !!reportId,
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

export function useCreateReportAddendum() {
  const queryClient = useQueryClient();
  const { user } = useAuth();

  return useMutation({
    mutationFn: async ({
      reportId,
      title,
      content,
    }: {
      reportId: string;
      title?: string;
      content: string;
    }) => {
      if (!user?.id) {
        throw new Error('Not authenticated');
      }

      const { data, error } = await supabase
        .from('report_addendums')
        .insert({
          report_id: reportId,
          title: title?.trim() || null,
          content: content.trim(),
          author_id: user.id,
        })
        .select()
        .single();

      if (error) throw error;
      return data as ReportAddendum;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['report-addendums', variables.reportId] });
      toast.success('Anexo agregado');
    },
    onError: (error) => {
      toast.error(error instanceof Error ? error.message : 'No se pudo agregar el anexo');
    },
  });
}

export function useCreateReportComment() {
  const queryClient = useQueryClient();
  const { user } = useAuth();

  return useMutation({
    mutationFn: async ({ reportId, content }: { reportId: string; content: string }) => {
      if (!user?.id) {
        throw new Error('Not authenticated');
      }

      const { data, error } = await supabase
        .from('report_comments')
        .insert({
          report_id: reportId,
          content: content.trim(),
          author_id: user.id,
        })
        .select()
        .single();

      if (error) throw error;
      return data as ReportComment;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['report-comments', variables.reportId] });
      toast.success('Comentario publicado');
    },
    onError: (error) => {
      toast.error(error instanceof Error ? error.message : 'No se pudo publicar el comentario');
    },
  });
}
