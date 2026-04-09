import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
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
import { useCreateExpense, useUpdateExpense, Expense, EXPENSE_CATEGORIES } from '@/hooks/useExpenses';
import { toast } from 'sonner';

const formSchema = z.object({
  category: z.enum(['lovable', 'meta_ads', 'google_ads', 'hosting', 'software', 'editor', 'freelancer', 'marketing', 'other']),
  description: z.string().min(1, 'La descripción es requerida'),
  amount: z.string().min(1, 'El monto es requerido'),
  currency: z.string().default('ARS'),
  expense_date: z.string().min(1, 'La fecha es requerida'),
  is_recurring: z.boolean().default(false),
  recurring_interval: z.string().optional(),
  vendor_name: z.string().optional(),
  notes: z.string().optional(),
});

type FormData = z.infer<typeof formSchema>;

interface ExpenseFormProps {
  expense?: Expense;
  onSuccess: () => void;
}

export function ExpenseForm({ expense, onSuccess }: ExpenseFormProps) {
  const createExpense = useCreateExpense();
  const updateExpense = useUpdateExpense();

  const form = useForm<FormData>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      category: expense?.category || 'other',
      description: expense?.description || '',
      amount: expense?.amount?.toString() || '',
      currency: expense?.currency || 'ARS',
      expense_date: expense?.expense_date?.split('T')[0] || new Date().toISOString().split('T')[0],
      is_recurring: expense?.is_recurring || false,
      recurring_interval: expense?.recurring_interval || 'monthly',
      vendor_name: expense?.vendor_name || '',
      notes: expense?.notes || '',
    },
  });

  const isRecurring = form.watch('is_recurring');

  const onSubmit = async (data: FormData) => {
    try {
      const payload = {
        category: data.category,
        description: data.description,
        amount: parseFloat(data.amount),
        currency: data.currency,
        expense_date: data.expense_date,
        is_recurring: data.is_recurring,
        recurring_interval: data.is_recurring ? data.recurring_interval || null : null,
        vendor_name: data.vendor_name || null,
        notes: data.notes || null,
      };

      if (expense) {
        await updateExpense.mutateAsync({ id: expense.id, ...payload });
        toast.success('Gasto actualizado');
      } else {
        await createExpense.mutateAsync(payload);
        toast.success('Gasto registrado');
      }
      onSuccess();
    } catch (error) {
      toast.error('Error al guardar el gasto');
    }
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
        <FormField
          control={form.control}
          name="category"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Categoría</FormLabel>
              <Select onValueChange={field.onChange} value={field.value}>
                <FormControl>
                  <SelectTrigger>
                    <SelectValue placeholder="Seleccionar categoría" />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  {EXPENSE_CATEGORIES.map((cat) => (
                    <SelectItem key={cat.value} value={cat.value}>
                      <span className="flex items-center gap-2">
                        <span>{cat.icon}</span>
                        <span>{cat.label}</span>
                      </span>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="description"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Descripción</FormLabel>
              <FormControl>
                <Input placeholder="Ej: Suscripción mensual Lovable Pro" {...field} />
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
                <FormLabel>Monto</FormLabel>
                <FormControl>
                  <Input type="number" step="0.01" placeholder="0.00" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="currency"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Moneda</FormLabel>
                <Select onValueChange={field.onChange} value={field.value}>
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    <SelectItem value="ARS">ARS $</SelectItem>
                    <SelectItem value="USD">USD $</SelectItem>
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        <FormField
          control={form.control}
          name="expense_date"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Fecha del Gasto</FormLabel>
              <FormControl>
                <Input type="date" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="vendor_name"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Proveedor (opcional)</FormLabel>
              <FormControl>
                <Input placeholder="Ej: Meta, Google, Fiverr..." {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <div className="flex items-center justify-between p-4 rounded-lg border border-border/50 bg-muted/20">
          <div className="space-y-0.5">
            <FormLabel>Gasto Recurrente</FormLabel>
            <p className="text-xs text-muted-foreground">
              Se repite periódicamente
            </p>
          </div>
          <FormField
            control={form.control}
            name="is_recurring"
            render={({ field }) => (
              <FormControl>
                <Switch checked={field.value} onCheckedChange={field.onChange} />
              </FormControl>
            )}
          />
        </div>

        {isRecurring && (
          <FormField
            control={form.control}
            name="recurring_interval"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Frecuencia</FormLabel>
                <Select onValueChange={field.onChange} value={field.value || 'monthly'}>
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder="Seleccionar frecuencia" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    <SelectItem value="weekly">Semanal</SelectItem>
                    <SelectItem value="monthly">Mensual</SelectItem>
                    <SelectItem value="quarterly">Trimestral</SelectItem>
                    <SelectItem value="yearly">Anual</SelectItem>
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />
        )}

        <FormField
          control={form.control}
          name="notes"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Notas (opcional)</FormLabel>
              <FormControl>
                <Textarea
                  placeholder="Notas adicionales sobre este gasto..."
                  className="resize-none"
                  {...field}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <div className="flex justify-end gap-3 pt-4">
          <Button type="submit" disabled={createExpense.isPending || updateExpense.isPending}>
            {expense ? 'Guardar Cambios' : 'Registrar Gasto'}
          </Button>
        </div>
      </form>
    </Form>
  );
}
