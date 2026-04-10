INSERT INTO public.project_members (project_id, user_id, role)
SELECT
  '72bcb75f-e55e-4724-9334-5d6111e232d0',
  'ec8a3ea4-dfec-4580-be06-1404256ccb73',
  'client'
WHERE EXISTS (
  SELECT 1 FROM public.projects WHERE id = '72bcb75f-e55e-4724-9334-5d6111e232d0'
)
AND EXISTS (
  SELECT 1 FROM auth.users WHERE id = 'ec8a3ea4-dfec-4580-be06-1404256ccb73'
)
AND NOT EXISTS (
  SELECT 1
  FROM public.project_members
  WHERE project_id = '72bcb75f-e55e-4724-9334-5d6111e232d0'
    AND user_id = 'ec8a3ea4-dfec-4580-be06-1404256ccb73'
);
