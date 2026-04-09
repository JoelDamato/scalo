import { useState, useRef, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Calendar, MoreVertical, ArrowRight, Pencil } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { ProductInitiative, getCompletedSteps, getStepsForType, useDeleteInitiative, useUpdateInitiativeName } from '@/hooks/useInitiatives';
import { format } from 'date-fns';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';

interface InitiativeCardProps {
  initiative: ProductInitiative;
  projectId: string;
}

const productTypeLabels: Record<string, { label: string; color: string }> = {
  mvp: { label: 'MVP', color: 'bg-emerald-500/10 text-emerald-500 border-emerald-500/20' },
  funnel: { label: 'Funnel', color: 'bg-blue-500/10 text-blue-500 border-blue-500/20' },
  landing_page: { label: 'Landing Page', color: 'bg-cyan-500/10 text-cyan-500 border-cyan-500/20' },
  app: { label: 'App', color: 'bg-purple-500/10 text-purple-500 border-purple-500/20' },
  automation: { label: 'Automatización & IA', color: 'bg-amber-500/10 text-amber-500 border-amber-500/20' },
};

export function InitiativeCard({ initiative, projectId }: InitiativeCardProps) {
  const steps = getStepsForType(initiative.product_type);
  const completed = getCompletedSteps(initiative.current_step, initiative.product_type);
  const total = steps.length;
  const typeConfig = productTypeLabels[initiative.product_type] || productTypeLabels.mvp;
  const deleteInitiative = useDeleteInitiative();
  const updateName = useUpdateInitiativeName();
  const [isEditing, setIsEditing] = useState(false);
  const [editName, setEditName] = useState(initiative.name);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (isEditing) inputRef.current?.focus();
  }, [isEditing]);

  const handleRename = async () => {
    const trimmed = editName.trim();
    if (!trimmed || trimmed === initiative.name) {
      setEditName(initiative.name);
      setIsEditing(false);
      return;
    }
    try {
      await updateName.mutateAsync({ initiativeId: initiative.id, name: trimmed });
      toast.success('Nombre actualizado');
    } catch {
      toast.error('Error al renombrar');
      setEditName(initiative.name);
    }
    setIsEditing(false);
  };

  const handleDelete = async () => {
    if (confirm(`¿Eliminar "${initiative.name}"? Esta acción no se puede deshacer.`)) {
      try {
        await deleteInitiative.mutateAsync(initiative.id);
        toast.success('Producto eliminado');
      } catch {
        toast.error('Error al eliminar el producto');
      }
    }
  };

  return (
    <Card className="group hover:shadow-md transition-shadow">
      <CardContent className="p-4">
        <div className="flex items-start justify-between mb-3">
          <div className="flex-1">
            {isEditing ? (
              <input
                ref={inputRef}
                value={editName}
                onChange={(e) => setEditName(e.target.value)}
                onBlur={handleRename}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') handleRename();
                  if (e.key === 'Escape') { setEditName(initiative.name); setIsEditing(false); }
                }}
                className="font-semibold text-lg bg-transparent border-b border-primary outline-none w-full"
              />
            ) : (
              <h3 className="font-semibold text-lg group-hover:text-primary transition-colors">
                {initiative.name}
              </h3>
            )}
            <div className="flex items-center gap-2 mt-1 text-sm text-muted-foreground">
              <Calendar className="w-3.5 h-3.5" />
              <span>Creado {format(new Date(initiative.created_at), 'dd/MM/yyyy')}</span>
              <Badge variant="outline" className={cn('ml-2', typeConfig.color)}>
                {typeConfig.label}
              </Badge>
            </div>
          </div>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon" className="h-8 w-8">
                <MoreVertical className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={() => { setIsEditing(true); }}>
                <Pencil className="w-3.5 h-3.5 mr-2" />
                Renombrar
              </DropdownMenuItem>
              <DropdownMenuItem className="text-destructive" onClick={handleDelete}>
                Eliminar
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>

        {/* Progress steps */}
        <div className={cn('grid gap-1 mb-4', `grid-cols-${total}`)} style={{ gridTemplateColumns: `repeat(${total}, 1fr)` }}>
          {steps.map((step, index) => (
            <div
              key={step.step}
              className={cn(
                'h-1.5 rounded-full transition-colors',
                index < completed ? 'bg-primary' : 
                index === completed ? 'bg-primary/50' : 'bg-muted'
              )}
            />
          ))}
        </div>

        <div className="flex items-center justify-between">
          <span className="text-sm text-muted-foreground">
            {completed}/{total} {initiative.product_type === 'automation' ? 'fases' : 'pasos'}
          </span>
          <Link to={`/projects/${projectId}/initiatives/${initiative.id}`}>
            <Button variant="ghost" size="sm" className="gap-1">
              Ver producto
              <ArrowRight className="w-4 h-4" />
            </Button>
          </Link>
        </div>
      </CardContent>
    </Card>
  );
}
