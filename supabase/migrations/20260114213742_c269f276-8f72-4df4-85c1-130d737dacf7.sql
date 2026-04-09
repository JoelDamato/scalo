-- Create enum for customer stages
CREATE TYPE public.customer_stage AS ENUM ('lead', 'prospect', 'negotiation', 'client', 'churned');

-- Create enum for interaction types
CREATE TYPE public.interaction_type AS ENUM ('call', 'email', 'meeting', 'note', 'whatsapp', 'other');

-- Customers table (the main CRM entity)
CREATE TABLE public.customers (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  email TEXT,
  phone TEXT,
  company TEXT,
  stage customer_stage NOT NULL DEFAULT 'lead',
  source TEXT, -- how they found us
  notes TEXT,
  assigned_to UUID REFERENCES auth.users(id), -- sales rep
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Opportunities / deals table
CREATE TABLE public.crm_opportunities (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  customer_id UUID NOT NULL REFERENCES public.customers(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  value NUMERIC DEFAULT 0,
  currency TEXT DEFAULT 'ARS',
  stage customer_stage NOT NULL DEFAULT 'lead',
  probability INTEGER DEFAULT 50 CHECK (probability >= 0 AND probability <= 100),
  expected_close_date DATE,
  notes TEXT,
  won_at TIMESTAMP WITH TIME ZONE,
  lost_at TIMESTAMP WITH TIME ZONE,
  lost_reason TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Interactions / activity log
CREATE TABLE public.crm_interactions (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  customer_id UUID NOT NULL REFERENCES public.customers(id) ON DELETE CASCADE,
  opportunity_id UUID REFERENCES public.crm_opportunities(id) ON DELETE SET NULL,
  type interaction_type NOT NULL DEFAULT 'note',
  subject TEXT NOT NULL,
  content TEXT,
  interaction_date TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  follow_up_date TIMESTAMP WITH TIME ZONE,
  created_by UUID NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Link customers to projects (when they become clients)
ALTER TABLE public.projects 
ADD COLUMN IF NOT EXISTS customer_id UUID REFERENCES public.customers(id);

-- Enable RLS
ALTER TABLE public.customers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.crm_opportunities ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.crm_interactions ENABLE ROW LEVEL SECURITY;

-- RLS Policies for customers (admin only)
CREATE POLICY "Admins can manage all customers" 
ON public.customers FOR ALL 
USING (is_admin(auth.uid()));

-- RLS Policies for opportunities (admin only)
CREATE POLICY "Admins can manage all opportunities" 
ON public.crm_opportunities FOR ALL 
USING (is_admin(auth.uid()));

-- RLS Policies for interactions (admin only)
CREATE POLICY "Admins can manage all interactions" 
ON public.crm_interactions FOR ALL 
USING (is_admin(auth.uid()));

-- Trigger for updated_at on customers
CREATE TRIGGER update_customers_updated_at
BEFORE UPDATE ON public.customers
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Trigger for updated_at on opportunities
CREATE TRIGGER update_opportunities_updated_at
BEFORE UPDATE ON public.crm_opportunities
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();