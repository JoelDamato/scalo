import { useState, useEffect, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Separator } from '@/components/ui/separator';
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion';
import { Globe, Bot, Plug, GraduationCap, HeadphonesIcon, Save, Loader2, ArrowRight, User, Shield, Users } from 'lucide-react';
import { useProjectKnowledgeBase, useUpsertKnowledgeBase } from '@/hooks/useProjectKnowledgeBase';
import { useProject } from '@/hooks/useData';
import { useAutomationOutput, type AutomationOutputType } from '@/hooks/useAutomationOutputs';
import { AutomationOutputCard } from '@/components/initiatives/AutomationOutputCard';
import { useAuth } from '@/hooks/useAuth';
import { toast } from 'sonner';
import type { InitiativeStep } from '@/hooks/useInitiatives';
import { PHASE_SOP_CONFIGS, type SOPChecklistItem } from '@/data/automationPhaseSOPs';

const ICON_MAP = {
  Globe,
  Bot,
  Plug,
  GraduationCap,
  HeadphonesIcon,
} as const;

const RESPONSIBLE_CONFIG = {
  admin: { label: 'Waves', icon: Shield, className: 'bg-primary/10 text-primary' },
  client: { label: 'Cliente', icon: User, className: 'bg-orange-500/10 text-orange-600' },
  both: { label: 'Ambos', icon: Users, className: 'bg-blue-500/10 text-blue-600' },
} as const;

interface PhaseOutput {
  type: AutomationOutputType;
  title: string;
  description: string;
}

const PHASE_OUTPUTS: Partial<Record<InitiativeStep, PhaseOutput[]>> = {
  chatbot_ia: [
    { type: 'system_prompt', title: 'System Prompt', description: 'Prompt completo listo para copiar en Evolution API / n8n. Generado desde KB secciones 1-6 y 9.' },
    { type: 'knowledge_base_md', title: 'Knowledge Base .md', description: 'Documento estructurado con toda la info del negocio formateada para el LLM. Descargable.' },
    { type: 'flow_map', title: 'Mapa de Flujos', description: 'JSON con los nodos de conversación: triggers, respuestas, condiciones, derivaciones.' },
  ],
  integracion: [
    { type: 'n8n_workflow', title: 'Workflow n8n (JSON)', description: 'Workflow exportable pre-configurado con los datos del KB. Importable en n8n.' },
    { type: 'integration_sheet', title: 'Ficha de Integración', description: 'Resumen de sistemas, endpoints, credenciales (sin valores). Archivo interno.' },
  ],
  entrega: [
    { type: 'user_guide', title: 'Guía de Uso (Cliente)', description: 'Documento de 1 página para el cliente. Cómo usar, intervenir y contactar soporte.' },
    { type: 'delivery_certificate', title: 'Acta de Entrega', description: 'Documento formal con scope, fecha, firma digital. Archivo interno.' },
  ],
  soporte: [
    { type: 'monthly_report', title: 'Reporte Mensual', description: 'Template con métricas: conversaciones, turnos, derivaciones, uptime.' },
  ],
};

interface AutomationPhaseStepProps {
  initiativeId: string;
  phase: InitiativeStep;
  projectId: string;
}

