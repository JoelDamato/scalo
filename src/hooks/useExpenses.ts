import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { addMonths, addQuarters, addWeeks, addYears, isValid, startOfDay } from 'date-fns';
import { supabase } from '@/integrations/supabase/client';
import {
  getResolvedAmountArs,
  getTodayInBuenosAires,
  normalizeFinanceCurrency,
  resolveCurrencyAmount,
} from '@/lib/finance-currency';

export type ExpenseCategory = 
  | 'lovable'
  | 'meta_ads'
  | 'google_ads'
  | 'hosting'
  | 'software'
  | 'editor'
  | 'salary'
  | 'freelancer'
  | 'marketing'
  | 'other';

export interface Expense {
  id: string;
  category: ExpenseCategory;
  description: string;
  amount: number;
  currency: string;
  amount_ars: number | null;
  exchange_rate: number | null;
  exchange_rate_date: string | null;
  exchange_source: string | null;
  expense_date: string;
  is_recurring: boolean;
  recurring_interval: string | null;
  receipt_file_name: string | null;
  receipt_path: string | null;
  receipt_url?: string | null;
  resolved_amount_ars?: number | null;
  resolved_exchange_rate?: number | null;
  resolved_exchange_rate_date?: string | null;
  resolved_exchange_source?: string | null;
  vendor_name: string | null;
  notes: string | null;
  created_at: string;
  updated_at: string;
}

export const EXPENSE_RECEIPTS_BUCKET = 'expense-receipts';
export const SALARY_EXPENSE_CATEGORY: ExpenseCategory = 'salary';

export const RECURRING_INTERVALS = ['weekly', 'monthly', 'quarterly', 'yearly'] as const;

export type RecurringInterval = typeof RECURRING_INTERVALS[number];

export const RECURRING_INTERVAL_LABELS: Record<RecurringInterval, string> = {
  weekly: 'Semanal',
  monthly: 'Mensual',
  quarterly: 'Trimestral',
  yearly: 'Anual',
};

