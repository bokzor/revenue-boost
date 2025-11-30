import type { LoaderFunctionArgs, ActionFunctionArgs } from "react-router";
import { useLoaderData, useFetcher, useNavigate, data } from "react-router";
import {
  Page,
  Layout,
  Card,
  Text,
  BlockStack,
  InlineGrid,
  Button,
  InlineStack,
  Box,
  EmptyState,
  Select,
} from "@shopify/polaris";
import { PlusIcon, CalendarIcon, ChartVerticalFilledIcon } from "@shopify/polaris-icons";
import { authenticate } from "../shopify.server";
import { CampaignService, ExperimentService } from "~/domains/campaigns";
import { CampaignIndexTable } from "~/domains/campaigns/components";
import { CampaignAnalyticsService } from "~/domains/campaigns/services/campaign-analytics.server";
import { getStoreId } from "~/lib/auth-helpers.server";
import { getStoreCurrency } from "~/lib/currency.server";
import { useState, useEffect } from "react";
import type { ExperimentWithVariants } from "~/domains/campaigns/types/experiment";
import type { CampaignStatus } from "~/domains/campaigns/types/campaign";
import { SetupStatus, type SetupStatusData } from "~/domains/setup/components/SetupStatus";
import { getSetupStatus } from "~/lib/setup-status.server";
import { PostBillingReviewTrigger } from "~/domains/reviews";
import { BillingService } from "~/domains/billing/index.server";

// --- Types ---

interface CampaignDashboardRow {
  [key: string]: string | number | null | boolean | undefined;
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
  // Experiment fields for grouping
  experimentId?: string | null;
  variantKey?: string | null;
  isControl?: boolean;
}

interface LoaderData {
  globalMetrics: {
    revenue: number;
    leads: number;
    activeCampaigns: number;
    conversionRate: number;
  };
  campaigns: CampaignDashboardRow[];
  experiments: ExperimentWithVariants[];
  currency: string;
  timeRange: string;
  hasCampaigns: boolean;
  setupStatus?: SetupStatusData;
  setupComplete?: boolean;
  themeEditorUrl?: string;
  // Review trigger data
  chargeId: string | null;
  recentUpgrade: {
    fromPlan: string;
    toPlan: string;
    createdAt: string;
  } | null;
}

// --- Loader ---

