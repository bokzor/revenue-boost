/**
 * ABTestingPanel - A/B Testing Control Panel Component
 *
 * Enhanced with better visibility, educational content, and guidance.
 * Features a collapsible "Learn More" section explaining A/B testing concepts.
 *
 * Note: Variant selection is handled in ExperimentConfigForm to consolidate controls.
 */

import { useState } from "react";
import {
  Card,
  InlineStack,
  BlockStack,
  Badge,
  Checkbox,
  Banner,
  Text,
  Link,
  Icon,
  Button,
  Collapsible,
  Box,
  Divider,
  List,
} from "@shopify/polaris";
import { ChartVerticalIcon, ChevronDownIcon, ChevronUpIcon, LightbulbIcon } from "@shopify/polaris-icons";

export type VariantKey = "A" | "B" | "C" | "D";

interface ABTestingPanelProps {
  abTestingEnabled: boolean;
  onToggle: (enabled: boolean) => void;
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
  experimentId,
  experimentName,
  currentVariantKey,
  disabled = false,
  experimentsEnabled = false,
}: ABTestingPanelProps) {
  const [isLearnMoreOpen, setIsLearnMoreOpen] = useState(false);

  // Determine if the toggle should be disabled
  const isToggleDisabled = disabled || !!experimentId || !experimentsEnabled;

  return (
    <Card>
      <Box
        padding="400"
        borderColor="border-success"
        borderWidth="025"
        borderRadius="200"
        background={abTestingEnabled ? "bg-surface-success" : undefined}
      >
        <BlockStack gap="400">
          {/* Header with icon and title */}
          <InlineStack gap="300" blockAlign="center" align="space-between">
            <InlineStack gap="300" blockAlign="center">
              <Box
                background={abTestingEnabled ? "bg-fill-success" : "bg-fill-info"}
                padding="200"
                borderRadius="200"
              >
                <Icon source={ChartVerticalIcon} tone={abTestingEnabled ? "success" : "info"} />
              </Box>
              <BlockStack gap="100">
                <InlineStack gap="200" blockAlign="center">
                  <Text as="h2" variant="headingMd" fontWeight="bold">
                    A/B Testing
                  </Text>
                  <Badge tone={abTestingEnabled ? "success" : "info"}>
                    {abTestingEnabled ? "Enabled" : "Optional"}
                  </Badge>
                </InlineStack>
                <Text as="p" variant="bodySm" tone="subdued">
                  Optimize your campaigns with data-driven experiments
                </Text>
              </BlockStack>
            </InlineStack>

            <Button
              variant="plain"
              onClick={() => setIsLearnMoreOpen(!isLearnMoreOpen)}
              icon={isLearnMoreOpen ? ChevronUpIcon : ChevronDownIcon}
              accessibilityLabel={isLearnMoreOpen ? "Hide A/B testing guide" : "Show A/B testing guide"}
            >
              {isLearnMoreOpen ? "Hide guide" : "Learn more"}
            </Button>
          </InlineStack>

          {/* Collapsible Learn More Section */}
          <Collapsible
            open={isLearnMoreOpen}
            id="ab-testing-learn-more"
            transition={{ duration: "200ms", timingFunction: "ease-in-out" }}
          >
            <Box paddingBlockStart="300" paddingBlockEnd="300">
              <BlockStack gap="400">
                <Banner tone="info" icon={LightbulbIcon}>
                  <BlockStack gap="300">
                    <Text as="h3" variant="headingSm" fontWeight="semibold">
                      What is A/B Testing?
                    </Text>
                    <Text as="p" variant="bodySm">
                      A/B testing (also called split testing) lets you compare two or more versions of your
                      campaign to see which performs better. Your traffic is automatically split between
                      variants, and we track conversions to determine the winner.
                    </Text>

                    <Text as="h4" variant="headingSm" fontWeight="semibold">
                      How it works:
                    </Text>
                    <List type="number">
                      <List.Item>
                        <Text as="span" variant="bodySm">
                          <strong>Create variants</strong> — Design 2-4 different versions of your popup
                        </Text>
                      </List.Item>
                      <List.Item>
                        <Text as="span" variant="bodySm">
                          <strong>Traffic splits automatically</strong> — Visitors are randomly shown one variant
                        </Text>
                      </List.Item>
                      <List.Item>
                        <Text as="span" variant="bodySm">
                          <strong>Analyze results</strong> — Compare conversion rates to find the winner
                        </Text>
                      </List.Item>
                    </List>

                    <Text as="h4" variant="headingSm" fontWeight="semibold">
                      Tips for successful tests:
                    </Text>
                    <List type="bullet">
                      <List.Item>
                        <Text as="span" variant="bodySm">
                          Test one element at a time (headline, CTA, image, or offer)
                        </Text>
                      </List.Item>
                      <List.Item>
                        <Text as="span" variant="bodySm">
                          Run tests for at least 1-2 weeks to gather enough data
                        </Text>
                      </List.Item>
                      <List.Item>
                        <Text as="span" variant="bodySm">
                          Aim for at least 100 conversions per variant for statistical significance
                        </Text>
                      </List.Item>
                      <List.Item>
                        <Text as="span" variant="bodySm">
                          Document your hypothesis to learn from each experiment
                        </Text>
                      </List.Item>
                    </List>
                  </BlockStack>
                </Banner>
              </BlockStack>
            </Box>
          </Collapsible>

          <Divider />

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

          {/* Existing experiment banner */}
          {experimentId && experimentName && (
            <Banner tone="info">
              <BlockStack gap="200">
                <Text as="p" variant="bodyMd" fontWeight="semibold">
                  Editing Experiment: {experimentName}
                </Text>
                <Text as="p" variant="bodySm">
                  You are editing variant <strong>{currentVariantKey}</strong> of this A/B test.
                  Configure variants in the section below.
                </Text>
              </BlockStack>
            </Banner>
          )}

          {/* Toggle */}
          <InlineStack gap="400" blockAlign="center">
            <Checkbox
              label={
                <Text as="span" variant="bodyMd" fontWeight="medium">
                  Enable A/B Testing for this campaign
                </Text>
              }
              checked={abTestingEnabled}
              onChange={onToggle}
              disabled={isToggleDisabled}
              helpText={
                experimentsEnabled
                  ? "Create multiple variants and test which performs best"
                  : undefined
              }
            />
            {!experimentsEnabled && !experimentId && (
              <Badge tone="attention">Upgrade Required</Badge>
            )}
          </InlineStack>
        </BlockStack>
      </Box>
    </Card>
  );
}
