"use client";

import type { Dispatch, JSX, SetStateAction } from "react";
import { useEffect, useState } from "react";

import { cn } from "../../lib/cn";

import { Button } from "../button";
import { Steps } from "../form/step";
import { useWizardState } from "./useWizardState";

export type WizardStep = {
  title: string;
  containerClassname?: string;
  contentClassname?: string;
  description: string;
  content?:
    | ((
        setIsPending: Dispatch<SetStateAction<boolean>>,
        nav: { onNext: () => void; onPrev: () => void; step: number; maxSteps: number }
      ) => JSX.Element)
    | JSX.Element;
  isEnabled?: boolean;
  isPending?: boolean;
  customActions?: boolean;
};

export interface WizardFormProps {
  steps: WizardStep[];
  containerClassname?: string;
  prevLabel?: string;
  nextLabel?: string;
  finishLabel?: string;
  stepLabel?: React.ComponentProps<typeof Steps>["stepLabel"];
  defaultStep?: number;
  disableNavigation?: boolean;
}

export function WizardForm({
  steps,
  containerClassname,
  prevLabel = "Back",
  nextLabel = "Next",
  finishLabel = "Finish",
  stepLabel,
  defaultStep = 1,
  disableNavigation = false,
}: WizardFormProps) {
  const { currentStep, maxSteps, nextStep, goToStep, prevStep, isFirstStep, isLastStep } = useWizardState(
    defaultStep,
    steps.length
  );
  const [currentStepisPending, setCurrentStepisPending] = useState(false);
  const currentStepData = steps[currentStep - 1];

  useEffect(() => {
    setCurrentStepisPending(false);
  }, [currentStep]);

  return (
    <div className="w-full p-6" data-testid="wizard-form">
      {/* Step Header */}
      <div className={cn("mb-6", containerClassname)}>
        <h2 className="text-2xl font-semibold" data-testid="step-title">
          {currentStepData.title}
        </h2>
        <p className="mt-1 text-sm text-muted-foreground" data-testid="step-description">
          {currentStepData.description}
        </p>
        {!disableNavigation && (
          <div className="mt-4">
            <Steps
              maxSteps={maxSteps}
              currentStep={currentStep}
              navigateToStep={goToStep}
              stepLabel={stepLabel}
              data-testid="wizard-step-component"
            />
          </div>
        )}
      </div>

      {/* Step Content */}
      <div className={cn("mb-6", containerClassname)}>
        <div
          className={cn(
            "rounded-xl border border-border/50 bg-background/50 p-6",
            currentStepData.contentClassname
          )}>
          {typeof currentStepData.content === "function"
            ? currentStepData.content(setCurrentStepisPending, {
                onNext: nextStep,
                onPrev: prevStep,
                step: currentStep,
                maxSteps,
              })
            : currentStepData.content}
        </div>

        {/* Navigation Buttons */}
        {!disableNavigation && !currentStepData.customActions && (
          <div className="flex justify-end gap-3 mt-6">
            {!isFirstStep && (
              <Button variant="outline" onClick={prevStep}>
                {prevLabel}
              </Button>
            )}

            <Button
              tabIndex={0}
              loading={currentStepisPending}
              type="button"
              onClick={nextStep}
              disabled={currentStepData.isEnabled === false}>
              {isLastStep ? finishLabel : nextLabel}
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}