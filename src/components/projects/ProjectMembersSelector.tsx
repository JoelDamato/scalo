import { useState, useEffect } from 'react';
import { useProfiles, Profile } from '@/hooks/useProfiles';
import { useProjectMembersWithProfiles, useSetProjectMembers } from '@/hooks/useProjectMembers';
import { Checkbox } from '@/components/ui/checkbox';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { cn } from '@/lib/utils';
import { Users, X, Check } from 'lucide-react';
import { toast } from 'sonner';

interface ProjectMembersSelectorProps {
  projectId: string;
  isAdmin: boolean;
}

export function ProjectMembersSelector({ projectId, isAdmin }: ProjectMembersSelectorProps) {
  const { data: allProfiles = [] } = useProfiles();
  const { data: members = [], isLoading } = useProjectMembersWithProfiles(projectId);
  const setMembers = useSetProjectMembers();
  
  // Get client profiles only (those without admin role - we'll filter by checking if they're NOT admins)
  // For now, show all profiles but prefer filtering
  const clientProfiles = allProfiles;
  
  const [selectedUserIds, setSelectedUserIds] = useState<string[]>([]);
  const [isEditing, setIsEditing] = useState(false);
  
  // Initialize selected from current members
  useEffect(() => {
    if (members.length > 0) {
      setSelectedUserIds(members.map(m => m.user_id));
    }
  }, [members]);
  
  const handleToggleMember = (userId: string) => {
    setSelectedUserIds(prev => 
      prev.includes(userId) 
        ? prev.filter(id => id !== userId)
        : [...prev, userId]
    );
  };
  
  const handleSave = async () => {
    try {
      await setMembers.mutateAsync({ projectId, userIds: selectedUserIds });
      toast.success('Miembros actualizados');
      setIsEditing(false);
    } catch (error) {
      toast.error('Error al actualizar miembros');
    }
  };
  
  const handleCancel = () => {
    setSelectedUserIds(members.map(m => m.user_id));
    setIsEditing(false);
  };
  
  const getInitials = (name: string) => {
    return name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);
  };

  // View mode - display current members
  if (!isEditing) {
    return (
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <p className="text-sm text-muted-foreground">
            Personas vinculadas a este proyecto
          </p>
          {isAdmin && (
            <Button variant="ghost" size="sm" onClick={() => setIsEditing(true)}>
              Editar
            </Button>
          )}
        </div>
        
        {members.length === 0 ? (
          <div className="text-center py-6 bg-muted/30 rounded-lg">
            <Users className="h-8 w-8 mx-auto text-muted-foreground/50 mb-2" />
            <p className="text-sm text-muted-foreground">Sin miembros asignados</p>
            {isAdmin && (
              <Button 
                variant="outline" 
                size="sm" 
                className="mt-3"
                onClick={() => setIsEditing(true)}
              >
                Agregar miembros
              </Button>
            )}
          </div>
        ) : (
          <div className="space-y-2">
            {members.map(member => (
              <div 
                key={member.id} 
                className="flex items-center gap-3 p-2 rounded-lg bg-muted/30 hover:bg-muted/50 transition-colors"
              >
                <Avatar className="h-8 w-8">
                  <AvatarImage src={member.profile?.avatar_url || undefined} />
                  <AvatarFallback className="text-xs bg-primary/10 text-primary">
                    {member.profile ? getInitials(member.profile.name) : '??'}
                  </AvatarFallback>
                </Avatar>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium truncate">
                    {member.profile?.name || 'Usuario'}
                  </p>
                  {member.profile?.email && (
                    <p className="text-xs text-muted-foreground truncate">
                      {member.profile.email}
                    </p>
                  )}
                </div>
                <Badge variant="secondary" className="text-xs">
                  {member.role === 'client' ? 'Cliente' : member.role}
                </Badge>
              </div>
            ))}
          </div>
        )}
      </div>
    );
  }

  // Edit mode - select members
  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <p className="text-sm font-medium">Seleccionar miembros</p>
        <div className="flex items-center gap-2">
          <Button variant="ghost" size="sm" onClick={handleCancel}>
            <X className="h-4 w-4 mr-1" />
            Cancelar
          </Button>
          <Button 
            size="sm" 
            onClick={handleSave}
            disabled={setMembers.isPending}
          >
            <Check className="h-4 w-4 mr-1" />
            Guardar
          </Button>
        </div>
      </div>
      
      <ScrollArea className="h-64 rounded-lg border">
        <div className="p-2 space-y-1">
          {clientProfiles.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-8">
              No hay usuarios disponibles
            </p>
          ) : (
            clientProfiles.map(profile => {
              const isSelected = selectedUserIds.includes(profile.user_id);
              
              return (
                <label
                  key={profile.user_id}
                  className={cn(
                    "flex items-center gap-3 p-2 rounded-lg cursor-pointer transition-colors",
                    isSelected 
                      ? "bg-primary/10 border border-primary/30" 
                      : "hover:bg-muted/50"
                  )}
                >
                  <Checkbox
                    checked={isSelected}
                    onCheckedChange={() => handleToggleMember(profile.user_id)}
                  />
                  <Avatar className="h-8 w-8">
                    <AvatarImage src={profile.avatar_url || undefined} />
                    <AvatarFallback className="text-xs bg-primary/10 text-primary">
                      {getInitials(profile.name)}
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium truncate">{profile.name}</p>
                    <p className="text-xs text-muted-foreground truncate">{profile.email}</p>
                  </div>
                </label>
              );
            })
          )}
        </div>
      </ScrollArea>
      
      <p className="text-xs text-muted-foreground">
        {selectedUserIds.length} seleccionado{selectedUserIds.length !== 1 ? 's' : ''}
      </p>
    </div>
  );
}
