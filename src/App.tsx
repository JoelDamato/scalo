import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { ThemeProvider } from "next-themes";
import { AuthProvider } from "@/hooks/useAuth";
import { ProtectedRoute } from "@/components/auth/ProtectedRoute";
import Index from "./pages/Index";
import Projects from "./pages/Projects";
import ProjectDetail from "./pages/ProjectDetail";
import InitiativeDetail from "./pages/InitiativeDetail";
import Tasks from "./pages/Tasks";
import Activity from "./pages/Activity";
import Settings from "./pages/Settings";
import Finance from "./pages/Finance";
import CRM from "./pages/CRM";
import Auth from "./pages/Auth";
import Notifications from "./pages/Notifications";
import Support from "./pages/Support";
import WhatsApp from "./pages/WhatsApp";
import Resources from "./pages/Resources";
import SharedInitiative from "./pages/SharedInitiative";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const App = () => (
  <ThemeProvider attribute="class" defaultTheme="dark" enableSystem={false}>
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <TooltipProvider>
          <Toaster />
          <Sonner />
          <BrowserRouter>
            <Routes>
              <Route path="/auth" element={<Auth />} />
              <Route path="/" element={<ProtectedRoute><Index /></ProtectedRoute>} />
              <Route path="/projects" element={<ProtectedRoute><Projects /></ProtectedRoute>} />
              <Route path="/projects/:id" element={<ProtectedRoute><ProjectDetail /></ProtectedRoute>} />
              <Route path="/projects/:id/initiatives/:initiativeId" element={<ProtectedRoute><InitiativeDetail /></ProtectedRoute>} />
              <Route path="/tasks" element={<ProtectedRoute adminOnly><Tasks /></ProtectedRoute>} />
              <Route path="/activity" element={<ProtectedRoute><Activity /></ProtectedRoute>} />
              <Route path="/settings" element={<ProtectedRoute><Settings /></ProtectedRoute>} />
              <Route path="/finance" element={<ProtectedRoute adminOnly><Finance /></ProtectedRoute>} />
              <Route path="/crm" element={<ProtectedRoute adminOnly><CRM /></ProtectedRoute>} />
              <Route path="/support" element={<ProtectedRoute><Support /></ProtectedRoute>} />
              <Route path="/whatsapp" element={<ProtectedRoute adminOnly><WhatsApp /></ProtectedRoute>} />
              <Route path="/resources" element={<ProtectedRoute adminOnly><Resources /></ProtectedRoute>} />
              <Route path="/notifications" element={<ProtectedRoute><Notifications /></ProtectedRoute>} />
              <Route path="/shared/:token" element={<SharedInitiative />} />
              <Route path="*" element={<NotFound />} />
            </Routes>
            
          </BrowserRouter>
        </TooltipProvider>
      </AuthProvider>
    </QueryClientProvider>
  </ThemeProvider>
);

export default App;
