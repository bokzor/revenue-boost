import type { LoaderFunctionArgs, ActionFunctionArgs } from "react-router";
import { useLoaderData, useFetcher, useNavigate } from "react-router";
import {
  Page,
  Layout,
  Card,
  Text,
  BlockStack,
  InlineGrid,
  IndexTable,
  Badge,
  useIndexResourceState,
  Button,
  InlineStack,
  Box,
  EmptyState,
  Select,
  Divider,
  Banner,
} from "@shopify/polaris";
import {
  PlusIcon,
  CalendarIcon,
  ChartVerticalFilledIcon,
} from "@shopify/polaris-icons";
import { authenticate } from "../shopify.server";
import { CampaignService } from "~/domains/campaigns";
import { CampaignAnalyticsService } from "~/domains/campaigns/services/campaign-analytics.server";
import { getStoreId } from "~/lib/auth-helpers.server";
import { getStoreCurrency } from "~/lib/currency.server";
import { useState } from "react";

// --- Types ---

interface DashboardMetric {
  label: string;
  value: string;
  subtext?: string;
  tone?: "success" | "critical" | "subdued";
}

interface CampaignDashboardRow {
  [key: string]: string | number;
  id: string;
  name: string;
  status: string;
  templateType: string;
  goal: string;
  views: number;
  conversions: number;
  conversionRate: number;
  revenue: number;
  lastUpdated: string;
}

interface LoaderData {
  globalMetrics: {
    revenue: number;
    leads: number;
    activeCampaigns: number;
    conversionRate: number;
  };
  campaigns: CampaignDashboardRow[];
  currency: string;
  timeRange: string;
  hasCampaigns: boolean;
}

// --- Loader ---

export const loader = async ({ request }: LoaderFunctionArgs) => {
  const { admin } = await authenticate.admin(request);
  const storeId = await getStoreId(request);
  const url = new URL(request.url);
  const timeRange = url.searchParams.get("timeRange") || "30d";

  // 1. Fetch all campaigns
  const allCampaigns = await CampaignService.getAllCampaigns(storeId);
  const hasCampaigns = allCampaigns.length > 0;

  if (!hasCampaigns) {
    const loaderData: LoaderData = {
      globalMetrics: { revenue: 0, leads: 0, activeCampaigns: 0, conversionRate: 0 },
      campaigns: [],
      currency: "USD", // Default
      timeRange,
      hasCampaigns: false,
    };

    return loaderData;
  }

  const campaignIds = allCampaigns.map((c) => c.id);

  // 2. Calculate date range based on timeRange parameter
  let dateFrom: Date | undefined;
  const now = new Date();
  if (timeRange === "7d") {
    dateFrom = new Date(now.setDate(now.getDate() - 7));
  } else if (timeRange === "30d") {
    dateFrom = new Date(now.setDate(now.getDate() - 30));
  }
  // "all" -> dateFrom undefined (fetches all time)

  // 3. Fetch Analytics Data with date filtering
  const [statsMap, revenueMap, currency] = await Promise.all([
    CampaignAnalyticsService.getCampaignStats(campaignIds, { from: dateFrom }),
    CampaignAnalyticsService.getRevenueBreakdownByCampaignIds(campaignIds, { from: dateFrom }),
    getStoreCurrency(admin),
  ]);

  // 4. Aggregate Global Metrics
  let totalRevenue = 0;
  let totalLeads = 0;
  let totalImpressions = 0;
  let activeCampaignsCount = 0;

  const campaignsData: CampaignDashboardRow[] = allCampaigns.map((campaign) => {
    const stats = statsMap.get(campaign.id);
    const revenueStats = revenueMap.get(campaign.id);

    const views = stats?.impressions || 0;
    const leads = stats?.leadCount || 0;
    const revenue = revenueStats?.revenue || 0;

    if (campaign.status === "ACTIVE") {
      activeCampaignsCount++;
    }

    totalRevenue += revenue;
    totalLeads += leads;
    totalImpressions += views;

    return {
      id: campaign.id,
      name: campaign.name,
      status: campaign.status,
      templateType: campaign.templateType,
      goal: campaign.goal,
      views,
      conversions: leads, // Or orders if goal is revenue? For now leads is safe default for "conversions" column
      conversionRate: stats?.conversionRate || 0,
      revenue,
      lastUpdated: new Date(campaign.updatedAt).toLocaleDateString(),
    };
  });

  const globalConversionRate = totalImpressions > 0
    ? (totalLeads / totalImpressions) * 100
    : 0;

  const loaderData: LoaderData = {
    globalMetrics: {
      revenue: totalRevenue,
      leads: totalLeads,
      activeCampaigns: activeCampaignsCount,
      conversionRate: globalConversionRate,
    },
    campaigns: campaignsData,
    currency,
    timeRange,
    hasCampaigns: true,
  };

  return loaderData;
};

