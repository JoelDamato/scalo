-- Modificar la FK de projects.customer_id para que al eliminar un customer se ponga NULL
ALTER TABLE public.projects
DROP CONSTRAINT IF EXISTS projects_customer_id_fkey;

ALTER TABLE public.projects
ADD CONSTRAINT projects_customer_id_fkey
FOREIGN KEY (customer_id)
REFERENCES public.customers(id)
ON DELETE SET NULL;