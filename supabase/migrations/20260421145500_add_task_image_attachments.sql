INSERT INTO storage.buckets (id, name, public)
VALUES ('task-attachments', 'task-attachments', false)
ON CONFLICT (id) DO NOTHING;

CREATE TABLE IF NOT EXISTS public.task_attachments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  task_id UUID NOT NULL REFERENCES public.tasks(id) ON DELETE CASCADE,
  uploaded_by UUID NOT NULL,
  file_path TEXT NOT NULL UNIQUE,
  file_name TEXT NOT NULL,
  content_type TEXT NOT NULL CHECK (content_type LIKE 'image/%'),
  file_size BIGINT NOT NULL CHECK (file_size > 0 AND file_size <= 10485760),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.task_attachments ENABLE ROW LEVEL SECURITY;

CREATE INDEX IF NOT EXISTS idx_task_attachments_task_id
  ON public.task_attachments(task_id);

CREATE INDEX IF NOT EXISTS idx_task_attachments_uploaded_by
  ON public.task_attachments(uploaded_by);

DROP POLICY IF EXISTS "Users can view attachments on accessible tasks" ON public.task_attachments;
DROP POLICY IF EXISTS "Users can add attachments to accessible tasks" ON public.task_attachments;
DROP POLICY IF EXISTS "Admins can manage all task attachments" ON public.task_attachments;

CREATE POLICY "Admins can manage all task attachments"
ON public.task_attachments FOR ALL
USING (public.is_admin(auth.uid()))
WITH CHECK (public.is_admin(auth.uid()));

CREATE POLICY "Users can view attachments on accessible tasks"
ON public.task_attachments FOR SELECT
USING (
  EXISTS (
    SELECT 1
    FROM public.tasks
    WHERE tasks.id = task_attachments.task_id
  )
);

CREATE POLICY "Users can add attachments to accessible tasks"
ON public.task_attachments FOR INSERT
WITH CHECK (
  auth.uid() = uploaded_by
  AND content_type LIKE 'image/%'
  AND EXISTS (
    SELECT 1
    FROM public.tasks
    WHERE tasks.id = task_attachments.task_id
  )
);

DROP POLICY IF EXISTS "Task attachment viewers can read files" ON storage.objects;
DROP POLICY IF EXISTS "Authenticated users can upload task files" ON storage.objects;

CREATE POLICY "Task attachment viewers can read files"
ON storage.objects FOR SELECT
USING (
  bucket_id = 'task-attachments'
  AND (
    public.is_admin(auth.uid())
    OR EXISTS (
      SELECT 1
      FROM public.task_attachments
      JOIN public.tasks
        ON tasks.id = task_attachments.task_id
      WHERE task_attachments.file_path = storage.objects.name
    )
  )
);

CREATE POLICY "Authenticated users can upload task files"
ON storage.objects FOR INSERT
WITH CHECK (
  bucket_id = 'task-attachments'
  AND auth.role() = 'authenticated'
  AND auth.uid()::text = (storage.foldername(name))[1]
);
