/**
 * Global Analytics Page
 *
 * Displays store-wide analytics with lazy loading for fast navigation.
 * Uses useFetcher hooks to load data progressively with skeleton states.
 */

import { useEffect } from "react";
import { useLoaderData, useFetcher, useSearchParams, useNavigate } from "react-router";
import { data, type LoaderFunctionArgs } from "react-router";
import {
  Page,
  Layout,
  Card,
  Text,
  BlockStack,
  InlineGrid,
  InlineStack,
  Select,
  Box,
  Badge,
  SkeletonBodyText,
  SkeletonDisplayText,
  DataTable,
  Icon,
} from "@shopify/polaris";
import { ArrowUpIcon, ArrowDownIcon } from "@shopify/polaris-icons";
import { PolarisVizProvider, BarChart } from "@shopify/polaris-viz";
import "@shopify/polaris-viz/build/esm/styles.css";
import { authenticate } from "~/shopify.server";
import { getStoreCurrency } from "~/lib/currency.server";
import type {
  GlobalMetricsWithComparison,
  CampaignRanking,
  TemplatePerformance,
} from "~/domains/campaigns/services/campaign-analytics.server";

// ============================================================================
// LOADER - Minimal, just auth + currency for instant navigation
// ============================================================================

export async function loader({ request }: LoaderFunctionArgs) {
  const { admin } = await authenticate.admin(request);
  const currency = await getStoreCurrency(admin);
  return data({ currency });
}

// ============================================================================
// TYPES
// ============================================================================

interface SummaryData {
  success: boolean;
  data: GlobalMetricsWithComparison;
}

interface DailyData {
  success: boolean;
  data: {
    dailyMetrics: Array<{ date: string; impressions: number; leads: number; revenue: number }>;
  };
}

interface CampaignsData {
  success: boolean;
  data: { rankings: CampaignRanking[] };
}

interface TemplatesData {
  success: boolean;
  data: { templatePerformance: TemplatePerformance[] };
}

// ============================================================================
// HELPERS
// ============================================================================

const formatMoney = (amount: number, currency: string = "USD") => {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency,
    maximumFractionDigits: 0,
  }).format(amount);
};

const formatNumber = (num: number) => {
  if (num >= 1000000) return `${(num / 1000000).toFixed(1)}M`;
  if (num >= 1000) return `${(num / 1000).toFixed(1)}K`;
  return num.toLocaleString();
};

const formatPercent = (num: number) => `${num.toFixed(1)}%`;

const formatTemplateType = (type: string) => {
  return type
    .split("_")
    .map((word) => word.charAt(0) + word.slice(1).toLowerCase())
    .join(" ");
};

// ============================================================================
// SKELETON COMPONENTS
// ============================================================================

function SummaryCardsSkeleton() {
  return (
    <InlineGrid columns={{ xs: 1, sm: 2, md: 4 }} gap="400">
      {[1, 2, 3, 4].map((i) => (
        <Card key={i}>
          <BlockStack gap="200">
            <SkeletonBodyText lines={1} />
            <SkeletonDisplayText size="medium" />
            <SkeletonBodyText lines={1} />
          </BlockStack>
        </Card>
      ))}
    </InlineGrid>
  );
}

function ChartSkeleton() {
  return (
    <Card>
      <BlockStack gap="400">
        <SkeletonDisplayText size="small" />
        <Box padding="400" background="bg-surface-secondary" borderRadius="200" minHeight="300px" />
      </BlockStack>
    </Card>
  );
}

function TableSkeleton({ rows = 5 }: { rows?: number }) {
  return (
    <Card>
      <BlockStack gap="400">
        <SkeletonDisplayText size="small" />
        <BlockStack gap="300">
          {Array.from({ length: rows }).map((_, i) => (
            <SkeletonBodyText key={i} lines={1} />
          ))}
        </BlockStack>
      </BlockStack>
    </Card>
  );
}

// ============================================================================
// DATA COMPONENTS
// ============================================================================

function MetricCard({
  title,
  value,
  change,
  subtext,
}: {
  title: string;
  value: string;
  change?: number;
  subtext?: string;
}) {
  const isPositive = change !== undefined && change >= 0;
  const changeColor = isPositive ? "success" : "critical";

  return (
    <Card>
      <BlockStack gap="200">
        <Text as="h3" variant="headingSm" tone="subdued">
          {title}
        </Text>
        <Text as="p" variant="headingLg">
          {value}
        </Text>
        <InlineStack gap="100" align="start">
          {change !== undefined && (
            <InlineStack gap="050" align="center">
              <Icon source={isPositive ? ArrowUpIcon : ArrowDownIcon} tone={changeColor} />
              <Text as="span" tone={changeColor} variant="bodySm">
                {Math.abs(change).toFixed(1)}%
              </Text>
            </InlineStack>
          )}
          {subtext && (
            <Text as="span" tone="subdued" variant="bodySm">
              {subtext}
            </Text>
          )}
        </InlineStack>
      </BlockStack>
    </Card>
  );
}

