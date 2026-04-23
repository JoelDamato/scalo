CREATE EXTENSION IF NOT EXISTS pg_net WITH SCHEMA extensions;
CREATE EXTENSION IF NOT EXISTS pg_cron WITH SCHEMA extensions;

CREATE TABLE IF NOT EXISTS public.whatsapp_integrations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  label text NOT NULL DEFAULT 'Principal',
  evolution_api_url text NOT NULL,
  evolution_api_key text NOT NULL,
  instance_name text NOT NULL,
  instance_token text,
  instance_phone_number text,
  status text NOT NULL DEFAULT 'draft' CHECK (status IN ('draft', 'created', 'connecting', 'connected', 'disconnected', 'error')),
  qr_code text,
  pairing_code text,
  connected_phone text,
  profile_name text,
  last_error text,
  last_synced_at timestamp with time zone,
  created_by uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.whatsapp_reminders (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  integration_id uuid NOT NULL REFERENCES public.whatsapp_integrations(id) ON DELETE CASCADE,
  title text NOT NULL,
  phone_number text NOT NULL,
  message_template text NOT NULL,
  cron_expression text NOT NULL,
  timezone text NOT NULL DEFAULT 'America/Argentina/Buenos_Aires',
  send_delay_ms integer NOT NULL DEFAULT 0 CHECK (send_delay_ms >= 0),
  active boolean NOT NULL DEFAULT true,
  cron_job_name text,
  last_run_at timestamp with time zone,
  last_request_id bigint,
  last_error text,
  created_by uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.whatsapp_reminder_runs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  reminder_id uuid NOT NULL REFERENCES public.whatsapp_reminders(id) ON DELETE CASCADE,
  request_id bigint,
  status text NOT NULL CHECK (status IN ('queued', 'skipped', 'error')),
  detail text,
  created_at timestamp with time zone NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_whatsapp_integrations_created_by
  ON public.whatsapp_integrations(created_by, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_whatsapp_reminders_integration
  ON public.whatsapp_reminders(integration_id, active, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_whatsapp_reminder_runs_reminder
  ON public.whatsapp_reminder_runs(reminder_id, created_at DESC);

ALTER TABLE public.whatsapp_integrations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.whatsapp_reminders ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.whatsapp_reminder_runs ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Admins can manage whatsapp integrations" ON public.whatsapp_integrations;
CREATE POLICY "Admins can manage whatsapp integrations"
ON public.whatsapp_integrations
FOR ALL
TO authenticated
USING (public.is_admin(auth.uid()))
WITH CHECK (public.is_admin(auth.uid()));

DROP POLICY IF EXISTS "Admins can manage whatsapp reminders" ON public.whatsapp_reminders;
CREATE POLICY "Admins can manage whatsapp reminders"
ON public.whatsapp_reminders
FOR ALL
TO authenticated
USING (public.is_admin(auth.uid()))
WITH CHECK (public.is_admin(auth.uid()));

DROP POLICY IF EXISTS "Admins can view whatsapp reminder runs" ON public.whatsapp_reminder_runs;
CREATE POLICY "Admins can view whatsapp reminder runs"
ON public.whatsapp_reminder_runs
FOR SELECT
TO authenticated
USING (public.is_admin(auth.uid()));

CREATE TRIGGER update_whatsapp_integrations_updated_at
  BEFORE UPDATE ON public.whatsapp_integrations
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_whatsapp_reminders_updated_at
  BEFORE UPDATE ON public.whatsapp_reminders
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE OR REPLACE FUNCTION public.unschedule_whatsapp_reminder(p_reminder_id uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, extensions
AS $$
DECLARE
  v_job_name text;
  v_job_id bigint;
BEGIN
  IF auth.uid() IS NOT NULL AND NOT public.is_admin(auth.uid()) THEN
    RAISE EXCEPTION 'Unauthorized';
  END IF;

  v_job_name := format('scalo-whatsapp-reminder-%s', replace(p_reminder_id::text, '-', ''));

  FOR v_job_id IN
    SELECT jobid FROM cron.job WHERE jobname = v_job_name
  LOOP
    PERFORM cron.unschedule(v_job_id);
  END LOOP;

  UPDATE public.whatsapp_reminders
  SET cron_job_name = NULL
  WHERE id = p_reminder_id;
END;
$$;

CREATE OR REPLACE FUNCTION public.dispatch_whatsapp_reminder(p_reminder_id uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, extensions
AS $$
DECLARE
  v_reminder public.whatsapp_reminders%ROWTYPE;
  v_integration public.whatsapp_integrations%ROWTYPE;
  v_request_id bigint;
  v_normalized_number text;
  v_conversation_id uuid;
  v_detail text;
BEGIN
  SELECT *
  INTO v_reminder
  FROM public.whatsapp_reminders
  WHERE id = p_reminder_id;

  IF NOT FOUND THEN
    INSERT INTO public.whatsapp_reminder_runs (reminder_id, status, detail)
    VALUES (p_reminder_id, 'error', 'Recordatorio no encontrado');
    RETURN;
  END IF;

  SELECT *
  INTO v_integration
  FROM public.whatsapp_integrations
  WHERE id = v_reminder.integration_id;

  IF NOT FOUND THEN
    UPDATE public.whatsapp_reminders
    SET last_error = 'La conexion de WhatsApp ya no existe'
    WHERE id = p_reminder_id;

    INSERT INTO public.whatsapp_reminder_runs (reminder_id, status, detail)
    VALUES (p_reminder_id, 'error', 'La conexion de WhatsApp ya no existe');
    RETURN;
  END IF;

  IF NOT v_reminder.active THEN
    INSERT INTO public.whatsapp_reminder_runs (reminder_id, status, detail)
    VALUES (p_reminder_id, 'skipped', 'El recordatorio estaba desactivado');
    RETURN;
  END IF;

  IF v_integration.status <> 'connected' THEN
    UPDATE public.whatsapp_reminders
    SET last_error = 'WhatsApp no esta conectado'
    WHERE id = p_reminder_id;

    INSERT INTO public.whatsapp_reminder_runs (reminder_id, status, detail)
    VALUES (p_reminder_id, 'skipped', 'WhatsApp no esta conectado');
    RETURN;
  END IF;

  v_normalized_number := regexp_replace(COALESCE(v_reminder.phone_number, ''), '[^0-9]', '', 'g');

  IF v_normalized_number = '' THEN
    UPDATE public.whatsapp_reminders
    SET last_error = 'El numero de telefono no es valido'
    WHERE id = p_reminder_id;

    INSERT INTO public.whatsapp_reminder_runs (reminder_id, status, detail)
    VALUES (p_reminder_id, 'error', 'El numero de telefono no es valido');
    RETURN;
  END IF;

  v_request_id := net.http_post(
    url := rtrim(v_integration.evolution_api_url, '/') || '/message/sendText/' || v_integration.instance_name,
    headers := jsonb_build_object(
      'Content-Type', 'application/json',
      'apikey', v_integration.evolution_api_key
    ),
    body := jsonb_build_object(
      'number', v_normalized_number,
      'text', v_reminder.message_template,
      'delay', v_reminder.send_delay_ms
    )
  );

  SELECT id
  INTO v_conversation_id
  FROM public.whatsapp_conversations
  WHERE phone_number = v_normalized_number
  ORDER BY created_at DESC NULLS LAST
  LIMIT 1;

  IF v_conversation_id IS NULL THEN
    INSERT INTO public.whatsapp_conversations (phone_number, contact_name)
    VALUES (v_normalized_number, v_reminder.title)
    RETURNING id INTO v_conversation_id;
  END IF;

  INSERT INTO public.whatsapp_messages (
    conversation_id,
    direction,
    content,
    message_type,
    status,
    sent_by,
    whatsapp_message_id
  )
  VALUES (
    v_conversation_id,
    'outbound',
    v_reminder.message_template,
    'text',
    'pending',
    v_reminder.created_by,
    v_request_id::text
  );

  v_detail := format('Encolado para %s', v_normalized_number);

  UPDATE public.whatsapp_reminders
  SET last_run_at = now(),
      last_request_id = v_request_id,
      last_error = NULL
  WHERE id = p_reminder_id;

  INSERT INTO public.whatsapp_reminder_runs (reminder_id, request_id, status, detail)
  VALUES (p_reminder_id, v_request_id, 'queued', v_detail);
EXCEPTION
  WHEN OTHERS THEN
    UPDATE public.whatsapp_reminders
    SET last_error = SQLERRM
    WHERE id = p_reminder_id;

    INSERT INTO public.whatsapp_reminder_runs (reminder_id, status, detail)
    VALUES (p_reminder_id, 'error', SQLERRM);
END;
$$;

CREATE OR REPLACE FUNCTION public.schedule_whatsapp_reminder(p_reminder_id uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, extensions
AS $$
DECLARE
  v_cron_expression text;
  v_active boolean;
  v_job_name text;
  v_job_id bigint;
BEGIN
  IF auth.uid() IS NOT NULL AND NOT public.is_admin(auth.uid()) THEN
    RAISE EXCEPTION 'Unauthorized';
  END IF;

  SELECT cron_expression, active
  INTO v_cron_expression, v_active
  FROM public.whatsapp_reminders
  WHERE id = p_reminder_id;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Reminder not found';
  END IF;

  v_job_name := format('scalo-whatsapp-reminder-%s', replace(p_reminder_id::text, '-', ''));

  FOR v_job_id IN
    SELECT jobid FROM cron.job WHERE jobname = v_job_name
  LOOP
    PERFORM cron.unschedule(v_job_id);
  END LOOP;

  IF v_active THEN
    PERFORM cron.schedule(
      v_job_name,
      v_cron_expression,
      format($job$SELECT public.dispatch_whatsapp_reminder('%s'::uuid);$job$, p_reminder_id)
    );
  END IF;

  UPDATE public.whatsapp_reminders
  SET cron_job_name = CASE WHEN v_active THEN v_job_name ELSE NULL END
  WHERE id = p_reminder_id;
END;
$$;
