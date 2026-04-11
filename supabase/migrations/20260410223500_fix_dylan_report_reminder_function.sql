DROP FUNCTION IF EXISTS public.send_daily_report_reminder(integer);

CREATE OR REPLACE FUNCTION public.send_daily_report_reminder(p_reminder_hour integer)
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
  IF p_reminder_hour NOT IN (18, 20) THEN
    RAISE EXCEPTION 'Invalid reminder_hour: %', p_reminder_hour;
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
  VALUES (target_user_id, target_report_date, p_reminder_hour)
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
      WHEN p_reminder_hour = 18 THEN 'Recordatorio de reporte diario'
      ELSE 'Segundo recordatorio de reporte diario'
    END,
    CASE
      WHEN p_reminder_hour = 18 THEN 'Dylan, recordá cargar el reporte de hoy antes de terminar el día.'
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
