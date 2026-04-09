-- Agregar campo user_id a customers para vincular con usuarios reales
ALTER TABLE public.customers 
ADD COLUMN user_id uuid REFERENCES auth.users(id) ON DELETE SET NULL;

-- Crear índice para búsquedas eficientes
CREATE INDEX idx_customers_user_id ON public.customers(user_id);