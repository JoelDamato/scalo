-- Make project_id nullable for internal/operational tasks
ALTER TABLE public.tasks ALTER COLUMN project_id DROP NOT NULL;

-- Update RLS policy to allow admins to see internal tasks (no project_id)
DROP POLICY IF EXISTS "Admins can do everything with tasks" ON public.tasks;
CREATE POLICY "Admins can do everything with tasks" 
ON public.tasks 
FOR ALL 
USING (is_admin(auth.uid()));

-- Add index for better query performance on internal tasks
CREATE INDEX IF NOT EXISTS idx_tasks_internal ON public.tasks(project_id) WHERE project_id IS NULL;