import { Navigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';

interface ProtectedRouteProps {
  children: React.ReactNode;
  adminOnly?: boolean;
  financeOnly?: boolean;
}

export function ProtectedRoute({ children, adminOnly = false, financeOnly = false }: ProtectedRouteProps) {
  const { user, loading, isAdmin, role, canAccessFinance } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="animate-pulse text-muted-foreground">Loading...</div>
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/auth" replace />;
  }

  // Wait for role to be loaded
  if (role === null) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="animate-pulse text-muted-foreground">Loading...</div>
      </div>
    );
  }

  if (adminOnly && !isAdmin) {
    return <Navigate to="/dashboard" replace />;
  }

  if (financeOnly && !canAccessFinance) {
    return <Navigate to="/dashboard" replace />;
  }

  return <>{children}</>;
}
