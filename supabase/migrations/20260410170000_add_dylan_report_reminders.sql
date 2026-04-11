CREATE EXTENSION IF NOT EXISTS pg_cron WITH SCHEMA extensions;

CREATE TABLE IF NOT EXISTS public.report_reminder_runs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  report_date date NOT NULL,
  reminder_hour integer NOT NULL CHECK (reminder_hour IN (18, 20)),
  notification_id uuid REFERENCES public.notifications(id) ON DELETE SET NULL,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  UNIQUE (user_id, report_date, reminder_hour)
);

CREATE INDEX IF NOT EXISTS idx_report_reminder_runs_user_date
  ON public.report_reminder_runs(user_id, report_date);

ALTER TABLE public.report_reminder_runs ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Internal users can view report reminder runs" ON public.report_reminder_runs;
CREATE POLICY "Internal users can view report reminder runs"
ON public.report_reminder_runs
FOR SELECT
TO authenticated
USING (public.is_admin(auth.uid()));

CREATE OR REPLACE FUNCTION public.send_daily_report_reminder(reminder_hour integer)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  target_user_id uuid;
  target_report_date date := (now() AT TIME ZONE 'America/Argentina/Buenos_Aires')::date;
  has_report boolean;
  run_id uuid;
  created_notification_id uuid;
BEGIN
  IF reminder_hour NOT IN (18, 20) THEN
    RAISE EXCEPTION 'Invalid reminder_hour: %', reminder_hour;
  END IF;

  SELECT profiles.user_id
  INTO target_user_id
  FROM public.profiles
  WHERE lower(profiles.email) = 'dylanmanuel2003@gmail.com'
     OR lower(profiles.name) = 'dylan'
  ORDER BY
    CASE WHEN lower(profiles.email) = 'dylanmanuel2003@gmail.com' THEN 0 ELSE 1 END,
    profiles.created_at ASC
  LIMIT 1;

  IF target_user_id IS NULL THEN
    RETURN;
  END IF;

  SELECT EXISTS (
    SELECT 1
    FROM public.reports
    WHERE reports.created_by = target_user_id
      AND reports.report_date = target_report_date
  )
  INTO has_report;

  IF has_report THEN
    RETURN;
  END IF;

  INSERT INTO public.report_reminder_runs (user_id, report_date, reminder_hour)
  VALUES (target_user_id, target_report_date, reminder_hour)
  ON CONFLICT (user_id, report_date, reminder_hour) DO NOTHING
  RETURNING id INTO run_id;

  IF run_id IS NULL THEN
    RETURN;
  END IF;

  INSERT INTO public.notifications (
    user_id,
    type,
    title,
    message,
    link,
    created_by
  )
  VALUES (
    target_user_id,
    'report_reminder',
    CASE
      WHEN reminder_hour = 18 THEN 'Recordatorio de reporte diario'
      ELSE 'Segundo recordatorio de reporte diario'
    END,
    CASE
      WHEN reminder_hour = 18 THEN 'Dylan, recordá cargar el reporte de hoy antes de terminar el día.'
      ELSE 'Dylan, todavía no cargaste el reporte de hoy. Por favor cargalo ahora.'
    END,
    '/reports',
    NULL
  )
  RETURNING id INTO created_notification_id;

  UPDATE public.report_reminder_runs
  SET notification_id = created_notification_id
  WHERE id = run_id;
END;
$$;

DO $$
BEGIN
  PERFORM cron.unschedule('scalo-dylan-report-reminder-18');
EXCEPTION
  WHEN OTHERS THEN NULL;
END $$;

DO $$
BEGIN
  PERFORM cron.unschedule('scalo-dylan-report-reminder-20');
EXCEPTION
  WHEN OTHERS THEN NULL;
END $$;

SELECT cron.schedule(
  'scalo-dylan-report-reminder-18',
  '0 21 * * *',
  $$SELECT public.send_daily_report_reminder(18);$$
);

SELECT cron.schedule(
  'scalo-dylan-report-reminder-20',
  '0 23 * * *',
  $$SELECT public.send_daily_report_reminder(20);$$
);
