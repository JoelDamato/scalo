import { useMemo, useState } from 'react';
import { Plus, Ticket } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { TicketCard } from '@/components/tickets/TicketCard';
import { ConvertTicketToTaskDialog } from '@/components/tickets/ConvertTicketToTaskDialog';
import { CreateTicketDialog } from '@/components/tickets/CreateTicketDialog';
import { useTickets } from '@/hooks/useTickets';

interface ProjectTicketsColumnProps {
  projectId: string;
  isReadOnly?: boolean;
}

export function ProjectTicketsColumn({ projectId, isReadOnly }: ProjectTicketsColumnProps) {
  const { data: tickets = [], isLoading } = useTickets();
  const [createDialogOpen, setCreateDialogOpen] = useState(false);

  const projectTickets = useMemo(
    () =>
      tickets.filter((ticket) =>
        ticket.project_id === projectId &&
        !ticket.converted_task_id &&
        ticket.status !== 'resolved' &&
        ticket.status !== 'closed'
      ),
    [projectId, tickets],
  );

  return (
    <div className="flex min-h-0 w-72 shrink-0 flex-1 flex-col">
      <div className="mb-3 flex items-center justify-between px-1">
        <div className="flex items-center gap-2">
          <div className="flex h-4 w-4 items-center justify-center rounded-full bg-orange-500/15">
            <Ticket className="h-3 w-3 text-orange-500" />
          </div>
          <h3 className="text-sm font-medium">Tickets</h3>
          <span className="rounded bg-muted px-1.5 py-0.5 text-xs text-muted-foreground">
            {projectTickets.length}
          </span>
        </div>
        {!isReadOnly && (
          <Button
            variant="ghost"
            size="sm"
            className="h-7 px-2 text-muted-foreground hover:bg-primary/10 hover:text-foreground"
            onClick={() => setCreateDialogOpen(true)}
          >
            <Plus className="h-4 w-4" />
          </Button>
        )}
      </div>

      <div className="kanban-column flex-1 space-y-2">
        {isLoading ? (
          <>
            <Skeleton className="h-28 w-full" />
            <Skeleton className="h-28 w-full" />
          </>
        ) : projectTickets.length === 0 ? (
          <button
            type="button"
            onClick={() => !isReadOnly && setCreateDialogOpen(true)}
            disabled={isReadOnly}
            className="flex w-full flex-col items-center justify-center gap-2 rounded-lg border-2 border-dashed border-muted-foreground/20 p-4 text-sm text-muted-foreground transition-all duration-200 hover:border-primary/40 hover:bg-primary/5 disabled:cursor-default disabled:hover:border-muted-foreground/20 disabled:hover:bg-transparent"
          >
            <Ticket className="h-5 w-5" />
            Sin tickets abiertos
          </button>
        ) : (
          projectTickets.map((ticket) => (
            <div key={ticket.id} className="space-y-2">
              <TicketCard ticket={ticket} />
              {!isReadOnly && (
                <ConvertTicketToTaskDialog ticket={ticket} variant="default" className="w-full" />
              )}
            </div>
          ))
        )}
      </div>

      <CreateTicketDialog
        open={createDialogOpen}
        onOpenChange={setCreateDialogOpen}
        defaultProjectId={projectId}
      />
    </div>
  );
}