export const EXPENSE_CATEGORIES: { value: ExpenseCategory; label: string; icon: string; color: string }[] = [
  { value: 'lovable', label: 'Lovable', icon: '💜', color: 'bg-purple-500/20 text-purple-400 border-purple-500/30' },
  { value: 'meta_ads', label: 'Meta Ads', icon: '📘', color: 'bg-blue-500/20 text-blue-400 border-blue-500/30' },
  { value: 'google_ads', label: 'Google Ads', icon: '🔍', color: 'bg-red-500/20 text-red-400 border-red-500/30' },
  { value: 'hosting', label: 'Hosting', icon: '☁️', color: 'bg-sky-500/20 text-sky-400 border-sky-500/30' },
  { value: 'software', label: 'Software', icon: '💻', color: 'bg-indigo-500/20 text-indigo-400 border-indigo-500/30' },
  { value: 'editor', label: 'Editor', icon: '✂️', color: 'bg-pink-500/20 text-pink-400 border-pink-500/30' },
  { value: 'salary', label: 'Sueldos', icon: '💼', color: 'bg-orange-500/20 text-orange-400 border-orange-500/30' },
  { value: 'freelancer', label: 'Freelancer', icon: '👤', color: 'bg-amber-500/20 text-amber-400 border-amber-500/30' },
  { value: 'marketing', label: 'Marketing', icon: '📣', color: 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30' },
  { value: 'other', label: 'Otro', icon: '📦', color: 'bg-muted text-muted-foreground border-border' },
];

export function getCategoryInfo(category: ExpenseCategory) {
  return EXPENSE_CATEGORIES.find(c => c.value === category) || EXPENSE_CATEGORIES[EXPENSE_CATEGORIES.length - 1];
}

export function isSalaryExpenseCategory(category: ExpenseCategory | string | null | undefined) {
  return category === SALARY_EXPENSE_CATEGORY;
}

export async function getExpenseReceiptUrl(path: string) {
  const { data, error } = await supabase.storage
    .from(EXPENSE_RECEIPTS_BUCKET)
    .createSignedUrl(path, 60 * 60);

  if (error) {
    console.error('Error creating signed URL for expense receipt:', error);
    return null;
  }

  return data.signedUrl;
}

export async function uploadExpenseReceipt(file: File, userId: string) {
  const fileExt = file.name.split('.').pop()?.toLowerCase() || 'bin';
  const fileName = `${userId}/${Date.now()}-${crypto.randomUUID()}.${fileExt}`;

  const { error } = await supabase.storage
    .from(EXPENSE_RECEIPTS_BUCKET)
    .upload(fileName, file, {
      upsert: false,
      contentType: file.type || undefined,
    });

  if (error) {
    throw error;
  }

  return {
    path: fileName,
    fileName: file.name,
  };
}

export async function deleteExpenseReceipt(path: string) {
  const { error } = await supabase.storage
    .from(EXPENSE_RECEIPTS_BUCKET)
    .remove([path]);

  if (error) {
    throw error;
  }
}

function isRecurringInterval(value: string | null | undefined): value is RecurringInterval {
  return RECURRING_INTERVALS.includes(value as RecurringInterval);
}

function parseExpenseDate(expenseDate: string) {
  const parsedDate = startOfDay(new Date(`${expenseDate}T00:00:00`));
  return isValid(parsedDate) ? parsedDate : null;
}

function addRecurringInterval(date: Date, interval: RecurringInterval) {
  switch (interval) {
    case 'weekly':
      return addWeeks(date, 1);
    case 'monthly':
      return addMonths(date, 1);
    case 'quarterly':
      return addQuarters(date, 1);
    case 'yearly':
      return addYears(date, 1);
    default:
      return addMonths(date, 1);
  }
}

export function getRecurringIntervalLabel(interval: string | null | undefined) {
  return isRecurringInterval(interval) ? RECURRING_INTERVAL_LABELS[interval] : 'Recurrente';
}

export function getMonthlyRecurringEstimate(expense: Expense) {
  if (!expense.is_recurring) {
    return 0;
  }

  const amount = Number(expense.amount);
  const interval = isRecurringInterval(expense.recurring_interval) ? expense.recurring_interval : 'monthly';

  switch (interval) {
    case 'weekly':
      return amount * (52 / 12);
    case 'monthly':
      return amount;
    case 'quarterly':
      return amount / 3;
    case 'yearly':
      return amount / 12;
    default:
      return amount;
  }
}

export function getMonthlyRecurringEstimateUsd(expense: Expense) {
  if (!expense.is_recurring || normalizeFinanceCurrency(expense.currency) !== 'USD') {
    return 0;
  }

  return getMonthlyRecurringEstimate(expense);
}

export function getExpenseAmountArs(expense: Expense) {
  return Number(expense.resolved_amount_ars ?? expense.amount_ars ?? expense.amount);
}

export function getExpenseAmountUsd(expense: Expense) {
  return normalizeFinanceCurrency(expense.currency) === 'USD' ? Number(expense.amount) : 0;
}

export function getMonthlyRecurringEstimateArs(expense: Expense) {
  if (!expense.is_recurring) {
    return 0;
  }

  const amount = getExpenseAmountArs(expense);
  const interval = isRecurringInterval(expense.recurring_interval) ? expense.recurring_interval : 'monthly';

  switch (interval) {
    case 'weekly':
      return amount * (52 / 12);
    case 'monthly':
      return amount;
    case 'quarterly':
      return amount / 3;
    case 'yearly':
      return amount / 12;
    default:
      return amount;
  }
}

export function getNextRecurringOccurrence(expense: Expense, referenceDate = new Date()) {
  if (!expense.is_recurring) {
    return null;
  }

  const startDate = parseExpenseDate(expense.expense_date);
  if (!startDate) {
    return null;
  }

  const interval = isRecurringInterval(expense.recurring_interval) ? expense.recurring_interval : 'monthly';
  const targetDate = startOfDay(referenceDate);
  let occurrence = startDate;
  let safetyCounter = 0;

  while (occurrence < targetDate && safetyCounter < 5000) {
    occurrence = addRecurringInterval(occurrence, interval);
    safetyCounter += 1;
  }

  return occurrence;
}

export function useExpenses() {
  return useQuery({
    queryKey: ['expenses'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('expenses')
        .select('*')
        .order('expense_date', { ascending: false });

      if (error) throw error;
      const expenses = (data as Expense[]).map((expense) => ({
        ...expense,
        currency: normalizeFinanceCurrency(expense.currency),
        amount_ars: expense.amount_ars !== null ? Number(expense.amount_ars) : null,
        exchange_rate: expense.exchange_rate !== null ? Number(expense.exchange_rate) : null,
      }));

      return Promise.all(
        expenses.map(async (expense) => {
          const receiptUrl = expense.receipt_path
            ? await getExpenseReceiptUrl(expense.receipt_path)
            : null;

          const existingAmountArs = getResolvedAmountArs({
            amount: Number(expense.amount),
            currency: expense.currency,
            amountArs: expense.amount_ars,
          });

          if (existingAmountArs !== null) {
            return {
              ...expense,
              receipt_url: receiptUrl,
              resolved_amount_ars: existingAmountArs,
              resolved_exchange_rate: expense.exchange_rate,
              resolved_exchange_rate_date: expense.exchange_rate_date,
              resolved_exchange_source: expense.exchange_source,
            };
          }

          try {
            const conversion = await resolveCurrencyAmount({
              amount: Number(expense.amount),
              currency: expense.currency,
              date: expense.expense_date,
            });

            return {
              ...expense,
              receipt_url: receiptUrl,
              resolved_amount_ars: conversion.amount_ars,
              resolved_exchange_rate: conversion.exchange_rate,
              resolved_exchange_rate_date: conversion.exchange_rate_date,
              resolved_exchange_source: conversion.exchange_source,
            };
          } catch {
            return {
              ...expense,
              receipt_url: receiptUrl,
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

export function useCreateExpense() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (expense: Omit<Expense, 'id' | 'created_at' | 'updated_at' | 'receipt_url' | 'resolved_amount_ars' | 'resolved_exchange_rate' | 'resolved_exchange_rate_date' | 'resolved_exchange_source'>) => {
      const { data, error } = await supabase
        .from('expenses')
        .insert(expense)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['expenses'] });
    },
  });
}

export function useUpdateExpense() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, receipt_url, resolved_amount_ars, resolved_exchange_rate, resolved_exchange_rate_date, resolved_exchange_source, ...updates }: Partial<Expense> & { id: string }) => {
      const { data, error } = await supabase
        .from('expenses')
        .update(updates)
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['expenses'] });
    },
  });
}

