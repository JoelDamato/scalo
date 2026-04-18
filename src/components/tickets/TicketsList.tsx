import { useMemo, useState } from 'react';
import { CheckCircle, Clock, Inbox, Search } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Skeleton } from '@/components/ui/skeleton';
import { TicketCard } from './TicketCard';
import { TicketDetailSheet } from './TicketDetailSheet';
import { useAuth } from '@/hooks/useAuth';
import { useTickets, SupportTicket, TicketStatus, TicketPriority, useUpdateTicket } from '@/hooks/useTickets';
import { toast } from 'sonner';

interface TicketsListProps {
  showFilters?: boolean;
}

type TicketSection = {
  key: 'pending' | 'in_progress' | 'finished';
  title: string;
  description: string;
  empty: string;
  icon: React.ElementType;
  tickets: SupportTicket[];
};

export function TicketsList({ showFilters = true }: TicketsListProps) {
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<TicketStatus | 'all'>('all');
  const [priorityFilter, setPriorityFilter] = useState<TicketPriority | 'all'>('all');
  const [selectedTicketId, setSelectedTicketId] = useState<string | null>(null);

  const { data: tickets = [], isLoading } = useTickets();
  const { isAdmin } = useAuth();
  const updateTicket = useUpdateTicket();

  const selectedTicket = useMemo(
    () => tickets.find((ticket) => ticket.id === selectedTicketId) || null,
    [selectedTicketId, tickets],
  );

  const filteredTickets = useMemo(() => tickets.filter(ticket => {
    const matchesSearch = !search || 
      ticket.subject.toLowerCase().includes(search.toLowerCase()) ||
      ticket.description?.toLowerCase().includes(search.toLowerCase());
    
    const matchesStatus = statusFilter === 'all' || ticket.status === statusFilter;
    const matchesPriority = priorityFilter === 'all' || ticket.priority === priorityFilter;

    return matchesSearch && matchesStatus && matchesPriority;
  }), [priorityFilter, search, statusFilter, tickets]);

  const ticketSections = useMemo<TicketSection[]>(() => [
    {
      key: 'pending',
      title: 'Pendientes',
      description: 'Nuevos o esperando respuesta',
      empty: 'No hay tickets pendientes',
      icon: Inbox,
      tickets: filteredTickets.filter((ticket) => ticket.status === 'open' || ticket.status === 'waiting_response'),
    },
    {
      key: 'in_progress',
      title: 'En curso',
      description: 'Tickets que ya están siendo trabajados',
      empty: 'No hay tickets en curso',
      icon: Clock,
      tickets: filteredTickets.filter((ticket) => ticket.status === 'in_progress'),
    },
    {
      key: 'finished',
      title: 'Finalizados',
      description: 'Resueltos y cerrados',
      empty: 'No hay tickets finalizados',
      icon: CheckCircle,
      tickets: filteredTickets.filter((ticket) => ticket.status === 'resolved' || ticket.status === 'closed'),
    },
  ], [filteredTickets]);

  const hasFilteredTickets = filteredTickets.length > 0;

  const handleStatusUpdate = async (ticket: SupportTicket, status: TicketStatus) => {
    try {
      await updateTicket.mutateAsync({
        ticketId: ticket.id,
        updates: {
          status,
          resolved_at: status === 'resolved' && !ticket.resolved_at
            ? new Date().toISOString()
            : ticket.resolved_at,
        },
      });

      toast.success(status === 'resolved' ? 'Ticket finalizado' : 'Ticket movido a en curso');
    } catch (error) {
      toast.error('No pude actualizar el ticket');
    }
  };

  if (isLoading) {
    return (
      <div className="space-y-3">
        {[1, 2, 3].map(i => (
          <Skeleton key={i} className="h-24 w-full" />
        ))}
      </div>
    );
  }

  return (
    <>
      {showFilters && (
        <div className="flex flex-col sm:flex-row gap-3 mb-4">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Buscar tickets..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-9"
            />
          </div>
          
          <div className="flex gap-2">
            <Select value={statusFilter} onValueChange={(v) => setStatusFilter(v as TicketStatus | 'all')}>
              <SelectTrigger className="w-[150px]">
                <SelectValue placeholder="Estado" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos</SelectItem>
                <SelectItem value="open">Abierto</SelectItem>
                <SelectItem value="in_progress">En progreso</SelectItem>
                <SelectItem value="waiting_response">Esperando</SelectItem>
                <SelectItem value="resolved">Resuelto</SelectItem>
                <SelectItem value="closed">Cerrado</SelectItem>
              </SelectContent>
            </Select>

            <Select value={priorityFilter} onValueChange={(v) => setPriorityFilter(v as TicketPriority | 'all')}>
              <SelectTrigger className="w-[130px]">
                <SelectValue placeholder="Prioridad" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todas</SelectItem>
                <SelectItem value="urgent">Urgente</SelectItem>
                <SelectItem value="high">Alta</SelectItem>
                <SelectItem value="medium">Media</SelectItem>
                <SelectItem value="low">Baja</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
      )}

      {!hasFilteredTickets ? (
        <div className="text-center py-12 text-muted-foreground">
          <p>No hay tickets{search || statusFilter !== 'all' || priorityFilter !== 'all' ? ' que coincidan con los filtros' : ''}</p>
        </div>
      ) : (
        <div className="grid gap-4 lg:grid-cols-3">
          {ticketSections.map((section) => (
            <section key={section.key} className="min-h-[240px] rounded-lg border border-border/70 bg-muted/20 p-3">
              <div className="mb-3 flex items-start justify-between gap-3">
                <div className="flex min-w-0 items-start gap-2">
                  <div className="rounded-md bg-background p-1.5 text-muted-foreground">
                    <section.icon className="h-4 w-4" />
                  </div>
                  <div className="min-w-0">
                    <h3 className="text-sm font-medium">{section.title}</h3>
                    <p className="text-xs text-muted-foreground">{section.description}</p>
                  </div>
                </div>
                <span className="rounded bg-background px-1.5 py-0.5 text-xs text-muted-foreground">
                  {section.tickets.length}
                </span>
              </div>

              {section.tickets.length === 0 ? (
                <div className="flex min-h-[140px] items-center justify-center rounded-lg border border-dashed border-border/70 px-4 text-center text-sm text-muted-foreground">
                  {section.empty}
                </div>
              ) : (
                <div className="space-y-3">
                  {section.tickets.map(ticket => (
                    <TicketCard 
                      key={ticket.id} 
                      ticket={ticket} 
                      onClick={() => setSelectedTicketId(ticket.id)}
                      actions={isAdmin ? (
                        <>
                          {ticket.status !== 'in_progress' && ticket.status !== 'resolved' && ticket.status !== 'closed' && (
                            <Button
                              type="button"
                              size="sm"
                              variant="outline"
                              className="h-8"
                              disabled={updateTicket.isPending}
                              onClick={(event) => {
                                event.stopPropagation();
                                handleStatusUpdate(ticket, 'in_progress');
                              }}
                            >
                              En curso
                            </Button>
                          )}
                          {ticket.status !== 'resolved' && ticket.status !== 'closed' && (
                            <Button
                              type="button"
                              size="sm"
                              className="h-8"
                              disabled={updateTicket.isPending}
                              onClick={(event) => {
                                event.stopPropagation();
                                handleStatusUpdate(ticket, 'resolved');
                              }}
                            >
                              Finalizar
                            </Button>
                          )}
                        </>
                      ) : null}
                    />
                  ))}
                </div>
              )}
            </section>
          ))}
        </div>
      )}

      <TicketDetailSheet
        ticket={selectedTicket}
        open={!!selectedTicketId}
        onOpenChange={(open) => !open && setSelectedTicketId(null)}
      />
    </>
  );
}
