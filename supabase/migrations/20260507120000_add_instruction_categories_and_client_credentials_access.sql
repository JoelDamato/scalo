ALTER TABLE public.project_instructions
ADD COLUMN category text;

CREATE POLICY "Project members can view project credentials"
  ON public.project_credentials
  FOR SELECT
  TO authenticated
  USING (
    public.is_admin(auth.uid())
    OR EXISTS (
      SELECT 1
      FROM public.project_members
      WHERE project_members.project_id = project_credentials.project_id
        AND project_members.user_id = auth.uid()
    )
  );
