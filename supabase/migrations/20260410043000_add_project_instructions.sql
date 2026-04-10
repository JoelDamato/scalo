CREATE TABLE public.project_instructions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id uuid NOT NULL REFERENCES public.projects(id) ON DELETE CASCADE,
  title text NOT NULL,
  description text NOT NULL,
  instruction_url text,
  created_by uuid REFERENCES auth.users(id),
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now()
);

CREATE INDEX idx_project_instructions_project_id
  ON public.project_instructions(project_id);

ALTER TABLE public.project_instructions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Project members can view project instructions"
  ON public.project_instructions
  FOR SELECT
  TO authenticated
  USING (
    public.is_admin(auth.uid())
    OR EXISTS (
      SELECT 1
      FROM public.project_members
      WHERE project_members.project_id = project_instructions.project_id
        AND project_members.user_id = auth.uid()
    )
  );

CREATE POLICY "Internal users can manage project instructions"
  ON public.project_instructions
  FOR ALL
  TO authenticated
  USING (public.is_admin(auth.uid()))
  WITH CHECK (public.is_admin(auth.uid()));

CREATE TRIGGER update_project_instructions_updated_at
  BEFORE UPDATE ON public.project_instructions
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();
