import { useState } from 'react';
import { Plus, FileText, CheckCircle2, XCircle, Clock, ExternalLink } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
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
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { useArcaInvoices, useArcaConfig } from '@/hooks/useFinance';
import { Skeleton } from '@/components/ui/skeleton';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import { Badge } from '@/components/ui/badge';
import { CreateInvoiceForm } from './CreateInvoiceForm';

function formatCurrency(amount: number | null) {
  if (amount === null) return '-';
  return new Intl.NumberFormat('es-AR', {
    style: 'currency',
    currency: 'ARS',
  }).format(amount);
}

const statusConfig = {
  draft: { label: 'Borrador', icon: Clock, className: 'bg-muted text-muted-foreground' },
  emitida: { label: 'Emitida', icon: CheckCircle2, className: 'bg-emerald-500/20 text-emerald-500' },
  anulada: { label: 'Anulada', icon: XCircle, className: 'bg-red-500/20 text-red-500' },
  error: { label: 'Error', icon: XCircle, className: 'bg-red-500/20 text-red-500' },
};

export function ArcaInvoicesList() {
  const { data: invoices = [], isLoading } = useArcaInvoices();
  const { data: config } = useArcaConfig();
  const [isCreateOpen, setIsCreateOpen] = useState(false);

  if (isLoading) {
    return (
      <Card className="border-border/50 bg-card/50">
        <CardContent className="p-6">
          <Skeleton className="h-64 w-full" />
        </CardContent>
      </Card>
    );
  }

  const isConfigured = config?.enabled && config?.cuit;

  return (
    <div className="space-y-6">
      {!isConfigured && (
        <Alert className="border-amber-500/30 bg-amber-500/10">
          <Clock className="h-4 w-4 text-amber-500" />
          <AlertTitle className="text-amber-500">Configuración Pendiente</AlertTitle>
          <AlertDescription className="text-muted-foreground">
            Debes configurar y habilitar la integración ARCA antes de poder emitir facturas.
            Ve a la pestaña "Configuración ARCA" para comenzar.
          </AlertDescription>
        </Alert>
      )}

      <Card className="border-border/50 bg-card/50 backdrop-blur-sm">
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle className="text-lg">Facturas Electrónicas</CardTitle>
          <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
            <DialogTrigger asChild>
              <Button size="sm" className="gap-2" disabled={!isConfigured}>
                <Plus className="h-4 w-4" />
                Nueva Factura
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-lg">
              <DialogHeader>
                <DialogTitle>Emitir Factura ARCA</DialogTitle>
              </DialogHeader>
              <CreateInvoiceForm onSuccess={() => setIsCreateOpen(false)} />
            </DialogContent>
          </Dialog>
        </CardHeader>
        <CardContent>
          {invoices.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 text-muted-foreground">
              <FileText className="h-12 w-12 mb-4 opacity-30" />
              <p className="text-lg font-medium">No hay facturas emitidas</p>
              <p className="text-sm">
                {isConfigured 
                  ? 'Crea tu primera factura electrónica'
                  : 'Configura ARCA para comenzar a facturar'
                }
              </p>
            </div>
          ) : (
            <div className="rounded-lg border border-border/50 overflow-hidden">
              <Table>
                <TableHeader>
                  <TableRow className="bg-muted/30 hover:bg-muted/30">
                    <TableHead>Comprobante</TableHead>
                    <TableHead>Cliente</TableHead>
                    <TableHead>Fecha</TableHead>
                    <TableHead>CAE</TableHead>
                    <TableHead>Estado</TableHead>
                    <TableHead className="text-right">Importe</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {invoices.map((invoice) => {
                    const status = statusConfig[invoice.estado];
                    const StatusIcon = status.icon;
                    
                    return (
                      <TableRow key={invoice.id} className="hover:bg-muted/20">
                        <TableCell className="font-medium">
                          <div className="flex flex-col">
                            <span className="text-xs text-muted-foreground uppercase">
                              {invoice.tipo_comprobante?.replace('_', ' ') || 'Factura'}
                            </span>
                            <span>
                              {invoice.punto_venta?.toString().padStart(4, '0')}-
                              {invoice.numero_comprobante?.toString().padStart(8, '0') || '--------'}
                            </span>
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="flex flex-col">
                            <span className="font-medium">{invoice.cliente_nombre || '-'}</span>
                            <span className="text-xs text-muted-foreground">
                              {invoice.cliente_cuit_dni || '-'}
                            </span>
                          </div>
                        </TableCell>
                        <TableCell className="text-muted-foreground">
                          {invoice.fecha_emision 
                            ? format(new Date(invoice.fecha_emision), 'dd/MM/yyyy')
                            : '-'
                          }
                        </TableCell>
                        <TableCell>
                          {invoice.cae ? (
                            <div className="flex flex-col">
                              <span className="font-mono text-xs">{invoice.cae}</span>
                              <span className="text-xs text-muted-foreground">
                                Vto: {invoice.cae_vencimiento 
                                  ? format(new Date(invoice.cae_vencimiento), 'dd/MM/yyyy')
                                  : '-'
                                }
                              </span>
                            </div>
                          ) : (
                            <span className="text-muted-foreground">-</span>
                          )}
                        </TableCell>
                        <TableCell>
                          <Badge variant="outline" className={`gap-1 ${status.className}`}>
                            <StatusIcon className="h-3 w-3" />
                            {status.label}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-right font-semibold tabular-nums">
                          {formatCurrency(invoice.importe_total)}
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
    </div>
  );
}
