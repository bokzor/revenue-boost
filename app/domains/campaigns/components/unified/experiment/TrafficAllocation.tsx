/**
 * TrafficAllocation Component
 *
 * Traffic allocation sliders for A/B experiment variants.
 */

import { Card, BlockStack, InlineStack, Text, Button, RangeSlider, Box } from "@shopify/polaris";
import type { Variant, TrafficAllocation as TrafficAllocationType } from "../types";

interface TrafficAllocationProps {
  variants: Variant[];
  allocation: TrafficAllocationType[];
  onAllocationChange: (variantId: string, value: number) => void;
  onEqualSplit: () => void;
}

export function TrafficAllocation({
  variants,
  allocation,
  onAllocationChange,
  onEqualSplit,
}: TrafficAllocationProps) {
  return (
    <Card>
      <BlockStack gap="400">
        <InlineStack align="space-between" blockAlign="center">
          <Text as="h2" variant="headingSm" tone="subdued">
            TRAFFIC ALLOCATION
          </Text>
          <Button variant="plain" onClick={onEqualSplit} size="slim">
            Split Equally
          </Button>
        </InlineStack>

        <BlockStack gap="500">
          {variants.map((variant) => {
            const variantAllocation = allocation.find((a) => a.variantId === variant.id);
            const percentage = variantAllocation?.percentage || 0;

            return (
              <BlockStack key={variant.id} gap="200">
                <InlineStack align="space-between">
                  <Text as="span" variant="bodyMd" fontWeight="semibold">
                    Variant {variant.name}
                    {variant.isControl && (
                      <Text as="span" tone="subdued">
                        {" "}
                        (Control)
                      </Text>
                    )}
                  </Text>
                  <Text as="span" variant="bodyMd" fontWeight="bold">
                    {percentage}%
                  </Text>
                </InlineStack>
                <RangeSlider
                  label={`Traffic for Variant ${variant.name}`}
                  labelHidden
                  value={percentage}
                  onChange={(value) => onAllocationChange(variant.id, value as number)}
                  min={0}
                  max={100}
                  step={5}
                  output
                />
              </BlockStack>
            );
          })}
        </BlockStack>

        {/* Visual bar */}
        <Box paddingBlockStart="200">
          <div
            style={{
              display: "flex",
              height: "8px",
              borderRadius: "4px",
              overflow: "hidden",
              backgroundColor: "var(--p-color-bg-surface-secondary)",
            }}
          >
            {allocation.map((a, index) => {
              const colors = [
                "var(--p-color-bg-fill-info)",
                "var(--p-color-bg-fill-success)",
                "var(--p-color-bg-fill-warning)",
                "var(--p-color-bg-fill-critical)",
              ];
              return (
                <div
                  key={a.variantId}
                  style={{
                    width: `${a.percentage}%`,
                    backgroundColor: colors[index % colors.length],
                    transition: "width 0.2s ease",
                  }}
                />
              );
            })}
          </div>
        </Box>
      </BlockStack>
    </Card>
  );
}

