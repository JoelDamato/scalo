import { useState } from 'react';
import { AppLayout } from '@/components/layout/AppLayout';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { CRMMetrics } from '@/components/crm/CRMMetrics';
import { CustomersList } from '@/components/crm/CustomersList';
import { CustomersPipeline } from '@/components/crm/CustomersPipeline';
import { CreateCustomerDialog } from '@/components/crm/CreateCustomerDialog';
import { CustomerDetailSheet } from '@/components/crm/CustomerDetailSheet';
import { CRMCalendar } from '@/components/crm/CRMCalendar';
import { CRMAnnouncements } from '@/components/crm/CRMAnnouncements';
import type { CustomerStage } from '@/hooks/useCRM';

export default function CRM() {
  const [activeTab, setActiveTab] = useState('pipeline');
  const [createCustomerOpen, setCreateCustomerOpen] = useState(false);
  const [selectedCustomerId, setSelectedCustomerId] = useState<string | null>(null);
  const [defaultStage, setDefaultStage] = useState<CustomerStage>('lead');

  const handleCreateNew = (stage?: CustomerStage) => {
    setDefaultStage(stage || 'lead');
    setCreateCustomerOpen(true);
  };

  return (
    <AppLayout title="Clientes" description="Pipeline de clientes y proyectos">
      <div className="space-y-6">
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="bg-card border border-border/50 p-1 rounded-xl">
            <TabsTrigger 
              value="pipeline"
              className="rounded-lg data-[state=active]:bg-primary data-[state=active]:text-primary-foreground"
            >
              Pipeline
            </TabsTrigger>
            <TabsTrigger 
              value="customers" 
              className="rounded-lg data-[state=active]:bg-primary data-[state=active]:text-primary-foreground"
            >
              Lista
            </TabsTrigger>
            <TabsTrigger 
              value="calendar"
              className="rounded-lg data-[state=active]:bg-primary data-[state=active]:text-primary-foreground"
            >
              Calendario
            </TabsTrigger>
            <TabsTrigger 
              value="announcements"
              className="rounded-lg data-[state=active]:bg-primary data-[state=active]:text-primary-foreground"
            >
              Comunicados
            </TabsTrigger>
          </TabsList>

          <TabsContent value="pipeline" className="mt-6">
            <CustomersPipeline 
              onCreateNew={handleCreateNew}
              onViewCustomer={(id) => setSelectedCustomerId(id)}
            />
          </TabsContent>

          <TabsContent value="customers" className="mt-6">
            <CustomersList 
              onCreateNew={() => handleCreateNew()}
              onViewCustomer={(id) => setSelectedCustomerId(id)}
            />
          </TabsContent>

          <TabsContent value="calendar" className="mt-6">
            <CRMCalendar />
          </TabsContent>

          <TabsContent value="announcements" className="mt-6">
            <CRMAnnouncements />
          </TabsContent>
        </Tabs>

        <CRMMetrics />
      </div>

      <CreateCustomerDialog 
        open={createCustomerOpen} 
        onOpenChange={setCreateCustomerOpen}
        defaultStage={defaultStage}
      />
      <CustomerDetailSheet 
        customerId={selectedCustomerId}
        onClose={() => setSelectedCustomerId(null)}
      />
    </AppLayout>
  );
}
