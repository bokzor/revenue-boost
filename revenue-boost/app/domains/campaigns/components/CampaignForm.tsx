/**
 * CampaignForm - Simplified campaign creation form
 *
 * Uses extracted hooks for clean state management
 */

import { useState } from "react";
import { Page, Layout, Banner } from "@shopify/polaris";
import { useWizardState } from "~/shared/hooks/useWizardState";
import type { CampaignFormData } from "~/shared/hooks/useWizardState";
import { WizardProgressIndicator } from "./WizardProgressIndicator";
import { GoalStep } from "./steps/GoalStep";
import { DesignStep } from "./steps/DesignStep";
import { TargetingStep } from "./steps/TargetingStep";
import { ScheduleStep } from "./steps/ScheduleStep";

const STEPS = [
  { id: "goal", title: "Goal & Basics", description: "Set your campaign objective", isRequired: true },
  { id: "design", title: "Design", description: "Customize appearance", isRequired: true },
  { id: "targeting", title: "Targeting", description: "Define audience", isRequired: false },
  { id: "schedule", title: "Schedule", description: "Set timing", isRequired: false },
];

interface CampaignFormProps {
  storeId: string;
  shopDomain?: string;
  onSave: (data: CampaignFormData | CampaignFormData[]) => Promise<void>;
  onCancel: () => void;
  initialData?: Partial<CampaignFormData>;
}

export function CampaignForm({ storeId, shopDomain, onSave, onCancel, initialData }: CampaignFormProps) {
  const [currentStep, setCurrentStep] = useState(0);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Single campaign state
  const { wizardState, updateData } = useWizardState(initialData);

  const completedSteps = STEPS.map((_, i) => i < currentStep);

  const handleNext = () => {
    if (currentStep < STEPS.length - 1) {
      setCurrentStep(currentStep + 1);
    }
  };

  const handleBack = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1);
    }
  };

  const handleStepClick = (index: number) => {
    setCurrentStep(index);
  };

  const handleSubmit = async () => {
    setIsSubmitting(true);
    setError(null);

    try {
      await onSave(wizardState);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to save campaign");
    } finally {
      setIsSubmitting(false);
    }
  };

  const renderStep = () => {
    const step = STEPS[currentStep];

    switch (step.id) {
      case "goal":
        return <GoalStep data={wizardState} onChange={updateData} storeId={storeId} />;
      case "design":
        return <DesignStep data={wizardState} onChange={updateData} shopDomain={shopDomain} />;
      case "targeting":
        return <TargetingStep data={wizardState} onChange={updateData} />;
      case "schedule":
        return <ScheduleStep data={wizardState} onChange={updateData} />;
      default:
        return null;
    }
  };

  return (
    <Page
      title="Create Campaign"
      backAction={{ onAction: onCancel }}
      primaryAction={{
        content: currentStep === STEPS.length - 1 ? "Create Campaign" : "Next",
        onAction: currentStep === STEPS.length - 1 ? handleSubmit : handleNext,
        loading: isSubmitting,
      }}
      secondaryActions={[
        ...(currentStep > 0 ? [{ content: "Back", onAction: handleBack }] : []),
        { content: "Cancel", onAction: onCancel },
      ]}
    >
      <Layout>
        {error && (
          <Layout.Section>
            <Banner tone="critical" onDismiss={() => setError(null)}>
              {error}
            </Banner>
          </Layout.Section>
        )}

        <Layout.Section>
          <WizardProgressIndicator
            steps={STEPS}
            currentStep={currentStep}
            completedSteps={completedSteps}
            onStepClick={handleStepClick}
          />
        </Layout.Section>

        <Layout.Section>{renderStep()}</Layout.Section>
      </Layout>
    </Page>
  );
}

