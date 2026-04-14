CREATE POLICY "Members can create self assigned visible tasks"
ON public.tasks
FOR INSERT
TO authenticated
WITH CHECK (
  auth.uid() = assignee_id
  AND is_client_visible = true
  AND project_id IS NOT NULL
  AND EXISTS (
    SELECT 1
    FROM public.project_members
    WHERE project_members.project_id = tasks.project_id
      AND project_members.user_id = auth.uid()
  )
);
