/**
 * Campaign Creation Route (Refactored)
 *
 * Uses the refactored CampaignFormWithABTesting component with:
 * - Complete visual parity with original
 * - Improved architecture and type safety
 * - Better separation of concerns
 * - All original features preserved
 */

import type { ActionFunctionArgs, LoaderFunctionArgs } from "react-router";
import { data, useLoaderData, useNavigate } from "react-router";
import { authenticate } from "~/shopify.server";
import { getStoreId } from "~/lib/auth-helpers.server";
import { CampaignFormWithABTesting } from "~/domains/campaigns/components/CampaignFormWithABTesting";
import type { CampaignFormData } from "~/shared/hooks/useWizardState";
import { useState } from "react";
import { Modal, Text } from "@shopify/polaris";
import type { UnifiedTemplate } from "~/domains/popups/services/templates/unified-template-service.server";

// ============================================================================
// LOADER - Fetch necessary data for form
// ============================================================================

export async function loader({ request }: LoaderFunctionArgs) {
  const { session } = await authenticate.admin(request);

  try {
    const storeId = await getStoreId(request);

    return data({
      storeId,
      shopDomain: session.shop,
      success: true,
    });
  } catch (error) {
    return data({
      storeId: "",
      shopDomain: "",
      success: false,
      error: error instanceof Error ? error.message : "Failed to load data",
    });
  }
}

// ============================================================================
// ACTION - Not used (form handles submission directly)
// ============================================================================

export async function action({ request }: ActionFunctionArgs) {
  await authenticate.admin(request);

  return data({
    success: false,
    error: "This route does not handle POST requests. Use the form's onSave handler.",
  }, { status: 400 });
}

// ============================================================================
// COMPONENT
// ============================================================================