// --- Action ---

export const action = async ({ request }: ActionFunctionArgs) => {
  const { admin } = await authenticate.admin(request);
  const storeId = await getStoreId(request);
  const formData = await request.formData();
  const intent = formData.get("intent");

  if (intent === "toggle_status") {
    const campaignId = formData.get("campaignId") as string;
    const currentStatus = formData.get("currentStatus") as string;
    const newStatus = currentStatus === "ACTIVE" ? "PAUSED" : "ACTIVE";

    await CampaignService.updateCampaign(campaignId, storeId, { status: newStatus as any }, admin);
    return { success: true };
  }

  return null;
};

// --- Components ---

function GlobalMetricCard({ title, value, subtext }: { title: string; value: string; subtext?: string }) {
  return (
    <Card>
      <BlockStack gap="200">
        <Text as="h3" variant="headingSm" tone="subdued">
          {title}
        </Text>
        <Text as="p" variant="headingLg">
          {value}
        </Text>
        {subtext && (
          <Text as="span" tone="subdued" variant="bodySm">
            {subtext}
          </Text>
        )}
      </BlockStack>
    </Card>
  );
}

function TemplateTile({
  title,
  description,
  icon: Icon,
  onSelect
}: {
  title: string;
  description: string;
  icon: any;
  onSelect: () => void
}) {
  return (
    <Card>
      <BlockStack gap="400">
        <InlineStack align="space-between">
          <Box background="bg-surface-secondary" padding="200" borderRadius="200">
            <Icon width={24} />
          </Box>
        </InlineStack>
        <BlockStack gap="200">
          <Text as="h3" variant="headingMd">{title}</Text>
          <Text as="p" tone="subdued">{description}</Text>
        </BlockStack>
        <Button onClick={onSelect} variant="primary">Use this template</Button>
      </BlockStack>
    </Card>
  );
}

