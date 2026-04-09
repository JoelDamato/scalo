import { Bell } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { ScrollArea } from '@/components/ui/scroll-area';
import { useNotifications, useUnreadNotificationsCount, useMarkNotificationAsRead, useMarkAllNotificationsAsRead } from '@/hooks/useNotifications';
import { useProfiles } from '@/hooks/useProfiles';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { formatDistanceToNow } from 'date-fns';
import { es } from 'date-fns/locale';
import { useNavigate, Link } from 'react-router-dom';
import { cn } from '@/lib/utils';

export function NotificationBell() {
  const { data: notifications = [] } = useNotifications();
  const { data: unreadCount = 0 } = useUnreadNotificationsCount();
  const { data: profiles = [] } = useProfiles();
  const markAsRead = useMarkNotificationAsRead();
  const markAllAsRead = useMarkAllNotificationsAsRead();
  const navigate = useNavigate();

  const handleNotificationClick = async (notification: typeof notifications[0]) => {
    if (!notification.is_read) {
      await markAsRead.mutateAsync(notification.id);
    }
    if (notification.link) {
      navigate(notification.link);
    }
  };

  const getCreatorProfile = (createdBy: string | null) => {
    if (!createdBy) return null;
    return profiles.find(p => p.user_id === createdBy);
  };

  const getNotificationIcon = (type: string) => {
    switch (type) {
      case 'mention':
        return '💬';
      case 'assignment':
        return '📋';
      default:
        return '🔔';
    }
  };

  const recentNotifications = notifications.slice(0, 10);

  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button variant="ghost" size="icon" className="relative">
          <Bell className="h-5 w-5" />
          {unreadCount > 0 && (
            <span className="absolute -top-1 -right-1 h-5 w-5 rounded-full bg-destructive text-destructive-foreground text-xs font-medium flex items-center justify-center">
              {unreadCount > 9 ? '9+' : unreadCount}
            </span>
          )}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-80 p-0" align="end">
        <div className="flex items-center justify-between p-4 border-b">
          <h3 className="font-semibold">Notificaciones</h3>
          {unreadCount > 0 && (
            <Button 
              variant="ghost" 
              size="sm" 
              className="text-xs"
              onClick={() => markAllAsRead.mutate()}
            >
              Marcar todas como leídas
            </Button>
          )}
        </div>
        
        <ScrollArea className="h-[300px]">
          {recentNotifications.length === 0 ? (
            <div className="p-4 text-center text-muted-foreground text-sm">
              No tenés notificaciones
            </div>
          ) : (
            <div className="divide-y">
              {recentNotifications.map((notification) => {
                const creator = getCreatorProfile(notification.created_by);
                
                return (
                  <button
                    key={notification.id}
                    onClick={() => handleNotificationClick(notification)}
                    className={cn(
                      "w-full p-3 text-left hover:bg-accent/50 transition-colors flex gap-3",
                      !notification.is_read && "bg-accent/20"
                    )}
                  >
                    <div className="flex-shrink-0">
                      {creator ? (
                        <Avatar className="h-8 w-8">
                          <AvatarImage src={creator.avatar_url || undefined} />
                          <AvatarFallback className="text-xs">
                            {creator.name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2)}
                          </AvatarFallback>
                        </Avatar>
                      ) : (
                        <div className="h-8 w-8 rounded-full bg-muted flex items-center justify-center text-sm">
                          {getNotificationIcon(notification.type)}
                        </div>
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className={cn(
                        "text-sm truncate",
                        !notification.is_read && "font-medium"
                      )}>
                        {notification.title}
                      </p>
                      <p className="text-xs text-muted-foreground truncate">
                        {notification.message}
                      </p>
                      <p className="text-xs text-muted-foreground mt-1">
                        {formatDistanceToNow(new Date(notification.created_at), { 
                          addSuffix: true,
                          locale: es 
                        })}
                      </p>
                    </div>
                    {!notification.is_read && (
                      <div className="w-2 h-2 rounded-full bg-primary flex-shrink-0 mt-2" />
                    )}
                  </button>
                );
              })}
            </div>
          )}
        </ScrollArea>
        
        <div className="p-2 border-t">
          <Button variant="ghost" className="w-full text-sm" asChild>
            <Link to="/notifications">Ver todas las notificaciones</Link>
          </Button>
        </div>
      </PopoverContent>
    </Popover>
  );
}
