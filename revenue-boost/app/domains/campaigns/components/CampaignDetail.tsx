/**
 * Campaign Detail View Component
 * 
 * A comprehensive detail view for individual campaigns showing all
 * configuration, metrics, and management options.
 */

import React from 'react';
import {
  Page,
  Card,
  Text,
  Badge,
  Button,
  ButtonGroup,
  Stack,
  Box,
  Divider,
  DescriptionList,
  Tabs,
  Banner,
  ProgressBar,
  DataTable,
  Thumbnail,
  EmptyState,
  Spinner,
} from '@shopify/polaris';
import type { CampaignWithConfigs } from '~/domains/campaigns/types/campaign';
import type { CampaignStatus, CampaignGoal, TemplateType } from '~/domains/campaigns/types/campaign';

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
}

interface CampaignMetrics {
  views: number;
  conversions: number;
  conversionRate: number;
  revenue: number;
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
}: CampaignDetailProps) {
  const [selectedTab, setSelectedTab] = React.useState(0);

  // Mock metrics data (in real app, this would come from props or API)
  const metrics: CampaignMetrics = {
    views: 1250,
    conversions: 89,
    conversionRate: 7.12,
    revenue: 2340.50,
    clicks: 156,
    clickRate: 12.48,
  };

  // Helper functions
  const getStatusBadge = (status: CampaignStatus) => {
    const statusConfig = {
      DRAFT: { status: 'info' as const, children: 'Draft' },
      ACTIVE: { status: 'success' as const, children: 'Active' },
      PAUSED: { status: 'warning' as const, children: 'Paused' },
      COMPLETED: { status: 'complete' as const, children: 'Completed' },
    };
    
    return statusConfig[status] || { status: 'info' as const, children: status };
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
    }).format(amount);
  };

  const getTemplateTypeLabel = (templateType: TemplateType) => {
    const labels: Record<TemplateType, string> = {
      NEWSLETTER: 'Newsletter',
      SPIN_TO_WIN: 'Spin to Win',
      FLASH_SALE: 'Flash Sale',
      FREE_SHIPPING: 'Free Shipping',
      EXIT_INTENT: 'Exit Intent',
      CART_ABANDONMENT: 'Cart Abandonment',
      PRODUCT_UPSELL: 'Product Upsell',
      SOCIAL_PROOF: 'Social Proof',
      COUNTDOWN_TIMER: 'Countdown Timer',
      SCRATCH_CARD: 'Scratch Card',
      ANNOUNCEMENT: 'Announcement',
    };
    
    return labels[templateType] || templateType;
  };

  const getGoalLabel = (goal: CampaignGoal) => {
    const labels: Record<CampaignGoal, string> = {
      NEWSLETTER_SIGNUP: 'Newsletter Signup',
      INCREASE_REVENUE: 'Increase Revenue',
      ENGAGEMENT: 'Engagement',
    };
    
    return labels[goal] || goal;
  };

  // Loading state
  if (loading) {
    return (
      <Page>
        <Card>
          <Box padding="800">
            <Stack alignment="center">
              <Spinner size="large" />
              <Text variant="bodyMd" as="p">Loading campaign details...</Text>
            </Stack>
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
              content: 'Go back',
              onAction: onBack,
            }}
            image="https://cdn.shopify.com/s/files/1/0262/4071/2726/files/emptystate-files.png"
          >
            <p>The campaign you're looking for doesn't exist or has been deleted.</p>
          </EmptyState>
        </Card>
      </Page>
    );
  }

  const statusBadge = getStatusBadge(campaign.status as CampaignStatus);
  const isActive = campaign.status === 'ACTIVE';
  const isDraft = campaign.status === 'DRAFT';

  // Page actions
  const primaryAction = onEdit ? {
    content: 'Edit Campaign',
    onAction: onEdit,
  } : undefined;

  const secondaryActions = [
    ...(onToggleStatus ? [{
      content: isActive ? 'Pause Campaign' : 'Activate Campaign',
      onAction: onToggleStatus,
      destructive: isActive,
    }] : []),
    ...(onDuplicate ? [{
      content: 'Duplicate',
      onAction: onDuplicate,
    }] : []),
    ...(onDelete ? [{
      content: 'Delete',
      onAction: onDelete,
      destructive: true,
    }] : []),
  ];

  // Tab content
  const tabs = [
    {
      id: 'overview',
      content: 'Overview',
      panelID: 'overview-panel',
    },
    {
      id: 'configuration',
      content: 'Configuration',
      panelID: 'configuration-panel',
    },
    {
      id: 'metrics',
      content: 'Metrics',
      panelID: 'metrics-panel',
    },
    {
      id: 'history',
      content: 'History',
      panelID: 'history-panel',
    },
  ];

  // Overview tab content
  const overviewContent = (
    <Stack vertical spacing="loose">
      {/* Status Banner */}
      {isDraft && (
        <Banner status="info">
          <p>This campaign is in draft mode. Activate it to start showing to customers.</p>
        </Banner>
      )}

      {isActive && (
        <Banner status="success">
          <p>This campaign is currently active and showing to customers.</p>
        </Banner>
      )}

      {/* Basic Information */}
      <Card>
        <Box padding="400">
          <Stack vertical spacing="loose">
            <Text variant="headingMd" as="h3">Basic Information</Text>
            <Divider />

            <DescriptionList
              items={[
                {
                  term: 'Campaign Name',
                  description: campaign.name,
                },
                {
                  term: 'Description',
                  description: campaign.description || 'No description provided',
                },
                {
                  term: 'Goal',
                  description: getGoalLabel(campaign.goal as CampaignGoal),
                },
                {
                  term: 'Template Type',
                  description: getTemplateTypeLabel(campaign.templateType as TemplateType),
                },
                {
                  term: 'Priority',
                  description: campaign.priority?.toString() || 'Not set',
                },
                {
                  term: 'Status',
                  description: <Badge {...statusBadge} />,
                },
                {
                  term: 'Created',
                  description: formatDate(campaign.createdAt),
                },
                {
                  term: 'Last Updated',
                  description: formatDate(campaign.updatedAt),
                },
              ]}
            />
          </Stack>
        </Box>
      </Card>

      {/* Quick Metrics */}
      <Card>
        <Box padding="400">
          <Stack vertical spacing="loose">
            <Text variant="headingMd" as="h3">Performance Summary</Text>
            <Divider />

            <Stack distribution="fillEvenly">
              <Stack vertical spacing="tight" alignment="center">
                <Text variant="headingLg" as="p">{metrics.views.toLocaleString()}</Text>
                <Text variant="bodySm" color="subdued" as="p">Views</Text>
              </Stack>

              <Stack vertical spacing="tight" alignment="center">
                <Text variant="headingLg" as="p">{metrics.conversions}</Text>
                <Text variant="bodySm" color="subdued" as="p">Conversions</Text>
              </Stack>

              <Stack vertical spacing="tight" alignment="center">
                <Text variant="headingLg" as="p">{metrics.conversionRate.toFixed(2)}%</Text>
                <Text variant="bodySm" color="subdued" as="p">Conversion Rate</Text>
              </Stack>

              <Stack vertical spacing="tight" alignment="center">
                <Text variant="headingLg" as="p">{formatCurrency(metrics.revenue)}</Text>
                <Text variant="bodySm" color="subdued" as="p">Revenue</Text>
              </Stack>
            </Stack>
          </Stack>
        </Box>
      </Card>
    </Stack>
  );

  // Configuration tab content
  const configurationContent = (
    <Stack vertical spacing="loose">
      {/* Content Configuration */}
      <Card>
        <Box padding="400">
          <Stack vertical spacing="loose">
            <Text variant="headingMd" as="h3">Content Configuration</Text>
            <Divider />

            <Box padding="400" background="bg-surface-secondary">
              <Text variant="bodyMd" as="pre" fontFamily="monospace">
                {JSON.stringify(campaign.contentConfig, null, 2)}
              </Text>
            </Box>
          </Stack>
        </Box>
      </Card>

      {/* Design Configuration */}
      <Card>
        <Box padding="400">
          <Stack vertical spacing="loose">
            <Text variant="headingMd" as="h3">Design Configuration</Text>
            <Divider />

            <Box padding="400" background="bg-surface-secondary">
              <Text variant="bodyMd" as="pre" fontFamily="monospace">
                {JSON.stringify(campaign.designConfig, null, 2)}
              </Text>
            </Box>
          </Stack>
        </Box>
      </Card>

      {/* Targeting Rules */}
      <Card>
        <Box padding="400">
          <Stack vertical spacing="loose">
            <Text variant="headingMd" as="h3">Targeting Rules</Text>
            <Divider />

            <Box padding="400" background="bg-surface-secondary">
              <Text variant="bodyMd" as="pre" fontFamily="monospace">
                {JSON.stringify(campaign.targetRules, null, 2)}
              </Text>
            </Box>
          </Stack>
        </Box>
      </Card>

      {/* Discount Configuration */}
      <Card>
        <Box padding="400">
          <Stack vertical spacing="loose">
            <Text variant="headingMd" as="h3">Discount Configuration</Text>
            <Divider />

            <Box padding="400" background="bg-surface-secondary">
              <Text variant="bodyMd" as="pre" fontFamily="monospace">
                {JSON.stringify(campaign.discountConfig, null, 2)}
              </Text>
            </Box>
          </Stack>
        </Box>
      </Card>
    </Stack>
  );

  // Metrics tab content
  const metricsContent = (
    <Stack vertical spacing="loose">
      {/* Performance Metrics */}
      <Card>
        <Box padding="400">
          <Stack vertical spacing="loose">
            <Text variant="headingMd" as="h3">Performance Metrics</Text>
            <Divider />

            <DataTable
              columnContentTypes={['text', 'numeric', 'numeric']}
              headings={['Metric', 'Value', 'Change']}
              rows={[
                ['Total Views', metrics.views.toLocaleString(), '+12.5%'],
                ['Total Conversions', metrics.conversions.toString(), '+8.3%'],
                ['Conversion Rate', `${metrics.conversionRate.toFixed(2)}%`, '+2.1%'],
                ['Total Revenue', formatCurrency(metrics.revenue), '+15.7%'],
                ['Click-through Rate', `${metrics.clickRate.toFixed(2)}%`, '+5.2%'],
                ['Total Clicks', metrics.clicks.toString(), '+9.8%'],
              ]}
            />
          </Stack>
        </Box>
      </Card>

      {/* Conversion Funnel */}
      <Card>
        <Box padding="400">
          <Stack vertical spacing="loose">
            <Text variant="headingMd" as="h3">Conversion Funnel</Text>
            <Divider />

            <Stack vertical spacing="loose">
              <Stack alignment="center" distribution="equalSpacing">
                <Text variant="bodyMd" as="p">Views</Text>
                <Text variant="bodyMd" as="p">{metrics.views.toLocaleString()}</Text>
              </Stack>
              <ProgressBar progress={100} size="small" />

              <Stack alignment="center" distribution="equalSpacing">
                <Text variant="bodyMd" as="p">Clicks</Text>
                <Text variant="bodyMd" as="p">{metrics.clicks}</Text>
              </Stack>
              <ProgressBar progress={(metrics.clicks / metrics.views) * 100} size="small" />

              <Stack alignment="center" distribution="equalSpacing">
                <Text variant="bodyMd" as="p">Conversions</Text>
                <Text variant="bodyMd" as="p">{metrics.conversions}</Text>
              </Stack>
              <ProgressBar progress={(metrics.conversions / metrics.views) * 100} size="small" />
            </Stack>
          </Stack>
        </Box>
      </Card>
    </Stack>
  );

  // History tab content
  const historyContent = (
    <Stack vertical spacing="loose">
      <Card>
        <Box padding="400">
          <Stack vertical spacing="loose">
            <Text variant="headingMd" as="h3">Campaign History</Text>
            <Divider />

            <DataTable
              columnContentTypes={['text', 'text', 'text', 'text']}
              headings={['Date', 'Action', 'User', 'Details']}
              rows={[
                [formatDate(campaign.updatedAt), 'Updated', 'Admin', 'Modified campaign settings'],
                [formatDate(campaign.createdAt), 'Created', 'Admin', 'Campaign created'],
              ]}
            />
          </Stack>
        </Box>
      </Card>
    </Stack>
  );

  // Get current tab content
  const getCurrentTabContent = () => {
    switch (selectedTab) {
      case 0:
        return overviewContent;
      case 1:
        return configurationContent;
      case 2:
        return metricsContent;
      case 3:
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
      <Stack vertical spacing="loose">
        {/* Tabs */}
        <Card>
          <Tabs
            tabs={tabs}
            selected={selectedTab}
            onSelect={setSelectedTab}
          >
            <Box padding="400">
              {getCurrentTabContent()}
            </Box>
          </Tabs>
        </Card>
      </Stack>
    </Page>
  );
}
