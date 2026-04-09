-- Agregar campos para tracking de leads desde Cal.com
ALTER TABLE public.customers 
ADD COLUMN IF NOT EXISTS booking_id text,
ADD COLUMN IF NOT EXISTS budget text,
ADD COLUMN IF NOT EXISTS project_type text,
ADD COLUMN IF NOT EXISTS urgency text,
ADD COLUMN IF NOT EXISTS ready_to_invest text,
ADD COLUMN IF NOT EXISTS scheduled_call_time timestamp with time zone,
ADD COLUMN IF NOT EXISTS qualified boolean DEFAULT false;

-- Índice para búsqueda por booking_id
CREATE INDEX IF NOT EXISTS idx_customers_booking_id ON public.customers(booking_id);

-- Índice para búsqueda por source
CREATE INDEX IF NOT EXISTS idx_customers_source ON public.customers(source);