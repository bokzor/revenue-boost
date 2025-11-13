/**
 * Campaign Edit Page
 *
 * Edit existing campaign with pre-populated form data
 */

import { data, type LoaderFunctionArgs } from "react-router";
import { useLoaderData, useNavigate } from "react-router";
import { Frame, Toast, Modal, Text } from "@shopify/polaris";
import { useState, useEffect } from "react";

import { authenticate } from "~/shopify.server";
import { getStoreId } from "~/lib/auth-helpers.server";
import { CampaignService } from "~/domains/campaigns";
import { CampaignFormWithABTesting } from "~/domains/campaigns/components/CampaignFormWithABTesting";
import type { CampaignWithConfigs } from "~/domains/campaigns/types/campaign";
import type { CampaignFormData } from "~/shared/hooks/useWizardState";
import type { FrequencyCappingConfig } from "~/domains/targeting/components";

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

  // Post-save activation modal state
  const [activatePromptOpen, setActivatePromptOpen] = useState(false);
  const [activating, setActivating] = useState(false);
  const [postSaveNavigateTo, setPostSaveNavigateTo] = useState<string | null>(null);

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
      // Load frequency capping from server format (already matches UI format)
      frequencyCapping: {
        enabled: !!campaign.targetRules?.enhancedTriggers?.frequency_capping,
        max_triggers_per_session: campaign.targetRules?.enhancedTriggers?.frequency_capping?.max_triggers_per_session,
        max_triggers_per_day: campaign.targetRules?.enhancedTriggers?.frequency_capping?.max_triggers_per_day,
        cooldown_between_triggers: campaign.targetRules?.enhancedTriggers?.frequency_capping?.cooldown_between_triggers,
        respectGlobalCap: true, // Default to true
      } as FrequencyCappingConfig,
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

      // Extract frequency capping fields (already in server format)
      const { enabled, max_triggers_per_session, max_triggers_per_day, cooldown_between_triggers, respectGlobalCap } = campaignData.frequencyCapping;

      // Only include frequency_capping if enabled
      const frequency_capping = enabled ? {
        max_triggers_per_session,
        max_triggers_per_day,
        cooldown_between_triggers,
      } : undefined;

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
          enhancedTriggers: {
            ...campaignData.enhancedTriggers,
            frequency_capping,
          },
          audienceTargeting: campaignData.audienceTargeting,
          pageTargeting: campaignData.pageTargeting,
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

      const needsActivationPrompt = campaign.status === "DRAFT" && campaignData.status === "DRAFT";

      if (needsActivationPrompt) {
        setPostSaveNavigateTo(`/app/campaigns/${campaign.id}`);
        setActivatePromptOpen(true);
        showToast("Campaign updated successfully");
        return;
      }

      showToast("Campaign updated successfully");
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
      <Modal
        open={activatePromptOpen}
        onClose={() => {
          setActivatePromptOpen(false);
          if (postSaveNavigateTo) navigate(postSaveNavigateTo);
        }}
        title="Activate Campaign"
        primaryAction={{
          content: "Activate now",
          loading: activating,
          onAction: async () => {
            if (!campaign) return;
            try {
              setActivating(true);
              await fetch(`/api/campaigns/${campaign.id}`, {
                method: "PUT",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ status: "ACTIVE" }),
              });
              showToast("Campaign activated");
            } catch (e) {
              showToast("Failed to activate campaign", true);
            } finally {
              setActivating(false);
              setActivatePromptOpen(false);
              if (postSaveNavigateTo) navigate(postSaveNavigateTo);
            }
          },
        }}
        secondaryActions={[
          {
            content: "Not now",
            onAction: () => {
              setActivatePromptOpen(false);
              if (postSaveNavigateTo) navigate(postSaveNavigateTo);
            },
          },
        ]}
      >
        <div style={{ padding: 16 }}>
          <Text as="p" variant="bodyMd">This campaign is still a draft. Activate it now</Text>
        </div>
      </Modal>

      {toastMarkup}
    </Frame>
  );
}
