ALTER TABLE public.tasks
ADD COLUMN IF NOT EXISTS scheduled_date date,
ADD COLUMN IF NOT EXISTS scheduled_time time,
ADD COLUMN IF NOT EXISTS scheduled_end_time time;

ALTER TABLE public.project_events
ADD COLUMN IF NOT EXISTS event_end_time time;

CREATE TABLE IF NOT EXISTS public.google_calendar_connections (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL UNIQUE REFERENCES auth.users(id) ON DELETE CASCADE,
  google_email text,
  calendar_id text NOT NULL DEFAULT 'primary',
  calendar_summary text,
  access_token text NOT NULL,
  refresh_token text,
  token_expires_at timestamp with time zone,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.google_calendar_oauth_states (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  state text NOT NULL UNIQUE,
  expires_at timestamp with time zone NOT NULL,
  created_at timestamp with time zone NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.google_calendar_syncs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  source_type text NOT NULL CHECK (source_type IN ('task', 'project_event')),
  source_id uuid NOT NULL,
  google_event_id text NOT NULL,
  calendar_id text NOT NULL DEFAULT 'primary',
  synced_at timestamp with time zone NOT NULL DEFAULT now(),
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now(),
  UNIQUE (user_id, source_type, source_id)
);

CREATE INDEX IF NOT EXISTS idx_google_calendar_syncs_user_source
  ON public.google_calendar_syncs(user_id, source_type, source_id);

ALTER TABLE public.google_calendar_connections ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.google_calendar_oauth_states ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.google_calendar_syncs ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view their own google calendar syncs" ON public.google_calendar_syncs;
CREATE POLICY "Users can view their own google calendar syncs"
  ON public.google_calendar_syncs
  FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can manage their own google calendar syncs" ON public.google_calendar_syncs;
CREATE POLICY "Users can manage their own google calendar syncs"
  ON public.google_calendar_syncs
  FOR ALL
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE TRIGGER update_google_calendar_connections_updated_at
  BEFORE UPDATE ON public.google_calendar_connections
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_google_calendar_syncs_updated_at
  BEFORE UPDATE ON public.google_calendar_syncs
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();
