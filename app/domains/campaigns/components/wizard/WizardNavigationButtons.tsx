/**
 * WizardNavigationButtons - Navigation Buttons for Wizard
 *
 * SOLID Compliance:
 * - Single Responsibility: Renders navigation buttons
 * - <50 lines
 * - Extracted from CampaignFormWithABTesting
 */

import { Button, InlineStack } from "@shopify/polaris";

interface WizardNavigationButtonsProps {
  currentStep: number;
  totalSteps: number;
  isLastStep: boolean;
  isSubmitting: boolean;
  campaignId?: string;
  onPrevious: () => void;
  onNext: () => void;
  onSave: () => void;
}

export function WizardNavigationButtons({
  currentStep,
  isLastStep,
  isSubmitting,
  campaignId,
  onPrevious,
  onNext,
  onSave,
}: WizardNavigationButtonsProps) {
  return (
    <InlineStack align="space-between">
      <Button onClick={onPrevious} disabled={currentStep === 0} data-test-id="wizard-previous-btn">
        Previous
      </Button>

      {isLastStep ? (
        <Button
          variant="primary"
          onClick={onSave}
          disabled={isSubmitting}
          loading={isSubmitting}
          data-test-id="wizard-save-btn"
        >
          {campaignId ? "Save Changes" : "Create Campaign"}
        </Button>
      ) : (
        <Button variant="primary" onClick={onNext} data-test-id="wizard-next-btn">
          Next
        </Button>
      )}
    </InlineStack>
  );
}

