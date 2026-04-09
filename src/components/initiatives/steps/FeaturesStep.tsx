import { useState } from 'react';
import { Plus, Pencil, Trash2, Sparkles, Loader2, ChevronDown, ChevronUp } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  InitiativeFeature,
  FeaturePriority,
  FeatureComplexity,
  useInitiativeFeatures,
  useCreateFeature,
  useUpdateFeature,
  useDeleteFeature,
  useInitiative,
  useInitiativeBrief,
} from '@/hooks/useInitiatives';
import { useAIGeneration } from '@/hooks/useAIGeneration';
import { useAuth } from '@/hooks/useAuth';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';

interface FeaturesStepProps {
  initiativeId: string;
}

const priorityConfig: Record<FeaturePriority, { label: string; color: string; description: string }> = {
  must: { label: 'Must Have', color: 'bg-red-500/10 text-red-500 border-red-500/20', description: 'Essential for MVP' },
  should: { label: 'Should Have', color: 'bg-yellow-500/10 text-yellow-500 border-yellow-500/20', description: 'Important but not critical' },
  could: { label: 'Could Have', color: 'bg-blue-500/10 text-blue-500 border-blue-500/20', description: 'Nice to have' },
  wont: { label: "Won't Have", color: 'bg-muted text-muted-foreground border-muted', description: 'Not for this release' },
};

const complexityConfig: Record<FeatureComplexity, { label: string; color: string }> = {
  easy: { label: 'Easy', color: 'bg-green-500/10 text-green-500' },
  medium: { label: 'Medium', color: 'bg-yellow-500/10 text-yellow-500' },
  hard: { label: 'Hard', color: 'bg-red-500/10 text-red-500' },
};

