/**
 * VariantCard Component
 *
 * Displays a single variant in the experiment setup step.
 * Shows status, recipe info, and configuration state.
 */

import { Card, BlockStack, InlineStack, Text, Badge, Box, Icon } from "@shopify/polaris";
import { CheckIcon, SettingsIcon } from "@shopify/polaris-icons";
import type { Variant } from "../types";

interface VariantCardProps {
  variant: Variant;
  isControl: boolean;
  onClick: () => void;
}

export function VariantCard({ variant, isControl, onClick }: VariantCardProps) {
  const isConfigured = variant.status === "configured";

  return (
    <div
      onClick={onClick}
      style={{
        cursor: "pointer",
        borderRadius: "12px",
        border: isConfigured
          ? "2px solid var(--p-color-border-success)"
          : "1px solid var(--p-color-border)",
        backgroundColor: "var(--p-color-bg-surface)",
        overflow: "hidden",
        transition: "all 0.2s ease",
      }}
    >
      <Box padding="400">
        <BlockStack gap="300">
          {/* Header with variant name and control badge */}
          <InlineStack align="space-between" blockAlign="center">
            <InlineStack gap="200" blockAlign="center">
              <Text as="span" variant="headingMd">
                Variant {variant.name}
              </Text>
              {isControl && <Badge tone="info">Control</Badge>}
            </InlineStack>
            {isConfigured ? (
              <div
                style={{
                  width: "24px",
                  height: "24px",
                  borderRadius: "50%",
                  backgroundColor: "var(--p-color-bg-fill-success)",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                }}
              >
                <Icon source={CheckIcon} tone="success" />
              </div>
            ) : (
              <Icon source={SettingsIcon} tone="subdued" />
            )}
          </InlineStack>

          {/* Recipe info or empty state */}
          {variant.recipe ? (
            <BlockStack gap="200">
              <InlineStack gap="200" blockAlign="center">
                <span style={{ fontSize: "20px" }}>{variant.recipe.icon || "📦"}</span>
                <Text as="span" variant="bodySm" fontWeight="semibold">
                  {variant.recipe.name}
                </Text>
              </InlineStack>
              <Text as="p" variant="bodySm" tone="subdued">
                {variant.recipe.description}
              </Text>
            </BlockStack>
          ) : (
            <Box padding="400" background="bg-surface-secondary" borderRadius="200">
              <Text as="p" alignment="center" tone="subdued" variant="bodySm">
                Click to configure
              </Text>
            </Box>
          )}
        </BlockStack>
      </Box>
    </div>
  );
}

