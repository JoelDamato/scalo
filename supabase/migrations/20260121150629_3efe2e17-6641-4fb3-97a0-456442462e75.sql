-- Actualizar RLS de projects para que clientes vinculados puedan ver sus proyectos
DROP POLICY IF EXISTS "Clients can view projects via customer link" ON public.projects;
CREATE POLICY "Clients can view projects via customer link"
ON public.projects
FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM public.customers c 
    WHERE c.id = projects.customer_id 
    AND c.user_id = auth.uid()
  )
);

-- Tasks
DROP POLICY IF EXISTS "Clients can view visible tasks via customer link" ON public.tasks;
CREATE POLICY "Clients can view visible tasks via customer link"
ON public.tasks
FOR SELECT
USING (
  (is_client_visible = true) AND 
  EXISTS (
    SELECT 1 
    FROM projects p
    JOIN customers c ON c.id = p.customer_id
    WHERE p.id = tasks.project_id 
    AND c.user_id = auth.uid()
  )
);

-- Activities
DROP POLICY IF EXISTS "Clients can view activities via customer link" ON public.activities;
CREATE POLICY "Clients can view activities via customer link"
ON public.activities
FOR SELECT
USING (
  EXISTS (
    SELECT 1 
    FROM projects p
    JOIN customers c ON c.id = p.customer_id
    WHERE p.id = activities.project_id 
    AND c.user_id = auth.uid()
  )
);

-- Comments SELECT
DROP POLICY IF EXISTS "Clients can view comments via customer link" ON public.comments;
CREATE POLICY "Clients can view comments via customer link"
ON public.comments
FOR SELECT
USING (
  EXISTS (
    SELECT 1 
    FROM tasks t
    JOIN projects p ON p.id = t.project_id
    JOIN customers c ON c.id = p.customer_id
    WHERE t.id = comments.task_id 
    AND t.is_client_visible = true
    AND c.user_id = auth.uid()
  )
);

-- Comments INSERT
DROP POLICY IF EXISTS "Clients can add comments via customer link" ON public.comments;
CREATE POLICY "Clients can add comments via customer link"
ON public.comments
FOR INSERT
WITH CHECK (
  (auth.uid() = author_id) AND 
  EXISTS (
    SELECT 1 
    FROM tasks t
    JOIN projects p ON p.id = t.project_id
    JOIN customers c ON c.id = p.customer_id
    WHERE t.id = comments.task_id 
    AND t.is_client_visible = true
    AND c.user_id = auth.uid()
  )
);

-- Initiatives
DROP POLICY IF EXISTS "Clients can view initiatives via customer link" ON public.product_initiatives;
CREATE POLICY "Clients can view initiatives via customer link"
ON public.product_initiatives
FOR SELECT
USING (
  EXISTS (
    SELECT 1 
    FROM projects p
    JOIN customers c ON c.id = p.customer_id
    WHERE p.id = product_initiatives.project_id 
    AND c.user_id = auth.uid()
  )
);

-- Initiative briefs
DROP POLICY IF EXISTS "Clients can view briefs via customer link" ON public.initiative_briefs;
CREATE POLICY "Clients can view briefs via customer link"
ON public.initiative_briefs
FOR SELECT
USING (
  EXISTS (
    SELECT 1 
    FROM product_initiatives pi
    JOIN projects p ON p.id = pi.project_id
    JOIN customers c ON c.id = p.customer_id
    WHERE pi.id = initiative_briefs.initiative_id 
    AND c.user_id = auth.uid()
  )
);

-- Initiative features
DROP POLICY IF EXISTS "Clients can view features via customer link" ON public.initiative_features;
CREATE POLICY "Clients can view features via customer link"
ON public.initiative_features
FOR SELECT
USING (
  EXISTS (
    SELECT 1 
    FROM product_initiatives pi
    JOIN projects p ON p.id = pi.project_id
    JOIN customers c ON c.id = p.customer_id
    WHERE pi.id = initiative_features.initiative_id 
    AND c.user_id = auth.uid()
  )
);

-- Initiative screens
DROP POLICY IF EXISTS "Clients can view screens via customer link" ON public.initiative_screens;
CREATE POLICY "Clients can view screens via customer link"
ON public.initiative_screens
FOR SELECT
USING (
  EXISTS (
    SELECT 1 
    FROM product_initiatives pi
    JOIN projects p ON p.id = pi.project_id
    JOIN customers c ON c.id = p.customer_id
    WHERE pi.id = initiative_screens.initiative_id 
    AND c.user_id = auth.uid()
  )
);

-- Initiative PRDs
DROP POLICY IF EXISTS "Clients can view prds via customer link" ON public.initiative_prds;
CREATE POLICY "Clients can view prds via customer link"
ON public.initiative_prds
FOR SELECT
USING (
  EXISTS (
    SELECT 1 
    FROM initiative_features f
    JOIN product_initiatives pi ON pi.id = f.initiative_id
    JOIN projects p ON p.id = pi.project_id
    JOIN customers c ON c.id = p.customer_id
    WHERE f.id = initiative_prds.feature_id 
    AND c.user_id = auth.uid()
  )
);

-- Initiative tech docs
DROP POLICY IF EXISTS "Clients can view tech docs via customer link" ON public.initiative_tech_docs;
CREATE POLICY "Clients can view tech docs via customer link"
ON public.initiative_tech_docs
FOR SELECT
USING (
  EXISTS (
    SELECT 1 
    FROM product_initiatives pi
    JOIN projects p ON p.id = pi.project_id
    JOIN customers c ON c.id = p.customer_id
    WHERE pi.id = initiative_tech_docs.initiative_id 
    AND c.user_id = auth.uid()
  )
);