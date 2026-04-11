import { AppLayout } from '@/components/layout/AppLayout';
import { KanbanBoard } from '@/components/tasks/KanbanBoard';
import { Ticket } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { ConvertTicketToTaskDialog } from '@/components/tickets/ConvertTicketToTaskDialog';
import { TicketCard } from '@/components/tickets/TicketCard';
import { useTickets } from '@/hooks/useTickets';
import { useProjects } from '@/hooks/useData';

export default function Tasks() {
  const { data: tickets = [], isLoading: ticketsLoading } = useTickets();
  const { data: projects = [] } = useProjects();

  const actionableTickets = tickets.filter((ticket) =>
    !ticket.converted_task_id && ticket.status !== 'resolved' && ticket.status !== 'closed'
  );

  const projectById = new Map(projects.map((project) => [project.id, project]));

  return (
    <AppLayout title="Tareas Internas" description="Tareas operativas del equipo">
      <div className="h-full">
        <div className="mb-6">
          <div>
            <h2 className="text-xl font-semibold tracking-tight">Operaciones</h2>
            <p className="text-sm text-muted-foreground mt-0.5">
              Tareas internas del equipo, no vinculadas a proyectos de clientes
            </p>
          </div>
        </div>

        <Tabs defaultValue="board" className="h-full">
          <TabsList className="mb-4">
            <TabsTrigger value="board">Tablero</TabsTrigger>
            <TabsTrigger value="tickets" className="gap-2">
              <Ticket className="h-4 w-4" />
              Tickets
              {actionableTickets.length > 0 && (
                <Badge variant="secondary" className="ml-1 h-5 px-1.5 text-[10px]">
                  {actionableTickets.length}
                </Badge>
              )}
            </TabsTrigger>
          </TabsList>

          <TabsContent value="board" className="h-full">
            <KanbanBoard mode="internal" />
          </TabsContent>

          <TabsContent value="tickets">
            {ticketsLoading ? (
              <div className="space-y-3">
                {[1, 2, 3].map((item) => (
                  <Skeleton key={item} className="h-28 w-full" />
                ))}
              </div>
            ) : actionableTickets.length === 0 ? (
              <Card>
                <CardContent className="py-12 text-center">
                  <Ticket className="mx-auto h-10 w-10 text-muted-foreground/40" />
                  <p className="mt-3 text-sm font-medium">No hay tickets pendientes para pasar a tareas</p>
                  <p className="mt-1 text-sm text-muted-foreground">
                    Los tickets abiertos que todavía no fueron convertidos van a aparecer acá.
                  </p>
                </CardContent>
              </Card>
            ) : (
              <div className="grid gap-4 lg:grid-cols-2">
                {actionableTickets.map((ticket) => (
                  <div key={ticket.id} className="space-y-2">
                    <TicketCard ticket={ticket} />
                    <div className="flex flex-col gap-2 rounded-lg border border-dashed border-border/70 bg-muted/20 p-3 sm:flex-row sm:items-center sm:justify-between">
                      <div>
                        <p className="text-xs font-medium text-muted-foreground">Destino</p>
                        <p className="text-sm">
                          {ticket.project_id ? projectById.get(ticket.project_id)?.name || 'Proyecto asociado' : 'Tareas internas'}
                        </p>
                      </div>
                      <ConvertTicketToTaskDialog ticket={ticket} variant="default" />
                    </div>
                  </div>
                ))}
              </div>
            )}
          </TabsContent>
        </Tabs>
      </div>
    </AppLayout>
  );
}
