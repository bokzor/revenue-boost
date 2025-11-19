/**
 * Campaign Detail Page
 *
 * Individual campaign view with full details and management options
 */

import { data, type LoaderFunctionArgs } from "react-router";
import { useLoaderData, useNavigate, useRevalidator } from "react-router";
import { Frame, Toast } from "@shopify/polaris";
import { useState } from "react";

import { authenticate } from "~/shopify.server";
import { getStoreId } from "~/lib/auth-helpers.server";
import { CampaignService } from "~/domains/campaigns";
import { CampaignDetail } from "~/domains/campaigns/components";
import type { CampaignWithConfigs } from "~/domains/campaigns/types/campaign";
import { apiClient, getErrorMessage } from "~/lib/api-client";
import { CampaignAnalyticsService } from "~/domains/campaigns/services/campaign-analytics.server";
import { PopupEventService } from "~/domains/analytics/popup-events.server";

// ============================================================================
// TYPES
// ============================================================================

interface LoaderData {
  campaign: CampaignWithConfigs | null;
  storeId: string;
  stats: {
    leadCount: number;
    conversionRate: number;
    lastLeadAt: string | null;
  } | null;
  funnel: {
    views: number;
    submits: number;
    couponsIssued: number;
  } | null;
  revenue: number;
  discountGiven: number;
  aov: number;
  clicks: number;
}

// ============================================================================
// LOADER
// ============================================================================

export async function loader({ request, params }: LoaderFunctionArgs) {
  try {
    const { session } = await authenticate.admin(request);

    if (!session?.shop) {
      throw new Error("No shop session found");
    }

    const campaignId = params.campaignId;
    if (!campaignId) {
      throw new Error("Campaign ID is required");
    }

    const storeId = await getStoreId(request);

    // Get campaign details
    const campaign = await CampaignService.getCampaignById(campaignId, storeId);

    let stats: LoaderData["stats"] = null;
    let funnel: LoaderData["funnel"] = null;
    let revenue = 0;
    let discountGiven = 0;
    let aov = 0;
    let clicks = 0;

    if (campaign) {
      const [statsMap, funnelMap, revenueStatsMap, clickMap] = await Promise.all([
        CampaignAnalyticsService.getCampaignStats([campaign.id]),
        PopupEventService.getFunnelStatsByCampaign([campaign.id], {
          storeId,
        }),
        CampaignAnalyticsService.getRevenueBreakdownByCampaignIds([campaign.id]),
        PopupEventService.getClickCountsByCampaign([campaign.id], {
          storeId,
        }),
      ]);

      const statEntry = statsMap.get(campaign.id);
      const funnelEntry = funnelMap.get(campaign.id);
      const revenueStatsEntry = revenueStatsMap.get(campaign.id);
      const clickEntry = clickMap.get(campaign.id);

      if (statEntry) {
        stats = {
          leadCount: statEntry.leadCount,
          conversionRate: statEntry.conversionRate,
          lastLeadAt: statEntry.lastLeadAt
            ? statEntry.lastLeadAt.toISOString()
            : null,
        };
      }

      if (funnelEntry) {
        funnel = {
          views: funnelEntry.views,
          submits: funnelEntry.submits,
          couponsIssued: funnelEntry.couponsIssued,
        };
      }

      if (revenueStatsEntry) {
        revenue = revenueStatsEntry.revenue ?? 0;
        discountGiven = revenueStatsEntry.discount ?? 0;
        aov = revenueStatsEntry.aov ?? 0;
      }

      clicks = clickEntry ?? 0;
    }

    return data<LoaderData>({
      campaign,
      storeId,
      stats,
      funnel,
      revenue,
      discountGiven,
      aov,
      clicks,
    });
  } catch (error) {
    console.error("Failed to load campaign:", error);

    return data<LoaderData>({
      campaign: null,
      storeId: "",
      stats: null,
      funnel: null,
      revenue: 0,
      discountGiven: 0,
      aov: 0,
      clicks: 0,
    }, { status: 404 });
  }
}

