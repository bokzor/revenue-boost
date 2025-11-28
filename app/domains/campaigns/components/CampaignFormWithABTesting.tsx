/**
 * Campaign Form with A/B Testing Integration (Refactored for SOLID Compliance)
 *
 * ARCHITECTURE:
 * - Variants as Full Campaigns: Each variant (A, B, C, D) is a complete Campaign object
 * - All variants share the same experimentId
 * - Form manages an array of variant campaign data
 * - Switching variants loads different campaign data
 * - Submission creates multiple Campaign objects via ExperimentService
 *
 * SOLID IMPROVEMENTS:
 * - Extracted A/B Testing UI into separate components (ABTestingPanel, VariantSelector, ExperimentConfigForm)
 * - Extracted submission logic into useCampaignSubmission hook
 * - Extracted navigation into WizardNavigationButtons component
 * - Main component now <300 lines (down from 593)
 * - Each extracted component/function <50 lines
 * - Better separation of concerns and single responsibility
 */

import { useState, useCallback, useMemo, useEffect } from "react";
import { Page, Layout, Card, Banner, Text, BlockStack } from "@shopify/polaris";
import { useWizardState } from "~/shared/hooks/useWizardState";
import type { CampaignFormData } from "~/shared/hooks/useWizardState";
import type { UnifiedTemplate } from "../hooks/useTemplates";

// Import extracted hooks for SOLID compliance
import { useExperimentConfig } from "../hooks/useExperimentConfig";
import { useCampaignSubmission } from "../hooks/useCampaignSubmission";

// Import extracted A/B Testing components
import { ABTestingPanel, ExperimentConfigForm, type VariantKey } from "./ab-testing";

// Import wizard components
import { WizardProgressIndicator, WizardNavigationButtons, type WizardStep } from "./wizard";

// Import extracted step renderers
import {
  renderGoalStep,
  renderDesignStep,
  renderTargetingStep,
  renderFrequencyStep,
  renderScheduleStep,
  type StepRendererProps,
} from "../utils/step-renderers";

// ============================================================================
// CONSTANTS
// ============================================================================

const WIZARD_STEPS: WizardStep[] = [
  {
    id: "goal",
    title: "Campaign Goal & Basics",
    description: "Set your primary objective and basic campaign information",
    isRequired: true,
  },
  {
    id: "design",
    title: "Template & Design",
    description: "Choose a template and customize appearance with live preview",
    isRequired: true,
  },
  {
    id: "targeting",
    title: "Targeting & Triggers",
    description: "Define when to show and who should see your campaign",
    isRequired: false,
  },
  {
    id: "frequency",
    title: "Frequency Capping",
    description: "Control how often users see your campaigns",
    isRequired: false,
  },
  {
    id: "schedule",
    title: "Schedule & Settings",
    description: "Configure campaign status, priority, schedule, and tags",
    isRequired: false,
  },
];

// ============================================================================
// TYPES
// ============================================================================

interface VariantCampaignData extends CampaignFormData {
  variantKey: VariantKey;
  isControl: boolean;
  variantName?: string;
  variantDescription?: string;
}

interface ExperimentData {
  id: string;
  name: string;
  description?: string | null;
  hypothesis?: string | null;
  successMetric: string;
  trafficAllocation: Record<string, number>;
  confidenceLevel: number;
  minimumSampleSize?: number | null;
  minimumDetectableEffect: number;
  startDate?: string | null;
  endDate?: string | null;
  plannedDuration?: number | null;
  status: string;
}

interface CampaignFormWithABTestingProps {
  campaignId?: string;
  storeId: string;
  onSave: (campaignData: CampaignFormData | CampaignFormData[]) => Promise<void>;
  onCancel: () => void;
  initialData?: Partial<CampaignFormData>;
  shopDomain?: string;
  globalCustomCSS?: string;
  experimentId?: string;
  experimentData?: ExperimentData;
  allVariants?: Array<{
    id: string;
    variantKey: string;
    name: string;
    isControl: boolean;
  }>;
  currentVariantKey?: string | null;
  initialTemplates?: UnifiedTemplate[];
  /** Whether advanced targeting (Shopify segments, session rules) is enabled for the current plan */
  advancedTargetingEnabled?: boolean;
  /** Whether A/B testing experiments are enabled for the current plan (Growth plan and above) */
  experimentsEnabled?: boolean;
}

// ============================================================================
// MAIN COMPONENT
// ============================================================================

