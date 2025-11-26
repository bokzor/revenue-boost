/**
 * WizardNavigationButtons - Navigation Buttons for Wizard
 *
 * SOLID Compliance:
 * - Single Responsibility: Renders navigation buttons
 * - Extracted from CampaignFormWithABTesting
 *
 * Supports A/B testing flow:
 * - Non-final variant: "Continue to Variant {X}"
 * - Final variant: "Create Experiment"
 * - Standalone: "Create Campaign"
 * - Editing: "Save Changes"
 */

import { Button, InlineStack } from "@shopify/polaris";

type VariantKey = "A" | "B" | "C" | "D";

interface WizardNavigationButtonsProps {
  currentStep: number;
  totalSteps: number;
  isLastStep: boolean;
  isSubmitting: boolean;
  campaignId?: string;
  onPrevious: () => void;
  onNext: () => void;
  onSave: () => void;
  // A/B Testing context
  abTestingEnabled?: boolean;
  selectedVariant?: VariantKey;
  variantCount?: number;
  onContinueToNextVariant?: () => void;
}

/**
 * Get the next variant key in sequence
 */
function getNextVariantKey(current: VariantKey): VariantKey {
  const sequence: VariantKey[] = ["A", "B", "C", "D"];
  const currentIndex = sequence.indexOf(current);
  return sequence[currentIndex + 1] || current;
}

/**
 * Check if the current variant is the last one
 */
function isLastVariant(selectedVariant: VariantKey, variantCount: number): boolean {
  const variantIndex = ["A", "B", "C", "D"].indexOf(selectedVariant);
  return variantIndex >= variantCount - 1;
}

/**
 * Get the appropriate button text based on context
 */
function getButtonText(
  campaignId: string | undefined,
  abTestingEnabled: boolean,
  selectedVariant: VariantKey,
  variantCount: number
): string {
  // Editing existing campaign/experiment
  if (campaignId) {
    return "Save Changes";
  }

  // Standalone campaign (no A/B testing)
  if (!abTestingEnabled) {
    return "Create Campaign";
  }

  // A/B Testing enabled - check if on last variant
  if (isLastVariant(selectedVariant, variantCount)) {
    return "Create Experiment";
  }

  // Not on last variant - show continue button
  const nextVariant = getNextVariantKey(selectedVariant);
  return `Continue to Variant ${nextVariant}`;
}

export function WizardNavigationButtons({
  currentStep,
  isLastStep,
  isSubmitting,
  campaignId,
  onPrevious,
  onNext,
  onSave,
  abTestingEnabled = false,
  selectedVariant = "A",
  variantCount = 2,
  onContinueToNextVariant,
}: WizardNavigationButtonsProps) {
  const buttonText = getButtonText(campaignId, abTestingEnabled, selectedVariant, variantCount);
  const isOnLastVariant = isLastVariant(selectedVariant, variantCount);

  // Determine click handler: continue to next variant or save
  const handlePrimaryClick = () => {
    if (abTestingEnabled && !isOnLastVariant && !campaignId && onContinueToNextVariant) {
      onContinueToNextVariant();
    } else {
      onSave();
    }
  };

  return (
    <InlineStack align="space-between">
      <Button onClick={onPrevious} disabled={currentStep === 0} data-test-id="wizard-previous-btn">
        Previous
      </Button>

      {isLastStep ? (
        <Button
          variant="primary"
          onClick={handlePrimaryClick}
          disabled={isSubmitting}
          loading={isSubmitting}
          data-test-id="wizard-save-btn"
        >
          {buttonText}
        </Button>
      ) : (
        <Button variant="primary" onClick={onNext} data-test-id="wizard-next-btn">
          Next
        </Button>
      )}
    </InlineStack>
  );
}
