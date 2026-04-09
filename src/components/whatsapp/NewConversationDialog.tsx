import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Plus, Phone, User } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { useCreateConversation } from '@/hooks/useWhatsApp';
import { useCustomers } from '@/hooks/useCRM';

const formSchema = z.object({
  phoneNumber: z.string().min(10, 'Número de teléfono inválido'),
  contactName: z.string().optional(),
  customerId: z.string().optional(),
});

type FormValues = z.infer<typeof formSchema>;

interface NewConversationDialogProps {
  onSuccess?: (conversationId: string) => void;
}

export function NewConversationDialog({ onSuccess }: NewConversationDialogProps) {
  const [open, setOpen] = useState(false);
  const { data: customers = [] } = useCustomers();
  const createConversation = useCreateConversation();

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      phoneNumber: '',
      contactName: '',
      customerId: '',
    },
  });

  const onSubmit = async (values: FormValues) => {
    try {
      const result = await createConversation.mutateAsync({
        phoneNumber: values.phoneNumber,
        contactName: values.contactName,
        customerId: values.customerId || undefined,
      });
      
      setOpen(false);
      form.reset();
      onSuccess?.(result.id);
    } catch {
      // Error handled by mutation
    }
  };

  const handleCustomerSelect = (customerId: string) => {
    const customer = customers.find(c => c.id === customerId);
    if (customer) {
      form.setValue('customerId', customerId);
      if (customer.phone) {
        form.setValue('phoneNumber', customer.phone);
      }
      if (customer.name) {
        form.setValue('contactName', customer.name);
      }
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button size="sm">
          <Plus className="h-4 w-4 mr-2" />
          Nueva conversación
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Nueva conversación de WhatsApp</DialogTitle>
          <DialogDescription>
            Inicia una nueva conversación con un contacto o cliente
          </DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="customerId"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Cliente (opcional)</FormLabel>
                  <Select 
                    onValueChange={handleCustomerSelect}
                    value={field.value}
                  >
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Seleccionar cliente existente" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {customers.map((customer) => (
                        <SelectItem key={customer.id} value={customer.id}>
                          <div className="flex items-center gap-2">
                            <User className="h-3 w-3" />
                            {customer.name}
                            {customer.phone && (
                              <span className="text-muted-foreground text-xs">
                                ({customer.phone})
                              </span>
                            )}
                          </div>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="phoneNumber"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Número de teléfono</FormLabel>
                  <FormControl>
                    <div className="relative">
                      <Phone className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                      <Input 
                        {...field} 
                        placeholder="+54 9 11 1234-5678"
                        className="pl-10"
                      />
                    </div>
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="contactName"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Nombre del contacto (opcional)</FormLabel>
                  <FormControl>
                    <Input {...field} placeholder="Juan Pérez" />
                  </FormControl>
                </FormItem>
              )}
            />

            <div className="flex justify-end gap-2 pt-4">
              <Button 
                type="button" 
                variant="outline" 
                onClick={() => setOpen(false)}
              >
                Cancelar
              </Button>
              <Button 
                type="submit" 
                disabled={createConversation.isPending}
              >
                {createConversation.isPending ? 'Creando...' : 'Crear conversación'}
              </Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
