import { useState, useEffect } from 'react';
import { Sparkles, Code2, Database, Server, Shield, Puzzle, Loader2, Save, ChevronDown, ChevronRight, Pencil, X } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { useInitiativeTechDocs, useCreateTechDocs, useUpdateTechDocs, useInitiativeFeatures, useInitiative } from '@/hooks/useInitiatives';
import { useAIGeneration } from '@/hooks/useAIGeneration';
import { useAuth } from '@/hooks/useAuth';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';

interface TechDocsStepProps {
  initiativeId: string;
}

interface TechSection {
  key: string;
  title: string;
  icon: React.ReactNode;
  placeholder: string;
  isJson?: boolean;
}

const techSections: TechSection[] = [
  { key: 'tech_stack', title: 'Tech Stack', icon: <Code2 className="w-4 h-4" />, placeholder: 'Tecnologías recomendadas...', isJson: true },
  { key: 'frontend_guidelines', title: 'Frontend Guidelines', icon: <Code2 className="w-4 h-4" />, placeholder: 'Guías de desarrollo frontend...' },
  { key: 'backend_structure', title: 'Backend Structure', icon: <Server className="w-4 h-4" />, placeholder: 'Estructura del backend...' },
  { key: 'api_routes', title: 'API Routes', icon: <Server className="w-4 h-4" />, placeholder: 'Rutas de la API...', isJson: true },
  { key: 'database_schema', title: 'Database Schema', icon: <Database className="w-4 h-4" />, placeholder: 'Estructura de la base de datos...' },
  { key: 'authentication', title: 'Authentication', icon: <Shield className="w-4 h-4" />, placeholder: 'Flujos de autenticación...' },
  { key: 'integrations', title: 'Integrations', icon: <Puzzle className="w-4 h-4" />, placeholder: 'Integraciones externas...' },
];

