/**
 * ExperimentSetupView Component
 *
 * Step 1 of the experiment flow.
 * Configure experiment details, variants, and traffic allocation.
 */

import { Card, BlockStack, InlineStack, Text, TextField, Select, Button, InlineGrid } from "@shopify/polaris";
import { ArrowLeftIcon, PlusIcon } from "@shopify/polaris-icons";
import { VariantCard } from "./VariantCard";
import { AddVariantCard } from "./AddVariantCard";
import { TrafficAllocation } from "./TrafficAllocation";
import { SUCCESS_METRICS, type Experiment, type SuccessMetric } from "../types";

export interface ExperimentSetupViewProps {
  experiment: Experiment;
  onBack: () => void;
  onExperimentChange: (updates: Partial<Experiment>) => void;
  onConfigureVariant: (variantId: string) => void;
  onAddVariant: () => void;
  onTrafficChange: (variantId: string, value: number) => void;
  onEqualSplit: () => void;
  onContinue: () => void;
  onSaveDraft: () => void;
  onPublish: () => void;
  isSaving: boolean;
  /** Whether at least one variant is configured (enables save draft) */
  canSaveDraft: boolean;
  /** Whether all variants are configured (enables publish) */
  canPublish: boolean;
  /** Edit mode shows "Edit Experiment" instead of "Create" */
  isEditMode?: boolean;
}

export function ExperimentSetupView({
  experiment,
  onBack,
  onExperimentChange,
  onConfigureVariant,
  onAddVariant,
  onTrafficChange,
  onEqualSplit,
  onContinue,
  onSaveDraft,
  onPublish,
  isSaving,
  canSaveDraft,
  canPublish,
  isEditMode = false,
}: ExperimentSetupViewProps) {
  const canProceed =
    experiment.name.trim() !== "" && experiment.variants.some((v) => v.status !== "empty");

  return (
    <div style={{ minHeight: "100vh", backgroundColor: "var(--p-color-bg)" }}>
      {/* Sticky Header */}
      <div
        style={{
          position: "sticky",
          top: 0,
          zIndex: 50,
          backgroundColor: "var(--p-color-bg-surface)",
          borderBottom: "1px solid var(--p-color-border)",
        }}
      >
        <div style={{ maxWidth: "900px", margin: "0 auto", padding: "16px 24px" }}>
          <InlineStack align="space-between" blockAlign="center">
            <InlineStack gap="400" blockAlign="center">
              <Button
                icon={ArrowLeftIcon}
                variant="plain"
                onClick={onBack}
                accessibilityLabel="Go back"
              />
              <InlineStack gap="200" blockAlign="center">
                <span style={{ fontSize: "20px" }}>🧪</span>
                <Text as="span" variant="headingMd">
                  {isEditMode ? "Edit Experiment" : "Create A/B Experiment"}
                </Text>
              </InlineStack>
            </InlineStack>
            <InlineStack gap="300">
              <Button onClick={onSaveDraft} disabled={isSaving || !canSaveDraft} loading={isSaving}>
                {isEditMode ? "Save" : "Save Draft"}
              </Button>
              <Button variant="primary" onClick={onContinue} disabled={!canProceed}>
                Next →
              </Button>
              <Button
                variant="primary"
                tone="success"
                onClick={onPublish}
                disabled={isSaving || !canPublish}
                loading={isSaving}
              >
                {isEditMode ? "Update & Publish" : "Publish"}
              </Button>
            </InlineStack>
          </InlineStack>
        </div>
      </div>

      {/* Content */}
      <div style={{ maxWidth: "900px", margin: "0 auto", padding: "32px 24px" }}>
        <BlockStack gap="600">
          {/* Experiment Details */}
          <Card>
            <BlockStack gap="400">
              <Text as="h2" variant="headingSm" tone="subdued">
                EXPERIMENT DETAILS
              </Text>
              <TextField
                label="Name"
                placeholder="e.g., Summer Sale Popup Test"
                value={experiment.name}
                onChange={(value) => onExperimentChange({ name: value })}
                autoComplete="off"
              />
              <TextField
                label="Hypothesis"
                placeholder="e.g., I believe showing 15% off will convert better than 10%"
                value={experiment.hypothesis}
                onChange={(value) => onExperimentChange({ hypothesis: value })}
                multiline={3}
                helpText="What are you trying to learn from this experiment?"
                autoComplete="off"
              />
              <Select
                label="Success Metric"
                options={SUCCESS_METRICS}
                value={experiment.successMetric}
                onChange={(value) => onExperimentChange({ successMetric: value as SuccessMetric })}
              />
            </BlockStack>
          </Card>

          {/* Variants */}
          <Card>
            <BlockStack gap="400">
              <InlineStack align="space-between" blockAlign="center">
                <Text as="h2" variant="headingSm" tone="subdued">
                  VARIANTS
                </Text>
                {experiment.variants.length < 4 && (
                  <Button icon={PlusIcon} onClick={onAddVariant} size="slim">
                    Add Variant
                  </Button>
                )}
              </InlineStack>
              <InlineGrid columns={{ xs: 2, md: 4 }} gap="400">
                {experiment.variants.map((variant, index) => (
                  <VariantCard
                    key={variant.id}
                    variant={variant}
                    isControl={index === 0}
                    onClick={() => onConfigureVariant(variant.id)}
                  />
                ))}
                {experiment.variants.length < 4 && <AddVariantCard onClick={onAddVariant} />}
              </InlineGrid>
            </BlockStack>
          </Card>

          {/* Traffic Allocation */}
          <TrafficAllocation
            variants={experiment.variants}
            allocation={experiment.trafficAllocation}
            onAllocationChange={onTrafficChange}
            onEqualSplit={onEqualSplit}
          />
        </BlockStack>
      </div>
    </div>
  );
}
