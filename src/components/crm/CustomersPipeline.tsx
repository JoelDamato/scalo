import { useState, useMemo } from 'react';
import { useCustomers, useUpdateCustomer, CustomerStage, Customer } from '@/hooks/useCRM';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Plus, Building2, Mail, Phone } from 'lucide-react';
import { formatDistanceToNow, isToday, isWithinInterval, subDays, startOfMonth, endOfMonth } from 'date-fns';
import { es } from 'date-fns/locale';
import { DragDropContext, Droppable, Draggable, DropResult } from '@hello-pangea/dnd';
import { toast } from 'sonner';
import { PipelineFilters, TimeFilter } from './PipelineFilters';

interface CustomersPipelineProps {
  onCreateNew: (stage?: CustomerStage) => void;
  onViewCustomer: (id: string) => void;
}

const pipelineStages: { key: CustomerStage; label: string; color: string }[] = [
  { key: 'lead', label: 'Leads', color: 'bg-blue-500' },
  { key: 'prospect', label: 'Prospectos', color: 'bg-amber-500' },
  { key: 'negotiation', label: 'Negociación', color: 'bg-purple-500' },
  { key: 'client', label: 'Clientes', color: 'bg-emerald-500' },
];

export function CustomersPipeline({ onCreateNew, onViewCustomer }: CustomersPipelineProps) {
  const { data: customers = [], isLoading } = useCustomers();
  const updateCustomer = useUpdateCustomer();
  
  const [searchQuery, setSearchQuery] = useState('');
  const [timeFilter, setTimeFilter] = useState<TimeFilter>('all');

  // Filter customers based on search and time
  const filteredCustomers = useMemo(() => {
    return customers.filter((customer) => {
      // Search filter
      const searchLower = searchQuery.toLowerCase();
      const matchesSearch = !searchQuery || 
        customer.name.toLowerCase().includes(searchLower) ||
        customer.email?.toLowerCase().includes(searchLower) ||
        customer.company?.toLowerCase().includes(searchLower) ||
        customer.phone?.toLowerCase().includes(searchLower);

      if (!matchesSearch) return false;

      // Time filter
      const createdAt = new Date(customer.created_at);
      const now = new Date();

      switch (timeFilter) {
        case 'today':
          return isToday(createdAt);
        case '7days':
          return isWithinInterval(createdAt, {
            start: subDays(now, 7),
            end: now,
          });
        case '30days':
          return isWithinInterval(createdAt, {
            start: subDays(now, 30),
            end: now,
          });
        case 'this_month':
          return isWithinInterval(createdAt, {
            start: startOfMonth(now),
            end: endOfMonth(now),
          });
        default:
          return true;
      }
    });
  }, [customers, searchQuery, timeFilter]);

  const handleDragEnd = async (result: DropResult) => {
    if (!result.destination) return;
    
    const customerId = result.draggableId;
    const newStage = result.destination.droppableId as CustomerStage;
    
    try {
      await updateCustomer.mutateAsync({
        id: customerId,
        stage: newStage,
      });
      toast.success('Cliente actualizado');
    } catch {
      toast.error('Error al actualizar');
    }
  };

  const getCustomersByStage = (stage: CustomerStage) => {
    return filteredCustomers.filter(c => c.stage === stage);
  };

  if (isLoading) {
    return <div className="p-8 text-center text-muted-foreground">Cargando pipeline...</div>;
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold">Pipeline de clientes</h3>
        <Button size="sm" onClick={() => onCreateNew()}>
          <Plus className="h-4 w-4 mr-1.5" />
          Nuevo cliente
        </Button>
      </div>

      {/* Filtros */}
      <PipelineFilters
        searchQuery={searchQuery}
        onSearchChange={setSearchQuery}
        timeFilter={timeFilter}
        onTimeFilterChange={setTimeFilter}
        totalCount={customers.length}
        filteredCount={filteredCustomers.length}
      />

      <DragDropContext onDragEnd={handleDragEnd}>
        <div className="grid grid-cols-4 gap-4">
          {pipelineStages.map((stage) => {
            const stageCustomers = getCustomersByStage(stage.key);
            
            return (
              <div key={stage.key} className="space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className={`h-2 w-2 rounded-full ${stage.color}`} />
                    <span className="font-medium text-sm">{stage.label}</span>
                    <Badge variant="secondary" className="text-xs">
                      {stageCustomers.length}
                    </Badge>
                  </div>
                  <Button 
                    variant="ghost" 
                    size="sm" 
                    className="h-7 px-2 text-muted-foreground hover:text-foreground hover:bg-primary/10"
                    onClick={() => onCreateNew(stage.key)}
                  >
                    <Plus className="h-4 w-4" />
                  </Button>
                </div>
                
                <Droppable droppableId={stage.key}>
                  {(provided, snapshot) => (
                    <div
                      ref={provided.innerRef}
                      {...provided.droppableProps}
                      className={`space-y-2 min-h-[200px] p-2 rounded-lg transition-colors ${
                        snapshot.isDraggingOver ? 'bg-muted/50' : 'bg-muted/20'
                      }`}
                    >
                      {stageCustomers.length === 0 && !snapshot.isDraggingOver && (
                        <div className="flex flex-col items-center justify-center py-8 text-center">
                          <p className="text-sm text-muted-foreground mb-3">Sin clientes</p>
                          <Button 
                            variant="outline" 
                            size="sm"
                            className="border-dashed"
                            onClick={() => onCreateNew(stage.key)}
                          >
                            <Plus className="h-4 w-4 mr-1.5" />
                            Añadir
                          </Button>
                        </div>
                      )}
                      
                      {stageCustomers.map((customer, index) => (
                        <Draggable 
                          key={customer.id} 
                          draggableId={customer.id} 
                          index={index}
                        >
                          {(provided, snapshot) => (
                            <Card
                              ref={provided.innerRef}
                              {...provided.draggableProps}
                              {...provided.dragHandleProps}
                              className={`cursor-pointer transition-shadow hover:shadow-md ${
                                snapshot.isDragging ? 'shadow-lg rotate-2' : ''
                              }`}
                              onClick={() => onViewCustomer(customer.id)}
                            >
                              <CardContent className="p-3 space-y-2">
                                <p className="font-medium text-sm line-clamp-1">
                                  {customer.name}
                                </p>
                                
                                {customer.company && (
                                  <p className="text-xs text-muted-foreground flex items-center gap-1">
                                    <Building2 className="h-3 w-3" />
                                    {customer.company}
                                  </p>
                                )}
                                
                                {customer.email && (
                                  <p className="text-xs text-muted-foreground flex items-center gap-1 truncate">
                                    <Mail className="h-3 w-3 flex-shrink-0" />
                                    <span className="truncate">{customer.email}</span>
                                  </p>
                                )}
                                
                                {customer.phone && (
                                  <p className="text-xs text-muted-foreground flex items-center gap-1">
                                    <Phone className="h-3 w-3" />
                                    {customer.phone}
                                  </p>
                                )}
                                
                                <p className="text-xs text-muted-foreground/70">
                                  {formatDistanceToNow(new Date(customer.created_at), { 
                                    addSuffix: true, 
                                    locale: es 
                                  })}
                                </p>
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
