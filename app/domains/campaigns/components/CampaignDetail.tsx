/**
 * Campaign Detail View Component
 *
 * A comprehensive detail view for individual campaigns showing all
 * configuration, metrics, and management options.
 */

import React from "react";
import {
  Page,
  Card,
  Text,
  Badge,
  InlineStack,
  BlockStack,
  Box,
  Divider,
  Tabs,
  Banner,
  ProgressBar,
  DataTable,
  EmptyState,
  Spinner,
  Button,
  InlineGrid,
  Icon,
} from "@shopify/polaris";
import {
  ViewIcon,
  PersonIcon,
  ChartVerticalIcon,
  CashDollarIcon,
  DiscountIcon,
  CartIcon,
  CursorIcon,
  CalendarIcon,
  ClockIcon,
  TargetIcon,
} from "@shopify/polaris-icons";
import { useNavigate } from "react-router";

import type {
  CampaignWithConfigs,
  CampaignStatus,
  CampaignGoal,
  TemplateType,
} from "~/domains/campaigns/types/campaign";
import { getTemplateLabel } from "~/domains/templates/registry/template-registry";
import { CampaignConfigurationSummary } from "./CampaignConfigurationSummary";
import { CampaignPopupPreview } from "./CampaignPopupPreview";

// ============================================================================
// TYPES
// ============================================================================

interface CampaignDetailProps {
  campaign: CampaignWithConfigs | null;
  loading?: boolean;
  onEdit?: () => void;
  onDuplicate?: () => void;
  onDelete?: () => void;
  onToggleStatus?: () => void;
  onBack?: () => void;
  analyticsUrl?: string; // Changed from handler to URL
  stats?: {
    leadCount: number;
    conversionRate: number;
    lastLeadAt?: string | Date | null;
  } | null;
  funnel?: {
    views: number;
    submits: number;
    couponsIssued: number;
  } | null;
  revenue?: number;
  discountGiven?: number;
  aov?: number;
  clicks?: number;
  currency?: string;
}

interface CampaignMetrics {
  views: number;
  conversions: number;
  conversionRate: number;
  revenue: number;
  discountGiven: number;
  aov: number;
  clicks: number;
  clickRate: number;
}

// ============================================================================
// COMPONENT
// ============================================================================

