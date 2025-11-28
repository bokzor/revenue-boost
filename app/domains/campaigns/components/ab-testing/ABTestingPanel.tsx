/**
 * ABTestingPanel - A/B Testing Control Panel Component
 *
 * SOLID Compliance:
 * - Single Responsibility: Manages A/B testing toggle and variant selection
 * - <50 lines of logic
 * - Extracted from CampaignFormWithABTesting for better separation
 */

import { Card, InlineStack, BlockStack, Badge, Checkbox, Banner, Text, Link } from "@shopify/polaris";
import { VariantSelector } from "./VariantSelector";

export type VariantKey = "A" | "B" | "C" | "D";

interface ABTestingPanelProps {
  abTestingEnabled: boolean;
  onToggle: (enabled: boolean) => void;
  selectedVariant: VariantKey;
  onVariantSelect: (variant: VariantKey) => void;
  variantCount: number;
  experimentId?: string;
  experimentName?: string;
  currentVariantKey?: string | null;
  disabled?: boolean;
  /** Whether A/B testing is enabled for the current plan */
  experimentsEnabled?: boolean;
}

export function ABTestingPanel({
  abTestingEnabled,
  onToggle,
  selectedVariant,
  onVariantSelect,
  variantCount,
  experimentId,
  experimentName,
  currentVariantKey,
  disabled = false,
  experimentsEnabled = false,
}: ABTestingPanelProps) {
  // Determine if the toggle should be disabled
  const isToggleDisabled = disabled || !!experimentId || !experimentsEnabled;

  return (
    <Card>
      <div style={{ padding: "16px" }}>
        <BlockStack gap="400">
          {/* Upgrade banner when experiments are not available on current plan */}
          {!experimentsEnabled && !experimentId && (
            <Banner tone="warning">
              <BlockStack gap="200">
                <Text as="p" variant="bodyMd" fontWeight="semibold">
                  A/B Testing requires a higher plan
                </Text>
                <Text as="p" variant="bodySm">
                  Upgrade to the Growth plan or higher to create A/B test experiments and optimize
                  your campaigns with data-driven insights.{" "}
                  <Link url="/app/billing">View plans</Link>
                </Text>
              </BlockStack>
            </Banner>
          )}

          {experimentId && experimentName && (
            <Banner tone="info">
              <BlockStack gap="200">
                <Text as="p" variant="bodyMd" fontWeight="semibold">
                  Editing Experiment: {experimentName}
                </Text>
                <Text as="p" variant="bodySm">
                  You are editing variant <strong>{currentVariantKey}</strong> of this A/B test. Use
                  the variant selector below to switch between variants.
                </Text>
              </BlockStack>
            </Banner>
          )}

          <InlineStack align="space-between" blockAlign="center">
            <InlineStack gap="400" blockAlign="center">
              <Badge tone={abTestingEnabled ? "success" : "info"}>
                {abTestingEnabled ? "A/B Test Active" : "A/B Test"}
              </Badge>
              <Checkbox
                label="Enable A/B Testing"
                checked={abTestingEnabled}
                onChange={onToggle}
                disabled={isToggleDisabled}
              />
              {!experimentsEnabled && !experimentId && (
                <Badge tone="attention">Upgrade Required</Badge>
              )}
            </InlineStack>

            {abTestingEnabled && (
              <VariantSelector
                selectedVariant={selectedVariant}
                onSelect={onVariantSelect}
                variantCount={variantCount}
              />
            )}
          </InlineStack>
        </BlockStack>
      </div>
    </Card>
  );
}
