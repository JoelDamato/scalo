CREATE TABLE public.reports (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  title text NOT NULL,
  content text NOT NULL,
  report_date date NOT NULL DEFAULT CURRENT_DATE,
  created_by uuid NOT NULL,
  created_at timestamp with time zone NOT NULL DEFAULT now()
);

ALTER TABLE public.reports ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Internal users can view reports"
ON public.reports
FOR SELECT
TO authenticated
USING (public.is_admin(auth.uid()));

CREATE POLICY "Internal users can create reports"
ON public.reports
FOR INSERT
TO authenticated
WITH CHECK (
  public.is_admin(auth.uid())
  AND created_by = auth.uid()
);
