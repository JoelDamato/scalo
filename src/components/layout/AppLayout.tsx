import { ReactNode } from 'react';
import { SidebarProvider, SidebarTrigger } from '@/components/ui/sidebar';
import { AppSidebar } from './AppSidebar';
import { Separator } from '@/components/ui/separator';
import { NotificationBell } from '@/components/notifications/NotificationBell';
import { BottomNav } from './BottomNav';
// import { VoiceAssistant } from '@/components/voice/VoiceAssistant';
import { AIChatBot } from '@/components/chat/AIChatBot';
import { useAuth } from '@/hooks/useAuth';
import { useDocumentTitle } from '@/hooks/useDocumentTitle';

interface AppLayoutProps {
  children: ReactNode;
  title?: string;
  description?: string;
}

export function AppLayout({ children, title, description }: AppLayoutProps) {
  const { isAdmin } = useAuth();
  useDocumentTitle(title);

  return (
    <SidebarProvider>
      <div className="min-h-screen flex w-full bg-background">
        <div className="hidden md:block">
          <AppSidebar />
        </div>
        <main className="flex-1 flex flex-col min-w-0">
          <header className="sticky top-0 z-10 flex h-12 md:h-14 items-center gap-3 border-b border-border bg-background/95 backdrop-blur-sm px-3 md:px-6">
            <SidebarTrigger className="-ml-1" />
            <Separator orientation="vertical" className="h-5 hidden sm:block" />
            {title && (
              <div className="flex flex-col min-w-0">
                <h1 className="text-sm font-medium truncate">{title}</h1>
                {description && (
                  <p className="text-[11px] text-muted-foreground truncate hidden sm:block">{description}</p>
                )}
              </div>
            )}
            <div className="ml-auto flex items-center gap-1.5">
              <NotificationBell />
            </div>
          </header>
          <div className="flex-1 overflow-auto bg-background">
            <div className="p-3 sm:p-4 md:p-6 pb-20 md:pb-6">
              {children}
            </div>
          </div>
        </main>
      </div>
      
      <BottomNav />
      <AIChatBot />
      {/* {isAdmin && <VoiceAssistant />} */}
    </SidebarProvider>
  );
}
