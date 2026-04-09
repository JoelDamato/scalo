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
    }) => {
      const { data, error } = await supabase
        .from('support_tickets')
        .insert({
          ...ticket,
          created_by: user?.id
        })
        .select()
        .single();
      
      if (error) throw error;
      return data;
    },
    onSuccess: async (data) => {
      queryClient.invalidateQueries({ queryKey: ['tickets'] });
      
      // Trigger notifications (n8n email + push + in-app)
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
      updates: Partial<Pick<SupportTicket, 'status' | 'priority' | 'assigned_to' | 'first_response_at' | 'resolved_at'>>;
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
    mutationFn: async ({ ticketId, content, isInternal = false }: {
      ticketId: string;
      content: string;
      isInternal?: boolean;
    }) => {
      const { data, error } = await supabase
        .from('ticket_messages')
        .insert({
          ticket_id: ticketId,
          author_id: user?.id,
          content,
          is_internal: isInternal
        })
        .select()
        .single();
      
      if (error) throw error;
      return data;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['ticket-messages', variables.ticketId] });
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
