import { 
  LayoutDashboard, 
  FolderKanban, 
  CheckSquare, 
  Activity, 
  Settings, 
  LogOut,
  Search,
  ChevronDown,
  Wallet,
  Users,
  Ticket,
  BookOpen
} from 'lucide-react';
import wavesLogo from '@/assets/waves-logo.png';

import { NavLink } from '@/components/NavLink';
import { ThemeToggleSwitch } from '@/components/ui/theme-toggle';
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarHeader,
  SidebarFooter,
  useSidebar,
} from '@/components/ui/sidebar';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/hooks/useAuth';
import { useProjects } from '@/hooks/useData';
import { useCurrentProfile } from '@/hooks/useProfiles';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { useState } from 'react';

const mainNavItems = [
  { title: 'Dashboard', url: '/', icon: LayoutDashboard },
  { title: 'Proyectos', url: '/projects', icon: FolderKanban },
  { title: 'Clientes', url: '/crm', icon: Users },
  { title: 'Tareas', url: '/tasks', icon: CheckSquare },
  { title: 'Soporte', url: '/support', icon: Ticket },
  { title: 'Finanzas', url: '/finance', icon: Wallet },
  { title: 'Recursos', url: '/resources', icon: BookOpen },
  { title: 'Actividad', url: '/activity', icon: Activity },
];

const clientNavItems = [
  { title: 'Dashboard', url: '/', icon: LayoutDashboard },
  { title: 'Proyectos', url: '/projects', icon: FolderKanban },
  { title: 'Mis Tickets', url: '/support', icon: Ticket },
  { title: 'Actividad', url: '/activity', icon: Activity },
];

