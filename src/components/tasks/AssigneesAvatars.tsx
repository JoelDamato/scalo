import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import { cn } from '@/lib/utils';
import type { Profile } from '@/hooks/useProfiles';

interface AssigneesAvatarsProps {
  assignees: { user_id: string; profile?: Profile }[];
  profiles: Profile[];
  maxDisplay?: number;
  size?: 'xs' | 'sm';
}

export function AssigneesAvatars({ assignees, profiles, maxDisplay = 3, size = 'xs' }: AssigneesAvatarsProps) {
  if (assignees.length === 0) return null;

  const sizeClasses = {
    xs: 'h-5 w-5 text-[9px]',
    sm: 'h-6 w-6 text-[10px]'
  };

  const displayAssignees = assignees.slice(0, maxDisplay);
  const remainingCount = assignees.length - maxDisplay;

  const getProfile = (userId: string) => profiles.find(p => p.user_id === userId);

  const getInitials = (name?: string) => {
    if (!name) return 'U';
    return name
      .split(' ')
      .map(n => n[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };

  return (
    <div className="flex items-center -space-x-1.5">
      {displayAssignees.map((assignee, index) => {
        const profile = getProfile(assignee.user_id);
        return (
          <Tooltip key={assignee.user_id}>
            <TooltipTrigger asChild>
              <Avatar 
                className={cn(
                  sizeClasses[size], 
                  'border-2 border-background ring-0',
                  'transition-transform hover:scale-110 hover:z-10'
                )}
                style={{ zIndex: displayAssignees.length - index }}
              >
                <AvatarImage src={profile?.avatar_url || undefined} alt={profile?.name} />
                <AvatarFallback className="bg-primary/20 text-primary font-medium">
                  {getInitials(profile?.name)}
                </AvatarFallback>
              </Avatar>
            </TooltipTrigger>
            <TooltipContent side="top" className="text-xs">
              {profile?.name || 'Usuario'}
            </TooltipContent>
          </Tooltip>
        );
      })}
      {remainingCount > 0 && (
        <Tooltip>
          <TooltipTrigger asChild>
            <Avatar className={cn(sizeClasses[size], 'border-2 border-background')}>
              <AvatarFallback className="bg-muted text-muted-foreground font-medium">
                +{remainingCount}
              </AvatarFallback>
            </Avatar>
          </TooltipTrigger>
          <TooltipContent side="top" className="text-xs">
            {remainingCount} más
          </TooltipContent>
        </Tooltip>
      )}
    </div>
  );
}
