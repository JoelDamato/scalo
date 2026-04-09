import { useState } from 'react';
import { useCustomer, useUpdateCustomer, useDeleteCustomer, useInteractions, useCreateInteraction, CustomerStage, InteractionType } from '@/hooks/useCRM';
import { supabase } from '@/integrations/supabase/client';
import { useProfiles } from '@/hooks/useProfiles';
import { useAuth } from '@/hooks/useAuth';
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from '@/components/ui/sheet';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent } from '@/components/ui/card';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { 
  User, 
  Mail, 
  Phone, 
  Building2, 
  Calendar,
  MessageSquare,
  PhoneCall,
  Video,
  FileText,
  Send,
  Save,
  UserCheck,
  Link2,
  Trash2
} from 'lucide-react';
import { formatDistanceToNow, format } from 'date-fns';
import { es } from 'date-fns/locale';
import { toast } from 'sonner';

interface CustomerDetailSheetProps {
  customerId: string | null;
  onClose: () => void;
}

const stageLabels: Record<CustomerStage, string> = {
  lead: 'Lead',
  prospect: 'Prospecto',
  negotiation: 'En negociación',
  client: 'Cliente',
  churned: 'Perdido',
};

const stageColors: Record<CustomerStage, string> = {
  lead: 'bg-blue-500/20 text-blue-600',
  prospect: 'bg-amber-500/20 text-amber-600',
  negotiation: 'bg-purple-500/20 text-purple-600',
  client: 'bg-emerald-500/20 text-emerald-600',
  churned: 'bg-red-500/20 text-red-600',
};

const interactionIcons: Record<InteractionType, React.ElementType> = {
  call: PhoneCall,
  email: Mail,
  meeting: Video,
  note: FileText,
  whatsapp: MessageSquare,
  other: MessageSquare,
};

const interactionLabels: Record<InteractionType, string> = {
  call: 'Llamada',
  email: 'Email',
  meeting: 'Reunión',
  note: 'Nota',
  whatsapp: 'WhatsApp',
  other: 'Otro',
};