export function AppSidebar() {
  const { state } = useSidebar();
  const { user, isAdmin, signOut, role } = useAuth();
  const { data: profile } = useCurrentProfile();
  const { data: projects = [] } = useProjects();
  const isCollapsed = state === 'collapsed';
  const [recentsOpen, setRecentsOpen] = useState(true);

  const navItems = isAdmin ? mainNavItems : clientNavItems;
  const displayName = profile?.name || user?.email?.split('@')[0] || 'User';
  const displayEmail = profile?.email || user?.email || '';
  const recentProjects = projects.slice(0, 4);

  return (
    <Sidebar collapsible="icon" className="border-r border-sidebar-border">
      {/* Header with logo */}
      <SidebarHeader className="py-5 pb-3 px-4 group-data-[collapsible=icon]:px-2">
        <div className="flex items-center gap-2.5 group-data-[collapsible=icon]:justify-center">
          <div 
            className="h-8 w-8 shrink-0"
            style={{
              backgroundColor: 'hsl(var(--sidebar-primary))',
              WebkitMaskImage: `url(${wavesLogo})`,
              WebkitMaskSize: 'contain',
              WebkitMaskRepeat: 'no-repeat',
              WebkitMaskPosition: 'center',
              maskImage: `url(${wavesLogo})`,
              maskSize: 'contain',
              maskRepeat: 'no-repeat',
              maskPosition: 'center',
            }}
          />
          {!isCollapsed && (
            <span className="font-semibold text-sidebar-primary text-[15px] tracking-tight">
              Waves Portal
            </span>
          )}
        </div>
      </SidebarHeader>

      {/* Search */}
      {!isCollapsed && (
        <div className="px-4 pb-2">
          <button className="w-full flex items-center gap-2 px-3 py-2 text-sm text-sidebar-foreground rounded-lg bg-sidebar-accent/50 hover:bg-sidebar-accent border border-sidebar-border/40 transition-smooth">
            <Search className="h-3.5 w-3.5 opacity-50" />
            <span className="flex-1 text-left text-xs opacity-60">Buscar...</span>
            <kbd className="text-[10px] px-1.5 py-0.5 rounded bg-background/40 text-muted-foreground font-mono">⌘K</kbd>
          </button>
        </div>
      )}

      <SidebarContent className="gap-0 px-3 group-data-[collapsible=icon]:px-1.5">
        {/* Main navigation */}
        <SidebarGroup className="py-1 px-0">
          <SidebarGroupContent>
            <SidebarMenu className="gap-0.5">
              {navItems.map((item) => (
                <SidebarMenuItem key={item.title}>
                  <SidebarMenuButton asChild tooltip={item.title}>
                    <NavLink
                      to={item.url}
                      end={item.url === '/'}
                      className="flex items-center gap-2.5 px-2.5 py-2 rounded-lg text-sm text-sidebar-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground transition-smooth group group-data-[collapsible=icon]:px-0 group-data-[collapsible=icon]:justify-center"
                      activeClassName="bg-sidebar-accent text-sidebar-primary font-medium"
                    >
                      <item.icon className="h-4 w-4 shrink-0 opacity-60 group-hover:opacity-100 transition-opacity" />
                      {!isCollapsed && <span>{item.title}</span>}
                    </NavLink>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        {/* Recents section */}
        {!isCollapsed && recentProjects.length > 0 && (
          <SidebarGroup className="pt-3 px-0">
            <Collapsible open={recentsOpen} onOpenChange={setRecentsOpen}>
              <CollapsibleTrigger asChild>
                <button className="flex items-center justify-between w-full px-2.5 py-1 text-[11px] font-semibold text-sidebar-foreground/60 uppercase tracking-widest hover:text-sidebar-foreground/80 transition-colors">
                  <span>Recientes</span>
                  <ChevronDown className={`h-3 w-3 transition-transform duration-200 ${recentsOpen ? '' : '-rotate-90'}`} />
                </button>
              </CollapsibleTrigger>
              <CollapsibleContent>
                <SidebarGroupContent className="mt-1">
                  <SidebarMenu className="gap-0.5">
                    {recentProjects.map((project) => (
                      <SidebarMenuItem key={project.id}>
                        <SidebarMenuButton asChild>
                          <NavLink
                            to={`/projects/${project.id}`}
                            className="flex items-center gap-2.5 px-2.5 py-1.5 rounded-lg text-sidebar-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground transition-smooth"
                            activeClassName="bg-sidebar-accent text-sidebar-primary"
                          >
                            <div className={`h-1.5 w-1.5 rounded-full shrink-0 ${
                              project.status === 'active' ? 'bg-accent-green' : 'bg-muted-foreground/40'
                            }`} />
                            <span className="truncate text-[13px]">{project.name}</span>
                          </NavLink>
                        </SidebarMenuButton>
                      </SidebarMenuItem>
                    ))}
                  </SidebarMenu>
                </SidebarGroupContent>
              </CollapsibleContent>
            </Collapsible>
          </SidebarGroup>
        )}

        {/* Spacer */}
        <div className="flex-1" />

        {/* Bottom section */}
        <SidebarGroup className="mt-auto pb-1 px-0">
          <SidebarGroupContent>
            <SidebarMenu className="gap-0.5">
              {!isCollapsed && (
                <SidebarMenuItem>
                  <ThemeToggleSwitch />
                </SidebarMenuItem>
              )}
              <SidebarMenuItem>
                <SidebarMenuButton asChild tooltip="Configuración">
                  <NavLink
                    to="/settings"
                    className="flex items-center gap-2.5 px-2.5 py-2 rounded-lg text-sm text-sidebar-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground transition-smooth group-data-[collapsible=icon]:px-0 group-data-[collapsible=icon]:justify-center"
                    activeClassName="bg-sidebar-accent text-sidebar-primary"
                  >
                    <Settings className="h-4 w-4 shrink-0 opacity-60" />
                    {!isCollapsed && <span>Configuración</span>}
                  </NavLink>
                </SidebarMenuButton>
              </SidebarMenuItem>
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>

      {/* User footer */}
      <SidebarFooter className="py-3 border-t border-sidebar-border px-4 group-data-[collapsible=icon]:px-2">
        <div className="flex items-center gap-2.5 group-data-[collapsible=icon]:justify-center">
          <Avatar className="h-8 w-8 border border-sidebar-border shrink-0">
            <AvatarImage src={profile?.avatar_url || undefined} alt={displayName} />
            <AvatarFallback className="bg-sidebar-accent text-sidebar-foreground text-[11px] font-medium">
              {displayName.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2)}
            </AvatarFallback>
          </Avatar>
          {!isCollapsed && (
            <>
              <div className="flex flex-col min-w-0 flex-1">
                <div className="flex items-center gap-1.5">
                  <span className="text-[13px] font-medium text-sidebar-primary truncate">
                    {displayName}
                  </span>
                  {role && (
                    <span className="text-[9px] px-1.5 py-0.5 rounded-md bg-foreground/10 text-foreground/70 uppercase font-semibold tracking-wide">
                      {role}
                    </span>
                  )}
                </div>
                <span className="text-[11px] text-sidebar-foreground/60 truncate">
                  {displayEmail}
                </span>
              </div>
              <Button
                variant="ghost"
                size="icon"
                onClick={signOut}
                className="h-7 w-7 text-sidebar-foreground/50 hover:bg-sidebar-accent hover:text-destructive shrink-0"
              >
                <LogOut className="h-3.5 w-3.5" />
              </Button>
            </>
          )}
        </div>
      </SidebarFooter>
    </Sidebar>
  );
}
