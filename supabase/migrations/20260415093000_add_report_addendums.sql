CREATE TABLE public.report_addendums (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  report_id uuid NOT NULL REFERENCES public.reports(id) ON DELETE CASCADE,
  author_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  title text,
  content text NOT NULL CHECK (length(btrim(content)) > 0),
  created_at timestamp with time zone NOT NULL DEFAULT now()
);

ALTER TABLE public.report_addendums ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can view report addendums"
ON public.report_addendums
FOR SELECT
TO authenticated
USING (public.has_role(auth.uid(), 'admin'::public.app_role));

CREATE POLICY "Admins can create report addendums"
ON public.report_addendums
FOR INSERT
TO authenticated
WITH CHECK (
  auth.uid() = author_id
  AND public.has_role(auth.uid(), 'admin'::public.app_role)
);

CREATE INDEX idx_report_addendums_report_id_created_at
ON public.report_addendums(report_id, created_at);

CREATE INDEX idx_report_addendums_author_id
ON public.report_addendums(author_id);
