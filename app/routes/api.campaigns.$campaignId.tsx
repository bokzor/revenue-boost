/**
 * Individual Campaign API Routes
 *
 * REST API endpoints for single campaign operations
 * GET /api/campaigns/:campaignId - Get specific campaign
 * PUT /api/campaigns/:campaignId - Update specific campaign
 * DELETE /api/campaigns/:campaignId - Delete specific campaign
 */

import {
  CampaignService,
  CampaignUpdateDataSchema,
  type TargetRulesConfig,
} from "~/domains/campaigns/index.server";
import { validateCustomCss } from "~/lib/css-guards";
import { validateData, ValidationError } from "~/lib/validation-helpers";
import {
  getResourceById,
  createMethodRouter,
  validateRequiredId,
  validateResourceExists,
} from "~/lib/api-helpers.server";
import { getStoreId } from "~/lib/auth-helpers.server";
import { authenticate } from "~/shopify.server";
import { triggerCampaignSegmentSync } from "~/domains/targeting/services/campaign-segment-sync.server";

// ============================================================================
// LOADER (GET /api/campaigns/:campaignId)
// ============================================================================

export const loader = getResourceById(
  (id, storeId) => CampaignService.getCampaignById(id, storeId),
  "Campaign",
  "GET /api/campaigns/:campaignId"
);

// ============================================================================
// ACTION (PUT/DELETE /api/campaigns/:campaignId)
// ============================================================================

export const action = createMethodRouter({
  PUT: {
    handler: async ({ request, params }) => {
      const { campaignId } = params;
      validateRequiredId(campaignId, "Campaign");

      const { admin } = await authenticate.admin(request);
      const storeId = await getStoreId(request);
      const rawData = await request.json();
      const validatedData = validateData(CampaignUpdateDataSchema, rawData, "Campaign Update Data");

      // Sanitize Custom CSS to prevent XSS
      try {
        const designConfig = validatedData.designConfig as { customCSS?: unknown } | undefined;
        if (designConfig) {
          const safeCss = validateCustomCss(designConfig.customCSS, "designConfig.customCSS");
          if (safeCss !== undefined) {
            designConfig.customCSS = safeCss;
          } else if ("customCSS" in designConfig) {
            delete designConfig.customCSS;
          }
        }
      } catch (error) {
        const message = error instanceof Error ? error.message : "Invalid custom CSS";
        throw new ValidationError(message, [message], "designConfig.customCSS");
      }

      const campaign = await CampaignService.updateCampaign(
        campaignId,
        storeId,
        validatedData,
        admin
      );
      validateResourceExists(campaign, "Campaign");

      // Trigger async segment membership sync if campaign has Shopify segment targeting
      triggerCampaignSegmentSync({
        storeId,
        targetRules: validatedData.targetRules as TargetRulesConfig | undefined,
        admin,
      });

      return { campaign };
    },
    context: "PUT /api/campaigns/:campaignId",
  },
  DELETE: {
    handler: async ({ request, params }) => {
      const { campaignId } = params;
      validateRequiredId(campaignId, "Campaign");

      const { admin } = await authenticate.admin(request);
      const storeId = await getStoreId(request);
      const deleted = await CampaignService.deleteCampaign(campaignId, storeId, admin);
      validateResourceExists(deleted, "Campaign");

      return { deleted: true };
    },
    context: "DELETE /api/campaigns/:campaignId",
  },
});
