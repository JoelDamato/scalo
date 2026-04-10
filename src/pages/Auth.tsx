import { useState } from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { toast } from 'sonner';
import { z } from 'zod';
import scaloLogo from '@/assets/scalo-logo.png';

const emailSchema = z.string().email('Ingresá un email válido');
const passwordSchema = z.string().min(6, 'La contraseña debe tener al menos 6 caracteres');

export default function Auth() {
  const { user, loading, signIn } = useAuth();
  const [isSubmitting, setIsSubmitting] = useState(false);

  const [loginEmail, setLoginEmail] = useState('');
  const [loginPassword, setLoginPassword] = useState('');

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="flex flex-col items-center gap-3">
          <img src={scaloLogo} alt="Scalo" className="h-10 w-10 animate-pulse rounded" />
          <p className="text-sm text-muted-foreground">Cargando...</p>
        </div>
      </div>
    );
  }

  if (user) {
    return <Navigate to="/dashboard" replace />;
  }

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      emailSchema.parse(loginEmail);
      passwordSchema.parse(loginPassword);
    } catch (err) {
      if (err instanceof z.ZodError) {
        toast.error(err.errors[0].message);
        return;
      }
    }
    setIsSubmitting(true);
    const { error } = await signIn(loginEmail, loginPassword);
    setIsSubmitting(false);
    if (error) {
      toast.error(error.message || 'Error al iniciar sesión');
    }
  };

  return (
    <div className="min-h-screen flex bg-background">
      {/* Left branding panel — hidden on mobile */}
      <div className="hidden lg:flex lg:w-1/2 relative overflow-hidden bg-card border-r border-border">
        <div className="absolute inset-0 bg-gradient-to-br from-foreground/[0.02] via-transparent to-foreground/[0.04]" />
        <div className="relative z-10 flex flex-col items-center justify-center w-full p-12 animate-fade-in">
          <img
            src={scaloLogo}
            alt="Scalo"
            className="h-28 w-28 mb-8 rounded-2xl shadow-[0_24px_80px_rgba(0,0,0,0.28)]"
          />
          <h2 className="text-3xl font-bold tracking-tight text-foreground mb-3">
            Scalo Portal
          </h2>
        </div>
        {/* Decorative circles */}
        <div className="absolute -bottom-32 -left-32 h-64 w-64 rounded-full bg-foreground/[0.03]" />
        <div className="absolute -top-16 -right-16 h-48 w-48 rounded-full bg-foreground/[0.02]" />
      </div>

      {/* Right form panel */}
      <div className="flex-1 flex items-center justify-center p-6 sm:p-8">
        <div className="w-full max-w-sm animate-fade-in" style={{ animationDelay: '100ms' }}>
          {/* Mobile logo */}
          <div className="flex items-center gap-2.5 mb-8 lg:hidden">
            <img src={scaloLogo} alt="Scalo" className="h-10 w-10 rounded-lg" />
            <span className="text-lg font-semibold tracking-tight">Scalo Portal</span>
          </div>

          <div className="mb-6">
            <h1 className="text-2xl font-semibold tracking-tight">Bienvenido</h1>
            <p className="text-sm text-muted-foreground mt-1">
              Ingresá a tu cuenta. Si necesitás acceso, pedilo a un administrador.
            </p>
          </div>

          <form onSubmit={handleLogin} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="login-email">Email</Label>
              <Input
                id="login-email"
                type="email"
                placeholder="tu@email.com"
                value={loginEmail}
                onChange={(e) => setLoginEmail(e.target.value)}
                required
                className="h-11"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="login-password">Contraseña</Label>
              <Input
                id="login-password"
                type="password"
                placeholder="••••••••"
                value={loginPassword}
                onChange={(e) => setLoginPassword(e.target.value)}
                required
                className="h-11"
              />
            </div>
            <Button type="submit" className="w-full h-11" disabled={isSubmitting}>
              {isSubmitting ? 'Ingresando...' : 'Ingresar'}
            </Button>
            <p className="text-xs text-center text-muted-foreground">
              El alta de cuentas ahora se gestiona desde una cuenta admin.
            </p>
          </form>
        </div>
      </div>
    </div>
  );
}
