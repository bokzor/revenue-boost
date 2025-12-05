/**
 * ModeSelector Component
 *
 * Entry point for unified campaign creation.
 * Allows users to choose between Single Campaign or A/B Experiment.
 */

import { Card, Text, BlockStack, InlineStack, Icon, Box, Button } from "@shopify/polaris";
import { TargetIcon, ChartVerticalFilledIcon } from "@shopify/polaris-icons";

export type CreationMode = "single" | "experiment";

interface ModeSelectorProps {
  onModeSelect: (mode: CreationMode) => void;
  experimentsEnabled?: boolean;
}

export function ModeSelector({ onModeSelect, experimentsEnabled = true }: ModeSelectorProps) {
  return (
    <div style={{ maxWidth: "900px", margin: "0 auto", padding: "40px 20px" }}>
      <BlockStack gap="800">
        {/* Header */}
        <BlockStack gap="200" align="center">
          <Text as="h1" variant="headingXl" alignment="center">
            Create a New Campaign
          </Text>
          <Text as="p" tone="subdued" alignment="center">
            Choose how you want to create your popup campaign
          </Text>
        </BlockStack>

        {/* Mode Cards */}
        <InlineStack gap="600" align="center" wrap={false}>
          {/* Single Campaign Card */}
          <div style={{ flex: 1, maxWidth: "400px" }}>
            <ModeCard
              icon={TargetIcon}
              title="Single Campaign"
              description="Create a single popup campaign with full customization options"
              features={[
                "Choose from proven recipes",
                "Customize design & content",
                "Set targeting rules",
                "Schedule & publish",
              ]}
              buttonText="Create Campaign"
              onClick={() => onModeSelect("single")}
              recommended
            />
          </div>

          {/* A/B Experiment Card */}
          <div style={{ flex: 1, maxWidth: "400px" }}>
            <ModeCard
              icon={ChartVerticalFilledIcon}
              title="A/B Experiment"
              description="Test multiple variants to find what converts best"
              features={[
                "Create 2-4 variants",
                "Split traffic automatically",
                "Track conversion metrics",
                "Get statistical insights",
              ]}
              buttonText="Create Experiment"
              onClick={() => onModeSelect("experiment")}
              disabled={!experimentsEnabled}
              disabledReason="Upgrade to Growth plan to unlock A/B testing"
            />
          </div>
        </InlineStack>
      </BlockStack>
    </div>
  );
}

interface ModeCardProps {
  icon: typeof TargetIcon;
  title: string;
  description: string;
  features: string[];
  buttonText: string;
  onClick: () => void;
  recommended?: boolean;
  disabled?: boolean;
  disabledReason?: string;
}

function ModeCard({
  icon,
  title,
  description,
  features,
  buttonText,
  onClick,
  recommended,
  disabled,
  disabledReason,
}: ModeCardProps) {
  return (
    <Card>
      <Box padding="600">
        <BlockStack gap="500">
          {/* Header with icon and badge */}
          <InlineStack align="space-between" blockAlign="start">
            <Box
              background="bg-surface-secondary"
              borderRadius="300"
              padding="300"
            >
              <Icon source={icon} tone="base" />
            </Box>
            {recommended && (
              <Box
                background="bg-fill-success"
                borderRadius="200"
                paddingInline="200"
                paddingBlock="100"
              >
                <Text as="span" variant="bodySm" fontWeight="medium" tone="text-inverse">
                  Recommended
                </Text>
              </Box>
            )}
          </InlineStack>

          {/* Title and description */}
          <BlockStack gap="200">
            <Text as="h2" variant="headingLg">
              {title}
            </Text>
            <Text as="p" tone="subdued">
              {description}
            </Text>
          </BlockStack>

          {/* Features list */}
          <BlockStack gap="200">
            {features.map((feature, index) => (
              <InlineStack key={index} gap="200" blockAlign="center">
                <Box
                  background="bg-fill-success"
                  borderRadius="full"
                  minWidth="16px"
                  minHeight="16px"
                >
                  <div style={{ width: 16, height: 16, display: "flex", alignItems: "center", justifyContent: "center" }}>
                    <svg width="10" height="8" viewBox="0 0 10 8" fill="none">
                      <path d="M1 4L3.5 6.5L9 1" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                    </svg>
                  </div>
                </Box>
                <Text as="span" variant="bodySm">
                  {feature}
                </Text>
              </InlineStack>
            ))}
          </BlockStack>

          {/* Action button */}
          <Button
            variant={recommended ? "primary" : "secondary"}
            size="large"
            fullWidth
            onClick={onClick}
            disabled={disabled}
          >
            {buttonText}
          </Button>

          {disabled && disabledReason && (
            <Text as="p" variant="bodySm" tone="subdued" alignment="center">
              {disabledReason}
            </Text>
          )}
        </BlockStack>
      </Box>
    </Card>
  );
}

