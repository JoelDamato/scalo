import { useEffect } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';

export interface GoogleCalendarConnectionStatus {
  connected: boolean;
  connection: {
    google_email: string | null;
    calendar_id: string;
    calendar_summary: string | null;
    token_expires_at: string | null;
    updated_at: string;
  } | null;
}

export interface GoogleCalendarSyncRow {
  id: string;
  user_id: string;
  source_type: 'task' | 'project_event';
  source_id: string;
  google_event_id: string;
  calendar_id: string;
  synced_at: string;
  created_at: string;
  updated_at: string;
}

const GOOGLE_CALENDAR_CONNECT_ERROR =
  'No pude iniciar la conexión con Google Calendar. Revisá que la sesión siga activa e intentá de nuevo.';

async function getFunctionErrorMessage(error: unknown, fallback: string) {
  if (!(error instanceof Error)) return fallback;

  const context = (error as { context?: Response }).context;
  if (context) {
    try {
      const body = await context.clone().json();
      if (typeof body?.error === 'string') return body.error;
      if (typeof body?.message === 'string') return body.message;
    } catch {
      try {
        const text = await context.clone().text();
        if (text) return text;
      } catch {
        // Keep the original Supabase error message below.
      }
    }
  }

  if (error.message === 'Edge Function returned a non-2xx status code') {
    return fallback;
  }

  return error.message || fallback;
}

async function getCurrentAccessToken() {
  const {
    data: { session },
    error,
  } = await supabase.auth.getSession();

  if (error || !session?.access_token) {
    throw new Error('Tu sesión expiró. Cerrá sesión, volvé a entrar y probá conectar Google Calendar otra vez.');
  }

  return session.access_token;
}

async function invokeGoogleCalendarFunction<T>(
  functionName: string,
  options: Parameters<typeof supabase.functions.invoke>[1] = {},
  fallback = GOOGLE_CALENDAR_CONNECT_ERROR,
) {
  const accessToken = await getCurrentAccessToken();
  const { data, error } = await supabase.functions.invoke(functionName, {
    ...options,
    headers: {
      ...(options?.headers || {}),
      Authorization: `Bearer ${accessToken}`,
    },
  });

  if (error) {
    throw new Error(await getFunctionErrorMessage(error, fallback));
  }

  return data as T;
}

export function useGoogleCalendarStatus() {
  const { user } = useAuth();

  return useQuery({
    queryKey: ['google-calendar-status', user?.id],
    queryFn: async () => {
      return invokeGoogleCalendarFunction<GoogleCalendarConnectionStatus>('google-calendar-status');
    },
    enabled: !!user,
    retry: false,
  });
}

export function useGoogleCalendarSyncs(sourceType: 'task' | 'project_event', sourceIds: string[]) {
  const { user } = useAuth();

  return useQuery({
    queryKey: ['google-calendar-syncs', user?.id, sourceType, sourceIds],
    queryFn: async () => {
      if (!user || sourceIds.length === 0) return [];

      const { data, error } = await supabase
        .from('google_calendar_syncs')
        .select('*')
        .eq('source_type', sourceType)
        .in('source_id', sourceIds);

      if (error) throw error;
      return data as unknown as GoogleCalendarSyncRow[];
    },
    enabled: !!user && sourceIds.length > 0,
  });
}

export function useGoogleCalendarSync(sourceType: 'task' | 'project_event') {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      sourceId,
      action = 'sync',
      timeZone,
    }: {
      sourceId: string;
      action?: 'sync' | 'remove';
      timeZone?: string;
    }) => {
      return invokeGoogleCalendarFunction('google-calendar-sync', {
        body: {
          sourceType,
          sourceId,
          action,
          timeZone,
        },
      });
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['google-calendar-status'] });
      queryClient.invalidateQueries({ queryKey: ['google-calendar-syncs'] });
      if (sourceType === 'task') {
        queryClient.invalidateQueries({ queryKey: ['tasks'] });
      } else {
        queryClient.invalidateQueries({ queryKey: ['project-events'] });
      }
    },
  });
}

export function useGoogleCalendarConnect() {
  const queryClient = useQueryClient();

  useEffect(() => {
    const handler = (event: MessageEvent) => {
      if (event.origin !== window.location.origin) return;
      if (event.data?.type === 'google-calendar-connected') {
        queryClient.invalidateQueries({ queryKey: ['google-calendar-status'] });
        queryClient.invalidateQueries({ queryKey: ['google-calendar-syncs'] });
        toast.success('Google Calendar conectado');
      }

      if (event.data?.type === 'google-calendar-error') {
        toast.error(event.data?.message || 'No pude conectar Google Calendar');
      }
    };

    window.addEventListener('message', handler);
    return () => window.removeEventListener('message', handler);
  }, [queryClient]);

  return useMutation({
    mutationFn: async () => {
      const popup = window.open('', 'google-calendar-connect', 'width=560,height=720');
      if (popup) {
        popup.document.write(`
          <html>
            <head><title>Conectando Google Calendar</title></head>
            <body style="font-family: sans-serif; display: grid; min-height: 100vh; place-items: center; background: #0a0a0a; color: white; margin: 0;">
              <div style="text-align: center;">
                <h1 style="font-size: 18px;">Conectando Google Calendar...</h1>
                <p style="color: #a1a1aa;">Un momento, estamos abriendo Google.</p>
              </div>
            </body>
          </html>
        `);
        popup.document.close();
      }

      try {
        const data = await invokeGoogleCalendarFunction<{ authUrl?: string }>(
          'google-calendar-auth-url',
          {},
          GOOGLE_CALENDAR_CONNECT_ERROR,
        );

        const authUrl = data?.authUrl;
        if (!authUrl) {
          popup?.close();
          throw new Error('No pude generar el link de conexión con Google');
        }

        if (popup && !popup.closed) {
          popup.location.href = authUrl;
        } else {
          window.location.href = authUrl;
        }

        return data;
      } catch (error) {
        popup?.close();
        throw error;
      }
    },
  });
}

export function useGoogleCalendarExchange() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ code, state }: { code: string; state: string }) => {
      return invokeGoogleCalendarFunction('google-calendar-exchange', {
        body: { code, state },
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['google-calendar-status'] });
      queryClient.invalidateQueries({ queryKey: ['google-calendar-syncs'] });
    },
  });
}

export function useGoogleCalendarDisconnect() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async () => {
      return invokeGoogleCalendarFunction('google-calendar-disconnect');
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['google-calendar-status'] });
      queryClient.invalidateQueries({ queryKey: ['google-calendar-syncs'] });
    },
  });
}
