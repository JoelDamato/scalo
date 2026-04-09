import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Form,
  FormControl,
  FormDescription,
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
import { useCreateArcaInvoice, useArcaConfig, useFinanceRecords } from '@/hooks/useFinance';
import { toast } from 'sonner';
import { AlertCircle } from 'lucide-react';
import { Alert, AlertDescription } from '@/components/ui/alert';

const formSchema = z.object({
  finance_record_id: z.string().optional(),
  cliente_nombre: z.string().min(1, 'Nombre del cliente requerido'),
  cliente_cuit_dni: z.string().min(7, 'CUIT/DNI requerido'),
  importe_total: z.string().min(1, 'Importe requerido'),
  tipo_comprobante: z.string(),
});

const NO_RECORD_VALUE = 'none';

type FormData = z.infer<typeof formSchema>;

interface CreateInvoiceFormProps {
  onSuccess: () => void;
}

export function CreateInvoiceForm({ onSuccess }: CreateInvoiceFormProps) {
  const { data: config } = useArcaConfig();
  const { data: records = [] } = useFinanceRecords();
  const createInvoice = useCreateArcaInvoice();

  const pendingRecords = records.filter(r => r.payment_status !== 'paid');

  const form = useForm<FormData>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      finance_record_id: NO_RECORD_VALUE,
      cliente_nombre: '',
      cliente_cuit_dni: '',
      importe_total: '',
      tipo_comprobante: config?.tipo_comprobante || 'factura_c',
    },
  });

  const onSubmit = async (data: FormData) => {
    try {
      await createInvoice.mutateAsync({
        finance_record_id:
          data.finance_record_id && data.finance_record_id !== NO_RECORD_VALUE
            ? data.finance_record_id
            : null,
        cliente_nombre: data.cliente_nombre,
        cliente_cuit_dni: data.cliente_cuit_dni,
        importe_total: parseFloat(data.importe_total),
        tipo_comprobante: data.tipo_comprobante,
        punto_venta: config?.punto_venta || 1,
        fecha_emision: new Date().toISOString().split('T')[0],
        estado: 'draft',
      });
      toast.success('Factura creada como borrador');
      onSuccess();
    } catch (error) {
      toast.error('Error al crear la factura');
    }
  };

  // Auto-fill when selecting a finance record
  const handleRecordSelect = (recordId: string) => {
    if (recordId === NO_RECORD_VALUE) {
      form.setValue('finance_record_id', NO_RECORD_VALUE);
      return;
    }

    form.setValue('finance_record_id', recordId);
    const record = records.find(r => r.id === recordId);
    if (record) {
      form.setValue('importe_total', record.amount.toString());
    }
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
        <Alert className="border-blue-500/30 bg-blue-500/10">
          <AlertCircle className="h-4 w-4 text-blue-500" />
          <AlertDescription className="text-sm text-muted-foreground">
            La factura se creará como borrador. La integración real con AFIP requiere 
            configuración adicional del certificado digital.
          </AlertDescription>
        </Alert>

        {pendingRecords.length > 0 && (
          <FormField
            control={form.control}
            name="finance_record_id"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Vincular a Registro (opcional)</FormLabel>
                <Select onValueChange={handleRecordSelect} value={field.value}>
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder="Seleccionar registro de ingreso" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    <SelectItem value={NO_RECORD_VALUE}>Sin vincular</SelectItem>
                    {pendingRecords.map((record) => (
                      <SelectItem key={record.id} value={record.id}>
                        {record.description} - ${record.amount}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <FormDescription>
                  Vincula esta factura a un registro de ingreso existente
                </FormDescription>
                <FormMessage />
              </FormItem>
            )}
          />
        )}

        <FormField
          control={form.control}
          name="cliente_nombre"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Nombre del Cliente</FormLabel>
              <FormControl>
                <Input placeholder="Juan Pérez / Empresa SRL" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="cliente_cuit_dni"
          render={({ field }) => (
            <FormItem>
              <FormLabel>CUIT/DNI del Cliente</FormLabel>
              <FormControl>
                <Input placeholder="20123456789" {...field} />
              </FormControl>
              <FormDescription>
                Para Factura C a consumidor final: 0
              </FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />

        <div className="grid grid-cols-2 gap-4">
          <FormField
            control={form.control}
            name="importe_total"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Importe Total (ARS)</FormLabel>
                <FormControl>
                  <Input type="number" step="0.01" placeholder="0.00" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="tipo_comprobante"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Tipo Comprobante</FormLabel>
                <Select onValueChange={field.onChange} value={field.value}>
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    <SelectItem value="factura_c">Factura C</SelectItem>
                    <SelectItem value="factura_b">Factura B</SelectItem>
                    <SelectItem value="recibo_c">Recibo C</SelectItem>
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        <div className="flex justify-end gap-3 pt-4">
          <Button type="submit" disabled={createInvoice.isPending}>
            Crear Borrador
          </Button>
        </div>
      </form>
    </Form>
  );
}
