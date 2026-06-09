CREATE OR REPLACE FUNCTION public.get_public_project_instructions(p_token uuid)
RETURNS TABLE (
  project_id uuid,
  project_name text,
  project_description text,
  instruction_id uuid,
  category text,
  title text,
  description text,
  instruction_url text,
  updated_at timestamptz
)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path TO 'public'
AS $$
  SELECT
    projects.id AS project_id,
    projects.name AS project_name,
    projects.description AS project_description,
    project_instructions.id AS instruction_id,
    project_instructions.category,
    project_instructions.title,
    project_instructions.description,
    project_instructions.instruction_url,
    project_instructions.updated_at
  FROM public.projects
  LEFT JOIN public.project_instructions
    ON project_instructions.project_id = projects.id
  WHERE projects.onboarding_token = p_token
  ORDER BY
    project_instructions.category ASC NULLS LAST,
    project_instructions.updated_at DESC NULLS LAST;
$$;

GRANT EXECUTE ON FUNCTION public.get_public_project_instructions(uuid) TO anon, authenticated;
