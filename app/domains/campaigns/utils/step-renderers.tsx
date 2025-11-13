/**
 * Step Renderers - Extracted rendering logic for campaign wizard steps
 *
 * SOLID Compliance:
 * - Single Responsibility: Each function renders one specific step
 * - Functions are <50 lines each
 * - Separated from main component for better testability
 */

import type { CampaignFormData, TemplateType } from "~/shared/hooks/useWizardState";
import type { CampaignGoal } from "@prisma/client";
import {
  GoalStepContent,
  DesignStepContent,
  TargetingStepContent,
  FrequencyStepContent,
  ScheduleStepContent,
} from "../components/steps";
import { DiscountSettingsStep } from "../components/DiscountSettingsStep";

// ============================================================================
// TYPES
// ============================================================================

export interface StepRendererProps {
  wizardState: CampaignFormData;
  updateData: (updates: Partial<CampaignFormData>) => void;
  applyGoalDefaults: (goal: CampaignGoal) => void;
  setTemplateType: (
    templateType: TemplateType,
    templateObject?: {
      contentDefaults?: Record<string, unknown>;
      targetRules?: Record<string, unknown>;
      design?: Record<string, unknown>;
    }
  ) => void;
  storeId: string;
  shopDomain?: string;
  campaignId?: string;
  selectedVariant?: string;
  abTestingEnabled?: boolean;
}
// ============================================================================
// STEP RENDERERS
// ============================================================================

export function renderGoalStep(props: StepRendererProps) {
  const { wizardState, updateData, applyGoalDefaults, selectedVariant, abTestingEnabled } = props;

  return (
    <GoalStepContent
      storeId={props.storeId}
      goal={wizardState.goal}
      name={wizardState.name}
      description={wizardState.description}
      abTestingEnabled={abTestingEnabled || false}
      selectedVariant={selectedVariant || "A"}
      isControl={wizardState.isControl || false}
      variantName={wizardState.variantName}
      variantDescription={wizardState.variantDescription}
      onGoalChange={(goal) => {
        updateData({ goal });
        applyGoalDefaults(goal);
      }}
      onNameChange={(name) => updateData({ name })}
      onDescriptionChange={(description) => updateData({ description })}
      onVariantNameChange={(variantName) => updateData({ variantName })}
      onVariantDescriptionChange={(variantDescription) => updateData({ variantDescription })}
    />
  );
}

export function renderDesignStep(props: StepRendererProps) {
  const { wizardState, updateData, storeId, shopDomain, campaignId, setTemplateType } = props;

  // Convert wizard state designConfig to DesignConfig format
  const designConfig: Partial<import("~/domains/campaigns/types/campaign").DesignConfig> = {
    theme: "modern",
    position: "center",
    size: "medium",
    borderRadius: 8,
    overlayOpacity: 0.5,
    animation: "fade",
    // Add any existing design config values
    ...(wizardState.designConfig as Partial<import("~/domains/campaigns/types/campaign").DesignConfig>),
  };

  return (
    <DesignStepContent
      goal={wizardState.goal}
      templateType={wizardState.templateType}
      templateId={wizardState.templateId}
      storeId={storeId}
      shopDomain={shopDomain}
      campaignId={campaignId}
      contentConfig={wizardState.contentConfig || {}}
      designConfig={designConfig}
      discountConfig={wizardState.discountConfig}
      onContentChange={(content) => updateData({ contentConfig: content })}
      onDesignChange={(design) => updateData({ designConfig: design })}
      onDiscountChange={(config) => updateData({ discountConfig: config })}
      onTemplateSelect={(template) => {
        // Ensure required base content fields exist even if the user doesn't edit them
        // The UI shows placeholders, but the server schema requires real values
        const baseDefaults: Record<string, unknown> = {
          headline: "Welcome!",
          buttonText: "Continue",
          successMessage: "Thanks!",
        };

        const contentWithDefaults = {
          ...baseDefaults,
          ...(template.contentConfig || {}),
        };

        // Extract enhanced triggers from the selected template (if provided)
        // Templates store triggers under targetRules.enhancedTriggers in the DB
        const enhancedFromTemplate = (template.targetRules as any)?.enhancedTriggers;

        updateData({
          templateId: template.id,
          templateType: template.templateType,
          contentConfig: contentWithDefaults,
          designConfig: template.designConfig || {},
          // Apply template triggers so the Targeting step reflects the selection (e.g., Exit Intent)
          ...(enhancedFromTemplate ? { enhancedTriggers: enhancedFromTemplate } : {}),
        });

        // Also pass hydrated defaults and targetRules so setTemplateType can merge (e.g., page targeting)
        setTemplateType(template.templateType, {
          contentDefaults: contentWithDefaults,
          targetRules: template.targetRules as any,
        });
      }}
    />
  );
}

export function renderTargetingStep(props: StepRendererProps) {
  const { wizardState, updateData, storeId } = props;

  return (
    <TargetingStepContent
      storeId={storeId}
      enhancedTriggers={wizardState.enhancedTriggers || {}}
      audienceTargeting={wizardState.audienceTargeting}
      onTriggersChange={(config) => updateData({ enhancedTriggers: config })}
      onAudienceChange={(config) => updateData({ audienceTargeting: config })}
    />
  );
}

export function renderFrequencyStep(props: StepRendererProps) {
  const { wizardState, updateData } = props;

  return (
    <FrequencyStepContent
      config={wizardState.frequencyCapping}
      onConfigChange={(config) => updateData({ frequencyCapping: config })}
      templateType={wizardState.templateType}
    />
  );
}

export function renderDiscountStep(props: StepRendererProps) {
  const { wizardState, updateData } = props;

  return (
    <DiscountSettingsStep
      goal={wizardState.goal}
      discountConfig={wizardState.discountConfig}
      onConfigChange={(config) => updateData({ discountConfig: config })}
    />
  );
}

export function renderScheduleStep(props: StepRendererProps) {
  const { wizardState, updateData } = props;

  return (
    <ScheduleStepContent
      status={wizardState.status}
      priority={wizardState.priority}
      startDate={wizardState.startDate}
      endDate={wizardState.endDate}
      tags={wizardState.tags}
      onConfigChange={(config) =>
        updateData({
          status: config.status,
          priority: config.priority,
          startDate: config.startDate,
          endDate: config.endDate,
          tags: config.tags,
        })
      }
    />
  );
}

