import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { PHASE_SOP_CONFIGS } from '@/data/automationPhaseSOPs';
import { automationKnowledgeBaseSections, AUTOMATION_PHASE_DATA_MAP } from '@/data/automationKnowledgeBaseTemplates';
import { AUTOMATION_STEPS } from '@/hooks/useInitiatives';

export interface InitiativeExportData {
  initiative: {
    name: string;
    product_type: string;
    current_step: string;
    status: string;
  };
  project: {
    name: string;
  };
  brief: Record<string, string | null> | null;
  features: Array<{
    name: string;
    description: string | null;
    priority: string;
    complexity: string;
    user_story: string | null;
    acceptance_criteria: string[] | null;
  }>;
  prds: Array<{
    feature_name: string;
    overview: string | null;
    use_cases: unknown | null;
    non_functional_requirements: string | null;
    dependencies: string | null;
    edge_cases: string | null;
    acceptance_criteria: string | null;
    design_guidelines: string | null;
  }>;
  screens: Array<{
    name: string;
    description: string | null;
    screen_type: string | null;
    flow_name: string | null;
    step_order: number;
  }>;
  techDocs: {
    tech_stack: unknown | null;
    frontend_guidelines: string | null;
    backend_structure: string | null;
    api_routes: unknown | null;
    database_schema: string | null;
    authentication: string | null;
    integrations: string | null;
    implementation_plan: string | null;
  } | null;
  // Automation-specific
  knowledgeBase?: Record<string, any> | null;
  phaseChecklists?: Record<string, boolean[]>;
}

export async function fetchInitiativeExportData(initiativeId: string): Promise<InitiativeExportData | null> {
  try {
    const { data: initiative, error: initError } = await supabase
      .from('product_initiatives')
      .select('*, projects(name)')
      .eq('id', initiativeId)
      .single();
    
    if (initError || !initiative) throw initError;

    const isAutomation = initiative.product_type === 'automation';

    // For automation: fetch KB
    let knowledgeBase: Record<string, any> | null = null;
    let phaseChecklists: Record<string, boolean[]> = {};
    
    if (isAutomation) {
      const { data: kb } = await supabase
        .from('project_knowledge_base' as any)
        .select('*')
        .eq('project_id', initiative.project_id)
        .maybeSingle();
      
      if (kb) {
        const kbData = kb as any;
        knowledgeBase = kbData.responses || {};
        // Extract phase checklists
        for (const step of AUTOMATION_STEPS) {
          const key = `phase_checklist_${step.step}`;
          if (knowledgeBase && Array.isArray(knowledgeBase[key])) {
            phaseChecklists[step.step] = knowledgeBase[key];
          }
        }
      }
    }

    // For non-automation: fetch standard data
    const { data: brief } = await supabase
      .from('initiative_briefs')
      .select('*')
      .eq('initiative_id', initiativeId)
      .maybeSingle();

    const { data: features = [] } = await supabase
      .from('initiative_features')
      .select('*')
      .eq('initiative_id', initiativeId)
      .order('sort_order', { ascending: true });

    const featureIds = features?.map(f => f.id) || [];
    let prds: Array<{ feature_id: string; [key: string]: unknown }> = [];
    if (featureIds.length > 0) {
      const { data: prdData } = await supabase
        .from('initiative_prds')
        .select('*')
        .in('feature_id', featureIds);
      prds = prdData || [];
    }

    const { data: screens = [] } = await supabase
      .from('initiative_screens')
      .select('*')
      .eq('initiative_id', initiativeId)
      .order('step_order', { ascending: true });

    const { data: techDocs } = await supabase
      .from('initiative_tech_docs')
      .select('*')
      .eq('initiative_id', initiativeId)
      .maybeSingle();

    const prdsWithFeatureNames = prds.map(prd => {
      const feature = features?.find(f => f.id === prd.feature_id);
      return {
        feature_name: feature?.name || 'Unknown Feature',
        overview: prd.overview as string | null,
        use_cases: prd.use_cases,
        non_functional_requirements: prd.non_functional_requirements as string | null,
        dependencies: prd.dependencies as string | null,
        edge_cases: prd.edge_cases as string | null,
        acceptance_criteria: prd.acceptance_criteria as string | null,
        design_guidelines: prd.design_guidelines as string | null,
      };
    });

    return {
      initiative: {
        name: initiative.name,
        product_type: initiative.product_type,
        current_step: initiative.current_step,
        status: initiative.status,
      },
      project: {
        name: (initiative.projects as { name: string })?.name || 'Unknown Project',
      },
      brief: brief ? {
        executive_summary: brief.executive_summary,
        problem_statement: brief.problem_statement,
        target_users: brief.target_users,
        existing_solutions: brief.existing_solutions,
        proposed_solution: brief.proposed_solution,
        platform_recommendation: brief.platform_recommendation,
        job_to_be_done: brief.job_to_be_done,
        product_objectives: brief.product_objectives,
        key_features: brief.key_features,
        market_analysis: brief.market_analysis,
        technical_risks: brief.technical_risks,
        business_model: brief.business_model,
        business_risks: brief.business_risks,
        implementation_strategy: brief.implementation_strategy,
        success_metrics: brief.success_metrics,
      } : null,
      features: (features || []).map(f => ({
        name: f.name,
        description: f.description,
        priority: f.priority,
        complexity: f.complexity,
        user_story: f.user_story,
        acceptance_criteria: f.acceptance_criteria,
      })),
      prds: prdsWithFeatureNames,
      screens: (screens || []).map(s => ({
        name: s.name,
        description: s.description,
        screen_type: s.screen_type,
        flow_name: s.flow_name,
        step_order: s.step_order,
      })),
      techDocs: techDocs ? {
        tech_stack: techDocs.tech_stack,
        frontend_guidelines: techDocs.frontend_guidelines,
        backend_structure: techDocs.backend_structure,
        api_routes: techDocs.api_routes,
        database_schema: techDocs.database_schema,
        authentication: techDocs.authentication,
        integrations: techDocs.integrations,
        implementation_plan: techDocs.implementation_plan,
      } : null,
      knowledgeBase,
      phaseChecklists,
    };
  } catch (error) {
    console.error('Error fetching initiative export data:', error);
    toast.error('Error al obtener los datos de la iniciativa');
    return null;
  }
}

