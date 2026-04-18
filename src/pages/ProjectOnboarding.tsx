import { useMemo, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import {
  ArrowRight,
  BarChart3,
  CheckCircle2,
  Database,
  Loader2,
  LockKeyhole,
  Network,
  Sparkles,
  Workflow,
} from 'lucide-react';
import { toast } from 'sonner';
import scaloLogo from '@/assets/scalo-logo.png';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { useDocumentTitle } from '@/hooks/useDocumentTitle';

type OnboardingProject = {
  project_id: string;
  project_name: string;
  project_description: string | null;
  support_active: boolean;
};

const discoveryItems = [
  'Proceso de captación de clientes',
  'Flujo de ventas',
  'Seguimiento y cierre',
  'Operación interna',
  'Herramientas actuales',
  'Métricas disponibles',
  'Cuellos de botella',
];

const nextSteps = [
  { title: 'Relevamiento', description: 'Entendemos cómo funciona el negocio hoy.' },
  { title: 'Diseño del sistema', description: 'Definimos el mapa de procesos, datos y automatizaciones.' },
  { title: 'Desarrollo', description: 'Construimos la solución con foco en uso real.' },
  { title: 'Implementación', description: 'Conectamos herramientas, probamos y dejamos todo operativo.' },
  { title: 'Optimización y escalado', description: 'Medimos, ajustamos y mejoramos resultados.' },
];

const expectations = [
  'Información clara y honesta del negocio',
  'Accesos a herramientas si aplica',
  'Disponibilidad para responder dudas',
  'Compromiso con el proceso',
];

export default function ProjectOnboarding() {
  const { token = '' } = useParams<{ token: string }>();
  const navigate = useNavigate();
  const { user, loading } = useAuth();
  const [mode, setMode] = useState<'signup' | 'login'>('signup');
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const { data: project, isLoading, error } = useQuery({
    queryKey: ['project-onboarding', token],
    queryFn: async () => {
      const { data, error: rpcError } = await supabase.rpc('get_project_onboarding', {
        p_token: token,
      });

      if (rpcError) throw rpcError;
      return (data?.[0] ?? null) as OnboardingProject | null;
    },
    enabled: !!token,
  });

  const clientName = useMemo(() => {
    if (!project?.project_name) return 'tu negocio';
    return project.project_name;
  }, [project?.project_name]);

  useDocumentTitle(project ? `Onboarding ${project.project_name}` : 'Onboarding Scalo');

  const claimProject = async () => {
    const { data, error: claimError } = await supabase.rpc('claim_project_onboarding', {
      p_token: token,
    });

    if (claimError) throw claimError;
    return data;
  };

  const handleAuthenticatedAccess = async () => {
    setIsSubmitting(true);
    try {
      const projectId = await claimProject();
      toast.success('Proyecto vinculado a tu cuenta');
      navigate(`/projects/${projectId}`);
    } catch (claimError) {
      console.error('Error claiming project:', claimError);
      toast.error(claimError instanceof Error ? claimError.message : 'No pude vincular el proyecto');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleAuthSubmit = async (event: React.FormEvent) => {
    event.preventDefault();

    if (!email.trim() || !password.trim() || (mode === 'signup' && !name.trim())) {
      toast.error('Completá los datos requeridos');
      return;
    }

    if (password.length < 6) {
      toast.error('La contraseña debe tener al menos 6 caracteres');
      return;
    }

    setIsSubmitting(true);

    try {
      if (mode === 'signup') {
        const { data, error: signUpError } = await supabase.auth.signUp({
          email: email.trim(),
          password,
          options: {
            data: { name: name.trim() },
            emailRedirectTo: `${window.location.origin}/onboarding/${token}`,
          },
        });

        if (signUpError) throw signUpError;

        if (!data.session) {
          toast.success('Cuenta creada. Revisá tu email para confirmar el acceso.');
          return;
        }
      } else {
        const { error: signInError } = await supabase.auth.signInWithPassword({
          email: email.trim(),
          password,
        });

        if (signInError) throw signInError;
      }

      const projectId = await claimProject();
      toast.success('Acceso creado y proyecto vinculado');
      navigate(`/projects/${projectId}`);
    } catch (authError) {
      console.error('Onboarding auth error:', authError);
      toast.error(authError instanceof Error ? authError.message : 'No pude completar el acceso');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isLoading || loading) {
    return (
      <div className="min-h-screen bg-[#0f0f0f] text-white">
        <div className="flex min-h-screen items-center justify-center">
          <div className="flex flex-col items-center gap-4">
            <img src={scaloLogo} alt="Scalo" className="h-14 w-14 rounded-xl" />
            <Loader2 className="h-5 w-5 animate-spin text-zinc-400" />
          </div>
        </div>
      </div>
    );
  }

  if (error || !project) {
    return (
      <div className="min-h-screen bg-[#0f0f0f] px-6 py-12 text-white">
        <div className="mx-auto flex min-h-[70vh] max-w-xl flex-col items-center justify-center text-center">
          <img src={scaloLogo} alt="Scalo" className="mb-8 h-16 w-16 rounded-2xl" />
          <h1 className="text-3xl font-semibold">Link no disponible</h1>
          <p className="mt-3 text-zinc-400">
            Este onboarding no existe o el enlace está mal escrito. Pedinos el link nuevamente.
          </p>
        </div>
      </div>
    );
  }

  return (
    <main className="min-h-screen overflow-hidden bg-[#0f0f0f] text-white">
      <div className="pointer-events-none fixed inset-0">
        <div className="absolute left-1/2 top-0 h-[520px] w-[520px] -translate-x-1/2 rounded-full bg-[#c7a969]/10 blur-3xl" />
        <div className="absolute right-[-12rem] top-1/3 h-[420px] w-[420px] rounded-full bg-white/5 blur-3xl" />
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,rgba(255,255,255,0.08),transparent_35%),linear-gradient(rgba(255,255,255,0.035)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.035)_1px,transparent_1px)] bg-[size:auto,72px_72px,72px_72px]" />
      </div>

      <div className="relative mx-auto flex w-full max-w-7xl flex-col gap-20 px-5 py-6 sm:px-8 lg:px-10">
        <header className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <img src={scaloLogo} alt="Scalo" className="h-11 w-11 rounded-xl border border-white/10" />
            <div>
              <p className="text-sm font-semibold tracking-wide">Scalo</p>
              <p className="text-xs text-zinc-500">{project.project_name}</p>
            </div>
          </div>
          <span className="rounded-full border border-white/10 bg-white/[0.03] px-3 py-1 text-xs text-zinc-300">
            Onboarding de proyecto
          </span>
        </header>

        <section className="grid items-center gap-10 lg:grid-cols-[1.1fr_0.9fr]">
          <div className="space-y-8">
            <div className="inline-flex items-center gap-2 rounded-full border border-[#c7a969]/30 bg-[#c7a969]/10 px-4 py-2 text-sm text-[#e7d6a0]">
              <Sparkles className="h-4 w-4" />
              Inicio del proyecto
            </div>
            <div className="space-y-5">
              <h1 className="max-w-4xl text-5xl font-semibold tracking-[-0.05em] text-white sm:text-6xl lg:text-7xl">
                Bienvenido a Scalo
              </h1>
              <p className="max-w-2xl text-xl leading-8 text-zinc-300">
                Estamos por empezar a construir el sistema que va a ordenar, automatizar y escalar tu negocio.
              </p>
              <p className="max-w-2xl text-base leading-7 text-zinc-400">
                Este es el primer paso del proyecto. A partir de ahora vamos a trabajar juntos para transformar tu operación en un sistema claro, medible y escalable.
              </p>
            </div>
            <Button
              size="lg"
              className="h-12 rounded-full bg-[#d7bd7a] px-6 font-semibold text-black hover:bg-[#efdb9c]"
              onClick={() => document.getElementById('relevamiento')?.scrollIntoView({ behavior: 'smooth' })}
            >
              Comenzar relevamiento
              <ArrowRight className="ml-2 h-4 w-4" />
            </Button>
          </div>

          <Card className="border-white/10 bg-white/[0.04] shadow-2xl shadow-black/30 backdrop-blur-xl">
            <CardContent className="p-5 sm:p-6">
              <div className="rounded-3xl border border-white/10 bg-[#151515] p-5">
                <div className="mb-6 flex items-center justify-between">
                  <div>
                    <p className="text-xs uppercase tracking-[0.25em] text-[#d7bd7a]">Proyecto</p>
                    <h2 className="mt-2 text-2xl font-semibold">{project.project_name}</h2>
                  </div>
                  <Network className="h-8 w-8 text-[#d7bd7a]" />
                </div>
                <div className="grid gap-3">
                  {[
                    ['Sistema', 'Procesos claros y conectados'],
                    ['Automatización', 'Menos operación manual'],
                    ['Datos', 'Decisiones medibles'],
                  ].map(([title, description]) => (
                    <div key={title} className="rounded-2xl border border-white/10 bg-white/[0.03] p-4">
                      <p className="text-sm font-medium">{title}</p>
                      <p className="mt-1 text-sm text-zinc-500">{description}</p>
                    </div>
                  ))}
                </div>
              </div>
            </CardContent>
          </Card>
        </section>

        <section className="grid gap-6 lg:grid-cols-[0.9fr_1.1fr]">
          <div>
            <p className="text-sm uppercase tracking-[0.25em] text-[#d7bd7a]">Qué vamos a hacer</p>
            <h2 className="mt-3 text-3xl font-semibold tracking-tight sm:text-4xl">
              Primero entendemos. Después construimos.
            </h2>
          </div>
          <div className="space-y-4 text-lg leading-8 text-zinc-300">
            <p>Antes de construir cualquier solución, necesitamos entender en profundidad cómo funciona tu negocio hoy.</p>
            <p>Nuestro enfoque no es improvisar, sino diseñar un sistema a medida basado en datos reales y procesos existentes.</p>
          </div>
        </section>

        <section id="relevamiento" className="rounded-[2rem] border border-[#d7bd7a]/20 bg-[#d7bd7a]/[0.06] p-5 sm:p-8 lg:p-10">
          <div className="grid gap-10 lg:grid-cols-[0.95fr_1.05fr]">
            <div className="space-y-5">
              <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-[#d7bd7a] text-black">
                <Database className="h-6 w-6" />
              </div>
              <div>
                <p className="text-sm uppercase tracking-[0.25em] text-[#d7bd7a]">Etapa 1</p>
                <h2 className="mt-3 text-3xl font-semibold tracking-tight sm:text-4xl">
                  Relevamiento del negocio
                </h2>
              </div>
              <p className="text-lg leading-8 text-zinc-300">
                En esta etapa vamos a analizar todo tu negocio para detectar oportunidades de mejora y entender cómo construir un sistema eficiente.
              </p>
            </div>

            <div className="grid gap-3 sm:grid-cols-2">
              {discoveryItems.map((item) => (
                <div key={item} className="flex items-start gap-3 rounded-2xl border border-white/10 bg-black/25 p-4">
                  <CheckCircle2 className="mt-0.5 h-5 w-5 shrink-0 text-[#d7bd7a]" />
                  <span className="text-sm text-zinc-200">{item}</span>
                </div>
              ))}
            </div>
          </div>
          <p className="mt-8 rounded-2xl border border-white/10 bg-black/25 p-5 text-base leading-7 text-zinc-300">
            Con esta información vamos a diseñar un sistema que mejore tanto tu rendimiento comercial como operativo.
          </p>
        </section>

        <section className="space-y-8">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <p className="text-sm uppercase tracking-[0.25em] text-[#d7bd7a]">Qué sigue después</p>
              <h2 className="mt-3 text-3xl font-semibold tracking-tight sm:text-4xl">Plan de trabajo</h2>
            </div>
            <Workflow className="hidden h-10 w-10 text-zinc-600 sm:block" />
          </div>
          <div className="grid gap-4 md:grid-cols-5">
            {nextSteps.map((step, index) => (
              <div key={step.title} className="rounded-3xl border border-white/10 bg-white/[0.035] p-5">
                <span className="text-sm text-[#d7bd7a]">0{index + 1}</span>
                <h3 className="mt-4 text-base font-semibold">{step.title}</h3>
                <p className="mt-2 text-sm leading-6 text-zinc-500">{step.description}</p>
              </div>
            ))}
          </div>
        </section>

        <section className="grid gap-6 lg:grid-cols-2">
          <Card className="border-white/10 bg-white/[0.04]">
            <CardContent className="p-6 sm:p-8">
              <p className="text-sm uppercase tracking-[0.25em] text-[#d7bd7a]">Qué esperamos de vos</p>
              <h2 className="mt-3 text-3xl font-semibold tracking-tight">Para que funcione correctamente necesitamos:</h2>
              <div className="mt-6 space-y-3">
                {expectations.map((item) => (
                  <div key={item} className="flex items-center gap-3 text-zinc-300">
                    <CheckCircle2 className="h-5 w-5 text-[#d7bd7a]" />
                    <span>{item}</span>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          <Card className="border-white/10 bg-[#151515]">
            <CardContent className="p-6 sm:p-8">
              <div className="mb-5 flex items-center gap-3">
                <LockKeyhole className="h-5 w-5 text-[#d7bd7a]" />
                <p className="text-sm font-medium text-zinc-300">Acceso al portal del proyecto</p>
              </div>

              {user ? (
                <div className="space-y-4">
                  <h2 className="text-2xl font-semibold">Vincular este proyecto a tu cuenta</h2>
                  <p className="text-sm leading-6 text-zinc-400">
                    Ya estás logueado. Tocá el botón y vas a entrar al portal de {clientName}.
                  </p>
                  <Button
                    className="h-11 w-full rounded-full bg-[#d7bd7a] font-semibold text-black hover:bg-[#efdb9c]"
                    onClick={handleAuthenticatedAccess}
                    disabled={isSubmitting}
                  >
                    {isSubmitting ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
                    Vincular y entrar
                  </Button>
                </div>
              ) : (
                <form onSubmit={handleAuthSubmit} className="space-y-4">
                  <div>
                    <h2 className="text-2xl font-semibold">
                      {mode === 'signup' ? 'Creá tu cuenta' : 'Ingresá a tu cuenta'}
                    </h2>
                    <p className="mt-2 text-sm leading-6 text-zinc-400">
                      {mode === 'signup'
                        ? 'Con esta cuenta vas a poder ver el avance, tareas y recursos de tu proyecto.'
                        : 'Si ya tenés cuenta, ingresá y vinculamos este proyecto a tu usuario.'}
                    </p>
                  </div>

                  {mode === 'signup' ? (
                    <div className="space-y-2">
                      <Label htmlFor="client-name" className="text-zinc-300">Nombre</Label>
                      <Input
                        id="client-name"
                        value={name}
                        onChange={(event) => setName(event.target.value)}
                        placeholder="Tu nombre"
                        className="border-white/10 bg-black/30"
                      />
                    </div>
                  ) : null}

                  <div className="space-y-2">
                    <Label htmlFor="client-email" className="text-zinc-300">Email</Label>
                    <Input
                      id="client-email"
                      type="email"
                      value={email}
                      onChange={(event) => setEmail(event.target.value)}
                      placeholder="tu@email.com"
                      className="border-white/10 bg-black/30"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="client-password" className="text-zinc-300">Contraseña</Label>
                    <Input
                      id="client-password"
                      type="password"
                      value={password}
                      onChange={(event) => setPassword(event.target.value)}
                      placeholder="Mínimo 6 caracteres"
                      className="border-white/10 bg-black/30"
                    />
                  </div>

                  <Button
                    type="submit"
                    className="h-11 w-full rounded-full bg-[#d7bd7a] font-semibold text-black hover:bg-[#efdb9c]"
                    disabled={isSubmitting}
                  >
                    {isSubmitting ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
                    {mode === 'signup' ? 'Crear cuenta y entrar' : 'Ingresar y vincular'}
                  </Button>

                  <button
                    type="button"
                    className="w-full text-center text-sm text-zinc-400 underline-offset-4 hover:text-white hover:underline"
                    onClick={() => setMode((value) => (value === 'signup' ? 'login' : 'signup'))}
                  >
                    {mode === 'signup' ? 'Ya tengo cuenta' : 'Necesito crear una cuenta'}
                  </button>
                </form>
              )}
            </CardContent>
          </Card>
        </section>

        <section className="pb-16 text-center">
          <BarChart3 className="mx-auto mb-5 h-9 w-9 text-[#d7bd7a]" />
          <h2 className="mx-auto max-w-3xl text-3xl font-semibold tracking-tight sm:text-4xl">
            Estamos construyendo algo importante para tu negocio.
          </h2>
          <div className="mx-auto mt-5 max-w-3xl space-y-3 text-base leading-7 text-zinc-400">
            <p>Este proceso no es solo técnico, es estratégico.</p>
            <p>Nuestro objetivo es que tengas un sistema que te permita vender más, ordenar tu operación y escalar con claridad.</p>
          </div>
          <Button
            size="lg"
            className="mt-8 h-12 rounded-full bg-white px-6 font-semibold text-black hover:bg-zinc-200"
            onClick={() => document.getElementById('relevamiento')?.scrollIntoView({ behavior: 'smooth' })}
          >
            Empezar relevamiento
            <ArrowRight className="ml-2 h-4 w-4" />
          </Button>
        </section>
      </div>
    </main>
  );
}
