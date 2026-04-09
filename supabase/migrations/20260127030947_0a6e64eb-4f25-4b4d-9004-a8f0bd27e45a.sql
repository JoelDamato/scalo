-- Create expense categories enum
CREATE TYPE expense_category AS ENUM (
  'lovable',
  'meta_ads', 
  'google_ads',
  'hosting',
  'software',
  'editor',
  'freelancer',
  'marketing',
  'other'
);

-- Create operational expenses table
CREATE TABLE public.expenses (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  category expense_category NOT NULL DEFAULT 'other',
  description TEXT NOT NULL,
  amount NUMERIC(12,2) NOT NULL,
  currency TEXT NOT NULL DEFAULT 'ARS',
  expense_date DATE NOT NULL DEFAULT CURRENT_DATE,
  is_recurring BOOLEAN NOT NULL DEFAULT false,
  recurring_interval TEXT, -- 'monthly', 'yearly', etc
  vendor_name TEXT,
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.expenses ENABLE ROW LEVEL SECURITY;

-- RLS policies - only admins can manage expenses
CREATE POLICY "Admins can view all expenses"
  ON public.expenses FOR SELECT
  USING (public.is_admin(auth.uid()));

CREATE POLICY "Admins can create expenses"
  ON public.expenses FOR INSERT
  WITH CHECK (public.is_admin(auth.uid()));

CREATE POLICY "Admins can update expenses"
  ON public.expenses FOR UPDATE
  USING (public.is_admin(auth.uid()));

CREATE POLICY "Admins can delete expenses"
  ON public.expenses FOR DELETE
  USING (public.is_admin(auth.uid()));

-- Add updated_at trigger
CREATE TRIGGER update_expenses_updated_at
  BEFORE UPDATE ON public.expenses
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();