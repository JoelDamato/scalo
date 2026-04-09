import { useState, useEffect } from 'react';
import { Sparkles, Rocket, Copy, ExternalLink, Loader2, CheckCircle2, Code2, Zap, GitBranch, ListTodo } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useInitiative, useInitiativeFeatures, useInitiativeBrief, useInitiativeTechDocs, useUpdateTechDocs } from '@/hooks/useInitiatives';
import { useCreateTask } from '@/hooks/useData';
import { useAIGeneration } from '@/hooks/useAIGeneration';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';

interface ImplementationStepProps {
  initiativeId: string;
}

const aiTools = [
  { 
    id: 'lovable', 
    name: 'Lovable', 
    description: 'Full-stack web apps with AI',
    icon: '💜',
    url: 'https://lovable.dev',
    promptType: 'conversational',
  },
  { 
    id: 'cursor', 
    name: 'Cursor', 
    description: 'AI-first code editor',
    icon: '⌨️',
    url: 'https://cursor.sh',
    promptType: 'technical',
  },
  { 
    id: 'v0', 
    name: 'v0 by Vercel', 
    description: 'UI generation from prompts',
    icon: '▲',
    url: 'https://v0.dev',
    promptType: 'ui',
  },
];

export function ImplementationStep({ initiativeId }: ImplementationStepProps) {
  const { data: initiative } = useInitiative(initiativeId);
  const { data: brief } = useInitiativeBrief(initiativeId);
  const { data: features = [] } = useInitiativeFeatures(initiativeId);
  const { data: techDocs } = useInitiativeTechDocs(initiativeId);
  const updateTechDocs = useUpdateTechDocs();
  const createTask = useCreateTask();
  const { generate, isGenerating } = useAIGeneration();

  const [selectedTool, setSelectedTool] = useState('lovable');
  const [copiedPrompt, setCopiedPrompt] = useState<string | null>(null);
  const [isCreatingTasks, setIsCreatingTasks] = useState(false);

  // Load saved plan from techDocs
  const savedPlan = techDocs?.implementation_plan || null;

  const handleGeneratePlan = async () => {
    if (!initiative) return;

    const content = await generate('implementation', {
      initiativeName: initiative.name,
      productType: initiative.product_type,
      brief: brief ? Object.fromEntries(
        Object.entries(brief).filter(([k, v]) => v && typeof v === 'string')
      ) : undefined,
      features: features.map(f => ({
        name: f.name,
        description: f.description,
        priority: f.priority,
        user_story: f.user_story,
      })),
    });

    if (content && typeof content === 'string') {
      // Save to database
      await updateTechDocs.mutateAsync({
        initiativeId,
        data: { implementation_plan: content }
      });
      toast.success('Plan de implementación generado y guardado');
    }
  };

  const handleCreateTasksFromFeatures = async () => {
    if (!initiative || features.length === 0) return;
    
    setIsCreatingTasks(true);
    try {
      // Get must and should features to create tasks
      const priorityFeatures = features.filter(f => f.priority === 'must' || f.priority === 'should');
      
      for (const feature of priorityFeatures) {
        await createTask.mutateAsync({
          title: feature.name,
          description: feature.user_story || feature.description || `Implementar: ${feature.name}`,
          project_id: initiative.project_id,
          status: 'backlog',
          is_client_visible: true,
        });
      }
      
      toast.success(`${priorityFeatures.length} tareas creadas en el backlog`);
    } catch (error) {
      toast.error('Error al crear las tareas');
    } finally {
      setIsCreatingTasks(false);
    }
  };

  const generatePromptForTool = (tool: typeof aiTools[0]) => {
    const mustFeatures = features.filter(f => f.priority === 'must');
    const shouldFeatures = features.filter(f => f.priority === 'should');

    const baseContext = `
Producto: ${initiative?.name || 'Sin nombre'}
Tipo: ${initiative?.product_type || 'MVP'}

${brief?.executive_summary ? `Resumen: ${brief.executive_summary}` : ''}
${brief?.problem_statement ? `Problema: ${brief.problem_statement}` : ''}
${brief?.proposed_solution ? `Solución: ${brief.proposed_solution}` : ''}

Features Must Have:
${mustFeatures.map(f => `- ${f.name}: ${f.description || f.user_story || ''}`).join('\n')}

Features Should Have:
${shouldFeatures.map(f => `- ${f.name}: ${f.description || f.user_story || ''}`).join('\n')}
`;

    switch (tool.promptType) {
      case 'conversational':
        return `Necesito crear una aplicación web para: ${initiative?.name}

${baseContext}

Stack recomendado: React + Tailwind + Supabase (o según tech docs)

Empecemos con la estructura básica y la primera feature: ${mustFeatures[0]?.name || 'Home page'}`;
      
      case 'technical':
        return `# ${initiative?.name}

${baseContext}

## Tech Stack
${techDocs?.tech_stack ? JSON.stringify(techDocs.tech_stack, null, 2) : 'React, TypeScript, Tailwind CSS, Supabase'}

## Database Schema
${techDocs?.database_schema || 'Generar según features'}

## Implementation Order
1. Setup proyecto base
2. Configurar autenticación
${mustFeatures.map((f, i) => `${i + 3}. Implementar ${f.name}`).join('\n')}`;

      case 'ui':
        return `Create a modern UI for "${initiative?.name}":

${brief?.executive_summary || 'A web application with the following features:'}

Key screens needed:
${mustFeatures.slice(0, 3).map(f => `- ${f.name} interface`).join('\n')}

Style: Modern, clean, professional
Theme: Light/Dark mode support`;
      
      default:
        return baseContext;
    }
  };

  const copyPrompt = (toolId: string) => {
    const tool = aiTools.find(t => t.id === toolId);
    if (!tool) return;
    
    const prompt = generatePromptForTool(tool);
    navigator.clipboard.writeText(prompt);
    setCopiedPrompt(toolId);
    toast.success('Prompt copiado al clipboard');
    setTimeout(() => setCopiedPrompt(null), 2000);
  };

  // PRD is completed if any must/should feature has a PRD entry
  const priorityFeatures = features.filter(f => f.priority === 'must' || f.priority === 'should');
  const hasPRDContent = priorityFeatures.length > 0; // PRDs are created when features exist and user generates them

  const completedSteps = [
    { name: 'Brief', completed: !!brief?.executive_summary },
    { name: 'Features', completed: features.length > 0 },
    { name: 'PRD', completed: hasPRDContent && priorityFeatures.length > 0 },
    { name: 'Tech Docs', completed: !!techDocs?.tech_stack },
  ];

  const readyForImplementation = completedSteps.filter(s => s.completed).length >= 2;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Implementation</h2>
          <p className="text-muted-foreground">Exporta tu especificación a herramientas de AI Coding</p>
        </div>
      </div>

      {/* Readiness Check */}
      <Card className={cn(
        'border-2',
        readyForImplementation ? 'border-green-500/20 bg-green-500/5' : 'border-yellow-500/20 bg-yellow-500/5'
      )}>
        <CardHeader className="pb-2">
          <CardTitle className="text-base flex items-center gap-2">
            {readyForImplementation ? (
              <CheckCircle2 className="w-5 h-5 text-green-500" />
            ) : (
              <Zap className="w-5 h-5 text-yellow-500" />
            )}
            {readyForImplementation ? 'Listo para Implementar' : 'Preparación en Progreso'}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex gap-4 flex-wrap">
            {completedSteps.map((step) => (
              <Badge
                key={step.name}
                variant="outline"
                className={cn(
                  step.completed 
                    ? 'bg-green-500/10 text-green-500 border-green-500/20' 
                    : 'bg-muted text-muted-foreground'
                )}
              >
                {step.completed ? <CheckCircle2 className="w-3 h-3 mr-1" /> : null}
                {step.name}
              </Badge>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Create Tasks from Features */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="text-base flex items-center gap-2">
              <ListTodo className="w-4 h-4" />
              Crear Tareas desde Features
            </CardTitle>
            <Button 
              variant="outline" 
              size="sm" 
              onClick={handleCreateTasksFromFeatures}
              disabled={isCreatingTasks || features.length === 0}
            >
              {isCreatingTasks ? (
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              ) : (
                <ListTodo className="w-4 h-4 mr-2" />
              )}
              Crear Tareas en Backlog
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground text-sm">
            Genera tareas automáticamente en el backlog del proyecto a partir de las features Must y Should ({features.filter(f => f.priority === 'must' || f.priority === 'should').length} features).
          </p>
        </CardContent>
      </Card>

      {/* AI Coding Tools */}
      <div>
        <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
          <Rocket className="w-5 h-5" />
          Herramientas de AI Coding
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {aiTools.map((tool) => (
            <Card key={tool.id} className={cn(
              'cursor-pointer transition-all hover:shadow-md',
              selectedTool === tool.id && 'ring-2 ring-primary'
            )} onClick={() => setSelectedTool(tool.id)}>
              <CardHeader className="pb-2">
                <CardTitle className="text-base flex items-center gap-2">
                  <span className="text-2xl">{tool.icon}</span>
                  {tool.name}
                </CardTitle>
                <CardDescription className="text-xs">{tool.description}</CardDescription>
              </CardHeader>
              <CardContent className="pt-0">
                <div className="flex gap-2">
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={(e) => {
                      e.stopPropagation();
                      copyPrompt(tool.id);
                    }}
                  >
                    {copiedPrompt === tool.id ? (
                      <CheckCircle2 className="w-4 h-4 mr-1 text-green-500" />
                    ) : (
                      <Copy className="w-4 h-4 mr-1" />
                    )}
                    Copiar Prompt
                  </Button>
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={(e) => {
                      e.stopPropagation();
                      window.open(tool.url, '_blank');
                    }}
                  >
                    <ExternalLink className="w-4 h-4" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>

      {/* Generated Prompt Preview */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <Code2 className="w-4 h-4" />
            Prompt para {aiTools.find(t => t.id === selectedTool)?.name}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <pre className="bg-muted p-4 rounded-lg text-sm whitespace-pre-wrap font-mono max-h-64 overflow-auto">
            {generatePromptForTool(aiTools.find(t => t.id === selectedTool)!)}
          </pre>
        </CardContent>
      </Card>

      {/* Implementation Plan - now saved */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="text-base flex items-center gap-2">
              <GitBranch className="w-4 h-4" />
              Plan de Implementación
              {savedPlan && (
                <Badge variant="outline" className="bg-green-500/10 text-green-500 border-green-500/20 text-xs">
                  Guardado
                </Badge>
              )}
            </CardTitle>
            <Button variant="outline" size="sm" onClick={handleGeneratePlan} disabled={isGenerating || updateTechDocs.isPending}>
              {isGenerating || updateTechDocs.isPending ? (
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              ) : (
                <Sparkles className="w-4 h-4 mr-2" />
              )}
              {savedPlan ? 'Regenerar Plan' : 'Generar Plan con IA'}
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {savedPlan ? (
            <div className="prose prose-sm dark:prose-invert max-w-none">
              <pre className="whitespace-pre-wrap font-sans text-sm">{savedPlan}</pre>
            </div>
          ) : (
            <p className="text-muted-foreground text-sm text-center py-8">
              Genera un plan de implementación detallado con fases, estimaciones y recomendaciones.
            </p>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
