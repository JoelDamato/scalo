-- Create checklist items table for tasks
CREATE TABLE public.task_checklist_items (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  task_id UUID NOT NULL REFERENCES public.tasks(id) ON DELETE CASCADE,
  content TEXT NOT NULL,
  is_completed BOOLEAN NOT NULL DEFAULT false,
  sort_order INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.task_checklist_items ENABLE ROW LEVEL SECURITY;

-- Admins can manage all checklist items
CREATE POLICY "Admins can manage checklist items"
  ON public.task_checklist_items
  FOR ALL
  USING (is_admin(auth.uid()));

-- Clients can view checklist items on visible tasks they have access to
CREATE POLICY "Clients can view checklist items on visible tasks"
  ON public.task_checklist_items
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM tasks t
      JOIN projects p ON p.id = t.project_id
      WHERE t.id = task_checklist_items.task_id
        AND t.is_client_visible = true
        AND (p.client_id = auth.uid() OR EXISTS (
          SELECT 1 FROM project_members pm WHERE pm.project_id = p.id AND pm.user_id = auth.uid()
        ))
    )
  );

-- Create index for performance
CREATE INDEX idx_task_checklist_items_task_id ON public.task_checklist_items(task_id);

-- Create trigger for updated_at
CREATE TRIGGER update_task_checklist_items_updated_at
  BEFORE UPDATE ON public.task_checklist_items
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();