export function AutomationPhaseStep({ initiativeId, phase, projectId }: AutomationPhaseStepProps) {
  const config = PHASE_SOP_CONFIGS[phase];
  const { isAdmin } = useAuth();
  const { data: kb, isLoading } = useProjectKnowledgeBase(projectId);
  const { data: project } = useProject(projectId);
  const upsert = useUpsertKnowledgeBase();
  const { generate: generateOutput, isGenerating: isGeneratingOutput } = useAutomationOutput();

  const [checkedItems, setCheckedItems] = useState<boolean[]>([]);
  const [hasChanges, setHasChanges] = useState(false);

  useEffect(() => {
    if (kb?.responses && config) {
      const phaseChecklist = kb.responses[`phase_checklist_${phase}`];
      if (Array.isArray(phaseChecklist)) {
        const padded = config.checklist.map((_, i) => !!phaseChecklist[i]);
        setCheckedItems(padded);
      } else {
        setCheckedItems(config.checklist.map(() => false));
      }
    } else if (config) {
      setCheckedItems(config.checklist.map(() => false));
    }
  }, [kb, phase, config]);

  const toggleItem = useCallback((index: number) => {
    setCheckedItems(prev => {
      const next = [...prev];
      next[index] = !next[index];
      return next;
    });
    setHasChanges(true);
  }, []);

  const save = async () => {
    if (!kb) return;
    try {
      const responses = {
        ...(kb.responses || {}),
        [`phase_checklist_${phase}`]: checkedItems,
      };
      await upsert.mutateAsync({ projectId, responses });
      setHasChanges(false);
      toast.success('Progreso guardado');
    } catch {
      toast.error('Error al guardar');
    }
  };

  if (!config) {
    return (
      <div className="text-center py-12 text-muted-foreground">
        Fase no configurada
      </div>
    );
  }

  const completedCount = checkedItems.filter(Boolean).length;
  const totalCount = config.checklist.length;
  const progress = totalCount > 0 ? Math.round((completedCount / totalCount) * 100) : 0;
  const Icon = ICON_MAP[config.iconName];

  // Find first uncompleted item index
  const nextItemIndex = checkedItems.findIndex(c => !c);

  if (isLoading) {
    return (
      <div className="animate-pulse space-y-4">
        {[1, 2, 3].map(i => <div key={i} className="h-20 bg-muted rounded-lg" />)}
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
          <Icon className="w-5 h-5 text-primary" />
        </div>
        <div>
          <h2 className="text-xl font-bold">{config.title}</h2>
          <p className="text-muted-foreground">{config.subtitle}</p>
        </div>
      </div>

      {/* Objective */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base">Objetivo</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm">{config.objective}</p>
        </CardContent>
      </Card>

      {/* Progress */}
      <div className="space-y-2">
        <div className="flex items-center justify-between text-sm">
          <span className="text-muted-foreground">{completedCount} de {totalCount} completados</span>
          <span className="font-medium">{progress}%</span>
        </div>
        <Progress value={progress} className="h-2" />
      </div>

      {/* Guided Checklist */}
      <Card>
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <CardTitle className="text-base">SOP — Pasos a seguir</CardTitle>
            <Badge variant={completedCount === totalCount ? 'default' : 'secondary'}>
              {completedCount}/{totalCount}
            </Badge>
          </div>
        </CardHeader>
        <CardContent className="p-0">
          <Accordion type="single" collapsible defaultValue={nextItemIndex >= 0 ? `item-${nextItemIndex}` : undefined}>
            {config.checklist.map((item, i) => (
              <SOPItemRow
                key={i}
                index={i}
                item={item}
                checked={checkedItems[i] || false}
                onToggle={() => toggleItem(i)}
                disabled={!isAdmin}
                isNext={i === nextItemIndex}
              />
            ))}
          </Accordion>

          <div className="px-4 py-3 border-t">
            <p className="text-xs text-muted-foreground font-medium">
              🚧 Gate: {config.gate}
            </p>
          </div>
        </CardContent>
      </Card>

      {/* Phase Outputs */}
      {isAdmin && progress === 100 && PHASE_OUTPUTS[phase] && (
        <>
          <Separator />
          <div className="space-y-3">
            <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider">
              📤 Outputs de {config.title}
            </h3>
            {PHASE_OUTPUTS[phase]!.map((output) => (
              <AutomationOutputCard
                key={output.type}
                title={output.title}
                description={output.description}
                content={kb?.responses?.[`output_${output.type}`] || null}
                isGenerating={isGeneratingOutput}
                filename={`${output.type}-${project?.name || 'proyecto'}.md`}
                onGenerate={async () => {
                  if (!kb?.responses) return;
                  const result = await generateOutput(output.type, kb.responses, project?.name || 'Proyecto');
                  if (result) {
                    const responses = {
                      ...(kb.responses || {}),
                      [`output_${output.type}`]: result,
                    };
                    await upsert.mutateAsync({ projectId, responses });
                    toast.success(`${output.title} generado y guardado`);
                  }
                }}
              />
            ))}
          </div>
        </>
      )}

      {hasChanges && (
        <div className="flex justify-end sticky bottom-4">
          <Button onClick={save} disabled={upsert.isPending} size="lg" className="shadow-lg">
            {upsert.isPending ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Save className="w-4 h-4 mr-2" />}
            Guardar progreso
          </Button>
        </div>
      )}
    </div>
  );
}

interface SOPItemRowProps {
  index: number;
  item: SOPChecklistItem;
  checked: boolean;
  onToggle: () => void;
  disabled: boolean;
  isNext: boolean;
}

function SOPItemRow({ index, item, checked, onToggle, disabled, isNext }: SOPItemRowProps) {
  const responsible = RESPONSIBLE_CONFIG[item.responsible];
  const ResponsibleIcon = responsible.icon;

  return (
    <AccordionItem value={`item-${index}`} className="border-b last:border-b-0">
      <div className="flex items-start gap-3 px-4 pt-3">
        <Checkbox
          checked={checked}
          onCheckedChange={onToggle}
          disabled={disabled}
          className="mt-1"
          onClick={(e) => e.stopPropagation()}
        />
        <div className="flex-1 min-w-0">
          <AccordionTrigger className="py-0 pb-3 hover:no-underline">
            <div className="flex items-center gap-2 text-left">
              <span className={`text-sm font-medium ${checked ? 'line-through text-muted-foreground' : ''}`}>
                {item.title}
              </span>
              {isNext && !checked && (
                <Badge variant="outline" className="text-[10px] px-1.5 py-0 border-primary text-primary shrink-0">
                  Siguiente
                </Badge>
              )}
            </div>
          </AccordionTrigger>
        </div>
      </div>

      <AccordionContent className="pl-11 pr-4 pb-4">
        <div className="space-y-4">
          {/* Description */}
          <p className="text-sm text-muted-foreground">{item.description}</p>

          {/* Responsible */}
          <div className="flex items-center gap-2">
            <span className="text-xs text-muted-foreground">Responsable:</span>
            <span className={`inline-flex items-center gap-1 text-xs font-medium px-2 py-0.5 rounded-full ${responsible.className}`}>
              <ResponsibleIcon className="w-3 h-3" />
              {responsible.label}
            </span>
          </div>

          {/* Instructions */}
          <div className="space-y-1.5">
            <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Pasos</span>
            <ol className="space-y-1.5 ml-0">
              {item.instructions.map((step, si) => (
                <li key={si} className="flex items-start gap-2 text-sm">
                  <span className="flex items-center justify-center w-5 h-5 rounded-full bg-muted text-[10px] font-bold shrink-0 mt-0.5">
                    {si + 1}
                  </span>
                  <span>{step}</span>
                </li>
              ))}
            </ol>
          </div>

          {/* Input / Output */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="rounded-lg bg-muted/50 p-3 space-y-1">
              <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">📥 Input</span>
              <p className="text-xs">{item.input}</p>
            </div>
            <div className="rounded-lg bg-primary/5 p-3 space-y-1">
              <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">📤 Output</span>
              <p className="text-xs">{item.output}</p>
            </div>
          </div>
        </div>
      </AccordionContent>
    </AccordionItem>
  );
}