// ============================================================================
// COMPONENT
// ============================================================================

export default function CampaignDetailPage() {
  const { campaign, stats, funnel, revenue, discountGiven, aov, clicks } =
    useLoaderData<typeof loader>();
  const navigate = useNavigate();
  const revalidator = useRevalidator();

  // State for toast notifications
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [toastError, setToastError] = useState(false);

  // Helper function to show toast
  const showToast = (message: string, isError = false) => {
    setToastMessage(message);
    setToastError(isError);
  };

  // Event handlers
  const handleBack = () => {
    navigate("/app/campaigns");
  };

  const handleEdit = () => {
    console.log('[Campaign Detail] handleEdit called');
    console.log('[Campaign Detail] Campaign:', campaign?.id, 'experimentId:', campaign?.experimentId);
    if (campaign) {
      // If campaign is part of an A/B test, edit the experiment instead
      if (campaign.experimentId) {
        console.log('[Campaign Detail] Navigating to experiment edit:', `/app/experiments/${campaign.experimentId}/edit`);
        navigate(`/app/experiments/${campaign.experimentId}/edit`);
      } else {
        console.log('[Campaign Detail] Navigating to campaign edit:', `/app/campaigns/${campaign.id}/edit`);
        navigate(`/app/campaigns/${campaign.id}/edit`);
      }
    } else {
      console.log('[Campaign Detail] No campaign found, cannot edit');
    }
  };

  const handleDuplicate = async () => {
    if (!campaign) return;

    try {
      // Create duplicate with modified name
      const duplicateData = {
        ...campaign,
        name: `${campaign.name} (Copy)`,
        status: "DRAFT",
      };

      const response = await apiClient.post<{ campaign: CampaignWithConfigs }>(
        "/api/campaigns",
        duplicateData
      );

      const newCampaign = response.data?.campaign;
      if (!newCampaign) {
        throw new Error("Failed to create duplicate");
      }

      showToast("Campaign duplicated successfully");

      // Navigate to the new campaign
      navigate(`/app/campaigns/${newCampaign.id}`);

    } catch (error) {
      console.error("Failed to duplicate campaign:", error);
      showToast(getErrorMessage(error), true);
    }
  };

  const handleDelete = async () => {
    if (!campaign) return;

    if (!confirm("Are you sure you want to delete this campaign? This action cannot be undone.")) {
      return;
    }

    try {
      await apiClient.delete(`/api/campaigns/${campaign.id}`);

      showToast("Campaign deleted successfully");

      // Navigate back to campaigns list
      navigate("/app/campaigns");

    } catch (error) {
      console.error("Failed to delete campaign:", error);
      showToast(getErrorMessage(error), true);
    }
  };

  const handleToggleStatus = async () => {
    if (!campaign) return;

    const newStatus = campaign.status === "ACTIVE" ? "PAUSED" : "ACTIVE";

    try {
      await apiClient.put(`/api/campaigns/${campaign.id}`, {
        status: newStatus,
      });

      showToast(`Campaign ${newStatus.toLowerCase()} successfully`);
      revalidator.revalidate();

    } catch (error) {
      console.error("Failed to update campaign status:", error);
      showToast(getErrorMessage(error), true);
    }
  };

  // Toast component
  const toastMarkup = toastMessage ? (
    <Toast
      content={toastMessage}
      error={toastError}
      onDismiss={() => setToastMessage(null)}
    />
  ) : null;

  return (
    <Frame>
      <CampaignDetail
        campaign={campaign}
        loading={revalidator.state === "loading"}
        onBack={handleBack}
        onEdit={handleEdit}
        onDuplicate={handleDuplicate}
        onDelete={handleDelete}
        onToggleStatus={handleToggleStatus}
        stats={stats}
        funnel={funnel}
        revenue={revenue}
        discountGiven={discountGiven}
        aov={aov}
        clicks={clicks}
      />
      {toastMarkup}
    </Frame>
  );
}
