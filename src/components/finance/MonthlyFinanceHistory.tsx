import { useEffect, useMemo, useState } from 'react';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import { CalendarClock, Edit3, LineChart as LineChartIcon, RotateCcw } from 'lucide-react';
import { CartesianGrid, Line, LineChart, XAxis, YAxis } from 'recharts';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
  type ChartConfig,
} from '@/components/ui/chart';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Skeleton } from '@/components/ui/skeleton';
import { Textarea } from '@/components/ui/textarea';
import {
  type FinanceMonthlySummary,
  useDeleteFinanceMonthlyOverride,
  useFinanceMonthlyHistory,
  useUpsertFinanceMonthlyOverride,
} from '@/hooks/useFinance';
import { formatFinanceCurrency } from '@/lib/finance-currency';

const chartConfig = {
  ingresos: {
    label: 'Ingresos',
    color: 'hsl(142 70% 45%)',
  },
  egresos: {
    label: 'Egresos',
    color: 'hsl(0 84% 60%)',
  },
} satisfies ChartConfig;

function getMonthLabel(month: string) {
  const [year, monthValue] = month.split('-').map(Number);
  return format(new Date(year, monthValue - 1, 1), 'MMMM yyyy', { locale: es });
}

function formatShortMonth(month: string) {
  const [year, monthValue] = month.split('-').map(Number);
  return format(new Date(year, monthValue - 1, 1), 'MMM yy', { locale: es });
}

function formatCompactCurrency(value: number) {
  return new Intl.NumberFormat('es-AR', {
    notation: 'compact',
    maximumFractionDigits: 1,
  }).format(value);
}

