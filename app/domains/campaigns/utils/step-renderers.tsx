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
import type { PopupDesignConfig } from "~/domains/popups/types/design-editor.types";
import type { EnhancedTriggersConfig } from "~/domains/campaigns/types/campaign";
import {
  GoalStepContent,
  DesignStepContent,
  TargetingStepContent,
  FrequencyStepContent,
  ScheduleStepContent,
} from "../components/steps";

// ============================================================================
// TYPES
// ============================================================================

export interface StepRendererProps {
  wizardState: CampaignFormData;
  updateData: (updates: Partial<CampaignFormData>) => void;
  applyGoalDefaults: (goal: CampaignGoal) => void;
  setTemplateType: (
    templateType: TemplateType,
    templateObject?: { contentDefaults?: Record<string, unknown> }
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
  const { wizardState, updateData, setTemplateType, storeId, shopDomain, campaignId } = props;

  return (
    <DesignStepContent
      goal={wizardState.goal}
      templateId={wizardState.templateId}
      templateType={wizardState.templateType}
      storeId={storeId}
      shopDomain={shopDomain}
      campaignId={campaignId}
      wizardState={wizardState}
      discountConfig={wizardState.discountConfig}
      onDiscountChange={(cfg) => updateData({ discountConfig: cfg })}
      onConfigChange={(config: PopupDesignConfig) => {
        updateData({
          designConfig: { popupDesign: config as unknown as any },
          contentConfig: {
            headline: (config as any).title,
            subheadline: (config as any).description,
            ctaText: (config as any).buttonText,
            ctaLabel: (config as any).buttonText,
            ...wizardState.contentConfig,
            ...(((config as any).content as Record<string, unknown>) || {}),
          },
        });
      }}
      onTemplateChange={(templateId: string, templateType: TemplateType, enhancedTriggers?: EnhancedTriggersConfig, templateObject?: { contentConfig?: Record<string, unknown> }) => {
        updateData({ templateId, templateType, enhancedTriggers });
        setTemplateType(templateType, { contentDefaults: templateObject?.contentConfig });
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

