import { useState } from 'react';
import { Plus, Pencil, Trash2, FileText } from 'lucide-react';
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
  DialogHeader,
  DialogTitle,
  DialogTrigger,
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
import { useFinanceRecords, useDeleteFinanceRecord, FinanceRecord } from '@/hooks/useFinance';
import { FinanceRecordForm } from './FinanceRecordForm';
import { Skeleton } from '@/components/ui/skeleton';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import { toast } from 'sonner';
import { formatFinanceCurrency } from '@/lib/finance-currency';

export function FinanceRecordsList() {
  const { data: records = [], isLoading } = useFinanceRecords();
  const deleteRecord = useDeleteFinanceRecord();
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [editingRecord, setEditingRecord] = useState<FinanceRecord | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const handleDelete = async () => {
    if (!deletingId) return;
    try {
      await deleteRecord.mutateAsync(deletingId);
      toast.success('Registro eliminado');
    } catch (error) {
      toast.error('Error al eliminar');
    }
    setDeletingId(null);
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
      <Card className="border-border/50 bg-card/50 backdrop-blur-sm">
        <CardHeader className="flex flex-row items-center justify-between">
          <div className="space-y-1">
            <CardTitle className="text-lg">Registros de Ingresos</CardTitle>
            <CardDescription>
              Puedes cargar montos en ARS o USD. Los totales se expresan en ARS usando dólar blue para los registros en USD.
            </CardDescription>
          </div>
          <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
            <DialogTrigger asChild>
              <Button size="sm" className="gap-2">
                <Plus className="h-4 w-4" />
                Nuevo Registro
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-lg">
              <DialogHeader>
                <DialogTitle>Nuevo Registro de Ingreso</DialogTitle>
              </DialogHeader>
              <FinanceRecordForm onSuccess={() => setIsCreateOpen(false)} />
            </DialogContent>
          </Dialog>
        </CardHeader>
        <CardContent>
          {records.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 text-muted-foreground">
              <FileText className="h-12 w-12 mb-4 opacity-30" />
              <p className="text-lg font-medium">No hay registros</p>
              <p className="text-sm">Crea tu primer registro de ingreso</p>
            </div>
          ) : (
            <div className="rounded-lg border border-border/50 overflow-hidden">
              <Table>
                <TableHeader>
                  <TableRow className="bg-muted/30 hover:bg-muted/30">
                    <TableHead>Descripción</TableHead>
                    <TableHead>Proyecto</TableHead>
                    <TableHead>Fecha</TableHead>
                    <TableHead>Estado</TableHead>
                    <TableHead>Método</TableHead>
                    <TableHead className="text-right">Monto</TableHead>
                    <TableHead className="w-[100px]"></TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {records.map((record) => (
                    <TableRow key={record.id} className="hover:bg-muted/20">
                      <TableCell className="font-medium max-w-[200px] truncate">
                        {record.description}
                      </TableCell>
                      <TableCell className="text-muted-foreground">
                        {record.project?.name || '-'}
                      </TableCell>
                      <TableCell className="text-muted-foreground">
                        {record.invoice_date 
                          ? format(new Date(record.invoice_date), 'dd/MM/yyyy')
                          : format(new Date(record.created_at), 'dd/MM/yyyy')
                        }
                      </TableCell>
                      <TableCell>
                        <span
                          className={`px-2 py-1 rounded-full text-xs font-medium ${
                            record.payment_status === 'paid'
                              ? 'bg-emerald-500/20 text-emerald-500'
                              : record.payment_status === 'partial'
                              ? 'bg-amber-500/20 text-amber-500'
                              : 'bg-muted text-muted-foreground'
                          }`}
                        >
                          {record.payment_status === 'paid' ? 'Pagado' : record.payment_status === 'partial' ? 'Parcial' : 'Pendiente'}
                        </span>
                      </TableCell>
                      <TableCell className="text-muted-foreground">
                        {record.payment_method || '-'}
                      </TableCell>
                      <TableCell className="text-right font-semibold tabular-nums">
                        <div className="space-y-0.5">
                          <p className={record.currency === 'USD' ? 'text-emerald-400' : ''}>
                            {formatFinanceCurrency(Number(record.amount), record.currency)}
                          </p>
                          {record.currency === 'USD' && (record.resolved_amount_ars !== null || record.amount_ars !== null) && (
                            <p className="text-xs font-normal text-muted-foreground">
                              {formatFinanceCurrency(Number(record.resolved_amount_ars ?? record.amount_ars ?? 0), 'ARS')}
                              {record.resolved_exchange_rate && ` · blue ${formatFinanceCurrency(Number(record.resolved_exchange_rate), 'ARS')}`}
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
                            onClick={() => setEditingRecord(record)}
                          >
                            <Pencil className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8 text-destructive hover:text-destructive"
                            onClick={() => setDeletingId(record.id)}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Edit Dialog */}
      <Dialog open={!!editingRecord} onOpenChange={() => setEditingRecord(null)}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>Editar Registro</DialogTitle>
          </DialogHeader>
          {editingRecord && (
            <FinanceRecordForm
              record={editingRecord}
              onSuccess={() => setEditingRecord(null)}
            />
          )}
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation */}
      <AlertDialog open={!!deletingId} onOpenChange={() => setDeletingId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>¿Eliminar registro?</AlertDialogTitle>
            <AlertDialogDescription>
              Esta acción no se puede deshacer. El registro será eliminado permanentemente.
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
