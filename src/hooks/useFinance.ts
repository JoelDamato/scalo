import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import {
  formatFinanceCurrency,
  getResolvedAmountArs,
  getTodayInBuenosAires,
  normalizeFinanceCurrency,
  resolveCurrencyAmount,
} from '@/lib/finance-currency';

export interface FinanceRecord {
  id: string;
  project_id: string | null;
  description: string;
  amount: number;
  currency: 'ARS' | 'USD';
  amount_ars: number | null;
  exchange_rate: number | null;
  exchange_rate_date: string | null;
  exchange_source: string | null;
  payment_status: 'pending' | 'paid' | 'partial';
  payment_method: string | null;
  internal_notes: string | null;
  invoice_date: string | null;
  created_at: string;
  updated_at: string;
  resolved_amount_ars?: number | null;
  resolved_exchange_rate?: number | null;
  resolved_exchange_rate_date?: string | null;
  resolved_exchange_source?: string | null;
  project?: {
    id: string;
    name: string;
  };
}

export interface ArcaConfig {
  id: string;
  user_id: string;
  cuit: string;
  punto_venta: number;
  tipo_comprobante: string;
  condicion_iva: string;
  api_token_encrypted: string | null;
  environment: 'testing' | 'production';
  enabled: boolean;
  created_at: string;
  updated_at: string;
}

export interface ArcaInvoice {
  id: string;
  finance_record_id: string | null;
  cae: string | null;
  cae_vencimiento: string | null;
  numero_comprobante: number | null;
  punto_venta: number | null;
  tipo_comprobante: string | null;
  importe_total: number | null;
  fecha_emision: string | null;
  cliente_nombre: string | null;
  cliente_cuit_dni: string | null;
  estado: 'draft' | 'emitida' | 'anulada' | 'error';
  error_message: string | null;
  created_at: string;
  updated_at: string;
}

// Finance Records Hooks
export function useFinanceRecords() {
  return useQuery({
    queryKey: ['finance-records'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('finance_records')
        .select(`
          *,
          project:projects(id, name)
        `)
        .order('created_at', { ascending: false });
      
      if (error) throw error;
      const records = (data as FinanceRecord[]).map((record) => ({
        ...record,
        currency: normalizeFinanceCurrency(record.currency),
        amount_ars: record.amount_ars !== null ? Number(record.amount_ars) : null,
        exchange_rate: record.exchange_rate !== null ? Number(record.exchange_rate) : null,
      }));

      return Promise.all(
        records.map(async (record) => {
          const existingAmountArs = getResolvedAmountArs({
            amount: Number(record.amount),
            currency: record.currency,
            amountArs: record.amount_ars,
          });

          if (existingAmountArs !== null) {
            return {
              ...record,
              resolved_amount_ars: existingAmountArs,
              resolved_exchange_rate: record.exchange_rate,
              resolved_exchange_rate_date: record.exchange_rate_date,
              resolved_exchange_source: record.exchange_source,
            };
          }

          try {
            const conversion = await resolveCurrencyAmount({
              amount: Number(record.amount),
              currency: record.currency,
              date: record.invoice_date || record.created_at.slice(0, 10) || getTodayInBuenosAires(),
            });

            return {
              ...record,
              resolved_amount_ars: conversion.amount_ars,
              resolved_exchange_rate: conversion.exchange_rate,
              resolved_exchange_rate_date: conversion.exchange_rate_date,
              resolved_exchange_source: conversion.exchange_source,
            };
          } catch {
            return {
              ...record,
              resolved_amount_ars: null,
              resolved_exchange_rate: null,
              resolved_exchange_rate_date: null,
              resolved_exchange_source: null,
            };
          }
        }),
      );
    },
  });
}

export function useCreateFinanceRecord() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (record: {
      project_id?: string | null;
      description: string;
      amount: number;
      currency?: 'ARS' | 'USD';
      amount_ars?: number | null;
      exchange_rate?: number | null;
      exchange_rate_date?: string | null;
      exchange_source?: string | null;
      payment_status?: string;
      payment_method?: string | null;
      internal_notes?: string | null;
      invoice_date?: string | null;
    }) => {
      const { data, error } = await supabase
        .from('finance_records')
        .insert(record)
        .select()
        .single();
      
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['finance-records'] });
    },
  });
}

