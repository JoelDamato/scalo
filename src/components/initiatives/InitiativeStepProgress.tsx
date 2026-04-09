import { Check } from 'lucide-react';
import { cn } from '@/lib/utils';
import { InitiativeStep, getStepIndex, getStepsForType, ProductType, StepConfig } from '@/hooks/useInitiatives';

interface InitiativeStepProgressProps {
  currentStep: InitiativeStep;
  completedSteps?: number;
  onStepClick?: (step: InitiativeStep) => void;
  className?: string;
  productType?: ProductType;
}

export function InitiativeStepProgress({
  currentStep,
  completedSteps,
  onStepClick,
  className,
  productType = 'mvp',
}: InitiativeStepProgressProps) {
  const steps = getStepsForType(productType);
  const currentIndex = getStepIndex(currentStep, productType);
  const completed = completedSteps ?? currentIndex;

  return (
    <div className={cn('flex items-center gap-0 overflow-x-auto scrollbar-hide pb-1', className)}>
      {steps.map((step, index) => {
        const isCompleted = index < completed;
        const isCurrent = index === currentIndex;
        const isClickable = onStepClick && index <= completed;

        return (
          <div key={step.step} className="flex items-center">
            <button
              onClick={() => isClickable && onStepClick(step.step)}
              disabled={!isClickable}
              className={cn(
                'flex items-center gap-2 px-3 py-2 rounded-lg transition-colors',
                isClickable && 'cursor-pointer hover:bg-muted',
                !isClickable && 'cursor-default'
              )}
            >
              <div
                className={cn(
                  'w-6 h-6 rounded-full flex items-center justify-center text-xs font-medium transition-colors',
                  isCompleted && 'bg-primary text-primary-foreground',
                  isCurrent && !isCompleted && 'bg-primary text-primary-foreground',
                  !isCompleted && !isCurrent && 'bg-muted text-muted-foreground'
                )}
              >
                {isCompleted ? (
                  <Check className="w-3.5 h-3.5" />
                ) : (
                  index + 1
                )}
              </div>
              <span
                className={cn(
                  'text-sm font-medium hidden sm:block',
                  (isCompleted || isCurrent) && 'text-foreground',
                  !isCompleted && !isCurrent && 'text-muted-foreground'
                )}
              >
                {step.title}
              </span>
            </button>

            {index < steps.length - 1 && (
              <div
                className={cn(
                  'w-8 h-0.5 hidden md:block',
                  index < completed ? 'bg-primary' : 'bg-border'
                )}
              />
            )}
          </div>
        );
      })}
    </div>
  );
}
