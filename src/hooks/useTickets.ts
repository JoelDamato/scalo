import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';

export type TicketCategory = 'bug' | 'feature_request' | 'question' | 'other';
export type TicketPriority = 'low' | 'medium' | 'high' | 'urgent';
export type TicketStatus = 'open' | 'in_progress' | 'waiting_response' | 'resolved' | 'closed';

export interface SupportTicket {
  id: string;
  project_id: string | null;
  created_by: string;
  assigned_to: string | null;
  converted_task_id: string | null;
  category: TicketCategory;
  priority: TicketPriority;
  status: TicketStatus;
  subject: string;
  description: string | null;
  first_response_at: string | null;
  resolved_at: string | null;
  created_at: string;
  updated_at: string;
}

export interface TicketMessage {
  id: string;
  ticket_id: string;
  author_id: string;
  content: string;
  is_internal: boolean;
  created_at: string;
}

export interface TicketAttachment {
  id: string;
  ticket_id: string;
  message_id: string | null;
  uploaded_by: string;
  file_path: string;
  file_name: string;
  content_type: string;
  file_size: number;
  is_internal: boolean;
  created_at: string;
  signed_url?: string | null;
}

export const TICKET_ATTACHMENTS_BUCKET = 'ticket-attachments';
export const MAX_TICKET_IMAGE_SIZE = 10 * 1024 * 1024;

function validateTicketImage(file: File) {
  if (!file.type.startsWith('image/')) {
    throw new Error('Solo se pueden adjuntar imágenes');
  }

  if (file.size > MAX_TICKET_IMAGE_SIZE) {
    throw new Error('Cada imagen debe pesar menos de 10 MB');
  }
}

export async function getTicketAttachmentUrl(path: string) {
  const { data, error } = await supabase.storage
    .from(TICKET_ATTACHMENTS_BUCKET)
    .createSignedUrl(path, 60 * 60);

  if (error) {
    console.error('Error creating signed URL for ticket attachment:', error);
    return null;
  }

  return data.signedUrl;
}

async function uploadTicketImageAttachment(file: File, userId: string, ticketId: string) {
  validateTicketImage(file);

  const fileExt = file.name.split('.').pop()?.toLowerCase() || 'jpg';
  const filePath = `${userId}/${ticketId}/${Date.now()}-${crypto.randomUUID()}.${fileExt}`;

  const { error } = await supabase.storage
    .from(TICKET_ATTACHMENTS_BUCKET)
    .upload(filePath, file, {
      upsert: false,
      contentType: file.type,
    });

  if (error) throw error;

  return {
    file_path: filePath,
    file_name: file.name,
    content_type: file.type,
    file_size: file.size,
  };
}

async function createTicketImageAttachments({
  ticketId,
  messageId = null,
  files = [],
  isInternal = false,
  userId,
}: {
  ticketId: string;
  messageId?: string | null;
  files?: File[];
  isInternal?: boolean;
  userId: string;
}) {
  if (files.length === 0) return [];

  const uploadedFiles: Awaited<ReturnType<typeof uploadTicketImageAttachment>>[] = [];

  try {
    for (const file of files) {
      uploadedFiles.push(await uploadTicketImageAttachment(file, userId, ticketId));
    }

    const { data, error } = await supabase
      .from('ticket_attachments')
      .insert(
        uploadedFiles.map((file) => ({
          ticket_id: ticketId,
          message_id: messageId,
          uploaded_by: userId,
          file_path: file.file_path,
          file_name: file.file_name,
          content_type: file.content_type,
          file_size: file.file_size,
          is_internal: isInternal,
        })),
      )
      .select('*');

    if (error) throw error;
    return data;
  } catch (error) {
    if (uploadedFiles.length > 0) {
      await supabase.storage
        .from(TICKET_ATTACHMENTS_BUCKET)
        .remove(uploadedFiles.map((file) => file.file_path));
    }

    throw error;
  }
}

// Fetch all tickets (admin sees all, client sees own)
export function useTickets() {
  return useQuery({
    queryKey: ['tickets'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('support_tickets')
        .select('*')
        .order('created_at', { ascending: false });
      
      if (error) throw error;
      return data as SupportTicket[];
    }
  });
}

