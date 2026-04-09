-- Add automation workflow phases to initiative_step enum
ALTER TYPE public.initiative_step ADD VALUE IF NOT EXISTS 'kickoff';
ALTER TYPE public.initiative_step ADD VALUE IF NOT EXISTS 'landing_page';
ALTER TYPE public.initiative_step ADD VALUE IF NOT EXISTS 'chatbot_ia';
ALTER TYPE public.initiative_step ADD VALUE IF NOT EXISTS 'integracion';
ALTER TYPE public.initiative_step ADD VALUE IF NOT EXISTS 'entrega';
ALTER TYPE public.initiative_step ADD VALUE IF NOT EXISTS 'soporte';