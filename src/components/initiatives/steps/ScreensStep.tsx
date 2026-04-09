import { useState } from 'react';
import { Sparkles, Layout, Plus, Trash2, Loader2, Smartphone, Monitor, Layers, Pencil } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { useInitiativeScreens, useCreateScreen, useInitiativeFeatures, useInitiative, InitiativeScreen } from '@/hooks/useInitiatives';
import { useAIGeneration } from '@/hooks/useAIGeneration';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';
import { useMutation, useQueryClient } from '@tanstack/react-query';

interface ScreensStepProps {
  initiativeId: string;
}

const flowColors: Record<string, string> = {
  happy_path: 'bg-green-500/10 text-green-500 border-green-500/20',
  onboarding: 'bg-blue-500/10 text-blue-500 border-blue-500/20',
  settings: 'bg-purple-500/10 text-purple-500 border-purple-500/20',
  error: 'bg-red-500/10 text-red-500 border-red-500/20',
  other: 'bg-muted text-muted-foreground border-muted',
};

const screenTypeIcons: Record<string, React.ReactNode> = {
  page: <Monitor className="w-4 h-4" />,
  modal: <Layers className="w-4 h-4" />,
  component: <Smartphone className="w-4 h-4" />,
};

export function ScreensStep({ initiativeId }: ScreensStepProps) {
  const { isAdmin } = useAuth();
  const { data: initiative } = useInitiative(initiativeId);
  const { data: screens = [], isLoading } = useInitiativeScreens(initiativeId);
  const { data: features = [] } = useInitiativeFeatures(initiativeId);
  const createScreen = useCreateScreen();
  const { generate, isGenerating } = useAIGeneration();
  const queryClient = useQueryClient();

  const [dialogOpen, setDialogOpen] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    screen_type: 'page',
    flow_name: 'happy_path',
  });

  const deleteScreen = useMutation({
    mutationFn: async (screenId: string) => {
      const { error } = await supabase
        .from('initiative_screens')
        .delete()
        .eq('id', screenId);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['initiative-screens'] });
      toast.success('Pantalla eliminada');
    },
  });

  const handleCreate = async () => {
    if (!formData.name.trim()) {
      toast.error('El nombre es requerido');
      return;
    }

    try {
      await createScreen.mutateAsync({
        initiative_id: initiativeId,
        name: formData.name,
        description: formData.description,
        step_order: screens.length,
      });
      toast.success('Pantalla creada');
      setDialogOpen(false);
      setFormData({ name: '', description: '', screen_type: 'page', flow_name: 'happy_path' });
    } catch (error) {
      toast.error('Error al crear pantalla');
    }
  };

  const handleGenerateScreens = async () => {
    if (!initiative) return;

    const content = await generate('screens', {
      initiativeName: initiative.name,
      productType: initiative.product_type,
      features: features.map(f => ({
        name: f.name,
        description: f.description,
        priority: f.priority,
        user_story: f.user_story,
      })),
    });

    if (content && typeof content === 'object' && 'screens' in content) {
      const generatedScreens = (content as { screens: Array<{ name: string; description: string; screen_type: string; flow_name: string; step_order: number }> }).screens;
      
      for (const screen of generatedScreens) {
        await createScreen.mutateAsync({
          initiative_id: initiativeId,
          name: screen.name,
          description: screen.description,
          step_order: screen.step_order,
        });
      }
      
      toast.success(`${generatedScreens.length} pantallas generadas con IA`);
    }
  };

  // Group screens by flow
  const screensByFlow = screens.reduce((acc, screen) => {
    const flow = screen.flow_name || 'other';
    if (!acc[flow]) acc[flow] = [];
    acc[flow].push(screen);
    return acc;
  }, {} as Record<string, InitiativeScreen[]>);

  const flows = Object.keys(screensByFlow).length > 0 ? Object.keys(screensByFlow) : ['happy_path'];

  if (isLoading) {
    return <div className="animate-pulse grid grid-cols-3 gap-4">
      {[1, 2, 3].map(i => <div key={i} className="h-48 bg-muted rounded-lg" />)}
    </div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Pantallas y Flujos</h2>
          <p className="text-muted-foreground">User journey y estructura de la aplicación</p>
        </div>
        {isAdmin && (
          <div className="flex gap-2">
            <Button variant="outline" onClick={handleGenerateScreens} disabled={isGenerating}>
              {isGenerating ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Sparkles className="w-4 h-4 mr-2" />}
              Generar con IA
            </Button>
            <Button onClick={() => setDialogOpen(true)}>
              <Plus className="w-4 h-4 mr-2" />
              Agregar Manual
            </Button>
          </div>
        )}
      </div>

      {screens.length === 0 ? (
        <Card className="py-12">
          <CardContent className="text-center text-muted-foreground">
            <Layout className="w-12 h-12 mx-auto mb-4 opacity-50" />
            <p>No hay pantallas definidas aún.</p>
            <p className="text-sm">Usa la IA para generar pantallas o agrega manualmente.</p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-6">
          {flows.map((flow) => (
            <div key={flow}>
              <div className="flex items-center gap-2 mb-3">
                <Badge variant="outline" className={flowColors[flow] || flowColors.other}>
                  {flow.replace('_', ' ')}
                </Badge>
                <span className="text-sm text-muted-foreground">
                  {screensByFlow[flow]?.length || 0} pantallas
                </span>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {(screensByFlow[flow] || [])
                  .sort((a, b) => a.step_order - b.step_order)
                  .map((screen, index) => (
                    <Card key={screen.id} className="relative group">
                      <CardHeader className="pb-2">
                        <div className="flex items-start justify-between">
                          <div className="flex items-center gap-2">
                            <div className="w-6 h-6 rounded-full bg-primary/10 flex items-center justify-center text-xs font-medium">
                              {index + 1}
                            </div>
                            {screenTypeIcons[screen.screen_type || 'page']}
                          </div>
                          {isAdmin && (
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-6 w-6 opacity-0 group-hover:opacity-100 transition-opacity text-destructive"
                              onClick={() => deleteScreen.mutate(screen.id)}
                            >
                              <Trash2 className="w-3 h-3" />
                            </Button>
                          )}
                        </div>
                        <CardTitle className="text-sm">{screen.name}</CardTitle>
                      </CardHeader>
                      <CardContent>
                        <p className="text-xs text-muted-foreground line-clamp-3">
                          {screen.description || 'Sin descripción'}
                        </p>
                      </CardContent>
                    </Card>
                  ))}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Create Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Nueva Pantalla</DialogTitle>
            <DialogDescription>Define una nueva pantalla para el flujo de usuario</DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">Nombre</label>
              <Input
                placeholder="Ej: Login Screen"
                value={formData.name}
                onChange={(e) => setFormData(f => ({ ...f, name: e.target.value }))}
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">Descripción</label>
              <Textarea
                placeholder="¿Qué hace esta pantalla?"
                value={formData.description}
                onChange={(e) => setFormData(f => ({ ...f, description: e.target.value }))}
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <label className="text-sm font-medium">Tipo</label>
                <Select value={formData.screen_type} onValueChange={(v) => setFormData(f => ({ ...f, screen_type: v }))}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="page">Página</SelectItem>
                    <SelectItem value="modal">Modal</SelectItem>
                    <SelectItem value="component">Componente</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">Flujo</label>
                <Select value={formData.flow_name} onValueChange={(v) => setFormData(f => ({ ...f, flow_name: v }))}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="happy_path">Happy Path</SelectItem>
                    <SelectItem value="onboarding">Onboarding</SelectItem>
                    <SelectItem value="settings">Settings</SelectItem>
                    <SelectItem value="error">Error</SelectItem>
                    <SelectItem value="other">Otro</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogOpen(false)}>Cancelar</Button>
            <Button onClick={handleCreate} disabled={createScreen.isPending}>Crear</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
