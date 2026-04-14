CREATE OR REPLACE FUNCTION public.notify_admins_on_report_insert()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  INSERT INTO public.notifications (
    user_id,
    type,
    title,
    message,
    link,
    created_by,
    created_at
  )
  SELECT
    user_roles.user_id,
    'report_created',
    'Nuevo reporte cargado',
    format(
      'Se cargó el reporte "%s" del %s.',
      NEW.title,
      to_char(NEW.report_date, 'DD/MM/YYYY')
    ),
    '/reports?report=' || NEW.id::text,
    NEW.created_by,
    now()
  FROM public.user_roles
  WHERE user_roles.role = 'admin'::public.app_role
    AND NOT EXISTS (
      SELECT 1
      FROM public.notifications existing_notifications
      WHERE existing_notifications.user_id = user_roles.user_id
        AND existing_notifications.type = 'report_created'
        AND existing_notifications.link = '/reports?report=' || NEW.id::text
    );

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS notify_admins_on_report_insert ON public.reports;

CREATE TRIGGER notify_admins_on_report_insert
AFTER INSERT ON public.reports
FOR EACH ROW
EXECUTE FUNCTION public.notify_admins_on_report_insert();

INSERT INTO public.notifications (
  user_id,
  type,
  title,
  message,
  link,
  created_by,
  created_at
)
SELECT
  user_roles.user_id,
  'report_created',
  'Nuevo reporte cargado',
  format(
    'Se cargó el reporte "%s" del %s.',
    reports.title,
    to_char(reports.report_date, 'DD/MM/YYYY')
  ),
  '/reports?report=' || reports.id::text,
  reports.created_by,
  reports.created_at
FROM public.reports
CROSS JOIN public.user_roles
WHERE user_roles.role = 'admin'::public.app_role
  AND NOT EXISTS (
    SELECT 1
    FROM public.notifications existing_notifications
    WHERE existing_notifications.user_id = user_roles.user_id
      AND existing_notifications.type = 'report_created'
      AND existing_notifications.link = '/reports?report=' || reports.id::text
  );
