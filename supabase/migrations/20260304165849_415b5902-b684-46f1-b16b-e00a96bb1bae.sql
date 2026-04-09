
-- Create questionnaire responses table
CREATE TABLE public.initiative_questionnaires (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  initiative_id uuid REFERENCES public.product_initiatives(id) ON DELETE CASCADE NOT NULL,
  responses jsonb DEFAULT '{}'::jsonb,
  is_completed boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(initiative_id)
);

-- Enable RLS
ALTER TABLE public.initiative_questionnaires ENABLE ROW LEVEL SECURITY;

-- Admin full access
CREATE POLICY "Admins can manage all questionnaires"
ON public.initiative_questionnaires FOR ALL TO authenticated
USING (is_admin(auth.uid()));

-- Clients can view their questionnaires
CREATE POLICY "Clients can view questionnaires via customer link"
ON public.initiative_questionnaires FOR SELECT TO authenticated
USING (EXISTS (
  SELECT 1 FROM product_initiatives pi
  JOIN projects p ON p.id = pi.project_id
  JOIN customers c ON c.id = p.customer_id
  WHERE pi.id = initiative_questionnaires.initiative_id
  AND c.user_id = auth.uid()
));

CREATE POLICY "Clients can view their questionnaires"
ON public.initiative_questionnaires FOR SELECT TO authenticated
USING (EXISTS (
  SELECT 1 FROM product_initiatives pi
  JOIN projects p ON p.id = pi.project_id
  WHERE pi.id = initiative_questionnaires.initiative_id
  AND p.client_id = auth.uid()
));
