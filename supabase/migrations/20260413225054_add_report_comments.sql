CREATE TABLE public.report_comments (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  report_id uuid NOT NULL REFERENCES public.reports(id) ON DELETE CASCADE,
  author_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  content text NOT NULL CHECK (length(btrim(content)) > 0),
  created_at timestamp with time zone NOT NULL DEFAULT now()
);

ALTER TABLE public.report_comments ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Internal users can view report comments"
ON public.report_comments
FOR SELECT
TO authenticated
USING (public.is_admin(auth.uid()));

CREATE POLICY "Admins can create report comments"
ON public.report_comments
FOR INSERT
TO authenticated
WITH CHECK (
  auth.uid() = author_id
  AND public.has_role(auth.uid(), 'admin'::public.app_role)
);

CREATE INDEX idx_report_comments_report_id_created_at
ON public.report_comments(report_id, created_at);

CREATE INDEX idx_report_comments_author_id
ON public.report_comments(author_id);

CREATE OR REPLACE FUNCTION public.notify_report_author_on_comment_insert()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  target_user_id uuid;
  report_title text;
  author_name text;
BEGIN
  SELECT reports.created_by, reports.title
  INTO target_user_id, report_title
  FROM public.reports
  WHERE reports.id = NEW.report_id;

  IF target_user_id IS NULL OR target_user_id = NEW.author_id THEN
    RETURN NEW;
  END IF;

  SELECT COALESCE(profiles.name, profiles.email, 'Un admin')
  INTO author_name
  FROM public.profiles
  WHERE profiles.user_id = NEW.author_id;

  INSERT INTO public.notifications (
    user_id,
    type,
    title,
    message,
    link,
    created_by,
    created_at
  )
  VALUES (
    target_user_id,
    'report_comment',
    'Comentaron tu reporte',
    format('%s comentó en "%s".', COALESCE(author_name, 'Un admin'), report_title),
    '/reports?report=' || NEW.report_id::text,
    NEW.author_id,
    now()
  );

  RETURN NEW;
END;
$$;

CREATE TRIGGER notify_report_author_on_comment_insert
AFTER INSERT ON public.report_comments
FOR EACH ROW
EXECUTE FUNCTION public.notify_report_author_on_comment_insert();
