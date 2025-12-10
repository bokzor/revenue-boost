/**
 * ExperimentFlow Component
 *
 * Two-step flow for creating A/B experiments:
 * 1. ExperimentSetup - Configure experiment details and variants
 * 2. VariantConfigurator - Configure each variant's campaign
 *
 * This is the main orchestrator component that delegates to modular sub-components.
 */

import { useState, useCallback } from "react";
import { Modal, Text, BlockStack } from "@shopify/polaris";
import { VariantConfigurator } from "./experiment/VariantConfigurator";
import { ExperimentSetupView } from "./experiment/ExperimentSetupView";
import type { StyledRecipe } from "../../recipes/styled-recipe-types";
import type { Experiment, Variant, TrafficAllocation } from "./types";
import type { DefaultThemeTokens } from "./SingleCampaignFlow";
export type { Experiment, Variant, TrafficAllocation, SuccessMetric } from "./types";

// =============================================================================
// PROPS
// =============================================================================

export interface ExperimentFlowProps {
  onBack: () => void;
  /** Publish the experiment (sets status to RUNNING) */
  onSave: (experiment: Experiment) => Promise<void>;
  /** Optional: Save as draft (keeps status as DRAFT) */
  onSaveDraft?: (experiment: Experiment) => Promise<void>;
  recipes: StyledRecipe[];
  storeId: string;
  shopDomain?: string;
  advancedTargetingEnabled?: boolean;
  /** Custom theme presets from store settings */
  customThemePresets?: Array<{
    id: string;
    name: string;
    brandColor: string;
    backgroundColor: string;
    textColor: string;
    surfaceColor?: string;
    successColor?: string;
    fontFamily?: string;
  }>;
  /** Default theme tokens for preview (derived from store's default preset) */
  defaultThemeTokens?: DefaultThemeTokens;
  /** Edit mode - pre-populate with existing experiment */
  isEditMode?: boolean;
  /** Initial experiment data for edit mode */
  initialExperiment?: Experiment;
  /** Experiment ID for edit mode */
  experimentId?: string;
}

// =============================================================================
// MAIN COMPONENT
// =============================================================================

// Default new experiment
const DEFAULT_EXPERIMENT: Experiment = {
  id: `exp-${Date.now()}`,
  name: "",
  hypothesis: "",
  successMetric: "email_signups",
  variants: [
    { id: "var-a", name: "A", status: "empty", isControl: true },
    { id: "var-b", name: "B", status: "empty", isControl: false },
  ],
  trafficAllocation: [
    { variantId: "var-a", percentage: 50 },
    { variantId: "var-b", percentage: 50 },
  ],
  status: "draft",
};

