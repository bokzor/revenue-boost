/**
 * ModeSelector Component
 *
 * Entry point for unified campaign creation.
 * Allows users to choose between Single Campaign or A/B Experiment.
 * Features a modern, engaging design with interactive cards.
 */

import { useState } from "react";
import { Text, BlockStack, InlineStack, Icon, Box, Button, Badge } from "@shopify/polaris";
import { TargetIcon, ChartVerticalFilledIcon, LockIcon, StarFilledIcon } from "@shopify/polaris-icons";

export type CreationMode = "single" | "experiment";

interface ModeSelectorProps {
  onModeSelect: (mode: CreationMode) => void;
  experimentsEnabled?: boolean;
}

export function ModeSelector({ onModeSelect, experimentsEnabled = true }: ModeSelectorProps) {
  return (
    <div style={{
      minHeight: "calc(100vh - 120px)",
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      background: "linear-gradient(180deg, var(--p-color-bg-surface-secondary) 0%, var(--p-color-bg) 100%)",
      padding: "40px 20px",
    }}>
      <div style={{ maxWidth: "880px", width: "100%" }}>
        <BlockStack gap="800">
          {/* Header Section */}
          <BlockStack gap="400" inlineAlign="center">
            {/* Decorative Icon */}
            <div style={{
              width: 64,
              height: 64,
              borderRadius: 16,
              background: "linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              boxShadow: "0 8px 24px rgba(99, 102, 241, 0.25)",
            }}>
              <svg width="32" height="32" viewBox="0 0 24 24" fill="none">
                <path d="M12 2L15.09 8.26L22 9.27L17 14.14L18.18 21.02L12 17.77L5.82 21.02L7 14.14L2 9.27L8.91 8.26L12 2Z" fill="white"/>
              </svg>
            </div>

            <Text as="h1" variant="headingXl" alignment="center">
              What would you like to create?
            </Text>
            <Text as="p" variant="bodyLg" tone="subdued" alignment="center">
              Start with a single campaign, or run an A/B test to optimize your conversions
            </Text>
          </BlockStack>

          {/* Mode Cards Grid */}
          <div style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(320px, 1fr))",
            gap: "24px",
          }}>
            {/* Single Campaign Card */}
            <ModeCard
              icon={TargetIcon}
              iconGradient="linear-gradient(135deg, #10b981 0%, #059669 100%)"
              title="Single Campaign"
              description="Launch a targeted popup with full design control and smart targeting rules"
              features={[
                "30+ ready-to-use templates",
                "Advanced targeting rules",
                "Real-time analytics",
              ]}
              buttonText="Create Campaign"
              onClick={() => onModeSelect("single")}
              recommended
            />

            {/* A/B Experiment Card */}
            <ModeCard
              icon={ChartVerticalFilledIcon}
              iconGradient="linear-gradient(135deg, #8b5cf6 0%, #6366f1 100%)"
              title="A/B Experiment"
              description="Test different popup variants and let data decide the winner"
              features={[
                "Test 2-4 variants at once",
                "Automatic traffic splitting",
                "Statistical significance tracking",
                "Winner auto-selection",
              ]}
              buttonText="Create Experiment"
              onClick={() => onModeSelect("experiment")}
              disabled={!experimentsEnabled}
              disabledReason="Available on Growth plan"
              badge="Pro"
            />
          </div>

          {/* Helper Text */}
          <Box paddingBlockStart="200">
            <Text as="p" variant="bodySm" tone="subdued" alignment="center">
              Not sure? Start with a single campaign – you can always test later.
            </Text>
          </Box>
        </BlockStack>
      </div>
    </div>
  );
}

interface ModeCardProps {
  icon: typeof TargetIcon;
  iconGradient: string;
  title: string;
  description: string;
  features: string[];
  buttonText: string;
  onClick: () => void;
  recommended?: boolean;
  disabled?: boolean;
  disabledReason?: string;
  badge?: string;
}

