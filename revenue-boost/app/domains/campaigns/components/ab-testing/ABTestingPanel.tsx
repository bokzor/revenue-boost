/**
 * ABTestingPanel - A/B Testing Control Panel Component
 * 
 * SOLID Compliance:
 * - Single Responsibility: Manages A/B testing toggle and variant selection
 * - <50 lines of logic
 * - Extracted from CampaignFormWithABTesting for better separation
 */

import {
  Card,
  InlineStack,
  BlockStack,
  Badge,
  Checkbox,
  Banner,
  Text,
} from "@shopify/polaris";
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
}: ABTestingPanelProps) {
  return (
    <Card>
      <div style={{ padding: "16px" }}>
        <BlockStack gap="400">
          {experimentId && experimentName && (
            <Banner tone="info">
              <BlockStack gap="200">
                <Text as="p" variant="bodyMd" fontWeight="semibold">
                  Editing Experiment: {experimentName}
                </Text>
                <Text as="p" variant="bodySm">
                  You are editing variant <strong>{currentVariantKey}</strong> of this A/B test.
                  Use the variant selector below to switch between variants.
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
                disabled={disabled || !!experimentId}
              />
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

