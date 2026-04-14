CREATE TABLE public.finance_monthly_overrides (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  month text NOT NULL UNIQUE CHECK (month ~ '^[0-9]{4}-[0-9]{2}$'),
  revenue_ars numeric(14, 2),
  expenses_ars numeric(14, 2),
  notes text,
  updated_by uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now()
);

ALTER TABLE public.finance_monthly_overrides ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can view monthly finance overrides"
ON public.finance_monthly_overrides
FOR SELECT
TO authenticated
USING (public.can_access_finance(auth.uid()));

CREATE POLICY "Admins can create monthly finance overrides"
ON public.finance_monthly_overrides
FOR INSERT
TO authenticated
WITH CHECK (public.can_access_finance(auth.uid()));

CREATE POLICY "Admins can update monthly finance overrides"
ON public.finance_monthly_overrides
FOR UPDATE
TO authenticated
USING (public.can_access_finance(auth.uid()))
WITH CHECK (public.can_access_finance(auth.uid()));

CREATE POLICY "Admins can delete monthly finance overrides"
ON public.finance_monthly_overrides
FOR DELETE
TO authenticated
USING (public.can_access_finance(auth.uid()));

CREATE TRIGGER update_finance_monthly_overrides_updated_at
BEFORE UPDATE ON public.finance_monthly_overrides
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();
