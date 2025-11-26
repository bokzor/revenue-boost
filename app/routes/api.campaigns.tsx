/**
 * Campaign Management API Routes
 *
 * REST API endpoints for campaign CRUD operations
 *
 * PROTECTED: Rate limited to prevent abuse
 * - GET: 120 requests/minute (authenticated)
 * - POST/PUT/DELETE: 30 requests/minute (write operations)
 */

import {
  CampaignService,
  CampaignCreateDataSchema,
  CampaignUpdateDataSchema,
} from "~/domains/campaigns";
import type { TemplateType } from "~/domains/campaigns";
import { validateCustomCss } from "~/lib/css-guards";
import { validateData, ValidationError } from "~/lib/validation-helpers";
import { createSuccessResponse, validateResourceExists } from "~/lib/api-helpers.server";
import { handleApiError } from "~/lib/api-error-handler.server";
import { getStoreId } from "~/lib/auth-helpers.server";
import { withAuthRateLimit, withWriteRateLimit } from "~/lib/rate-limit-middleware.server";
import { authenticate } from "~/shopify.server";

function sanitizeDesignCustomCss(designConfig?: { customCSS?: unknown }) {
  if (!designConfig) return;

  const safeCss = validateCustomCss(designConfig.customCSS, "designConfig.customCSS");

  if (safeCss !== undefined) {
    designConfig.customCSS = safeCss;
    return;
  }

  if ("customCSS" in designConfig) {
    delete (designConfig as Record<string, unknown>).customCSS;
  }
}

export async function loader(args: { request: Request; params: any; context: any }) {
  return withAuthRateLimit(args, async ({ request }) => {
    try {
      const storeId = await getStoreId(request);
      const url = new URL(request.url);
      const templateType = url.searchParams.get("templateType");
      const status = url.searchParams.get("status");

      let campaigns;
      if (templateType) {
        campaigns = await CampaignService.getCampaignsByTemplateType(
          storeId,
          templateType as TemplateType
        );
      } else if (status === "active") {
        campaigns = await CampaignService.getActiveCampaigns(storeId);
      } else {
        campaigns = await CampaignService.getAllCampaigns(storeId);
      }

      return createSuccessResponse({ campaigns });
    } catch (error) {
      return handleApiError(error, "GET /api/campaigns");
    }
  });
}

export async function action(args: { request: Request; params: any; context: any }) {
  return withWriteRateLimit(args, async ({ request }) => {
    try {
      const { admin } = await authenticate.admin(request);
      const method = request.method;
      const storeId = await getStoreId(request);
      const url = new URL(request.url);
      const appUrl = process.env.SHOPIFY_APP_URL;

      if (method === "POST") {
        const rawData = await request.json();
        console.log("[API /api/campaigns] POST payload", rawData);
        const validatedData = validateData(
          CampaignCreateDataSchema,
          rawData,
          "Campaign Create Data"
        );

        try {
          sanitizeDesignCustomCss(validatedData.designConfig);
        } catch (error) {
          const message = error instanceof Error ? error.message : "Invalid custom CSS";
          throw new ValidationError(message, [message], "designConfig.customCSS");
        }

        const campaign = await CampaignService.createCampaign(
          storeId,
          validatedData,
          admin,
          appUrl
        );
        console.log("[API /api/campaigns] created campaign", campaign?.id);
        return createSuccessResponse({ campaign }, 201);
      }

      if (method === "PUT") {
        const campaignId = url.searchParams.get("id");
        if (!campaignId) throw new Error("Campaign ID is required");

        const rawData = await request.json();
        const validatedData = validateData(
          CampaignUpdateDataSchema,
          rawData,
          "Campaign Update Data"
        );

        try {
          sanitizeDesignCustomCss(validatedData.designConfig);
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
        return createSuccessResponse({ campaign });
      }

      if (method === "DELETE") {
        const campaignId = url.searchParams.get("id");
        if (!campaignId) throw new Error("Campaign ID is required");

        const deleted = await CampaignService.deleteCampaign(campaignId, storeId, admin);
        validateResourceExists(deleted, "Campaign");
        return createSuccessResponse({ deleted: true });
      }

      throw new Error(`Method ${method} not allowed`);
    } catch (error) {
      return handleApiError(error, `${request.method} /api/campaigns`);
    }
  });
}
