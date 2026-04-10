CREATE OR REPLACE FUNCTION public.prevent_report_updates()
RETURNS trigger
LANGUAGE plpgsql
AS $$
BEGIN
  RAISE EXCEPTION 'Reports cannot be edited once published';
END;
$$;

CREATE TRIGGER prevent_reports_update
BEFORE UPDATE ON public.reports
FOR EACH ROW
EXECUTE FUNCTION public.prevent_report_updates();
