import { ChangeEvent, useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { FileText, Paperclip, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
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
import {
  RECURRING_INTERVALS,
  useCreateExpense,
  useUpdateExpense,
  Expense,
  EXPENSE_CATEGORIES,
  SALARY_EXPENSE_CATEGORY,
  deleteExpenseReceipt,
  isSalaryExpenseCategory,
  uploadExpenseReceipt,
} from '@/hooks/useExpenses';
import { useAuth } from '@/hooks/useAuth';
import { toast } from 'sonner';
import {
  formatFinanceCurrency,
  getTodayInBuenosAires,
  normalizeFinanceCurrency,
  resolveCurrencyAmount,
} from '@/lib/finance-currency';

const formSchema = z.object({
  category: z.enum(['lovable', 'meta_ads', 'google_ads', 'hosting', 'software', 'editor', 'salary', 'freelancer', 'marketing', 'other']),
  description: z.string().min(1, 'La descripción es requerida'),
  amount: z.string().min(1, 'El monto es requerido'),
  currency: z.string().default('ARS'),
  expense_date: z.string().min(1, 'La fecha es requerida'),
  is_recurring: z.boolean().default(false),
  recurring_interval: z.enum(RECURRING_INTERVALS).optional(),
  vendor_name: z.string().optional(),
  notes: z.string().optional(),
}).superRefine((data, ctx) => {
  if (data.is_recurring && !data.recurring_interval) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      path: ['recurring_interval'],
      message: 'Elegi cada cuanto se repite este gasto',
    });
  }
});

type FormData = z.infer<typeof formSchema>;

interface ExpenseFormProps {
  expense?: Expense;
  onSuccess: () => void;
  defaultRecurring?: boolean;
}

function getDefaultValues(expense?: Expense, defaultRecurring = false): FormData {
  const isRecurring = expense?.is_recurring ?? defaultRecurring;

  return {
    category: expense?.category || 'other',
    description: expense?.description || '',
    amount: expense?.amount?.toString() || '',
    currency: expense?.currency || 'ARS',
    expense_date: expense?.expense_date?.split('T')[0] || new Date().toISOString().split('T')[0],
    is_recurring: isRecurring,
    recurring_interval: expense?.recurring_interval || 'monthly',
    vendor_name: expense?.vendor_name || '',
    notes: expense?.notes || '',
  };
}

