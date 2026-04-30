CREATE TYPE public.task_priority AS ENUM ('low', 'medium', 'high', 'urgent');

ALTER TABLE public.tasks
ADD COLUMN priority public.task_priority NOT NULL DEFAULT 'medium';

CREATE INDEX IF NOT EXISTS idx_tasks_priority ON public.tasks(priority);
