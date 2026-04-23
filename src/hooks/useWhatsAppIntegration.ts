import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';

export interface WhatsAppIntegrationStatus {
  id: string;
  label: string;
  evolution_api_url: string;
  instance_name: string;
  instance_token: string | null;
  instance_phone_number: string | null;
  status: string;
  qr_code: string | null;
  pairing_code: string | null;
  connected_phone: string | null;
  profile_name: string | null;
  last_error: string | null;
  last_synced_at: string | null;
  created_by: string;
  created_at: string;
  updated_at: string;
  api_key_preview: string | null;
  has_api_key: boolean;
}

export interface WhatsAppReminder {
  id: string;
  integration_id: string;
  title: string;
  phone_number: string;
  message_template: string;
  cron_expression: string;
  timezone: string;
  send_delay_ms: number;
  active: boolean;
  cron_job_name: string | null;
  last_run_at: string | null;
  last_request_id: number | null;
  last_error: string | null;
  created_by: string;
  created_at: string;
  updated_at: string;
}

export interface WhatsAppReminderRun {
  id: string;
  reminder_id: string;
  request_id: number | null;
  status: 'queued' | 'skipped' | 'error';
  detail: string | null;
  created_at: string;
}

async function getCurrentAccessToken() {
  const {
    data: { session },
    error,
  } = await supabase.auth.getSession();

  if (error || !session?.access_token) {
    throw new Error('Tu sesión venció. Volvé a entrar e intentá de nuevo.');
  }

  return session.access_token;
}

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
        return fallback;
      }
    }
  }

  return error.message || fallback;
}

async function invokeWhatsAppFunction<T>(
  functionName: 'whatsapp-admin' | 'whatsapp-reminders' | 'whatsapp-task-notify',
  body?: Record<string, unknown>,
  fallback = 'No pude completar la acción en WhatsApp.',
) {
  const accessToken = await getCurrentAccessToken();

  const { data, error } = await supabase.functions.invoke(functionName, {
    body,
    headers: {
      Authorization: `Bearer ${accessToken}`,
      'X-App-Origin': window.location.origin,
    },
  });

  if (error) {
    throw new Error(await getFunctionErrorMessage(error, fallback));
  }

  return data as T;
}

export function useWhatsAppStatus() {
  const { user, role } = useAuth();

  return useQuery({
    queryKey: ['whatsapp-status', user?.id],
    queryFn: async () => {
      return invokeWhatsAppFunction<{ ok: true; integration: WhatsAppIntegrationStatus | null }>(
        'whatsapp-admin',
        { action: 'status' },
        'No pude leer la conexión de WhatsApp.',
      );
    },
    enabled: !!user && role === 'admin',
  });
}

export function useWhatsAppSaveConfig() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (payload: {
      label: string;
      evolution_api_url: string;
      evolution_api_key?: string;
      instance_name: string;
      instance_phone_number?: string;
      instance_token?: string;
    }) => {
      return invokeWhatsAppFunction<{ ok: true; integration: WhatsAppIntegrationStatus }>(
        'whatsapp-admin',
        { action: 'save_config', ...payload },
        'No pude guardar la configuración de WhatsApp.',
      );
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['whatsapp-status'] });
    },
  });
}

export function useWhatsAppConnect() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async () => {
      return invokeWhatsAppFunction<{ ok: true; integration: WhatsAppIntegrationStatus }>(
        'whatsapp-admin',
        { action: 'connect_instance' },
        'No pude iniciar la vinculación con WhatsApp.',
      );
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['whatsapp-status'] });
    },
  });
}

export function useWhatsAppRefresh() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async () => {
      return invokeWhatsAppFunction<{ ok: true; integration: WhatsAppIntegrationStatus }>(
        'whatsapp-admin',
        { action: 'refresh_instance' },
        'No pude sincronizar el estado de WhatsApp.',
      );
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['whatsapp-status'] });
    },
  });
}

export function useWhatsAppSendTest() {
  return useMutation({
    mutationFn: async (payload: { phone_number: string; message: string }) => {
      return invokeWhatsAppFunction(
        'whatsapp-admin',
        { action: 'send_test', ...payload },
        'No pude enviar la prueba de WhatsApp.',
      );
    },
  });
}

export function useWhatsAppReminders() {
  const { user, role } = useAuth();

  return useQuery({
    queryKey: ['whatsapp-reminders', user?.id],
    queryFn: async () => {
      return invokeWhatsAppFunction<{
        ok: true;
        integration_id: string | null;
        reminders: WhatsAppReminder[];
        runs: WhatsAppReminderRun[];
      }>(
        'whatsapp-reminders',
        { action: 'list' },
        'No pude leer los recordatorios de WhatsApp.',
      );
    },
    enabled: !!user && role === 'admin',
  });
}

export function useWhatsAppReminderUpsert() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (payload: Partial<WhatsAppReminder> & {
      title: string;
      phone_number: string;
      message_template: string;
      cron_expression: string;
      timezone: string;
      send_delay_ms?: number;
      active?: boolean;
    }) => {
      return invokeWhatsAppFunction(
        'whatsapp-reminders',
        { action: 'upsert', ...payload },
        'No pude guardar el recordatorio.',
      );
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['whatsapp-reminders'] });
    },
  });
}

export function useWhatsAppReminderDelete() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      return invokeWhatsAppFunction(
        'whatsapp-reminders',
        { action: 'delete', id },
        'No pude borrar el recordatorio.',
      );
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['whatsapp-reminders'] });
    },
  });
}

export function useWhatsAppReminderToggle() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, active }: { id: string; active: boolean }) => {
      return invokeWhatsAppFunction(
        'whatsapp-reminders',
        { action: 'toggle', id, active },
        'No pude cambiar el estado del recordatorio.',
      );
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['whatsapp-reminders'] });
    },
  });
}

export function useWhatsAppReminderRunNow() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      return invokeWhatsAppFunction(
        'whatsapp-reminders',
        { action: 'run_now', id },
        'No pude ejecutar el recordatorio ahora.',
      );
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['whatsapp-reminders'] });
    },
  });
}

export function useWhatsAppTaskAssignmentNotification() {
  return useMutation({
    mutationFn: async ({ task_id, assignee_user_id }: { task_id: string; assignee_user_id: string }) => {
      return invokeWhatsAppFunction(
        'whatsapp-task-notify',
        { task_id, assignee_user_id },
        'No pude enviar la notificación por WhatsApp.',
      );
    },
  });
}
