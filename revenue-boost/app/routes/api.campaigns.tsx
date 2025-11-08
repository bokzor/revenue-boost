/**
 * Campaign Management API Routes
 *
 * REST API endpoints for campaign CRUD operations
 */

import { CampaignService, CampaignCreateDataSchema, CampaignUpdateDataSchema } from "~/domains/campaigns";
import type { TemplateType } from "~/domains/campaigns";
import { validateData } from "~/lib/validation-helpers";
import { createSuccessResponse, validateResourceExists } from "~/lib/api-helpers.server";
import { handleApiError } from "~/lib/api-error-handler.server";
import { getStoreId } from "~/lib/auth-helpers.server";

export async function loader({ request }: { request: Request }) {
  try {
    const storeId = await getStoreId(request);
    const url = new URL(request.url);
    const templateType = url.searchParams.get("templateType");
    const status = url.searchParams.get("status");

    let campaigns;
    if (templateType) {
      campaigns = await CampaignService.getCampaignsByTemplateType(storeId, templateType as TemplateType);
    } else if (status === "active") {
      campaigns = await CampaignService.getActiveCampaigns(storeId);
    } else {
      campaigns = await CampaignService.getAllCampaigns(storeId);
    }

    return createSuccessResponse({ campaigns });
  } catch (error) {
    return handleApiError(error, "GET /api/campaigns");
  }
}

export async function action({ request }: { request: Request }) {
  try {
    const method = request.method;
    const storeId = await getStoreId(request);
    const url = new URL(request.url);

    if (method === "POST") {
      const rawData = await request.json();
      const validatedData = validateData(CampaignCreateDataSchema, rawData, "Campaign Create Data");
      const campaign = await CampaignService.createCampaign(storeId, validatedData);
      return createSuccessResponse({ campaign }, 201);
    }

    if (method === "PUT") {
      const campaignId = url.searchParams.get("id");
      if (!campaignId) throw new Error("Campaign ID is required");

      const rawData = await request.json();
      const validatedData = validateData(CampaignUpdateDataSchema, rawData, "Campaign Update Data");
      const campaign = await CampaignService.updateCampaign(campaignId, storeId, validatedData);
      validateResourceExists(campaign, "Campaign");
      return createSuccessResponse({ campaign });
    }

    if (method === "DELETE") {
      const campaignId = url.searchParams.get("id");
      if (!campaignId) throw new Error("Campaign ID is required");

      const deleted = await CampaignService.deleteCampaign(campaignId, storeId);
      validateResourceExists(deleted, "Campaign");
      return createSuccessResponse({ deleted: true });
    }

    throw new Error(`Method ${method} not allowed`);
  } catch (error) {
    return handleApiError(error, `${request.method} /api/campaigns`);
  }
}