export function ExpenseForm({ expense, onSuccess, defaultRecurring = false }: ExpenseFormProps) {
  const { user } = useAuth();
  const createExpense = useCreateExpense();
  const updateExpense = useUpdateExpense();
  const [receiptFile, setReceiptFile] = useState<File | null>(null);
  const [removeReceipt, setRemoveReceipt] = useState(false);
  const [fileInputKey, setFileInputKey] = useState(0);
  const [conversionPreview, setConversionPreview] = useState<{
    amountArs: number;
    rate: number | null;
    effectiveDate: string | null;
  } | null>(null);
  const [isResolvingConversion, setIsResolvingConversion] = useState(false);

  const form = useForm<FormData>({
    resolver: zodResolver(formSchema),
    defaultValues: getDefaultValues(expense, defaultRecurring),
  });

  const selectedCategory = form.watch('category');
  const isRecurring = form.watch('is_recurring');
  const watchedAmount = form.watch('amount');
  const watchedCurrency = form.watch('currency');
  const watchedDate = form.watch('expense_date');

  useEffect(() => {
    form.reset(getDefaultValues(expense, defaultRecurring));
    setReceiptFile(null);
    setRemoveReceipt(false);
    setFileInputKey((current) => current + 1);
  }, [defaultRecurring, expense, form]);

  useEffect(() => {
    let cancelled = false;
    const amount = parseFloat(watchedAmount);
    const currency = normalizeFinanceCurrency(watchedCurrency);

    if (!Number.isFinite(amount) || amount <= 0) {
      setConversionPreview(null);
      setIsResolvingConversion(false);
      return;
    }

    if (currency === 'ARS') {
      setConversionPreview({
        amountArs: amount,
        rate: null,
        effectiveDate: null,
      });
      setIsResolvingConversion(false);
      return;
    }

    setIsResolvingConversion(true);

    resolveCurrencyAmount({
      amount,
      currency,
      date: watchedDate || getTodayInBuenosAires(),
    })
      .then((conversion) => {
        if (cancelled) return;

        setConversionPreview({
          amountArs: conversion.amount_ars,
          rate: conversion.exchange_rate,
          effectiveDate: conversion.exchange_rate_date,
        });
      })
      .catch(() => {
        if (!cancelled) {
          setConversionPreview(null);
        }
      })
      .finally(() => {
        if (!cancelled) {
          setIsResolvingConversion(false);
        }
      });

    return () => {
      cancelled = true;
    };
  }, [watchedAmount, watchedCurrency, watchedDate]);

  const isSalaryExpense = isSalaryExpenseCategory(selectedCategory);
  const expenseDateLabel = isRecurring ? 'Fecha de inicio' : 'Fecha del gasto';
  const descriptionPlaceholder = isSalaryExpense
    ? 'Ej: Sueldo marzo 2026'
    : 'Ej: Suscripción mensual Lovable Pro';
  const vendorLabel = isSalaryExpense ? 'Colaborador (opcional)' : 'Proveedor (opcional)';
  const vendorPlaceholder = isSalaryExpense ? 'Ej: Juan Pérez' : 'Ej: Meta, Google, Fiverr...';
  const hasExistingReceipt = Boolean(expense?.receipt_path) && !removeReceipt;
  const shownReceiptName = receiptFile?.name || (hasExistingReceipt ? expense?.receipt_file_name : null);

  const handleReceiptChange = (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0] || null;
    setReceiptFile(file);
    setRemoveReceipt(false);
  };

  const handleRemoveReceipt = () => {
    setReceiptFile(null);
    setRemoveReceipt(true);
    setFileInputKey((current) => current + 1);
  };

  const onSubmit = async (data: FormData) => {
    let uploadedReceipt: { path: string; fileName: string } | null = null;

    try {
      const currency = normalizeFinanceCurrency(data.currency);
      const conversion = await resolveCurrencyAmount({
        amount: parseFloat(data.amount),
        currency,
        date: data.expense_date || getTodayInBuenosAires(),
      });

      const keepExistingReceipt = isSalaryExpense && hasExistingReceipt && !receiptFile;
      const shouldDeleteExistingReceipt = Boolean(expense?.receipt_path) && (!isSalaryExpense || removeReceipt || Boolean(receiptFile));

      if (isSalaryExpense && receiptFile) {
        if (!user?.id) {
          throw new Error('No hay sesion activa para subir el comprobante');
        }

        uploadedReceipt = await uploadExpenseReceipt(receiptFile, user.id);
      }

      const payload = {
        category: data.category,
        description: data.description,
        amount: parseFloat(data.amount),
        currency,
        amount_ars: conversion.amount_ars,
        exchange_rate: conversion.exchange_rate,
        exchange_rate_date: conversion.exchange_rate_date,
        exchange_source: conversion.exchange_source,
        expense_date: data.expense_date,
        is_recurring: data.is_recurring,
        recurring_interval: data.is_recurring ? data.recurring_interval || null : null,
        receipt_file_name: isSalaryExpense
          ? uploadedReceipt?.fileName || (keepExistingReceipt ? expense?.receipt_file_name || null : null)
          : null,
        receipt_path: isSalaryExpense
          ? uploadedReceipt?.path || (keepExistingReceipt ? expense?.receipt_path || null : null)
          : null,
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

      if (expense?.receipt_path && shouldDeleteExistingReceipt) {
        await deleteExpenseReceipt(expense.receipt_path);
      }

      onSuccess();
    } catch (error) {
      if (uploadedReceipt?.path) {
        await deleteExpenseReceipt(uploadedReceipt.path).catch(() => undefined);
      }
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
                <Input placeholder={descriptionPlaceholder} {...field} />
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

        {watchedCurrency === 'USD' && (
          <div className="rounded-lg border border-emerald-500/20 bg-emerald-500/5 px-4 py-3 text-sm">
            {isResolvingConversion ? (
              <p className="text-muted-foreground">Consultando dólar blue para esta fecha...</p>
            ) : conversionPreview?.rate ? (
              <p className="text-muted-foreground">
                Se guardará en USD y se convertirá a ARS con dólar blue del{' '}
                <span className="font-medium text-foreground">{conversionPreview.effectiveDate}</span>{' '}
                ({formatFinanceCurrency(conversionPreview.rate, 'ARS')}).
                Impacto estimado: <span className="font-semibold text-foreground">{formatFinanceCurrency(conversionPreview.amountArs, 'ARS')}</span>.
              </p>
            ) : (
              <p className="text-muted-foreground">
                No pude obtener la cotización blue para esta fecha. Inténtalo nuevamente antes de guardar.
              </p>
            )}
          </div>
        )}

        <FormField
          control={form.control}
          name="expense_date"
          render={({ field }) => (
            <FormItem>
              <FormLabel>{expenseDateLabel}</FormLabel>
              <FormControl>
                <Input type="date" {...field} />
              </FormControl>
              <FormDescription>
                {isRecurring
                  ? 'Se usa como primer vencimiento para calcular los proximos cargos.'
                  : 'Fecha en la que impacta este gasto puntual.'}
              </FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="vendor_name"
          render={({ field }) => (
            <FormItem>
              <FormLabel>{vendorLabel}</FormLabel>
              <FormControl>
                <Input placeholder={vendorPlaceholder} {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        {isSalaryExpense && (
          <div className="space-y-3 rounded-lg border border-border/50 bg-muted/20 p-4">
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <Paperclip className="h-4 w-4 text-muted-foreground" />
                <FormLabel className="m-0">Comprobante</FormLabel>
              </div>
              <p className="text-xs text-muted-foreground">
                Adjunta el recibo o comprobante del sueldo en PDF, JPG o PNG.
              </p>
            </div>

            {shownReceiptName && (
              <div className="flex items-center justify-between gap-3 rounded-md border border-border/50 bg-background/70 px-3 py-2">
                <div className="flex min-w-0 items-center gap-2">
                  <FileText className="h-4 w-4 shrink-0 text-muted-foreground" />
                  <div className="min-w-0">
                    <p className="truncate text-sm font-medium">{shownReceiptName}</p>
                    {hasExistingReceipt && expense?.receipt_url && !receiptFile && (
                      <a
                        href={expense.receipt_url}
                        target="_blank"
                        rel="noreferrer"
                        className="text-xs text-primary hover:underline"
                      >
                        Ver comprobante actual
                      </a>
                    )}
                  </div>
                </div>
                <Button type="button" variant="ghost" size="icon" className="h-8 w-8 shrink-0" onClick={handleRemoveReceipt}>
                  <X className="h-4 w-4" />
                </Button>
              </div>
            )}

            <Input
              key={fileInputKey}
              type="file"
              accept=".pdf,image/png,image/jpeg,image/jpg,image/webp"
              onChange={handleReceiptChange}
            />
          </div>
        )}

        <div className="flex items-center justify-between p-4 rounded-lg border border-border/50 bg-muted/20">
          <div className="space-y-0.5">
            <FormLabel>Gasto Recurrente</FormLabel>
            <p className="text-xs text-muted-foreground">
              {isRecurring
                ? 'Este gasto va a quedar visible como fijo con su proximo vencimiento.'
                : 'Activalo si es una suscripcion, abono o servicio fijo.'}
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
                <FormDescription>
                  Finanzas estimara el equivalente mensual segun esta frecuencia.
                </FormDescription>
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
            {expense ? 'Guardar Cambios' : isRecurring ? 'Registrar Gasto Recurrente' : 'Registrar Gasto'}
          </Button>
        </div>
      </form>
    </Form>
  );
}
