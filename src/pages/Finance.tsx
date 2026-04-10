import { useState } from 'react';
import { AppLayout } from '@/components/layout/AppLayout';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { FinanceOverview } from '@/components/finance/FinanceOverview';
import { FinanceRecordsList } from '@/components/finance/FinanceRecordsList';
import { ExpensesList } from '@/components/finance/ExpensesList';
import { ExpensesSummary } from '@/components/finance/ExpensesSummary';
// ARCA - comentado para más adelante
// import { ArcaSettings } from '@/components/finance/ArcaSettings';
// import { ArcaInvoicesList } from '@/components/finance/ArcaInvoicesList';

export default function Finance() {
  const [activeTab, setActiveTab] = useState('overview');

  return (
    <AppLayout title="Finanzas" description="Gestión de ingresos y gastos">
      <div className="space-y-6">
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="h-auto w-full flex-wrap justify-start bg-card border border-border/50 p-1 rounded-xl">
            <TabsTrigger 
              value="overview" 
              className="rounded-lg data-[state=active]:bg-primary data-[state=active]:text-primary-foreground"
            >
              Resumen
            </TabsTrigger>
            <TabsTrigger 
              value="records"
              className="rounded-lg data-[state=active]:bg-primary data-[state=active]:text-primary-foreground"
            >
              Ingresos
            </TabsTrigger>
            <TabsTrigger 
              value="expenses"
              className="rounded-lg data-[state=active]:bg-primary data-[state=active]:text-primary-foreground"
            >
              💸 Gastos
            </TabsTrigger>
          </TabsList>

          <TabsContent value="overview" className="mt-6">
            <FinanceOverview />
          </TabsContent>

          <TabsContent value="records" className="mt-6">
            <FinanceRecordsList />
          </TabsContent>

          <TabsContent value="expenses" className="mt-6 space-y-6">
            <ExpensesSummary />
            <ExpensesList />
          </TabsContent>

          {/* ARCA - comentado para más adelante
          <TabsContent value="invoices" className="mt-6">
            <ArcaInvoicesList />
          </TabsContent>

          <TabsContent value="arca-config" className="mt-6">
            <ArcaSettings />
          </TabsContent>
          */}
        </Tabs>
      </div>
    </AppLayout>
  );
}
