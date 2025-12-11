/**
 * API Route: Scratch Card Prize Code Generation
 *
 * Dynamically generates unique discount codes when users scratch the card.
 * Uses the shared GamePopupHandler for common logic.
 *
 * Features:
 * - Flexible email collection (before or after scratching)
 * - Unique code generation via Shopify API
 * - Lead tracking with generated codes (supports anonymous leads)
 * - Support for all discount types (%, fixed, free shipping)
 */

import { type ActionFunctionArgs } from "react-router";
import { z } from "zod";
import {
  ScratchCardRequestSchema,
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
import { logger } from "~/lib/logger.server";

const CONFIG = GAME_POPUP_CONFIGS.SCRATCH_CARD;

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
    const validatedRequest = ScratchCardRequestSchema.parse(body);
    const { campaignId, email } = validatedRequest;

    // 3. Fetch and validate campaign
    const campaignResult = await fetchAndValidateCampaign(campaignId, CONFIG);
    if (!("id" in campaignResult)) {
      return campaignResult; // Error response
    }
    const campaign = campaignResult;

    // 4. Scratch Card specific: Validate email requirements based on campaign config
    const contentConfig = campaign.contentConfig;
    const emailRequired = contentConfig?.emailRequired !== false; // Default to true
    const emailBeforeScratching = contentConfig?.emailBeforeScratching === true;

    if (emailRequired && emailBeforeScratching && !email) {
      logger.info("[Scratch Card] Email required before scratching but not provided");
      return createErrorResponse(
        "Email is required before scratching for this campaign",
        400,
        { requiresEmail: true }
      );
    }

    logger.debug({
      emailRequired,
      emailBeforeScratching,
      emailProvided: !!email,
      scenario:
        emailRequired && emailBeforeScratching
          ? "Email before scratch"
          : emailRequired
            ? "Email after scratch"
            : "No email required",
    }, "[Scratch Card] Email validation passed");

    // 5. Security validation (bot detection)
    const securityResult = await validateSecurityRequest(request, validatedRequest, CONFIG);
    if (!("valid" in securityResult)) {
      return securityResult; // Bot honeypot or error response
    }

    // 6. Preview mode check
    if (campaignId.startsWith("preview-")) {
      return createPreviewResponse(CONFIG, campaignId);
    }

    // 7. Rate limiting (only if email is provided - scratch card allows anonymous plays)
    if (email) {
      const rateLimitResult = await checkGameRateLimit(email, campaignId, CONFIG);
      if (!("allowed" in rateLimitResult)) {
        return rateLimitResult; // Rate limit exceeded response
      }
    }

    // 8. Handle prize selection, discount generation, and lead storage
    return handleGamePopupPrize({
      config: CONFIG,
      validatedRequest,
      admin,
      campaign,
      contentConfig: campaign.contentConfig,
      leadSource: "scratch_card_popup",
    });
  } catch (error) {
    logger.error({ error }, "[Scratch Card API] Error");

    if (error instanceof z.ZodError) {
      return createZodErrorResponse(error);
    }

    return createErrorResponse("Internal server error", 500);
  }
}
