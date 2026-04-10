ALTER TYPE public.app_role ADD VALUE IF NOT EXISTS 'dev';

CREATE OR REPLACE FUNCTION public.is_admin(_user_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path TO 'public'
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.user_roles
    WHERE user_id = _user_id
      AND (role = 'admin'::app_role OR role::text = 'dev')
  )
$$;

CREATE OR REPLACE FUNCTION public.can_access_finance(_user_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path TO 'public'
AS $$
  SELECT public.has_role(_user_id, 'admin')
$$;

DROP POLICY IF EXISTS "Admins can view arca config" ON public.arca_config;
DROP POLICY IF EXISTS "Admins can insert arca config" ON public.arca_config;
DROP POLICY IF EXISTS "Admins can update arca config" ON public.arca_config;

CREATE POLICY "Admins can view arca config"
  ON public.arca_config
  FOR SELECT
  USING (public.can_access_finance(auth.uid()));

CREATE POLICY "Admins can insert arca config"
  ON public.arca_config
  FOR INSERT
  WITH CHECK (public.can_access_finance(auth.uid()));

CREATE POLICY "Admins can update arca config"
  ON public.arca_config
  FOR UPDATE
  USING (public.can_access_finance(auth.uid()));

DROP POLICY IF EXISTS "Admins can view arca invoices" ON public.arca_invoices;
DROP POLICY IF EXISTS "Admins can insert arca invoices" ON public.arca_invoices;
DROP POLICY IF EXISTS "Admins can update arca invoices" ON public.arca_invoices;

CREATE POLICY "Admins can view arca invoices"
  ON public.arca_invoices
  FOR SELECT
  USING (public.can_access_finance(auth.uid()));

CREATE POLICY "Admins can insert arca invoices"
  ON public.arca_invoices
  FOR INSERT
  WITH CHECK (public.can_access_finance(auth.uid()));

CREATE POLICY "Admins can update arca invoices"
  ON public.arca_invoices
  FOR UPDATE
  USING (public.can_access_finance(auth.uid()));

DROP POLICY IF EXISTS "Admins can view finance records" ON public.finance_records;
DROP POLICY IF EXISTS "Admins can insert finance records" ON public.finance_records;
DROP POLICY IF EXISTS "Admins can update finance records" ON public.finance_records;
DROP POLICY IF EXISTS "Admins can delete finance records" ON public.finance_records;

CREATE POLICY "Admins can view finance records"
  ON public.finance_records
  FOR SELECT
  USING (public.can_access_finance(auth.uid()));

CREATE POLICY "Admins can insert finance records"
  ON public.finance_records
  FOR INSERT
  WITH CHECK (public.can_access_finance(auth.uid()));

CREATE POLICY "Admins can update finance records"
  ON public.finance_records
  FOR UPDATE
  USING (public.can_access_finance(auth.uid()));

CREATE POLICY "Admins can delete finance records"
  ON public.finance_records
  FOR DELETE
  USING (public.can_access_finance(auth.uid()));

DROP POLICY IF EXISTS "Admins can view all expenses" ON public.expenses;
DROP POLICY IF EXISTS "Admins can create expenses" ON public.expenses;
DROP POLICY IF EXISTS "Admins can update expenses" ON public.expenses;
DROP POLICY IF EXISTS "Admins can delete expenses" ON public.expenses;

CREATE POLICY "Admins can view all expenses"
  ON public.expenses
  FOR SELECT
  USING (public.can_access_finance(auth.uid()));

CREATE POLICY "Admins can create expenses"
  ON public.expenses
  FOR INSERT
  WITH CHECK (public.can_access_finance(auth.uid()));

CREATE POLICY "Admins can update expenses"
  ON public.expenses
  FOR UPDATE
  USING (public.can_access_finance(auth.uid()));

CREATE POLICY "Admins can delete expenses"
  ON public.expenses
  FOR DELETE
  USING (public.can_access_finance(auth.uid()));
