/**
 * Scratch Card Content Configuration Section
 *
 * Self-contained, well-structured admin form for Scratch Card campaigns
 * (mirrors the structure quality of NewsletterContentSection)
 */

import { useState, useEffect } from "react";
import {
  Card,
  BlockStack,
  Text,
  Divider,
  Button,
  InlineStack,
  Select,
  Collapsible,
  Badge,
} from "@shopify/polaris";
import { TextField, FormGrid } from "../form";
import { GenericDiscountComponent } from "../form/GenericDiscountComponent";
import type { ScratchCardContentSchema, DiscountConfig } from "../../types/campaign";
import { z } from "zod";
import { useFieldUpdater } from "~/shared/hooks/useFieldUpdater";

export type ScratchCardContent = z.infer<typeof ScratchCardContentSchema>;

type Prize = ScratchCardContent["prizes"][number];

export interface ScratchCardContentSectionProps {
  content: Partial<ScratchCardContent>;
  errors?: Record<string, string>;
  onChange: (content: Partial<ScratchCardContent>) => void;
}

export function ScratchCardContentSection({
  content,
  errors,
  onChange,
}: ScratchCardContentSectionProps) {
  const updateField = useFieldUpdater(content, onChange);
  const emailRequired = content.emailRequired !== false;
  const emailBeforeScratching = content.emailBeforeScratching || false;
  const emailCollectionMode: "none" | "before" | "after" = !emailRequired
    ? "none"
    : emailBeforeScratching
      ? "before"
      : "after";

  // Initialize default prizes if empty
  const initialPrizes =
    content.prizes && content.prizes.length > 0
      ? content.prizes
      : [
          {
            id: "prize-5-off",
            label: "5% OFF",
            probability: 0.4,
            discountConfig: {
              enabled: true,
              showInPreview: true,
              valueType: "PERCENTAGE",
              value: 5,
              behavior: "SHOW_CODE_AND_AUTO_APPLY",
              expiryDays: 30,
              type: "single_use",
            } as DiscountConfig,
          },
          {
            id: "prize-10-off",
            label: "10% OFF",
            probability: 0.3,
            discountConfig: {
              enabled: true,
              showInPreview: true,
              valueType: "PERCENTAGE",
              value: 10,
              behavior: "SHOW_CODE_AND_AUTO_APPLY",
              expiryDays: 30,
              type: "single_use",
            } as DiscountConfig,
          },
          {
            id: "prize-15-off",
            label: "15% OFF",
            probability: 0.2,
            discountConfig: {
              enabled: true,
              showInPreview: true,
              valueType: "PERCENTAGE",
              value: 15,
              behavior: "SHOW_CODE_AND_AUTO_APPLY",
              expiryDays: 30,
              type: "single_use",
            } as DiscountConfig,
          },
          {
            id: "prize-20-off",
            label: "20% OFF",
            probability: 0.1,
            discountConfig: {
              enabled: true,
              showInPreview: true,
              valueType: "PERCENTAGE",
              value: 20,
              behavior: "SHOW_CODE_AND_AUTO_APPLY",
              expiryDays: 30,
              type: "single_use",
            } as DiscountConfig,
          },
        ];
  const [prizes, setPrizes] = useState<Prize[]>(initialPrizes);

  useEffect(() => {
    if (!content.prizes || content.prizes.length === 0) {
      updateField("prizes", initialPrizes);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const addPrize = () => {
    const p: Prize = {
      id: `prize-${Date.now()}`,
      label: "",
      probability: 0.1,
      discountConfig: {
        enabled: true,
        showInPreview: true,
        valueType: "PERCENTAGE",
        value: 10,
        behavior: "SHOW_CODE_AND_AUTO_APPLY",
        expiryDays: 30,
        type: "single_use",
      } as DiscountConfig,
    };
    const updated = [...prizes, p];
    setPrizes(updated);
    updateField("prizes", updated);
  };
  const updatePrize = (index: number, updates: Partial<Prize>) => {
    const updated = prizes.map((p, i) => (i === index ? { ...p, ...updates } : p));
    setPrizes(updated);
    updateField("prizes", updated);
  };
  const removePrize = (index: number) => {
    const updated = prizes.filter((_, i) => i !== index);
    setPrizes(updated);
    updateField("prizes", updated);
  };

  // State for collapsible prizes
  const [expandedPrizes, setExpandedPrizes] = useState<Record<number, boolean>>({});

  const togglePrize = (index: number) => {
    setExpandedPrizes((prev) => ({
      ...prev,
      [index]: !prev[index],
    }));
  };

  // Helper to generate discount summary badge (inspired by WheelSegmentEditor)
  const getDiscountSummary = (prize: Prize): string | null => {
    const config = prize.discountConfig;
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

    // Behavior
    if (config.behavior === "SHOW_CODE_AND_AUTO_APPLY") {
      parts.push("Show + Auto-apply");
    } else if (config.behavior === "SHOW_CODE_ONLY") {
      parts.push("Show code");
    } else if (config.behavior === "SHOW_CODE_AND_ASSIGN_TO_EMAIL") {
      parts.push("Assign to email");
    }

    return parts.join(" • ");
  };

  // Helper to detect mismatch between label and percentage discount value
  const getLabelDiscountMismatchWarning = (prize: Prize): string | null => {
    const config = prize.discountConfig;

    // Only validate when a percentage discount is enabled with a numeric value
    if (!config || !config.enabled || config.valueType !== "PERCENTAGE" || !config.value) {
      return null;
    }

    const label = prize.label || "";
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
    <>
      {/* CONTENT BASICS */}
      <Card data-test-id="scratch-card-content-form">
        <BlockStack gap="400">
          <BlockStack gap="200">
            <Text as="h3" variant="headingMd">
              🧩 Content & capture
            </Text>
            <Text as="p" tone="subdued">
              Text, email capture and result messaging for your scratch card popup.
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
              placeholder="Scratch to reveal your prize!"
              onChange={(v) => updateField("headline", v)}
            />
            <TextField
              label="Subheadline"
              name="content.subheadline"
              value={content.subheadline || ""}
              placeholder="Play and save on your order"
              onChange={(v) => updateField("subheadline", v)}
            />

            <FormGrid columns={2}>
              <TextField
                label="Button Text"
                name="content.buttonText"
                value={content.buttonText || "Reveal"}
                required
                placeholder="Reveal"
                onChange={(v) => updateField("buttonText", v)}
              />
              <TextField
                label="Email Label"
                name="content.emailLabel"
                value={content.emailLabel || ""}
                placeholder="Email"
                onChange={(v) => updateField("emailLabel", v)}
              />
            </FormGrid>

            <TextField
              label="Dismiss Button Text"
              name="content.dismissLabel"
              value={content.dismissLabel || ""}
              error={errors?.dismissLabel}
              placeholder="No thanks"
              helpText="Secondary button text that closes the popup"
              onChange={(v) => updateField("dismissLabel", v)}
            />

            <FormGrid columns={2}>
              <TextField
                label="Email Placeholder"
                name="content.emailPlaceholder"
                value={content.emailPlaceholder || "Enter your email"}
                placeholder="Enter your email"
                onChange={(v) => updateField("emailPlaceholder", v)}
              />
              <Select
                label="Email collection"
                value={emailCollectionMode}
                options={[
                  { label: "Don't collect email", value: "none" },
                  { label: "Collect email after scratch", value: "after" },
                  { label: "Collect email before scratch", value: "before" },
                ]}
                helpText="When to ask for email in the scratch card flow"
                onChange={(mode) => {
                  if (mode === "none") {
                    updateField("emailRequired", false);
                    updateField("emailBeforeScratching", false);
                  } else if (mode === "after") {
                    updateField("emailRequired", true);
                    updateField("emailBeforeScratching", false);
                  } else if (mode === "before") {
                    updateField("emailRequired", true);
                    updateField("emailBeforeScratching", true);
                  }
                }}
              />
            </FormGrid>

            <FormGrid columns={1}>
              <TextField
                label="Failure Message"
                name="content.failureMessage"
                value={content.failureMessage || ""}
                placeholder="Better luck next time!"
                helpText="Shown when a user wins a non-discount prize"
                onChange={(v) => updateField("failureMessage", v)}
              />
            </FormGrid>
          </BlockStack>
        </BlockStack>
      </Card>

      {/* SCRATCH SETTINGS */}
      <Card>
        <BlockStack gap="400">
          <BlockStack gap="200">
            <Text as="h3" variant="headingMd">
              🎨 Scratch settings
            </Text>
            <Text as="p" tone="subdued">
              Control the scratch interaction and reveal threshold.
            </Text>
          </BlockStack>

          <Divider />

          <BlockStack gap="400">
            <TextField
              label="Scratch Instruction"
              name="content.scratchInstruction"
              value={content.scratchInstruction || "Scratch to reveal your prize!"}
              onChange={(v) => updateField("scratchInstruction", v)}
            />

            <FormGrid columns={2}>
              <TextField
                label="Scratch Threshold (%)"
                name="content.scratchThreshold"
                value={(content.scratchThreshold ?? 50).toString()}
                placeholder="50"
                helpText="How much must be scratched to reveal (0-100)"
                onChange={(v) =>
                  updateField("scratchThreshold", Math.max(0, Math.min(100, parseInt(v) || 0)))
                }
              />
              <TextField
                label="Brush Radius (px)"
                name="content.scratchRadius"
                value={(content.scratchRadius ?? 20).toString()}
                placeholder="20"
                helpText="Scratch brush radius in pixels"
                onChange={(v) =>
                  updateField("scratchRadius", Math.max(5, Math.min(100, parseInt(v) || 20)))
                }
              />
            </FormGrid>
          </BlockStack>
        </BlockStack>
      </Card>

      {/* PRIZES */}
      <Card>
        <BlockStack gap="400">
          <BlockStack gap="200">
            <Text as="h3" variant="headingMd">
              🎁 Prizes & probabilities
            </Text>
            <Text as="p" tone="subdued">
              Configure prize labels, chances and discount details.
            </Text>
          </BlockStack>

          <Divider />

          <BlockStack gap="300">
            {prizes.map((p, i) => {
              const isExpanded = expandedPrizes[i] || false;
              const discountSummary = getDiscountSummary(p);
              const mismatchWarning = getLabelDiscountMismatchWarning(p);

              return (
                <Card key={p.id}>
                  <BlockStack gap="400">
                    {/* Prize Header */}
                    <InlineStack align="space-between" blockAlign="center">
                      <BlockStack gap="100">
                        <InlineStack gap="200" blockAlign="center">
                          <Text as="h4" variant="headingSm">
                            Prize {i + 1}
                          </Text>
                          {discountSummary && <Badge tone="success">{discountSummary}</Badge>}
                        </InlineStack>
                        {p.label && (
                          <Text as="p" tone="subdued" variant="bodySm">
                            {p.label}
                          </Text>
                        )}
                      </BlockStack>
                      <InlineStack gap="200">
                        <Button variant="plain" onClick={() => togglePrize(i)}>
                          {isExpanded ? "Collapse" : "Expand"}
                        </Button>
                        <Button variant="plain" tone="critical" onClick={() => removePrize(i)}>
                          Remove
                        </Button>
                      </InlineStack>
                    </InlineStack>

                    {/* Prize Details - Collapsible */}
                    <Collapsible
                      open={isExpanded}
                      id={`prize-${i}-details`}
                      transition={{ duration: "200ms", timingFunction: "ease-in-out" }}
                    >
                      <BlockStack gap="400">
                        <FormGrid columns={2}>
                          <TextField
                            label="Label"
                            name={`prizes.${i}.label`}
                            value={p.label}
                            required
                            placeholder="10% OFF"
                            helpText="Displayed on the scratch card"
                            onChange={(v) => updatePrize(i, { label: v })}
                          />
                          <TextField
                            label="Probability"
                            name={`prizes.${i}.probability`}
                            value={p.probability.toString()}
                            required
                            placeholder="0.25"
                            helpText="0-1 (e.g., 0.25 = 25% chance)"
                            onChange={(v) =>
                              updatePrize(i, {
                                probability: parseFloat(v) || 0,
                              })
                            }
                          />
                        </FormGrid>

                        {/* Label vs discount mismatch warning */}
                        {mismatchWarning && (
                          <Text as="p" tone="caution" variant="bodySm">
                            {mismatchWarning}
                          </Text>
                        )}

                        {/* Discount Configuration */}
                        <BlockStack gap="300">
                          <Text as="h5" variant="headingSm">
                            Discount Configuration
                          </Text>
                          <Text as="p" tone="subdued" variant="bodySm">
                            Configure the discount that will be generated when this prize wins
                          </Text>
                          <GenericDiscountComponent
                            goal="INCREASE_REVENUE"
                            discountConfig={p.discountConfig as DiscountConfig | undefined}
                            onConfigChange={(config) => updatePrize(i, { discountConfig: config })}
                          />
                        </BlockStack>
                      </BlockStack>
                    </Collapsible>
                  </BlockStack>
                </Card>
              );
            })}

            <InlineStack>
              <Button onClick={addPrize}>Add prize</Button>
            </InlineStack>
          </BlockStack>
        </BlockStack>
      </Card>
    </>
  );
}