export function useUpdateFinanceRecord() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async ({
      id,
      resolved_amount_ars,
      resolved_exchange_rate,
      resolved_exchange_rate_date,
      resolved_exchange_source,
      ...updates
    }: { id: string } & Partial<FinanceRecord>) => {
      const { data, error } = await supabase
        .from('finance_records')
        .update(updates)
        .eq('id', id)
        .select()
        .single();
      
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['finance-records'] });
    },
  });
}

export function useDeleteFinanceRecord() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('finance_records')
        .delete()
        .eq('id', id);
      
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['finance-records'] });
    },
  });
}

// ARCA Config Hooks
export function useArcaConfig() {
  return useQuery({
    queryKey: ['arca-config'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('arca_config')
        .select('*')
        .maybeSingle();
      
      if (error) throw error;
      return data as ArcaConfig | null;
    },
  });
}

export function useSaveArcaConfig() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (config: {
      user_id: string;
      cuit: string;
      punto_venta?: number;
      tipo_comprobante?: string;
      condicion_iva?: string;
      api_token_encrypted?: string | null;
      environment?: string;
      enabled?: boolean;
    }) => {
      // Try to update first, if no rows affected, insert
      const { data: existing } = await supabase
        .from('arca_config')
        .select('id')
        .eq('user_id', config.user_id)
        .maybeSingle();
      
      if (existing) {
        const { data, error } = await supabase
          .from('arca_config')
          .update(config)
          .eq('user_id', config.user_id)
          .select()
          .single();
        
        if (error) throw error;
        return data;
      } else {
        const { data, error } = await supabase
          .from('arca_config')
          .insert(config)
          .select()
          .single();
        
        if (error) throw error;
        return data;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['arca-config'] });
    },
  });
}

// ARCA Invoices Hooks
export function useArcaInvoices() {
  return useQuery({
    queryKey: ['arca-invoices'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('arca_invoices')
        .select('*')
        .order('created_at', { ascending: false });
      
      if (error) throw error;
      return data as ArcaInvoice[];
    },
  });
}

export function useCreateArcaInvoice() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (invoice: Partial<ArcaInvoice>) => {
      const { data, error } = await supabase
        .from('arca_invoices')
        .insert(invoice)
        .select()
        .single();
      
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['arca-invoices'] });
    },
  });
}

// Stats
export function useFinanceStats() {
  const { data: records = [] } = useFinanceRecords();

  const getRecordAmountArs = (record: FinanceRecord) =>
    Number(record.resolved_amount_ars ?? record.amount_ars ?? record.amount);

  const getRecordMonthKey = (record: FinanceRecord) =>
    (record.invoice_date || record.created_at).slice(0, 7);
  
  const totalRevenue = records.reduce((sum, r) => sum + getRecordAmountArs(r), 0);
  const pendingRevenue = records
    .filter(r => r.payment_status === 'pending')
    .reduce((sum, r) => sum + getRecordAmountArs(r), 0);
  const paidRevenue = records
    .filter(r => r.payment_status === 'paid')
    .reduce((sum, r) => sum + getRecordAmountArs(r), 0);
  const partialRevenue = records
    .filter(r => r.payment_status === 'partial')
    .reduce((sum, r) => sum + getRecordAmountArs(r), 0);
  
  // Monthly breakdown
  const currentMonth = getTodayInBuenosAires().slice(0, 7);
  const monthlyRevenue = records
    .filter(r => getRecordMonthKey(r) === currentMonth)
    .reduce((sum, r) => sum + getRecordAmountArs(r), 0);
  
  return {
    totalRevenue,
    pendingRevenue,
    paidRevenue,
    partialRevenue,
    monthlyRevenue,
    recordCount: records.length,
  };
}

export function formatFinanceRecordAmount(record: FinanceRecord) {
  return formatFinanceCurrency(Number(record.amount), record.currency);
}
