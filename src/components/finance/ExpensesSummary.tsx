import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useExpenses, useExpenseStats, EXPENSE_CATEGORIES, getCategoryInfo, ExpenseCategory } from '@/hooks/useExpenses';
import { Skeleton } from '@/components/ui/skeleton';
import { TrendingDown, RefreshCw, Calendar, PiggyBank } from 'lucide-react';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';

function formatCurrency(amount: number, currency: string = 'ARS') {
  return new Intl.NumberFormat('es-AR', {
    style: 'currency',
    currency,
  }).format(amount);
}

export function ExpensesSummary() {
  const { isLoading } = useExpenses();
  const stats = useExpenseStats();

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
      title: 'Gastos Totales',
      value: formatCurrency(stats.totalExpenses),
      icon: TrendingDown,
      description: `${stats.expenseCount} registros`,
      color: 'text-red-400',
      bg: 'bg-red-500/10',
    },
    {
      title: 'Este Mes',
      value: formatCurrency(stats.monthlyExpenses),
      icon: Calendar,
      description: format(new Date(), 'MMMM yyyy', { locale: es }),
      color: 'text-blue-400',
      bg: 'bg-blue-500/10',
    },
    {
      title: 'Recurrentes',
      value: formatCurrency(stats.recurringTotal),
      icon: RefreshCw,
      description: 'Gastos fijos',
      color: 'text-amber-400',
      bg: 'bg-amber-500/10',
    },
    {
      title: 'Promedio Mensual',
      value: formatCurrency(stats.monthlyExpenses || stats.totalExpenses / 12),
      icon: PiggyBank,
      description: 'Estimado',
      color: 'text-emerald-400',
      bg: 'bg-emerald-500/10',
    },
  ];

  // Sort categories by total amount
  const sortedCategories = Object.entries(stats.byCategory)
    .sort(([, a], [, b]) => b.total - a.total);

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

      {/* Expenses by Category - Visual Cards */}
      <Card className="border-border/50 bg-card/50 backdrop-blur-sm">
        <CardHeader>
          <CardTitle className="text-lg">Gastos por Categoría</CardTitle>
        </CardHeader>
        <CardContent>
          {sortedCategories.length === 0 ? (
            <p className="text-muted-foreground text-center py-8">
              No hay gastos registrados aún
            </p>
          ) : (
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
              {sortedCategories.map(([category, data]) => {
                const catInfo = getCategoryInfo(category as ExpenseCategory);
                const percentage = stats.totalExpenses > 0 
                  ? ((data.total / stats.totalExpenses) * 100).toFixed(1)
                  : '0';

                return (
                  <div
                    key={category}
                    className={`p-4 rounded-xl border transition-all hover:scale-[1.02] ${catInfo.color}`}
                  >
                    <div className="flex items-center gap-3 mb-3">
                      <span className="text-2xl">{catInfo.icon}</span>
                      <div>
                        <p className="font-semibold">{catInfo.label}</p>
                        <p className="text-xs opacity-70">{data.count} registro{data.count !== 1 ? 's' : ''}</p>
                      </div>
                    </div>
                    <div className="flex items-end justify-between">
                      <span className="text-xl font-bold tabular-nums">
                        {formatCurrency(data.total)}
                      </span>
                      <span className="text-sm font-medium opacity-70">
                        {percentage}%
                      </span>
                    </div>
                    {/* Progress bar */}
                    <div className="mt-2 h-1.5 rounded-full bg-black/20 overflow-hidden">
                      <div
                        className="h-full bg-current rounded-full transition-all"
                        style={{ width: `${percentage}%` }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
