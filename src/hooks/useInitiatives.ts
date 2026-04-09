import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

// Types based on database schema
export type ProductType = 'mvp' | 'funnel' | 'app' | 'automation' | 'landing_page';
export type InitiativeStep = 'brief' | 'features' | 'prd' | 'screens' | 'tech_docs' | 'implementation' | 'kickoff' | 'landing_page' | 'chatbot_ia' | 'integracion' | 'entrega' | 'soporte';
export type FeaturePriority = 'must' | 'should' | 'could' | 'wont';
export type FeatureComplexity = 'easy' | 'medium' | 'hard';

export interface ProductInitiative {
  id: string;
  project_id: string;
  name: string;
  product_type: ProductType;
  current_step: InitiativeStep;
  status: string;
  created_at: string;
  updated_at: string;
}

export interface InitiativeBrief {
  id: string;
  initiative_id: string;
  executive_summary: string | null;
  problem_statement: string | null;
  target_users: string | null;
  existing_solutions: string | null;
  proposed_solution: string | null;
  platform_recommendation: string | null;
  job_to_be_done: string | null;
  product_objectives: string | null;
  key_features: string | null;
  market_analysis: string | null;
  technical_risks: string | null;
  business_model: string | null;
  business_risks: string | null;
  implementation_strategy: string | null;
  success_metrics: string | null;
  is_completed: boolean;
  created_at: string;
  updated_at: string;
}

export interface InitiativeFeature {
  id: string;
  initiative_id: string;
  name: string;
  description: string | null;
  priority: FeaturePriority;
  complexity: FeatureComplexity;
  status: string;
  user_story: string | null;
  acceptance_criteria: string[] | null;
  sort_order: number;
  created_at: string;
  updated_at: string;
}

export interface InitiativePRD {
  id: string;
  feature_id: string;
  overview: string | null;
  use_cases: Record<string, unknown> | null;
  non_functional_requirements: string | null;
  dependencies: string | null;
  edge_cases: string | null;
  acceptance_criteria: string | null;
  design_guidelines: string | null;
  is_completed: boolean;
  created_at: string;
  updated_at: string;
}

export interface InitiativeScreen {
  id: string;
  initiative_id: string;
  name: string;
  description: string | null;
  screen_type: string | null;
  flow_name: string | null;
  step_order: number;
  created_at: string;
  updated_at: string;
}

export interface InitiativeTechDocs {
  id: string;
  initiative_id: string;
  tech_stack: unknown | null;
  frontend_guidelines: string | null;
  backend_structure: string | null;
  api_routes: unknown | null;
  database_schema: string | null;
  authentication: string | null;
  integrations: string | null;
  implementation_plan: string | null;
  is_completed: boolean;
  created_at: string;
  updated_at: string;
}

// Steps configuration — varies by product_type
export interface StepConfig {
  step: InitiativeStep;
  title: string;
  description: string;
}

export const DEFAULT_STEPS: StepConfig[] = [
  { step: 'brief', title: 'Discovery', description: 'Mapeo estratégico del producto' },
  { step: 'features', title: 'Features', description: 'Funcionalidades del producto' },
  { step: 'prd', title: 'PRD', description: 'Requisitos detallados' },
  { step: 'screens', title: 'Pantallas', description: 'Flujo y navegación' },
  { step: 'tech_docs', title: 'Tech Docs', description: 'Especificaciones técnicas' },
  { step: 'implementation', title: 'Implementación', description: 'Desarrollo y tareas' },
];

export const AUTOMATION_STEPS: StepConfig[] = [
  { step: 'kickoff', title: 'Kickoff', description: 'Onboarding & Knowledge Base del negocio' },
  { step: 'chatbot_ia', title: 'Chatbot IA', description: 'Asistente IA entrenado en WhatsApp' },
  { step: 'integracion', title: 'Integración', description: 'Conexión con sistema de gestión del cliente' },
  { step: 'entrega', title: 'Entrega', description: 'Capacitación y handoff al cliente' },
  { step: 'soporte', title: 'Soporte', description: 'Mantenimiento y retención 12 meses' },
];

export const LANDING_PAGE_STEPS: StepConfig[] = [
  { step: 'brief', title: 'Discovery', description: 'Análisis del negocio y objetivos' },
  { step: 'features', title: 'Secciones', description: 'Definición de sitemap y secciones' },
  { step: 'screens', title: 'Diseño', description: 'Wireframes y diseño visual' },
  { step: 'implementation', title: 'Desarrollo', description: 'Maquetado y deploy' },
];

