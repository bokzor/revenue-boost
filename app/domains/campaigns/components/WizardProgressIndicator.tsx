/**
 * WizardProgressIndicator - Modern stepper component for campaign wizard
 *
 * Features:
 * - Horizontal stepper with connecting lines
 * - Clear visual states (completed, active, upcoming)
 * - Progress percentage
 * - Checkmarks for completed steps
 * - Mobile-responsive (vertical on small screens)
 * - Accessible with ARIA labels
 * - Integrated navigation buttons (Previous/Next)
 *
 * OPTIMIZED: Memoized to prevent unnecessary re-renders
 * - useMemo for expensive calculations
 * - React.memo for component
 */

import React, { useMemo } from "react";
import { BlockStack, InlineStack, Text, Badge, ProgressBar, Button } from "@shopify/polaris";
import styles from "./WizardProgressIndicator.module.css";

export interface WizardStep {
  id: string;
  title: string;
  description: string;
  isRequired: boolean;
}

type VariantKey = "A" | "B" | "C" | "D";

interface NavigationProps {
  isLastStep: boolean;
  isSubmitting: boolean;
  campaignId?: string;
  onPrevious: () => void;
  onNext: () => void;
  onSave: () => void;
  abTestingEnabled?: boolean;
  selectedVariant?: VariantKey;
  variantCount?: number;
  onContinueToNextVariant?: () => void;
}