export function useDeleteExpense() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      const { data: expense, error: fetchError } = await supabase
        .from('expenses')
        .select('receipt_path')
        .eq('id', id)
        .maybeSingle();

      if (fetchError) throw fetchError;

      if (expense?.receipt_path) {
        await deleteExpenseReceipt(expense.receipt_path);
      }

      const { error } = await supabase
        .from('expenses')
        .delete()
        .eq('id', id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['expenses'] });
    },
  });
}

export function useExpenseStats() {
  const { data: expenses = [] } = useExpenses();

  const totalExpenses = expenses.reduce((sum, e) => sum + getExpenseAmountArs(e), 0);
  const totalExpensesUsd = expenses.reduce((sum, e) => sum + getExpenseAmountUsd(e), 0);
  const recurringExpenses = expenses.filter(expense => expense.is_recurring);

  // Group by category
  const byCategory = expenses.reduce((acc, expense) => {
    const cat = expense.category;
    if (!acc[cat]) {
      acc[cat] = { total: 0, count: 0 };
    }
    acc[cat].total += getExpenseAmountArs(expense);
    acc[cat].count += 1;
    return acc;
  }, {} as Record<ExpenseCategory, { total: number; count: number }>);

  // Monthly expenses
  const currentMonth = getTodayInBuenosAires().slice(0, 7);
  const monthlyExpenses = expenses
    .filter(e => e.expense_date.startsWith(currentMonth))
    .reduce((sum, e) => sum + getExpenseAmountArs(e), 0);
  const monthlyExpensesUsd = expenses
    .filter(e => e.expense_date.startsWith(currentMonth))
    .reduce((sum, e) => sum + getExpenseAmountUsd(e), 0);

  // Recurring expenses
  const recurringTotal = expenses
    .filter(e => e.is_recurring)
    .reduce((sum, e) => sum + getExpenseAmountArs(e), 0);
  const recurringTotalUsd = expenses
    .filter(e => e.is_recurring)
    .reduce((sum, e) => sum + getExpenseAmountUsd(e), 0);

  const recurringMonthlyEstimate = recurringExpenses
    .reduce((sum, expense) => sum + getMonthlyRecurringEstimateArs(expense), 0);
  const recurringMonthlyEstimateUsd = recurringExpenses
    .reduce((sum, expense) => sum + getMonthlyRecurringEstimateUsd(expense), 0);

  const nextRecurringExpense = recurringExpenses
    .map(expense => {
      const nextOccurrence = getNextRecurringOccurrence(expense);
      return nextOccurrence ? { expense, nextOccurrence } : null;
    })
    .filter((item): item is { expense: Expense; nextOccurrence: Date } => item !== null)
    .sort((a, b) => a.nextOccurrence.getTime() - b.nextOccurrence.getTime())[0] || null;

  return {
    totalExpenses,
    totalExpensesUsd,
    monthlyExpenses,
    monthlyExpensesUsd,
    recurringTotal,
    recurringTotalUsd,
    recurringMonthlyEstimate,
    recurringMonthlyEstimateUsd,
    recurringCount: recurringExpenses.length,
    nextRecurringExpense,
    byCategory,
    expenseCount: expenses.length,
  };
}
