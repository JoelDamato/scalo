import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { useCreateFinanceRecord, useUpdateFinanceRecord, FinanceRecord } from '@/hooks/useFinance';
import { useProjects } from '@/hooks/useData';
import { toast } from 'sonner';

const formSchema = z.object({
  description: z.string().min(1, 'La descripción es requerida'),
  amount: z.string().min(1, 'El monto es requerido'),
  project_id: z.string().optional(),
  payment_status: z.enum(['pending', 'paid', 'partial']),
  payment_method: z.string().optional(),
  internal_notes: z.string().optional(),
  invoice_date: z.string().optional(),
});

const NO_PROJECT_VALUE = 'none';

type FormData = z.infer<typeof formSchema>;

interface FinanceRecordFormProps {
  record?: FinanceRecord;
  onSuccess: () => void;
}

export function FinanceRecordForm({ record, onSuccess }: FinanceRecordFormProps) {
  const { data: projects = [] } = useProjects();
  const createRecord = useCreateFinanceRecord();
  const updateRecord = useUpdateFinanceRecord();

  const form = useForm<FormData>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      description: record?.description || '',
      amount: record?.amount?.toString() || '',
      project_id: record?.project_id || NO_PROJECT_VALUE,
      payment_status: record?.payment_status || 'pending',
      payment_method: record?.payment_method || '',
      internal_notes: record?.internal_notes || '',
      invoice_date: record?.invoice_date?.split('T')[0] || '',
    },
  });

  const onSubmit = async (data: FormData) => {
    try {
      const payload = {
        description: data.description,
        amount: parseFloat(data.amount),
        project_id:
          data.project_id && data.project_id !== NO_PROJECT_VALUE ? data.project_id : null,
        payment_status: data.payment_status,
        payment_method: data.payment_method || null,
        internal_notes: data.internal_notes || null,
        invoice_date: data.invoice_date || null,
      };

      if (record) {
        await updateRecord.mutateAsync({ id: record.id, ...payload });
        toast.success('Registro actualizado');
      } else {
        await createRecord.mutateAsync(payload);
        toast.success('Registro creado');
      }
      onSuccess();
    } catch (error) {
      toast.error('Error al guardar el registro');
    }
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
        <FormField
          control={form.control}
          name="description"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Descripción</FormLabel>
              <FormControl>
                <Input placeholder="Ej: Desarrollo web mes de enero" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <div className="grid grid-cols-2 gap-4">
          <FormField
            control={form.control}
            name="amount"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Monto (ARS)</FormLabel>
                <FormControl>
                  <Input type="number" step="0.01" placeholder="0.00" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="invoice_date"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Fecha</FormLabel>
                <FormControl>
                  <Input type="date" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        <FormField
          control={form.control}
          name="project_id"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Proyecto (opcional)</FormLabel>
              <Select onValueChange={field.onChange} value={field.value}>
                <FormControl>
                  <SelectTrigger>
                    <SelectValue placeholder="Seleccionar proyecto" />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  <SelectItem value={NO_PROJECT_VALUE}>Sin proyecto</SelectItem>
                  {projects.map((project) => (
                    <SelectItem key={project.id} value={project.id}>
                      {project.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <FormMessage />
            </FormItem>
          )}
        />

        <div className="grid grid-cols-2 gap-4">
          <FormField
            control={form.control}
            name="payment_status"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Estado de Pago</FormLabel>
                <Select onValueChange={field.onChange} value={field.value}>
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    <SelectItem value="pending">Pendiente</SelectItem>
                    <SelectItem value="partial">Parcial</SelectItem>
                    <SelectItem value="paid">Pagado</SelectItem>
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="payment_method"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Método de Pago</FormLabel>
                <Select onValueChange={field.onChange} value={field.value}>
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder="Seleccionar" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    <SelectItem value="transferencia">Transferencia</SelectItem>
                    <SelectItem value="efectivo">Efectivo</SelectItem>
                    <SelectItem value="mercadopago">MercadoPago</SelectItem>
                    <SelectItem value="paypal">PayPal</SelectItem>
                    <SelectItem value="crypto">Crypto</SelectItem>
                    <SelectItem value="otro">Otro</SelectItem>
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        <FormField
          control={form.control}
          name="internal_notes"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Notas Internas</FormLabel>
              <FormControl>
                <Textarea
                  placeholder="Notas privadas sobre este registro..."
                  className="resize-none"
                  {...field}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <div className="flex justify-end gap-3 pt-4">
          <Button type="submit" disabled={createRecord.isPending || updateRecord.isPending}>
            {record ? 'Guardar Cambios' : 'Crear Registro'}
          </Button>
        </div>
      </form>
    </Form>
  );
}