export default function Dashboard() {
  const { globalMetrics, campaigns, currency, timeRange, hasCampaigns } = useLoaderData<typeof loader>();
  const navigate = useNavigate();
  const fetcher = useFetcher();

  const formatMoney = (amount: number) => {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: currency,
      maximumFractionDigits: 0,
    }).format(amount);
  };

  // --- State for Filters ---
  const [statusFilter, setStatusFilter] = useState("ALL");

  const filteredCampaigns = campaigns.filter(c => {
    if (statusFilter === "ALL") return true;
    return c.status === statusFilter;
  });

  // --- Table Resource State ---
  const resourceName = {
    singular: 'campaign',
    plural: 'campaigns',
  };

  const { selectedResources, allResourcesSelected, handleSelectionChange } =
    useIndexResourceState(filteredCampaigns);

  // --- Handlers ---
  const handleCreateCampaign = () => {
    navigate("/app/campaigns/new");
  };

  const handleTimeRangeChange = (value: string) => {
    // Reload with new time range
    // In a real app with date filtering, this would trigger a reload
    navigate(`?timeRange=${value}`);
  };

  const handleToggleStatus = (id: string, currentStatus: string) => {
    fetcher.submit(
      { intent: "toggle_status", campaignId: id, currentStatus },
      { method: "post" }
    );
  };

  // --- Zero State ---
  if (!hasCampaigns) {
    return (
      <Page title="Dashboard">
        <Layout>
          <Layout.Section>
            <EmptyState
              heading="Start turning visitors into customers"
              action={{
                content: "Create your first campaign",
                onAction: handleCreateCampaign,
              }}
              image="https://cdn.shopify.com/s/files/1/0262/4071/2726/files/emptystate-files.png"
            >
              <p>
                Revenue Boost helps you capture leads and increase sales with high-converting popups.
                Choose a template to get started in minutes.
              </p>
            </EmptyState>
          </Layout.Section>
          <Layout.Section>
            <Text as="h2" variant="headingMd">Quick Start Templates</Text>
            <Box paddingBlockStart="400">
              <InlineGrid columns={{ xs: 1, sm: 1, md: 2, lg: 3 }} gap="400">
                <TemplateTile
                  title="Newsletter Signup"
                  description="Grow your email list with a classic popup."
                  icon={CalendarIcon} // Placeholder icon
                  onSelect={() => navigate("/app/campaigns/new?template=NEWSLETTER")}
                />
                <TemplateTile
                  title="Discount Popup"
                  description="Offer a discount to convert visitors."
                  icon={ChartVerticalFilledIcon} // Placeholder icon
                  onSelect={() => navigate("/app/campaigns/new?template=DISCOUNT")}
                />
                <TemplateTile
                  title="Spin to Win"
                  description="Gamify your offers to boost engagement."
                  icon={ChartVerticalFilledIcon} // Placeholder icon
                  onSelect={() => navigate("/app/campaigns/new?template=SPIN_TO_WIN")}
                />
              </InlineGrid>
            </Box>
          </Layout.Section>
        </Layout>
      </Page>
    );
  }

  // --- Main Dashboard ---
  return (
    <Page
      title="Dashboard"
      primaryAction={{
        content: "Create campaign",
        onAction: handleCreateCampaign,
        icon: PlusIcon,
      }}
      secondaryActions={
        <Select
          label="Time range"
          labelHidden
          options={[
            { label: "Last 7 days", value: "7d" },
            { label: "Last 30 days", value: "30d" },
            { label: "All time", value: "all" },
          ]}
          value={timeRange}
          onChange={handleTimeRangeChange}
        />
      }
    >
      <Layout>
        {/* Global Metrics */}
        <Layout.Section>
          <InlineGrid columns={{ xs: 1, sm: 2, md: 4 }} gap="400">
            <GlobalMetricCard
              title="Revenue attributed"
              value={formatMoney(globalMetrics.revenue)}
              subtext="Total revenue from campaigns"
            />
            <GlobalMetricCard
              title="Leads captured"
              value={globalMetrics.leads.toLocaleString()}
              subtext="Total signups"
            />
            <GlobalMetricCard
              title="Active campaigns"
              value={globalMetrics.activeCampaigns.toString()}
              subtext="Currently running"
            />
            <GlobalMetricCard
              title="Conversion rate"
              value={`${globalMetrics.conversionRate.toFixed(1)}%`}
              subtext="Visits to conversions"
            />
          </InlineGrid>
        </Layout.Section>

        {/* Active Campaigns Table */}
        <Layout.Section>
          <Card padding="0">
            <Box padding="400">
              <InlineStack align="space-between" blockAlign="center">
                <Text as="h2" variant="headingMd">Active campaigns</Text>
                <InlineStack gap="200">
                  <Button
                    variant={statusFilter === "ALL" ? "primary" : "tertiary"}
                    onClick={() => setStatusFilter("ALL")}
                    size="micro"
                  >
                    All
                  </Button>
                  <Button
                    variant={statusFilter === "ACTIVE" ? "primary" : "tertiary"}
                    onClick={() => setStatusFilter("ACTIVE")}
                    size="micro"
                  >
                    Active
                  </Button>
                  <Button
                    variant={statusFilter === "DRAFT" ? "primary" : "tertiary"}
                    onClick={() => setStatusFilter("DRAFT")}
                    size="micro"
                  >
                    Draft
                  </Button>
                  <Button
                    variant={statusFilter === "PAUSED" ? "primary" : "tertiary"}
                    onClick={() => setStatusFilter("PAUSED")}
                    size="micro"
                  >
                    Paused
                  </Button>
                </InlineStack>
              </InlineStack>
            </Box>

            {filteredCampaigns.length === 0 ? (
              <Box padding="400">
                <EmptyState
                  heading="No campaigns found"
                  image=""
                >
                  <p>Try changing the filters or create a new campaign.</p>
                </EmptyState>
              </Box>
            ) : (
              <IndexTable
                resourceName={resourceName}
                itemCount={filteredCampaigns.length}
                selectedItemsCount={
                  allResourcesSelected ? 'All' : selectedResources.length
                }
                onSelectionChange={handleSelectionChange}
                headings={[
                  { title: 'Campaign' },
                  { title: 'Status' },
                  { title: 'Goal' },
                  { title: 'Views' },
                  { title: 'Conversions' },
                  { title: 'Conv. Rate' },
                  { title: 'Revenue' },
                  { title: 'Actions' },
                ]}
              >
                {filteredCampaigns.map(
                  ({ id, name, status, templateType, goal, views, conversions, conversionRate, revenue }, index) => (
                    <IndexTable.Row
                      id={id}
                      key={id}
                      selected={selectedResources.includes(id)}
                      position={index}
                    >
                      <IndexTable.Cell>
                        <Text as="span" fontWeight="bold">{name}</Text>
                        <Box>
                          <Text as="span" tone="subdued" variant="bodySm">{templateType.replace(/_/g, " ")}</Text>
                        </Box>
                      </IndexTable.Cell>
                      <IndexTable.Cell>
                        <Badge tone={status === "ACTIVE" ? "success" : status === "PAUSED" ? "warning" : "info"}>
                          {status}
                        </Badge>
                      </IndexTable.Cell>
                      <IndexTable.Cell>{goal.replace(/_/g, " ")}</IndexTable.Cell>
                      <IndexTable.Cell>{views.toLocaleString()}</IndexTable.Cell>
                      <IndexTable.Cell>{conversions.toLocaleString()}</IndexTable.Cell>
                      <IndexTable.Cell>{conversionRate.toFixed(1)}%</IndexTable.Cell>
                      <IndexTable.Cell>{formatMoney(revenue)}</IndexTable.Cell>
                      <IndexTable.Cell>
                        <InlineStack gap="200">
                          <Button size="micro" onClick={() => navigate(`/app/campaigns/${id}/edit`)}>Edit</Button>
                          <Button size="micro" onClick={() => handleToggleStatus(id, status)}>
                            {status === "ACTIVE" ? "Pause" : "Activate"}
                          </Button>
                        </InlineStack>
                      </IndexTable.Cell>
                    </IndexTable.Row>
                  ),
                )}
              </IndexTable>
            )}
          </Card>
        </Layout.Section>

        {/* Template Quick Start (Bottom) */}
        <Layout.Section>
          <Text as="h2" variant="headingMd">Start a new campaign</Text>
          <Box paddingBlockStart="400">
            <InlineGrid columns={{ xs: 1, sm: 1, md: 2, lg: 3 }} gap="400">
              <TemplateTile
                title="Newsletter Signup"
                description="Grow your email list with a classic popup."
                icon={CalendarIcon}
                onSelect={() => navigate("/app/campaigns/new?template=NEWSLETTER")}
              />
              <TemplateTile
                title="Discount Popup"
                description="Offer a discount to convert visitors."
                icon={ChartVerticalFilledIcon}
                onSelect={() => navigate("/app/campaigns/new?template=DISCOUNT")}
              />
              <TemplateTile
                title="Spin to Win"
                description="Gamify your offers to boost engagement."
                icon={ChartVerticalFilledIcon}
                onSelect={() => navigate("/app/campaigns/new?template=SPIN_TO_WIN")}
              />
            </InlineGrid>
          </Box>
        </Layout.Section>
      </Layout>
    </Page>
  );
}
