import { useMemo } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';
import { getExpenseAmountArs, useExpenses } from '@/hooks/useExpenses';
import { useAuth } from '@/hooks/useAuth';
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

export interface FinanceMonthlyOverride {
  id: string;
  month: string;
  revenue_ars: number | null;
  expenses_ars: number | null;
  notes: string | null;
  updated_by: string | null;
  created_at: string;
  updated_at: string;
}

export interface FinanceMonthlySummary {
  month: string;
  calculatedRevenueArs: number;
  calculatedExpensesArs: number;
  revenueArs: number;
  expensesArs: number;
  profitArs: number;
  jotaArs: number;
  tomasArs: number;
  isCurrentMonth: boolean;
  isEdited: boolean;
  override: FinanceMonthlyOverride | null;
}

export function getFinanceRecordAmountArs(record: FinanceRecord) {
  return Number(record.resolved_amount_ars ?? record.amount_ars ?? record.amount);
}

export function getFinanceRecordAmountUsd(record: FinanceRecord) {
  return normalizeFinanceCurrency(record.currency) === 'USD' ? Number(record.amount) : 0;
}

export function getFinanceRecordMonthKey(record: FinanceRecord) {
  return (record.invoice_date || record.created_at).slice(0, 7);
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

export function useFinanceMonthlyOverrides() {
  return useQuery({
    queryKey: ['finance-monthly-overrides'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('finance_monthly_overrides')
        .select('*')
        .order('month', { ascending: false });

      if (error) throw error;
      return (data as FinanceMonthlyOverride[]).map((override) => ({
        ...override,
        revenue_ars: override.revenue_ars === null ? null : Number(override.revenue_ars),
        expenses_ars: override.expenses_ars === null ? null : Number(override.expenses_ars),
      }));
    },
  });
}

export function useUpsertFinanceMonthlyOverride() {
  const queryClient = useQueryClient();
  const { user } = useAuth();

  return useMutation({
    mutationFn: async (override: {
      month: string;
      revenue_ars: number | null;
      expenses_ars: number | null;
      notes?: string | null;
    }) => {
      if (!user?.id) {
        throw new Error('Not authenticated');
      }

      const { data, error } = await supabase
        .from('finance_monthly_overrides')
        .upsert(
          {
            ...override,
            notes: override.notes?.trim() || null,
            updated_by: user.id,
          },
          { onConflict: 'month' },
        )
        .select()
        .single();

      if (error) throw error;
      return data as FinanceMonthlyOverride;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['finance-monthly-overrides'] });
      toast.success('Historial mensual actualizado');
    },
    onError: (error) => {
      toast.error(error instanceof Error ? error.message : 'No se pudo actualizar el historial');
    },
  });
}

export function useDeleteFinanceMonthlyOverride() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (month: string) => {
      const { error } = await supabase
        .from('finance_monthly_overrides')
        .delete()
        .eq('month', month);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['finance-monthly-overrides'] });
      toast.success('Mes restaurado al cálculo automático');
    },
    onError: (error) => {
      toast.error(error instanceof Error ? error.message : 'No se pudo restaurar el mes');
    },
  });
}