export const loader = async ({ request }: LoaderFunctionArgs) => {
  const { admin, session } = await authenticate.admin(request);
  const storeId = await getStoreId(request);
  const url = new URL(request.url);
  const timeRange = url.searchParams.get("timeRange") || "30d";

  // Check for post-billing redirect (charge_id present after successful payment)
  const chargeId = url.searchParams.get("charge_id");
  let recentUpgrade: LoaderData["recentUpgrade"] = null;

  if (chargeId) {
    // If we have a charge_id, check current billing status to confirm upgrade
    try {
      const billingContext = await BillingService.getBillingContextFromDbByDomain(session.shop);
      if (billingContext && billingContext.planTier !== "FREE" && billingContext.hasActiveSubscription) {
        // We have an active paid subscription - this is likely a recent upgrade
        recentUpgrade = {
          fromPlan: "FREE", // We don't track previous plan, assume upgrade from FREE
          toPlan: billingContext.planTier,
          createdAt: new Date().toISOString(),
        };
        console.log("[Dashboard] Detected post-billing upgrade:", recentUpgrade);
      }
    } catch (error) {
      console.error("[Dashboard] Error checking billing context:", error);
    }
  }

  // Check setup status using shared utility
  const { status: setupStatus, setupComplete } = await getSetupStatus(
    session.shop,
    session.accessToken || "",
    admin
  );
  const themeEditorUrl = `https://${session.shop}/admin/themes/current/editor?context=apps`;

  // 1. Fetch all campaigns
  const allCampaigns = await CampaignService.getAllCampaigns(storeId);
  const hasCampaigns = allCampaigns.length > 0;

  if (!hasCampaigns) {
    const loaderData: LoaderData = {
      globalMetrics: { revenue: 0, leads: 0, activeCampaigns: 0, conversionRate: 0 },
      campaigns: [],
      experiments: [],
      currency: "USD", // Default
      timeRange,
      hasCampaigns: false,
      setupStatus,
      setupComplete,
      themeEditorUrl,
      chargeId,
      recentUpgrade,
    };

    return loaderData;
  }

  // 1.5. Fetch experiments for campaigns
  const experimentIds = Array.from(
    new Set(allCampaigns.map((c) => c.experimentId).filter((id): id is string => Boolean(id)))
  );

  let experiments: ExperimentWithVariants[] = [];
  if (experimentIds.length > 0) {
    experiments = await ExperimentService.getExperimentsByIds(storeId, experimentIds);
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
      // Include experiment fields for grouping
      experimentId: campaign.experimentId,
      variantKey: campaign.variantKey,
      isControl: campaign.isControl,
    };
  });

  const globalConversionRate = totalImpressions > 0 ? (totalLeads / totalImpressions) * 100 : 0;

  const loaderData: LoaderData = {
    globalMetrics: {
      revenue: totalRevenue,
      leads: totalLeads,
      activeCampaigns: activeCampaignsCount,
      conversionRate: globalConversionRate,
    },
    campaigns: campaignsData,
    experiments,
    currency,
    timeRange,
    hasCampaigns: true,
    setupStatus,
    setupComplete,
    themeEditorUrl,
    chargeId,
    recentUpgrade,
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

    await CampaignService.updateCampaign(campaignId, storeId, { status: newStatus as CampaignStatus }, admin);
    return data({ success: true });
  }

  if (intent === "bulk_activate") {
    const campaignIds = JSON.parse(formData.get("campaignIds") as string);
    const results = await Promise.allSettled(
      campaignIds.map((id: string) =>
        CampaignService.updateCampaign(id, storeId, { status: "ACTIVE" as CampaignStatus }, admin)
      )
    );
    const failed = results.filter((r) => r.status === "rejected").length;
    return data({
      success: failed === 0,
      message:
        failed > 0 ? `${failed} of ${campaignIds.length} campaigns failed to activate` : undefined,
    });
  }

  if (intent === "bulk_pause") {
    const campaignIds = JSON.parse(formData.get("campaignIds") as string);
    const results = await Promise.allSettled(
      campaignIds.map((id: string) =>
        CampaignService.updateCampaign(id, storeId, { status: "PAUSED" as CampaignStatus }, admin)
      )
    );
    const failed = results.filter((r) => r.status === "rejected").length;
    return data({
      success: failed === 0,
      message:
        failed > 0 ? `${failed} of ${campaignIds.length} campaigns failed to pause` : undefined,
    });
  }

  if (intent === "bulk_archive") {
    const campaignIds = JSON.parse(formData.get("campaignIds") as string);
    const results = await Promise.allSettled(
      campaignIds.map((id: string) =>
        CampaignService.updateCampaign(id, storeId, { status: "ARCHIVED" as CampaignStatus }, admin)
      )
    );
    const failed = results.filter((r) => r.status === "rejected").length;
    return data({
      success: failed === 0,
      message:
        failed > 0 ? `${failed} of ${campaignIds.length} campaigns failed to archive` : undefined,
    });
  }

  if (intent === "bulk_delete") {
    const campaignIds = JSON.parse(formData.get("campaignIds") as string);
    const results = await Promise.allSettled(
      campaignIds.map((id: string) => CampaignService.deleteCampaign(id, storeId))
    );
    const failed = results.filter((r) => r.status === "rejected").length;
    return data({
      success: failed === 0,
      message:
        failed > 0 ? `${failed} of ${campaignIds.length} campaigns failed to delete` : undefined,
    });
  }

  if (intent === "bulk_duplicate") {
    const campaignIds = JSON.parse(formData.get("campaignIds") as string);
    const results = await Promise.allSettled(
      campaignIds.map(async (id: string) => {
        const campaign = await CampaignService.getCampaignById(id, storeId);
        if (!campaign) throw new Error(`Campaign ${id} not found`);

        // Extract only the fields needed for CampaignCreateData
        const createData = {
          name: `${campaign.name} (Copy)`,
          description: campaign.description || undefined,
          goal: campaign.goal,
          status: "DRAFT" as CampaignStatus,
          priority: campaign.priority,
          templateId: campaign.templateId || undefined,
          templateType: campaign.templateType,
          contentConfig: campaign.contentConfig,
          designConfig: campaign.designConfig,
          targetRules: campaign.targetRules,
          discountConfig: campaign.discountConfig,
          experimentId: undefined, // Don't copy experiment association
          variantKey: undefined,
          isControl: undefined,
          startDate: campaign.startDate || undefined,
          endDate: campaign.endDate || undefined,
        };

        return CampaignService.createCampaign(storeId, createData, admin);
      })
    );
    const failed = results.filter((r) => r.status === "rejected").length;
    return data({
      success: failed === 0,
      message:
        failed > 0 ? `${failed} of ${campaignIds.length} campaigns failed to duplicate` : undefined,
    });
  }

  // Single campaign duplicate action
  if (intent === "duplicate") {
    const campaignId = formData.get("campaignId") as string;
    if (!campaignId) {
      return data({ success: false, message: "Campaign ID is required" }, { status: 400 });
    }

    const campaign = await CampaignService.getCampaignById(campaignId, storeId);
    if (!campaign) {
      return data({ success: false, message: "Campaign not found" }, { status: 404 });
    }

    // Extract only the fields needed for CampaignCreateData
    const createData = {
      name: `${campaign.name} (Copy)`,
      description: campaign.description || undefined,
      goal: campaign.goal,
      status: "DRAFT" as CampaignStatus,
      priority: campaign.priority,
      templateId: campaign.templateId || undefined,
      templateType: campaign.templateType,
      contentConfig: campaign.contentConfig,
      designConfig: campaign.designConfig,
      targetRules: campaign.targetRules,
      discountConfig: campaign.discountConfig,
      experimentId: undefined, // Don't copy experiment association
      variantKey: undefined,
      isControl: undefined,
      startDate: campaign.startDate || undefined,
      endDate: campaign.endDate || undefined,
    };

    const newCampaign = await CampaignService.createCampaign(storeId, createData, admin);
    return data({ success: true, campaignId: newCampaign.id });
  }

  return null;
};

