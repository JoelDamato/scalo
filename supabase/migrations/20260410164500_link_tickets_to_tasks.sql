ALTER TABLE public.tasks
ADD COLUMN IF NOT EXISTS source_ticket_id uuid REFERENCES public.support_tickets(id) ON DELETE SET NULL;

ALTER TABLE public.support_tickets
ADD COLUMN IF NOT EXISTS converted_task_id uuid REFERENCES public.tasks(id) ON DELETE SET NULL;

CREATE INDEX IF NOT EXISTS idx_tasks_source_ticket_id
  ON public.tasks(source_ticket_id);

CREATE INDEX IF NOT EXISTS idx_support_tickets_converted_task_id
  ON public.support_tickets(converted_task_id);
