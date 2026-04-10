import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useCreateProject } from '@/hooks/useData';
import { useCustomers } from '@/hooks/useCRM';
import { toast } from 'sonner';
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
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

interface CreateProjectDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function CreateProjectDialog({ open, onOpenChange }: CreateProjectDialogProps) {
  const navigate = useNavigate();
  const createProject = useCreateProject();
  const { data: customers = [] } = useCustomers();
  
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    customer_id: '',
    support_active: false,
  });

  const handleCreate = async () => {
    if (!formData.name.trim()) {
      toast.error('Por favor ingresa un nombre para el proyecto');
      return;
    }

    try {
      const project = await createProject.mutateAsync({
        name: formData.name.trim(),
        description: formData.description.trim() || undefined,
        customer_id: formData.customer_id && formData.customer_id !== 'none' ? formData.customer_id : undefined,
        support_active: formData.support_active,
      });
      
      toast.success('Proyecto creado exitosamente');
      onOpenChange(false);
      setFormData({ name: '', description: '', customer_id: '', support_active: false });
      navigate(`/projects/${project.id}`);
    } catch (error) {
      console.error('Error creating project:', error);
      toast.error('Error al crear el proyecto');
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Nuevo Proyecto</DialogTitle>
          <DialogDescription>
            Crea un nuevo proyecto para organizar iniciativas de producto
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <Label htmlFor="name">Nombre del proyecto *</Label>
            <Input
              id="name"
              placeholder="ej: App de Delivery, Portal Web..."
              value={formData.name}
              onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="description">Descripción</Label>
            <Textarea
              id="description"
              placeholder="Describe brevemente el proyecto..."
              value={formData.description}
              onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
              rows={3}
            />
          </div>

          {customers.length > 0 && (
            <div className="space-y-2">
              <Label htmlFor="customer">Cliente (opcional)</Label>
              <Select
                value={formData.customer_id}
                onValueChange={(value) => setFormData(prev => ({ ...prev, customer_id: value }))}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Seleccionar cliente..." />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">Sin cliente asignado</SelectItem>
                  {customers.map((customer) => (
                    <SelectItem key={customer.id} value={customer.id}>
                      {customer.name} {customer.company && `(${customer.company})`}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}

          <div className="flex items-center justify-between rounded-lg border border-border/50 bg-muted/20 p-4">
            <div className="space-y-1">
              <Label htmlFor="support-active">Soporte activo</Label>
              <p className="text-xs text-muted-foreground">
                Marca este proyecto si está actualmente en etapa de mantenimiento o soporte.
              </p>
            </div>
            <Switch
              id="support-active"
              checked={formData.support_active}
              onCheckedChange={(checked) => setFormData(prev => ({ ...prev, support_active: checked }))}
            />
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancelar
          </Button>
          <Button onClick={handleCreate} disabled={createProject.isPending}>
            {createProject.isPending ? 'Creando...' : 'Crear Proyecto'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
