
-- Project-level knowledge base for operational data
CREATE TABLE public.project_knowledge_base (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id uuid NOT NULL REFERENCES public.projects(id) ON DELETE CASCADE,
  responses jsonb DEFAULT '{}'::jsonb,
  is_completed boolean NOT NULL DEFAULT false,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now(),
  UNIQUE(project_id)
);

-- Enable RLS
ALTER TABLE public.project_knowledge_base ENABLE ROW LEVEL SECURITY;

-- Admins can do everything
CREATE POLICY "Admins can manage all knowledge bases"
  ON public.project_knowledge_base
  FOR ALL
  TO authenticated
  USING (public.is_admin(auth.uid()));

-- Clients can view their project's knowledge base
CREATE POLICY "Clients can view knowledge base via client_id"
  ON public.project_knowledge_base
  FOR SELECT
  TO authenticated
  USING (EXISTS (
    SELECT 1 FROM projects p
    WHERE p.id = project_knowledge_base.project_id
    AND p.client_id = auth.uid()
  ));

-- Clients can view via customer link
CREATE POLICY "Clients can view knowledge base via customer link"
  ON public.project_knowledge_base
  FOR SELECT
  TO authenticated
  USING (EXISTS (
    SELECT 1 FROM projects p
    JOIN customers c ON c.id = p.customer_id
    WHERE p.id = project_knowledge_base.project_id
    AND c.user_id = auth.uid()
  ));

-- Updated_at trigger
CREATE TRIGGER update_project_knowledge_base_updated_at
  BEFORE UPDATE ON public.project_knowledge_base
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();
