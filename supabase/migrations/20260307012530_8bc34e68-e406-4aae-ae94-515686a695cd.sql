
-- Cascade delete function for initiatives
CREATE OR REPLACE FUNCTION public.delete_initiative_cascade(p_initiative_id UUID)
RETURNS void AS $$
BEGIN
  -- Delete PRDs (child of features)
  DELETE FROM public.initiative_prds WHERE feature_id IN (
    SELECT id FROM public.initiative_features WHERE initiative_id = p_initiative_id
  );
  -- Delete features
  DELETE FROM public.initiative_features WHERE initiative_id = p_initiative_id;
  -- Delete screens
  DELETE FROM public.initiative_screens WHERE initiative_id = p_initiative_id;
  -- Delete tech docs
  DELETE FROM public.initiative_tech_docs WHERE initiative_id = p_initiative_id;
  -- Delete briefs
  DELETE FROM public.initiative_briefs WHERE initiative_id = p_initiative_id;
  -- Delete questionnaires
  DELETE FROM public.initiative_questionnaires WHERE initiative_id = p_initiative_id;
  -- Delete the initiative itself
  DELETE FROM public.product_initiatives WHERE id = p_initiative_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Cascade delete function for projects (deletes initiatives + tasks + other children)
CREATE OR REPLACE FUNCTION public.delete_project_cascade(p_project_id UUID)
RETURNS void AS $$
DECLARE
  initiative_rec RECORD;
BEGIN
  -- Delete all initiatives for this project (with their children)
  FOR initiative_rec IN SELECT id FROM public.product_initiatives WHERE project_id = p_project_id
  LOOP
    PERFORM public.delete_initiative_cascade(initiative_rec.id);
  END LOOP;
  
  -- Delete comments on tasks of this project
  DELETE FROM public.comments WHERE task_id IN (
    SELECT id FROM public.tasks WHERE project_id = p_project_id
  );
  -- Delete task checklist items
  DELETE FROM public.task_checklist_items WHERE task_id IN (
    SELECT id FROM public.tasks WHERE project_id = p_project_id
  );
  -- Delete task assignees
  DELETE FROM public.task_assignees WHERE task_id IN (
    SELECT id FROM public.tasks WHERE project_id = p_project_id
  );
  -- Delete activities
  DELETE FROM public.activities WHERE project_id = p_project_id;
  -- Delete tasks
  DELETE FROM public.tasks WHERE project_id = p_project_id;
  -- Delete project members
  DELETE FROM public.project_members WHERE project_id = p_project_id;
  -- Delete project knowledge base
  DELETE FROM public.project_knowledge_base WHERE project_id = p_project_id;
  -- Delete finance records
  DELETE FROM public.finance_records WHERE project_id = p_project_id;
  -- Delete notifications
  DELETE FROM public.notifications WHERE project_id = p_project_id;
  -- Delete support tickets
  DELETE FROM public.support_tickets WHERE project_id = p_project_id;
  -- Delete the project itself
  DELETE FROM public.projects WHERE id = p_project_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