export function CampaignDetail({
  campaign,
  loading = false,
  onEdit,
  onDuplicate,
  onDelete,
  onToggleStatus,
  onBack,
  analyticsUrl, // Destructure new prop
  stats,
  funnel,
  revenue,
  discountGiven,
  aov,
  clicks,
  currency = "USD",
}: CampaignDetailProps) {
  const navigate = useNavigate();

  const [selectedTab, setSelectedTab] = React.useState(0);

  const views = funnel?.views ?? 0;
  const conversions = funnel?.submits ?? stats?.leadCount ?? 0;
  const conversionRate =
    typeof stats?.conversionRate === "number"
      ? stats.conversionRate
      : views > 0
        ? (conversions / views) * 100
        : 0;

  const safeRevenue = typeof revenue === "number" ? revenue : 0;
  const safeDiscountGiven = typeof discountGiven === "number" ? discountGiven : 0;
  const safeAov = typeof aov === "number" ? aov : 0;
  const safeClicks = typeof clicks === "number" ? clicks : 0;
  const clickRate = views > 0 ? (safeClicks / views) * 100 : 0;

  const metrics: CampaignMetrics = {
    views,
    conversions,
    conversionRate,
    revenue: safeRevenue,
    discountGiven: safeDiscountGiven,
    aov: safeAov,
    clicks: safeClicks,
    clickRate,
  };

  // Helper functions
  const getStatusBadge = (status: CampaignStatus) => {
    const statusConfig: Record<
      CampaignStatus,
      { tone: "info" | "success" | "warning" | "critical"; children: string }
    > = {
      DRAFT: { tone: "info", children: "Draft" },
      ACTIVE: { tone: "success", children: "Active" },
      PAUSED: { tone: "warning", children: "Paused" },
      ARCHIVED: { tone: "critical", children: "Archived" },
    };

    return statusConfig[status] || { tone: "info", children: status };
  };

  const formatDate = (date: string | Date) => {
    const dateObj = typeof date === "string" ? new Date(date) : date;
    return dateObj.toLocaleDateString("en-US", {
      year: "numeric",
      month: "long",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: currency,
    }).format(amount);
  };

  // Use template registry for labels
  const getTemplateTypeLabel = getTemplateLabel;

  const getGoalLabel = (goal: CampaignGoal) => {
    const labels: Record<CampaignGoal, string> = {
      NEWSLETTER_SIGNUP: "Newsletter Signup",
      INCREASE_REVENUE: "Increase Revenue",
      ENGAGEMENT: "Engagement",
    };

    return labels[goal] || goal;
  };

  // Loading state
  if (loading) {
    return (
      <Page>
        <Card>
          <Box padding="800">
            <BlockStack align="center">
              <Spinner size="large" />
              <Text variant="bodyMd" as="p">
                Loading campaign details...
              </Text>
            </BlockStack>
          </Box>
        </Card>
      </Page>
    );
  }

  // Not found state
  if (!campaign) {
    return (
      <Page>
        <Card>
          <EmptyState
            heading="Campaign not found"
            action={{
              content: "Go back",
              onAction: onBack,
            }}
            image="https://cdn.shopify.com/s/files/1/0262/4071/2726/files/emptystate-files.png"
          >
            <p>The campaign you&apos;re looking for doesn&apos;t exist or has been deleted.</p>
          </EmptyState>
        </Card>
      </Page>
    );
  }

  const statusBadge = getStatusBadge(campaign.status as CampaignStatus);
  const isActive = campaign.status === "ACTIVE";
  const isDraft = campaign.status === "DRAFT";

  // Page actions
  const primaryAction = onEdit
    ? {
        content: "Edit Campaign",
        onAction: onEdit,
      }
    : undefined;

  const secondaryActions = [
    ...(onToggleStatus
      ? [
          {
            content: isActive ? "Pause Campaign" : "Activate Campaign",
            onAction: onToggleStatus,
            destructive: isActive,
          },
        ]
      : []),
    ...(onDuplicate
      ? [
          {
            content: "Duplicate",
            onAction: onDuplicate,
          },
        ]
      : []),
    ...(onDelete
      ? [
          {
            content: "Delete",
            onAction: onDelete,
            destructive: true,
          },
        ]
      : []),
  ];

  // Tab content
  const tabs = [
    {
      id: "overview",
      content: "Overview",
      panelID: "overview-panel",
    },
    {
      id: "metrics",
      content: "Metrics",
      panelID: "metrics-panel",
    },
    {
      id: "history",
      content: "History",
      panelID: "history-panel",
    },
  ];

  // Metric card helper component
  const MetricCard = ({
    icon,
    label,
    value,
    subValue,
    tone = "base",
  }: {
    icon: typeof ViewIcon;
    label: string;
    value: string;
    subValue?: string;
    tone?: "base" | "success" | "critical";
  }) => (
    <Card>
      <Box padding="400">
        <BlockStack gap="300">
          <InlineStack gap="200" blockAlign="center">
            <Box
              background={
                tone === "success"
                  ? "bg-fill-success-secondary"
                  : tone === "critical"
                    ? "bg-fill-critical-secondary"
                    : "bg-fill-secondary"
              }
              borderRadius="200"
              padding="200"
            >
              <Icon source={icon} tone={tone === "base" ? "subdued" : tone} />
            </Box>
            <Text as="span" variant="bodySm" tone="subdued">
              {label}
            </Text>
          </InlineStack>
          <Text as="p" variant="headingLg" fontWeight="bold">
            {value}
          </Text>
          {subValue && (
            <Text as="span" variant="bodySm" tone="subdued">
              {subValue}
            </Text>
          )}
        </BlockStack>
      </Box>
    </Card>
  );

  // Overview tab content
  const overviewContent = (
    <BlockStack gap="500">
      {/* Status Banner */}
      {isDraft && (
        <Banner tone="info">
          <p>This campaign is in draft mode. Activate it to start showing to customers.</p>
        </Banner>
      )}

      {isActive && (
        <Banner tone="success">
          <p>This campaign is currently active and showing to customers.</p>
        </Banner>
      )}

      {/* Hero Section: Preview + Key Info */}
      <InlineGrid columns={{ xs: 1, lg: ["twoThirds", "oneThird"] }} gap="400">
        {/* Left: Large Popup Preview */}
        <Card>
          <Box padding="400">
            <CampaignPopupPreview campaign={campaign} height={450} showDeviceToggle showRefresh />
          </Box>
        </Card>

        {/* Right: Campaign Info Card */}
        <Card>
          <Box padding="400">
            <BlockStack gap="400">
              <Text variant="headingMd" as="h3">
                Campaign Details
              </Text>
              <Divider />

              <BlockStack gap="300">
                <InlineStack gap="200" blockAlign="center">
                  <Icon source={TargetIcon} tone="subdued" />
                  <BlockStack gap="100">
                    <Text as="span" variant="bodySm" tone="subdued">
                      Goal
                    </Text>
                    <Text as="span" variant="bodyMd" fontWeight="semibold">
                      {getGoalLabel(campaign.goal as CampaignGoal)}
                    </Text>
                  </BlockStack>
                </InlineStack>

                <InlineStack gap="200" blockAlign="center">
                  <Icon source={ViewIcon} tone="subdued" />
                  <BlockStack gap="100">
                    <Text as="span" variant="bodySm" tone="subdued">
                      Template Type
                    </Text>
                    <Text as="span" variant="bodyMd" fontWeight="semibold">
                      {getTemplateTypeLabel(campaign.templateType as TemplateType)}
                    </Text>
                  </BlockStack>
                </InlineStack>

                <InlineStack gap="200" blockAlign="center">
                  <Icon source={CalendarIcon} tone="subdued" />
                  <BlockStack gap="100">
                    <Text as="span" variant="bodySm" tone="subdued">
                      Created
                    </Text>
                    <Text as="span" variant="bodyMd">
                      {formatDate(campaign.createdAt)}
                    </Text>
                  </BlockStack>
                </InlineStack>

                <InlineStack gap="200" blockAlign="center">
                  <Icon source={ClockIcon} tone="subdued" />
                  <BlockStack gap="100">
                    <Text as="span" variant="bodySm" tone="subdued">
                      Last Updated
                    </Text>
                    <Text as="span" variant="bodyMd">
                      {formatDate(campaign.updatedAt)}
                    </Text>
                  </BlockStack>
                </InlineStack>
              </BlockStack>

              {campaign.description && (
                <>
                  <Divider />
                  <BlockStack gap="200">
                    <Text as="span" variant="bodySm" tone="subdued">
                      Description
                    </Text>
                    <Text as="p" variant="bodyMd">
                      {campaign.description}
                    </Text>
                  </BlockStack>
                </>
              )}
            </BlockStack>
          </Box>
        </Card>
      </InlineGrid>

      {/* Performance Metrics Grid */}
      <BlockStack gap="300">
        <Text variant="headingMd" as="h3">
          Performance at a Glance
        </Text>
        <InlineGrid columns={{ xs: 2, sm: 3, md: 4 }} gap="300">
          <MetricCard
            icon={ViewIcon}
            label="Total Views"
            value={metrics.views.toLocaleString()}
            subValue="Impressions"
          />
          <MetricCard
            icon={PersonIcon}
            label="Conversions"
            value={metrics.conversions.toLocaleString()}
            subValue={`${metrics.conversionRate.toFixed(1)}% rate`}
            tone={metrics.conversionRate > 5 ? "success" : "base"}
          />
          <MetricCard
            icon={CashDollarIcon}
            label="Revenue"
            value={formatCurrency(metrics.revenue)}
            subValue="Gross attributed"
            tone={metrics.revenue > 0 ? "success" : "base"}
          />
          <MetricCard
            icon={DiscountIcon}
            label="Discount Given"
            value={formatCurrency(metrics.discountGiven)}
            subValue="Total value"
          />
          <MetricCard
            icon={CartIcon}
            label="Avg Order Value"
            value={formatCurrency(metrics.aov)}
            subValue="Per conversion"
          />
          <MetricCard
            icon={CursorIcon}
            label="Clicks"
            value={metrics.clicks.toLocaleString()}
            subValue={`${metrics.clickRate.toFixed(1)}% CTR`}
          />
          <MetricCard
            icon={ChartVerticalIcon}
            label="Conversion Rate"
            value={`${metrics.conversionRate.toFixed(2)}%`}
            subValue="Views → Leads"
            tone={metrics.conversionRate > 5 ? "success" : "base"}
          />
        </InlineGrid>
      </BlockStack>

      {/* Configuration Summary */}
      <CampaignConfigurationSummary campaign={campaign} />
    </BlockStack>
  );

  // Metrics tab content
  const metricsContent = (
    <BlockStack gap="400">
      {/* Performance Metrics */}
      <Card>
        <Box padding="400">
          <BlockStack gap="400">
            <InlineStack align="space-between" blockAlign="center">
              <Text variant="headingMd" as="h3">
                Performance Metrics
              </Text>
              {analyticsUrl && (
                <Button
                  onClick={() => {
                    console.log("[CampaignDetail] View Full Analytics clicked", {
                      from: window.location.pathname,
                      target: "analytics",
                      analyticsUrl,
                    });
                    navigate("analytics");
                  }}
                  variant="plain"
                >
                  View Full Analytics
                </Button>
              )}
            </InlineStack>
            <Divider />

            <DataTable
              columnContentTypes={["text", "numeric", "numeric"]}
              headings={["Metric", "Value", "Change"]}
              rows={[
                ["Total Views", metrics.views.toLocaleString(), "N/A"],
                ["Total Conversions", metrics.conversions.toString(), "N/A"],
                ["Conversion Rate", `${metrics.conversionRate.toFixed(2)}%`, "N/A"],
                ["Total Revenue (gross)", formatCurrency(metrics.revenue), "N/A"],
                ["Total Discount Given", formatCurrency(metrics.discountGiven), "N/A"],
                ["Average Order Value (gross)", formatCurrency(metrics.aov), "N/A"],
                ["Click-through Rate", `${metrics.clickRate.toFixed(2)}%`, "N/A"],
                ["Total Clicks", metrics.clicks.toString(), "N/A"],
              ]}
            />
          </BlockStack>
        </Box>
      </Card>

      {/* Conversion Funnel */}
      <Card>
        <Box padding="400">
          <BlockStack gap="400">
            <Text variant="headingMd" as="h3">
              Conversion Funnel
            </Text>
            <Divider />

            <BlockStack gap="400">
              <InlineStack align="space-between">
                <Text variant="bodyMd" as="p">
                  Views
                </Text>
                <Text variant="bodyMd" as="p">
                  {metrics.views.toLocaleString()}
                </Text>
              </InlineStack>
              <ProgressBar progress={100} size="small" />

              <InlineStack align="space-between">
                <Text variant="bodyMd" as="p">
                  Clicks
                </Text>
                <Text variant="bodyMd" as="p">
                  {metrics.clicks}
                </Text>
              </InlineStack>
              <ProgressBar
                progress={metrics.views > 0 ? (metrics.clicks / metrics.views) * 100 : 0}
                size="small"
              />

              <InlineStack align="space-between">
                <Text variant="bodyMd" as="p">
                  Conversions
                </Text>
                <Text variant="bodyMd" as="p">
                  {metrics.conversions}
                </Text>
              </InlineStack>
              <ProgressBar
                progress={metrics.views > 0 ? (metrics.conversions / metrics.views) * 100 : 0}
                size="small"
              />
            </BlockStack>
          </BlockStack>
        </Box>
      </Card>
    </BlockStack>
  );

  // History tab content
  const historyContent = (
    <BlockStack gap="400">
      <Card>
        <Box padding="400">
          <BlockStack gap="400">
            <Text variant="headingMd" as="h3">
              Campaign History
            </Text>
            <Divider />

            <DataTable
              columnContentTypes={["text", "text", "text", "text"]}
              headings={["Date", "Action", "User", "Details"]}
              rows={[
                [formatDate(campaign.updatedAt), "Updated", "Admin", "Modified campaign settings"],
                [formatDate(campaign.createdAt), "Created", "Admin", "Campaign created"],
              ]}
            />
          </BlockStack>
        </Box>
      </Card>
    </BlockStack>
  );

  // Get current tab content
  const getCurrentTabContent = () => {
    switch (selectedTab) {
      case 0:
        return overviewContent;
      case 1:
        return metricsContent;
      case 2:
        return historyContent;
      default:
        return overviewContent;
    }
  };

  // Main render
  return (
    <Page
      backAction={onBack ? { onAction: onBack } : undefined}
      title={campaign.name}
      subtitle={`${getTemplateTypeLabel(campaign.templateType as TemplateType)} • ${getGoalLabel(campaign.goal as CampaignGoal)}`}
      primaryAction={primaryAction}
      secondaryActions={secondaryActions}
      titleMetadata={<Badge {...statusBadge} />}
    >
      <BlockStack gap="400">
        {/* Tabs */}
        <Card>
          <Tabs tabs={tabs} selected={selectedTab} onSelect={setSelectedTab}>
            <Box padding="400">{getCurrentTabContent()}</Box>
          </Tabs>
        </Card>
      </BlockStack>
    </Page>
  );
}
