
-- Sprint status enum
CREATE TYPE public.sprint_status AS ENUM ('planning', 'active', 'review', 'completed');

-- User story status enum
CREATE TYPE public.story_status AS ENUM ('backlog', 'todo', 'in_progress', 'review', 'done');

-- Sprints table
CREATE TABLE public.sprints (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  project_id UUID NOT NULL REFERENCES public.projects(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  goal TEXT,
  start_date DATE NOT NULL DEFAULT CURRENT_DATE,
  end_date DATE NOT NULL DEFAULT (CURRENT_DATE + INTERVAL '14 days'),
  status public.sprint_status NOT NULL DEFAULT 'planning',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- User stories table
CREATE TABLE public.user_stories (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  sprint_id UUID REFERENCES public.sprints(id) ON DELETE SET NULL,
  project_id UUID NOT NULL REFERENCES public.projects(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT,
  acceptance_criteria TEXT[] DEFAULT '{}',
  priority public.feature_priority NOT NULL DEFAULT 'should',
  points INTEGER,
  status public.story_status NOT NULL DEFAULT 'backlog',
  assigned_to UUID,
  is_ai_generated BOOLEAN NOT NULL DEFAULT false,
  source_feature_id UUID REFERENCES public.initiative_features(id) ON DELETE SET NULL,
  is_client_visible BOOLEAN NOT NULL DEFAULT true,
  client_input_required BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Updated_at triggers
CREATE TRIGGER update_sprints_updated_at BEFORE UPDATE ON public.sprints
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_user_stories_updated_at BEFORE UPDATE ON public.user_stories
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Enable RLS
ALTER TABLE public.sprints ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_stories ENABLE ROW LEVEL SECURITY;

-- RLS for sprints
CREATE POLICY "Admins can manage all sprints" ON public.sprints
  FOR ALL TO authenticated USING (public.is_admin(auth.uid()));

CREATE POLICY "Members can view sprints on their projects" ON public.sprints
  FOR SELECT TO authenticated
  USING (EXISTS (
    SELECT 1 FROM public.project_members pm
    WHERE pm.project_id = sprints.project_id AND pm.user_id = auth.uid()
  ));

CREATE POLICY "Clients can view sprints via customer link" ON public.sprints
  FOR SELECT TO authenticated
  USING (EXISTS (
    SELECT 1 FROM public.projects p
    JOIN public.customers c ON c.id = p.customer_id
    WHERE p.id = sprints.project_id AND c.user_id = auth.uid()
  ));

-- RLS for user_stories
CREATE POLICY "Admins can manage all user stories" ON public.user_stories
  FOR ALL TO authenticated USING (public.is_admin(auth.uid()));

CREATE POLICY "Members can view stories on their projects" ON public.user_stories
  FOR SELECT TO authenticated
  USING (EXISTS (
    SELECT 1 FROM public.project_members pm
    WHERE pm.project_id = user_stories.project_id AND pm.user_id = auth.uid()
  ));

CREATE POLICY "Clients can view stories via customer link" ON public.user_stories
  FOR SELECT TO authenticated
  USING (is_client_visible = true AND EXISTS (
    SELECT 1 FROM public.projects p
    JOIN public.customers c ON c.id = p.customer_id
    WHERE p.id = user_stories.project_id AND c.user_id = auth.uid()
  ));

-- Enable realtime
ALTER PUBLICATION supabase_realtime ADD TABLE public.sprints;
ALTER PUBLICATION supabase_realtime ADD TABLE public.user_stories;
