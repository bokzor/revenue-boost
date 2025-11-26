/**
 * WheelSegmentEditor Component
 *
 * Enhanced editor for Spin-to-Win wheel segments with full discount configuration per segment.
 * Each segment can have its own complete discount setup including type, value, delivery mode, etc.
 */

import React, { useState } from "react";
import { Card, BlockStack, Text, Button, InlineStack, Collapsible, Badge } from "@shopify/polaris";
import { TextField, ColorField, FormGrid } from "../form";
import { GenericDiscountComponent } from "../form/GenericDiscountComponent";
import type { SpinToWinContent } from "../../types/campaign";
import type { DiscountConfig } from "../../types/campaign";

export type WheelSegment = SpinToWinContent["wheelSegments"][0];

interface WheelSegmentEditorProps {
  segments: WheelSegment[];
  onChange: (segments: WheelSegment[]) => void;
  errors?: Record<string, string>;
}

export function WheelSegmentEditor({ segments, onChange, errors }: WheelSegmentEditorProps) {
  const [expandedSegments, setExpandedSegments] = useState<Record<number, boolean>>({});

  const toggleSegment = (index: number) => {
    setExpandedSegments((prev) => ({
      ...prev,
      [index]: !prev[index],
    }));
  };

  const updateSegment = (index: number, updates: Partial<WheelSegment>) => {
    const updated = segments.map((seg, idx) => (idx === index ? { ...seg, ...updates } : seg));
    onChange(updated);
  };

  const updateSegmentDiscount = (index: number, discountConfig: DiscountConfig) => {
    const updated = segments.map((seg, idx) =>
      idx === index
        ? {
            ...seg,
            discountConfig,
          }
        : seg
    );
    onChange(updated);
  };

  const removeSegment = (index: number) => {
    const updated = segments.filter((_, idx) => idx !== index);
    onChange(updated);
  };

  const addSegment = () => {
    const newSegment: WheelSegment = {
      id: `segment-${Date.now()}`,
      label: "",
      probability: 0.1,
      color: "#3b82f6",
    };
    onChange([...segments, newSegment]);
  };

  // Helper to generate discount summary badge
  const getDiscountSummary = (segment: WheelSegment): string | null => {
    const config = segment.discountConfig;
    if (!config || !config.enabled) return null;

    const parts: string[] = [];

    // Value type
    if (config.valueType === "PERCENTAGE" && config.value) {
      parts.push(`${config.value}%`);
    } else if (config.valueType === "FIXED_AMOUNT" && config.value) {
      parts.push(`$${config.value}`);
    } else if (config.valueType === "FREE_SHIPPING") {
      parts.push("Free Shipping");
    }

    // Expiry
    if (config.expiryDays) {
      parts.push(`${config.expiryDays}d`);
    }

    // Delivery mode
    if (config.deliveryMode === "auto_apply_only") {
      parts.push("Auto-apply");
    } else if (config.deliveryMode === "show_code_fallback") {
      parts.push("Show + Auto-apply");
    } else if (config.deliveryMode === "show_code_always") {
      parts.push("Show code");
    }

    return parts.join(" • ");
  };

  // Helper to detect mismatch between label and percentage discount value
  const getLabelDiscountMismatchWarning = (segment: WheelSegment): string | null => {
    const config = segment.discountConfig;

    // Only validate when a percentage discount is enabled with a numeric value
    if (!config || !config.enabled || config.valueType !== "PERCENTAGE" || !config.value) {
      return null;
    }

    const label = segment.label || "";
    const match = label.match(/(\d+)\s*%/);
    if (!match) {
      return null; // No percentage mentioned in label, nothing to compare
    }

    const labelPercent = parseInt(match[1], 10);
    if (Number.isNaN(labelPercent)) {
      return null;
    }

    if (labelPercent !== config.value) {
      return `Label shows "${labelPercent}%" but discount is configured for ${config.value}%. This may confuse customers.`;
    }

    return null;
  };

  return (
    <BlockStack gap="300">
      {segments.map((segment, index) => {
        const isExpanded = expandedSegments[index] || false;
        const discountSummary = getDiscountSummary(segment);

        return (
          <Card key={segment.id}>
            <BlockStack gap="400">
              {/* Segment Header */}
              <InlineStack align="space-between" blockAlign="center">
                <BlockStack gap="100">
                  <InlineStack gap="200" blockAlign="center">
                    <Text as="h4" variant="headingSm">
                      Segment {index + 1}
                    </Text>
                    {discountSummary && <Badge tone="success">{discountSummary}</Badge>}
                  </InlineStack>
                  {segment.label && (
                    <Text as="p" tone="subdued" variant="bodySm">
                      {segment.label}
                    </Text>
                  )}
                </BlockStack>
                <InlineStack gap="200">
                  <Button variant="plain" onClick={() => toggleSegment(index)}>
                    {isExpanded ? "Collapse" : "Expand"}
                  </Button>
                  <Button variant="plain" tone="critical" onClick={() => removeSegment(index)}>
                    Remove
                  </Button>
                </InlineStack>
              </InlineStack>

              {/* Segment Basic Fields */}
              <Collapsible
                open={isExpanded}
                id={`segment-${index}-details`}
                transition={{ duration: "200ms", timingFunction: "ease-in-out" }}
              >
                <BlockStack gap="400">
                  <FormGrid columns={2}>
                    <TextField
                      label="Label"
                      name={`segment.${index}.label`}
                      value={segment.label}
                      required
                      placeholder="10% OFF"
                      helpText="Displayed on the wheel"
                      onChange={(value) => updateSegment(index, { label: value })}
                    />

                    <TextField
                      label="Probability"
                      name={`segment.${index}.probability`}
                      value={segment.probability.toString()}
                      required
                      placeholder="0.25"
                      helpText="0-1 (e.g., 0.25 = 25% chance)"
                      onChange={(value) =>
                        updateSegment(index, {
                          probability: parseFloat(value) || 0,
                        })
                      }
                    />
                  </FormGrid>

                  <ColorField
                    label="Slice Color"
                    name={`segment.${index}.color`}
                    value={segment.color || ""}
                    helpText="Leave empty to use accent color"
                    onChange={(value) => updateSegment(index, { color: value })}
                  />

                  {/* Label vs discount mismatch warning */}
                  {getLabelDiscountMismatchWarning(segment) && (
                    <Text as="p" tone="caution" variant="bodySm">
                      {getLabelDiscountMismatchWarning(segment)}
                    </Text>
                  )}

                  {/* Discount Configuration */}
                  <BlockStack gap="300">
                    <Text as="h5" variant="headingSm">
                      Discount Configuration
                    </Text>
                    <Text as="p" tone="subdued" variant="bodySm">
                      Configure the discount that will be generated when this segment wins
                    </Text>
                    <GenericDiscountComponent
                      goal="INCREASE_REVENUE"
                      discountConfig={segment.discountConfig as DiscountConfig | undefined}
                      onConfigChange={(config) => updateSegmentDiscount(index, config)}
                    />
                  </BlockStack>
                </BlockStack>
              </Collapsible>
            </BlockStack>
          </Card>
        );
      })}

      {/* Add Segment Button */}
      <InlineStack>
        <Button onClick={addSegment}>Add Segment</Button>
      </InlineStack>

      {/* Probability Warning */}
      {segments.length > 0 && (
        <Card>
          <BlockStack gap="200">
            <Text as="h5" variant="headingSm">
              Probability Check
            </Text>
            <Text as="p" tone="subdued" variant="bodySm">
              Total probability:{" "}
              {segments.reduce((sum, seg) => sum + seg.probability, 0).toFixed(2)} (should equal 1.0
              for best results)
            </Text>
          </BlockStack>
        </Card>
      )}
    </BlockStack>
  );
}
