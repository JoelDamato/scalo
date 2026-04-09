
-- Allow clients to update questionnaires on their initiatives (via customer link)
CREATE POLICY "Clients can update questionnaires via customer link"
ON public.initiative_questionnaires
FOR UPDATE
TO authenticated
USING (
  EXISTS (
    SELECT 1
    FROM product_initiatives pi
    JOIN projects p ON p.id = pi.project_id
    JOIN customers c ON c.id = p.customer_id
    WHERE pi.id = initiative_questionnaires.initiative_id
    AND c.user_id = auth.uid()
  )
);

-- Allow clients to update questionnaires (via client_id)
CREATE POLICY "Clients can update their questionnaires"
ON public.initiative_questionnaires
FOR UPDATE
TO authenticated
USING (
  EXISTS (
    SELECT 1
    FROM product_initiatives pi
    JOIN projects p ON p.id = pi.project_id
    WHERE pi.id = initiative_questionnaires.initiative_id
    AND p.client_id = auth.uid()
  )
);

-- Allow clients to update briefs on their initiatives (via customer link)
CREATE POLICY "Clients can update briefs via customer link"
ON public.initiative_briefs
FOR UPDATE
TO authenticated
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

-- Allow clients to update briefs (via client_id)
CREATE POLICY "Clients can update their briefs"
ON public.initiative_briefs
FOR UPDATE
TO authenticated
USING (
  EXISTS (
    SELECT 1
    FROM product_initiatives pi
    JOIN projects p ON p.id = pi.project_id
    WHERE pi.id = initiative_briefs.initiative_id
    AND p.client_id = auth.uid()
  )
);

-- Allow members to update questionnaires on their projects
CREATE POLICY "Members can update questionnaires on their projects"
ON public.initiative_questionnaires
FOR UPDATE
TO authenticated
USING (
  EXISTS (
    SELECT 1
    FROM product_initiatives pi
    JOIN project_members pm ON pm.project_id = pi.project_id
    WHERE pi.id = initiative_questionnaires.initiative_id
    AND pm.user_id = auth.uid()
  )
);

-- Allow members to update briefs on their projects
CREATE POLICY "Members can update briefs on their projects"
ON public.initiative_briefs
FOR UPDATE
TO authenticated
USING (
  EXISTS (
    SELECT 1
    FROM product_initiatives pi
    JOIN project_members pm ON pm.project_id = pi.project_id
    WHERE pi.id = initiative_briefs.initiative_id
    AND pm.user_id = auth.uid()
  )
);