export function ExperimentFlow({
  onBack,
  onSave,
  onSaveDraft: onSaveDraftProp,
  recipes,
  storeId,
  shopDomain,
  advancedTargetingEnabled,
  customThemePresets,
  defaultThemeTokens,
  isEditMode = false,
  initialExperiment,
  experimentId: _experimentId,
}: ExperimentFlowProps) {
  // In edit mode, determine starting step based on variant status
  const getInitialStep = (): "setup" | "configure" => {
    if (!isEditMode || !initialExperiment) return "setup";
    // If any variant is configured, go to configure step
    return initialExperiment.variants.some((v) => v.status === "configured") ? "configure" : "setup";
  };

  const [step, setStep] = useState<"setup" | "configure">(getInitialStep);
  const [activeVariantId, setActiveVariantId] = useState<string | null>(
    isEditMode && initialExperiment ? initialExperiment.variants[0]?.id || null : null
  );
  const [isSaving, setIsSaving] = useState(false);
  const [experiment, setExperiment] = useState<Experiment>(
    initialExperiment || DEFAULT_EXPERIMENT
  );

  // =============================================================================
  // HANDLERS
  // =============================================================================

  const handleSetupComplete = useCallback(() => {
    setActiveVariantId(experiment.variants[0].id);
    setStep("configure");
  }, [experiment.variants]);

  const handleConfigureVariant = useCallback((variantId: string) => {
    setActiveVariantId(variantId);
    setStep("configure");
  }, []);

  const handleVariantUpdate = useCallback((updatedVariant: Variant) => {
    setExperiment((prev) => ({
      ...prev,
      variants: prev.variants.map((v) => (v.id === updatedVariant.id ? updatedVariant : v)),
    }));
  }, []);

  const handleAddVariant = useCallback(() => {
    if (experiment.variants.length >= 4) return;

    const newVariantName = String.fromCharCode(65 + experiment.variants.length);
    const newVariant: Variant = {
      id: `var-${newVariantName.toLowerCase()}`,
      name: newVariantName,
      status: "empty",
      isControl: false,
    };

    // Redistribute traffic equally
    const newPercentage = Math.floor(100 / (experiment.variants.length + 1));
    const newAllocation: TrafficAllocation[] = [
      ...experiment.variants.map((v) => ({
        variantId: v.id,
        percentage: newPercentage,
      })),
      { variantId: newVariant.id, percentage: newPercentage },
    ];

    // Ensure total is 100
    const total = newAllocation.reduce((sum, a) => sum + a.percentage, 0);
    if (total < 100) {
      newAllocation[0].percentage += 100 - total;
    }

    setExperiment((prev) => ({
      ...prev,
      variants: [...prev.variants, newVariant],
      trafficAllocation: newAllocation,
    }));
  }, [experiment.variants]);

  const handleTrafficChange = useCallback(
    (variantId: string, value: number) => {
      const otherVariants = experiment.trafficAllocation.filter((a) => a.variantId !== variantId);
      const remaining = 100 - value;
      const perOther = Math.floor(remaining / otherVariants.length);

      const newAllocation = experiment.trafficAllocation.map((a) => {
        if (a.variantId === variantId) return { ...a, percentage: value };
        return { ...a, percentage: perOther };
      });

      // Ensure total is 100
      const total = newAllocation.reduce((sum, a) => sum + a.percentage, 0);
      if (total !== 100 && newAllocation.length > 0) {
        newAllocation[newAllocation.length - 1].percentage += 100 - total;
      }

      setExperiment((prev) => ({ ...prev, trafficAllocation: newAllocation }));
    },
    [experiment.trafficAllocation]
  );

  const handleEqualSplit = useCallback(() => {
    const count = experiment.variants.length;
    const equal = Math.floor(100 / count);
    const allocation = experiment.variants.map((v, i) => ({
      variantId: v.id,
      percentage: i === 0 ? 100 - equal * (count - 1) : equal,
    }));
    setExperiment((prev) => ({ ...prev, trafficAllocation: allocation }));
  }, [experiment.variants]);

  // =============================================================================
  // DELETE VARIANT WITH CONFIRMATION
  // =============================================================================

  const [deleteConfirmation, setDeleteConfirmation] = useState<{ open: boolean; variantId: string | null; variantName: string }>({
    open: false,
    variantId: null,
    variantName: "",
  });

  const handleDeleteVariantRequest = useCallback((variantId: string) => {
    const variant = experiment.variants.find((v) => v.id === variantId);
    if (!variant || variant.isControl) return; // Can't delete control variant

    setDeleteConfirmation({
      open: true,
      variantId,
      variantName: variant.name,
    });
  }, [experiment.variants]);

  const handleDeleteVariantConfirm = useCallback(() => {
    const variantId = deleteConfirmation.variantId;
    if (!variantId) return;

    // Remove variant and redistribute traffic
    const remainingVariants = experiment.variants.filter((v) => v.id !== variantId);

    if (remainingVariants.length < 2) {
      // Don't allow deleting if it would leave less than 2 variants
      setDeleteConfirmation({ open: false, variantId: null, variantName: "" });
      return;
    }

    // Redistribute traffic equally among remaining variants
    const newPercentage = Math.floor(100 / remainingVariants.length);
    const newAllocation: TrafficAllocation[] = remainingVariants.map((v, i) => ({
      variantId: v.id,
      percentage: i === 0 ? 100 - newPercentage * (remainingVariants.length - 1) : newPercentage,
    }));

    setExperiment((prev) => ({
      ...prev,
      variants: remainingVariants,
      trafficAllocation: newAllocation,
    }));

    // If deleted variant was active, switch to first variant
    if (activeVariantId === variantId) {
      setActiveVariantId(remainingVariants[0].id);
    }

    setDeleteConfirmation({ open: false, variantId: null, variantName: "" });
  }, [deleteConfirmation.variantId, experiment.variants, activeVariantId]);

  const handleDeleteVariantCancel = useCallback(() => {
    setDeleteConfirmation({ open: false, variantId: null, variantName: "" });
  }, []);

  const handleExperimentChange = useCallback((updates: Partial<Experiment>) => {
    setExperiment((prev) => ({ ...prev, ...updates }));
  }, []);

  const handleSaveDraft = async () => {
    setIsSaving(true);
    try {
      const draftExperiment = { ...experiment, status: "draft" as const };
      if (onSaveDraftProp) {
        await onSaveDraftProp(draftExperiment);
      } else {
        await onSave(draftExperiment);
      }
    } finally {
      setIsSaving(false);
    }
  };

  const handlePublish = async () => {
    setIsSaving(true);
    try {
      const runningExperiment = { ...experiment, status: "running" as const };
      await onSave(runningExperiment);
    } finally {
      setIsSaving(false);
    }
  };

  // Check if at least one variant is configured for save draft eligibility
  const canSaveDraft = experiment.name.trim() !== "" &&
    experiment.variants.some((v) => v.status === "configured");

  // Check if all variants are configured for publish eligibility
  const canPublish = experiment.variants.every((v) => v.status === "configured");

  // =============================================================================
  // RENDER
  // =============================================================================

  // Step 2: Variant Configurator
  if (step === "configure" && activeVariantId) {
    return (
      <>
        <VariantConfigurator
          experiment={experiment}
          activeVariantId={activeVariantId}
          onBack={() => setStep("setup")}
          onVariantChange={setActiveVariantId}
          onVariantUpdate={handleVariantUpdate}
          onAddVariant={handleAddVariant}
          onDeleteVariant={handleDeleteVariantRequest}
          onSaveDraft={handleSaveDraft}
          onPublish={handlePublish}
          isSaving={isSaving}
          canSaveDraft={canSaveDraft}
          canPublish={canPublish}
          isEditMode={isEditMode}
          recipes={recipes}
          storeId={storeId}
          shopDomain={shopDomain}
          advancedTargetingEnabled={advancedTargetingEnabled}
          customThemePresets={customThemePresets}
          defaultThemeTokens={defaultThemeTokens}
        />

        {/* Delete Confirmation Modal */}
        <Modal
          open={deleteConfirmation.open}
          onClose={handleDeleteVariantCancel}
          title={`Delete Variant ${deleteConfirmation.variantName}?`}
          primaryAction={{
            content: "Delete",
            destructive: true,
            onAction: handleDeleteVariantConfirm,
          }}
          secondaryActions={[
            {
              content: "Cancel",
              onAction: handleDeleteVariantCancel,
            },
          ]}
        >
          <Modal.Section>
            <BlockStack gap="300">
              <Text as="p">
                Are you sure you want to delete <strong>Variant {deleteConfirmation.variantName}</strong>?
              </Text>
              <Text as="p" tone="subdued">
                This will remove all configuration for this variant and redistribute traffic among the remaining variants.
              </Text>
            </BlockStack>
          </Modal.Section>
        </Modal>
      </>
    );
  }

  // Step 1: Experiment Setup
  return (
    <ExperimentSetupView
      experiment={experiment}
      onBack={onBack}
      onExperimentChange={handleExperimentChange}
      onConfigureVariant={handleConfigureVariant}
      onAddVariant={handleAddVariant}
      onTrafficChange={handleTrafficChange}
      onEqualSplit={handleEqualSplit}
      onContinue={handleSetupComplete}
      onSaveDraft={handleSaveDraft}
      onPublish={handlePublish}
      isSaving={isSaving}
      canSaveDraft={canSaveDraft}
      canPublish={canPublish}
      isEditMode={isEditMode}
    />
  );
}
