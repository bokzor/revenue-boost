import React from "react";
import { Card, Text, Box, Button, BlockStack, InlineStack, Badge } from "@shopify/polaris";

interface TriggerModeSelectorProps {
  mode: "quick" | "advanced";
  onModeChange: (mode: "quick" | "advanced") => void;
  disabled?: boolean;
}

export const TriggerModeSelector: React.FC<TriggerModeSelectorProps> = ({
  mode,
  onModeChange,
  disabled = false,
}) => {
  return (
    <Card>
      <Box padding="600">
        <BlockStack gap="400">
          <BlockStack gap="200">
            <Text as="h3" variant="headingMd">
              Trigger Configuration Mode
            </Text>
            <Text as="span" variant="bodySm">
              Choose how you want to configure your popup triggers
            </Text>
          </BlockStack>

          <InlineStack gap="300">
            <Card background={mode === "quick" ? "bg-surface-selected" : "bg-surface"}>
              <Box padding="400">
                <BlockStack gap="300">
                  <InlineStack gap="200" blockAlign="center">
                    <Text as="span" variant="headingLg">
                      ⚡
                    </Text>
                    <BlockStack gap="100">
                      <InlineStack gap="200" blockAlign="center">
                        <Text as="span" variant="bodyMd" fontWeight="semibold">
                          Quick Setup
                        </Text>
                        <Badge tone="success">Recommended</Badge>
                      </InlineStack>
                      <Text as="span" variant="bodySm">
                        Choose from proven templates with smart defaults
                      </Text>
                    </BlockStack>
                  </InlineStack>
                  <Button
                    variant={mode === "quick" ? "primary" : "secondary"}
                    onClick={() => onModeChange("quick")}
                    disabled={disabled}
                    fullWidth
                  >
                    {mode === "quick" ? "Selected" : "Use Quick Setup"}
                  </Button>
                </BlockStack>
              </Box>
            </Card>

            <Card background={mode === "advanced" ? "bg-surface-selected" : "bg-surface"}>
              <Box padding="400">
                <BlockStack gap="300">
                  <InlineStack gap="200" blockAlign="center">
                    <Text as="span" variant="headingLg">
                      🔧
                    </Text>
                    <BlockStack gap="100">
                      <Text as="span" variant="bodyMd" fontWeight="semibold">
                        Advanced Mode
                      </Text>
                      <Text as="span" variant="bodySm">
                        Full control over all trigger settings
                      </Text>
                    </BlockStack>
                  </InlineStack>
                  <Button
                    variant={mode === "advanced" ? "primary" : "secondary"}
                    onClick={() => onModeChange("advanced")}
                    disabled={disabled}
                    fullWidth
                  >
                    {mode === "advanced" ? "Selected" : "Use Advanced Mode"}
                  </Button>
                </BlockStack>
              </Box>
            </Card>
          </InlineStack>

          {/* Mode Benefits */}
          <BlockStack gap="200">
            {mode === "quick" && (
              <Card background="bg-surface-info">
                <Box padding="400">
                  <BlockStack gap="200">
                    <Text as="span" variant="bodyMd" fontWeight="semibold">
                      Quick Setup Benefits:
                    </Text>
                    <Text as="span" variant="bodySm">
                      • Proven templates with high conversion rates
                      <br />
                      • Smart defaults based on best practices
                      <br />
                      • Setup in under 2 minutes
                      <br />• Can upgrade to Advanced Mode anytime
                    </Text>
                  </BlockStack>
                </Box>
              </Card>
            )}

            {mode === "advanced" && (
              <Card background="bg-surface-info">
                <Box padding="400">
                  <BlockStack gap="200">
                    <Text as="span" variant="bodyMd" fontWeight="semibold">
                      Advanced Mode Features:
                    </Text>
                    <Text as="span" variant="bodySm">
                      • Exit intent detection with sensitivity control
                      <br />
                      • Scroll depth tracking with direction options
                      <br />
                      • Idle timer with engagement requirements
                      <br />
                      • Geo and device targeting
                      <br />• Behavioral triggers and frequency capping
                    </Text>
                  </BlockStack>
                </Box>
              </Card>
            )}
          </BlockStack>
        </BlockStack>
      </Box>
    </Card>
  );
};