export default function NewCampaign() {
  const loaderData = useLoaderData<typeof loader>();
  const navigate = useNavigate();
  // Post-create activation modal state (single campaign)
  const [activatePromptOpen, setActivatePromptOpen] = useState(false);
  const [createdCampaignId, setCreatedCampaignId] = useState<string | null>(null);
  const [activating, setActivating] = useState(false);


  const { storeId, shopDomain, templates } = loaderData as {
    storeId: string;
    shopDomain: string;
    templates: UnifiedTemplate[];
    success: boolean;
  };

  // Handle save - create campaign(s) via API
  const handleSave = async (campaignData: CampaignFormData | CampaignFormData[]) => {
    console.log('[CampaignNew] handleSave called', {
      isArray: Array.isArray(campaignData),
      hasFrequencyCapping: Array.isArray(campaignData)
        ? !!campaignData[0]?.frequencyCapping
        : !!campaignData.frequencyCapping,
    });

    try {
      // Use fetch to call our API routes instead of importing server services
      if (Array.isArray(campaignData)) {
        // A/B Testing: Create experiment with multiple variants
        const firstVariant = campaignData[0];

        // Extract experiment metadata from first variant
        const experimentData = {
          name: (firstVariant as { experimentName?: string }).experimentName,
          description: (firstVariant as { experimentDescription?: string }).experimentDescription,
          hypothesis: (firstVariant as { experimentHypothesis?: string }).experimentHypothesis,
          trafficAllocation: campaignData.reduce((acc, variant, index) => {
            const key = ["A", "B", "C", "D"][index];
            acc[key] = (variant as { trafficAllocation?: number }).trafficAllocation || Math.floor(100 / campaignData.length);
            return acc;
          }, {} as Record<string, number>),
          statisticalConfig: {
            confidenceLevel: 0.95,
            minimumSampleSize: 100,
            minimumDetectableEffect: 0.05,
            maxDurationDays: 30,
          },
          successMetrics: {
            primaryMetric: (firstVariant as { successMetric?: string }).successMetric || "conversion_rate",
            secondaryMetrics: ["click_through_rate"],
          },
        };

        // Create experiment via API
        const expResponse = await fetch("/api/experiments", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(experimentData),
        });

        if (!expResponse.ok) {
          throw new Error("Failed to create experiment");
        }

        const expBody = await expResponse.json();
        const experiment = expBody?.data?.experiment ?? expBody?.data;

        // Create campaigns for each variant via API
        const campaignPromises = campaignData.map(async (variant, index) => {
          // Extract frequency capping fields (already in server format)
          const { enabled, max_triggers_per_session, max_triggers_per_day, cooldown_between_triggers, respectGlobalCap } = variant.frequencyCapping;

          // Only include frequency_capping if enabled
          const frequency_capping = enabled ? {
            max_triggers_per_session,
            max_triggers_per_day,
            cooldown_between_triggers,
          } : undefined;

          const campaignCreateData = {
            name: variant.name || `${experimentData.name} - Variant ${["A", "B", "C", "D"][index]}`,
            description: variant.description,
            goal: variant.goal,
            status: variant.status || "DRAFT",
            priority: variant.priority || 0,
            templateId: variant.templateId,
            templateType: variant.templateType,
            contentConfig: variant.contentConfig,
            designConfig: variant.designConfig,
            targetRules: {
              enhancedTriggers: {
                ...variant.enhancedTriggers,
                frequency_capping,
              },
              audienceTargeting: variant.audienceTargeting,
              pageTargeting: variant.pageTargeting,
            },
            discountConfig: variant.discountConfig,
            experimentId: experiment.id,
            variantKey: ["A", "B", "C", "D"][index] as "A" | "B" | "C" | "D",
            isControl: index === 0,
            startDate: variant.startDate,
            endDate: variant.endDate,
            tags: variant.tags,
          };

          const response = await fetch("/api/campaigns", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(campaignCreateData),
          });

          if (!response.ok) {
            throw new Error("Failed to create campaign variant");
          }

          return response.json();
        });

        await Promise.all(campaignPromises);

        // Redirect to experiment detail page
        const shouldActivate = window.confirm("Activate all experiment variants now?");
        if (shouldActivate) {
          await fetch(`/api/experiments/${experiment.id}/activate-all`, { method: "POST" });
        }
        navigate(`/app/experiments/${experiment.id}`);
      } else {
        // Single campaign
        // Extract frequency capping fields (already in server format)
        const { enabled, max_triggers_per_session, max_triggers_per_day, cooldown_between_triggers, respectGlobalCap } = campaignData.frequencyCapping;

        // Only include frequency_capping if enabled
        const frequency_capping = enabled ? {
          max_triggers_per_session,
          max_triggers_per_day,
          cooldown_between_triggers,
        } : undefined;

        const campaignCreateData = {
          name: campaignData.name,
          description: campaignData.description,
          goal: campaignData.goal,
          status: campaignData.status || "DRAFT",
          priority: campaignData.priority || 0,
          templateId: campaignData.templateId,
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

        console.log('[CampaignNew] POSTing /api/campaigns', campaignCreateData);

        const response = await fetch("/api/campaigns", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(campaignCreateData),
        });

        console.log('[CampaignNew] /api/campaigns response', response.status);

        if (!response.ok) {
          console.error('[CampaignNew] /api/campaigns failed', response.status);
          throw new Error("Failed to create campaign");
        }

        const body = await response.json();
        const campaign = body?.data?.campaign ?? body?.data;

        console.log('[CampaignNew] created campaign', campaign?.id);

        // Post-create: if still DRAFT, prompt to activate via Polaris modal
        if (campaign?.status === "DRAFT") {
          setCreatedCampaignId(campaign.id);
          setActivatePromptOpen(true);
          return;
        }
        // Otherwise navigate to detail
        navigate(`/app/campaigns/${campaign.id}`);
      }
    } catch (error) {
      console.error("Failed to save campaign:", error);
      throw error;
    }
  };

  const handleCancel = () => {
    navigate("/app/campaigns");
  };

  return (
    <>
      <CampaignFormWithABTesting
        storeId={storeId}
        shopDomain={shopDomain}
        onSave={handleSave}
        onCancel={handleCancel}
        initialTemplates={templates}
      />

      <Modal
        open={activatePromptOpen}
        onClose={() => {
          setActivatePromptOpen(false);
          if (createdCampaignId) navigate(`/app/campaigns/${createdCampaignId}`);
        }}
        title="Activate Campaign"
        primaryAction={{
          content: "Activate now",
          loading: activating,
          onAction: async () => {
            if (!createdCampaignId) return;
            try {
              setActivating(true);
              await fetch(`/api/campaigns/${createdCampaignId}`, {
                method: "PUT",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ status: "ACTIVE" }),
              });
            } catch (e) {
              // no-op, navigate regardless
            } finally {
              setActivating(false);
              setActivatePromptOpen(false);
              navigate(`/app/campaigns/${createdCampaignId}`);
            }
          },
        }}
        secondaryActions={[
          {
            content: "Not now",
            onAction: () => {
              setActivatePromptOpen(false);
              if (createdCampaignId) navigate(`/app/campaigns/${createdCampaignId}`);
            },
          },
        ]}
      >
        <div style={{ padding: 16 }}>
          <Text as="p" variant="bodyMd">This campaign is still a draft. Activate it now</Text>
        </div>
      </Modal>
    </>
  );
}

