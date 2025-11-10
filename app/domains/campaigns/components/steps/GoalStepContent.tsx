/**
 * Goal Step Content Component
 * 
 * Extracted from CampaignFormWithABTesting to follow SOLID principles:
 * - Single Responsibility: Only renders goal step content
 * - Separation of Concerns: Isolated from parent form logic
 */

import {
  Card,
  BlockStack,
  Text,
  Badge,
  Banner,
  TextField,
  FormLayout,
  InlineStack,
} from "@shopify/polaris";
import { GoalSelectorV2 } from "../GoalSelectorV2";
import type { CampaignGoal } from "~/shared/hooks/useWizardState";

interface GoalStepContentProps {
  storeId: string;
  goal?: CampaignGoal;
  name?: string;
  description?: string;
  abTestingEnabled: boolean;
  selectedVariant: string;
  isControl: boolean;
  variantName?: string;
  variantDescription?: string;
  onGoalChange: (goal: CampaignGoal) => void;
  onNameChange: (name: string) => void;
  onDescriptionChange: (description: string) => void;
  onVariantNameChange: (name: string) => void;
  onVariantDescriptionChange: (description: string) => void;
}

export function GoalStepContent({
  storeId,
  goal,
  name,
  description,
  abTestingEnabled,
  selectedVariant,
  isControl,
  variantName,
  variantDescription,
  onGoalChange,
  onNameChange,
  onDescriptionChange,
  onVariantNameChange,
  onVariantDescriptionChange,
}: GoalStepContentProps) {
  return (
    <BlockStack gap="400">
      {/* Variant-Specific Information */}
      {abTestingEnabled && (
        <Card>
          <BlockStack gap="400">
            <InlineStack align="space-between" blockAlign="center">
              <Text as="h3" variant="headingMd">
                Variant {selectedVariant} Configuration
              </Text>
              <Badge tone={isControl ? "info" : "success"}>
                {isControl ? "Control" : "Test Variant"}
              </Badge>
            </InlineStack>
            <FormLayout>
              <TextField
                label="Variant Name"
                value={variantName || ""}
                onChange={onVariantNameChange}
                placeholder={`e.g., ${selectedVariant === "A" ? "Original Design" : "New Design"}`}
                autoComplete="off"
              />
              <TextField
                label="Variant Description"
                value={variantDescription || ""}
                onChange={onVariantDescriptionChange}
                placeholder="Describe what's different in this variant"
                multiline={2}
                autoComplete="off"
              />
            </FormLayout>
          </BlockStack>
        </Card>
      )}

      {/* Goal Selection */}
      <Card>
        <BlockStack gap="400">
          <Text as="h3" variant="headingMd">
            Campaign Goal {abTestingEnabled && "(Shared by All Variants)"}
          </Text>

          {abTestingEnabled && selectedVariant !== "A" ? (
            <Banner tone="info">
              <BlockStack gap="200">
                <Text as="p" variant="bodyMd" fontWeight="semibold">
                  Goal: {goal?.replace(/_/g, " ")}
                </Text>
                <Text as="p" variant="bodySm">
                  All variants in this A/B test share the same goal. The goal is set on{" "}
                  <strong>Variant A (Control)</strong> and applies to all test variants.
                </Text>
                <Text as="p" variant="bodySm" tone="subdued">
                  Switch to Variant A to change the experiment goal.
                </Text>
              </BlockStack>
            </Banner>
          ) : (
            <>
              {abTestingEnabled && selectedVariant === "A" && (
                <Banner tone="info">
                  <BlockStack gap="200">
                    <Text as="p" variant="bodyMd" fontWeight="semibold">
                      All variants share the same goal
                    </Text>
                    <Text as="p" variant="bodySm">
                      In A/B testing, variants test different approaches to achieve the same goal.
                      The goal you select here will apply to all variants in this experiment.
                    </Text>
                  </BlockStack>
                </Banner>
              )}

              <GoalSelectorV2
                value={goal}
                storeId={storeId}
                onChange={onGoalChange}
              />
            </>
          )}
        </BlockStack>
      </Card>

      {/* Campaign Information (non-A/B testing only) */}
      {!abTestingEnabled && (
        <Card>
          <BlockStack gap="400">
            <Text as="h3" variant="headingMd">
              Campaign Information
            </Text>
            <FormLayout>
              <TextField
                label="Campaign Name"
                value={name || ""}
                onChange={onNameChange}
                placeholder="e.g., Summer Sale Campaign"
                autoComplete="off"
                requiredIndicator
              />
              <TextField
                label="Description"
                value={description || ""}
                onChange={onDescriptionChange}
                placeholder="Describe your campaign objectives"
                multiline={3}
                autoComplete="off"
              />
            </FormLayout>
          </BlockStack>
        </Card>
      )}
    </BlockStack>
  );
}

