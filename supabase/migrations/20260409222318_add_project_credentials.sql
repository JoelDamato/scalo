CREATE TABLE public.project_credentials (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id uuid NOT NULL REFERENCES public.projects(id) ON DELETE CASCADE,
  tool_name text NOT NULL,
  access_url text,
  username text,
  password text NOT NULL,
  notes text,
  created_by uuid REFERENCES auth.users(id),
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now()
);

CREATE INDEX idx_project_credentials_project_id
  ON public.project_credentials(project_id);

ALTER TABLE public.project_credentials ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Internal users can manage project credentials"
  ON public.project_credentials
  FOR ALL
  TO authenticated
  USING (public.is_admin(auth.uid()))
  WITH CHECK (public.is_admin(auth.uid()));

CREATE TRIGGER update_project_credentials_updated_at
  BEFORE UPDATE ON public.project_credentials
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();
