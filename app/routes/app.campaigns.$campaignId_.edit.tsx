/**
 * Campaign Edit Page
 *
 * Edit existing campaign with pre-populated form data
 */

import { data, type LoaderFunctionArgs } from "react-router";
import { useLoaderData, useNavigate } from "react-router";
import { Frame, Toast } from "@shopify/polaris";
import { useState, useEffect } from "react";

import { authenticate } from "~/shopify.server";
import { getStoreId } from "~/lib/auth-helpers.server";
import { CampaignService } from "~/domains/campaigns";
import { CampaignFormWithABTesting } from "~/domains/campaigns/components/CampaignFormWithABTesting";
import type { CampaignWithConfigs } from "~/domains/campaigns/types/campaign";
import type { CampaignFormData } from "~/shared/hooks/useWizardState";

// ============================================================================
// TYPES
// ============================================================================

interface LoaderData {
  campaign: CampaignWithConfigs | null;
  storeId: string;
  shopDomain: string;
}

// ============================================================================
// LOADER
// ============================================================================

export async function loader({ request, params }: LoaderFunctionArgs) {
  console.log('[Campaign Edit Loader] Starting loader for campaignId:', params.campaignId);
  console.log('[Campaign Edit Loader] Request URL:', request.url);

  try {
    const { session } = await authenticate.admin(request);
    console.log('[Campaign Edit Loader] Session authenticated:', !!session);

    if (!session?.shop) {
      console.error('[Campaign Edit Loader] No shop session found');
      throw new Error("No shop session found");
    }

    const campaignId = params.campaignId;
    if (!campaignId) {
      console.error('[Campaign Edit Loader] Campaign ID is missing');
      throw new Error("Campaign ID is required");
    }

    const storeId = await getStoreId(request);
    console.log('[Campaign Edit Loader] StoreId:', storeId);

    // Get campaign details
    console.log('[Campaign Edit Loader] Fetching campaign by ID:', campaignId);
    const campaign = await CampaignService.getCampaignById(campaignId, storeId);
    console.log('[Campaign Edit Loader] Campaign fetched:', campaign ? campaign.id : 'null');

    return data<LoaderData>({
      campaign,
      storeId,
      shopDomain: session.shop,
    });

  } catch (error) {
    console.error("[Campaign Edit Loader] Failed to load campaign for editing:", error);

    return data<LoaderData>({
      campaign: null,
      storeId: "",
      shopDomain: "",
    }, { status: 404 });
  }
}

// ============================================================================
// COMPONENT
// ============================================================================

export default function CampaignEditPage() {
  console.log('[Campaign Edit Page] Component rendering');
  const { campaign, storeId, shopDomain } = useLoaderData<typeof loader>();
  console.log('[Campaign Edit Page] Loaded data - campaign:', campaign?.id, 'storeId:', storeId);
  const navigate = useNavigate();

  // State for toast notifications
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [toastError, setToastError] = useState(false);

  // Redirect to experiment edit page if campaign is part of an A/B test
  useEffect(() => {
    if (campaign?.experimentId) {
      console.log(`[Campaign Edit] Campaign ${campaign.id} is part of experiment ${campaign.experimentId}, redirecting...`);
      navigate(`/app/experiments/${campaign.experimentId}/edit`);
    }
  }, [campaign, navigate]);

  // Helper function to show toast
  const showToast = (message: string, isError = false) => {
    setToastMessage(message);
    setToastError(isError);
  };

  // Convert campaign to form data format
  const getInitialFormData = (): Partial<CampaignFormData> | null => {
    if (!campaign) return null;

    return {
      name: campaign.name,
      description: campaign.description || "",
      goal: campaign.goal,
      status: campaign.status,
      priority: campaign.priority || 0,
      templateId: campaign.templateId || "",
      templateType: campaign.templateType,
      contentConfig: campaign.contentConfig,
      designConfig: campaign.designConfig,
      targetRules: campaign.targetRules,
      enhancedTriggers: campaign.targetRules?.enhancedTriggers || {},
      audienceTargeting: {
        enabled: campaign.targetRules?.audienceTargeting?.enabled ?? false,
        segments: campaign.targetRules?.audienceTargeting?.segments ?? [],
        customRules: campaign.targetRules?.audienceTargeting?.customRules ?? {
          enabled: false,
          conditions: [],
          logicOperator: "AND" as const,
        },
      },
      pageTargeting: campaign.targetRules?.pageTargeting || {
        enabled: false,
        pages: [],
        customPatterns: [],
        excludePages: [],
      },
      frequencyCapping: campaign.targetRules?.frequencyCapping || {
        enabled: true,
        maxViews: 3,
        timeWindow: 24,
        respectGlobalCap: true,
        cooldownHours: 0,
      },
      discountConfig: campaign.discountConfig,
      startDate: campaign.startDate ? campaign.startDate.toISOString() : "",
      endDate: campaign.endDate ? campaign.endDate.toISOString() : "",
      tags: [],
      isSaving: false,
      triggerType: "page_load",
    };
  };

  // Handle save - update campaign via API
  const handleSave = async (campaignData: CampaignFormData | CampaignFormData[]) => {
    if (!campaign) {
      showToast("Campaign not found", true);
      return;
    }

    try {
      // For editing, we only handle single campaigns (not A/B tests)
      if (Array.isArray(campaignData)) {
        showToast("A/B testing updates not supported in edit mode", true);
        return;
      }

      const updateData = {
        name: campaignData.name,
        description: campaignData.description,
        goal: campaignData.goal,
        status: campaignData.status,
        priority: campaignData.priority,
        templateType: campaignData.templateType,
        contentConfig: campaignData.contentConfig,
        designConfig: campaignData.designConfig,
        targetRules: {
          enhancedTriggers: campaignData.enhancedTriggers,
          audienceTargeting: campaignData.audienceTargeting,
          pageTargeting: campaignData.pageTargeting,
          frequencyCapping: campaignData.frequencyCapping,
        },
        discountConfig: campaignData.discountConfig,
        startDate: campaignData.startDate,
        endDate: campaignData.endDate,
        tags: campaignData.tags,
      };

      const response = await fetch(`/api/campaigns/${campaign.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(updateData),
      });

      if (!response.ok) {
        throw new Error("Failed to update campaign");
      }

      showToast("Campaign updated successfully");

      // Redirect to campaign detail page
      navigate(`/app/campaigns/${campaign.id}`);

    } catch (error) {
      console.error("Failed to update campaign:", error);
      showToast("Failed to update campaign", true);
    }
  };

  const handleCancel = () => {
    navigate(`/app/campaigns/${campaign?.id || ""}`);
  };

  // Toast component
  const toastMarkup = toastMessage ? (
    <Toast
      content={toastMessage}
      error={toastError}
      onDismiss={() => setToastMessage(null)}
    />
  ) : null;

  // If no campaign found, redirect back
  useEffect(() => {
    if (!campaign) {
      console.log('[Campaign Edit Page] No campaign found, redirecting to campaigns list');
      navigate("/app/campaigns");
    }
  }, [campaign, navigate]);

  if (!campaign) {
    return null;
  }

  const initialData = getInitialFormData();
  if (!initialData) {
    console.log('[Campaign Edit Page] No initial data, returning null');
    return null;
  }

  console.log('[Campaign Edit Page] Rendering form with campaign:', campaign.id);
  return (
    <Frame>
      <CampaignFormWithABTesting
        storeId={storeId}
        shopDomain={shopDomain}
        initialData={initialData}
        campaignId={campaign?.id}
        onSave={handleSave}
        onCancel={handleCancel}
      />
      {toastMarkup}
    </Frame>
  );
}
