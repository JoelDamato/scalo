-- Add new tracking columns for UTM parameters and client type
ALTER TABLE public.customers 
ADD COLUMN IF NOT EXISTS client_type text,
ADD COLUMN IF NOT EXISTS utm_source text,
ADD COLUMN IF NOT EXISTS utm_medium text,
ADD COLUMN IF NOT EXISTS utm_campaign text,
ADD COLUMN IF NOT EXISTS fbclid text;

-- Create index for UTM tracking
CREATE INDEX IF NOT EXISTS idx_customers_utm_source ON public.customers(utm_source);
CREATE INDEX IF NOT EXISTS idx_customers_utm_campaign ON public.customers(utm_campaign);