/**
 * Spin-to-Win Content Configuration Section
 *
 * Form section for configuring spin-to-win gamification content
 */

import React, { useState } from "react";
import { Card, BlockStack, Text, Divider, Button, InlineStack } from "@shopify/polaris";
import { TextField, CheckboxField, FormGrid, ColorField } from "../form";
import type { SpinToWinContentSchema } from "../../types/campaign";
import { z } from "zod";
import { useFieldUpdater } from "~/shared/hooks/useFieldUpdater";

export type SpinToWinContent = z.infer<typeof SpinToWinContentSchema>;
type WheelSegment = SpinToWinContent["wheelSegments"][0];

/**
 * Default wheel segments - designed to be profitable
 *
 * Probability breakdown:
 * - 5% OFF: 35% chance (most common, low cost)
 * - 10% OFF: 25% chance (moderate discount)
 * - 15% OFF: 15% chance (good discount)
 * - 20% OFF: 10% chance (great discount)
 * - Free Shipping: 10% chance (alternative to discount)
 * - Try Again: 5% chance (no prize, encourages re-engagement)
 *
 * Expected discount per spin: ~9.75%
 * This is profitable as it's less than typical cart abandonment loss (15-20%)
 */
const DEFAULT_WHEEL_SEGMENTS: WheelSegment[] = [
  {
    id: "segment-5-off",
    label: "5% OFF",
    probability: 0.35,
    color: "#10B981", // Green
    discountType: "percentage",
    discountValue: 5,
    discountCode: "SPIN5",
  },
  {
    id: "segment-10-off",
    label: "10% OFF",
    probability: 0.25,
    color: "#3B82F6", // Blue
    discountType: "percentage",
    discountValue: 10,
    discountCode: "SPIN10",
  },
  {
    id: "segment-15-off",
    label: "15% OFF",
    probability: 0.15,
    color: "#F59E0B", // Orange
    discountType: "percentage",
    discountValue: 15,
    discountCode: "SPIN15",
  },
  {
    id: "segment-20-off",
    label: "20% OFF",
    probability: 0.10,
    color: "#EF4444", // Red
    discountType: "percentage",
    discountValue: 20,
    discountCode: "SPIN20",
  },
  {
    id: "segment-free-shipping",
    label: "FREE SHIPPING",
    probability: 0.10,
    color: "#8B5CF6", // Purple
    discountType: "free_shipping",
    discountCode: "FREESHIP",
  },
  {
    id: "segment-try-again",
    label: "Try Again",
    probability: 0.05,
    color: "#6B7280", // Gray
    // No discount for this segment
  },
];

export interface SpinToWinContentSectionProps {
  content: Partial<SpinToWinContent>;
  errors?: Record<string, string>;
  onChange: (content: Partial<SpinToWinContent>) => void;
}