function formatSection(title: string, content: string | null | undefined): string {
  if (!content) return '';
  return `### ${title}\n\n${content}\n\n`;
}

function formatJsonSection(title: string, content: unknown): string {
  if (!content) return '';
  try {
    const formatted = typeof content === 'string' ? content : JSON.stringify(content, null, 2);
    return `### ${title}\n\n\`\`\`json\n${formatted}\n\`\`\`\n\n`;
  } catch {
    return '';
  }
}

function generateAutomationExport(data: InitiativeExportData): string {
  const kb = data.knowledgeBase || {};
  
  let markdown = `# ${data.initiative.name}

**Proyecto:** ${data.project.name}
**Tipo:** Automatización & IA
**Estado:** ${data.initiative.status}
**Fase Actual:** ${data.initiative.current_step}

---

## 📋 KNOWLEDGE BASE

`;

  // Export each KB section
  for (const section of automationKnowledgeBaseSections) {
    const sectionData = kb[section.key];
    if (!sectionData || Object.keys(sectionData).length === 0) {
      markdown += `### ${section.title}\n\n_Sin completar_\n\n`;
      continue;
    }

    markdown += `### ${section.title}\n\n`;
    for (const field of section.fields) {
      const val = sectionData[field.key];
      if (val === undefined || val === null || val === '') continue;

      if (field.type === 'repeater' && Array.isArray(val)) {
        markdown += `**${field.label}:**\n`;
        val.forEach((item: Record<string, any>, i: number) => {
          const parts = Object.entries(item)
            .filter(([, v]) => v)
            .map(([k, v]) => `${k}: ${v}`)
            .join(' | ');
          markdown += `  ${i + 1}. ${parts}\n`;
        });
        markdown += '\n';
      } else if (field.type === 'multiselect' && Array.isArray(val)) {
        markdown += `**${field.label}:** ${val.join(', ')}\n\n`;
      } else if (field.type === 'boolean') {
        markdown += `**${field.label}:** ${val ? 'Sí' : 'No'}\n\n`;
      } else {
        markdown += `**${field.label}:** ${val}\n\n`;
      }
    }
  }

  markdown += `---\n\n## ✅ PROGRESO POR FASE\n\n`;

  // Export phase checklists
  for (const step of AUTOMATION_STEPS) {
    const sopConfig = PHASE_SOP_CONFIGS[step.step];
    if (!sopConfig) {
      if (step.step === 'kickoff') {
        const sections = automationKnowledgeBaseSections;
        const completed = sections.filter(s => {
          const d = kb[s.key] || {};
          const required = s.fields.filter(f => f.required);
          if (required.length === 0) return Object.keys(d).length > 0;
          return required.every(f => d[f.key] !== undefined && d[f.key] !== '' && d[f.key] !== null);
        }).length;
        markdown += `### ${step.title}\n\n`;
        markdown += `Progreso: ${completed}/${sections.length} secciones completadas\n\n`;
      }
      continue;
    }

    const checklist = data.phaseChecklists?.[step.step] || [];
    const completed = sopConfig.checklist.filter((_, i) => !!checklist[i]).length;
    const total = sopConfig.checklist.length;

    markdown += `### ${sopConfig.title}\n\n`;
    markdown += `Progreso: ${completed}/${total} (${total > 0 ? Math.round((completed / total) * 100) : 0}%)\n\n`;

    sopConfig.checklist.forEach((item, i) => {
      markdown += `- [${checklist[i] ? 'x' : ' '}] ${item.title}\n`;
    });
    markdown += '\n';
  }

  markdown += `---\n\n*Documento generado automáticamente desde Waves Portal*\n*Fecha: ${new Date().toLocaleDateString('es-AR', { 
    year: 'numeric', month: 'long', day: 'numeric', hour: '2-digit', minute: '2-digit'
  })}*\n`;

  return markdown;
}

