/**
 * Campaign Configuration Summary Component
 *
 * Displays a condensed overview of campaign settings including:
 * - Trigger rules
 * - Audience segments
 * - Page targeting
 * - Schedule
 * - Discount configuration
 * - Geographic targeting
 */

import React from "react";
import {
  Card,
  Text,
  Badge,
  InlineStack,
  BlockStack,
  Box,
  Divider,
  Icon,
} from "@shopify/polaris";
import type { IconSource } from "@shopify/polaris";
import {
  ClockIcon,
  PersonIcon,
  ViewIcon,
  CalendarIcon,
  DiscountIcon,
  GlobeIcon,
} from "@shopify/polaris-icons";

import type { CampaignWithConfigs } from "~/domains/campaigns/types/campaign";

// ============================================================================
// TYPES
// ============================================================================

interface CampaignConfigurationSummaryProps {
  campaign: CampaignWithConfigs;
}

interface ConfigSection {
  title: string;
  icon: IconSource;
  items: ConfigItem[];
}

interface ConfigItem {
  label: string;
  value: string | React.ReactNode;
  tone?: "info" | "success" | "warning" | "critical";
}

// ============================================================================
// HELPERS
// ============================================================================

function formatDelay(ms: number): string {
  if (ms < 1000) return `${ms}ms`;
  const seconds = ms / 1000;
  if (seconds < 60) return `${seconds}s`;
  const minutes = Math.floor(seconds / 60);
  return `${minutes}m ${Math.round(seconds % 60)}s`;
}

