/**
 * useCampaignSubmission - Campaign Submission Logic Hook
 * 
 * SOLID Compliance:
 * - Single Responsibility: Handles campaign submission logic
 * - Extracted from CampaignFormWithABTesting
 * - <50 lines
 */

import { useState, useCallback } from "react";
import type { CampaignFormData } from "~/shared/hooks/useWizardState";
import type { VariantKey } from "./useVariantManager";

interface UseWizardStateReturn {
  wizardState: CampaignFormData;
}

interface ExperimentMetadata {
  experimentName: string;
  experimentDescription: string;
  experimentHypothesis: string;
  experimentType: string;
  successMetric: string;
  trafficAllocation: Record<string, number>;
}

interface UseCampaignSubmissionProps {
  onSave: (campaignData: CampaignFormData | CampaignFormData[]) => Promise<void>;
}

export function useCampaignSubmission({ onSave }: UseCampaignSubmissionProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);

  const submitSingleCampaign = useCallback(
    async (wizardState: CampaignFormData) => {
      setIsSubmitting(true);
      setSubmitError(null);

      try {
        await onSave({
          ...wizardState,
          abTestingEnabled: false,
        });
      } catch (error) {
        setSubmitError(error instanceof Error ? error.message : "Failed to save campaign");
        throw error;
      } finally {
        setIsSubmitting(false);
      }
    },
    [onSave]
  );

  const submitABTestCampaign = useCallback(
    async (
      wizardStates: UseWizardStateReturn[],
      variantCount: number,
      experimentMetadata: ExperimentMetadata
    ) => {
      setIsSubmitting(true);
      setSubmitError(null);

      try {
        const activeVariantKeys = (["A", "B", "C", "D"] as VariantKey[]).slice(0, variantCount);
        const activeVariants = activeVariantKeys.map((key, index) => wizardStates[index].wizardState);

        const variantsWithMetadata = activeVariants.map((variant, index) => ({
          ...variant,
          ...experimentMetadata,
          trafficAllocation: experimentMetadata.trafficAllocation[["A", "B", "C", "D"][index] as VariantKey],
        }));

        await onSave(variantsWithMetadata);
      } catch (error) {
        setSubmitError(error instanceof Error ? error.message : "Failed to save campaign");
        throw error;
      } finally {
        setIsSubmitting(false);
      }
    },
    [onSave]
  );

  return {
    isSubmitting,
    submitError,
    setSubmitError,
    submitSingleCampaign,
    submitABTestCampaign,
  };
}

