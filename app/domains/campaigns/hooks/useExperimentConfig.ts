/**
 * Experiment Configuration Hook
 *
 * Extracted from CampaignFormWithABTesting to follow SOLID principles:
 * - Single Responsibility: Only manages experiment configuration
 * - Separation of Concerns: Isolates experiment metadata from variant data
 */

import { useState, useCallback, useEffect } from "react";
import type { ExperimentType, SuccessMetric } from "~/domains/analytics/ab-testing.types";
import type { VariantKey } from "./useVariantManager";

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

interface UseExperimentConfigProps {
  experimentData?: ExperimentData;
  initialVariantCount?: number;
}

export function useExperimentConfig({
  experimentData,
  initialVariantCount = 2,
}: UseExperimentConfigProps) {
  // Experiment metadata
  const [experimentName, setExperimentName] = useState<string>(
    experimentData?.name || getDefaultExperimentName(initialVariantCount)
  );

  const [experimentDescription, setExperimentDescription] = useState<string>(
    experimentData?.description || ""
  );

  const [experimentHypothesis, setExperimentHypothesis] = useState<string>(
    experimentData?.hypothesis || ""
  );

  const [experimentType, setExperimentType] = useState<ExperimentType>("A/B");

  const [successMetric, setSuccessMetric] = useState<SuccessMetric>(
    (experimentData?.successMetric as SuccessMetric) || "conversion_rate"
  );

  // Traffic allocation
  const [trafficAllocation, setTrafficAllocation] = useState<Record<string, number>>(
    experimentData?.trafficAllocation || calculateTrafficAllocation(initialVariantCount)
  );

  // Sync with experiment data changes
  useEffect(() => {
    if (experimentData) {
      setExperimentName(experimentData.name || "");
      setExperimentDescription(experimentData.description || "");
      setExperimentHypothesis(experimentData.hypothesis || "");
      setSuccessMetric((experimentData.successMetric as SuccessMetric) || "conversion_rate");
      setTrafficAllocation(experimentData.trafficAllocation || calculateTrafficAllocation(initialVariantCount));
    }
  }, [experimentData, initialVariantCount]);

  // Update traffic allocation when variant count changes
  const updateTrafficAllocation = useCallback((variantCount: number) => {
    const allocation = calculateTrafficAllocation(variantCount);
    setTrafficAllocation(allocation);
  }, []);

  // Get experiment metadata for submission
  const getExperimentMetadata = useCallback(() => {
    return {
      experimentName,
      experimentDescription,
      experimentHypothesis,
      experimentType,
      successMetric,
      trafficAllocation,
    };
  }, [
    experimentName,
    experimentDescription,
    experimentHypothesis,
    experimentType,
    successMetric,
    trafficAllocation,
  ]);

  return {
    experimentName,
    setExperimentName,
    experimentDescription,
    setExperimentDescription,
    experimentHypothesis,
    setExperimentHypothesis,
    experimentType,
    setExperimentType,
    successMetric,
    setSuccessMetric,
    trafficAllocation,
    setTrafficAllocation,
    updateTrafficAllocation,
    getExperimentMetadata,
  };
}

// Helper: Build a default experiment name based on variant count
function getDefaultExperimentName(variantCount: number): string {
  const variants = (["A", "B", "C", "D"] as VariantKey[]).slice(0, variantCount);
  return variants.map((key) => `Variant ${key}`).join(" - ");
}

// Helper: Calculate traffic allocation based on variant count
function calculateTrafficAllocation(variantCount: number): Record<string, number> {
  const allocation: Record<string, number> = { A: 0, B: 0, C: 0, D: 0 };
  const variants = (["A", "B", "C", "D"] as VariantKey[]).slice(0, variantCount);
  const percentPerVariant = Math.floor(100 / variantCount);
  const remainder = 100 - percentPerVariant * variantCount;

  variants.forEach((key, index) => {
    allocation[key] = percentPerVariant + (index === 0 ? remainder : 0);
  });

  return allocation;
}