function SummaryCards({ data, currency }: { data: SummaryData | undefined; currency: string }) {
  if (!data?.data) return <SummaryCardsSkeleton />;

  const { current, changes } = data.data;

  return (
    <InlineGrid columns={{ xs: 1, sm: 2, md: 4 }} gap="400">
      <MetricCard
        title="Total Revenue"
        value={formatMoney(current.totalRevenue, currency)}
        change={changes.revenue}
        subtext="vs previous period"
      />
      <MetricCard
        title="Leads Captured"
        value={formatNumber(current.totalLeads)}
        change={changes.leads}
        subtext="vs previous period"
      />
      <MetricCard
        title="Impressions"
        value={formatNumber(current.totalImpressions)}
        change={changes.impressions}
        subtext="vs previous period"
      />
      <MetricCard
        title="Conversion Rate"
        value={formatPercent(current.avgConversionRate)}
        change={changes.conversionRate}
        subtext="vs previous period"
      />
    </InlineGrid>
  );
}

function RevenueChart({
  data: fetcherData,
  currency,
}: {
  data: DailyData | undefined;
  currency: string;
}) {
  if (!fetcherData?.data?.dailyMetrics) return <ChartSkeleton />;

  const metrics = fetcherData.data.dailyMetrics;

  if (metrics.length === 0) {
    return (
      <Card>
        <BlockStack gap="400">
          <Text as="h2" variant="headingMd">
            Revenue Over Time
          </Text>
          <Box padding="800">
            <Text as="p" tone="subdued" alignment="center">
              No data available for this period
            </Text>
          </Box>
        </BlockStack>
      </Card>
    );
  }

  // Transform data for Polaris Viz BarChart
  const chartData = [
    {
      name: "Revenue",
      data: metrics.map((day) => ({
        key: day.date,
        value: day.revenue,
      })),
    },
  ];

  return (
    <Card>
      <BlockStack gap="400">
        <Text as="h2" variant="headingMd">
          Revenue Over Time
        </Text>
        <PolarisVizProvider>
          <div style={{ height: "250px" }}>
            <BarChart
              data={chartData}
              xAxisOptions={{
                labelFormatter: (value) => {
                  const date = new Date(value);
                  return date.toLocaleDateString("en-US", { month: "short", day: "numeric" });
                },
              }}
              yAxisOptions={{
                labelFormatter: (value) => formatMoney(Number(value), currency),
              }}
            />
          </div>
        </PolarisVizProvider>
      </BlockStack>
    </Card>
  );
}

function CampaignRankingsTable({
  data,
  currency,
  onCampaignClick,
}: {
  data: CampaignsData | undefined;
  currency: string;
  onCampaignClick: (id: string) => void;
}) {
  if (!data?.data?.rankings) return <TableSkeleton rows={5} />;

  const rankings = data.data.rankings;

  if (rankings.length === 0) {
    return (
      <Card>
        <BlockStack gap="400">
          <Text as="h2" variant="headingMd">
            Campaign Performance
          </Text>
          <Box padding="800">
            <Text as="p" tone="subdued" alignment="center">
              No campaigns found
            </Text>
          </Box>
        </BlockStack>
      </Card>
    );
  }

  const rows = rankings.map((campaign, index) => [
    <InlineStack key={campaign.id} gap="200" align="center" wrap={false}>
      {index === 0 && <Badge tone="success">Top</Badge>}
      <button
        onClick={() => onCampaignClick(campaign.id)}
        style={{
          background: "none",
          border: "none",
          padding: 0,
          cursor: "pointer",
          color: "#2563eb",
          textDecoration: "underline",
          textAlign: "left",
        }}
      >
        {campaign.name}
      </button>
    </InlineStack>,
    <Badge key={`type-${campaign.id}`} tone="info">
      {formatTemplateType(campaign.templateType)}
    </Badge>,
    formatNumber(campaign.impressions),
    formatNumber(campaign.leads),
    formatPercent(campaign.conversionRate),
    formatMoney(campaign.revenue, currency),
  ]);

  return (
    <Card>
      <BlockStack gap="400">
        <Text as="h2" variant="headingMd">
          Campaign Performance
        </Text>
        <DataTable
          columnContentTypes={["text", "text", "numeric", "numeric", "numeric", "numeric"]}
          headings={["Campaign", "Type", "Impressions", "Leads", "Conv. Rate", "Revenue"]}
          rows={rows}
          hoverable
        />
      </BlockStack>
    </Card>
  );
}

