
-- CRM Events (calendar)
CREATE TABLE public.crm_events (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  title text NOT NULL,
  description text,
  event_date date NOT NULL,
  event_time time without time zone,
  end_time time without time zone,
  event_type text NOT NULL DEFAULT 'meeting',
  created_by uuid NOT NULL,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now()
);

ALTER TABLE public.crm_events ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can manage all crm events"
ON public.crm_events FOR ALL TO authenticated
USING (public.is_admin(auth.uid()));

CREATE POLICY "Authenticated users can view crm events"
ON public.crm_events FOR SELECT TO authenticated
USING (auth.uid() IS NOT NULL);

CREATE TRIGGER update_crm_events_updated_at
BEFORE UPDATE ON public.crm_events
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- CRM Announcements (notes/comunicados)
CREATE TABLE public.crm_announcements (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  title text NOT NULL,
  content text NOT NULL,
  is_pinned boolean NOT NULL DEFAULT false,
  created_by uuid NOT NULL,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now()
);

ALTER TABLE public.crm_announcements ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can manage all announcements"
ON public.crm_announcements FOR ALL TO authenticated
USING (public.is_admin(auth.uid()));

CREATE POLICY "Authenticated users can view announcements"
ON public.crm_announcements FOR SELECT TO authenticated
USING (auth.uid() IS NOT NULL);

CREATE TRIGGER update_crm_announcements_updated_at
BEFORE UPDATE ON public.crm_announcements
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
