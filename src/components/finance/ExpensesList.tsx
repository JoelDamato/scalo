import { useState } from 'react';
import { Plus, Pencil, Trash2, Receipt, RefreshCw, Paperclip } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import {
  useExpenses,
  useDeleteExpense,
  Expense,
  getExpenseAmountArs,
  getCategoryInfo,
  getMonthlyRecurringEstimateArs,
  getNextRecurringOccurrence,
  getRecurringIntervalLabel,
} from '@/hooks/useExpenses';
import { ExpenseForm } from './ExpenseForm';
import { Skeleton } from '@/components/ui/skeleton';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import { toast } from 'sonner';
import { Badge } from '@/components/ui/badge';
import { formatFinanceCurrency } from '@/lib/finance-currency';

export function ExpensesList() {
  const { data: expenses = [], isLoading } = useExpenses();
  const deleteExpense = useDeleteExpense();
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [createMode, setCreateMode] = useState<'one-time' | 'recurring'>('one-time');
  const [editingExpense, setEditingExpense] = useState<Expense | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const recurringExpenses = expenses
    .filter(expense => expense.is_recurring)
    .map(expense => ({
      expense,
      nextOccurrence: getNextRecurringOccurrence(expense),
      monthlyEstimateArs: getMonthlyRecurringEstimateArs(expense),
    }))
    .sort((a, b) => {
      if (!a.nextOccurrence && !b.nextOccurrence) return 0;
      if (!a.nextOccurrence) return 1;
      if (!b.nextOccurrence) return -1;
      return a.nextOccurrence.getTime() - b.nextOccurrence.getTime();
    });

  const handleDelete = async () => {
    if (!deletingId) return;
    try {
      await deleteExpense.mutateAsync(deletingId);
      toast.success('Gasto eliminado');
    } catch {
      toast.error('Error al eliminar');
    }
    setDeletingId(null);
  };

  const openCreateDialog = (mode: 'one-time' | 'recurring') => {
    setCreateMode(mode);
    setIsCreateOpen(true);
  };

  const closeCreateDialog = () => {
    setIsCreateOpen(false);
    setCreateMode('one-time');
  };

  if (isLoading) {
    return (
      <Card className="border-border/50 bg-card/50">
        <CardContent className="p-6">
          <Skeleton className="h-64 w-full" />
        </CardContent>
      </Card>
    );
  }

  return (
    <>
      {recurringExpenses.length > 0 && (
        <Card className="border-border/50 bg-card/50 backdrop-blur-sm">
          <CardHeader>
            <CardTitle className="text-lg">Gastos Recurrentes Activos</CardTitle>
            <CardDescription>
              Tus abonos y suscripciones fijas quedan visibles con su proximo vencimiento y equivalente mensual.
            </CardDescription>
          </CardHeader>
          <CardContent className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
            {recurringExpenses.map(({ expense, nextOccurrence, monthlyEstimateArs }) => {
              const catInfo = getCategoryInfo(expense.category);

              return (
                <div key={`${expense.id}-recurring`} className="rounded-xl border border-border/50 bg-muted/20 p-4">
                  <div className="flex items-start justify-between gap-3">
                    <div className="space-y-2">
                      <Badge variant="outline" className={`gap-1.5 ${catInfo.color}`}>
                        <span>{catInfo.icon}</span>
                        <span>{catInfo.label}</span>
                      </Badge>
                      <div>
                        <p className="font-medium leading-tight">{expense.description}</p>
                        {expense.vendor_name && (
                          <p className="text-xs text-muted-foreground">{expense.vendor_name}</p>
                        )}
                      </div>
                    </div>
                    <Badge variant="secondary" className="gap-1 text-xs whitespace-nowrap">
                      <RefreshCw className="h-3 w-3" />
                      {getRecurringIntervalLabel(expense.recurring_interval)}
                    </Badge>
                  </div>

                  <div className="mt-4 grid gap-3 sm:grid-cols-2">
                    <div>
                      <p className="text-xs text-muted-foreground">Proximo cargo</p>
                      <p className="font-semibold">
                        {nextOccurrence
                          ? format(nextOccurrence, 'dd/MM/yyyy', { locale: es })
                          : 'Sin fecha'}
                      </p>
                    </div>
                    <div className="text-left sm:text-right">
                      <p className="text-xs text-muted-foreground">Equivalente mensual</p>
                      <p className="font-semibold tabular-nums">
                        {formatFinanceCurrency(monthlyEstimateArs, 'ARS')}
                      </p>
                    </div>
                  </div>

                  <div className="mt-4 flex items-end justify-between gap-3">
                    <p className="text-xs text-muted-foreground">
                      Inicio {format(new Date(`${expense.expense_date}T00:00:00`), 'dd/MM/yyyy', { locale: es })}
                    </p>
                    <div className="text-right">
                      <p className={`text-lg font-bold tabular-nums ${expense.currency === 'USD' ? 'text-emerald-400' : ''}`}>
                        {formatFinanceCurrency(Number(expense.amount), expense.currency)}
                      </p>
                      {expense.currency === 'USD' && (expense.resolved_amount_ars !== null || expense.amount_ars !== null) && (
                        <p className="text-xs text-muted-foreground">
                          {formatFinanceCurrency(getExpenseAmountArs(expense), 'ARS')}
                        </p>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </CardContent>
        </Card>
      )}

      <Card className="border-border/50 bg-card/50 backdrop-blur-sm">
        <CardHeader className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="space-y-1">
            <CardTitle className="text-lg">Gastos Operativos</CardTitle>
            <CardDescription>
              Carga gastos puntuales o deja configurados los gastos fijos de la operacion.
            </CardDescription>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <Button variant="outline" size="sm" className="gap-2" onClick={() => openCreateDialog('one-time')}>
              <Plus className="h-4 w-4" />
              Nuevo Gasto
            </Button>
            <Button size="sm" className="gap-2" onClick={() => openCreateDialog('recurring')}>
              <RefreshCw className="h-4 w-4" />
              Nuevo Recurrente
            </Button>
          </div>
          <Dialog open={isCreateOpen} onOpenChange={(open) => (open ? setIsCreateOpen(true) : closeCreateDialog())}>
            <DialogContent className="sm:max-w-lg">
              <DialogHeader>
                <DialogTitle>{createMode === 'recurring' ? 'Registrar Gasto Recurrente' : 'Registrar Gasto'}</DialogTitle>
                <DialogDescription>
                  {createMode === 'recurring'
                    ? 'Configura un gasto fijo para que Finanzas lo muestre como compromiso recurrente.'
                    : 'Carga un gasto puntual o activa la recurrencia desde el formulario.'}
                </DialogDescription>
              </DialogHeader>
              <ExpenseForm
                defaultRecurring={createMode === 'recurring'}
                onSuccess={closeCreateDialog}
              />
            </DialogContent>
          </Dialog>
        </CardHeader>
        <CardContent>
          {expenses.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 text-muted-foreground">
              <Receipt className="h-12 w-12 mb-4 opacity-30" />
              <p className="text-lg font-medium">No hay gastos registrados</p>
              <p className="text-sm">Registra tu primer gasto operativo o recurrente</p>
            </div>
          ) : (
            <div className="rounded-lg border border-border/50 overflow-hidden">
              <Table>
                <TableHeader>
                  <TableRow className="bg-muted/30 hover:bg-muted/30">
                    <TableHead>Categoría</TableHead>
                    <TableHead>Descripción</TableHead>
                    <TableHead>Fecha</TableHead>
                    <TableHead>Tipo</TableHead>
                    <TableHead className="text-right">Monto</TableHead>
                    <TableHead className="w-[100px]"></TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {expenses.map((expense) => {
                    const catInfo = getCategoryInfo(expense.category);
                    const nextOccurrence = expense.is_recurring ? getNextRecurringOccurrence(expense) : null;

                    return (
                      <TableRow key={expense.id} className="hover:bg-muted/20">
                        <TableCell>
                          <Badge variant="outline" className={`gap-1.5 ${catInfo.color}`}>
                            <span>{catInfo.icon}</span>
                            <span>{catInfo.label}</span>
                          </Badge>
                        </TableCell>
                        <TableCell className="font-medium max-w-[200px] truncate">
                          <div className="space-y-1">
                            <div className="truncate">
                              {expense.description}
                              {expense.vendor_name && (
                                <span className="text-xs text-muted-foreground ml-1">
                                  ({expense.vendor_name})
                                </span>
                              )}
                            </div>
                            {expense.receipt_url && (
                              <a
                                href={expense.receipt_url}
                                target="_blank"
                                rel="noreferrer"
                                className="inline-flex items-center gap-1 text-xs text-primary hover:underline"
                              >
                                <Paperclip className="h-3 w-3" />
                                {expense.receipt_file_name || 'Ver comprobante'}
                              </a>
                            )}
                          </div>
                        </TableCell>
                        <TableCell className="text-muted-foreground">
                          {format(new Date(`${expense.expense_date}T00:00:00`), 'dd/MM/yyyy', { locale: es })}
                        </TableCell>
                        <TableCell>
                          {expense.is_recurring ? (
                            <div className="space-y-1">
                              <Badge variant="secondary" className="gap-1 text-xs">
                                <RefreshCw className="h-3 w-3" />
                                {getRecurringIntervalLabel(expense.recurring_interval)}
                              </Badge>
                              {nextOccurrence && (
                                <p className="text-xs text-muted-foreground">
                                  Proximo: {format(nextOccurrence, 'dd/MM/yyyy', { locale: es })}
                                </p>
                              )}
                            </div>
                          ) : (
                            <span className="text-xs text-muted-foreground">Unico</span>
                          )}
                        </TableCell>
                        <TableCell className="text-right font-semibold tabular-nums">
                          <div className="space-y-0.5">
                            <p className={expense.currency === 'USD' ? 'text-emerald-400' : ''}>
                              {formatFinanceCurrency(Number(expense.amount), expense.currency)}
                            </p>
                            {expense.currency === 'USD' && (expense.resolved_amount_ars !== null || expense.amount_ars !== null) && (
                              <p className="text-xs font-normal text-muted-foreground">
                                {formatFinanceCurrency(getExpenseAmountArs(expense), 'ARS')}
                                {expense.resolved_exchange_rate && ` · blue ${formatFinanceCurrency(Number(expense.resolved_exchange_rate), 'ARS')}`}
                              </p>
                            )}
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-1">
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-8 w-8"
                              onClick={() => setEditingExpense(expense)}
                            >
                              <Pencil className="h-4 w-4" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-8 w-8 text-destructive hover:text-destructive"
                              onClick={() => setDeletingId(expense.id)}
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Edit Dialog */}
      <Dialog open={!!editingExpense} onOpenChange={() => setEditingExpense(null)}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>Editar Gasto</DialogTitle>
          </DialogHeader>
          {editingExpense && (
            <ExpenseForm
              expense={editingExpense}
              onSuccess={() => setEditingExpense(null)}
            />
          )}
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation */}
      <AlertDialog open={!!deletingId} onOpenChange={() => setDeletingId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>¿Eliminar gasto?</AlertDialogTitle>
            <AlertDialogDescription>
              Esta acción no se puede deshacer. El gasto será eliminado permanentemente.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
              Eliminar
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