export function CampaignFormWithABTesting({
  campaignId,
  storeId,
  onSave,
  onCancel,
  initialData,
  shopDomain,
  globalCustomCSS,
  experimentId,
  experimentData,
  allVariants,
  currentVariantKey,
  initialTemplates,
  advancedTargetingEnabled = false,
  experimentsEnabled = false,
}: CampaignFormWithABTestingProps) {
  // ============================================================================
  // STATE - Wizard Navigation
  // ============================================================================

  // Start at step 1 (Template & Design) when editing, when templateType is preselected, or when goal is preselected
  // Otherwise start at step 0 (Goal)
  const [currentStep, setCurrentStep] = useState(
    campaignId || experimentId || initialData?.templateType || initialData?.goal ? 1 : 0
  );

  // ============================================================================
  // STATE - A/B Testing
  // ============================================================================

  const [abTestingEnabled, setAbTestingEnabled] = useState(
    initialData?.abTestingEnabled || !!experimentId || false
  );

  const [selectedVariant, setSelectedVariant] = useState<VariantKey>(
    (currentVariantKey as VariantKey) || "A"
  );

  const [variantCount, setVariantCount] = useState<number>(allVariants?.length || 2);

  // ============================================================================
  // HOOKS - Extracted for SOLID compliance
  // ============================================================================

  const experimentConfig = useExperimentConfig({
    experimentData,
    initialVariantCount: variantCount,
  });

  const { isSubmitting, submitError, submitSingleCampaign, submitABTestCampaign } =
    useCampaignSubmission({ onSave });

  // ============================================================================
  // STATE - Variant Management (Isolated state for each variant)
  // ============================================================================

  const createInitialVariantData = useCallback(
    (key: VariantKey, index: number): VariantCampaignData => {
      // Deep copy ALL nested objects to prevent variants from sharing references
      const deepCopy = <T,>(obj: T | undefined): T => {
        if (!obj) return {} as T;
        return JSON.parse(JSON.stringify(obj)) as T;
      };

      return {
        ...initialData,
        variantKey: key,
        isControl: index === 0,
        variantName: `Variant ${key}`,
        variantDescription: index === 0 ? "Control variant" : `Test variant ${key}`,
        name: initialData?.name ? `${initialData.name} - Variant ${key}` : `Variant ${key}`,
        // Deep copy all config objects
        contentConfig: deepCopy(initialData?.contentConfig),
        designConfig: deepCopy(initialData?.designConfig),
        discountConfig: deepCopy(initialData?.discountConfig),
        enhancedTriggers: deepCopy(initialData?.enhancedTriggers),
        audienceTargeting: deepCopy(initialData?.audienceTargeting),
        pageTargeting: deepCopy(initialData?.pageTargeting),
        frequencyCapping: deepCopy(initialData?.frequencyCapping),
      } as VariantCampaignData;
    },
    [initialData]
  );

  // ============================================================================
  // MEMOIZED VALUES - Stable references to prevent re-render loops
  // ============================================================================

  const stableVariantStateA = useMemo(
    () => createInitialVariantData("A", 0),
    [createInitialVariantData]
  );
  const stableVariantStateB = useMemo(
    () => createInitialVariantData("B", 1),
    [createInitialVariantData]
  );
  const stableVariantStateC = useMemo(
    () => createInitialVariantData("C", 2),
    [createInitialVariantData]
  );
  const stableVariantStateD = useMemo(
    () => createInitialVariantData("D", 3),
    [createInitialVariantData]
  );

  // ============================================================================
  // WIZARD STATE HOOKS - Separate state for each variant
  // ============================================================================

  const wizardStateA = useWizardState(stableVariantStateA);
  const wizardStateB = useWizardState(stableVariantStateB);
  const wizardStateC = useWizardState(stableVariantStateC);
  const wizardStateD = useWizardState(stableVariantStateD);

  // Get current wizard state based on selected variant
  const currentWizardState = useMemo(() => {
    switch (selectedVariant) {
      case "A":
        return wizardStateA;
      case "B":
        return wizardStateB;
      case "C":
        return wizardStateC;
      case "D":
        return wizardStateD;
      default:
        return wizardStateA;
    }
  }, [selectedVariant, wizardStateA, wizardStateB, wizardStateC, wizardStateD]);

  const { wizardState, updateData, applyGoalDefaults, setTemplateType } = currentWizardState;

  // ============================================================================
  // EFFECTS - Sync with props
  // ============================================================================

  useEffect(() => {
    if (allVariants && allVariants.length > 0) {
      setVariantCount(allVariants.length);
    }
  }, [allVariants]);

  useEffect(() => {
    if (currentVariantKey) {
      setSelectedVariant(currentVariantKey as VariantKey);
    }
  }, [currentVariantKey]);

  useEffect(() => {
    if (experimentId) {
      setAbTestingEnabled(true);
    }
  }, [experimentId]);

  // ============================================================================
  // EFFECTS - Goal Synchronization for A/B Testing
  // ============================================================================

  // Sync goal from Variant A to all other variants when A/B testing is enabled
  // This ensures all variants share the same goal as per A/B testing requirements
  useEffect(() => {
    if (abTestingEnabled && wizardStateA.wizardState.goal) {
      const goalFromA = wizardStateA.wizardState.goal;

      // Update Variant B if it doesn't have the same goal
      if (wizardStateB.wizardState.goal !== goalFromA) {
        wizardStateB.updateData({ goal: goalFromA });
      }

      // Update Variant C if it doesn't have the same goal
      if (wizardStateC.wizardState.goal !== goalFromA) {
        wizardStateC.updateData({ goal: goalFromA });
      }

      // Update Variant D if it doesn't have the same goal
      if (wizardStateD.wizardState.goal !== goalFromA) {
        wizardStateD.updateData({ goal: goalFromA });
      }
    }
  }, [abTestingEnabled, wizardStateA.wizardState.goal, wizardStateB, wizardStateC, wizardStateD]);

  // ============================================================================
  // HANDLERS - Navigation
  // ============================================================================

  const handleStepChange = useCallback((stepIndex: number) => {
    setCurrentStep(stepIndex);
  }, []);

  const handleNext = useCallback(() => {
    // Calculate effective steps length based on current A/B testing state
    const effectiveStepsLength =
      abTestingEnabled && selectedVariant !== "A"
        ? WIZARD_STEPS.filter((s) => s.id !== "schedule").length
        : WIZARD_STEPS.length;

    if (currentStep < effectiveStepsLength - 1) {
      setCurrentStep(currentStep + 1);
    }
  }, [currentStep, abTestingEnabled, selectedVariant]);

  const handlePrevious = useCallback(() => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1);
    }
  }, [currentStep]);

  // ============================================================================
  // HANDLERS - A/B Testing
  // ============================================================================

  const handleAbTestingToggle = useCallback((enabled: boolean) => {
    setAbTestingEnabled(enabled);
    if (!enabled) {
      setVariantCount(2);
      setSelectedVariant("A");
    }
  }, []);

  const handleVariantCountChange = useCallback(
    (count: number) => {
      setVariantCount(count);
      experimentConfig.updateTrafficAllocation(count);
    },
    [experimentConfig]
  );

  /**
   * Handle continuing to the next variant in A/B testing flow
   * Switches from current variant to the next one (A→B, B→C, C→D)
   */
  const handleContinueToNextVariant = useCallback(() => {
    const variantSequence: VariantKey[] = ["A", "B", "C", "D"];
    const currentIndex = variantSequence.indexOf(selectedVariant);
    const nextVariant = variantSequence[currentIndex + 1];

    if (nextVariant && currentIndex + 1 < variantCount) {
      setSelectedVariant(nextVariant);
      // Reset to first step when switching variants
      setCurrentStep(0);
    }
  }, [selectedVariant, variantCount]);

  // ============================================================================
  // HANDLERS - Save (refactored to use extracted hook)
  // ============================================================================

  const handleSave = useCallback(async () => {
    try {
      if (abTestingEnabled) {
        const wizardStates = [wizardStateA, wizardStateB, wizardStateC, wizardStateD];
        const metadata = experimentConfig.getExperimentMetadata();
        await submitABTestCampaign(wizardStates, variantCount, metadata);
      } else {
        await submitSingleCampaign(wizardState);
      }
    } catch (error) {
      // Error already handled in hook
      console.error("Save failed:", error);
    }
  }, [
    wizardState,
    wizardStateA,
    wizardStateB,
    wizardStateC,
    wizardStateD,
    abTestingEnabled,
    variantCount,
    experimentConfig,
    submitSingleCampaign,
    submitABTestCampaign,
  ]);

  // ============================================================================
  // COMPUTED VALUES
  // ============================================================================

  // For A/B testing, Schedule step is only shown for Control variant (A)
  // Other variants inherit schedule settings from Control
  const effectiveSteps = useMemo(() => {
    if (abTestingEnabled && selectedVariant !== "A") {
      return WIZARD_STEPS.filter((step) => step.id !== "schedule");
    }
    return WIZARD_STEPS;
  }, [abTestingEnabled, selectedVariant]);

  const isLastStep = currentStep === effectiveSteps.length - 1;

  // ============================================================================
  // RENDER - Step Content (refactored to use extracted renderers)
  // ============================================================================

  const renderStepContent = () => {
    const step = effectiveSteps[currentStep];

    const rendererProps: StepRendererProps = {
      wizardState,
      updateData,
      applyGoalDefaults,
      setTemplateType,
      storeId,
      shopDomain,
      campaignId,
      selectedVariant,
      abTestingEnabled,
      initialTemplates,
      globalCustomCSS,
      advancedTargetingEnabled,
    };

    switch (step.id) {
      case "goal":
        return renderGoalStep(rendererProps);
      case "design":
        return renderDesignStep(rendererProps);
      case "targeting":
        return renderTargetingStep(rendererProps);
      case "frequency":
        return renderFrequencyStep(rendererProps);
      case "schedule":
        return renderScheduleStep(rendererProps);
      default:
        return null;
    }
  };

  // ============================================================================
  // MAIN RENDER
  // ============================================================================

  // Determine if we're editing (either a campaign or an experiment)
  const isEditing = !!(campaignId || experimentId);

  return (
    <Page
      fullWidth={true}
      title={isEditing ? "Edit Campaign" : "Create Campaign"}
      primaryAction={{
        content: isEditing ? "Save Changes" : "Create Campaign",
        onAction: handleSave,
        loading: isSubmitting,
      }}
      secondaryActions={[
        {
          content: "Cancel",
          onAction: onCancel,
          destructive: true,
        },
      ]}
    >
      <Layout>
        {/* Error Banner */}
        {submitError && (
          <Layout.Section>
            <Banner tone="critical">
              <Text as="p">{submitError}</Text>
            </Banner>
          </Layout.Section>
        )}

        {/* A/B Testing Panel - Extracted Component */}
        <Layout.Section>
          <ABTestingPanel
            abTestingEnabled={abTestingEnabled}
            onToggle={handleAbTestingToggle}
            selectedVariant={selectedVariant}
            onVariantSelect={setSelectedVariant}
            variantCount={variantCount}
            experimentId={experimentId}
            experimentName={experimentData?.name}
            currentVariantKey={currentVariantKey}
            experimentsEnabled={experimentsEnabled}
          />
        </Layout.Section>

        {/* Experiment Configuration - Extracted Component */}
        {abTestingEnabled && (
          <Layout.Section>
            <Card>
              <div style={{ padding: "16px" }}>
                <BlockStack gap="400">
                  <ExperimentConfigForm
                    experimentName={experimentConfig.experimentName}
                    experimentDescription={experimentConfig.experimentDescription}
                    experimentHypothesis={experimentConfig.experimentHypothesis}
                    variantCount={variantCount}
                    onNameChange={experimentConfig.setExperimentName}
                    onDescriptionChange={experimentConfig.setExperimentDescription}
                    onHypothesisChange={experimentConfig.setExperimentHypothesis}
                    onVariantCountChange={handleVariantCountChange}
                  />
                </BlockStack>
              </div>
            </Card>
          </Layout.Section>
        )}

        {/* Wizard Progress Indicator with integrated navigation */}
        <Layout.Section>
          <Card>
            <div style={{ padding: "16px" }}>
              <WizardProgressIndicator
                steps={effectiveSteps}
                currentStep={currentStep}
                completedSteps={effectiveSteps.map((_, index) => index <= currentStep)}
                onStepClick={handleStepChange}
                navigation={{
                  isLastStep,
                  isSubmitting,
                  campaignId,
                  onPrevious: handlePrevious,
                  onNext: handleNext,
                  onSave: handleSave,
                  abTestingEnabled,
                  selectedVariant,
                  variantCount,
                  onContinueToNextVariant: handleContinueToNextVariant,
                }}
              />
            </div>
          </Card>
        </Layout.Section>

        {/* Step Content */}
        <Layout.Section>
          <BlockStack gap="600">
            {renderStepContent()}

            {/* Navigation Buttons - Extracted Component */}
            <Card>
              <WizardNavigationButtons
                currentStep={currentStep}
                totalSteps={effectiveSteps.length}
                isLastStep={isLastStep}
                isSubmitting={isSubmitting}
                campaignId={campaignId}
                onPrevious={handlePrevious}
                onNext={handleNext}
                onSave={handleSave}
                abTestingEnabled={abTestingEnabled}
                selectedVariant={selectedVariant}
                variantCount={variantCount}
                onContinueToNextVariant={handleContinueToNextVariant}
              />
            </Card>
          </BlockStack>
        </Layout.Section>
      </Layout>
    </Page>
  );
}
