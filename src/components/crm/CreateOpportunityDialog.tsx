import { useState, useEffect } from 'react';
import { useCreateOpportunity, useCustomers, CustomerStage } from '@/hooks/useCRM';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { toast } from 'sonner';

interface CreateOpportunityDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  preselectedCustomerId?: string;
  defaultStage?: CustomerStage;
}

const stageOptions: { value: CustomerStage; label: string }[] = [
  { value: 'lead', label: 'Lead' },
  { value: 'prospect', label: 'Prospecto' },
  { value: 'negotiation', label: 'En negociación' },
];

export function CreateOpportunityDialog({ 
  open, 
  onOpenChange, 
  preselectedCustomerId,
  defaultStage = 'lead'
}: CreateOpportunityDialogProps) {
  const createOpportunity = useCreateOpportunity();
  const { data: customers = [] } = useCustomers();
  
  const [formData, setFormData] = useState({
    customer_id: preselectedCustomerId || '',
    title: '',
    value: '',
    currency: 'ARS',
    stage: defaultStage,
    probability: '50',
    expected_close_date: '',
    notes: '',
  });

  // Reset stage when dialog opens with new defaultStage
  useEffect(() => {
    if (open) {
      setFormData(prev => ({ ...prev, stage: defaultStage }));
    }
  }, [open, defaultStage]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.customer_id || !formData.title.trim()) {
      toast.error('Cliente y título son requeridos');
      return;
    }

    try {
      await createOpportunity.mutateAsync({
        customer_id: formData.customer_id,
        title: formData.title,
        value: parseFloat(formData.value) || 0,
        currency: formData.currency,
        stage: formData.stage,
        probability: parseInt(formData.probability) || 50,
        expected_close_date: formData.expected_close_date || null,
        notes: formData.notes || null,
        won_at: null,
        lost_at: null,
        lost_reason: null,
      });
      toast.success('Oportunidad creada');
      onOpenChange(false);
      setFormData({
        customer_id: '',
        title: '',
        value: '',
        currency: 'ARS',
        stage: 'lead',
        probability: '50',
        expected_close_date: '',
        notes: '',
      });
    } catch {
      toast.error('Error al crear oportunidad');
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Nueva oportunidad</DialogTitle>
        </DialogHeader>
        
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label>Cliente *</Label>
            <Select
              value={formData.customer_id}
              onValueChange={(value) => setFormData({ ...formData, customer_id: value })}
            >
              <SelectTrigger>
                <SelectValue placeholder="Seleccionar cliente" />
              </SelectTrigger>
              <SelectContent>
                {customers.map((customer) => (
                  <SelectItem key={customer.id} value={customer.id}>
                    {customer.name} {customer.company ? `(${customer.company})` : ''}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="title">Título *</Label>
            <Input
              id="title"
              value={formData.title}
              onChange={(e) => setFormData({ ...formData, title: e.target.value })}
              placeholder="Ej: Proyecto web para empresa X"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="value">Valor</Label>
              <Input
                id="value"
                type="number"
                value={formData.value}
                onChange={(e) => setFormData({ ...formData, value: e.target.value })}
                placeholder="0"
              />
            </div>
            <div className="space-y-2">
              <Label>Moneda</Label>
              <Select
                value={formData.currency}
                onValueChange={(value) => setFormData({ ...formData, currency: value })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="ARS">ARS</SelectItem>
                  <SelectItem value="USD">USD</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Estado</Label>
              <Select
                value={formData.stage}
                onValueChange={(value) => setFormData({ ...formData, stage: value as CustomerStage })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {stageOptions.map((option) => (
                    <SelectItem key={option.value} value={option.value}>
                      {option.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="probability">Probabilidad %</Label>
              <Input
                id="probability"
                type="number"
                min="0"
                max="100"
                value={formData.probability}
                onChange={(e) => setFormData({ ...formData, probability: e.target.value })}
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="expected_close_date">Fecha estimada de cierre</Label>
            <Input
              id="expected_close_date"
              type="date"
              value={formData.expected_close_date}
              onChange={(e) => setFormData({ ...formData, expected_close_date: e.target.value })}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="notes">Notas</Label>
            <Textarea
              id="notes"
              value={formData.notes}
              onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
              placeholder="Detalles de la oportunidad..."
              rows={3}
            />
          </div>

          <div className="flex justify-end gap-3 pt-4">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancelar
            </Button>
            <Button type="submit" disabled={createOpportunity.isPending}>
              {createOpportunity.isPending ? 'Creando...' : 'Crear oportunidad'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
