import { formatDistanceToNow } from 'date-fns';
import { es } from 'date-fns/locale';
import { Bug, Lightbulb, HelpCircle, MoreHorizontal, AlertTriangle } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import { SupportTicket, TicketCategory, TicketPriority, TicketStatus } from '@/hooks/useTickets';

interface TicketCardProps {
  ticket: SupportTicket;
  onClick?: () => void;
}

const categoryConfig: Record<TicketCategory, { icon: React.ElementType; label: string }> = {
  bug: { icon: Bug, label: 'Bug' },
  feature_request: { icon: Lightbulb, label: 'Feature' },
  question: { icon: HelpCircle, label: 'Consulta' },
  other: { icon: MoreHorizontal, label: 'Otro' },
};

const priorityConfig: Record<TicketPriority, { label: string; className: string }> = {
  low: { label: 'Baja', className: 'bg-muted text-muted-foreground' },
  medium: { label: 'Media', className: 'bg-blue-500/15 text-blue-500' },
  high: { label: 'Alta', className: 'bg-orange-500/15 text-orange-500' },
  urgent: { label: 'Urgente', className: 'bg-destructive/15 text-destructive' },
};

const statusConfig: Record<TicketStatus, { label: string; className: string }> = {
  open: { label: 'Abierto', className: 'bg-status-backlog/15 text-status-backlog' },
  in_progress: { label: 'En progreso', className: 'bg-status-in-progress/15 text-status-in-progress' },
  waiting_response: { label: 'Esperando respuesta', className: 'bg-status-review/15 text-status-review' },
  resolved: { label: 'Resuelto', className: 'bg-status-done/15 text-status-done' },
  closed: { label: 'Cerrado', className: 'bg-muted text-muted-foreground' },
};

export function TicketCard({ ticket, onClick }: TicketCardProps) {
  const CategoryIcon = categoryConfig[ticket.category].icon;
  const priority = priorityConfig[ticket.priority];
  const status = statusConfig[ticket.status];

  return (
    <Card 
      className={cn(
        "cursor-pointer transition-all hover:shadow-md hover:border-primary/30",
        ticket.priority === 'urgent' && ticket.status !== 'resolved' && ticket.status !== 'closed' && "border-destructive/50"
      )}
      onClick={onClick}
    >
      <CardContent className="p-4">
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-start gap-3 min-w-0 flex-1">
            <div className="p-2 rounded-lg bg-muted shrink-0">
              <CategoryIcon className="h-4 w-4 text-muted-foreground" />
            </div>
            
            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-2 mb-1">
                {ticket.priority === 'urgent' && ticket.status !== 'resolved' && ticket.status !== 'closed' && (
                  <AlertTriangle className="h-4 w-4 text-destructive shrink-0" />
                )}
                <h3 className="font-medium truncate">{ticket.subject}</h3>
              </div>
              
              {ticket.description && (
                <p className="text-sm text-muted-foreground line-clamp-2 mb-2">
                  {ticket.description}
                </p>
              )}
              
              <div className="flex items-center gap-2 flex-wrap">
                <Badge variant="outline" className={cn("text-xs", status.className)}>
                  {status.label}
                </Badge>
                <Badge variant="outline" className={cn("text-xs", priority.className)}>
                  {priority.label}
                </Badge>
                <span className="text-xs text-muted-foreground">
                  {formatDistanceToNow(new Date(ticket.created_at), { addSuffix: true, locale: es })}
                </span>
              </div>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
