import { useState, useEffect, useCallback, useMemo } from 'react';
import {
  ChevronDown, ChevronRight, Save, Loader2, Check,
  Building2, Clock, Users, ListChecks, CreditCard,
  Plug, Key, Palette, Plus, Trash2, AlertTriangle, Bot,
} from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { Label } from '@/components/ui/label';
import { Progress } from '@/components/ui/progress';
import { Separator } from '@/components/ui/separator';
import { useProjectKnowledgeBase, useUpsertKnowledgeBase } from '@/hooks/useProjectKnowledgeBase';
import { useAutomationOutput } from '@/hooks/useAutomationOutputs';
import { AutomationOutputCard } from '@/components/initiatives/AutomationOutputCard';
import { useAuth } from '@/hooks/useAuth';
import { useProject } from '@/hooks/useData';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';
import { automationKnowledgeBaseSections } from '@/data/automationKnowledgeBaseTemplates';
import { KBSection, KBField } from '@/data/knowledgeBaseTemplates';

const ICON_MAP: Record<string, any> = {
  Building2, Clock, Users, ListChecks, CreditCard, Plug, Key, Palette, AlertTriangle, Bot,
};

interface AutomationKickoffStepProps {
  initiativeId: string;
  projectId: string;
}

export function AutomationKickoffStep({ initiativeId, projectId }: AutomationKickoffStepProps) {
  const { isAdmin } = useAuth();
  const { data: kb, isLoading } = useProjectKnowledgeBase(projectId);
  const { data: project } = useProject(projectId);
  const upsert = useUpsertKnowledgeBase();
  const { generate: generateOutput, isGenerating: isGeneratingOutput } = useAutomationOutput();

  const sections = automationKnowledgeBaseSections;

  const [responses, setResponses] = useState<Record<string, any>>({});
  const [openSections, setOpenSections] = useState<Set<string>>(new Set());
  const [hasChanges, setHasChanges] = useState(false);

  useEffect(() => {
    if (kb?.responses) setResponses(kb.responses);
  }, [kb]);

  useEffect(() => {
    if (openSections.size === 0 && sections.length > 0) {
      const first = sections.find(s => !isSectionComplete(s));
      setOpenSections(new Set([first?.key || sections[0].key]));
    }
  }, [sections.length]);

  const updateField = useCallback((sectionKey: string, fieldKey: string, value: any) => {
    setResponses(prev => ({
      ...prev,
      [sectionKey]: { ...(prev[sectionKey] || {}), [fieldKey]: value },
    }));
    setHasChanges(true);
  }, []);

  const save = async () => {
    try {
      await upsert.mutateAsync({ projectId, responses });
      setHasChanges(false);
      toast.success('Información guardada');
    } catch {
      toast.error('Error al guardar');
    }
  };

  const isSectionComplete = (section: KBSection): boolean => {
    const data = responses[section.key] || {};
    const required = section.fields.filter(f => f.required);
    if (required.length === 0) return Object.keys(data).length > 0;
    return required.every(f => {
      const val = data[f.key];
      return val !== undefined && val !== '' && val !== null;
    });
  };

  const completed = sections.filter(s => isSectionComplete(s)).length;
  const progress = Math.round((completed / sections.length) * 100);

  if (isLoading) {
    return (
      <div className="animate-pulse space-y-4">
        {[1, 2, 3].map(i => <div key={i} className="h-20 bg-muted rounded-lg" />)}
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-bold">Fase 1: Kickoff & Onboarding</h2>
        <p className="text-muted-foreground mt-1">
          Obtener el 100% de la información del negocio antes de tocar nada técnico.
        </p>
      </div>

      {/* Progress */}
      <div className="space-y-2">
        <div className="flex items-center justify-between text-sm">
          <span className="text-muted-foreground">{completed} de {sections.length} secciones</span>
          <span className="font-medium">{progress}%</span>
        </div>
        <Progress value={progress} className="h-2" />
      </div>

      {/* Inline KB Forms */}
      <div className="space-y-3">
        {sections.map(section => {
          const isOpen = openSections.has(section.key);
          const isComplete = isSectionComplete(section);
          const IconComponent = ICON_MAP[section.icon] || Building2;

          return (
            <Collapsible
              key={section.key}
              open={isOpen}
              onOpenChange={() => {
                const next = new Set(openSections);
                if (next.has(section.key)) next.delete(section.key);
                else next.add(section.key);
                setOpenSections(next);
              }}
            >
              <Card className={cn('transition-colors', isComplete && 'border-primary/30 bg-primary/5')}>
                <CollapsibleTrigger asChild>
                  <button className="w-full flex items-center gap-3 p-4 text-left hover:bg-muted/50 transition-colors rounded-t-lg">
                    <div className={cn(
                      'w-8 h-8 rounded-full flex items-center justify-center shrink-0',
                      isComplete ? 'bg-primary text-primary-foreground' : 'bg-muted text-muted-foreground'
                    )}>
                      {isComplete ? <Check className="w-4 h-4" /> : <IconComponent className="w-4 h-4" />}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="font-medium">{section.title}</span>
                        {isComplete && <Badge variant="secondary" className="text-xs">Completo</Badge>}
                      </div>
                      <p className="text-sm text-muted-foreground truncate">{section.description}</p>
                    </div>
                    {isOpen ? <ChevronDown className="w-4 h-4 text-muted-foreground shrink-0" /> : <ChevronRight className="w-4 h-4 text-muted-foreground shrink-0" />}
                  </button>
                </CollapsibleTrigger>
                <CollapsibleContent>
                  <CardContent className="pt-0 pb-4 space-y-4 border-t">
                    {section.fields.map(field => (
                      <KBFieldRenderer
                        key={field.key}
                        field={field}
                        value={(responses[section.key] || {})[field.key]}
                        onChange={(val) => updateField(section.key, field.key, val)}
                        disabled={!isAdmin}
                      />
                    ))}
                  </CardContent>
                </CollapsibleContent>
              </Card>
            </Collapsible>
          );
        })}
      </div>

      {/* Phase 1 Output: Executive Summary */}
      {isAdmin && progress === 100 && (
        <>
          <Separator />
          <div className="space-y-3">
            <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider">
              📤 Output de Fase 1
            </h3>
            <AutomationOutputCard
              title="Resumen Ejecutivo"
              description="Resumen interno de 1 página: qué es el negocio, qué resuelve el chatbot, integraciones, timeline."
              content={responses.output_executive_summary || null}
              isGenerating={isGeneratingOutput}
              filename={`resumen-ejecutivo-${project?.name || 'proyecto'}.md`}
              onGenerate={async () => {
                const result = await generateOutput('executive_summary', responses, project?.name || 'Proyecto');
                if (result) {
                  const updated = { ...responses, output_executive_summary: result };
                  setResponses(updated);
                  await upsert.mutateAsync({ projectId, responses: updated });
                  toast.success('Resumen ejecutivo generado y guardado');
                }
              }}
            />
          </div>
        </>
      )}

      {hasChanges && (
        <div className="flex justify-end sticky bottom-4">
          <Button onClick={save} disabled={upsert.isPending} size="lg" className="shadow-lg">
            {upsert.isPending ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Save className="w-4 h-4 mr-2" />}
            Guardar cambios
          </Button>
        </div>
      )}
    </div>
  );
}

// ─── Field Renderer (same as ProjectKnowledgeBase) ───

interface KBFieldRendererProps {
  field: KBField;
  value: any;
  onChange: (val: any) => void;
  disabled?: boolean;
}

function KBFieldRenderer({ field, value, onChange, disabled }: KBFieldRendererProps) {
  if (field.type === 'repeater') {
    return <KBRepeaterField field={field} value={value} onChange={onChange} disabled={disabled} />;
  }

  return (
    <div className="space-y-1.5">
      <Label className="text-sm">
        {field.label}
        {field.required && <span className="text-destructive ml-1">*</span>}
      </Label>
      {field.type === 'text' && (
        <Input value={value || ''} onChange={e => onChange(e.target.value)} placeholder={field.placeholder} disabled={disabled} />
      )}
      {field.type === 'textarea' && (
        <Textarea value={value || ''} onChange={e => onChange(e.target.value)} placeholder={field.placeholder} rows={3} disabled={disabled} />
      )}
      {field.type === 'boolean' && (
        <div className="flex items-center gap-2">
          <Switch checked={!!value} onCheckedChange={onChange} disabled={disabled} />
          <span className="text-sm text-muted-foreground">{value ? 'Sí' : 'No'}</span>
        </div>
      )}
      {field.type === 'select' && (
        <Select value={value || ''} onValueChange={onChange} disabled={disabled}>
          <SelectTrigger><SelectValue placeholder="Seleccioná una opción" /></SelectTrigger>
          <SelectContent>
            {field.options?.map(opt => <SelectItem key={opt} value={opt}>{opt}</SelectItem>)}
          </SelectContent>
        </Select>
      )}
      {field.type === 'multiselect' && (
        <div className="flex flex-wrap gap-2">
          {field.options?.map(opt => {
            const selected = Array.isArray(value) && value.includes(opt);
            return (
              <Badge
                key={opt}
                variant={selected ? 'default' : 'outline'}
                className="cursor-pointer"
                onClick={() => {
                  if (disabled) return;
                  const current = Array.isArray(value) ? value : [];
                  onChange(selected ? current.filter((v: string) => v !== opt) : [...current, opt]);
                }}
              >
                {opt}
              </Badge>
            );
          })}
        </div>
      )}
    </div>
  );
}

function KBRepeaterField({ field, value, onChange, disabled }: KBFieldRendererProps) {
  const items: Record<string, any>[] = Array.isArray(value) ? value : [];

  return (
    <div className="space-y-3">
      <Label className="text-sm font-medium">{field.label}</Label>
      {items.map((item, index) => (
        <Card key={index} className="p-3">
          <div className="flex items-start justify-between mb-2">
            <span className="text-xs font-medium text-muted-foreground">#{index + 1}</span>
            {!disabled && (
              <Button variant="ghost" size="sm" className="h-6 w-6 p-0" onClick={() => onChange(items.filter((_, i) => i !== index))}>
                <Trash2 className="w-3 h-3" />
              </Button>
            )}
          </div>
          <div className="grid gap-3 sm:grid-cols-2">
            {field.subFields?.map(sub => (
              <div key={sub.key} className="space-y-1">
                <Label className="text-xs text-muted-foreground">{sub.label}</Label>
                <Input
                  value={item[sub.key] || ''}
                  onChange={e => {
                    const updated = [...items];
                    updated[index] = { ...updated[index], [sub.key]: e.target.value };
                    onChange(updated);
                  }}
                  placeholder={sub.placeholder}
                  disabled={disabled}
                  className="h-8 text-sm"
                />
              </div>
            ))}
          </div>
        </Card>
      ))}
      {!disabled && (
        <Button variant="outline" size="sm" onClick={() => onChange([...items, {}])} className="w-full">
          <Plus className="w-4 h-4 mr-1" /> Agregar
        </Button>
      )}
    </div>
  );
}
