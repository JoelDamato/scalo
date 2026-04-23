CREATE TABLE IF NOT EXISTS public.webhook_api_keys (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  token_prefix text NOT NULL,
  token_hash text NOT NULL UNIQUE,
  created_by uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  last_used_at timestamp with time zone,
  revoked_at timestamp with time zone,
  created_at timestamp with time zone NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_webhook_api_keys_created_by
  ON public.webhook_api_keys(created_by, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_webhook_api_keys_active
  ON public.webhook_api_keys(revoked_at, created_at DESC);

ALTER TABLE public.webhook_api_keys ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Admins can manage webhook api keys" ON public.webhook_api_keys;
CREATE POLICY "Admins can manage webhook api keys"
ON public.webhook_api_keys
FOR ALL
TO authenticated
USING (public.is_admin(auth.uid()))
WITH CHECK (public.is_admin(auth.uid()));
