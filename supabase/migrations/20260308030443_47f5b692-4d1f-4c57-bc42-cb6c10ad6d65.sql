
CREATE TABLE public.initiative_shares (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  initiative_id uuid NOT NULL REFERENCES public.product_initiatives(id) ON DELETE CASCADE,
  share_token text NOT NULL UNIQUE DEFAULT encode(gen_random_bytes(16), 'hex'),
  created_by uuid NOT NULL,
  is_active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  expires_at timestamptz
);

ALTER TABLE public.initiative_shares ENABLE ROW LEVEL SECURITY;

-- Admins can manage shares
CREATE POLICY "Admins can manage shares"
ON public.initiative_shares
FOR ALL
TO authenticated
USING (public.is_admin(auth.uid()));

-- Anyone can read active shares (for public page via anon key)
CREATE POLICY "Anyone can read active shares"
ON public.initiative_shares
FOR SELECT
TO anon
USING (is_active = true AND (expires_at IS NULL OR expires_at > now()));
