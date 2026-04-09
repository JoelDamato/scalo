import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

export type CustomerStage = 'lead' | 'prospect' | 'negotiation' | 'client' | 'churned';
export type InteractionType = 'call' | 'email' | 'meeting' | 'note' | 'whatsapp' | 'other';

export interface Customer {
  id: string;
  name: string;
  email: string | null;
  phone: string | null;
  company: string | null;
  stage: CustomerStage;
  source: string | null;
  notes: string | null;
  assigned_to: string | null;
  user_id: string | null;
  created_at: string;
  updated_at: string;
}

export interface Opportunity {
  id: string;
  customer_id: string;
  title: string;
  value: number;
  currency: string;
  stage: CustomerStage;
  probability: number;
  expected_close_date: string | null;
  notes: string | null;
  won_at: string | null;
  lost_at: string | null;
  lost_reason: string | null;
  created_at: string;
  updated_at: string;
  customer?: Customer;
}

export interface Interaction {
  id: string;
  customer_id: string;
  opportunity_id: string | null;
  type: InteractionType;
  subject: string;
  content: string | null;
  interaction_date: string;
  follow_up_date: string | null;
  created_by: string;
  created_at: string;
}

// ============ CUSTOMERS ============

export function useCustomers() {
  return useQuery({
    queryKey: ['customers'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('customers')
        .select('*')
        .order('created_at', { ascending: false });
      if (error) throw error;
      return data as Customer[];
    },
  });
}

export function useCustomer(id: string) {
  return useQuery({
    queryKey: ['customers', id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('customers')
        .select('*')
        .eq('id', id)
        .single();
      if (error) throw error;
      return data as Customer;
    },
    enabled: !!id,
  });
}

export function useCreateCustomer() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (customer: Omit<Customer, 'id' | 'created_at' | 'updated_at'>) => {
      const { data, error } = await supabase
        .from('customers')
        .insert(customer)
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['customers'] });
    },
  });
}

export function useUpdateCustomer() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, ...updates }: Partial<Customer> & { id: string }) => {
      const { data, error } = await supabase
        .from('customers')
        .update(updates)
        .eq('id', id)
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['customers'] });
    },
  });
}

export function useDeleteCustomer() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('customers')
        .delete()
        .eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['customers'] });
      queryClient.invalidateQueries({ queryKey: ['opportunities'] });
      queryClient.invalidateQueries({ queryKey: ['interactions'] });
    },
  });
}

// ============ OPPORTUNITIES ============

export function useOpportunities(customerId?: string) {
  return useQuery({
    queryKey: ['opportunities', customerId],
    queryFn: async () => {
      let query = supabase
        .from('crm_opportunities')
        .select('*, customer:customers(*)')
        .order('created_at', { ascending: false });
      
      if (customerId) {
        query = query.eq('customer_id', customerId);
      }
      
      const { data, error } = await query;
      if (error) throw error;
      return data as (Opportunity & { customer: Customer })[];
    },
  });
}

export function useCreateOpportunity() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (opportunity: Omit<Opportunity, 'id' | 'created_at' | 'updated_at' | 'customer'>) => {
      const { data, error } = await supabase
        .from('crm_opportunities')
        .insert(opportunity)
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['opportunities'] });
    },
  });
}

export function useUpdateOpportunity() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, ...updates }: Partial<Opportunity> & { id: string }) => {
      const { data, error } = await supabase
        .from('crm_opportunities')
        .update(updates)
        .eq('id', id)
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['opportunities'] });
    },
  });
}

// ============ INTERACTIONS ============

export function useInteractions(customerId?: string) {
  return useQuery({
    queryKey: ['interactions', customerId],
    queryFn: async () => {
      let query = supabase
        .from('crm_interactions')
        .select('*')
        .order('interaction_date', { ascending: false });
      
      if (customerId) {
        query = query.eq('customer_id', customerId);
      }
      
      const { data, error } = await query;
      if (error) throw error;
      return data as Interaction[];
    },
  });
}

export function useCreateInteraction() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (interaction: Omit<Interaction, 'id' | 'created_at'>) => {
      const { data, error } = await supabase
        .from('crm_interactions')
        .insert(interaction)
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['interactions'] });
      queryClient.invalidateQueries({ queryKey: ['interactions', variables.customer_id] });
    },
  });
}

// ============ METRICS ============

export function useCRMMetrics() {
  const { data: customers = [] } = useCustomers();
  const { data: opportunities = [] } = useOpportunities();

  const totalCustomers = customers.length;
  const leadCount = customers.filter(c => c.stage === 'lead').length;
  const prospectCount = customers.filter(c => c.stage === 'prospect').length;
  const clientCount = customers.filter(c => c.stage === 'client').length;
  
  const pipelineValue = opportunities
    .filter(o => !o.won_at && !o.lost_at)
    .reduce((sum, o) => sum + (o.value || 0), 0);
  
  const wonValue = opportunities
    .filter(o => o.won_at)
    .reduce((sum, o) => sum + (o.value || 0), 0);
  
  const conversionRate = totalCustomers > 0 
    ? Math.round((clientCount / totalCustomers) * 100) 
    : 0;

  return {
    totalCustomers,
    leadCount,
    prospectCount,
    clientCount,
    pipelineValue,
    wonValue,
    conversionRate,
  };
}