export function CustomerDetailSheet({ customerId, onClose }: CustomerDetailSheetProps) {
  const { user, isAdmin } = useAuth();
  const { data: customer, isLoading } = useCustomer(customerId || '');
  const { data: interactions = [] } = useInteractions(customerId || undefined);
  const { data: profiles = [] } = useProfiles();
  const updateCustomer = useUpdateCustomer();
  const deleteCustomer = useDeleteCustomer();
  const createInteraction = useCreateInteraction();
  
  const [isEditing, setIsEditing] = useState(false);
  const [showCreateUser, setShowCreateUser] = useState(false);
  const [createUserPassword, setCreateUserPassword] = useState('');
  const [creatingUser, setCreatingUser] = useState(false);
  const [editData, setEditData] = useState({
    name: '',
    email: '',
    phone: '',
    company: '',
    stage: 'lead' as CustomerStage,
    notes: '',
  });

  const [newInteraction, setNewInteraction] = useState({
    type: 'note' as InteractionType,
    subject: '',
    content: '',
  });

  const handleCreateUser = async () => {
    if (!customer?.email || !createUserPassword || !customerId) return;
    setCreatingUser(true);
    try {
      const { data, error } = await supabase.functions.invoke('create-user', {
        body: { email: customer.email, password: createUserPassword, name: customer.name },
      });
      if (error) throw error;
      if (data?.user?.id) {
        await updateCustomer.mutateAsync({ id: customerId, user_id: data.user.id });
        toast.success('Cuenta creada y vinculada correctamente');
        setShowCreateUser(false);
        setCreateUserPassword('');
      } else {
        throw new Error(data?.error || 'Error al crear usuario');
      }
    } catch (err: any) {
      toast.error(err.message || 'Error al crear la cuenta');
    } finally {
      setCreatingUser(false);
    }
  };

  const handleStartEdit = () => {
    if (customer) {
      setEditData({
        name: customer.name,
        email: customer.email || '',
        phone: customer.phone || '',
        company: customer.company || '',
        stage: customer.stage,
        notes: customer.notes || '',
      });
      setIsEditing(true);
    }
  };

  const handleSave = async () => {
    if (!customerId) return;
    
    try {
      await updateCustomer.mutateAsync({
        id: customerId,
        name: editData.name,
        email: editData.email || null,
        phone: editData.phone || null,
        company: editData.company || null,
        stage: editData.stage,
        notes: editData.notes || null,
      });
      toast.success('Cliente actualizado');
      setIsEditing(false);
    } catch {
      toast.error('Error al actualizar');
    }
  };

  const handleAddInteraction = async () => {
    if (!customerId || !user || !newInteraction.subject.trim()) {
      toast.error('El asunto es requerido');
      return;
    }

    try {
      await createInteraction.mutateAsync({
        customer_id: customerId,
        opportunity_id: null,
        type: newInteraction.type,
        subject: newInteraction.subject,
        content: newInteraction.content || null,
        interaction_date: new Date().toISOString(),
        follow_up_date: null,
        created_by: user.id,
      });
      toast.success('Interacción registrada');
      setNewInteraction({ type: 'note', subject: '', content: '' });
    } catch {
      toast.error('Error al registrar interacción');
    }
  };

  if (!customerId) return null;

  return (
    <Sheet open={!!customerId} onOpenChange={() => onClose()}>
      <SheetContent className="w-full sm:max-w-xl overflow-y-auto">
        {isLoading ? (
          <div className="flex items-center justify-center h-full">
            <p className="text-muted-foreground">Cargando...</p>
          </div>
        ) : customer ? (
          <>
            <SheetHeader className="pb-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="h-12 w-12 rounded-full bg-primary/10 flex items-center justify-center">
                    <User className="h-6 w-6 text-primary" />
                  </div>
                  <div>
                    <SheetTitle>{customer.name}</SheetTitle>
                    {customer.company && (
                      <p className="text-sm text-muted-foreground">{customer.company}</p>
                    )}
                  </div>
                </div>
                <Badge className={stageColors[customer.stage]} variant="secondary">
                  {stageLabels[customer.stage]}
                </Badge>
              </div>
            </SheetHeader>

            <Tabs defaultValue="info" className="mt-4">
              <TabsList className="w-full">
                <TabsTrigger value="info" className="flex-1">Info</TabsTrigger>
                <TabsTrigger value="interactions" className="flex-1">Historial</TabsTrigger>
              </TabsList>

              <TabsContent value="info" className="space-y-4 mt-4">
                {isEditing ? (
                  <div className="space-y-4">
                    <div className="space-y-2">
                      <Label>Nombre</Label>
                      <Input
                        value={editData.name}
                        onChange={(e) => setEditData({ ...editData, name: e.target.value })}
                      />
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label>Email</Label>
                        <Input
                          type="email"
                          value={editData.email}
                          onChange={(e) => setEditData({ ...editData, email: e.target.value })}
                        />
                      </div>
                      <div className="space-y-2">
                        <Label>Teléfono</Label>
                        <Input
                          value={editData.phone}
                          onChange={(e) => setEditData({ ...editData, phone: e.target.value })}
                        />
                      </div>
                    </div>
                    <div className="space-y-2">
                      <Label>Empresa</Label>
                      <Input
                        value={editData.company}
                        onChange={(e) => setEditData({ ...editData, company: e.target.value })}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>Estado</Label>
                      <Select
                        value={editData.stage}
                        onValueChange={(value) => setEditData({ ...editData, stage: value as CustomerStage })}
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {Object.entries(stageLabels).map(([key, label]) => (
                            <SelectItem key={key} value={key}>{label}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-2">
                      <Label>Notas</Label>
                      <Textarea
                        value={editData.notes}
                        onChange={(e) => setEditData({ ...editData, notes: e.target.value })}
                        rows={4}
                      />
                    </div>
                    <div className="flex gap-2">
                      <Button onClick={handleSave} disabled={updateCustomer.isPending}>
                        <Save className="h-4 w-4 mr-1.5" />
                        Guardar
                      </Button>
                      <Button variant="outline" onClick={() => setIsEditing(false)}>
                        Cancelar
                      </Button>
                    </div>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {/* User account link section */}
                    {isAdmin && (
                      <Card className="border-dashed">
                        <CardContent className="p-4 space-y-3">
                          <div className="flex items-center gap-2">
                            <Link2 className="h-4 w-4 text-primary" />
                            <p className="text-sm font-medium">Cuenta de usuario</p>
                          </div>
                          <p className="text-xs text-muted-foreground">
                            Vincula este cliente con una cuenta de usuario para que pueda acceder al portal de clientes.
                          </p>
                          <Select
                            value={customer.user_id || 'none'}
                            onValueChange={async (value) => {
                              try {
                                await updateCustomer.mutateAsync({
                                  id: customerId!,
                                  user_id: value === 'none' ? null : value,
                                });
                                toast.success(value === 'none' 
                                  ? 'Usuario desvinculado' 
                                  : 'Usuario vinculado correctamente'
                                );
                              } catch {
                                toast.error('Error al vincular usuario');
                              }
                            }}
                          >
                            <SelectTrigger>
                              <SelectValue placeholder="Seleccionar usuario..." />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="none">Sin usuario vinculado</SelectItem>
                              {profiles.map((profile) => (
                                <SelectItem key={profile.user_id} value={profile.user_id}>
                                  <div className="flex items-center gap-2">
                                    <UserCheck className="h-4 w-4 text-muted-foreground" />
                                    <span>{profile.name}</span>
                                    <span className="text-muted-foreground text-xs">
                                      ({profile.email})
                                    </span>
                                  </div>
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                          {customer.user_id && (
                            <div className="flex items-center gap-2 p-2 rounded-md bg-emerald-500/10 text-emerald-600 text-xs">
                              <UserCheck className="h-4 w-4" />
                              <span>Este cliente tiene acceso al portal</span>
                            </div>
                          )}
                          {!customer.user_id && customer.email && !showCreateUser && (
                            <Button 
                              variant="outline" 
                              size="sm" 
                              className="w-full mt-1"
                              onClick={() => setShowCreateUser(true)}
                            >
                              <User className="h-4 w-4 mr-2" />
                              Crear Usuario
                            </Button>
                          )}
                          {showCreateUser && (
                            <div className="space-y-2 mt-2 p-3 rounded-md border border-border bg-muted/30">
                              <p className="text-xs font-medium">Crear cuenta para: {customer.email}</p>
                              <Input
                                type="password"
                                placeholder="Contraseña"
                                value={createUserPassword}
                                onChange={(e) => setCreateUserPassword(e.target.value)}
                              />
                              <div className="flex gap-2">
                                <Button 
                                  size="sm" 
                                  className="flex-1" 
                                  onClick={handleCreateUser}
                                  disabled={creatingUser || !createUserPassword}
                                >
                                  {creatingUser ? 'Creando...' : 'Crear'}
                                </Button>
                                <Button 
                                  size="sm" 
                                  variant="ghost" 
                                  onClick={() => { setShowCreateUser(false); setCreateUserPassword(''); }}
                                >
                                  Cancelar
                                </Button>
                              </div>
                            </div>
                          )}
                        </CardContent>
                      </Card>
                    )}

                    <div className="grid grid-cols-2 gap-4">
                      {customer.email && (
                        <div className="flex items-center gap-2 text-sm">
                          <Mail className="h-4 w-4 text-muted-foreground" />
                          <span>{customer.email}</span>
                        </div>
                      )}
                      {customer.phone && (
                        <div className="flex items-center gap-2 text-sm">
                          <Phone className="h-4 w-4 text-muted-foreground" />
                          <span>{customer.phone}</span>
                        </div>
                      )}
                      {customer.company && (
                        <div className="flex items-center gap-2 text-sm">
                          <Building2 className="h-4 w-4 text-muted-foreground" />
                          <span>{customer.company}</span>
                        </div>
                      )}
                      <div className="flex items-center gap-2 text-sm">
                        <Calendar className="h-4 w-4 text-muted-foreground" />
                        <span>
                          {formatDistanceToNow(new Date(customer.created_at), { 
                            addSuffix: true, 
                            locale: es 
                          })}
                        </span>
                      </div>
                    </div>

                    {customer.source && (
                      <div>
                        <p className="text-xs text-muted-foreground mb-1">Fuente</p>
                        <p className="text-sm">{customer.source}</p>
                      </div>
                    )}

                    {customer.notes && (
                      <div>
                        <p className="text-xs text-muted-foreground mb-1">Notas</p>
                        <p className="text-sm whitespace-pre-wrap">{customer.notes}</p>
                      </div>
                    )}

                    <div className="flex gap-2">
                      <Button variant="outline" onClick={handleStartEdit}>
                        Editar información
                      </Button>
                      
                      {isAdmin && (
                        <AlertDialog>
                          <AlertDialogTrigger asChild>
                            <Button variant="destructive" size="icon">
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </AlertDialogTrigger>
                          <AlertDialogContent>
                            <AlertDialogHeader>
                              <AlertDialogTitle>¿Eliminar cliente?</AlertDialogTitle>
                              <AlertDialogDescription>
                                Esta acción eliminará permanentemente a <strong>{customer.name}</strong> y todas sus interacciones. Esta acción no se puede deshacer.
                              </AlertDialogDescription>
                            </AlertDialogHeader>
                            <AlertDialogFooter>
                              <AlertDialogCancel>Cancelar</AlertDialogCancel>
                              <AlertDialogAction
                                onClick={async () => {
                                  try {
                                    await deleteCustomer.mutateAsync(customerId!);
                                    toast.success('Cliente eliminado');
                                    onClose();
                                  } catch {
                                    toast.error('Error al eliminar cliente');
                                  }
                                }}
                                className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                              >
                                Eliminar
                              </AlertDialogAction>
                            </AlertDialogFooter>
                          </AlertDialogContent>
                        </AlertDialog>
                      )}
                    </div>
                  </div>
                )}
              </TabsContent>

              <TabsContent value="interactions" className="space-y-4 mt-4">
                {/* New interaction form */}
                <Card>
                  <CardContent className="p-4 space-y-3">
                    <p className="text-sm font-medium">Nueva interacción</p>
                    <div className="flex gap-2">
                      <Select
                        value={newInteraction.type}
                        onValueChange={(value) => setNewInteraction({ ...newInteraction, type: value as InteractionType })}
                      >
                        <SelectTrigger className="w-32">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {Object.entries(interactionLabels).map(([key, label]) => (
                            <SelectItem key={key} value={key}>{label}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <Input
                        placeholder="Asunto..."
                        value={newInteraction.subject}
                        onChange={(e) => setNewInteraction({ ...newInteraction, subject: e.target.value })}
                        className="flex-1"
                      />
                    </div>
                    <Textarea
                      placeholder="Detalles (opcional)..."
                      value={newInteraction.content}
                      onChange={(e) => setNewInteraction({ ...newInteraction, content: e.target.value })}
                      rows={2}
                    />
                    <Button 
                      size="sm" 
                      onClick={handleAddInteraction}
                      disabled={createInteraction.isPending}
                    >
                      <Send className="h-4 w-4 mr-1.5" />
                      Registrar
                    </Button>
                  </CardContent>
                </Card>

                {/* Interactions list */}
                <div className="space-y-3">
                  {interactions.length === 0 ? (
                    <p className="text-sm text-muted-foreground text-center py-8">
                      No hay interacciones registradas
                    </p>
                  ) : (
                    interactions.map((interaction) => {
                      const Icon = interactionIcons[interaction.type];
                      return (
                        <Card key={interaction.id}>
                          <CardContent className="p-3">
                            <div className="flex items-start gap-3">
                              <div className="h-8 w-8 rounded-full bg-muted flex items-center justify-center shrink-0">
                                <Icon className="h-4 w-4" />
                              </div>
                              <div className="flex-1 min-w-0">
                                <div className="flex items-center gap-2">
                                  <Badge variant="outline" className="text-xs">
                                    {interactionLabels[interaction.type]}
                                  </Badge>
                                  <span className="text-xs text-muted-foreground">
                                    {format(new Date(interaction.interaction_date), 'dd MMM yyyy, HH:mm', { locale: es })}
                                  </span>
                                </div>
                                <p className="font-medium text-sm mt-1">{interaction.subject}</p>
                                {interaction.content && (
                                  <p className="text-sm text-muted-foreground mt-1 whitespace-pre-wrap">
                                    {interaction.content}
                                  </p>
                                )}
                              </div>
                            </div>
                          </CardContent>
                        </Card>
                      );
                    })
                  )}
                </div>
              </TabsContent>
            </Tabs>
          </>
        ) : (
          <p className="text-center text-muted-foreground">Cliente no encontrado</p>
        )}
      </SheetContent>
    </Sheet>
  );
}