interface WizardProgressIndicatorProps {
  steps: WizardStep[];
  currentStep: number;
  completedSteps: boolean[]; // Array indicating which steps are completed
  onStepClick: (stepIndex: number) => void;
  navigation?: NavigationProps;
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
 * Check if we're on the last variant
 */
function isLastVariant(selectedVariant: VariantKey, variantCount: number): boolean {
  const sequence: VariantKey[] = ["A", "B", "C", "D"];
  const currentIndex = sequence.indexOf(selectedVariant);
  return currentIndex >= variantCount - 1;
}

/**
 * Get appropriate button text based on context
 */
function getButtonText(
  campaignId: string | undefined,
  abTestingEnabled: boolean,
  selectedVariant: VariantKey,
  variantCount: number
): string {
  if (campaignId) {
    return "Save Changes";
  }

  if (abTestingEnabled) {
    if (isLastVariant(selectedVariant, variantCount)) {
      return "Create Campaign";
    }
    const nextVariant = getNextVariantKey(selectedVariant);
    return `Continue to Variant ${nextVariant}`;
  }

  return "Create Campaign";
}

export const WizardProgressIndicator = React.memo(function WizardProgressIndicator({
  steps,
  currentStep,
  completedSteps,
  onStepClick,
  navigation,
}: WizardProgressIndicatorProps) {
  // Memoize expensive calculations
  const { completedCount, progressPercentage } = useMemo(() => {
    const count = completedSteps.filter(Boolean).length;
    const percentage = Math.round((count / steps.length) * 100);
    return { completedCount: count, progressPercentage: percentage };
  }, [completedSteps, steps.length]);

  // Navigation button logic
  const renderNavigation = () => {
    if (!navigation) return null;

    const {
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
    } = navigation;

    const buttonText = getButtonText(campaignId, abTestingEnabled, selectedVariant, variantCount);
    const isOnLastVariant = isLastVariant(selectedVariant, variantCount);

    const handlePrimaryClick = () => {
      if (abTestingEnabled && !isOnLastVariant && !campaignId && onContinueToNextVariant) {
        onContinueToNextVariant();
      } else {
        onSave();
      }
    };

    return (
      <InlineStack gap="200">
        <Button
          onClick={onPrevious}
          disabled={currentStep === 0}
          size="slim"
          data-test-id="wizard-previous-btn"
        >
          ← Previous
        </Button>
        {isLastStep ? (
          <Button
            variant="primary"
            onClick={handlePrimaryClick}
            disabled={isSubmitting}
            loading={isSubmitting}
            size="slim"
            data-test-id="wizard-save-btn"
          >
            {buttonText}
          </Button>
        ) : (
          <Button
            variant="primary"
            onClick={onNext}
            size="slim"
            data-test-id="wizard-next-btn"
          >
            Next →
          </Button>
        )}
      </InlineStack>
    );
  };

  return (
    <BlockStack gap="400">
      {/* Header with progress and navigation */}
      <InlineStack align="space-between" blockAlign="center" wrap={false}>
        <InlineStack gap="300" blockAlign="center">
          <Text as="h2" variant="headingMd">
            Campaign Setup
          </Text>
          <Badge tone={progressPercentage === 100 ? "success" : "info"}>
            {`${completedCount}/${steps.length}`}
          </Badge>
        </InlineStack>
        {renderNavigation()}
      </InlineStack>

      {/* Progress bar */}
      <ProgressBar progress={progressPercentage} size="small" />

      {/* Desktop: Horizontal stepper */}
      <div className={styles.stepperDesktop}>
        <div className={styles.stepperContainer}>
          {steps.map((step, index) => {
            const isActive = index === currentStep;
            const isCompleted = completedSteps[index];
            const isUpcoming = !isActive && !isCompleted;

            return (
              <React.Fragment key={step.id}>
                {/* Step */}
                <div className={styles.stepWrapper}>
                  <button
                    className={`${styles.stepButton} ${
                      isActive ? styles.stepActive : ""
                    } ${isCompleted ? styles.stepCompleted : ""} ${
                      isUpcoming ? styles.stepUpcoming : ""
                    }`}
                    onClick={() => onStepClick(index)}
                    aria-label={`Step ${index + 1}: ${step.title}`}
                    aria-current={isActive ? "step" : undefined}
                  >
                    {/* Step circle */}
                    <div className={styles.stepCircle}>
                      {isCompleted ? (
                        <span className={styles.successCheckmark}>✓</span>
                      ) : (
                        <span className={styles.stepNumber}>{index + 1}</span>
                      )}
                    </div>

                    {/* Step label */}
                    <div className={styles.stepLabel}>
                      <Text
                        as="span"
                        variant="bodySm"
                        fontWeight={isActive ? "semibold" : "regular"}
                      >
                        {step.title}
                        {step.isRequired && <span className={styles.required}> *</span>}
                      </Text>
                    </div>
                  </button>
                </div>

                {/* Connector line */}
                {index < steps.length - 1 && (
                  <div
                    className={`${styles.connector} ${
                      completedSteps[index] ? styles.connectorCompleted : ""
                    }`}
                  />
                )}
              </React.Fragment>
            );
          })}
        </div>
      </div>

      {/* Mobile: Vertical list */}
      <div className={styles.stepperMobile}>
        <BlockStack gap="200">
          {steps.map((step, index) => {
            const isActive = index === currentStep;
            const isCompleted = completedSteps[index];

            return (
              <button
                key={step.id}
                className={`${styles.stepButtonMobile} ${isActive ? styles.stepActiveMobile : ""}`}
                onClick={() => onStepClick(index)}
              >
                <InlineStack gap="300" blockAlign="center">
                  {/* Icon */}
                  <div className={styles.stepIconMobile}>
                    {isCompleted ? (
                      <span className={styles.successCheckmarkMobile}>✓</span>
                    ) : (
                      <div
                        style={{
                          width: "20px",
                          height: "20px",
                          borderRadius: "50%",
                          border: `2px solid ${isActive ? "var(--p-color-border-brand)" : "var(--p-color-border-subdued)"}`,
                          background: isActive ? "var(--p-color-bg-fill-brand)" : "transparent",
                        }}
                      />
                    )}
                  </div>

                  {/* Text */}
                  <div style={{ flex: 1 }}>
                    <Text as="span" variant="bodySm" fontWeight={isActive ? "semibold" : "regular"}>
                      {index + 1}. {step.title}
                      {step.isRequired && " *"}
                    </Text>
                  </div>

                  {/* Status badge */}
                  {isActive && (
                    <Badge tone="info" size="small">
                      Current
                    </Badge>
                  )}
                  {isCompleted && !isActive && (
                    <Badge tone="success" size="small">
                      Done
                    </Badge>
                  )}
                </InlineStack>
              </button>
            );
          })}
        </BlockStack>
      </div>

      {/* Current step info */}
      <div className={styles.currentStepInfo}>
        <BlockStack gap="200">
          <InlineStack align="space-between" blockAlign="center">
            <Text as="h3" variant="headingSm">
              {steps[currentStep].title}
            </Text>
            <Badge tone={completedSteps[currentStep] ? "success" : "attention"}>
              {completedSteps[currentStep] ? "Complete" : "In Progress"}
            </Badge>
          </InlineStack>
          <Text as="p" variant="bodySm" tone="subdued">
            {steps[currentStep].description}
          </Text>
        </BlockStack>
      </div>
    </BlockStack>
  );
});