function formatDate(date: Date | string | null | undefined): string {
  if (!date) return "Not set";
  const d = typeof date === "string" ? new Date(date) : date;
  return d.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

function getDiscountValueLabel(
  valueType: string | undefined,
  value: number | undefined
): string {
  if (!valueType) return "Not configured";
  switch (valueType) {
    case "PERCENTAGE":
      return `${value ?? 0}% off`;
    case "FIXED_AMOUNT":
      return `$${value ?? 0} off`;
    case "FREE_SHIPPING":
      return "Free shipping";
    default:
      return valueType;
  }
}

function getDiscountBehaviorLabel(behavior: string | undefined): string {
  switch (behavior) {
    case "SHOW_CODE_AND_AUTO_APPLY":
      return "Auto-apply";
    case "SHOW_CODE_ONLY":
      return "Manual entry";
    case "SHOW_CODE_AND_ASSIGN_TO_EMAIL":
      return "Email-restricted";
    default:
      return "Default";
  }
}

// ============================================================================
// SECTION BUILDERS
// ============================================================================

function buildTriggerSection(campaign: CampaignWithConfigs): ConfigSection {
  const triggers = campaign.targetRules?.enhancedTriggers;
  const items: ConfigItem[] = [];

  if (!triggers) {
    items.push({ label: "Triggers", value: "Default (page load)" });
    return { title: "Trigger Rules", icon: ClockIcon, items };
  }

  // Page load
  if (triggers.page_load?.enabled) {
    const delay = triggers.page_load.delay;
    items.push({
      label: "Page Load",
      value: delay ? `After ${formatDelay(delay)}` : "Immediate",
    });
  }

  // Exit intent
  if (triggers.exit_intent?.enabled) {
    const sensitivity = triggers.exit_intent.sensitivity || "medium";
    items.push({
      label: "Exit Intent",
      value: (
        <InlineStack gap="100">
          <Badge tone="info">{`${sensitivity} sensitivity`}</Badge>
          {triggers.exit_intent.mobile_enabled && (
            <Badge tone="success">Mobile</Badge>
          )}
        </InlineStack>
      ),
    });
  }

  // Scroll depth
  if (triggers.scroll_depth?.enabled) {
    const depth = triggers.scroll_depth.depth_percentage ?? 50;
    items.push({
      label: "Scroll Depth",
      value: `${depth}% of page`,
    });
  }

  // Time delay
  if (triggers.time_delay?.enabled) {
    const delay = triggers.time_delay.delay ?? 0;
    items.push({
      label: "Time Delay",
      value: formatDelay(delay * 1000),
    });
  }

  // Idle timer
  if (triggers.idle_timer?.enabled) {
    const duration = triggers.idle_timer.idle_duration ?? 30;
    items.push({
      label: "Idle Timer",
      value: `After ${duration}s inactive`,
    });
  }

  // Cart-related triggers
  if (triggers.add_to_cart?.enabled) {
    items.push({ label: "Add to Cart", value: "Enabled" });
  }
  if (triggers.cart_value?.enabled) {
    const min = triggers.cart_value.minValue ?? triggers.cart_value.min_value;
    const max = triggers.cart_value.max_value;
    let value = "Any cart value";
    if (min && max) value = `$${min} - $${max}`;
    else if (min) value = `Cart ≥ $${min}`;
    else if (max) value = `Cart ≤ $${max}`;
    items.push({ label: "Cart Value", value });
  }

  // Frequency capping
  if (triggers.frequency_capping) {
    const fc = triggers.frequency_capping;
    const parts: string[] = [];
    if (fc.max_triggers_per_session) parts.push(`${fc.max_triggers_per_session}/session`);
    if (fc.max_triggers_per_day) parts.push(`${fc.max_triggers_per_day}/day`);
    if (parts.length > 0) {
      items.push({ label: "Frequency Cap", value: parts.join(", ") });
    }
  }

  if (items.length === 0) {
    items.push({ label: "Triggers", value: "Default (page load)" });
  }

  return { title: "Trigger Rules", icon: ClockIcon, items };
}

function buildAudienceSection(campaign: CampaignWithConfigs): ConfigSection {
  const audience = campaign.targetRules?.audienceTargeting;
  const triggers = campaign.targetRules?.enhancedTriggers;
  const items: ConfigItem[] = [];

  // Device targeting
  if (triggers?.device_targeting?.enabled) {
    const devices = triggers.device_targeting.device_types ?? [];
    if (devices.length > 0) {
      items.push({
        label: "Devices",
        value: (
          <InlineStack gap="100">
            {devices.map((d) => (
              <Badge key={d} tone="info">
                {d.charAt(0).toUpperCase() + d.slice(1)}
              </Badge>
            ))}
          </InlineStack>
        ),
      });
    }
  }

  // Shopify segments
  if (audience?.enabled && audience.shopifySegmentIds?.length > 0) {
    items.push({
      label: "Customer Segments",
      value: `${audience.shopifySegmentIds.length} segment(s)`,
    });
  }

  if (items.length === 0) {
    items.push({ label: "Audience", value: "All visitors" });
  }

  return { title: "Audience", icon: PersonIcon, items };
}

function buildPageTargetingSection(campaign: CampaignWithConfigs): ConfigSection {
  const pageTargeting = campaign.targetRules?.pageTargeting;
  const items: ConfigItem[] = [];

  if (!pageTargeting?.enabled) {
    items.push({ label: "Pages", value: "All pages" });
    return { title: "Page Targeting", icon: ViewIcon, items };
  }

  // Specific pages
  if (pageTargeting.pages?.length > 0) {
    items.push({
      label: "Include Pages",
      value: `${pageTargeting.pages.length} page(s)`,
    });
  }

  // Custom patterns
  if (pageTargeting.customPatterns?.length > 0) {
    items.push({
      label: "URL Patterns",
      value: `${pageTargeting.customPatterns.length} pattern(s)`,
    });
  }

  // Exclude pages
  if (pageTargeting.excludePages?.length > 0) {
    items.push({
      label: "Exclude Pages",
      value: (
        <Badge tone="warning">
          {`${pageTargeting.excludePages.length} excluded`}
        </Badge>
      ),
    });
  }

  // Collections
  if (pageTargeting.collections?.length > 0) {
    items.push({
      label: "Collections",
      value: `${pageTargeting.collections.length} collection(s)`,
    });
  }

  // Product tags
  if (pageTargeting.productTags?.length > 0) {
    items.push({
      label: "Product Tags",
      value: `${pageTargeting.productTags.length} tag(s)`,
    });
  }

  if (items.length === 0) {
    items.push({ label: "Pages", value: "All pages" });
  }

  return { title: "Page Targeting", icon: ViewIcon, items };
}

function buildScheduleSection(campaign: CampaignWithConfigs): ConfigSection {
  const items: ConfigItem[] = [];

  const startDate = campaign.startDate;
  const endDate = campaign.endDate;

  if (!startDate && !endDate) {
    items.push({ label: "Schedule", value: "Always active (no date restrictions)" });
  } else {
    if (startDate) {
      const isStarted = new Date(startDate) <= new Date();
      items.push({
        label: "Start Date",
        value: (
          <InlineStack gap="100">
            <span>{formatDate(startDate)}</span>
            {isStarted && <Badge tone="success">Started</Badge>}
          </InlineStack>
        ),
      });
    }

    if (endDate) {
      const isEnded = new Date(endDate) < new Date();
      items.push({
        label: "End Date",
        value: (
          <InlineStack gap="100">
            <span>{formatDate(endDate)}</span>
            {isEnded && <Badge tone="critical">Ended</Badge>}
          </InlineStack>
        ),
      });
    }
  }

  return { title: "Schedule", icon: CalendarIcon, items };
}

function buildDiscountSection(campaign: CampaignWithConfigs): ConfigSection {
  const discount = campaign.discountConfig;
  const items: ConfigItem[] = [];

  if (!discount?.enabled) {
    items.push({ label: "Discount", value: "Not enabled" });
    return { title: "Discount", icon: DiscountIcon, items };
  }

  // Discount value
  items.push({
    label: "Discount",
    value: (
      <Badge tone="success">
        {getDiscountValueLabel(discount.valueType, discount.value)}
      </Badge>
    ),
  });

  // Code
  if (discount.code) {
    items.push({ label: "Code", value: discount.code });
  }

  // Behavior
  items.push({
    label: "Behavior",
    value: getDiscountBehaviorLabel(discount.behavior),
  });

  // Minimum amount
  if (discount.minimumAmount && discount.minimumAmount > 0) {
    items.push({
      label: "Minimum Order",
      value: `$${discount.minimumAmount}`,
    });
  }

  // Usage limit
  if (discount.usageLimit) {
    items.push({
      label: "Usage Limit",
      value: `${discount.usageLimit} uses`,
    });
  }

  // Expiry
  if (discount.expiryDays) {
    items.push({
      label: "Expiry",
      value: `${discount.expiryDays} days after issue`,
    });
  }

  // Applicability scope
  if (discount.applicability?.scope && discount.applicability.scope !== "all") {
    items.push({
      label: "Applies To",
      value:
        discount.applicability.scope === "products"
          ? `${discount.applicability.productIds?.length ?? 0} product(s)`
          : `${discount.applicability.collectionIds?.length ?? 0} collection(s)`,
    });
  }

  return { title: "Discount", icon: DiscountIcon, items };
}

function buildGeoSection(campaign: CampaignWithConfigs): ConfigSection | null {
  const geo = campaign.targetRules?.geoTargeting;
  const items: ConfigItem[] = [];

  if (!geo?.enabled || !geo.countries?.length) {
    return null; // Don't show if not configured
  }

  const mode = geo.mode === "exclude" ? "Exclude" : "Include";
  items.push({
    label: mode,
    value: (
      <InlineStack gap="100" wrap>
        {geo.countries.slice(0, 5).map((code) => (
          <Badge key={code}>{code}</Badge>
        ))}
        {geo.countries.length > 5 && (
          <Badge tone="info">{`+${geo.countries.length - 5} more`}</Badge>
        )}
      </InlineStack>
    ),
  });

  return { title: "Geographic Targeting", icon: GlobeIcon, items };
}

// ============================================================================
// SECTION COMPONENT
// ============================================================================

function ConfigSectionCard({ section }: { section: ConfigSection }) {
  return (
    <Box
      background="bg-surface-secondary"
      padding="300"
      borderRadius="200"
    >
      <BlockStack gap="300">
        <InlineStack gap="200" blockAlign="center" wrap={false}>
          <div style={{ display: "flex", alignItems: "center" }}>
            <Icon source={section.icon} tone="subdued" />
          </div>
          <Text variant="headingSm" as="h4" tone="subdued">
            {section.title}
          </Text>
        </InlineStack>
        <BlockStack gap="150">
          {section.items.map((item, index) => (
            <InlineStack key={index} align="space-between" blockAlign="center" wrap={false}>
              <Text variant="bodySm" as="span" tone="subdued">
                {item.label}
              </Text>
              <Box maxWidth="60%">
                {typeof item.value === "string" ? (
                  <Text variant="bodySm" as="span" fontWeight="medium">
                    {item.value}
                  </Text>
                ) : (
                  item.value
                )}
              </Box>
            </InlineStack>
          ))}
        </BlockStack>
      </BlockStack>
    </Box>
  );
}

// ============================================================================
// MAIN COMPONENT
// ============================================================================

export function CampaignConfigurationSummary({
  campaign,
}: CampaignConfigurationSummaryProps) {
  const sections: ConfigSection[] = [
    buildTriggerSection(campaign),
    buildAudienceSection(campaign),
    buildPageTargetingSection(campaign),
    buildScheduleSection(campaign),
    buildDiscountSection(campaign),
  ];

  // Add geo section only if configured
  const geoSection = buildGeoSection(campaign);
  if (geoSection) {
    sections.push(geoSection);
  }

  return (
    <Card>
      <Box padding="400">
        <BlockStack gap="400">
          <Text variant="headingMd" as="h3">
            Configuration Summary
          </Text>
          <Divider />

          {/* Grid layout: 2 columns on larger screens */}
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))",
              gap: "12px",
            }}
          >
            {sections.map((section, index) => (
              <ConfigSectionCard key={index} section={section} />
            ))}
          </div>
        </BlockStack>
      </Box>
    </Card>
  );
}

