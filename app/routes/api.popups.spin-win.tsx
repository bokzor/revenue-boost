/**
 * API Route: Spin-to-Win Prize Code Generation
 *
 * Dynamically generates unique discount codes when users win prizes on the spin-to-win popup.
 * Uses the shared GamePopupHandler for common logic.
 *
 * Features:
 * - Per-segment discount configuration
 * - Unique code generation via Shopify API
 * - Lead tracking with generated codes
 * - Support for all discount types (%, fixed, free shipping)
 */

import { data, type ActionFunctionArgs } from "react-router";
import { z } from "zod";
import {
  SpinToWinRequestSchema,
  GAME_POPUP_CONFIGS,
  authenticateRequest,
  validateSecurityRequest,
  checkGameRateLimit,
  fetchAndValidateCampaign,
  createPreviewResponse,
  createErrorResponse,
  createZodErrorResponse,
  handleGamePopupPrize,
} from "~/domains/popups/services/game-popup-handler.server";

const CONFIG = GAME_POPUP_CONFIGS.SPIN_TO_WIN;

export async function action({ request }: ActionFunctionArgs) {
  try {
    // 1. Authenticate via app proxy
    const authResult = await authenticateRequest(request, CONFIG);
    if (!("admin" in authResult)) {
      return authResult; // Error response
    }
    const { admin } = authResult;

    // 2. Parse and validate request body
    const body = await request.json();
    const validatedRequest = SpinToWinRequestSchema.parse(body);
    const { campaignId, email } = validatedRequest;

    // 3. Fetch and validate campaign
    const campaignResult = await fetchAndValidateCampaign(campaignId, CONFIG);
    if (!("id" in campaignResult)) {
      return campaignResult; // Error response
    }
    const campaign = campaignResult;

    // 4. Security validation (bot detection)
    const securityResult = await validateSecurityRequest(request, validatedRequest, CONFIG);
    if (!("valid" in securityResult)) {
      return securityResult; // Bot honeypot or error response
    }

    // 5. Preview mode check
    if (campaignId.startsWith("preview-")) {
      return createPreviewResponse(CONFIG);
    }

    // 6. Rate limiting (email is required for spin-to-win)
    const rateLimitResult = await checkGameRateLimit(email, campaignId, CONFIG);
    if (!("allowed" in rateLimitResult)) {
      return rateLimitResult; // Rate limit exceeded response
    }

    // 7. Handle prize selection, discount generation, and lead storage
    return handleGamePopupPrize({
      config: CONFIG,
      validatedRequest,
      admin,
      campaign,
      contentConfig: campaign.contentConfig,
      leadSource: "spin_to_win_popup",
    });
  } catch (error) {
    console.error("[Spin-to-Win API] Error:", error);

    if (error instanceof z.ZodError) {
      return createZodErrorResponse(error);
    }

    return createErrorResponse("Internal server error", 500);
  }
}