export const getStepsForType = (productType: ProductType): StepConfig[] => {
  if (productType === 'automation') return AUTOMATION_STEPS;
  if (productType === 'landing_page') return LANDING_PAGE_STEPS;
  return DEFAULT_STEPS;
};

/** @deprecated Use getStepsForType instead */
export const INITIATIVE_STEPS = DEFAULT_STEPS;

export const getStepIndex = (step: InitiativeStep, productType?: ProductType): number => {
  const steps = productType ? getStepsForType(productType) : DEFAULT_STEPS;
  return steps.findIndex(s => s.step === step);
};

export const getCompletedSteps = (currentStep: InitiativeStep, productType?: ProductType): number => {
  return getStepIndex(currentStep, productType);
};

export const getFirstStep = (productType: ProductType): InitiativeStep => {
  const steps = getStepsForType(productType);
  return steps[0].step;
};

// Hooks
export function useInitiatives(projectId?: string) {
  return useQuery({
    queryKey: ['initiatives', projectId],
    queryFn: async () => {
      let query = supabase
        .from('product_initiatives')
        .select('*')
        .order('created_at', { ascending: false });
      
      if (projectId) {
        query = query.eq('project_id', projectId);
      }
      
      const { data, error } = await query;
      if (error) throw error;
      return data as ProductInitiative[];
    },
  });
}

export function useInitiative(initiativeId?: string) {
  return useQuery({
    queryKey: ['initiative', initiativeId],
    queryFn: async () => {
      if (!initiativeId) return null;
      const { data, error } = await supabase
        .from('product_initiatives')
        .select('*')
        .eq('id', initiativeId)
        .maybeSingle();
      if (error) throw error;
      return data as ProductInitiative | null;
    },
    enabled: !!initiativeId,
  });
}

export function useCreateInitiative() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (data: { project_id: string; name: string; product_type: ProductType }) => {
      const firstStep = getFirstStep(data.product_type);
      const { data: initiative, error } = await supabase
        .from('product_initiatives')
        .insert({ ...data, current_step: firstStep })
        .select()
        .single();
      if (error) throw error;
      
      // Create empty brief and questionnaire for the initiative
      const [briefResult, questionnaireResult] = await Promise.all([
        supabase.from('initiative_briefs').insert({ initiative_id: initiative.id }),
        supabase.from('initiative_questionnaires' as any).insert({ initiative_id: initiative.id }),
      ]);
      if (briefResult.error) throw briefResult.error;
      if (questionnaireResult.error) throw questionnaireResult.error;
      
      return initiative as ProductInitiative;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['initiatives'] });
    },
  });
}

// Questionnaire hooks
export interface InitiativeQuestionnaire {
  id: string;
  initiative_id: string;
  responses: Record<string, any>;
  is_completed: boolean;
  created_at: string;
  updated_at: string;
}

export function useInitiativeQuestionnaire(initiativeId?: string) {
  return useQuery({
    queryKey: ['initiative-questionnaire', initiativeId],
    queryFn: async () => {
      if (!initiativeId) return null;
      const { data, error } = await supabase
        .from('initiative_questionnaires' as any)
        .select('*')
        .eq('initiative_id', initiativeId)
        .maybeSingle();
      if (error) throw error;
      return data as unknown as InitiativeQuestionnaire | null;
    },
    enabled: !!initiativeId,
  });
}

export function useUpdateQuestionnaire() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async ({ initiativeId, responses, isCompleted }: { initiativeId: string; responses: Record<string, any>; isCompleted?: boolean }) => {
      const updateData: any = { responses, updated_at: new Date().toISOString() };
      if (isCompleted !== undefined) updateData.is_completed = isCompleted;
      
      const { error } = await supabase
        .from('initiative_questionnaires' as any)
        .update(updateData)
        .eq('initiative_id', initiativeId);
      if (error) throw error;
    },
    onSuccess: (_, { initiativeId }) => {
      queryClient.invalidateQueries({ queryKey: ['initiative-questionnaire', initiativeId] });
    },
  });
}

export function useUpdateInitiativeName() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async ({ initiativeId, name }: { initiativeId: string; name: string }) => {
      const { error } = await supabase
        .from('product_initiatives')
        .update({ name })
        .eq('id', initiativeId);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['initiative'] });
      queryClient.invalidateQueries({ queryKey: ['initiatives'] });
    },
  });
}

export function useUpdateInitiativeStep() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async ({ initiativeId, step }: { initiativeId: string; step: InitiativeStep }) => {
      const { error } = await supabase
        .from('product_initiatives')
        .update({ current_step: step })
        .eq('id', initiativeId);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['initiative'] });
      queryClient.invalidateQueries({ queryKey: ['initiatives'] });
    },
  });
}

