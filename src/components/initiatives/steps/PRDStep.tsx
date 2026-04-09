import { useState } from 'react';
import { Sparkles, FileText, ChevronDown, ChevronRight, Loader2, CheckCircle2, Pencil, Save, X } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { useInitiativeFeatures, useInitiative } from '@/hooks/useInitiatives';
import { useAIGeneration } from '@/hooks/useAIGeneration';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import type { Json } from '@/integrations/supabase/types';

interface PRDStepProps {
  initiativeId: string;
}

interface FeaturePRD {
  id: string;
  feature_id: string;
  overview: string | null;
  use_cases: Json | null;
  non_functional_requirements: string | null;
  dependencies: string | null;
  edge_cases: string | null;
  acceptance_criteria: string | null;
  design_guidelines: string | null;
  is_completed: boolean;
}

const prdSections = [
  { key: 'overview', title: 'Overview', placeholder: 'Descripción general de la feature...' },
  { key: 'use_cases', title: 'Casos de Uso', placeholder: 'Flujos principales del usuario...' },
  { key: 'non_functional_requirements', title: 'Requisitos No Funcionales', placeholder: 'Performance, seguridad, escalabilidad...' },
  { key: 'dependencies', title: 'Dependencias', placeholder: 'Otras features o sistemas necesarios...' },
  { key: 'edge_cases', title: 'Casos Edge', placeholder: 'Escenarios excepcionales...' },
  { key: 'acceptance_criteria', title: 'Criterios de Aceptación', placeholder: 'Condiciones para considerar completa...' },
  { key: 'design_guidelines', title: 'Guías de Diseño', placeholder: 'Lineamientos de UX/UI...' },
];

