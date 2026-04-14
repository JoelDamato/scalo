import { DollarSign, TrendingUp, AlertCircle, Landmark, ReceiptText } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useFinanceStats, useFinanceRecords } from '@/hooks/useFinance';
import { useExpenseStats } from '@/hooks/useExpenses';
import { Skeleton } from '@/components/ui/skeleton';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import { formatFinanceCurrency } from '@/lib/finance-currency';

export function FinanceOverview() {
  const stats = useFinanceStats();
  const expenseStats = useExpenseStats();
  const { data: records = [], isLoading } = useFinanceRecords();

  if (isLoading) {
    return (
      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-5">
        {[...Array(5)].map((_, i) => (
          <Skeleton key={i} className="h-32" />
        ))}
      </div>
    );
  }

  const profitArs = stats.paidRevenue - expenseStats.totalExpenses;
  const profitUsd = stats.paidRevenueUsd - expenseStats.totalExpensesUsd;
  const jotaArs = profitArs / 2;
  const jotaUsd = profitUsd / 2;

  const statCards = [
    {
      title: 'Ingresos',
      value: formatFinanceCurrency(stats.totalRevenue, 'ARS'),
      icon: DollarSign,
      description: `${formatFinanceCurrency(stats.totalRevenueUsd, 'USD')} cargados en USD · ${stats.recordCount} registros`,
      color: 'text-emerald-500',
      bg: 'bg-emerald-500/10',
    },
    {
      title: 'Egresos',
      value: formatFinanceCurrency(expenseStats.totalExpenses, 'ARS'),
      icon: ReceiptText,
      description: `${formatFinanceCurrency(expenseStats.totalExpensesUsd, 'USD')} cargados en USD · ${expenseStats.expenseCount} gastos`,
      color: 'text-rose-500',
      bg: 'bg-rose-500/10',
    },
    {
      title: 'Ganancia',
      value: formatFinanceCurrency(profitArs, 'ARS'),
      icon: TrendingUp,
      description: `${formatFinanceCurrency(profitUsd, 'USD')} neto en USD · cobrado menos gastos`,
      color: profitArs >= 0 ? 'text-blue-500' : 'text-rose-500',
      bg: profitArs >= 0 ? 'bg-blue-500/10' : 'bg-rose-500/10',
    },
    {
      title: 'Total Jota',
      value: formatFinanceCurrency(jotaArs, 'ARS'),
      icon: Landmark,
      description: `${formatFinanceCurrency(jotaUsd, 'USD')} · 50% después de gastos`,
      color: 'text-amber-500',
      bg: 'bg-amber-500/10',
    },
    {
      title: 'Total Tomás',
      value: formatFinanceCurrency(jotaArs, 'ARS'),
      icon: Landmark,
      description: `${formatFinanceCurrency(jotaUsd, 'USD')} · 50% después de gastos`,
      color: 'text-violet-500',
      bg: 'bg-violet-500/10',
    },
  ];

  const recentRecords = records.slice(0, 5);

  return (
    <div className="space-y-6">
      <div className="rounded-xl border border-border/60 bg-muted/20 px-4 py-3 text-sm text-muted-foreground">
        Los totales principales se muestran en ARS, convirtiendo los USD al dólar blue venta. La ganancia usa solo ingresos pagados; los pendientes no entran en el reparto.
      </div>

      {/* Stats Grid */}
      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-5">
        {statCards.map((stat) => (
          <Card key={stat.title} className="border-border/50 bg-card/50 backdrop-blur-sm">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                {stat.title}
              </CardTitle>
              <div className={`p-2 rounded-lg ${stat.bg}`}>
                <stat.icon className={`h-4 w-4 ${stat.color}`} />
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stat.value}</div>
              <p className="text-xs text-muted-foreground mt-1">{stat.description}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <Card className="border-border/50 bg-card/50 backdrop-blur-sm">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Ingresos del Mes</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-xl font-bold">{formatFinanceCurrency(stats.monthlyRevenue, 'ARS')}</div>
            <p className="text-xs text-muted-foreground mt-1">
              {formatFinanceCurrency(stats.monthlyRevenueUsd, 'USD')} cargados en USD · {format(new Date(), 'MMMM yyyy', { locale: es })}
            </p>
          </CardContent>
        </Card>
        <Card className="border-border/50 bg-card/50 backdrop-blur-sm">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Gastos del Mes</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-xl font-bold">{formatFinanceCurrency(expenseStats.monthlyExpenses, 'ARS')}</div>
            <p className="text-xs text-muted-foreground mt-1">
              {formatFinanceCurrency(expenseStats.monthlyExpensesUsd, 'USD')} cargados en USD · {format(new Date(), 'MMMM yyyy', { locale: es })}
            </p>
          </CardContent>
        </Card>
        <Card className="border-border/50 bg-card/50 backdrop-blur-sm">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Pendiente</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-xl font-bold">{formatFinanceCurrency(stats.pendingRevenue, 'ARS')}</div>
            <p className="text-xs text-muted-foreground mt-1">
              {formatFinanceCurrency(stats.pendingRevenueUsd, 'USD')} cargados en USD · por cobrar
            </p>
          </CardContent>
        </Card>
        <Card className="border-border/50 bg-card/50 backdrop-blur-sm">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Cobrado</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-xl font-bold">{formatFinanceCurrency(stats.paidRevenue, 'ARS')}</div>
            <p className="text-xs text-muted-foreground mt-1">
              {formatFinanceCurrency(stats.paidRevenueUsd, 'USD')} cargados en USD · recibido
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Recent Activity */}
      <Card className="border-border/50 bg-card/50 backdrop-blur-sm">
        <CardHeader>
          <CardTitle className="text-lg">Últimos Registros</CardTitle>
        </CardHeader>
        <CardContent>
          {recentRecords.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-8 text-muted-foreground">
              <AlertCircle className="h-8 w-8 mb-2 opacity-50" />
              <p>No hay registros aún</p>
            </div>
          ) : (
            <div className="space-y-3">
              {recentRecords.map((record) => (
                <div
                  key={record.id}
                  className="flex items-center justify-between p-3 rounded-lg bg-muted/30 hover:bg-muted/50 transition-colors"
                >
                  <div className="flex-1 min-w-0">
                    <p className="font-medium truncate">{record.description}</p>
                    <p className="text-sm text-muted-foreground">
                      {record.project?.name || 'Sin proyecto'} • {format(new Date(record.created_at), 'dd MMM yyyy', { locale: es })}
                    </p>
                  </div>
                  <div className="flex items-center gap-3">
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
                    <div className="text-right">
                      <p className={`font-semibold tabular-nums ${record.currency === 'USD' ? 'text-emerald-400' : ''}`}>
                        {formatFinanceCurrency(Number(record.amount), record.currency)}
                      </p>
                      {record.currency === 'USD' && (record.resolved_amount_ars !== null || record.amount_ars !== null) && (
                        <p className="text-xs text-muted-foreground">
                          {formatFinanceCurrency(Number(record.resolved_amount_ars ?? record.amount_ars ?? 0), 'ARS')}
                        </p>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