// --- Components ---

function GlobalMetricCard({
  title,
  value,
  subtext,
}: {
  title: string;
  value: string;
  subtext?: string;
}) {
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
  onSelect,
}: {
  title: string;
  description: string;
  icon: React.ComponentType<React.SVGProps<SVGSVGElement>>;
  onSelect: () => void;
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
          <Text as="h3" variant="headingMd">
            {title}
          </Text>
          <Text as="p" tone="subdued">
            {description}
          </Text>
        </BlockStack>
        <Button onClick={onSelect} variant="primary">
          Use this template
        </Button>
      </BlockStack>
    </Card>
  );
}

export default function Dashboard() {
  const {
    globalMetrics,
    campaigns,
    experiments,
    currency,
    timeRange,
    hasCampaigns,
    setupStatus,
    setupComplete,
    themeEditorUrl,
    chargeId,
    recentUpgrade,
  } = useLoaderData<typeof loader>();
  const navigate = useNavigate();
  const fetcher = useFetcher();
  const setupFetcher = useFetcher<{ status: SetupStatusData; setupComplete: boolean }>();

  // Track which campaign is being toggled
  const [togglingCampaignId, setTogglingCampaignId] = useState<string | null>(null);

  // Use refreshed setup status if available, otherwise use loader data
  const currentSetupStatus = setupFetcher.data?.status ?? setupStatus;
  const currentSetupComplete = setupFetcher.data?.setupComplete ?? setupComplete;
  const isRefreshingSetup = setupFetcher.state === "loading";

  // Reset toggling state when fetcher completes
  useEffect(() => {
    if (fetcher.state === "idle" && togglingCampaignId !== null) {
      setTogglingCampaignId(null);
    }
  }, [fetcher.state, togglingCampaignId]);

  const handleRefreshSetupStatus = () => {
    setupFetcher.load("/api/setup/status");
  };

  const formatMoney = (amount: number) => {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: currency,
      maximumFractionDigits: 0,
    }).format(amount);
  };

  // --- Handlers ---
  const handleCreateCampaign = () => {
    navigate("/app/campaigns/new");
  };

  const handleTimeRangeChange = (value: string) => {
    navigate(`?timeRange=${value}`);
  };

  const handleToggleStatus = (id: string, currentStatus: string) => {
    setTogglingCampaignId(id);
    fetcher.submit({ intent: "toggle_status", campaignId: id, currentStatus }, { method: "post" });
  };

  const handleCampaignClick = (id: string) => {
    navigate(`/app/campaigns/${id}`);
  };

  const handleEditClick = (id: string) => {
    navigate(`/app/campaigns/${id}/edit`);
  };

  const handleAnalyticsClick = (id: string) => {
    navigate(`/app/campaigns/${id}/analytics`);
  };

  // Bulk action handlers
  const handleBulkActivate = async (campaignIds: string[]) => {
    const formData = new FormData();
    formData.append("intent", "bulk_activate");
    formData.append("campaignIds", JSON.stringify(campaignIds));

    await fetcher.submit(formData, { method: "post" });
    // The fetcher will automatically revalidate and update the UI
  };

  const handleBulkPause = async (campaignIds: string[]) => {
    const formData = new FormData();
    formData.append("intent", "bulk_pause");
    formData.append("campaignIds", JSON.stringify(campaignIds));

    await fetcher.submit(formData, { method: "post" });
  };

  const handleBulkArchive = async (campaignIds: string[]) => {
    const formData = new FormData();
    formData.append("intent", "bulk_archive");
    formData.append("campaignIds", JSON.stringify(campaignIds));

    await fetcher.submit(formData, { method: "post" });
  };

  const handleBulkDelete = async (campaignIds: string[]) => {
    const formData = new FormData();
    formData.append("intent", "bulk_delete");
    formData.append("campaignIds", JSON.stringify(campaignIds));

    await fetcher.submit(formData, { method: "post" });
  };

  const handleBulkDuplicate = async (campaignIds: string[]) => {
    const formData = new FormData();
    formData.append("intent", "bulk_duplicate");
    formData.append("campaignIds", JSON.stringify(campaignIds));

    await fetcher.submit(formData, { method: "post" });
  };

  // Single campaign duplicate handler
  const handleDuplicateClick = (campaignId: string) => {
    const formData = new FormData();
    formData.append("intent", "duplicate");
    formData.append("campaignId", campaignId);

    fetcher.submit(formData, { method: "post" });
  };

  // --- Zero State ---
  if (!hasCampaigns) {
    return (
      <Page title="Dashboard">
        {/* Post-billing review trigger (invisible component) */}
        <PostBillingReviewTrigger chargeId={chargeId} recentUpgrade={recentUpgrade} />

        <Layout>
          {/* Setup Status Banner - Show if setup incomplete OR if there are any issues */}
          {currentSetupStatus &&
            (!currentSetupComplete || !currentSetupStatus.themeExtensionEnabled || !currentSetupStatus.appProxyOk) && (
              <Layout.Section>
                <SetupStatus
                  status={currentSetupStatus}
                  setupComplete={currentSetupComplete ?? false}
                  themeEditorUrl={themeEditorUrl}
                  compact
                  onRefresh={handleRefreshSetupStatus}
                  isRefreshing={isRefreshingSetup}
                />
              </Layout.Section>
            )}

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
                Revenue Boost helps you capture leads and increase sales with high-converting
                popups. Choose a template to get started in minutes.
              </p>
            </EmptyState>
          </Layout.Section>
          <Layout.Section>
            <Text as="h2" variant="headingMd">
              Quick Start Templates
            </Text>
            <Box paddingBlockStart="400">
              <InlineGrid columns={{ xs: 1, sm: 1, md: 2, lg: 3 }} gap="400">
                <TemplateTile
                  title="Newsletter Signup"
                  description="Grow your email list with a classic popup."
                  icon={CalendarIcon} // Placeholder icon
                  onSelect={() => navigate("/app/campaigns/new?template=NEWSLETTER")}
                />
                <TemplateTile
                  title="Flash Sale"
                  description="Offer a discount to convert visitors."
                  icon={ChartVerticalFilledIcon} // Placeholder icon
                  onSelect={() => navigate("/app/campaigns/new?template=FLASH_SALE")}
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
      {/* Post-billing review trigger (invisible component) */}
      <PostBillingReviewTrigger chargeId={chargeId} recentUpgrade={recentUpgrade} />

      <Layout>
        {/* Setup Status Banner - Show if setup incomplete OR if there are any issues */}
        {currentSetupStatus &&
          (!currentSetupComplete || !currentSetupStatus.themeExtensionEnabled || !currentSetupStatus.appProxyOk) && (
            <Layout.Section>
              <SetupStatus
                status={currentSetupStatus}
                setupComplete={currentSetupComplete ?? false}
                themeEditorUrl={themeEditorUrl}
                compact
                onRefresh={handleRefreshSetupStatus}
                isRefreshing={isRefreshingSetup}
              />
            </Layout.Section>
          )}

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
          <CampaignIndexTable
            campaigns={campaigns}
            experiments={experiments}
            onCampaignClick={handleCampaignClick}
            onEditClick={handleEditClick}
            onAnalyticsClick={handleAnalyticsClick}
            onToggleStatus={handleToggleStatus}
            onDuplicateClick={handleDuplicateClick}
            onBulkActivate={handleBulkActivate}
            onBulkPause={handleBulkPause}
            onBulkArchive={handleBulkArchive}
            onBulkDelete={handleBulkDelete}
            onBulkDuplicate={handleBulkDuplicate}
            formatMoney={formatMoney}
            showMetrics={true}
            togglingCampaignId={togglingCampaignId}
          />
        </Layout.Section>

        {/* Template Quick Start (Bottom) */}
        <Layout.Section>
          <Text as="h2" variant="headingMd">
            Start a new campaign
          </Text>
          <Box paddingBlockStart="400">
            <InlineGrid columns={{ xs: 1, sm: 1, md: 2, lg: 3 }} gap="400">
              <TemplateTile
                title="Newsletter Signup"
                description="Grow your email list with a classic popup."
                icon={CalendarIcon}
                onSelect={() => navigate("/app/campaigns/new?template=NEWSLETTER")}
              />
              <TemplateTile
                title="Flash Sale"
                description="Offer a discount to convert visitors."
                icon={ChartVerticalFilledIcon}
                onSelect={() => navigate("/app/campaigns/new?template=FLASH_SALE")}
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