export function generateMarkdownExport(data: InitiativeExportData): string {
  // Route to automation-specific export
  if (data.initiative.product_type === 'automation') {
    return generateAutomationExport(data);
  }

  const priorityLabels: Record<string, string> = {
    must: '🔴 Must Have',
    should: '🟡 Should Have',
    could: '🟢 Could Have',
    wont: '⚪ Won\'t Have',
  };

  const complexityLabels: Record<string, string> = {
    easy: '🟢 Fácil',
    medium: '🟡 Medio',
    hard: '🔴 Difícil',
  };

  let markdown = `# ${data.initiative.name}

**Proyecto:** ${data.project.name}
**Tipo de Producto:** ${data.initiative.product_type.toUpperCase()}
**Estado:** ${data.initiative.status}
**Fase Actual:** ${data.initiative.current_step}

---

`;

  if (data.brief) {
    markdown += `## 📋 BRIEF\n\n`;
    markdown += formatSection('Resumen Ejecutivo', data.brief.executive_summary);
    markdown += formatSection('Planteamiento del Problema', data.brief.problem_statement);
    markdown += formatSection('Usuarios Objetivo', data.brief.target_users);
    markdown += formatSection('Soluciones Existentes', data.brief.existing_solutions);
    markdown += formatSection('Solución Propuesta', data.brief.proposed_solution);
    markdown += formatSection('Plataforma Recomendada', data.brief.platform_recommendation);
    markdown += formatSection('Job to be Done', data.brief.job_to_be_done);
    markdown += formatSection('Objetivos del Producto', data.brief.product_objectives);
    markdown += formatSection('Features Clave', data.brief.key_features);
    markdown += formatSection('Análisis de Mercado', data.brief.market_analysis);
    markdown += formatSection('Riesgos Técnicos', data.brief.technical_risks);
    markdown += formatSection('Modelo de Negocio', data.brief.business_model);
    markdown += formatSection('Riesgos de Negocio', data.brief.business_risks);
    markdown += formatSection('Estrategia de Implementación', data.brief.implementation_strategy);
    markdown += formatSection('Métricas de Éxito', data.brief.success_metrics);
    markdown += `---\n\n`;
  }

  if (data.features.length > 0) {
    markdown += `## 🧩 FEATURES\n\n`;
    const groupedFeatures: Record<string, typeof data.features> = { must: [], should: [], could: [], wont: [] };
    data.features.forEach(f => { if (groupedFeatures[f.priority]) groupedFeatures[f.priority].push(f); });

    for (const [priority, features] of Object.entries(groupedFeatures)) {
      if (features.length > 0) {
        markdown += `### ${priorityLabels[priority] || priority}\n\n`;
        for (const feature of features) {
          markdown += `#### ${feature.name}\n\n`;
          if (feature.description) markdown += `**Descripción:** ${feature.description}\n\n`;
          markdown += `**Complejidad:** ${complexityLabels[feature.complexity] || feature.complexity}\n\n`;
          if (feature.user_story) markdown += `**User Story:** ${feature.user_story}\n\n`;
          if (feature.acceptance_criteria?.length) {
            markdown += `**Criterios de Aceptación:**\n`;
            feature.acceptance_criteria.forEach(c => { markdown += `- ${c}\n`; });
            markdown += '\n';
          }
        }
      }
    }
    markdown += `---\n\n`;
  }

  if (data.prds.length > 0) {
    markdown += `## 📄 PRD\n\n`;
    for (const prd of data.prds) {
      markdown += `### Feature: ${prd.feature_name}\n\n`;
      if (prd.overview) markdown += `**Overview:**\n${prd.overview}\n\n`;
      if (prd.use_cases) markdown += `**Casos de Uso:**\n\`\`\`json\n${JSON.stringify(prd.use_cases, null, 2)}\n\`\`\`\n\n`;
      if (prd.non_functional_requirements) markdown += `**Requisitos No Funcionales:**\n${prd.non_functional_requirements}\n\n`;
      if (prd.dependencies) markdown += `**Dependencias:**\n${prd.dependencies}\n\n`;
      if (prd.edge_cases) markdown += `**Casos Borde:**\n${prd.edge_cases}\n\n`;
      if (prd.acceptance_criteria) markdown += `**Criterios de Aceptación:**\n${prd.acceptance_criteria}\n\n`;
      if (prd.design_guidelines) markdown += `**Guías de Diseño:**\n${prd.design_guidelines}\n\n`;
    }
    markdown += `---\n\n`;
  }

  if (data.screens.length > 0) {
    markdown += `## 📱 SCREENS\n\n`;
    const groupedScreens: Record<string, typeof data.screens> = {};
    data.screens.forEach(s => {
      const flow = s.flow_name || 'General';
      if (!groupedScreens[flow]) groupedScreens[flow] = [];
      groupedScreens[flow].push(s);
    });
    for (const [flowName, screens] of Object.entries(groupedScreens)) {
      markdown += `### Flujo: ${flowName}\n\n`;
      [...screens].sort((a, b) => a.step_order - b.step_order).forEach((screen, idx) => {
        markdown += `**${idx + 1}. ${screen.name}**`;
        if (screen.screen_type) markdown += ` _(${screen.screen_type})_`;
        markdown += '\n';
        if (screen.description) markdown += `   ${screen.description}\n`;
        markdown += '\n';
      });
    }
    markdown += `---\n\n`;
  }

  if (data.techDocs) {
    markdown += `## 🔧 TECH DOCS\n\n`;
    if (data.techDocs.tech_stack) markdown += formatJsonSection('Tech Stack', data.techDocs.tech_stack);
    markdown += formatSection('Frontend Guidelines', data.techDocs.frontend_guidelines);
    markdown += formatSection('Backend Structure', data.techDocs.backend_structure);
    if (data.techDocs.api_routes) markdown += formatJsonSection('API Routes', data.techDocs.api_routes);
    markdown += formatSection('Database Schema', data.techDocs.database_schema);
    markdown += formatSection('Authentication', data.techDocs.authentication);
    markdown += formatSection('Integrations', data.techDocs.integrations);
    markdown += formatSection('Implementation Plan', data.techDocs.implementation_plan);
  }

  markdown += `---\n\n*Documento generado automáticamente desde Waves Portal*\n*Fecha: ${new Date().toLocaleDateString('es-AR', { 
    year: 'numeric', month: 'long', day: 'numeric', hour: '2-digit', minute: '2-digit'
  })}*\n`;

  return markdown;
}

export async function downloadInitiativeMarkdown(initiativeId: string): Promise<void> {
  const data = await fetchInitiativeExportData(initiativeId);
  if (!data) return;

  const markdown = generateMarkdownExport(data);
  
  const blob = new Blob([markdown], { type: 'text/markdown;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = `${data.initiative.name.replace(/\s+/g, '_')}_specification.md`;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
  
  toast.success('Especificación descargada');
}