function ModeCard({
  icon,
  iconGradient,
  title,
  description,
  features,
  buttonText,
  onClick,
  recommended,
  disabled,
  disabledReason,
  badge,
}: ModeCardProps) {
  const [isHovered, setIsHovered] = useState(false);

  return (
    <div
      style={{
        background: "var(--p-color-bg-surface)",
        borderRadius: 16,
        border: `2px solid ${isHovered && !disabled ? "var(--p-color-border-emphasis)" : "var(--p-color-border)"}`,
        padding: 24,
        cursor: disabled ? "not-allowed" : "pointer",
        opacity: disabled ? 0.7 : 1,
        transition: "all 0.2s ease",
        transform: isHovered && !disabled ? "translateY(-4px)" : "translateY(0)",
        boxShadow: isHovered && !disabled
          ? "0 12px 32px rgba(0, 0, 0, 0.12)"
          : "0 2px 8px rgba(0, 0, 0, 0.04)",
        display: "flex",
        flexDirection: "column",
        height: "100%",
      }}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      onClick={disabled ? undefined : onClick}
      role="button"
      tabIndex={disabled ? -1 : 0}
      onKeyDown={(e) => {
        if (!disabled && (e.key === "Enter" || e.key === " ")) {
          onClick();
        }
      }}
    >
      <BlockStack gap="500">
        {/* Header: Icon + Badges */}
        <InlineStack align="space-between" blockAlign="start">
          <div style={{
            width: 52,
            height: 52,
            borderRadius: 14,
            background: iconGradient,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            boxShadow: "0 4px 12px rgba(0, 0, 0, 0.1)",
          }}>
            <div style={{ color: "white" }}>
              <Icon source={icon} />
            </div>
          </div>

          <InlineStack gap="200">
            {recommended && (
              <Badge tone="success" icon={StarFilledIcon}>
                Recommended
              </Badge>
            )}
            {badge && !recommended && (
              <Badge tone="info">
                {badge}
              </Badge>
            )}
          </InlineStack>
        </InlineStack>

        {/* Title and description */}
        <BlockStack gap="200">
          <Text as="h2" variant="headingLg" fontWeight="semibold">
            {title}
          </Text>
          <Text as="p" tone="subdued" variant="bodyMd">
            {description}
          </Text>
        </BlockStack>

        {/* Features list */}
        <BlockStack gap="300">
          {features.map((feature, index) => (
            <InlineStack key={index} gap="300" blockAlign="center" wrap={false}>
              <div style={{
                width: 20,
                height: 20,
                borderRadius: "50%",
                background: disabled ? "var(--p-color-bg-fill-disabled)" : "var(--p-color-bg-fill-success)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                flexShrink: 0,
              }}>
                <svg width="12" height="10" viewBox="0 0 12 10" fill="none">
                  <path
                    d="M1 5L4.5 8.5L11 1"
                    stroke={disabled ? "var(--p-color-icon-disabled)" : "white"}
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                </svg>
              </div>
              <Text as="span" variant="bodyMd" tone={disabled ? "subdued" : undefined}>
                {feature}
              </Text>
            </InlineStack>
          ))}
        </BlockStack>
      </BlockStack>

      {/* Spacer to push button to bottom */}
      <div style={{ flex: 1, minHeight: 16 }} />

      {/* Action button - always at the bottom */}
      <Box paddingBlockStart="100">
        <Button
          variant={recommended ? "primary" : "secondary"}
          size="large"
          fullWidth
          onClick={() => {
            if (!disabled) onClick();
          }}
          disabled={disabled}
          icon={disabled ? LockIcon : undefined}
        >
          {buttonText}
        </Button>
      </Box>

      {/* Disabled reason - fixed height container for alignment */}
      <div style={{ minHeight: 24, display: "flex", alignItems: "center", justifyContent: "center", marginTop: 8 }}>
        {disabled && disabledReason && (
          <InlineStack gap="100" align="center" blockAlign="center">
            <Icon source={LockIcon} tone="subdued" />
            <Text as="span" variant="bodySm" tone="subdued">
              {disabledReason}
            </Text>
          </InlineStack>
        )}
      </div>
    </div>
  );
}

