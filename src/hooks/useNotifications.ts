import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';
import { useEffect } from 'react';

const DYLAN_USER_ID = '378759b2-7f24-4523-893c-d23bd3213484';

async function sendDiscordDylanNotification(payload: {
  event_type: 'assignment' | 'mention' | 'task_comment';
  target_user_id?: string;
  related_assignee_ids?: string[];
  task_title: string;
  project_name?: string;
  comment?: string;
  link?: string;
}) {
  const {
    data: { session },
    error,
  } = await supabase.auth.getSession();

  if (error || !session?.access_token) {
    throw new Error('No hay sesión activa para avisar a Discord');
  }

  await supabase.functions.invoke('discord-dylan-notify', {
    body: payload,
    headers: {
      Authorization: `Bearer ${session.access_token}`,
      'X-App-Origin': window.location.origin,
    },
  });
}

export interface Notification {
  id: string;
  user_id: string;
  type: string;
  title: string;
  message: string;
  link: string | null;
  is_read: boolean;
  created_by: string | null;
  task_id: string | null;
  project_id: string | null;
  created_at: string;
}

export function useNotifications() {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  // Subscribe to realtime notifications
  useEffect(() => {
    if (!user?.id) return;

    const channel = supabase
      .channel('notifications-realtime')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'notifications',
          filter: `user_id=eq.${user.id}`,
        },
        () => {
          queryClient.invalidateQueries({ queryKey: ['notifications'] });
          queryClient.invalidateQueries({ queryKey: ['unread-notifications-count'] });
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [user?.id, queryClient]);

  return useQuery({
    queryKey: ['notifications', user?.id],
    queryFn: async () => {
      if (!user?.id) return [];
      
      const { data, error } = await supabase
        .from('notifications')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })
        .limit(50);
      
      if (error) throw error;
      return data as Notification[];
    },
    enabled: !!user?.id
  });
}

export function useUnreadNotificationsCount() {
  const { user } = useAuth();

  return useQuery({
    queryKey: ['unread-notifications-count', user?.id],
    queryFn: async () => {
      if (!user?.id) return 0;
      
      const { count, error } = await supabase
        .from('notifications')
        .select('*', { count: 'exact', head: true })
        .eq('user_id', user.id)
        .eq('is_read', false);
      
      if (error) throw error;
      return count || 0;
    },
    enabled: !!user?.id
  });
}

export function useMarkNotificationAsRead() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (notificationId: string) => {
      const { error } = await supabase
        .from('notifications')
        .update({ is_read: true })
        .eq('id', notificationId);
      
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['notifications'] });
      queryClient.invalidateQueries({ queryKey: ['unread-notifications-count'] });
    }
  });
}

export function useMarkAllNotificationsAsRead() {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async () => {
      if (!user?.id) throw new Error('Not authenticated');
      
      const { error } = await supabase
        .from('notifications')
        .update({ is_read: true })
        .eq('user_id', user.id)
        .eq('is_read', false);
      
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['notifications'] });
      queryClient.invalidateQueries({ queryKey: ['unread-notifications-count'] });
    }
  });
}

export function useCreateNotification() {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (notification: {
      user_id: string;
      type: string;
      title: string;
      message: string;
      link?: string;
      task_id?: string;
      project_id?: string;
    }) => {
      const { error } = await supabase
        .from('notifications')
        .insert({
          ...notification,
          created_by: user?.id
        });
      
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['notifications'] });
    }
  });
}

// Helper to parse mentions from text and create notifications
export function useMentionNotifications() {
  const createNotification = useCreateNotification();
  const { user } = useAuth();

  const sendMentionNotifications = async (
    text: string,
    profiles: { user_id: string; name: string }[],
    context: {
      taskId?: string;
      projectId?: string;
      link?: string;
      contextType: 'comment' | 'task' | 'initiative';
      contextName: string;
    }
  ) => {
    // Find all @mentions in text
    const mentionRegex = /@(\w+(?:\s+\w+)?)/g;
    const mentions = text.match(mentionRegex) || [];
    const notifiedUserIds = new Set<string>();
    
    for (const mention of mentions) {
      const mentionedName = mention.slice(1).toLowerCase();
      
      // Find matching profile
      const mentionedProfile = profiles.find(p => 
        p.name.toLowerCase().includes(mentionedName) ||
        mentionedName.includes(p.name.toLowerCase().split(' ')[0])
      );
      
      if (mentionedProfile && mentionedProfile.user_id !== user?.id && !notifiedUserIds.has(mentionedProfile.user_id)) {
        notifiedUserIds.add(mentionedProfile.user_id);
        await createNotification.mutateAsync({
          user_id: mentionedProfile.user_id,
          type: 'mention',
          title: `Te mencionaron en ${context.contextType === 'comment' ? 'un comentario' : 'una tarea'}`,
          message: `${user?.email?.split('@')[0] || 'Alguien'} te mencionó en "${context.contextName}"`,
          link: context.link ?? (context.taskId ? `/my-tasks?task=${context.taskId}` : undefined),
          task_id: context.taskId,
          project_id: context.projectId
        });

        if (mentionedProfile.user_id === DYLAN_USER_ID) {
          try {
            await sendDiscordDylanNotification({
              event_type: 'mention',
              target_user_id: mentionedProfile.user_id,
              task_title: context.contextName,
              link: context.link ?? (context.taskId ? `/my-tasks?task=${context.taskId}` : undefined),
            });
          } catch (error) {
            console.error('Error sending Dylan Discord mention notification:', error);
          }
        }
      }
    }
  };

  return { sendMentionNotifications };
}

// Helper to send assignment notifications
export function useAssignmentNotifications() {
  const createNotification = useCreateNotification();
  const { user } = useAuth();

  const sendAssignmentNotification = async (
    assignedUserId: string,
    taskTitle: string,
    taskId: string,
    projectId?: string
  ) => {
    if (assignedUserId === user?.id) return; // Don't notify self

    await createNotification.mutateAsync({
      user_id: assignedUserId,
      type: 'assignment',
      title: 'Te asignaron una tarea',
      message: `Te asignaron la tarea "${taskTitle}"`,
      link: `/my-tasks?task=${taskId}`,
      task_id: taskId,
      project_id: projectId
    });

    if (assignedUserId === DYLAN_USER_ID) {
      try {
        await sendDiscordDylanNotification({
          event_type: 'assignment',
          target_user_id: assignedUserId,
          task_title: taskTitle,
          link: `/my-tasks?task=${taskId}`,
        });
      } catch (error) {
        console.error('Error sending Dylan Discord assignment notification:', error);
      }
    }
  };

  return { sendAssignmentNotification };
}
