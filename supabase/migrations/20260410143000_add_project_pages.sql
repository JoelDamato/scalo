CREATE TABLE public.project_pages (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id uuid NOT NULL REFERENCES public.projects(id) ON DELETE CASCADE,
  title text NOT NULL,
  page_url text NOT NULL,
  description text,
  created_by uuid REFERENCES auth.users(id),
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now()
);

CREATE INDEX idx_project_pages_project_id
  ON public.project_pages(project_id);

ALTER TABLE public.project_pages ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Project members can view project pages"
  ON public.project_pages
  FOR SELECT
  TO authenticated
  USING (
    public.is_admin(auth.uid())
    OR EXISTS (
      SELECT 1
      FROM public.project_members
      WHERE project_members.project_id = project_pages.project_id
        AND project_members.user_id = auth.uid()
    )
  );

CREATE POLICY "Internal users can manage project pages"
  ON public.project_pages
  FOR ALL
  TO authenticated
  USING (public.is_admin(auth.uid()))
  WITH CHECK (public.is_admin(auth.uid()));

CREATE TRIGGER update_project_pages_updated_at
  BEFORE UPDATE ON public.project_pages
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();
