import { DollarSign, TrendingUp, Clock, CheckCircle2, AlertCircle } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useFinanceStats, useFinanceRecords } from '@/hooks/useFinance';
import { Skeleton } from '@/components/ui/skeleton';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';

function formatCurrency(amount: number) {
  return new Intl.NumberFormat('es-AR', {
    style: 'currency',
    currency: 'ARS',
  }).format(amount);
}

export function FinanceOverview() {
  const stats = useFinanceStats();
  const { data: records = [], isLoading } = useFinanceRecords();

  if (isLoading) {
    return (
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {[...Array(4)].map((_, i) => (
          <Skeleton key={i} className="h-32" />
        ))}
      </div>
    );
  }

  const statCards = [
    {
      title: 'Ingresos Totales',
      value: formatCurrency(stats.totalRevenue),
      icon: DollarSign,
      description: `${stats.recordCount} registros`,
      color: 'text-emerald-500',
      bg: 'bg-emerald-500/10',
    },
    {
      title: 'Este Mes',
      value: formatCurrency(stats.monthlyRevenue),
      icon: TrendingUp,
      description: format(new Date(), 'MMMM yyyy', { locale: es }),
      color: 'text-blue-500',
      bg: 'bg-blue-500/10',
    },
    {
      title: 'Pendiente',
      value: formatCurrency(stats.pendingRevenue),
      icon: Clock,
      description: 'Por cobrar',
      color: 'text-amber-500',
      bg: 'bg-amber-500/10',
    },
    {
      title: 'Cobrado',
      value: formatCurrency(stats.paidRevenue),
      icon: CheckCircle2,
      description: 'Pagos recibidos',
      color: 'text-emerald-500',
      bg: 'bg-emerald-500/10',
    },
  ];

  const recentRecords = records.slice(0, 5);

  return (
    <div className="space-y-6">
      {/* Stats Grid */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
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
                    <span className="font-semibold tabular-nums">
                      {formatCurrency(Number(record.amount))}
                    </span>
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
