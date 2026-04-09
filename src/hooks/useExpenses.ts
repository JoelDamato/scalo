import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

export type ExpenseCategory = 
  | 'lovable'
  | 'meta_ads'
  | 'google_ads'
  | 'hosting'
  | 'software'
  | 'editor'
  | 'freelancer'
  | 'marketing'
  | 'other';

export interface Expense {
  id: string;
  category: ExpenseCategory;
  description: string;
  amount: number;
  currency: string;
  expense_date: string;
  is_recurring: boolean;
  recurring_interval: string | null;
  vendor_name: string | null;
  notes: string | null;
  created_at: string;
  updated_at: string;
}

export const EXPENSE_CATEGORIES: { value: ExpenseCategory; label: string; icon: string; color: string }[] = [
  { value: 'lovable', label: 'Lovable', icon: '💜', color: 'bg-purple-500/20 text-purple-400 border-purple-500/30' },
  { value: 'meta_ads', label: 'Meta Ads', icon: '📘', color: 'bg-blue-500/20 text-blue-400 border-blue-500/30' },
  { value: 'google_ads', label: 'Google Ads', icon: '🔍', color: 'bg-red-500/20 text-red-400 border-red-500/30' },
  { value: 'hosting', label: 'Hosting', icon: '☁️', color: 'bg-sky-500/20 text-sky-400 border-sky-500/30' },
  { value: 'software', label: 'Software', icon: '💻', color: 'bg-indigo-500/20 text-indigo-400 border-indigo-500/30' },
  { value: 'editor', label: 'Editor', icon: '✂️', color: 'bg-pink-500/20 text-pink-400 border-pink-500/30' },
  { value: 'freelancer', label: 'Freelancer', icon: '👤', color: 'bg-amber-500/20 text-amber-400 border-amber-500/30' },
  { value: 'marketing', label: 'Marketing', icon: '📣', color: 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30' },
  { value: 'other', label: 'Otro', icon: '📦', color: 'bg-muted text-muted-foreground border-border' },
];

export function getCategoryInfo(category: ExpenseCategory) {
  return EXPENSE_CATEGORIES.find(c => c.value === category) || EXPENSE_CATEGORIES[EXPENSE_CATEGORIES.length - 1];
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
      return data as Expense[];
    },
  });
}

export function useCreateExpense() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (expense: Omit<Expense, 'id' | 'created_at' | 'updated_at'>) => {
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
    mutationFn: async ({ id, ...updates }: Partial<Expense> & { id: string }) => {
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

  const totalExpenses = expenses.reduce((sum, e) => sum + Number(e.amount), 0);

  // Group by category
  const byCategory = expenses.reduce((acc, expense) => {
    const cat = expense.category;
    if (!acc[cat]) {
      acc[cat] = { total: 0, count: 0 };
    }
    acc[cat].total += Number(expense.amount);
    acc[cat].count += 1;
    return acc;
  }, {} as Record<ExpenseCategory, { total: number; count: number }>);

  // Monthly expenses
  const currentMonth = new Date().toISOString().slice(0, 7);
  const monthlyExpenses = expenses
    .filter(e => e.expense_date.startsWith(currentMonth))
    .reduce((sum, e) => sum + Number(e.amount), 0);

  // Recurring expenses
  const recurringTotal = expenses
    .filter(e => e.is_recurring)
    .reduce((sum, e) => sum + Number(e.amount), 0);

  return {
    totalExpenses,
    monthlyExpenses,
    recurringTotal,
    byCategory,
    expenseCount: expenses.length,
  };
}
