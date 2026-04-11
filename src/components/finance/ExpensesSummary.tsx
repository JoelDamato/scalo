import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useExpenses, useExpenseStats, getCategoryInfo, ExpenseCategory } from '@/hooks/useExpenses';
import { Skeleton } from '@/components/ui/skeleton';
import { TrendingDown, RefreshCw, Calendar, PiggyBank } from 'lucide-react';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import { formatFinanceCurrency } from '@/lib/finance-currency';

export function ExpensesSummary() {
  const { isLoading } = useExpenses();
  const stats = useExpenseStats();
  const nextRecurringExpense = stats.nextRecurringExpense;

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
      value: formatFinanceCurrency(stats.totalExpenses, 'ARS'),
      icon: TrendingDown,
      description: `${formatFinanceCurrency(stats.totalExpensesUsd, 'USD')} cargados en USD · ${stats.expenseCount} registros`,
      color: 'text-red-400',
      bg: 'bg-red-500/10',
    },
    {
      title: 'Este Mes',
      value: formatFinanceCurrency(stats.monthlyExpenses, 'ARS'),
      icon: Calendar,
      description: `${formatFinanceCurrency(stats.monthlyExpensesUsd, 'USD')} cargados en USD · ${format(new Date(), 'MMMM yyyy', { locale: es })}`,
      color: 'text-blue-400',
      bg: 'bg-blue-500/10',
    },
    {
      title: 'Fijos / Mes',
      value: formatFinanceCurrency(stats.recurringMonthlyEstimate, 'ARS'),
      icon: RefreshCw,
      description: stats.recurringCount > 0
        ? `${formatFinanceCurrency(stats.recurringMonthlyEstimateUsd, 'USD')} cargados en USD · ${stats.recurringCount} gasto${stats.recurringCount > 1 ? 's' : ''} fijo${stats.recurringCount > 1 ? 's' : ''}`
        : 'Sin gastos fijos',
      color: 'text-amber-400',
      bg: 'bg-amber-500/10',
    },
    {
      title: 'Próximo Cargo',
      value: nextRecurringExpense
        ? formatFinanceCurrency(Number(nextRecurringExpense.expense.amount), nextRecurringExpense.expense.currency)
        : 'Sin vencimientos',
      icon: PiggyBank,
      description: nextRecurringExpense
        ? `${format(nextRecurringExpense.nextOccurrence, 'dd MMM', { locale: es })} · ${nextRecurringExpense.expense.description}`
        : 'No hay gastos recurrentes activos',
      color: 'text-emerald-400',
      bg: 'bg-emerald-500/10',
    },
  ];

  // Sort categories by total amount
  const sortedCategories = Object.entries(stats.byCategory)
    .sort(([, a], [, b]) => b.total - a.total);

  return (
    <div className="space-y-6">
      <div className="rounded-xl border border-border/60 bg-muted/20 px-4 py-3 text-sm text-muted-foreground">
        Los totales se muestran en ARS y suman gastos en pesos más USD convertidos al dólar blue venta.
      </div>

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
                        {formatFinanceCurrency(data.total, 'ARS')}
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
