import { useLocation, useNavigate } from 'react-router-dom';
import { LayoutDashboard, FolderKanban, CheckSquare, Ticket, Users } from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { cn } from '@/lib/utils';

const adminItems = [
  { label: 'Inicio', icon: LayoutDashboard, path: '/' },
  { label: 'Proyectos', icon: FolderKanban, path: '/projects' },
  { label: 'Clientes', icon: Users, path: '/crm' },
  { label: 'Tareas', icon: CheckSquare, path: '/tasks' },
  { label: 'Soporte', icon: Ticket, path: '/support' },
];

const clientItems = [
  { label: 'Inicio', icon: LayoutDashboard, path: '/' },
  { label: 'Proyectos', icon: FolderKanban, path: '/projects' },
  { label: 'Soporte', icon: Ticket, path: '/support' },
];

export function BottomNav() {
  const { isAdmin } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  const items = isAdmin ? adminItems : clientItems;

  const isActive = (path: string) => {
    if (path === '/') return location.pathname === '/';
    return location.pathname.startsWith(path);
  };

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 md:hidden bg-background/95 backdrop-blur-md border-t border-border safe-area-bottom">
      <div className="flex items-center justify-around h-14">
        {items.map((item) => {
          const active = isActive(item.path);
          return (
            <button
              key={item.path}
              onClick={() => navigate(item.path)}
              className={cn(
                "flex flex-col items-center justify-center gap-0.5 flex-1 h-full min-w-[44px] transition-colors",
                active ? "text-foreground" : "text-muted-foreground"
              )}
            >
              <div className="relative">
                <item.icon className={cn("h-5 w-5", active && "stroke-[2.5]")} />
                {active && (
                  <div className="absolute -bottom-1 left-1/2 -translate-x-1/2 h-0.5 w-4 rounded-full bg-foreground" />
                )}
              </div>
              <span className="text-[10px] font-medium leading-tight">{item.label}</span>
            </button>
          );
        })}
      </div>
    </nav>
  );
}
