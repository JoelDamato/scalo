-- Add implementation_plan column to initiative_tech_docs to persist the generated plan
ALTER TABLE public.initiative_tech_docs 
ADD COLUMN implementation_plan TEXT;

-- Add comment for clarity
COMMENT ON COLUMN public.initiative_tech_docs.implementation_plan IS 'AI-generated implementation plan for the initiative';