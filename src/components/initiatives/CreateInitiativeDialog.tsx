import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Rocket, FileText, Smartphone, Bot } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useCreateInitiative, ProductType } from '@/hooks/useInitiatives';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';

interface CreateInitiativeDialogProps {
  projectId: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const productTypes: { type: ProductType; label: string; description: string; icon: React.ReactNode }[] = [
  {
    type: 'mvp',
    label: 'MVP',
    description: 'Minimum Viable Product para validar hipótesis',
    icon: <Rocket className="w-5 h-5" />,
  },
  {
    type: 'landing_page',
    label: 'Landing Page',
    description: 'Página web optimizada con secciones según tu negocio',
    icon: <FileText className="w-5 h-5" />,
  },
  {
    type: 'funnel',
    label: 'Funnel',
    description: 'Embudo de conversión multi-paso',
    icon: <FileText className="w-5 h-5" />,
  },
  {
    type: 'app',
    label: 'App Completa',
    description: 'Aplicación web o mobile full-featured',
    icon: <Smartphone className="w-5 h-5" />,
  },
  {
    type: 'automation',
    label: 'Automatización & IA',
    description: 'Chatbots, integraciones y automatización con IA',
    icon: <Bot className="w-5 h-5" />,
  },
];
export function CreateInitiativeDialog({ projectId, open, onOpenChange }: CreateInitiativeDialogProps) {
  const navigate = useNavigate();
  const [name, setName] = useState('');
  const [selectedType, setSelectedType] = useState<ProductType>('mvp');
  const createInitiative = useCreateInitiative();

  const handleCreate = async () => {
    if (!name.trim()) {
      toast.error('Por favor ingresa un nombre para la iniciativa');
      return;
    }

    try {
      const initiative = await createInitiative.mutateAsync({
        project_id: projectId,
        name: name.trim(),
        product_type: selectedType,
      });
      
      toast.success('Iniciativa creada exitosamente');
      onOpenChange(false);
      setName('');
      navigate(`/projects/${projectId}/initiatives/${initiative.id}`);
    } catch (error) {
      toast.error('Error al crear la iniciativa');
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Nueva Iniciativa de Producto</DialogTitle>
          <DialogDescription>
            Define el tipo de producto que vas a desarrollar
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <Label htmlFor="name">Nombre del producto</Label>
            <Input
              id="name"
              placeholder="ej: SantaAnaRider, MiApp..."
              value={name}
              onChange={(e) => setName(e.target.value)}
            />
          </div>

          <div className="space-y-2">
            <Label>Tipo de producto</Label>
            <div className="grid grid-cols-1 gap-2">
              {productTypes.map((pt) => (
                <button
                  key={pt.type}
                  onClick={() => setSelectedType(pt.type)}
                  className={cn(
                    'flex items-center gap-3 p-3 rounded-lg border text-left transition-colors',
                    selectedType === pt.type
                      ? 'border-primary bg-primary/5'
                      : 'border-border hover:border-muted-foreground/50'
                  )}
                >
                  <div
                    className={cn(
                      'p-2 rounded-md',
                      selectedType === pt.type
                        ? 'bg-primary text-primary-foreground'
                        : 'bg-muted text-muted-foreground'
                    )}
                  >
                    {pt.icon}
                  </div>
                  <div>
                    <div className="font-medium">{pt.label}</div>
                    <div className="text-sm text-muted-foreground">{pt.description}</div>
                  </div>
                </button>
              ))}
            </div>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancelar
          </Button>
          <Button onClick={handleCreate} disabled={createInitiative.isPending}>
            {createInitiative.isPending ? 'Creando...' : 'Crear Iniciativa'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