export function FeaturesStep({ initiativeId }: FeaturesStepProps) {
  const { isAdmin } = useAuth();
  const { data: initiative } = useInitiative(initiativeId);
  const { data: brief } = useInitiativeBrief(initiativeId);
  const { data: features = [], isLoading } = useInitiativeFeatures(initiativeId);
  const createFeature = useCreateFeature();
  const updateFeature = useUpdateFeature();
  const deleteFeature = useDeleteFeature();
  const { generate, isGenerating } = useAIGeneration();
  
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingFeature, setEditingFeature] = useState<InitiativeFeature | null>(null);
  const [expandedFeatures, setExpandedFeatures] = useState<Set<string>>(new Set());

  const toggleExpanded = (featureId: string) => {
    setExpandedFeatures(prev => {
      const next = new Set(prev);
      if (next.has(featureId)) {
        next.delete(featureId);
      } else {
        next.add(featureId);
      }
      return next;
    });
  };
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    priority: 'should' as FeaturePriority,
    complexity: 'medium' as FeatureComplexity,
    user_story: '',
  });

  const resetForm = () => {
    setFormData({
      name: '',
      description: '',
      priority: 'should',
      complexity: 'medium',
      user_story: '',
    });
    setEditingFeature(null);
  };

  const openCreateDialog = () => {
    resetForm();
    setDialogOpen(true);
  };

  const openEditDialog = (feature: InitiativeFeature) => {
    setEditingFeature(feature);
    setFormData({
      name: feature.name,
      description: feature.description || '',
      priority: feature.priority,
      complexity: feature.complexity,
      user_story: feature.user_story || '',
    });
    setDialogOpen(true);
  };

  const handleSubmit = async () => {
    if (!formData.name.trim()) {
      toast.error('El nombre es requerido');
      return;
    }

    try {
      if (editingFeature) {
        await updateFeature.mutateAsync({
          featureId: editingFeature.id,
          data: formData,
        });
        toast.success('Feature actualizado');
      } else {
        await createFeature.mutateAsync({
          initiative_id: initiativeId,
          ...formData,
        });
        toast.success('Feature creado');
      }
      setDialogOpen(false);
      resetForm();
    } catch (error) {
      toast.error('Error al guardar');
    }
  };

  const handleDelete = async (featureId: string) => {
    if (!confirm('¿Estás seguro de eliminar este feature?')) return;
    
    try {
      await deleteFeature.mutateAsync(featureId);
      toast.success('Feature eliminado');
    } catch (error) {
      toast.error('Error al eliminar');
    }
  };

  const handleGenerateFeatures = async () => {
    if (!initiative) return;

    const content = await generate('features', {
      initiativeName: initiative.name,
      productType: initiative.product_type,
      brief: brief ? Object.fromEntries(
        Object.entries(brief).filter(([k, v]) => v && typeof v === 'string')
      ) : undefined,
    });

    if (content && typeof content === 'object' && 'features' in content) {
      const generatedFeatures = (content as { features: Array<{ name: string; description: string; priority: string; complexity: string; user_story: string }> }).features;
      
      for (const feature of generatedFeatures) {
        await createFeature.mutateAsync({
          initiative_id: initiativeId,
          name: feature.name,
          description: feature.description,
          priority: feature.priority as FeaturePriority,
        });
      }
      
      toast.success(`${generatedFeatures.length} features generados con IA`);
    }
  };

  const getFeaturesByPriority = (priority: FeaturePriority) => 
    features.filter(f => f.priority === priority);

  if (isLoading) {
    return <div className="animate-pulse grid grid-cols-4 gap-4">
      {[1, 2, 3, 4].map(i => (
        <div key={i} className="h-64 bg-muted rounded-lg" />
      ))}
    </div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Feature Ideation</h2>
          <p className="text-muted-foreground">Define and prioritize features with MoSCoW method</p>
        </div>
        {isAdmin && (
          <div className="flex gap-2">
            <Button variant="outline" onClick={handleGenerateFeatures} disabled={isGenerating}>
              {isGenerating ? (
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              ) : (
                <Sparkles className="w-4 h-4 mr-2" />
              )}
              Generar con IA
            </Button>
            <Button onClick={openCreateDialog}>
              <Plus className="w-4 h-4 mr-2" />
              Agregar Manual
            </Button>
          </div>
        )}
      </div>

      {/* Pro Tips */}
      <Card className="bg-primary/5 border-primary/20">
        <CardContent className="p-4">
          <div className="flex items-start gap-3">
            <div className="w-2 h-2 rounded-full bg-primary mt-2" />
            <div>
              <p className="font-medium text-sm">First Version Development</p>
              <p className="text-sm text-muted-foreground">
                <span className="text-primary font-medium">Must Have (MVP)</span> and{' '}
                <span className="text-primary font-medium">Should Have (MVP)</span> features will be included in the first version.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* MoSCoW Columns */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {(Object.keys(priorityConfig) as FeaturePriority[]).map((priority) => (
          <Card key={priority} className="h-fit">
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <CardTitle className="text-sm">{priorityConfig[priority].label}</CardTitle>
                {isAdmin && (
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-6 w-6"
                    onClick={() => {
                      resetForm();
                      setFormData(f => ({ ...f, priority }));
                      setDialogOpen(true);
                    }}
                  >
                    <Plus className="w-4 h-4" />
                  </Button>
                )}
              </div>
              <CardDescription className="text-xs">
                {priorityConfig[priority].description}
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-2">
              {getFeaturesByPriority(priority).map((feature) => {
                const isExpanded = expandedFeatures.has(feature.id);
                return (
                  <div
                    key={feature.id}
                    className="rounded-lg border bg-card hover:shadow-sm transition-all"
                  >
                    <div
                      className="p-3 cursor-pointer select-none"
                      onClick={() => toggleExpanded(feature.id)}
                    >
                      <div className="flex items-start justify-between gap-2">
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-1.5">
                            {isExpanded ? (
                              <ChevronUp className="w-3.5 h-3.5 text-muted-foreground shrink-0" />
                            ) : (
                              <ChevronDown className="w-3.5 h-3.5 text-muted-foreground shrink-0" />
                            )}
                            <h4 className={cn("font-medium text-sm", !isExpanded && "truncate")}>
                              {feature.name}
                            </h4>
                          </div>
                          <div className="flex items-center gap-1 mt-1 ml-5">
                            <Badge variant="outline" className={cn('text-xs', complexityConfig[feature.complexity].color)}>
                              {complexityConfig[feature.complexity].label}
                            </Badge>
                            <Badge variant="outline" className="text-xs">
                              {feature.status}
                            </Badge>
                          </div>
                        </div>
                        {isAdmin && (
                          <div className="flex gap-1 shrink-0">
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-6 w-6"
                              onClick={(e) => { e.stopPropagation(); openEditDialog(feature); }}
                            >
                              <Pencil className="w-3 h-3" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-6 w-6 text-destructive"
                              onClick={(e) => { e.stopPropagation(); handleDelete(feature.id); }}
                            >
                              <Trash2 className="w-3 h-3" />
                            </Button>
                          </div>
                        )}
                      </div>
                      {!isExpanded && feature.description && (
                        <p className="text-xs text-muted-foreground mt-2 ml-5 line-clamp-2">
                          {feature.description}
                        </p>
                      )}
                    </div>

                    {isExpanded && (
                      <div className="px-3 pb-3 ml-5 space-y-3 border-t pt-3">
                        {feature.description && (
                          <div>
                            <p className="text-xs font-medium text-muted-foreground mb-1">Descripción</p>
                            <p className="text-sm">{feature.description}</p>
                          </div>
                        )}
                        {feature.user_story && (
                          <div>
                            <p className="text-xs font-medium text-muted-foreground mb-1">User Story</p>
                            <p className="text-sm italic">{feature.user_story}</p>
                          </div>
                        )}
                        {feature.acceptance_criteria && feature.acceptance_criteria.length > 0 && (
                          <div>
                            <p className="text-xs font-medium text-muted-foreground mb-1">Criterios de Aceptación</p>
                            <ul className="text-sm space-y-1">
                              {feature.acceptance_criteria.map((criteria, idx) => (
                                <li key={idx} className="flex items-start gap-1.5">
                                  <span className="text-primary mt-0.5">•</span>
                                  <span>{criteria}</span>
                                </li>
                              ))}
                            </ul>
                          </div>
                        )}
                        {!feature.description && !feature.user_story && (!feature.acceptance_criteria || feature.acceptance_criteria.length === 0) && (
                          <p className="text-xs text-muted-foreground italic">Sin detalles adicionales</p>
                        )}
                      </div>
                    )}
                  </div>
                );
              })}
              {getFeaturesByPriority(priority).length === 0 && (
                <p className="text-xs text-muted-foreground text-center py-4">
                  No features yet
                </p>
              )}
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Create/Edit Dialog */}
      <Dialog open={dialogOpen} onOpenChange={(open) => { setDialogOpen(open); if (!open) resetForm(); }}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{editingFeature ? 'Edit Feature' : 'New Feature'}</DialogTitle>
            <DialogDescription>
              Define the feature details and priority
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">Name</label>
              <Input
                placeholder="Feature name"
                value={formData.name}
                onChange={(e) => setFormData(f => ({ ...f, name: e.target.value }))}
              />
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">Description</label>
              <Textarea
                placeholder="What does this feature do?"
                value={formData.description}
                onChange={(e) => setFormData(f => ({ ...f, description: e.target.value }))}
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <label className="text-sm font-medium">Priority</label>
                <Select
                  value={formData.priority}
                  onValueChange={(v) => setFormData(f => ({ ...f, priority: v as FeaturePriority }))}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {(Object.keys(priorityConfig) as FeaturePriority[]).map((p) => (
                      <SelectItem key={p} value={p}>
                        {priorityConfig[p].label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium">Complexity</label>
                <Select
                  value={formData.complexity}
                  onValueChange={(v) => setFormData(f => ({ ...f, complexity: v as FeatureComplexity }))}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {(Object.keys(complexityConfig) as FeatureComplexity[]).map((c) => (
                      <SelectItem key={c} value={c}>
                        {complexityConfig[c].label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">User Story (optional)</label>
              <Textarea
                placeholder="As a [user], I want [feature] so that [benefit]..."
                value={formData.user_story}
                onChange={(e) => setFormData(f => ({ ...f, user_story: e.target.value }))}
              />
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleSubmit} disabled={createFeature.isPending || updateFeature.isPending}>
              {editingFeature ? 'Update' : 'Create'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
