-- Create enum for product types (SOPs)
CREATE TYPE public.product_type AS ENUM ('mvp', 'funnel', 'app');

-- Create enum for initiative steps
CREATE TYPE public.initiative_step AS ENUM ('brief', 'features', 'prd', 'screens', 'tech_docs', 'implementation');

-- Create enum for feature priority (MoSCoW)
CREATE TYPE public.feature_priority AS ENUM ('must', 'should', 'could', 'wont');

-- Create enum for feature complexity
CREATE TYPE public.feature_complexity AS ENUM ('easy', 'medium', 'hard');

-- Product Initiatives table (the main workflow container)
CREATE TABLE public.product_initiatives (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id UUID REFERENCES public.projects(id) ON DELETE CASCADE NOT NULL,
  name TEXT NOT NULL,
  product_type public.product_type NOT NULL DEFAULT 'mvp',
  current_step public.initiative_step NOT NULL DEFAULT 'brief',
  status TEXT NOT NULL DEFAULT 'active',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Initiative Brief (Step 1)
CREATE TABLE public.initiative_briefs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  initiative_id UUID REFERENCES public.product_initiatives(id) ON DELETE CASCADE NOT NULL UNIQUE,
  executive_summary TEXT,
  problem_statement TEXT,
  target_users TEXT,
  existing_solutions TEXT,
  proposed_solution TEXT,
  platform_recommendation TEXT,
  job_to_be_done TEXT,
  product_objectives TEXT,
  key_features TEXT,
  market_analysis TEXT,
  technical_risks TEXT,
  business_model TEXT,
  business_risks TEXT,
  implementation_strategy TEXT,
  success_metrics TEXT,
  is_completed BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Initiative Features (Step 2)
CREATE TABLE public.initiative_features (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  initiative_id UUID REFERENCES public.product_initiatives(id) ON DELETE CASCADE NOT NULL,
  name TEXT NOT NULL,
  description TEXT,
  priority public.feature_priority NOT NULL DEFAULT 'should',
  complexity public.feature_complexity NOT NULL DEFAULT 'medium',
  status TEXT NOT NULL DEFAULT 'pending',
  user_story TEXT,
  acceptance_criteria TEXT[],
  sort_order INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Initiative PRD (Step 3) - Product Requirements Document per feature
CREATE TABLE public.initiative_prds (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  feature_id UUID REFERENCES public.initiative_features(id) ON DELETE CASCADE NOT NULL UNIQUE,
  overview TEXT,
  use_cases JSONB,
  non_functional_requirements TEXT,
  dependencies TEXT,
  edge_cases TEXT,
  acceptance_criteria TEXT,
  design_guidelines TEXT,
  is_completed BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Initiative Screens (Step 4) - User journey and screens
CREATE TABLE public.initiative_screens (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  initiative_id UUID REFERENCES public.product_initiatives(id) ON DELETE CASCADE NOT NULL,
  name TEXT NOT NULL,
  description TEXT,
  screen_type TEXT,
  flow_name TEXT DEFAULT 'happy_path',
  step_order INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Initiative Tech Docs (Step 5)
CREATE TABLE public.initiative_tech_docs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  initiative_id UUID REFERENCES public.product_initiatives(id) ON DELETE CASCADE NOT NULL UNIQUE,
  tech_stack JSONB,
  frontend_guidelines TEXT,
  backend_structure TEXT,
  api_routes JSONB,
  database_schema TEXT,
  authentication TEXT,
  integrations TEXT,
  is_completed BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Enable RLS on all tables
ALTER TABLE public.product_initiatives ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.initiative_briefs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.initiative_features ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.initiative_prds ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.initiative_screens ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.initiative_tech_docs ENABLE ROW LEVEL SECURITY;

-- RLS Policies for product_initiatives
CREATE POLICY "Admins can manage all initiatives"
ON public.product_initiatives FOR ALL TO authenticated
USING (public.is_admin(auth.uid()));

CREATE POLICY "Clients can view their project initiatives"
ON public.product_initiatives FOR SELECT TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.projects p 
    WHERE p.id = project_id 
    AND p.client_id = auth.uid()
  )
);

-- RLS Policies for initiative_briefs
CREATE POLICY "Admins can manage all briefs"
ON public.initiative_briefs FOR ALL TO authenticated
USING (public.is_admin(auth.uid()));

CREATE POLICY "Clients can view their initiative briefs"
ON public.initiative_briefs FOR SELECT TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.product_initiatives pi
    JOIN public.projects p ON p.id = pi.project_id
    WHERE pi.id = initiative_id 
    AND p.client_id = auth.uid()
  )
);

-- RLS Policies for initiative_features
CREATE POLICY "Admins can manage all features"
ON public.initiative_features FOR ALL TO authenticated
USING (public.is_admin(auth.uid()));

CREATE POLICY "Clients can view their initiative features"
ON public.initiative_features FOR SELECT TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.product_initiatives pi
    JOIN public.projects p ON p.id = pi.project_id
    WHERE pi.id = initiative_id 
    AND p.client_id = auth.uid()
  )
);

-- RLS Policies for initiative_prds
CREATE POLICY "Admins can manage all prds"
ON public.initiative_prds FOR ALL TO authenticated
USING (public.is_admin(auth.uid()));

CREATE POLICY "Clients can view their initiative prds"
ON public.initiative_prds FOR SELECT TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.initiative_features f
    JOIN public.product_initiatives pi ON pi.id = f.initiative_id
    JOIN public.projects p ON p.id = pi.project_id
    WHERE f.id = feature_id 
    AND p.client_id = auth.uid()
  )
);

-- RLS Policies for initiative_screens
CREATE POLICY "Admins can manage all screens"
ON public.initiative_screens FOR ALL TO authenticated
USING (public.is_admin(auth.uid()));

CREATE POLICY "Clients can view their initiative screens"
ON public.initiative_screens FOR SELECT TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.product_initiatives pi
    JOIN public.projects p ON p.id = pi.project_id
    WHERE pi.id = initiative_id 
    AND p.client_id = auth.uid()
  )
);

-- RLS Policies for initiative_tech_docs
CREATE POLICY "Admins can manage all tech docs"
ON public.initiative_tech_docs FOR ALL TO authenticated
USING (public.is_admin(auth.uid()));

CREATE POLICY "Clients can view their initiative tech docs"
ON public.initiative_tech_docs FOR SELECT TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.product_initiatives pi
    JOIN public.projects p ON p.id = pi.project_id
    WHERE pi.id = initiative_id 
    AND p.client_id = auth.uid()
  )
);

-- Add triggers for updated_at
CREATE TRIGGER update_product_initiatives_updated_at
  BEFORE UPDATE ON public.product_initiatives
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_initiative_briefs_updated_at
  BEFORE UPDATE ON public.initiative_briefs
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_initiative_features_updated_at
  BEFORE UPDATE ON public.initiative_features
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_initiative_prds_updated_at
  BEFORE UPDATE ON public.initiative_prds
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_initiative_screens_updated_at
  BEFORE UPDATE ON public.initiative_screens
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_initiative_tech_docs_updated_at
  BEFORE UPDATE ON public.initiative_tech_docs
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();