function TemplatePerformanceTable({
  data,
  currency,
}: {
  data: TemplatesData | undefined;
  currency: string;
}) {
  if (!data?.data?.templatePerformance) return <TableSkeleton rows={4} />;

  const templates = data.data.templatePerformance;

  if (templates.length === 0) {
    return (
      <Card>
        <BlockStack gap="400">
          <Text as="h2" variant="headingMd">
            Performance by Template Type
          </Text>
          <Box padding="800">
            <Text as="p" tone="subdued" alignment="center">
              No template data available
            </Text>
          </Box>
        </BlockStack>
      </Card>
    );
  }

  const rows = templates.map((template) => [
    formatTemplateType(template.templateType),
    template.campaignCount.toString(),
    formatNumber(template.totalImpressions),
    formatNumber(template.totalLeads),
    formatPercent(template.avgConversionRate),
    formatMoney(template.totalRevenue, currency),
  ]);

  return (
    <Card>
      <BlockStack gap="400">
        <Text as="h2" variant="headingMd">
          Performance by Template Type
        </Text>
        <DataTable
          columnContentTypes={["text", "numeric", "numeric", "numeric", "numeric", "numeric"]}
          headings={["Template", "Campaigns", "Impressions", "Leads", "Avg Conv.", "Revenue"]}
          rows={rows}
          hoverable
        />
      </BlockStack>
    </Card>
  );
}

// ============================================================================
// MAIN COMPONENT
// ============================================================================

export default function AnalyticsPage() {
  const { currency } = useLoaderData<typeof loader>();
  const [searchParams, setSearchParams] = useSearchParams();
  const navigate = useNavigate();
  const timeRange = searchParams.get("timeRange") || "30d";

  // Separate fetchers for each section - enables parallel loading
  const summaryFetcher = useFetcher<SummaryData>();
  const dailyFetcher = useFetcher<DailyData>();
  const campaignsFetcher = useFetcher<CampaignsData>();
  const templatesFetcher = useFetcher<TemplatesData>();

  // Trigger all fetches on mount and when timeRange changes
  useEffect(() => {
    const params = `?timeRange=${timeRange}`;
    summaryFetcher.load(`/api/analytics/summary${params}`);
    dailyFetcher.load(`/api/analytics/daily${params}`);
    campaignsFetcher.load(`/api/analytics/campaigns${params}`);
    templatesFetcher.load(`/api/analytics/templates${params}`);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [timeRange]);

  const handleTimeRangeChange = (value: string) => {
    setSearchParams({ timeRange: value });
  };

  const handleCampaignClick = (id: string) => {
    navigate(`/app/campaigns/${id}/analytics`);
  };

  // Check if any fetcher is still loading
  const isLoading =
    summaryFetcher.state === "loading" ||
    dailyFetcher.state === "loading" ||
    campaignsFetcher.state === "loading" ||
    templatesFetcher.state === "loading";

  return (
    <Page
      title="Analytics"
      subtitle={isLoading ? "Loading..." : undefined}
      secondaryActions={
        <Select
          label="Time range"
          labelHidden
          options={[
            { label: "Last 7 days", value: "7d" },
            { label: "Last 30 days", value: "30d" },
            { label: "Last 90 days", value: "90d" },
          ]}
          value={timeRange}
          onChange={handleTimeRangeChange}
        />
      }
    >
      <Layout>
        {/* Summary Cards */}
        <Layout.Section>
          <SummaryCards data={summaryFetcher.data} currency={currency} />
        </Layout.Section>

        {/* Revenue Chart */}
        <Layout.Section>
          <RevenueChart data={dailyFetcher.data} currency={currency} />
        </Layout.Section>

        {/* Campaign Rankings */}
        <Layout.Section>
          <CampaignRankingsTable
            data={campaignsFetcher.data}
            currency={currency}
            onCampaignClick={handleCampaignClick}
          />
        </Layout.Section>

        {/* Template Performance */}
        <Layout.Section>
          <TemplatePerformanceTable data={templatesFetcher.data} currency={currency} />
        </Layout.Section>
      </Layout>
    </Page>
  );
}