export function MonthlyFinanceHistory() {
  const { data: summaries, chartData, isLoading } = useFinanceMonthlyHistory();
  const upsertOverride = useUpsertFinanceMonthlyOverride();
  const deleteOverride = useDeleteFinanceMonthlyOverride();
  const [editingSummary, setEditingSummary] = useState<FinanceMonthlySummary | null>(null);
  const [revenueValue, setRevenueValue] = useState('');
  const [expensesValue, setExpensesValue] = useState('');
  const [notes, setNotes] = useState('');

  useEffect(() => {
    if (!editingSummary) return;

    setRevenueValue(String(editingSummary.revenueArs));
    setExpensesValue(String(editingSummary.expensesArs));
    setNotes(editingSummary.override?.notes || '');
  }, [editingSummary]);

  const hasChartData = useMemo(
    () => chartData.some((month) => month.revenueArs > 0 || month.expensesArs > 0),
    [chartData],
  );

  const handleSave = async () => {
    if (!editingSummary) return;

    await upsertOverride.mutateAsync({
      month: editingSummary.month,
      revenue_ars: Number(revenueValue || 0),
      expenses_ars: Number(expensesValue || 0),
      notes,
    });

    setEditingSummary(null);
  };

  const handleReset = async (summary: FinanceMonthlySummary) => {
    await deleteOverride.mutateAsync(summary.month);
  };

  if (isLoading) {
    return (
      <Card className="border-border/50 bg-card/50 backdrop-blur-sm">
        <CardHeader>
          <Skeleton className="h-6 w-64" />
          <Skeleton className="h-4 w-96 max-w-full" />
        </CardHeader>
        <CardContent className="space-y-3">
          {[1, 2, 3].map((item) => (
            <Skeleton key={item} className="h-16 w-full rounded-xl" />
          ))}
        </CardContent>
      </Card>
    );
  }

  return (
    <>
      <Card className="border-border/50 bg-card/50 backdrop-blur-sm">
        <CardHeader className="space-y-2">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
            <div>
              <CardTitle className="flex items-center gap-2 text-lg">
                <CalendarClock className="h-5 w-5 text-primary" />
                Historial mensual de ganancias
              </CardTitle>
              <CardDescription>
                Ingresos pagados menos gastos del mes. El mes actual corre vivo; los anteriores quedan en historial.
              </CardDescription>
            </div>
            <Badge variant="secondary">{summaries.length} meses</Badge>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          {summaries.length === 0 ? (
            <div className="rounded-xl border border-dashed border-border/70 bg-muted/20 p-8 text-center text-sm text-muted-foreground">
              Todavía no hay datos para armar el historial.
            </div>
          ) : (
            <div className="overflow-x-auto rounded-xl border border-border/70">
              <table className="w-full min-w-[760px] text-sm">
                <thead className="bg-muted/40 text-xs uppercase tracking-wide text-muted-foreground">
                  <tr>
                    <th className="px-4 py-3 text-left font-medium">Mes</th>
                    <th className="px-4 py-3 text-right font-medium">Ingresos pagados</th>
                    <th className="px-4 py-3 text-right font-medium">Egresos</th>
                    <th className="px-4 py-3 text-right font-medium">Ganancia</th>
                    <th className="px-4 py-3 text-right font-medium">Jota</th>
                    <th className="px-4 py-3 text-right font-medium">Tomás</th>
                    <th className="px-4 py-3 text-right font-medium">Acciones</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border/60">
                  {summaries.map((summary) => (
                    <tr key={summary.month} className="bg-card/40">
                      <td className="px-4 py-3">
                        <div className="flex flex-wrap items-center gap-2">
                          <span className="font-medium capitalize">{getMonthLabel(summary.month)}</span>
                          {summary.isCurrentMonth ? <Badge>Actual</Badge> : null}
                          {summary.isEdited ? <Badge variant="outline">Editado</Badge> : null}
                        </div>
                        {summary.override?.notes ? (
                          <p className="mt-1 max-w-xs truncate text-xs text-muted-foreground">
                            {summary.override.notes}
                          </p>
                        ) : null}
                      </td>
                      <td className="px-4 py-3 text-right tabular-nums">
                        {formatFinanceCurrency(summary.revenueArs, 'ARS')}
                      </td>
                      <td className="px-4 py-3 text-right tabular-nums">
                        {formatFinanceCurrency(summary.expensesArs, 'ARS')}
                      </td>
                      <td className="px-4 py-3 text-right font-semibold tabular-nums">
                        <span className={summary.profitArs >= 0 ? 'text-emerald-500' : 'text-rose-500'}>
                          {formatFinanceCurrency(summary.profitArs, 'ARS')}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-right tabular-nums">
                        {formatFinanceCurrency(summary.jotaArs, 'ARS')}
                      </td>
                      <td className="px-4 py-3 text-right tabular-nums">
                        {formatFinanceCurrency(summary.tomasArs, 'ARS')}
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex justify-end gap-2">
                          <Button size="sm" variant="outline" onClick={() => setEditingSummary(summary)}>
                            <Edit3 className="mr-1.5 h-3.5 w-3.5" />
                            Editar
                          </Button>
                          {summary.isEdited ? (
                            <Button
                              size="sm"
                              variant="ghost"
                              disabled={deleteOverride.isPending}
                              onClick={() => handleReset(summary)}
                            >
                              <RotateCcw className="mr-1.5 h-3.5 w-3.5" />
                              Auto
                            </Button>
                          ) : null}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          <div className="rounded-xl border border-border/70 bg-background/40 p-4">
            <div className="mb-4 flex items-center gap-2">
              <LineChartIcon className="h-5 w-5 text-primary" />
              <div>
                <h3 className="text-sm font-semibold">Ingresos vs egresos</h3>
                <p className="text-xs text-muted-foreground">Evolución mensual en ARS.</p>
              </div>
            </div>

            {hasChartData ? (
              <ChartContainer config={chartConfig} className="h-[280px] w-full">
                <LineChart data={chartData} margin={{ top: 12, right: 18, left: 0, bottom: 0 }}>
                  <CartesianGrid vertical={false} strokeDasharray="4 4" />
                  <XAxis
                    dataKey="month"
                    tickLine={false}
                    axisLine={false}
                    tickFormatter={formatShortMonth}
                    tickMargin={10}
                  />
                  <YAxis
                    tickLine={false}
                    axisLine={false}
                    width={48}
                    tickFormatter={formatCompactCurrency}
                  />
                  <ChartTooltip
                    cursor={false}
                    content={
                      <ChartTooltipContent
                        labelFormatter={(value) => getMonthLabel(String(value))}
                        formatter={(value, name) => (
                          <div className="flex min-w-[160px] items-center justify-between gap-4">
                            <span className="capitalize text-muted-foreground">{String(name)}</span>
                            <span className="font-mono font-medium text-foreground">
                              {formatFinanceCurrency(Number(value), 'ARS')}
                            </span>
                          </div>
                        )}
                        indicator="line"
                      />
                    }
                  />
                  <Line
                    dataKey="revenueArs"
                    name="ingresos"
                    type="monotone"
                    stroke="var(--color-ingresos)"
                    strokeWidth={3}
                    dot={{ r: 2.5 }}
                    activeDot={{ r: 5 }}
                  />
                  <Line
                    dataKey="expensesArs"
                    name="egresos"
                    type="monotone"
                    stroke="var(--color-egresos)"
                    strokeWidth={3}
                    dot={{ r: 2.5 }}
                    activeDot={{ r: 5 }}
                  />
                </LineChart>
              </ChartContainer>
            ) : (
              <div className="flex h-[220px] items-center justify-center rounded-lg border border-dashed border-border/70 text-sm text-muted-foreground">
                Cargá ingresos pagados o egresos para ver el gráfico.
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      <Dialog open={Boolean(editingSummary)} onOpenChange={(open) => !open && setEditingSummary(null)}>
        <DialogContent className="w-[calc(100vw-2rem)] max-w-xl">
          <DialogHeader>
            <DialogTitle>Editar mes</DialogTitle>
            <DialogDescription>
              Ajustá los totales de {editingSummary ? getMonthLabel(editingSummary.month) : 'este mes'} sin tocar los registros originales.
            </DialogDescription>
          </DialogHeader>

          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="monthly-revenue">Ingresos pagados ARS</Label>
              <Input
                id="monthly-revenue"
                type="number"
                min="0"
                step="0.01"
                value={revenueValue}
                onChange={(event) => setRevenueValue(event.target.value)}
              />
              <p className="text-xs text-muted-foreground">
                Auto: {editingSummary ? formatFinanceCurrency(editingSummary.calculatedRevenueArs, 'ARS') : '-'}
              </p>
            </div>
            <div className="space-y-2">
              <Label htmlFor="monthly-expenses">Egresos ARS</Label>
              <Input
                id="monthly-expenses"
                type="number"
                min="0"
                step="0.01"
                value={expensesValue}
                onChange={(event) => setExpensesValue(event.target.value)}
              />
              <p className="text-xs text-muted-foreground">
                Auto: {editingSummary ? formatFinanceCurrency(editingSummary.calculatedExpensesArs, 'ARS') : '-'}
              </p>
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="monthly-notes">Nota interna</Label>
            <Textarea
              id="monthly-notes"
              value={notes}
              onChange={(event) => setNotes(event.target.value)}
              placeholder="Ej: Ajuste por gasto cargado fuera de fecha..."
            />
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setEditingSummary(null)}>
              Cancelar
            </Button>
            <Button onClick={handleSave} disabled={upsertOverride.isPending}>
              Guardar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
