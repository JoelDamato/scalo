-- Drop existing policies first to avoid conflicts
DROP POLICY IF EXISTS "Users can update own profile" ON public.profiles;
DROP POLICY IF EXISTS "Users can insert own profile" ON public.profiles;

-- Recreate with auth check
CREATE POLICY "Users can update own profile" 
ON public.profiles FOR UPDATE 
USING (auth.uid() IS NOT NULL AND user_id = auth.uid());

CREATE POLICY "Users can insert own profile" 
ON public.profiles FOR INSERT 
WITH CHECK (auth.uid() IS NOT NULL AND user_id = auth.uid());

-- Add DELETE policy for tasks
DROP POLICY IF EXISTS "Admins can delete tasks" ON public.tasks;
CREATE POLICY "Admins can delete tasks" 
ON public.tasks FOR DELETE 
USING (public.is_admin(auth.uid()));

-- Add UPDATE/DELETE policies for projects
DROP POLICY IF EXISTS "Admins can update projects" ON public.projects;
CREATE POLICY "Admins can update projects" 
ON public.projects FOR UPDATE 
USING (public.is_admin(auth.uid()));

DROP POLICY IF EXISTS "Admins can delete projects" ON public.projects;
CREATE POLICY "Admins can delete projects" 
ON public.projects FOR DELETE 
USING (public.is_admin(auth.uid()));