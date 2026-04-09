-- Create enums for ticket system
CREATE TYPE public.ticket_category AS ENUM ('bug', 'feature_request', 'question', 'other');
CREATE TYPE public.ticket_priority AS ENUM ('low', 'medium', 'high', 'urgent');
CREATE TYPE public.ticket_status AS ENUM ('open', 'in_progress', 'waiting_response', 'resolved', 'closed');

-- Create support_tickets table
CREATE TABLE public.support_tickets (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  project_id UUID REFERENCES public.projects(id) ON DELETE CASCADE,
  created_by UUID NOT NULL,
  assigned_to UUID,
  category ticket_category NOT NULL DEFAULT 'question',
  priority ticket_priority NOT NULL DEFAULT 'medium',
  status ticket_status NOT NULL DEFAULT 'open',
  subject TEXT NOT NULL,
  description TEXT,
  first_response_at TIMESTAMP WITH TIME ZONE,
  resolved_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create ticket_messages table
CREATE TABLE public.ticket_messages (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  ticket_id UUID NOT NULL REFERENCES public.support_tickets(id) ON DELETE CASCADE,
  author_id UUID NOT NULL,
  content TEXT NOT NULL,
  is_internal BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.support_tickets ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ticket_messages ENABLE ROW LEVEL SECURITY;

-- RLS for support_tickets
CREATE POLICY "Admins can manage all tickets"
ON public.support_tickets FOR ALL
USING (is_admin(auth.uid()));

CREATE POLICY "Users can view their own tickets"
ON public.support_tickets FOR SELECT
USING (auth.uid() = created_by);

CREATE POLICY "Users can create tickets"
ON public.support_tickets FOR INSERT
WITH CHECK (auth.uid() = created_by);

CREATE POLICY "Users can update their own open tickets"
ON public.support_tickets FOR UPDATE
USING (auth.uid() = created_by AND status = 'open');

-- RLS for ticket_messages
CREATE POLICY "Admins can manage all messages"
ON public.ticket_messages FOR ALL
USING (is_admin(auth.uid()));

CREATE POLICY "Users can view non-internal messages on their tickets"
ON public.ticket_messages FOR SELECT
USING (
  is_internal = false AND 
  EXISTS (
    SELECT 1 FROM public.support_tickets 
    WHERE id = ticket_messages.ticket_id 
    AND created_by = auth.uid()
  )
);

CREATE POLICY "Users can add messages to their tickets"
ON public.ticket_messages FOR INSERT
WITH CHECK (
  auth.uid() = author_id AND
  is_internal = false AND
  EXISTS (
    SELECT 1 FROM public.support_tickets 
    WHERE id = ticket_messages.ticket_id 
    AND created_by = auth.uid()
  )
);

-- Triggers for updated_at
CREATE TRIGGER update_support_tickets_updated_at
BEFORE UPDATE ON public.support_tickets
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Index for performance
CREATE INDEX idx_support_tickets_status ON public.support_tickets(status);
CREATE INDEX idx_support_tickets_created_by ON public.support_tickets(created_by);
CREATE INDEX idx_support_tickets_assigned_to ON public.support_tickets(assigned_to);
CREATE INDEX idx_ticket_messages_ticket_id ON public.ticket_messages(ticket_id);