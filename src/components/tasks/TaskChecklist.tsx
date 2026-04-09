import { useState } from 'react';
import { useTaskChecklist, useCreateChecklistItem, useUpdateChecklistItem, useDeleteChecklistItem } from '@/hooks/useTaskChecklist';
import { useAuth } from '@/hooks/useAuth';
import { Checkbox } from '@/components/ui/checkbox';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Plus, Trash2, Pencil, Check, X, CheckSquare } from 'lucide-react';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';

interface TaskChecklistProps {
  taskId: string;
}

export function TaskChecklist({ taskId }: TaskChecklistProps) {
  const { isAdmin } = useAuth();
  const { data: items = [], isLoading } = useTaskChecklist(taskId);
  const createItem = useCreateChecklistItem();
  const updateItem = useUpdateChecklistItem();
  const deleteItem = useDeleteChecklistItem();
  
  const [newItemContent, setNewItemContent] = useState('');
  const [isAdding, setIsAdding] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editContent, setEditContent] = useState('');

  const completedCount = items.filter(item => item.is_completed).length;
  const progress = items.length > 0 ? (completedCount / items.length) * 100 : 0;

  const handleAddItem = async () => {
    if (!newItemContent.trim()) return;
    
    try {
      await createItem.mutateAsync({ taskId, content: newItemContent.trim() });
      setNewItemContent('');
      setIsAdding(false);
    } catch (error) {
      toast.error('Error al agregar item');
    }
  };

  const handleToggleComplete = async (itemId: string, currentState: boolean) => {
    try {
      await updateItem.mutateAsync({ 
        itemId, 
        taskId,
        updates: { is_completed: !currentState } 
      });
    } catch (error) {
      toast.error('Error al actualizar');
    }
  };

  const handleStartEdit = (itemId: string, content: string) => {
    setEditingId(itemId);
    setEditContent(content);
  };

  const handleSaveEdit = async () => {
    if (!editingId || !editContent.trim()) return;
    
    try {
      await updateItem.mutateAsync({ 
        itemId: editingId, 
        taskId,
        updates: { content: editContent.trim() } 
      });
      setEditingId(null);
      setEditContent('');
    } catch (error) {
      toast.error('Error al editar');
    }
  };

  const handleCancelEdit = () => {
    setEditingId(null);
    setEditContent('');
  };

  const handleDelete = async (itemId: string) => {
    try {
      await deleteItem.mutateAsync({ itemId, taskId });
      toast.success('Item eliminado');
    } catch (error) {
      toast.error('Error al eliminar');
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent, action: 'add' | 'edit') => {
    if (e.key === 'Enter') {
      e.preventDefault();
      action === 'add' ? handleAddItem() : handleSaveEdit();
    } else if (e.key === 'Escape') {
      action === 'add' ? setIsAdding(false) : handleCancelEdit();
    }
  };

  if (isLoading) {
    return <div className="text-sm text-muted-foreground">Cargando checklist...</div>;
  }

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <h4 className="text-xs font-medium text-muted-foreground uppercase tracking-wide flex items-center gap-2">
          <CheckSquare className="h-3 w-3" />
          Checklist ({completedCount}/{items.length})
        </h4>
      </div>

      {items.length > 0 && (
        <div className="space-y-1">
          <Progress value={progress} className="h-1.5" />
          <span className="text-[10px] text-muted-foreground">{Math.round(progress)}% completado</span>
        </div>
      )}

      <div className="space-y-1">
        {items.map((item) => (
          <div 
            key={item.id} 
            className={cn(
              "group flex items-center gap-2 p-2 rounded-md transition-colors",
              "hover:bg-muted/50",
              item.is_completed && "opacity-60"
            )}
          >
            <Checkbox
              checked={item.is_completed}
              onCheckedChange={() => handleToggleComplete(item.id, item.is_completed)}
              disabled={!isAdmin}
            />
            
            {editingId === item.id ? (
              <div className="flex-1 flex items-center gap-1">
                <Input
                  value={editContent}
                  onChange={(e) => setEditContent(e.target.value)}
                  onKeyDown={(e) => handleKeyDown(e, 'edit')}
                  className="h-7 text-sm"
                  autoFocus
                />
                <Button size="icon" variant="ghost" className="h-7 w-7" onClick={handleSaveEdit}>
                  <Check className="h-3 w-3" />
                </Button>
                <Button size="icon" variant="ghost" className="h-7 w-7" onClick={handleCancelEdit}>
                  <X className="h-3 w-3" />
                </Button>
              </div>
            ) : (
              <>
                <span className={cn(
                  "flex-1 text-sm",
                  item.is_completed && "line-through text-muted-foreground"
                )}>
                  {item.content}
                </span>
                
                {isAdmin && (
                  <div className="opacity-0 group-hover:opacity-100 flex items-center gap-0.5 transition-opacity">
                    <Button 
                      size="icon" 
                      variant="ghost" 
                      className="h-6 w-6"
                      onClick={() => handleStartEdit(item.id, item.content)}
                    >
                      <Pencil className="h-3 w-3" />
                    </Button>
                    <Button 
                      size="icon" 
                      variant="ghost" 
                      className="h-6 w-6 text-destructive hover:text-destructive"
                      onClick={() => handleDelete(item.id)}
                    >
                      <Trash2 className="h-3 w-3" />
                    </Button>
                  </div>
                )}
              </>
            )}
          </div>
        ))}
      </div>

      {isAdmin && (
        isAdding ? (
          <div className="flex items-center gap-2">
            <Input
              value={newItemContent}
              onChange={(e) => setNewItemContent(e.target.value)}
              onKeyDown={(e) => handleKeyDown(e, 'add')}
              placeholder="Nuevo item..."
              className="h-8 text-sm"
              autoFocus
            />
            <Button 
              size="sm" 
              onClick={handleAddItem}
              disabled={!newItemContent.trim() || createItem.isPending}
            >
              Agregar
            </Button>
            <Button size="sm" variant="ghost" onClick={() => setIsAdding(false)}>
              <X className="h-4 w-4" />
            </Button>
          </div>
        ) : (
          <Button 
            variant="ghost" 
            size="sm" 
            className="w-full justify-start text-muted-foreground"
            onClick={() => setIsAdding(true)}
          >
            <Plus className="h-4 w-4 mr-2" />
            Agregar item
          </Button>
        )
      )}

      {items.length === 0 && !isAdding && (
        <p className="text-sm text-muted-foreground text-center py-2">
          Sin items en el checklist
        </p>
      )}
    </div>
  );
}
