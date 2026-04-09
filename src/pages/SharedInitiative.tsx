import { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { fetchInitiativeExportData, InitiativeExportData } from '@/hooks/useInitiativeExport';
import { automationKnowledgeBaseSections } from '@/data/automationKnowledgeBaseTemplates';
import { PHASE_SOP_CONFIGS } from '@/data/automationPhaseSOPs';
import { AUTOMATION_STEPS } from '@/hooks/useInitiatives';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Separator } from '@/components/ui/separator';
import { CheckCircle2, Circle, FileText, Loader2 } from 'lucide-react';
import wavesLogo from '@/assets/waves-logo.png';

const PRODUCT_TYPE_LABELS: Record<string, string> = {
  mvp: 'MVP',
  funnel: 'Funnel',
  app: 'App',
  automation: 'Automatización & IA',
  landing_page: 'Landing Page',
};

export default function SharedInitiative() {
  const { token } = useParams<{ token: string }>();
  const [data, setData] = useState<InitiativeExportData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function load() {
      if (!token) { setError('Token inválido'); setLoading(false); return; }

      // Fetch share record
      const { data: share, error: shareErr } = await supabase
        .from('initiative_shares' as any)
        .select('initiative_id')
        .eq('share_token', token)
        .eq('is_active', true)
        .maybeSingle();

      if (shareErr || !share) {
        setError('Este link no existe o fue revocado.');
        setLoading(false);
        return;
      }

      const exportData = await fetchInitiativeExportData((share as any).initiative_id);
      if (!exportData) {
        setError('No se pudo cargar la información.');
        setLoading(false);
        return;
      }

      setData(exportData);
      setLoading(false);
    }
    load();
  }, [token]);

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center space-y-4">
          <FileText className="w-12 h-12 text-muted-foreground mx-auto" />
          <h1 className="text-xl font-semibold text-foreground">{error || 'No encontrado'}</h1>
          <p className="text-muted-foreground text-sm">El documento que buscás no está disponible.</p>
        </div>
      </div>
    );
  }

  const isAutomation = data.initiative.product_type === 'automation';

  return (
    <div className="min-h-screen bg-background">
      {/* Navbar */}
      <header className="sticky top-0 z-50 border-b border-border bg-background/95 backdrop-blur-sm">
        <div className="max-w-4xl mx-auto px-6 py-3 flex items-center gap-3">
          <div 
            className="h-6 w-6 shrink-0"
            style={{
              backgroundColor: 'hsl(var(--foreground))',
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
          <span className="text-sm font-medium text-foreground">Waves Portal</span>
          <span className="text-xs text-muted-foreground ml-auto">Documento compartido</span>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-6 py-8 space-y-8">
        {/* Hero */}
        <div className="space-y-3">
          <p className="text-sm text-muted-foreground">{data.project.name}</p>
          <h1 className="text-3xl font-bold text-foreground">{data.initiative.name}</h1>
          <div className="flex items-center gap-3">
            <Badge variant="outline">{PRODUCT_TYPE_LABELS[data.initiative.product_type] || data.initiative.product_type}</Badge>
            <span className="text-sm text-muted-foreground">Estado: {data.initiative.status}</span>
            <span className="text-sm text-muted-foreground">Fase: {data.initiative.current_step}</span>
          </div>
        </div>

        <Separator />

        {isAutomation ? (
          <AutomationView data={data} />
        ) : (
          <StandardView data={data} />
        )}

        {/* Footer */}
        <Separator />
        <div className="text-center text-xs text-muted-foreground py-4 space-y-1">
          <p>Generado desde Waves Portal</p>
          <p>{new Date().toLocaleDateString('es-AR', { year: 'numeric', month: 'long', day: 'numeric' })}</p>
        </div>
      </main>
    </div>
  );
}

function AutomationView({ data }: { data: InitiativeExportData }) {
  const kb = data.knowledgeBase || {};

  return (
    <div className="space-y-8">
      {/* KB Sections */}
      {automationKnowledgeBaseSections.map((section) => {
        const sectionData = kb[section.key];
        const isEmpty = !sectionData || Object.keys(sectionData).length === 0;

        return (
          <section key={section.key} className="space-y-4">
            <h2 className="text-lg font-semibold text-foreground flex items-center gap-2">
            {isEmpty ? (
              <Circle className="w-4 h-4 text-muted-foreground" />
            ) : (
              <CheckCircle2 className="w-4 h-4 text-accent-green" />
            )}
              {section.title}
            </h2>

            {isEmpty ? (
              <p className="text-sm text-muted-foreground italic">Sin completar</p>
            ) : (
              <div className="bg-card border border-border rounded-lg p-5 space-y-3">
                {section.fields.map((field) => {
                  const val = sectionData?.[field.key];
                  if (val === undefined || val === null || val === '') return null;

                  return (
                    <div key={field.key}>
                      <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide mb-1">{field.label}</p>
                      {field.type === 'repeater' && Array.isArray(val) ? (
                        <div className="space-y-1">
                          {val.map((item: Record<string, any>, i: number) => {
                            const parts = Object.entries(item).filter(([, v]) => v).map(([k, v]) => `${k}: ${v}`).join(' · ');
                            return <p key={i} className="text-sm text-foreground">{i + 1}. {parts}</p>;
                          })}
                        </div>
                      ) : Array.isArray(val) ? (
                        <p className="text-sm text-foreground">{val.join(', ')}</p>
                      ) : typeof val === 'boolean' ? (
                        <p className="text-sm text-foreground">{val ? 'Sí' : 'No'}</p>
                      ) : (
                        <p className="text-sm text-foreground whitespace-pre-wrap">{String(val)}</p>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </section>
        );
      })}

      {/* Phase Progress */}
      <section className="space-y-4">
        <h2 className="text-lg font-semibold text-foreground">Progreso por Fase</h2>
        <div className="space-y-4">
          {AUTOMATION_STEPS.map((step) => {
            const sopConfig = PHASE_SOP_CONFIGS[step.step];
            if (!sopConfig) return null;
            const checklist = data.phaseChecklists?.[step.step] || [];
            const completed = sopConfig.checklist.filter((_, i) => !!checklist[i]).length;
            const total = sopConfig.checklist.length;
            const pct = total > 0 ? Math.round((completed / total) * 100) : 0;

            return (
              <div key={step.step} className="bg-card border border-border rounded-lg p-4 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium text-foreground">{sopConfig.title}</span>
                  <span className="text-xs text-muted-foreground">{completed}/{total} ({pct}%)</span>
                </div>
                <Progress value={pct} className="h-2" />
                <div className="space-y-1 mt-2">
                    {sopConfig.checklist.map((item, i) => (
                    <div key={i} className="flex items-center gap-2 text-sm">
                      {checklist[i] ? (
                        <CheckCircle2 className="w-3.5 h-3.5 text-accent-green shrink-0" />
                      ) : (
                        <Circle className="w-3.5 h-3.5 text-muted-foreground shrink-0" />
                      )}
                      <span className={checklist[i] ? 'text-foreground' : 'text-muted-foreground'}>{item.title}</span>
                    </div>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      </section>
    </div>
  );
}

function StandardView({ data }: { data: InitiativeExportData }) {
  return (
    <div className="space-y-8">
      {/* Brief */}
      {data.brief && (
        <section className="space-y-4">
          <h2 className="text-lg font-semibold text-foreground">📋 Brief</h2>
          <div className="bg-card border border-border rounded-lg p-5 space-y-4">
            {[
              ['Resumen Ejecutivo', data.brief.executive_summary],
              ['Problema', data.brief.problem_statement],
              ['Usuarios Objetivo', data.brief.target_users],
              ['Solución Propuesta', data.brief.proposed_solution],
              ['Objetivos', data.brief.product_objectives],
              ['Métricas de Éxito', data.brief.success_metrics],
            ].map(([label, value]) => {
              if (!value) return null;
              return (
                <div key={label as string}>
                  <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide mb-1">{label}</p>
                  <p className="text-sm text-foreground whitespace-pre-wrap">{value}</p>
                </div>
              );
            })}
          </div>
        </section>
      )}

      {/* Features */}
      {data.features.length > 0 && (
        <section className="space-y-4">
          <h2 className="text-lg font-semibold text-foreground">🧩 Features</h2>
          <div className="space-y-3">
            {data.features.map((f, i) => (
              <div key={i} className="bg-card border border-border rounded-lg p-4">
                <div className="flex items-center justify-between mb-2">
                  <span className="font-medium text-foreground">{f.name}</span>
                  <div className="flex gap-2">
                    <Badge variant="outline" className="text-xs">{f.priority}</Badge>
                    <Badge variant="secondary" className="text-xs">{f.complexity}</Badge>
                  </div>
                </div>
                {f.description && <p className="text-sm text-muted-foreground">{f.description}</p>}
              </div>
            ))}
          </div>
        </section>
      )}

      {/* Tech Docs */}
      {data.techDocs && (
        <section className="space-y-4">
          <h2 className="text-lg font-semibold text-foreground">🔧 Tech Docs</h2>
          <div className="bg-card border border-border rounded-lg p-5 space-y-4">
            {[
              ['Frontend Guidelines', data.techDocs.frontend_guidelines],
              ['Backend Structure', data.techDocs.backend_structure],
              ['Database Schema', data.techDocs.database_schema],
              ['Authentication', data.techDocs.authentication],
              ['Integrations', data.techDocs.integrations],
              ['Implementation Plan', data.techDocs.implementation_plan],
            ].map(([label, value]) => {
              if (!value) return null;
              return (
                <div key={label as string}>
                  <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide mb-1">{label}</p>
                  <p className="text-sm text-foreground whitespace-pre-wrap">{value as string}</p>
                </div>
              );
            })}
          </div>
        </section>
      )}
    </div>
  );
}
