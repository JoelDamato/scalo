import { AppLayout } from '@/components/layout/AppLayout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { useTheme } from 'next-themes';
import { Moon, Sun, Loader2, Bell } from 'lucide-react';
import { useState, useEffect } from 'react';
import { toast } from 'sonner';
import { Switch } from '@/components/ui/switch';
import { AvatarUpload } from '@/components/profile/AvatarUpload';
import { useCurrentProfile, useUpdateProfile } from '@/hooks/useProfiles';
import { usePushNotifications } from '@/hooks/usePushNotifications';

export default function Settings() {
  const { data: profile } = useCurrentProfile();
  const updateProfile = useUpdateProfile();
  const [name, setName] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  const pushNotifications = usePushNotifications();
  const { theme, setTheme } = useTheme();

  useEffect(() => {
    if (profile?.name) {
      setName(profile.name);
    }
  }, [profile?.name]);

  const handleSaveProfile = async () => {
    if (!name.trim()) return;
    setIsSaving(true);
    try {
      await updateProfile.mutateAsync({ name: name.trim() });
      toast.success('Perfil actualizado');
    } catch (error) {
      toast.error('Error al guardar');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <AppLayout title="Configuración" description="Administrá tu cuenta">
      <div className="max-w-2xl mx-auto space-y-6">
        <Card className="animate-fade-in">
          <CardHeader>
            <CardTitle className="text-base">Perfil</CardTitle>
            <CardDescription>Tu información personal</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center gap-6">
              <AvatarUpload size="lg" />
              <div className="flex-1 space-y-1">
                <p className="text-sm font-medium">{profile?.name || 'Usuario'}</p>
                <p className="text-sm text-muted-foreground">{profile?.email}</p>
                <p className="text-xs text-muted-foreground">Click en la foto para cambiarla</p>
              </div>
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="name">Nombre</Label>
                <Input 
                  id="name" 
                  value={name} 
                  onChange={(e) => setName(e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <Input id="email" type="email" value={profile?.email || ''} disabled />
              </div>
            </div>
            <div className="flex justify-end">
              <Button size="sm" onClick={handleSaveProfile} disabled={isSaving}>
                {isSaving ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
                Guardar cambios
              </Button>
            </div>
          </CardContent>
        </Card>

        <Card className="animate-fade-in" style={{ animationDelay: '50ms' }}>
          <CardHeader>
            <CardTitle className="text-base">Apariencia</CardTitle>
            <CardDescription>Personalizá cómo se ve la app</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              <Label>Tema</Label>
              <div className="grid grid-cols-2 gap-3">
                <button
                  onClick={() => setTheme('light')}
                  className={`flex items-center gap-3 p-4 rounded-xl border transition-all ${
                    theme === 'light'
                      ? 'border-primary bg-primary/5 ring-2 ring-primary/20'
                      : 'border-border hover:border-primary/50 hover:bg-accent/50'
                  }`}
                >
                  <div className={`p-2 rounded-lg ${theme === 'light' ? 'bg-primary text-primary-foreground' : 'bg-muted'}`}>
                    <Sun className="h-5 w-5" />
                  </div>
                  <div className="text-left">
                    <p className="font-medium text-sm">Claro</p>
                    <p className="text-xs text-muted-foreground">Luminoso y limpio</p>
                  </div>
                </button>
                <button
                  onClick={() => setTheme('dark')}
                  className={`flex items-center gap-3 p-4 rounded-xl border transition-all ${
                    theme === 'dark'
                      ? 'border-primary bg-primary/5 ring-2 ring-primary/20'
                      : 'border-border hover:border-primary/50 hover:bg-accent/50'
                  }`}
                >
                  <div className={`p-2 rounded-lg ${theme === 'dark' ? 'bg-primary text-primary-foreground' : 'bg-muted'}`}>
                    <Moon className="h-5 w-5" />
                  </div>
                  <div className="text-left">
                    <p className="font-medium text-sm">Oscuro</p>
                    <p className="text-xs text-muted-foreground">Más fácil para la vista</p>
                  </div>
                </button>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="animate-fade-in" style={{ animationDelay: '100ms' }}>
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <Bell className="h-4 w-4" />
              Notificaciones
            </CardTitle>
            <CardDescription>Configurá cómo recibís actualizaciones</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label className="text-sm font-medium">Push Notifications</Label>
                <p className="text-xs text-muted-foreground">
                  {pushNotifications.isSupported 
                    ? 'Recibí alertas como en WhatsApp cuando hay actividad'
                    : 'Tu navegador no soporta push notifications'}
                </p>
              </div>
              <Switch
                checked={pushNotifications.isSubscribed}
                onCheckedChange={(checked) => {
                  if (checked) pushNotifications.subscribe();
                  else pushNotifications.unsubscribe();
                }}
                disabled={!pushNotifications.isSupported || pushNotifications.isLoading}
              />
            </div>
          </CardContent>
        </Card>

        <Card className="animate-fade-in border-destructive/30" style={{ animationDelay: '150ms' }}>
          <CardHeader>
            <CardTitle className="text-base text-destructive">Zona de peligro</CardTitle>
            <CardDescription>Acciones irreversibles</CardDescription>
          </CardHeader>
          <CardContent>
            <Button variant="destructive" size="sm">
              Eliminar cuenta
            </Button>
          </CardContent>
        </Card>
      </div>
    </AppLayout>
  );
}