export function TechDocsStep({ initiativeId }: TechDocsStepProps) {
  const { isAdmin } = useAuth();
  const { data: initiative } = useInitiative(initiativeId);
  const { data: techDocs, isLoading } = useInitiativeTechDocs(initiativeId);
  const { data: features = [] } = useInitiativeFeatures(initiativeId);
  const createTechDocs = useCreateTechDocs();
  const updateTechDocs = useUpdateTechDocs();
  const { generate, isGenerating } = useAIGeneration();

  const [openSections, setOpenSections] = useState<Set<string>>(new Set(['tech_stack']));
  const [localValues, setLocalValues] = useState<Record<string, string>>({});
  const [generatingField, setGeneratingField] = useState<string | null>(null);
  const [editingField, setEditingField] = useState<string | null>(null);

  useEffect(() => {
    if (techDocs) {
      const values: Record<string, string> = {};
      techSections.forEach(section => {
        const value = (techDocs as unknown as Record<string, unknown>)[section.key];
        if (section.isJson && value) {
          values[section.key] = typeof value === 'string' ? value : JSON.stringify(value, null, 2);
        } else {
          values[section.key] = (value as string) || '';
        }
      });
      setLocalValues(values);
    }
  }, [techDocs]);

  const toggleSection = (key: string) => {
    const newOpen = new Set(openSections);
    if (newOpen.has(key)) newOpen.delete(key);
    else newOpen.add(key);
    setOpenSections(newOpen);
  };

  const startEditing = (key: string) => {
    setEditingField(key);
    if (!openSections.has(key)) {
      toggleSection(key);
    }
  };

  const cancelEditing = () => {
    setEditingField(null);
    // Reset to original value
    if (techDocs) {
      const section = techSections.find(s => s.key === editingField);
      if (section) {
        const value = (techDocs as unknown as Record<string, unknown>)[section.key];
        if (section.isJson && value) {
          setLocalValues(prev => ({
            ...prev,
            [section.key]: typeof value === 'string' ? value : JSON.stringify(value, null, 2)
          }));
        } else {
          setLocalValues(prev => ({
            ...prev,
            [section.key]: (value as string) || ''
          }));
        }
      }
    }
  };

  const handleSave = async (key: string) => {
    try {
      const value = localValues[key];
      let parsedValue: unknown = value;
      
      // Try to parse JSON fields
      const section = techSections.find(s => s.key === key);
      if (section?.isJson && value) {
        try {
          parsedValue = JSON.parse(value);
        } catch {
          // Keep as string if not valid JSON
        }
      }

      if (!techDocs) {
        await createTechDocs.mutateAsync({ initiative_id: initiativeId });
      }
      
      await updateTechDocs.mutateAsync({
        initiativeId,
        data: { [key]: parsedValue },
      });
      
      toast.success('Guardado');
      setEditingField(null);
    } catch (error) {
      toast.error('Error al guardar');
    }
  };

  const handleGenerateField = async (field: string) => {
    if (!initiative) return;
    
    setGeneratingField(field);
    
    const content = await generate('tech_docs', {
      initiativeName: initiative.name,
      productType: initiative.product_type,
      features: features.map(f => ({
        name: f.name,
        description: f.description,
        priority: f.priority,
        user_story: f.user_story,
      })),
    }, field);

    if (content) {
      const section = techSections.find(s => s.key === field);
      let valueToSet: string;
      
      if (section?.isJson && typeof content === 'object') {
        valueToSet = JSON.stringify(content, null, 2);
      } else if (typeof content === 'string') {
        valueToSet = content;
      } else {
        valueToSet = JSON.stringify(content, null, 2);
      }
      
      setLocalValues(prev => ({ ...prev, [field]: valueToSet }));
      
      // Auto-save after generating
      if (!techDocs) {
        await createTechDocs.mutateAsync({ initiative_id: initiativeId });
      }
      
      let parsedValue: unknown = valueToSet;
      if (section?.isJson) {
        try {
          parsedValue = JSON.parse(valueToSet);
        } catch {
          // Keep as string
        }
      }
      
      await updateTechDocs.mutateAsync({
        initiativeId,
        data: { [field]: parsedValue },
      });
      
      toast.success('Contenido generado con IA');
    }
    
    setGeneratingField(null);
  };

  const handleGenerateAll = async () => {
    for (const section of techSections) {
      await handleGenerateField(section.key);
    }
  };

  if (isLoading) {
    return <div className="animate-pulse space-y-4">
      {[1, 2, 3].map(i => <div key={i} className="h-24 bg-muted rounded-lg" />)}
    </div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Technical Documentation</h2>
          <p className="text-muted-foreground">Especificaciones técnicas para el desarrollo</p>
        </div>
        {isAdmin && (
          <Button variant="outline" onClick={handleGenerateAll} disabled={isGenerating}>
            {isGenerating ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Sparkles className="w-4 h-4 mr-2" />}
            Generar Todo con IA
          </Button>
        )}
      </div>

      <Card>
        <CardContent className="p-0">
          {techSections.map((section, index) => {
            const isOpen = openSections.has(section.key);
            const value = localValues[section.key] || '';
            const hasContent = value.length > 0;
            const isGeneratingThis = generatingField === section.key;
            const isEditingThis = editingField === section.key;

            return (
              <Collapsible key={section.key} open={isOpen} onOpenChange={() => toggleSection(section.key)}>
                <div className={cn('border-b last:border-b-0', isOpen && 'bg-muted/30')}>
                  <CollapsibleTrigger asChild>
                    <button className="w-full flex items-center justify-between p-4 text-left hover:bg-muted/50 transition-colors">
                      <div className="flex items-center gap-3">
                        {isOpen ? <ChevronDown className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
                        <span className="text-muted-foreground">{section.icon}</span>
                        <span className="font-medium">{section.title}</span>
                        {hasContent && (
                          <span className="text-xs text-muted-foreground bg-muted px-2 py-0.5 rounded">
                            Completado
                          </span>
                        )}
                      </div>
                      {isAdmin && !isEditingThis && (
                        <div className="flex gap-1" onClick={(e) => e.stopPropagation()}>
                          <Button
                            variant="ghost"
                            size="sm"
                            className="h-8 gap-1"
                            onClick={() => handleGenerateField(section.key)}
                            disabled={isGeneratingThis || isGenerating}
                          >
                            {isGeneratingThis ? (
                              <Loader2 className="w-4 h-4 animate-spin" />
                            ) : (
                              <Sparkles className="w-4 h-4" />
                            )}
                            <span className="hidden sm:inline">IA</span>
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            className="h-8 gap-1"
                            onClick={() => startEditing(section.key)}
                          >
                            <Pencil className="w-4 h-4" />
                            <span className="hidden sm:inline">Manual</span>
                          </Button>
                        </div>
                      )}
                    </button>
                  </CollapsibleTrigger>
                  <CollapsibleContent>
                    <div className="px-4 pb-4 pt-2 border-t">
                      {isEditingThis ? (
                        <div className="space-y-2">
                          <Textarea
                            placeholder={section.placeholder}
                            value={value}
                            rows={section.isJson ? 10 : 4}
                            onChange={(e) => setLocalValues(prev => ({ ...prev, [section.key]: e.target.value }))}
                            className={cn('font-mono text-sm', section.isJson && 'text-xs')}
                          />
                          <div className="flex gap-2">
                            <Button size="sm" onClick={() => handleSave(section.key)} disabled={updateTechDocs.isPending}>
                              <Save className="w-4 h-4 mr-1" />
                              Guardar
                            </Button>
                            <Button size="sm" variant="outline" onClick={cancelEditing}>
                              <X className="w-4 h-4 mr-1" />
                              Cancelar
                            </Button>
                          </div>
                        </div>
                      ) : (
                        <pre className="text-sm text-muted-foreground whitespace-pre-wrap font-mono bg-muted/30 p-3 rounded-md">
                          {value || section.placeholder}
                        </pre>
                      )}
                    </div>
                  </CollapsibleContent>
                </div>
              </Collapsible>
            );
          })}
        </CardContent>
      </Card>
    </div>
  );
}
