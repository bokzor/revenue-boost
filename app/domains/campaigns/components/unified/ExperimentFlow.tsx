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
import { VariantConfigurator } from "./experiment/VariantConfigurator";
import { ExperimentSetupView } from "./experiment/ExperimentSetupView";
import type { StyledRecipe } from "../../recipes/styled-recipe-types";
import type { Experiment, Variant, TrafficAllocation, SuccessMetric } from "./types";
export type { Experiment, Variant, TrafficAllocation, SuccessMetric } from "./types";

// =============================================================================
// PROPS
// =============================================================================

export interface ExperimentFlowProps {
  onBack: () => void;
  onSave: (experiment: Experiment) => Promise<void>;
  recipes: StyledRecipe[];
  storeId: string;
  shopDomain?: string;
  advancedTargetingEnabled?: boolean;
}

// =============================================================================
// MAIN COMPONENT
// =============================================================================

export function ExperimentFlow({
  onBack,
  onSave,
  recipes,
  storeId,
  shopDomain,
  advancedTargetingEnabled,
}: ExperimentFlowProps) {
  const [step, setStep] = useState<"setup" | "configure">("setup");
  const [activeVariantId, setActiveVariantId] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [experiment, setExperiment] = useState<Experiment>({
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
  });

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

  const handleExperimentChange = useCallback((updates: Partial<Experiment>) => {
    setExperiment((prev) => ({ ...prev, ...updates }));
  }, []);

  const handleSaveDraft = async () => {
    setIsSaving(true);
    try {
      await onSave(experiment);
    } finally {
      setIsSaving(false);
    }
  };

  // =============================================================================
  // RENDER
  // =============================================================================

  // Step 2: Variant Configurator
  if (step === "configure" && activeVariantId) {
    return (
      <VariantConfigurator
        experiment={experiment}
        activeVariantId={activeVariantId}
        onBack={() => setStep("setup")}
        onVariantChange={setActiveVariantId}
        onVariantUpdate={handleVariantUpdate}
        onAddVariant={handleAddVariant}
        recipes={recipes}
        storeId={storeId}
        shopDomain={shopDomain}
        advancedTargetingEnabled={advancedTargetingEnabled}
      />
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
      isSaving={isSaving}
    />
  );
}