export function SpinToWinContentSection({
  content,
  errors,
  onChange,
}: SpinToWinContentSectionProps) {
  // Initialize with defaults if no segments provided
  const initialSegments = content.wheelSegments && content.wheelSegments.length > 0
    ? content.wheelSegments
    : DEFAULT_WHEEL_SEGMENTS;

  const [segments, setSegments] = useState<WheelSegment[]>(initialSegments);

  const updateField = useFieldUpdater(content, onChange);

  // Initialize content with default segments on mount if empty
  React.useEffect(() => {
    if (!content.wheelSegments || content.wheelSegments.length === 0) {
      updateField("wheelSegments", DEFAULT_WHEEL_SEGMENTS);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []); // Only run on mount - intentionally ignoring dependencies

  // Sync local state when wheelSegments prop changes (e.g., from theme changes)
  React.useEffect(() => {
    if (content.wheelSegments && content.wheelSegments.length > 0) {
      setSegments(content.wheelSegments);
    }
  }, [content.wheelSegments]);

  const addSegment = () => {
    const newSegment: WheelSegment = {
      id: `segment-${Date.now()}`,
      label: "",
      probability: 0.1,
      color: "#3b82f6",
      discountType: "percentage",
      discountValue: 10,
      discountCode: "",
    };
    const updated = [...segments, newSegment];
    setSegments(updated);
    updateField("wheelSegments", updated);
  };

  const updateSegment = (index: number, updates: Partial<WheelSegment>) => {
    const updated = segments.map((seg, idx) =>
      idx === index ? { ...seg, ...updates } : seg
    );
    setSegments(updated);
    updateField("wheelSegments", updated);
  };

  const removeSegment = (index: number) => {
    const updated = segments.filter((_, idx) => idx !== index);
    setSegments(updated);
    updateField("wheelSegments", updated);
  };

  return (
    <>
      <Card data-test-id="spin-to-win-admin-form">
        <BlockStack gap="400">
          <BlockStack gap="200">
            <Text as="h3" variant="headingMd">
              🎡 Content & capture
            </Text>
            <Text as="p" tone="subdued">
              Configure the copy and email capture behaviour for your wheel.
            </Text>
          </BlockStack>

          <Divider />

          <BlockStack gap="400">
            <TextField
              label="Headline"
              name="content.headline"
              value={content.headline || ""}
              error={errors?.headline}
              required
              placeholder="Spin to Win a Discount!"
              onChange={(value) => updateField("headline", value)}
            />

            <TextField
              label="Subheadline"
              name="content.subheadline"
              value={content.subheadline || ""}
              placeholder="Try your luck and save on your order"
              onChange={(value) => updateField("subheadline", value)}
            />

            <FormGrid columns={2}>
              <TextField
                label="Spin Button Text"
                name="content.spinButtonText"
                value={content.spinButtonText || "Spin to Win!"}
                error={errors?.spinButtonText}
                placeholder="Spin to Win!"
                onChange={(value) => updateField("spinButtonText", value)}
              />

              <TextField
                label="Email Placeholder"
                name="content.emailPlaceholder"
                value={content.emailPlaceholder || "Enter your email to spin"}
                placeholder="Enter your email to spin"
                onChange={(value) => updateField("emailPlaceholder", value)}
              />
            </FormGrid>

            <TextField
              label="Dismiss Button Text"
              name="content.dismissLabel"
              value={content.dismissLabel || ""}
              error={errors?.dismissLabel}
              placeholder="No thanks"
              helpText="Secondary button text that closes the popup"
              onChange={(value) => updateField("dismissLabel", value)}
            />

            <FormGrid columns={1}>
              <TextField
                label="Failure Message"
                name="content.failureMessage"
                value={content.failureMessage || ""}
                placeholder="Thanks for playing!"
                helpText="Message when no prize is won (optional)"
                onChange={(value) => updateField("failureMessage", value)}
              />
            </FormGrid>

            <FormGrid columns={1}>
              <TextField
                label="Loading Text"
                name="content.loadingText"
                value={content.loadingText || ""}
                placeholder="Spinning..."
                helpText="Text shown while spinning (optional)"
                onChange={(value) => updateField("loadingText", value)}
              />
            </FormGrid>

            <FormGrid columns={2}>
              <CheckboxField
                label="Require Email"
                name="content.emailRequired"
                checked={content.emailRequired !== false}
                helpText="Require email before allowing spin"
                onChange={(checked) => updateField("emailRequired", checked)}
              />

              <CheckboxField
                label="Collect Name"
                name="content.collectName"
                checked={content.collectName || false}
                helpText="Add an optional name field before the spin"
                onChange={(checked) => updateField("collectName", checked)}
              />
            </FormGrid>

            <CheckboxField
              label="Show GDPR Checkbox"
              name="content.showGdprCheckbox"
              checked={content.showGdprCheckbox || false}
              helpText="Add a consent checkbox (e.g., for GDPR compliance)"
              onChange={(checked) => updateField("showGdprCheckbox", checked)}
            />

            {content.showGdprCheckbox && (
              <TextField
                label="GDPR Consent Text"
                name="content.gdprLabel"
                value={content.gdprLabel || ""}
                placeholder="I agree to receive marketing emails and accept the privacy policy"
                multiline
                rows={2}
                onChange={(value) => updateField("gdprLabel", value)}
              />
            )}
          </BlockStack>
        </BlockStack>
      </Card>

      <Card>
        <BlockStack gap="400">
          <BlockStack gap="200">
            <Text as="h3" variant="headingMd">
              🎯 Wheel configuration
            </Text>
            <Text as="p" tone="subdued">
              Control wheel visuals and spin behaviour.
            </Text>
          </BlockStack>

          <Divider />

          <BlockStack gap="400">
            <FormGrid columns={3}>
              <TextField
                label="Wheel Size (px)"
                name="content.wheelSize"
                value={content.wheelSize?.toString() || "400"}
                placeholder="400"
                helpText="Diameter of the wheel in pixels"
                onChange={(value) => updateField("wheelSize", parseInt(value) || 400)}
              />

              <TextField
                label="Wheel Border Width (px)"
                name="content.wheelBorderWidth"
                value={content.wheelBorderWidth?.toString() || "2"}
                placeholder="2"
                helpText="Border thickness around wheel"
                onChange={(value) => updateField("wheelBorderWidth", parseInt(value) || 2)}
              />

              <TextField
                label="Wheel Border Color"
                name="content.wheelBorderColor"
                value={content.wheelBorderColor || ""}
                placeholder="#FFFFFF"
                helpText="Hex color code for border"
                onChange={(value) => updateField("wheelBorderColor", value)}
              />
            </FormGrid>

            <FormGrid columns={2}>
              <TextField
                label="Spin Duration (ms)"
                name="content.spinDuration"
                value={content.spinDuration?.toString() || "4000"}
                placeholder="4000"
                helpText="How long the spin animation lasts (milliseconds)"
                onChange={(value) => updateField("spinDuration", parseInt(value) || 4000)}
              />

              <TextField
                label="Minimum Spins"
                name="content.minSpins"
                value={content.minSpins?.toString() || "5"}
                placeholder="5"
                helpText="Minimum number of full rotations"
                onChange={(value) => updateField("minSpins", parseInt(value) || 5)}
              />
            </FormGrid>
          </BlockStack>
        </BlockStack>
      </Card>

      <Card>
        <BlockStack gap="400">
          <BlockStack gap="200">
            <Text as="h3" variant="headingMd">
              🧩 Wheel segments
            </Text>
            <Text as="p" tone="subdued">
              Configure prizes, probabilities and slice colors (minimum 2 segments).
            </Text>
          </BlockStack>

          <Divider />

          <BlockStack gap="300">
            {segments.map((segment, index) => (
              <div
                key={segment.id}
                style={{
                  border: "1px solid #e5e7eb",
                  borderRadius: 8,
                  padding: "12px 12px 16px",
                }}
              >
                <BlockStack gap="200">
                  <InlineStack align="space-between" blockAlign="center">
                    <Text as="h4" variant="headingSm">
                      Segment {index + 1}
                    </Text>
                    <Button
                      variant="plain"
                      tone="critical"
                      onClick={() => removeSegment(index)}
                    >
                      Remove
                    </Button>
                  </InlineStack>

                  <FormGrid columns={2}>
                    <TextField
                      label="Label"
                      name={`segment.${index}.label`}
                      value={segment.label}
                      required
                      placeholder="10% OFF"
                      onChange={(value) => updateSegment(index, { label: value })}
                    />

                    <TextField
                      label="Probability"
                      name={`segment.${index}.probability`}
                      value={segment.probability.toString()}
                      required
                      placeholder="0.25"
                      helpText="Value between 0 and 1 (e.g., 0.25 = 25%)"
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
                    helpText="Leave empty to fall back to the popup accent color"
                    onChange={(value) => updateSegment(index, { color: value })}
                  />
                </BlockStack>
              </div>
            ))}

            <InlineStack>
              <Button onClick={addSegment}>Add segment</Button>
            </InlineStack>
          </BlockStack>
        </BlockStack>
      </Card>
    </>
  );
}

