import { AppLayout } from '@/components/layout/AppLayout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { useTheme } from 'next-themes';
import { Moon, Sun, Loader2, Bell, UserPlus, CalendarClock, Link2, Unlink } from 'lucide-react';
import { useState, useEffect } from 'react';
import { toast } from 'sonner';
import { Switch } from '@/components/ui/switch';
import { AvatarUpload } from '@/components/profile/AvatarUpload';
import { useCurrentProfile, useUpdateProfile } from '@/hooks/useProfiles';
import { usePushNotifications } from '@/hooks/usePushNotifications';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { useGoogleCalendarConnect, useGoogleCalendarDisconnect, useGoogleCalendarStatus } from '@/hooks/useGoogleCalendar';
import { useAdminProfiles } from '@/hooks/useAdminProfiles';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

export default function Settings() {
  const { role } = useAuth();
  const isSystemAdmin = role === 'admin';
  const { data: profile } = useCurrentProfile();
  const updateProfile = useUpdateProfile();
  const [name, setName] = useState('');
  const [phoneNumber, setPhoneNumber] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  const [newUserName, setNewUserName] = useState('');
  const [newUserEmail, setNewUserEmail] = useState('');
  const [newUserPassword, setNewUserPassword] = useState('');
  const [newUserPhoneNumber, setNewUserPhoneNumber] = useState('');
  const [newUserRole, setNewUserRole] = useState<'admin' | 'dev' | 'client'>('client');
  const [isCreatingUser, setIsCreatingUser] = useState(false);
  const pushNotifications = usePushNotifications();
  const { data: adminProfiles = [] } = useAdminProfiles();
  const googleCalendarStatus = useGoogleCalendarStatus();
  const connectGoogleCalendar = useGoogleCalendarConnect();
  const disconnectGoogleCalendar = useGoogleCalendarDisconnect();
  const { theme, setTheme } = useTheme();

  useEffect(() => {
    if (profile?.name) {
      setName(profile.name);
    }
    setPhoneNumber(profile?.phone_number || '');
  }, [profile?.name, profile?.phone_number]);

  const handleSaveProfile = async () => {
    if (!name.trim()) return;
    setIsSaving(true);
    try {
      await updateProfile.mutateAsync({ name: name.trim(), phone_number: phoneNumber.trim() || null });
      toast.success('Perfil actualizado');
    } catch (error) {
      toast.error('Error al guardar');
    } finally {
      setIsSaving(false);
    }
  };

  const handleSaveUserPhone = async (userId: string, nextPhoneNumber: string) => {
    try {
      const { error } = await supabase
        .from('profiles')
        .update({ phone_number: nextPhoneNumber.trim() || null })
        .eq('user_id', userId);

      if (error) throw error;
      toast.success('Teléfono actualizado');
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'No pude guardar el teléfono');
    }
  };

  const handleCreateUser = async () => {
    if (!newUserName.trim() || !newUserEmail.trim() || !newUserPassword.trim()) {
      toast.error('Completá nombre, email y contraseña');
      return;
    }

    if (!newUserEmail.includes('@')) {
      toast.error('Ingresá un email válido');
      return;
    }

    if (newUserPassword.length < 6) {
      toast.error('La contraseña debe tener al menos 6 caracteres');
      return;
    }

    setIsCreatingUser(true);

    try {
      const { data, error } = await supabase.functions.invoke('create-user', {
        body: {
          name: newUserName.trim(),
          email: newUserEmail.trim(),
          password: newUserPassword,
          phone_number: newUserPhoneNumber.trim() || null,
          role: newUserRole,
        },
      });

      if (error) {
        throw error;
      }

      if (data?.error) {
        throw new Error(data.error);
      }

      toast.success(`Usuario ${newUserRole} creado`);
      setNewUserName('');
      setNewUserEmail('');
      setNewUserPassword('');
      setNewUserPhoneNumber('');
      setNewUserRole('client');
    } catch (error) {
      console.error('Error creating user:', error);
      toast.error(error instanceof Error ? error.message : 'Error al crear el usuario');
    } finally {
      setIsCreatingUser(false);
    }
  };

  const handleConnectGoogleCalendar = () => {
    connectGoogleCalendar.mutate(undefined, {
      onError: (error) => {
        toast.error(error instanceof Error ? error.message : 'No pude conectar Google Calendar');
      },
    });
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
              <div className="space-y-2 sm:col-span-2">
                <Label htmlFor="phone-number">WhatsApp</Label>
                <Input
                  id="phone-number"
                  value={phoneNumber}
                  onChange={(e) => setPhoneNumber(e.target.value)}
                  placeholder="54911..."
                />
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
              <CalendarClock className="h-4 w-4" />
              Google Calendar
            </CardTitle>
            <CardDescription>
              Vincula tu calendario para llevar tareas y eventos del proyecto con fecha y hora.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="rounded-xl border border-border/60 bg-muted/20 p-4">
              {googleCalendarStatus.data?.connected ? (
                <div className="space-y-3">
                  <div>
                    <p className="text-sm font-medium">
                      Conectado como {googleCalendarStatus.data.connection?.google_email || 'tu cuenta de Google'}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      Calendario: {googleCalendarStatus.data.connection?.calendar_summary || 'Principal'}
                    </p>
                  </div>
                  <Button
                    variant="outline"
                    className="gap-2"
                    onClick={() => disconnectGoogleCalendar.mutate()}
                    disabled={disconnectGoogleCalendar.isPending}
                  >
                    {disconnectGoogleCalendar.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Unlink className="h-4 w-4" />}
                    Desconectar Google Calendar
                  </Button>
                </div>
              ) : (
                <div className="space-y-3">
                  <div>
                    <p className="text-sm font-medium">Todavía no hay un calendario vinculado</p>
                    <p className="text-xs text-muted-foreground">
                      Después podrás mandar tareas y eventos del calendario del proyecto a tu Google Calendar.
                    </p>
                  </div>
                  <Button
                    className="gap-2"
                    onClick={handleConnectGoogleCalendar}
                    disabled={connectGoogleCalendar.isPending}
                  >
                    {connectGoogleCalendar.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Link2 className="h-4 w-4" />}
                    Conectar Google Calendar
                  </Button>
                </div>
              )}
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

        {isSystemAdmin && (
          <Card className="animate-fade-in" style={{ animationDelay: '150ms' }}>
            <CardHeader>
              <CardTitle className="text-base flex items-center gap-2">
                <UserPlus className="h-4 w-4" />
                Altas de Usuarios
              </CardTitle>
              <CardDescription>
                Creá accesos nuevos para admin, dev o clientes desde una cuenta administradora.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-2 sm:col-span-2">
                  <Label htmlFor="new-user-name">Nombre</Label>
                  <Input
                    id="new-user-name"
                    placeholder="Ej: Joel Damato"
                    value={newUserName}
                    onChange={(e) => setNewUserName(e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="new-user-email">Email</Label>
                  <Input
                    id="new-user-email"
                    type="email"
                    placeholder="usuario@empresa.com"
                    value={newUserEmail}
                    onChange={(e) => setNewUserEmail(e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="new-user-password">Contraseña temporal</Label>
                  <Input
                    id="new-user-password"
                    type="password"
                    placeholder="Mínimo 6 caracteres"
                    value={newUserPassword}
                    onChange={(e) => setNewUserPassword(e.target.value)}
                  />
                </div>
                <div className="space-y-2 sm:col-span-2">
                  <Label htmlFor="new-user-phone">WhatsApp</Label>
                  <Input
                    id="new-user-phone"
                    placeholder="54911..."
                    value={newUserPhoneNumber}
                    onChange={(e) => setNewUserPhoneNumber(e.target.value)}
                  />
                </div>
                <div className="space-y-2 sm:col-span-2">
                  <Label>Rol</Label>
                  <Select value={newUserRole} onValueChange={(value: 'admin' | 'dev' | 'client') => setNewUserRole(value)}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="client">Cliente</SelectItem>
                      <SelectItem value="dev">Dev</SelectItem>
                      <SelectItem value="admin">Admin</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="rounded-lg border border-border/60 bg-muted/25 p-3 text-xs text-muted-foreground">
                El usuario se crea confirmado y puede ingresar enseguida con esa contraseña. Si elegís `admin`, tendrá acceso total. Si elegís `dev`, no verá Finanzas.
              </div>

              <div className="flex justify-end">
                <Button size="sm" onClick={handleCreateUser} disabled={isCreatingUser}>
                  {isCreatingUser ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
                  Crear usuario
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

        {isSystemAdmin && (
          <Card className="animate-fade-in" style={{ animationDelay: '175ms' }}>
            <CardHeader>
              <CardTitle className="text-base flex items-center gap-2">
                <Bell className="h-4 w-4" />
                WhatsApp por usuario
              </CardTitle>
              <CardDescription>
                Cargá el número de cada miembro del equipo para avisarle por WhatsApp cuando reciba tareas.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              {adminProfiles.length === 0 ? (
                <p className="text-sm text-muted-foreground">Todavía no hay miembros internos para configurar.</p>
              ) : (
                adminProfiles.map((internalProfile) => (
                  <div key={internalProfile.user_id} className="flex flex-col gap-3 rounded-lg border border-border/60 p-3 sm:flex-row sm:items-center">
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-medium">{internalProfile.name}</p>
                      <p className="text-xs text-muted-foreground">{internalProfile.email}</p>
                    </div>
                    <Input
                      defaultValue={internalProfile.phone_number || ''}
                      placeholder="54911..."
                      className="sm:w-[220px]"
                      onBlur={(event) => {
                        if ((internalProfile.phone_number || '') === event.target.value) return;
                        handleSaveUserPhone(internalProfile.user_id, event.target.value);
                      }}
                    />
                  </div>
                ))
              )}
            </CardContent>
          </Card>
        )}

        <Card className="animate-fade-in border-destructive/30" style={{ animationDelay: isSystemAdmin ? '220ms' : '150ms' }}>
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
