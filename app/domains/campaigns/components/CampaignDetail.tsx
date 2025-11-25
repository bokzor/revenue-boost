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
  DescriptionList,
  Tabs,
  Banner,
  ProgressBar,
  DataTable,
  EmptyState,
  Spinner,
  Button,
} from "@shopify/polaris";
import { useNavigate } from "react-router";

import type {
  CampaignWithConfigs,
  CampaignStatus,
  CampaignGoal,
  TemplateType,
} from "~/domains/campaigns/types/campaign";
import { getTemplateLabel } from "~/domains/templates/registry/template-registry";

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

  // Overview tab content
  const overviewContent = (
    <BlockStack gap="400">
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

      {/* Basic Information */}
      <Card>
        <Box padding="400">
          <BlockStack gap="400">
            <Text variant="headingMd" as="h3">
              Basic Information
            </Text>
            <Divider />

            <DescriptionList
              items={[
                {
                  term: "Campaign Name",
                  description: campaign.name,
                },
                {
                  term: "Description",
                  description: campaign.description || "No description provided",
                },
                {
                  term: "Goal",
                  description: getGoalLabel(campaign.goal as CampaignGoal),
                },
                {
                  term: "Template Type",
                  description: getTemplateTypeLabel(campaign.templateType as TemplateType),
                },
                {
                  term: "Priority",
                  description: campaign.priority?.toString() || "Not set",
                },
                {
                  term: "Status",
                  description: <Badge {...statusBadge} />,
                },
                {
                  term: "Created",
                  description: formatDate(campaign.createdAt),
                },
                {
                  term: "Last Updated",
                  description: formatDate(campaign.updatedAt),
                },
              ]}
            />
          </BlockStack>
        </Box>
      </Card>

      {/* Quick Metrics */}
      <Card>
        <Box padding="400">
          <BlockStack gap="400">
            <Text variant="headingMd" as="h3">
              Performance Summary
            </Text>
            <Divider />

            <InlineStack gap="400">
              <BlockStack gap="200" align="center">
                <Text variant="headingLg" as="p">
                  {metrics.views.toLocaleString()}
                </Text>
                <Text variant="bodySm" tone="subdued" as="p">
                  Views
                </Text>
              </BlockStack>

              <BlockStack gap="200" align="center">
                <Text variant="headingLg" as="p">
                  {metrics.conversions}
                </Text>
                <Text variant="bodySm" tone="subdued" as="p">
                  Conversions
                </Text>
              </BlockStack>

              <BlockStack gap="200" align="center">
                <Text variant="headingLg" as="p">
                  {metrics.conversionRate.toFixed(2)}%
                </Text>
                <Text variant="bodySm" tone="subdued" as="p">
                  Conversion Rate
                </Text>
              </BlockStack>

              <BlockStack gap="200" align="center">
                <Text variant="headingLg" as="p">
                  {formatCurrency(metrics.revenue)}
                </Text>
                <Text variant="bodySm" tone="subdued" as="p">
                  Revenue (gross, attributed)
                </Text>
              </BlockStack>
            </InlineStack>
          </BlockStack>
        </Box>
      </Card>
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