export function PRDStep({ initiativeId }: PRDStepProps) {
  const { isAdmin } = useAuth();
  const { data: initiative } = useInitiative(initiativeId);
  const { data: features = [], isLoading } = useInitiativeFeatures(initiativeId);
  const { generate, isGenerating } = useAIGeneration();
  const queryClient = useQueryClient();
  
  const [expandedFeature, setExpandedFeature] = useState<string | null>(null);
  const [generatingFeatureId, setGeneratingFeatureId] = useState<string | null>(null);
  const [editingSection, setEditingSection] = useState<{ featureId: string; sectionKey: string } | null>(null);
  const [editValue, setEditValue] = useState('');
  const [generatingSectionId, setGeneratingSectionId] = useState<{ featureId: string; sectionKey: string } | null>(null);

  // Fetch PRDs for all features
  const { data: prds = [] } = useQuery({
    queryKey: ['initiative-prds', initiativeId],
    queryFn: async () => {
      const featureIds = features.map(f => f.id);
      if (featureIds.length === 0) return [];
      
      const { data, error } = await supabase
        .from('initiative_prds')
        .select('*')
        .in('feature_id', featureIds);
      
      if (error) throw error;
      return data as FeaturePRD[];
    },
    enabled: features.length > 0,
  });

  const createOrUpdatePRD = useMutation({
    mutationFn: async ({ featureId, data }: { featureId: string; data: Record<string, string | null> }) => {
      const existing = prds.find(p => p.feature_id === featureId);
      
      if (existing) {
        const { error } = await supabase
          .from('initiative_prds')
          .update(data)
          .eq('id', existing.id);
        if (error) throw error;
      } else {
        const { error } = await supabase
          .from('initiative_prds')
          .insert({ feature_id: featureId, ...data });
        if (error) throw error;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['initiative-prds', initiativeId] });
    },
  });

  const handleGeneratePRD = async (featureId: string, featureName: string, featureDescription: string | null) => {
    if (!initiative) return;
    
    setGeneratingFeatureId(featureId);
    
    const content = await generate('prd', {
      initiativeName: initiative.name,
      productType: initiative.product_type,
      featureName,
      featureDescription: featureDescription || undefined,
    });

    if (content && typeof content === 'string') {
      // Parse the generated content into sections
      const sections: Record<string, string> = {};
      let currentSection = '';
      let currentContent: string[] = [];
      
      content.split('\n').forEach(line => {
        const sectionMatch = line.match(/^#+\s*(.+)/);
        if (sectionMatch) {
          if (currentSection && currentContent.length) {
            const key = prdSections.find(s => 
              s.title.toLowerCase().includes(currentSection.toLowerCase()) ||
              currentSection.toLowerCase().includes(s.title.toLowerCase())
            )?.key;
            if (key) sections[key] = currentContent.join('\n').trim();
          }
          currentSection = sectionMatch[1];
          currentContent = [];
        } else {
          currentContent.push(line);
        }
      });
      
      // Save last section
      if (currentSection && currentContent.length) {
        const key = prdSections.find(s => 
          s.title.toLowerCase().includes(currentSection.toLowerCase()) ||
          currentSection.toLowerCase().includes(s.title.toLowerCase())
        )?.key;
        if (key) sections[key] = currentContent.join('\n').trim();
      }

      // If no sections found, put everything in overview
      if (Object.keys(sections).length === 0) {
        sections.overview = content;
      }

      await createOrUpdatePRD.mutateAsync({
        featureId,
        data: sections,
      });

      toast.success('PRD generado con IA');
    }
    
    setGeneratingFeatureId(null);
  };

  const handleGenerateSection = async (featureId: string, sectionKey: string, featureName: string, featureDescription: string | null) => {
    if (!initiative) return;
    
    setGeneratingSectionId({ featureId, sectionKey });
    
    const sectionTitle = prdSections.find(s => s.key === sectionKey)?.title || sectionKey;
    
    const content = await generate('prd', {
      initiativeName: initiative.name,
      productType: initiative.product_type,
      featureName,
      featureDescription: `${featureDescription || ''}\n\nGenera SOLO la sección: ${sectionTitle}`,
    });

    if (content && typeof content === 'string') {
      await createOrUpdatePRD.mutateAsync({
        featureId,
        data: { [sectionKey]: content },
      });
      toast.success(`${sectionTitle} generado con IA`);
    }
    
    setGeneratingSectionId(null);
  };

  const startEditingSection = (featureId: string, sectionKey: string, value: string) => {
    setEditingSection({ featureId, sectionKey });
    setEditValue(value);
  };

  const cancelEditingSection = () => {
    setEditingSection(null);
    setEditValue('');
  };

  const saveSection = async () => {
    if (!editingSection) return;
    
    await createOrUpdatePRD.mutateAsync({
      featureId: editingSection.featureId,
      data: { [editingSection.sectionKey]: editValue },
    });
    
    toast.success('Sección guardada');
    cancelEditingSection();
  };

  const priorityFeatures = features.filter(f => f.priority === 'must' || f.priority === 'should');

  if (isLoading) {
    return <div className="animate-pulse space-y-4">
      {[1, 2, 3].map(i => <div key={i} className="h-24 bg-muted rounded-lg" />)}
    </div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Product Requirements</h2>
          <p className="text-muted-foreground">Documentación detallada para cada feature prioritaria</p>
        </div>
      </div>

      {priorityFeatures.length === 0 ? (
        <Card className="py-12">
          <CardContent className="text-center text-muted-foreground">
            <FileText className="w-12 h-12 mx-auto mb-4 opacity-50" />
            <p>No hay features prioritarias (Must/Should) definidas.</p>
            <p className="text-sm">Vuelve al paso Features para agregar algunas.</p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {priorityFeatures.map((feature) => {
            const prd = prds.find(p => p.feature_id === feature.id);
            const isExpanded = expandedFeature === feature.id;
            const hasContent = prd && Object.values(prd).some(v => v && typeof v === 'string' && v.length > 0);
            const isGeneratingThis = generatingFeatureId === feature.id;

            return (
              <Card key={feature.id}>
                <Collapsible open={isExpanded} onOpenChange={() => setExpandedFeature(isExpanded ? null : feature.id)}>
                  <CollapsibleTrigger asChild>
                    <CardHeader className="cursor-pointer hover:bg-muted/50 transition-colors">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          {isExpanded ? <ChevronDown className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
                          <div>
                            <CardTitle className="text-base flex items-center gap-2">
                              {feature.name}
                              <Badge variant="outline" className={cn(
                                'text-xs',
                                feature.priority === 'must' ? 'bg-red-500/10 text-red-500' : 'bg-yellow-500/10 text-yellow-500'
                              )}>
                                {feature.priority === 'must' ? 'Must Have' : 'Should Have'}
                              </Badge>
                              {hasContent && (
                                <CheckCircle2 className="w-4 h-4 text-green-500" />
                              )}
                            </CardTitle>
                            <CardDescription className="text-xs mt-1">
                              {feature.description || feature.user_story || 'Sin descripción'}
                            </CardDescription>
                          </div>
                        </div>
                        {isAdmin && (
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleGeneratePRD(feature.id, feature.name, feature.description);
                            }}
                            disabled={isGeneratingThis || isGenerating}
                          >
                            {isGeneratingThis ? (
                              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                            ) : (
                              <Sparkles className="w-4 h-4 mr-2" />
                            )}
                            {hasContent ? 'Regenerar Todo' : 'Generar Todo'}
                          </Button>
                        )}
                      </div>
                    </CardHeader>
                  </CollapsibleTrigger>
                  <CollapsibleContent>
                    <CardContent className="pt-0 space-y-4">
                      {prdSections.map((section) => {
                        const value = prd?.[section.key as keyof FeaturePRD];
                        const displayValue = typeof value === 'string' ? value : 
                          value ? JSON.stringify(value, null, 2) : '';
                        const isEditingThis = editingSection?.featureId === feature.id && editingSection?.sectionKey === section.key;
                        const isGeneratingThisSection = generatingSectionId?.featureId === feature.id && generatingSectionId?.sectionKey === section.key;
                        
                        return (
                          <div key={section.key} className="space-y-2">
                            <div className="flex items-center justify-between">
                              <label className="text-sm font-medium">{section.title}</label>
                              {isAdmin && !isEditingThis && (
                                <div className="flex gap-1">
                                  <Button
                                    variant="ghost"
                                    size="sm"
                                    className="h-7 gap-1"
                                    onClick={() => handleGenerateSection(feature.id, section.key, feature.name, feature.description)}
                                    disabled={isGeneratingThisSection || isGenerating}
                                  >
                                    {isGeneratingThisSection ? (
                                      <Loader2 className="w-3 h-3 animate-spin" />
                                    ) : (
                                      <Sparkles className="w-3 h-3" />
                                    )}
                                    <span className="text-xs">IA</span>
                                  </Button>
                                  <Button
                                    variant="ghost"
                                    size="sm"
                                    className="h-7 gap-1"
                                    onClick={() => startEditingSection(feature.id, section.key, displayValue)}
                                  >
                                    <Pencil className="w-3 h-3" />
                                    <span className="text-xs">Manual</span>
                                  </Button>
                                </div>
                              )}
                            </div>
                            {isEditingThis ? (
                              <div className="space-y-2">
                                <Textarea
                                  placeholder={section.placeholder}
                                  value={editValue}
                                  rows={4}
                                  onChange={(e) => setEditValue(e.target.value)}
                                  className="text-sm"
                                />
                                <div className="flex gap-2">
                                  <Button size="sm" onClick={saveSection} disabled={createOrUpdatePRD.isPending}>
                                    <Save className="w-4 h-4 mr-1" />
                                    Guardar
                                  </Button>
                                  <Button size="sm" variant="outline" onClick={cancelEditingSection}>
                                    <X className="w-4 h-4 mr-1" />
                                    Cancelar
                                  </Button>
                                </div>
                              </div>
                            ) : (
                              <p className="text-sm text-muted-foreground whitespace-pre-wrap p-3 bg-muted/30 rounded-md min-h-[60px]">
                                {displayValue || section.placeholder}
                              </p>
                            )}
                          </div>
                        );
                      })}
                    </CardContent>
                  </CollapsibleContent>
                </Collapsible>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}
