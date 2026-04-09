import { useState } from 'react';
import { Plus } from 'lucide-react';
import { AppLayout } from '@/components/layout/AppLayout';
import { Button } from '@/components/ui/button';
import { TicketsList } from '@/components/tickets/TicketsList';
import { TicketMetrics } from '@/components/tickets/TicketMetrics';
import { CreateTicketDialog } from '@/components/tickets/CreateTicketDialog';
import { useAuth } from '@/hooks/useAuth';

export default function Support() {
  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const { isAdmin } = useAuth();

  return (
    <AppLayout 
      title={isAdmin ? "Soporte" : "Mis Tickets"} 
      description={isAdmin ? "Gestiona los tickets de soporte de clientes" : "Crea y gestiona tus solicitudes de soporte"}
    >
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-xl font-semibold tracking-tight">
              {isAdmin ? 'Cola de Tickets' : 'Mis Tickets'}
            </h2>
            <p className="text-sm text-muted-foreground mt-0.5">
              {isAdmin 
                ? 'Responde y gestiona las solicitudes de soporte' 
                : 'Envía consultas, reporta bugs o solicita funcionalidades'}
            </p>
          </div>
          
          <Button onClick={() => setCreateDialogOpen(true)}>
            <Plus className="h-4 w-4 mr-2" />
            Nuevo Ticket
          </Button>
        </div>

        {isAdmin && <TicketMetrics />}

        <TicketsList />
      </div>

      <CreateTicketDialog 
        open={createDialogOpen} 
        onOpenChange={setCreateDialogOpen} 
      />
    </AppLayout>
  );
}
