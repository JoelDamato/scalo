import { useOpportunities, useUpdateOpportunity, CustomerStage, Opportunity, Customer } from '@/hooks/useCRM';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Plus, DollarSign, Calendar, User } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { es } from 'date-fns/locale';
import { DragDropContext, Droppable, Draggable, DropResult } from '@hello-pangea/dnd';
import { toast } from 'sonner';

interface OpportunitiesPipelineProps {
  onCreateNew: (stage?: CustomerStage) => void;
  onViewOpportunity: (id: string) => void;
}

const pipelineStages: { key: CustomerStage; label: string; color: string }[] = [
  { key: 'lead', label: 'Leads', color: 'bg-blue-500' },
  { key: 'prospect', label: 'Prospectos', color: 'bg-amber-500' },
  { key: 'negotiation', label: 'Negociación', color: 'bg-purple-500' },
  { key: 'client', label: 'Ganados', color: 'bg-emerald-500' },
];

export function OpportunitiesPipeline({ onCreateNew, onViewOpportunity }: OpportunitiesPipelineProps) {
  const { data: opportunities = [], isLoading } = useOpportunities();
  const updateOpportunity = useUpdateOpportunity();

  const handleDragEnd = async (result: DropResult) => {
    if (!result.destination) return;
    
    const opportunityId = result.draggableId;
    const newStage = result.destination.droppableId as CustomerStage;
    
    try {
      await updateOpportunity.mutateAsync({
        id: opportunityId,
        stage: newStage,
        ...(newStage === 'client' ? { won_at: new Date().toISOString() } : {}),
      });
      toast.success('Oportunidad actualizada');
    } catch {
      toast.error('Error al actualizar');
    }
  };

  const getOpportunitiesByStage = (stage: CustomerStage) => {
    return opportunities.filter(o => o.stage === stage && !o.lost_at);
  };

  const formatCurrency = (value: number, currency: string) => {
    return new Intl.NumberFormat('es-AR', {
      style: 'currency',
      currency: currency || 'ARS',
      minimumFractionDigits: 0,
    }).format(value);
  };

  if (isLoading) {
    return <div className="p-8 text-center text-muted-foreground">Cargando pipeline...</div>;
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold">Pipeline de ventas</h3>
        <Button size="sm" onClick={() => onCreateNew()}>
          <Plus className="h-4 w-4 mr-1.5" />
          Nueva oportunidad
        </Button>
      </div>

      <DragDropContext onDragEnd={handleDragEnd}>
        <div className="grid grid-cols-4 gap-4">
          {pipelineStages.map((stage) => {
            const stageOpportunities = getOpportunitiesByStage(stage.key);
            const stageValue = stageOpportunities.reduce((sum, o) => sum + (o.value || 0), 0);
            
            return (
              <div key={stage.key} className="space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className={`h-2 w-2 rounded-full ${stage.color}`} />
                    <span className="font-medium text-sm">{stage.label}</span>
                    <Badge variant="secondary" className="text-xs">
                      {stageOpportunities.length}
                    </Badge>
                  </div>
                  <Button 
                    variant="ghost" 
                    size="icon" 
                    className="h-6 w-6 text-muted-foreground hover:text-foreground"
                    onClick={() => onCreateNew(stage.key)}
                  >
                    <Plus className="h-4 w-4" />
                  </Button>
                </div>
                <p className="text-xs text-muted-foreground">
                  {formatCurrency(stageValue, 'ARS')}
                </p>
                
                <Droppable droppableId={stage.key}>
                  {(provided, snapshot) => (
                    <div
                      ref={provided.innerRef}
                      {...provided.droppableProps}
                      className={`space-y-2 min-h-[200px] p-2 rounded-lg transition-colors ${
                        snapshot.isDraggingOver ? 'bg-muted/50' : 'bg-muted/20'
                      }`}
                    >
                      {stageOpportunities.map((opportunity, index) => (
                        <Draggable 
                          key={opportunity.id} 
                          draggableId={opportunity.id} 
                          index={index}
                        >
                          {(provided, snapshot) => (
                            <Card
                              ref={provided.innerRef}
                              {...provided.draggableProps}
                              {...provided.dragHandleProps}
                              className={`cursor-pointer transition-shadow ${
                                snapshot.isDragging ? 'shadow-lg' : ''
                              }`}
                              onClick={() => onViewOpportunity(opportunity.id)}
                            >
                              <CardContent className="p-3 space-y-2">
                                <p className="font-medium text-sm line-clamp-2">
                                  {opportunity.title}
                                </p>
                                
                                {opportunity.customer && (
                                  <p className="text-xs text-muted-foreground flex items-center gap-1">
                                    <User className="h-3 w-3" />
                                    {opportunity.customer.name}
                                  </p>
                                )}
                                
                                <div className="flex items-center justify-between">
                                  <span className="text-sm font-semibold text-primary flex items-center gap-1">
                                    <DollarSign className="h-3 w-3" />
                                    {formatCurrency(opportunity.value || 0, opportunity.currency)}
                                  </span>
                                  <Badge variant="outline" className="text-xs">
                                    {opportunity.probability}%
                                  </Badge>
                                </div>
                                
                                {opportunity.expected_close_date && (
                                  <p className="text-xs text-muted-foreground flex items-center gap-1">
                                    <Calendar className="h-3 w-3" />
                                    {formatDistanceToNow(new Date(opportunity.expected_close_date), { 
                                      addSuffix: true, 
                                      locale: es 
                                    })}
                                  </p>
                                )}
                              </CardContent>
                            </Card>
                          )}
                        </Draggable>
                      ))}
                      {provided.placeholder}
                    </div>
                  )}
                </Droppable>
              </div>
            );
          })}
        </div>
      </DragDropContext>
    </div>
  );
}