// Brief hooks
export function useInitiativeBrief(initiativeId?: string) {
  return useQuery({
    queryKey: ['initiative-brief', initiativeId],
    queryFn: async () => {
      if (!initiativeId) return null;
      const { data, error } = await supabase
        .from('initiative_briefs')
        .select('*')
        .eq('initiative_id', initiativeId)
        .maybeSingle();
      if (error) throw error;
      return data as InitiativeBrief | null;
    },
    enabled: !!initiativeId,
  });
}

export function useUpdateBrief() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async ({ initiativeId, data }: { initiativeId: string; data: Partial<InitiativeBrief> }) => {
      const { error } = await supabase
        .from('initiative_briefs')
        .update(data)
        .eq('initiative_id', initiativeId);
      if (error) throw error;
    },
    onSuccess: (_, { initiativeId }) => {
      queryClient.invalidateQueries({ queryKey: ['initiative-brief', initiativeId] });
    },
  });
}

// Features hooks
export function useInitiativeFeatures(initiativeId?: string) {
  return useQuery({
    queryKey: ['initiative-features', initiativeId],
    queryFn: async () => {
      if (!initiativeId) return [];
      const { data, error } = await supabase
        .from('initiative_features')
        .select('*')
        .eq('initiative_id', initiativeId)
        .order('sort_order', { ascending: true });
      if (error) throw error;
      return data as InitiativeFeature[];
    },
    enabled: !!initiativeId,
  });
}

export function useCreateFeature() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (data: { initiative_id: string; name: string; description?: string; priority?: FeaturePriority }) => {
      const { data: feature, error } = await supabase
        .from('initiative_features')
        .insert(data)
        .select()
        .single();
      if (error) throw error;
      return feature as InitiativeFeature;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['initiative-features'] });
    },
  });
}

export function useUpdateFeature() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async ({ featureId, data }: { featureId: string; data: Partial<InitiativeFeature> }) => {
      const { error } = await supabase
        .from('initiative_features')
        .update(data)
        .eq('id', featureId);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['initiative-features'] });
    },
  });
}

export function useDeleteFeature() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (featureId: string) => {
      const { error } = await supabase
        .from('initiative_features')
        .delete()
        .eq('id', featureId);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['initiative-features'] });
    },
  });
}

// Screens hooks
export function useInitiativeScreens(initiativeId?: string) {
  return useQuery({
    queryKey: ['initiative-screens', initiativeId],
    queryFn: async () => {
      if (!initiativeId) return [];
      const { data, error } = await supabase
        .from('initiative_screens')
        .select('*')
        .eq('initiative_id', initiativeId)
        .order('step_order', { ascending: true });
      if (error) throw error;
      return data as InitiativeScreen[];
    },
    enabled: !!initiativeId,
  });
}

export function useCreateScreen() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (data: { initiative_id: string; name: string; description?: string; step_order?: number }) => {
      const { data: screen, error } = await supabase
        .from('initiative_screens')
        .insert(data)
        .select()
        .single();
      if (error) throw error;
      return screen as InitiativeScreen;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['initiative-screens'] });
    },
  });
}

// Tech Docs hooks
export function useInitiativeTechDocs(initiativeId?: string) {
  return useQuery({
    queryKey: ['initiative-tech-docs', initiativeId],
    queryFn: async () => {
      if (!initiativeId) return null;
      const { data, error } = await supabase
        .from('initiative_tech_docs')
        .select('*')
        .eq('initiative_id', initiativeId)
        .maybeSingle();
      if (error) throw error;
      return data as InitiativeTechDocs | null;
    },
    enabled: !!initiativeId,
  });
}

export function useCreateTechDocs() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (data: { initiative_id: string }) => {
      const { data: docs, error } = await supabase
        .from('initiative_tech_docs')
        .insert(data)
        .select()
        .single();
      if (error) throw error;
      return docs as InitiativeTechDocs;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['initiative-tech-docs'] });
    },
  });
}

export function useDeleteInitiative() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (initiativeId: string) => {
      const { error } = await supabase.rpc('delete_initiative_cascade' as any, {
        p_initiative_id: initiativeId,
      });
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['initiatives'] });
    },
  });
}

export function useUpdateTechDocs() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async ({ initiativeId, data }: { initiativeId: string; data: Record<string, unknown> }) => {
      const { error } = await supabase
        .from('initiative_tech_docs')
        .update(data)
        .eq('initiative_id', initiativeId);
      if (error) throw error;
    },
    onSuccess: (_, { initiativeId }) => {
      queryClient.invalidateQueries({ queryKey: ['initiative-tech-docs', initiativeId] });
    },
  });
}
