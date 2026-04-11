INSERT INTO storage.buckets (id, name, public)
VALUES ('ticket-attachments', 'ticket-attachments', false)
ON CONFLICT (id) DO NOTHING;

CREATE TABLE IF NOT EXISTS public.ticket_attachments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  ticket_id UUID NOT NULL REFERENCES public.support_tickets(id) ON DELETE CASCADE,
  message_id UUID REFERENCES public.ticket_messages(id) ON DELETE CASCADE,
  uploaded_by UUID NOT NULL,
  file_path TEXT NOT NULL UNIQUE,
  file_name TEXT NOT NULL,
  content_type TEXT NOT NULL CHECK (content_type LIKE 'image/%'),
  file_size BIGINT NOT NULL CHECK (file_size > 0 AND file_size <= 10485760),
  is_internal BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.ticket_attachments ENABLE ROW LEVEL SECURITY;

CREATE INDEX IF NOT EXISTS idx_ticket_attachments_ticket_id
  ON public.ticket_attachments(ticket_id);

CREATE INDEX IF NOT EXISTS idx_ticket_attachments_message_id
  ON public.ticket_attachments(message_id);

CREATE INDEX IF NOT EXISTS idx_ticket_attachments_uploaded_by
  ON public.ticket_attachments(uploaded_by);

DROP POLICY IF EXISTS "Admins can manage all ticket attachments" ON public.ticket_attachments;
DROP POLICY IF EXISTS "Users can view attachments on their tickets" ON public.ticket_attachments;
DROP POLICY IF EXISTS "Users can add attachments to their tickets" ON public.ticket_attachments;

CREATE POLICY "Admins can manage all ticket attachments"
ON public.ticket_attachments FOR ALL
USING (public.is_admin(auth.uid()))
WITH CHECK (public.is_admin(auth.uid()));

CREATE POLICY "Users can view attachments on their tickets"
ON public.ticket_attachments FOR SELECT
USING (
  is_internal = false
  AND EXISTS (
    SELECT 1
    FROM public.support_tickets
    WHERE support_tickets.id = ticket_attachments.ticket_id
      AND support_tickets.created_by = auth.uid()
  )
);

CREATE POLICY "Users can add attachments to their tickets"
ON public.ticket_attachments FOR INSERT
WITH CHECK (
  auth.uid() = uploaded_by
  AND is_internal = false
  AND content_type LIKE 'image/%'
  AND EXISTS (
    SELECT 1
    FROM public.support_tickets
    WHERE support_tickets.id = ticket_attachments.ticket_id
      AND support_tickets.created_by = auth.uid()
  )
  AND (
    message_id IS NULL
    OR EXISTS (
      SELECT 1
      FROM public.ticket_messages
      WHERE ticket_messages.id = ticket_attachments.message_id
        AND ticket_messages.ticket_id = ticket_attachments.ticket_id
        AND ticket_messages.author_id = auth.uid()
        AND ticket_messages.is_internal = false
    )
  )
);

DROP POLICY IF EXISTS "Ticket attachment viewers can read files" ON storage.objects;
DROP POLICY IF EXISTS "Authenticated users can upload ticket files" ON storage.objects;

CREATE POLICY "Ticket attachment viewers can read files"
ON storage.objects FOR SELECT
USING (
  bucket_id = 'ticket-attachments'
  AND (
    public.is_admin(auth.uid())
    OR EXISTS (
      SELECT 1
      FROM public.ticket_attachments
      JOIN public.support_tickets
        ON support_tickets.id = ticket_attachments.ticket_id
      WHERE ticket_attachments.file_path = storage.objects.name
        AND ticket_attachments.is_internal = false
        AND support_tickets.created_by = auth.uid()
    )
  )
);

CREATE POLICY "Authenticated users can upload ticket files"
ON storage.objects FOR INSERT
WITH CHECK (
  bucket_id = 'ticket-attachments'
  AND auth.role() = 'authenticated'
  AND auth.uid()::text = (storage.foldername(name))[1]
);
