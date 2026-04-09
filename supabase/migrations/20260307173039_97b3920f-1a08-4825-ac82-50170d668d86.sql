
-- Fix RLS: Allow project_members to view tasks
CREATE POLICY "Members can view visible tasks on their projects"
ON public.tasks FOR SELECT TO authenticated
USING (
  is_client_visible = true AND EXISTS (
    SELECT 1 FROM project_members pm
    WHERE pm.project_id = tasks.project_id AND pm.user_id = auth.uid()
  )
);

-- Fix RLS: Allow project_members to view activities
CREATE POLICY "Members can view activities on their projects"
ON public.activities FOR SELECT TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM project_members pm
    WHERE pm.project_id = activities.project_id AND pm.user_id = auth.uid()
  )
);

-- Fix RLS: Allow project_members to view initiatives
CREATE POLICY "Members can view initiatives on their projects"
ON public.product_initiatives FOR SELECT TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM project_members pm
    WHERE pm.project_id = product_initiatives.project_id AND pm.user_id = auth.uid()
  )
);

-- Fix RLS: Allow project_members to view initiative briefs
CREATE POLICY "Members can view briefs on their projects"
ON public.initiative_briefs FOR SELECT TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM product_initiatives pi
    JOIN project_members pm ON pm.project_id = pi.project_id
    WHERE pi.id = initiative_briefs.initiative_id AND pm.user_id = auth.uid()
  )
);

-- Fix RLS: Allow project_members to view initiative features
CREATE POLICY "Members can view features on their projects"
ON public.initiative_features FOR SELECT TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM product_initiatives pi
    JOIN project_members pm ON pm.project_id = pi.project_id
    WHERE pi.id = initiative_features.initiative_id AND pm.user_id = auth.uid()
  )
);

-- Fix RLS: Allow project_members to view comments on visible tasks
CREATE POLICY "Members can view comments on their project tasks"
ON public.comments FOR SELECT TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM tasks t
    JOIN project_members pm ON pm.project_id = t.project_id
    WHERE t.id = comments.task_id AND t.is_client_visible = true AND pm.user_id = auth.uid()
  )
);

-- Fix RLS: Allow project_members to add comments
CREATE POLICY "Members can add comments on visible tasks"
ON public.comments FOR INSERT TO authenticated
WITH CHECK (
  auth.uid() = author_id AND EXISTS (
    SELECT 1 FROM tasks t
    JOIN project_members pm ON pm.project_id = t.project_id
    WHERE t.id = comments.task_id AND t.is_client_visible = true AND pm.user_id = auth.uid()
  )
);

-- Create project_events table for calendar
CREATE TABLE public.project_events (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  project_id UUID REFERENCES public.projects(id) ON DELETE CASCADE NOT NULL,
  title TEXT NOT NULL,
  description TEXT,
  event_date DATE NOT NULL,
  event_time TIME,
  event_type TEXT NOT NULL DEFAULT 'checkpoint',
  created_by UUID NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.project_events ENABLE ROW LEVEL SECURITY;

-- Admins can manage all events
CREATE POLICY "Admins can manage all events"
ON public.project_events FOR ALL TO authenticated
USING (is_admin(auth.uid()));

-- Project members can view events
CREATE POLICY "Members can view project events"
ON public.project_events FOR SELECT TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM project_members pm
    WHERE pm.project_id = project_events.project_id AND pm.user_id = auth.uid()
  )
);

-- Project members can create events
CREATE POLICY "Members can create project events"
ON public.project_events FOR INSERT TO authenticated
WITH CHECK (
  auth.uid() = created_by AND EXISTS (
    SELECT 1 FROM project_members pm
    WHERE pm.project_id = project_events.project_id AND pm.user_id = auth.uid()
  )
);

-- Project members can update their own events
CREATE POLICY "Members can update own events"
ON public.project_events FOR UPDATE TO authenticated
USING (
  auth.uid() = created_by AND EXISTS (
    SELECT 1 FROM project_members pm
    WHERE pm.project_id = project_events.project_id AND pm.user_id = auth.uid()
  )
);

-- Project members can delete their own events
CREATE POLICY "Members can delete own events"
ON public.project_events FOR DELETE TO authenticated
USING (
  auth.uid() = created_by AND EXISTS (
    SELECT 1 FROM project_members pm
    WHERE pm.project_id = project_events.project_id AND pm.user_id = auth.uid()
  )
);

-- Clients via client_id can view events
CREATE POLICY "Clients can view events via client_id"
ON public.project_events FOR SELECT TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM projects p
    WHERE p.id = project_events.project_id AND p.client_id = auth.uid()
  )
);

-- Clients via customer link can view events
CREATE POLICY "Clients can view events via customer link"
ON public.project_events FOR SELECT TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM projects p
    JOIN customers c ON c.id = p.customer_id
    WHERE p.id = project_events.project_id AND c.user_id = auth.uid()
  )
);

-- Trigger for updated_at
CREATE TRIGGER update_project_events_updated_at
  BEFORE UPDATE ON public.project_events
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();