// Fetch single ticket
export function useTicket(id: string) {
  return useQuery({
    queryKey: ['tickets', id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('support_tickets')
        .select('*')
        .eq('id', id)
        .maybeSingle();
      
      if (error) throw error;
      return data as SupportTicket | null;
    },
    enabled: !!id
  });
}

// Fetch ticket messages
export function useTicketMessages(ticketId: string) {
  return useQuery({
    queryKey: ['ticket-messages', ticketId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('ticket_messages')
        .select('*')
        .eq('ticket_id', ticketId)
        .order('created_at', { ascending: true });
      
      if (error) throw error;
      return data as TicketMessage[];
    },
    enabled: !!ticketId
  });
}

// Fetch ticket image attachments
export function useTicketAttachments(ticketId: string) {
  return useQuery({
    queryKey: ['ticket-attachments', ticketId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('ticket_attachments')
        .select('*')
        .eq('ticket_id', ticketId)
        .order('created_at', { ascending: true });

      if (error) throw error;

      const attachments = await Promise.all(
        (data || []).map(async (attachment) => ({
          ...(attachment as TicketAttachment),
          signed_url: await getTicketAttachmentUrl(attachment.file_path),
        })),
      );

      return attachments;
    },
    enabled: !!ticketId
  });
}

// Add images directly to an existing ticket
export function useAddTicketAttachments() {
  const queryClient = useQueryClient();
  const { user } = useAuth();

  return useMutation({
    mutationFn: async ({ ticketId, images, isInternal = false }: {
      ticketId: string;
      images: File[];
      isInternal?: boolean;
    }) => {
      if (!user?.id) throw new Error('Debes iniciar sesión');
      if (images.length === 0) return [];

      return createTicketImageAttachments({
        ticketId,
        files: images,
        userId: user.id,
        isInternal,
      });
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['ticket-attachments', variables.ticketId] });
    }
  });
}

// Create ticket
export function useCreateTicket() {
  const queryClient = useQueryClient();
  const { user } = useAuth();
  
  return useMutation({
    mutationFn: async (ticket: {
      subject: string;
      description?: string;
      category?: TicketCategory;
      priority?: TicketPriority;
      project_id?: string;
      images?: File[];
    }) => {
      if (!user?.id) throw new Error('Debes iniciar sesión');

      const { images = [], ...ticketPayload } = ticket;

      const { data, error } = await supabase
        .from('support_tickets')
        .insert({
          ...ticketPayload,
          created_by: user.id
        })
        .select()
        .single();
      
      if (error) throw error;

      await createTicketImageAttachments({
        ticketId: data.id,
        files: images,
        userId: user.id,
        isInternal: false,
      });

      return data;
    },
    onSuccess: async (data) => {
      queryClient.invalidateQueries({ queryKey: ['tickets'] });
      queryClient.invalidateQueries({ queryKey: ['ticket-attachments', data.id] });
      
      // Trigger notifications (push + in-app)
      try {
        await supabase.functions.invoke('notify-ticket', {
          body: { ticketId: data.id, type: 'new_ticket' },
        });
      } catch (e) {
        console.error('Notification trigger failed:', e);
      }
    }
  });
}

// Update ticket (admin)
export function useUpdateTicket() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async ({ ticketId, updates }: {
      ticketId: string;
      updates: Partial<Pick<SupportTicket, 'status' | 'priority' | 'assigned_to' | 'first_response_at' | 'resolved_at' | 'converted_task_id'>>;
    }) => {
      const { data, error } = await supabase
        .from('support_tickets')
        .update(updates)
        .eq('id', ticketId)
        .select()
        .single();
      
      if (error) throw error;
      return data;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['tickets'] });
      queryClient.invalidateQueries({ queryKey: ['tickets', variables.ticketId] });
    }
  });
}