export function useFinanceMonthlyHistory() {
  const financeRecordsQuery = useFinanceRecords();
  const expensesQuery = useExpenses();
  const overridesQuery = useFinanceMonthlyOverrides();

  const summaries = useMemo(() => {
    const records = financeRecordsQuery.data ?? [];
    const expenses = expensesQuery.data ?? [];
    const overrides = overridesQuery.data ?? [];
    const currentMonth = getTodayInBuenosAires().slice(0, 7);
    const revenueByMonth = new Map<string, number>();
    const expensesByMonth = new Map<string, number>();
    const overridesByMonth = new Map(overrides.map((override) => [override.month, override]));
    const months = new Set<string>([currentMonth]);

    records
      .filter((record) => record.payment_status === 'paid')
      .forEach((record) => {
        const month = getFinanceRecordMonthKey(record);
        months.add(month);
        revenueByMonth.set(month, (revenueByMonth.get(month) ?? 0) + getFinanceRecordAmountArs(record));
      });

    expenses.forEach((expense) => {
      const month = expense.expense_date.slice(0, 7);
      months.add(month);
      expensesByMonth.set(month, (expensesByMonth.get(month) ?? 0) + getExpenseAmountArs(expense));
    });

    overrides.forEach((override) => months.add(override.month));

    return Array.from(months)
      .sort((a, b) => b.localeCompare(a))
      .map((month) => {
        const calculatedRevenueArs = revenueByMonth.get(month) ?? 0;
        const calculatedExpensesArs = expensesByMonth.get(month) ?? 0;
        const override = overridesByMonth.get(month) ?? null;
        const revenueArs = override?.revenue_ars ?? calculatedRevenueArs;
        const expensesArs = override?.expenses_ars ?? calculatedExpensesArs;
        const profitArs = revenueArs - expensesArs;

        return {
          month,
          calculatedRevenueArs,
          calculatedExpensesArs,
          revenueArs,
          expensesArs,
          profitArs,
          jotaArs: profitArs / 2,
          tomasArs: profitArs / 2,
          isCurrentMonth: month === currentMonth,
          isEdited: Boolean(override),
          override,
        };
      });
  }, [expensesQuery.data, financeRecordsQuery.data, overridesQuery.data]);

  return {
    data: summaries,
    chartData: [...summaries].reverse(),
    isLoading: financeRecordsQuery.isLoading || expensesQuery.isLoading || overridesQuery.isLoading,
  };
}

// Stats
export function useFinanceStats() {
  const { data: records = [] } = useFinanceRecords();
  
  const totalRevenue = records.reduce((sum, r) => sum + getFinanceRecordAmountArs(r), 0);
  const totalRevenueUsd = records.reduce((sum, r) => sum + getFinanceRecordAmountUsd(r), 0);
  const pendingRevenue = records
    .filter(r => r.payment_status === 'pending')
    .reduce((sum, r) => sum + getFinanceRecordAmountArs(r), 0);
  const pendingRevenueUsd = records
    .filter(r => r.payment_status === 'pending')
    .reduce((sum, r) => sum + getFinanceRecordAmountUsd(r), 0);
  const paidRevenue = records
    .filter(r => r.payment_status === 'paid')
    .reduce((sum, r) => sum + getFinanceRecordAmountArs(r), 0);
  const paidRevenueUsd = records
    .filter(r => r.payment_status === 'paid')
    .reduce((sum, r) => sum + getFinanceRecordAmountUsd(r), 0);
  const partialRevenue = records
    .filter(r => r.payment_status === 'partial')
    .reduce((sum, r) => sum + getFinanceRecordAmountArs(r), 0);
  const partialRevenueUsd = records
    .filter(r => r.payment_status === 'partial')
    .reduce((sum, r) => sum + getFinanceRecordAmountUsd(r), 0);
  
  // Monthly breakdown
  const currentMonth = getTodayInBuenosAires().slice(0, 7);
  const monthlyRevenue = records
    .filter(r => getFinanceRecordMonthKey(r) === currentMonth)
    .reduce((sum, r) => sum + getFinanceRecordAmountArs(r), 0);
  const monthlyRevenueUsd = records
    .filter(r => getFinanceRecordMonthKey(r) === currentMonth)
    .reduce((sum, r) => sum + getFinanceRecordAmountUsd(r), 0);
  
  return {
    totalRevenue,
    totalRevenueUsd,
    pendingRevenue,
    pendingRevenueUsd,
    paidRevenue,
    paidRevenueUsd,
    partialRevenue,
    partialRevenueUsd,
    monthlyRevenue,
    monthlyRevenueUsd,
    recordCount: records.length,
  };
}

export function formatFinanceRecordAmount(record: FinanceRecord) {
  return formatFinanceCurrency(Number(record.amount), record.currency);
}
