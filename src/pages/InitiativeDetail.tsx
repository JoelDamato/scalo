import { useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { ArrowLeft, Share2, Download, Loader2, Lock, Copy, Check, LinkIcon, XCircle } from 'lucide-react';
import { AppLayout } from '@/components/layout/AppLayout';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { InitiativeStepProgress } from '@/components/initiatives/InitiativeStepProgress';
import { BriefStep } from '@/components/initiatives/steps/BriefStep';
import { FeaturesStep } from '@/components/initiatives/steps/FeaturesStep';
import { PRDStep } from '@/components/initiatives/steps/PRDStep';
import { ScreensStep } from '@/components/initiatives/steps/ScreensStep';
import { TechDocsStep } from '@/components/initiatives/steps/TechDocsStep';
import { ImplementationStep } from '@/components/initiatives/steps/ImplementationStep';
import { AutomationKickoffStep } from '@/components/initiatives/steps/AutomationKickoffStep';
import { AutomationPhaseStep } from '@/components/initiatives/steps/AutomationPhaseStep';
import {
  useInitiative,
  useUpdateInitiativeStep,
  InitiativeStep,
  getStepIndex,
  getStepsForType,
} from '@/hooks/useInitiatives';
import { useProject } from '@/hooks/useData';
import { useAuth } from '@/hooks/useAuth';
import { useProjectKnowledgeBase } from '@/hooks/useProjectKnowledgeBase';
import { downloadInitiativePDF } from '@/hooks/useInitiativePDF';
import { useInitiativeShare, useCreateInitiativeShare, useRevokeInitiativeShare, getShareUrl } from '@/hooks/useInitiativeShare';
import { PHASE_SOP_CONFIGS } from '@/data/automationPhaseSOPs';
import { automationKnowledgeBaseSections } from '@/data/automationKnowledgeBaseTemplates';
import { toast } from 'sonner';

const PRODUCT_TYPE_LABELS: Record<string, string> = {
  mvp: 'MVP',
  funnel: 'Funnel',
  app: 'App',
  automation: 'Automatización & IA',
  landing_page: 'Landing Page',
};

export default function InitiativeDetail() {
  const { id: projectId, initiativeId } = useParams();
  const navigate = useNavigate();
  const { isAdmin } = useAuth();
  const { data: initiative, isLoading: loadingInitiative } = useInitiative(initiativeId);
  const { data: project, isLoading: loadingProject } = useProject(projectId || '');
  const updateStep = useUpdateInitiativeStep();
  const [isExporting, setIsExporting] = useState(false);
  const [copied, setCopied] = useState(false);

  const { data: shareData } = useInitiativeShare(initiativeId);
  const createShare = useCreateInitiativeShare();
  const revokeShare = useRevokeInitiativeShare();

  // For automation gate logic
  const { data: kb } = useProjectKnowledgeBase(
    initiative?.product_type === 'automation' ? initiative?.project_id : undefined
  );

  const handleExport = async () => {
    if (!initiativeId) return;
    setIsExporting(true);
    try {
      await downloadInitiativePDF(initiativeId);
    } finally {
      setIsExporting(false);
    }
  };

  const handleShare = async () => {
    if (!initiativeId) return;
    const result = await createShare.mutateAsync(initiativeId);
    if (result?.share_token) {
      const url = getShareUrl(result.share_token);
      await navigator.clipboard.writeText(url);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
      toast.success('Link copiado al portapapeles');
    }
  };

  const handleRevoke = async () => {
    if (!shareData?.id || !initiativeId) return;
    await revokeShare.mutateAsync({ shareId: shareData.id, initiativeId });
  };

  if (loadingInitiative || loadingProject) {
    return (
      <AppLayout>
        <div className="space-y-6">
          <Skeleton className="h-12 w-1/3" />
          <Skeleton className="h-16 w-full" />
          <Skeleton className="h-96 w-full" />
        </div>
      </AppLayout>
    );
  }

  if (!initiative || !project) {
    return (
      <AppLayout>
        <div className="text-center py-12">
          <h2 className="text-xl font-semibold mb-2">Iniciativa no encontrada</h2>
          <Button variant="outline" onClick={() => navigate(-1)}>
            Volver
          </Button>
        </div>
      </AppLayout>
    );
  }

  const steps = getStepsForType(initiative.product_type);
  const currentStepIndex = getStepIndex(initiative.current_step, initiative.product_type);
  const completedSteps = currentStepIndex;
  const isLastStep = currentStepIndex >= steps.length - 1;
  const isAutomation = initiative.product_type === 'automation';

  // Gate logic: check if current phase checklist is 100% complete
  const getGateStatus = (): { blocked: boolean; reason: string } => {
    if (!isAutomation) return { blocked: false, reason: '' };

    const currentStep = initiative.current_step;

    // Kickoff gate: check if KB sections are all filled
    if (currentStep === 'kickoff') {
      if (!kb?.responses) return { blocked: true, reason: 'Completá toda la Knowledge Base antes de avanzar' };
      const sections = automationKnowledgeBaseSections;
      const allComplete = sections.every(section => {
        const data = kb.responses[section.key] || {};
        const required = section.fields.filter(f => f.required);
        if (required.length === 0) return Object.keys(data).length > 0;
        return required.every(f => {
          const val = data[f.key];
          return val !== undefined && val !== '' && val !== null;
        });
      });
      if (!allComplete) return { blocked: true, reason: 'Completá todas las secciones de la Knowledge Base' };
      return { blocked: false, reason: '' };
    }

    // Phase gates: check if checklist is 100%
    const sopConfig = PHASE_SOP_CONFIGS[currentStep];
    if (sopConfig && kb?.responses) {
      const checklist = kb.responses[`phase_checklist_${currentStep}`];
      if (!Array.isArray(checklist) || checklist.length < sopConfig.checklist.length) {
        return { blocked: true, reason: `Completá todos los ítems del checklist (${sopConfig.gate})` };
      }
      const allChecked = sopConfig.checklist.every((_, i) => !!checklist[i]);
      if (!allChecked) {
        return { blocked: true, reason: `Completá todos los ítems del checklist (${sopConfig.gate})` };
      }
    } else if (sopConfig) {
      return { blocked: true, reason: 'Completá el checklist de esta fase antes de avanzar' };
    }

    return { blocked: false, reason: '' };
  };

  const gate = getGateStatus();

  const handleStepClick = (step: InitiativeStep) => {
    if (!isAdmin) return;
    updateStep.mutate({ initiativeId: initiative.id, step });
  };

  const handleContinue = () => {
    if (!isLastStep && !gate.blocked) {
      const nextStep = steps[currentStepIndex + 1].step;
      updateStep.mutate({ initiativeId: initiative.id, step: nextStep });
    }
  };

  const renderCurrentStep = () => {
    if (isAutomation) {
      switch (initiative.current_step) {
        case 'kickoff':
          return <AutomationKickoffStep initiativeId={initiative.id} projectId={initiative.project_id} />;
        case 'chatbot_ia':
        case 'integracion':
        case 'entrega':
        case 'soporte':
          return <AutomationPhaseStep initiativeId={initiative.id} phase={initiative.current_step} projectId={initiative.project_id} />;
        default:
          return null;
      }
    }

    switch (initiative.current_step) {
      case 'brief':
        return <BriefStep initiativeId={initiative.id} />;
      case 'features':
        return <FeaturesStep initiativeId={initiative.id} />;
      case 'prd':
        return <PRDStep initiativeId={initiative.id} />;
      case 'screens':
        return <ScreensStep initiativeId={initiative.id} />;
      case 'tech_docs':
        return <TechDocsStep initiativeId={initiative.id} />;
      case 'implementation':
        return <ImplementationStep initiativeId={initiative.id} />;
      default:
        return null;
    }
  };

  return (
    <AppLayout>
      <div className="space-y-6">
        {/* Breadcrumb */}
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <Link to={`/projects/${projectId}`} className="hover:text-foreground transition-colors">
            {project.name}
          </Link>
          <span>/</span>
          <span>{initiative.name}</span>
        </div>

        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3 min-w-0">
            <Button variant="ghost" size="icon" className="shrink-0" onClick={() => navigate(-1)}>
              <ArrowLeft className="w-4 h-4" />
            </Button>
            <div className="min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <h1 className="text-xl sm:text-2xl font-bold truncate">{initiative.name}</h1>
                <Badge variant="outline" className="shrink-0">
                  {PRODUCT_TYPE_LABELS[initiative.product_type] || initiative.product_type}
                </Badge>
              </div>
              <p className="text-sm text-muted-foreground mt-1">
                Fase {currentStepIndex + 1} de {steps.length} · {completedSteps} completadas
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            {isAdmin && !isLastStep && (
              gate.blocked ? (
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button variant="outline" disabled className="gap-2" size="sm">
                      <Lock className="w-4 h-4" />
                      <span className="hidden sm:inline">Continuar</span>
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent side="bottom" className="max-w-xs">
                    <p>{gate.reason}</p>
                  </TooltipContent>
                </Tooltip>
              ) : (
                <Button onClick={handleContinue} size="sm">
                  Continuar
                </Button>
              )
            )}
            <Popover>
              <PopoverTrigger asChild>
                <Button variant="outline" size="icon">
                  <Share2 className="w-4 h-4" />
                </Button>
              </PopoverTrigger>
              <PopoverContent align="end" className="w-80 space-y-3">
                <div className="space-y-1">
                  <p className="text-sm font-medium">Compartir públicamente</p>
                  <p className="text-xs text-muted-foreground">Cualquiera con el link puede ver este producto.</p>
                </div>
                {shareData ? (
                  <div className="space-y-2">
                    <div className="flex items-center gap-2 bg-muted rounded-lg px-3 py-2">
                      <LinkIcon className="w-3.5 h-3.5 text-muted-foreground shrink-0" />
                      <span className="text-xs text-foreground truncate flex-1">{getShareUrl(shareData.share_token)}</span>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-6 w-6 shrink-0"
                        onClick={async () => {
                          await navigator.clipboard.writeText(getShareUrl(shareData.share_token));
                          setCopied(true);
                          setTimeout(() => setCopied(false), 2000);
                          toast.success('Link copiado');
                        }}
                      >
                        {copied ? <Check className="w-3 h-3" /> : <Copy className="w-3 h-3" />}
                      </Button>
                    </div>
                    <Button variant="ghost" size="sm" className="w-full text-destructive hover:text-destructive gap-2" onClick={handleRevoke}>
                      <XCircle className="w-3.5 h-3.5" />
                      Revocar link
                    </Button>
                  </div>
                ) : (
                  <Button className="w-full gap-2" onClick={handleShare} disabled={createShare.isPending}>
                    {createShare.isPending ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <LinkIcon className="w-3.5 h-3.5" />}
                    Generar link público
                  </Button>
                )}
              </PopoverContent>
            </Popover>
            <Button variant="outline" size="icon" onClick={handleExport} disabled={isExporting}>
              {isExporting ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <Download className="w-4 h-4" />
              )}
            </Button>
          </div>
        </div>

        {/* Step Progress */}
        <div className="border-b pb-4">
          <InitiativeStepProgress
            currentStep={initiative.current_step}
            completedSteps={completedSteps}
            onStepClick={isAdmin ? handleStepClick : undefined}
            productType={initiative.product_type}
          />
        </div>

        {/* Current Step Content */}
        <div className="min-h-[400px]">
          {renderCurrentStep()}
        </div>
      </div>
    </AppLayout>
  );
}