// Add message to ticket
export function useAddTicketMessage() {
  const queryClient = useQueryClient();
  const { user } = useAuth();
  
  return useMutation({
    mutationFn: async ({ ticketId, content, isInternal = false, attachments = [] }: {
      ticketId: string;
      content: string;
      isInternal?: boolean;
      attachments?: File[];
    }) => {
      if (!user?.id) throw new Error('Debes iniciar sesión');

      const normalizedContent = content.trim() || (attachments.length > 1 ? 'Imágenes adjuntas' : 'Imagen adjunta');

      const { data, error } = await supabase
        .from('ticket_messages')
        .insert({
          ticket_id: ticketId,
          author_id: user.id,
          content: normalizedContent,
          is_internal: isInternal
        })
        .select()
        .single();
      
      if (error) throw error;

      await createTicketImageAttachments({
        ticketId,
        messageId: data.id,
        files: attachments,
        userId: user.id,
        isInternal,
      });

      return data;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['ticket-messages', variables.ticketId] });
      queryClient.invalidateQueries({ queryKey: ['ticket-attachments', variables.ticketId] });
    }
  });
}

export function useConvertTicketToTask() {
  const queryClient = useQueryClient();
  const { user } = useAuth();

  return useMutation({
    mutationFn: async ({
      ticket,
      status = 'backlog',
      scheduledDate,
      scheduledTime,
      scheduledEndTime,
    }: {
      ticket: SupportTicket;
      status?: 'backlog' | 'in-progress' | 'review' | 'done';
      scheduledDate?: string | null;
      scheduledTime?: string | null;
      scheduledEndTime?: string | null;
    }) => {
      if (ticket.converted_task_id) {
        throw new Error('Este ticket ya fue convertido en tarea');
      }

      const descriptionParts = [
        ticket.description || 'Sin descripción',
        '',
        `Origen: ticket de soporte #${ticket.id}`,
        `Categoría: ${ticket.category}`,
        `Prioridad: ${ticket.priority}`,
      ];

      const { data: task, error: taskError } = await supabase
        .from('tasks')
        .insert({
          title: `[Ticket] ${ticket.subject}`,
          description: descriptionParts.join('\n'),
          project_id: ticket.project_id,
          status,
          assignee_id: ticket.assigned_to,
          source_ticket_id: ticket.id,
          scheduled_date: scheduledDate || null,
          scheduled_time: scheduledTime || null,
          scheduled_end_time: scheduledEndTime || null,
          is_client_visible: false,
          client_input_required: false,
        })
        .select()
        .single();

      if (taskError) throw taskError;

      if (ticket.assigned_to) {
        const { error: assigneeError } = await supabase
          .from('task_assignees')
          .insert({
            task_id: task.id,
            user_id: ticket.assigned_to,
          });

        if (assigneeError) throw assigneeError;
      }

      const { error: ticketError } = await supabase
        .from('support_tickets')
        .update({
          converted_task_id: task.id,
          status: ticket.status === 'open' ? 'in_progress' : ticket.status,
        })
        .eq('id', ticket.id);

      if (ticketError) throw ticketError;

      await supabase.from('ticket_messages').insert({
        ticket_id: ticket.id,
        author_id: user?.id || ticket.created_by,
        content: `Ticket convertido en tarea: ${task.title}`,
        is_internal: true,
      });

      return task;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['tickets'] });
      queryClient.invalidateQueries({ queryKey: ['tickets', variables.ticket.id] });
      queryClient.invalidateQueries({ queryKey: ['ticket-messages', variables.ticket.id] });
      queryClient.invalidateQueries({ queryKey: ['tasks'] });
      queryClient.invalidateQueries({ queryKey: ['task-assignees'] });
      queryClient.invalidateQueries({ queryKey: ['tasks-assignees'] });
    }
  });
}

// Ticket stats for dashboard
export function useTicketStats() {
  return useQuery({
    queryKey: ['ticket-stats'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('support_tickets')
        .select('status, priority');
      
      if (error) throw error;
      
      const tickets = data as Pick<SupportTicket, 'status' | 'priority'>[];
      
      return {
        total: tickets.length,
        open: tickets.filter(t => t.status === 'open').length,
        inProgress: tickets.filter(t => t.status === 'in_progress').length,
        waitingResponse: tickets.filter(t => t.status === 'waiting_response').length,
        resolved: tickets.filter(t => t.status === 'resolved').length,
        urgent: tickets.filter(t => t.priority === 'urgent' && t.status !== 'closed' && t.status !== 'resolved').length,
      };
    }
  });
}
