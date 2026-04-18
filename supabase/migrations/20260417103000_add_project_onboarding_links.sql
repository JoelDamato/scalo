ALTER TABLE public.projects
ADD COLUMN IF NOT EXISTS onboarding_token uuid NOT NULL DEFAULT gen_random_uuid();

CREATE UNIQUE INDEX IF NOT EXISTS idx_projects_onboarding_token
ON public.projects(onboarding_token);

CREATE OR REPLACE FUNCTION public.get_project_onboarding(p_token uuid)
RETURNS TABLE (
  project_id uuid,
  project_name text,
  project_description text,
  support_active boolean
)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path TO 'public'
AS $$
  SELECT
    projects.id,
    projects.name,
    projects.description,
    projects.support_active
  FROM public.projects
  WHERE projects.onboarding_token = p_token;
$$;

CREATE OR REPLACE FUNCTION public.claim_project_onboarding(p_token uuid)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  target_project_id uuid;
  current_user_id uuid := auth.uid();
BEGIN
  IF current_user_id IS NULL THEN
    RAISE EXCEPTION 'Authentication required';
  END IF;

  SELECT projects.id
  INTO target_project_id
  FROM public.projects
  WHERE projects.onboarding_token = p_token;

  IF target_project_id IS NULL THEN
    RAISE EXCEPTION 'Invalid onboarding link';
  END IF;

  INSERT INTO public.project_members (project_id, user_id, role)
  VALUES (target_project_id, current_user_id, 'client')
  ON CONFLICT (project_id, user_id) DO NOTHING;

  UPDATE public.projects
  SET client_id = COALESCE(client_id, current_user_id)
  WHERE id = target_project_id;

  RETURN target_project_id;
END;
$$;

GRANT EXECUTE ON FUNCTION public.get_project_onboarding(uuid) TO anon, authenticated;
GRANT EXECUTE ON FUNCTION public.claim_project_onboarding(uuid) TO authenticated;
