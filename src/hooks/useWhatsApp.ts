import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

export interface WhatsAppConversation {
  id: string;
  customer_id: string | null;
  phone_number: string;
  contact_name: string | null;
  last_message_at: string;
  unread_count: number;
  status: 'active' | 'archived';
  created_at: string;
  updated_at: string;
  customer?: {
    id: string;
    name: string;
    company: string | null;
  } | null;
  last_message?: WhatsAppMessage | null;
}

export interface WhatsAppMessage {
  id: string;
  conversation_id: string;
  direction: 'inbound' | 'outbound';
  content: string;
  message_type: 'text' | 'image' | 'audio' | 'document' | 'video';
  media_url: string | null;
  whatsapp_message_id: string | null;
  status: 'pending' | 'sent' | 'delivered' | 'read' | 'failed';
  sent_by: string | null;
  created_at: string;
}

export function useWhatsAppConversations() {
  return useQuery({
    queryKey: ['whatsapp-conversations'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('whatsapp_conversations')
        .select(`
          *,
          customer:customers(id, name, company)
        `)
        .order('last_message_at', { ascending: false });
      
      if (error) throw error;
      return data as WhatsAppConversation[];
    },
  });
}

export function useWhatsAppMessages(conversationId: string | null) {
  return useQuery({
    queryKey: ['whatsapp-messages', conversationId],
    queryFn: async () => {
      if (!conversationId) return [];
      
      const { data, error } = await supabase
        .from('whatsapp_messages')
        .select('*')
        .eq('conversation_id', conversationId)
        .order('created_at', { ascending: true });
      
      if (error) throw error;
      return data as WhatsAppMessage[];
    },
    enabled: !!conversationId,
  });
}

export function useSendWhatsAppMessage() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async ({ conversationId, content }: { conversationId: string; content: string }) => {
      const { data: { user } } = await supabase.auth.getUser();
      
      const { data, error } = await supabase
        .from('whatsapp_messages')
        .insert({
          conversation_id: conversationId,
          direction: 'outbound',
          content,
          message_type: 'text',
          status: 'sent',
          sent_by: user?.id,
        })
        .select()
        .single();
      
      if (error) throw error;
      return data;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['whatsapp-messages', variables.conversationId] });
      queryClient.invalidateQueries({ queryKey: ['whatsapp-conversations'] });
    },
    onError: (error) => {
      toast({
        title: 'Error al enviar mensaje',
        description: error.message,
        variant: 'destructive',
      });
    },
  });
}

export function useMarkConversationRead() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (conversationId: string) => {
      const { error } = await supabase
        .from('whatsapp_conversations')
        .update({ unread_count: 0 })
        .eq('id', conversationId);
      
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['whatsapp-conversations'] });
    },
  });
}

export function useCreateConversation() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async ({ phoneNumber, contactName, customerId }: { 
      phoneNumber: string; 
      contactName?: string;
      customerId?: string;
    }) => {
      const { data, error } = await supabase
        .from('whatsapp_conversations')
        .insert({
          phone_number: phoneNumber,
          contact_name: contactName || null,
          customer_id: customerId || null,
        })
        .select()
        .single();
      
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['whatsapp-conversations'] });
      toast({
        title: 'Conversación creada',
        description: 'Nueva conversación de WhatsApp iniciada',
      });
    },
    onError: (error) => {
      toast({
        title: 'Error',
        description: error.message,
        variant: 'destructive',
      });
    },
  });
}
