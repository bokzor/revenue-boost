/**
 * Game Popup Handler Service
 *
 * Shared handler for game-based popup interactions (Spin-to-Win, Scratch Card).
 * Consolidates common logic:
 * - Authentication & session validation
 * - Bot detection & security validation
 * - Preview mode handling
 * - Rate limiting
 * - Prize selection (probability-based)
 * - Discount code generation
 * - Lead storage
 * - Response formatting
 */

import { data } from "react-router";
import { z } from "zod";
import type { AdminApiContext } from "@shopify/shopify-app-react-router/server";
import { authenticate } from "~/shopify.server";
import prisma from "~/db.server";
import { getCampaignDiscountCode } from "~/domains/commerce/services/discount.server";
import { formatZodErrors } from "~/lib/validation-helpers";
import { PopupEventService } from "~/domains/analytics/popup-events.server";

// ============================================================================
// TYPES
// ============================================================================

export type GamePopupType = "SPIN_TO_WIN" | "SCRATCH_CARD";

export interface GamePopupConfig {
  /** The type of game popup */
  type: GamePopupType;
  /** Log prefix for console messages */
  logPrefix: string;
  /** Rate limit action name */
  rateLimitAction: string;
  /** Field name for prizes in contentConfig (e.g., "wheelSegments" or "prizes") */
  prizesField: string;
  /** Error message when no prizes are configured */
  noPrizesError: string;
}

export interface Prize {
  id: string;
  label: string;
  color?: string;
  probability: number;
  discountConfig?: {
    enabled: boolean;
    behavior?: string;
    [key: string]: unknown;
  };
}

export interface GamePopupRequest {
  campaignId: string;
  email?: string;
  sessionId: string;
  visitorId?: string;
  popupShownAt?: number;
  honeypot?: string;
}

export interface GamePopupResponse {
  success: boolean;
  prize?: {
    id: string;
    label: string;
    color?: string;
  };
  discountCode?: string;
  displayCode?: boolean;
  autoApply?: boolean;
  behavior?: string;
  expiresAt?: string;
  error?: string;
  requiresEmail?: boolean;
  message?: string;
}

// ============================================================================
// SCHEMAS
// ============================================================================

/** Base schema for game popup requests */
export const BaseGamePopupRequestSchema = z.object({
  campaignId: z.string().min(1).refine(
    (id) => id.startsWith("preview-") || /^[cC][^\s-]{8,}$/.test(id),
    "Invalid campaign ID format"
  ),
  sessionId: z.string().min(1, "Session ID is required"),
  visitorId: z.string().optional(),
  popupShownAt: z.number().optional(),
  honeypot: z.string().optional(),
});

/** Spin-to-Win requires email */
export const SpinToWinRequestSchema = BaseGamePopupRequestSchema.extend({
  email: z.string().email(),
});

/** Scratch Card has optional email (may be collected after scratching) */
export const ScratchCardRequestSchema = BaseGamePopupRequestSchema.extend({
  email: z.string().email().optional(),
});

// ============================================================================
// CONFIGURATION
// ============================================================================

export const GAME_POPUP_CONFIGS: Record<GamePopupType, GamePopupConfig> = {
  SPIN_TO_WIN: {
    type: "SPIN_TO_WIN",
    logPrefix: "[Spin-to-Win]",
    rateLimitAction: "spin_to_win",
    prizesField: "wheelSegments",
    noPrizesError: "No wheel segments configured",
  },
  SCRATCH_CARD: {
    type: "SCRATCH_CARD",
    logPrefix: "[Scratch Card]",
    rateLimitAction: "scratch_card",
    prizesField: "prizes",
    noPrizesError: "No prizes configured",
  },
};

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

/**
 * Parse content config from campaign (handles string or object)
 */
export function parseContentConfig(contentConfig: unknown): Record<string, unknown> {
  if (typeof contentConfig === "string") {
    try {
      return JSON.parse(contentConfig);
    } catch {
      return {};
    }
  }
  return (contentConfig as Record<string, unknown>) || {};
}

/**
 * Select a prize based on probability weights
 */
export function selectPrizeByProbability<T extends { probability?: number }>(
  prizes: T[]
): T {
  const totalProbability = prizes.reduce(
    (sum, p) => sum + (p.probability || 0),
    0
  );

  let random = Math.random() * totalProbability;
  let winningPrize = prizes[0]; // Fallback

  for (const prize of prizes) {
    random -= prize.probability || 0;
    if (random <= 0) {
      winningPrize = prize;
      break;
    }
  }

  return winningPrize;
}

/**
 * Create bot honeypot response (fake success to fool bots)
 */
export function createBotHoneypotResponse(): ReturnType<typeof data> {
  return data(
    {
      success: true,
      prize: { id: "thanks", label: "Thank You!" },
      discountCode: "THANKS10",
    },
    { status: 200 }
  );
}

/**
 * Create preview mode response with realistic discount code
 */
export async function createPreviewResponse(
  config: GamePopupConfig,
  campaignId?: string
): Promise<ReturnType<typeof data>> {
  console.log(`${config.logPrefix} ✅ Preview mode - returning mock prize (BYPASSING RATE LIMITS)`);

  // Default preview values
  let prize = {
    id: "preview-prize",
    label: "10% OFF",
  };
  let discountCode = "PREVIEW-10OFF";
  let behavior = "SHOW_CODE_AND_AUTO_APPLY";

  // Try to fetch actual config from Redis preview session
  if (campaignId?.startsWith("preview-")) {
    try {
      const previewToken = campaignId.replace("preview-", "");
      const { getRedis, REDIS_PREFIXES } = await import("~/lib/redis.server");
      const { generatePreviewDiscountCode } = await import("~/lib/preview-discount.server");
      const redis = getRedis();

      if (redis && previewToken) {
        const PREVIEW_PREFIX = `${REDIS_PREFIXES.SESSION}:preview`;
        const redisKey = `${PREVIEW_PREFIX}:${previewToken}`;
        const sessionDataStr = await redis.get(redisKey);

        if (sessionDataStr) {
          const sessionData = JSON.parse(sessionDataStr);
          const contentConfig = sessionData.data?.contentConfig;

          // Get prizes from the appropriate field (wheelSegments for spin, prizes for scratch)
          const prizes: Prize[] = contentConfig?.[config.prizesField] || [];

          if (prizes.length > 0) {
            // Filter out "try again" or no-discount prizes and pick a valid one
            const validPrizes = prizes.filter(
              (p: Prize) => p.discountConfig?.enabled !== false && p.label?.toLowerCase() !== "try again"
            );

            const selectedPrize = validPrizes.length > 0 ? validPrizes[0] : prizes[0];
            if (selectedPrize) {
              prize = {
                id: selectedPrize.id || "preview-prize",
                label: selectedPrize.label || "10% OFF",
              };

              if (selectedPrize.discountConfig) {
                discountCode = generatePreviewDiscountCode(selectedPrize.discountConfig) || "PREVIEW-SAVE";
                behavior = selectedPrize.discountConfig.behavior || "SHOW_CODE_AND_AUTO_APPLY";
              }
            }
          }

          console.log(`${config.logPrefix} 🎟️ Preview prize selected: ${prize.label} -> ${discountCode}`);
        }
      }
    } catch (error) {
      console.warn(`${config.logPrefix} Failed to fetch preview config:`, error);
      // Continue with defaults
    }
  }

  return data(
    {
      success: true,
      prize: {
        id: prize.id,
        label: prize.label,
        discountCode,
      },
      discountCode,
      behavior,
      message: "Preview mode: Prize revealed (mock data)",
    },
    { status: 200 }
  );
}

/**
 * Create error response with proper status code
 */
export function createErrorResponse(
  error: string,
  status: number = 400,
  extra?: Record<string, unknown>
): ReturnType<typeof data> {
  return data({ success: false, error, ...extra }, { status });
}

/**
 * Handle Zod validation errors
 */
export function createZodErrorResponse(error: z.ZodError): ReturnType<typeof data> {
  return data(
    {
      success: false,
      error: "Invalid request data",
      errors: formatZodErrors(error),
      details: error.issues,
    },
    { status: 400 }
  );
}

// ============================================================================
// AUTHENTICATION & VALIDATION
// ============================================================================

export interface AuthResult {
  admin: AdminApiContext;
  shop: string;
}

/**
 * Authenticate request via app proxy
 */
export async function authenticateRequest(
  request: Request,
  _config: GamePopupConfig
): Promise<AuthResult | ReturnType<typeof data>> {
  const { admin, session } = await authenticate.public.appProxy(request);

  if (!session?.shop) {
    return createErrorResponse("Invalid session", 401);
  }

  return { admin, shop: session.shop };
}

/**
 * Validate storefront request for bot detection
 */
export async function validateSecurityRequest(
  request: Request,
  validatedRequest: GamePopupRequest,
  config: GamePopupConfig
): Promise<{ valid: true } | ReturnType<typeof data>> {
  const { validateStorefrontRequest } = await import(
    "~/domains/security/services/submission-validator.server"
  );
  const validation = await validateStorefrontRequest(request, validatedRequest);

  if (!validation.valid) {
    if (validation.isBotLikely) {
      const ip = request.headers.get("x-forwarded-for")?.split(",")[0] || "unknown";
      console.warn(
        `${config.logPrefix} 🤖 Bot detected (${validation.reason}) for campaign ${validatedRequest.campaignId}, IP: ${ip}`
      );
      return createBotHoneypotResponse();
    }
    const error =
      validation.reason === "session_expired"
        ? "Session expired. Please refresh the page."
        : "Invalid request";
    return createErrorResponse(error, 400);
  }

  return { valid: true };
}

/**
 * Check rate limit for email+campaign combination
 */
export async function checkGameRateLimit(
  email: string,
  campaignId: string,
  config: GamePopupConfig
): Promise<{ allowed: true } | ReturnType<typeof data>> {
  const { checkRateLimit, RATE_LIMITS, createEmailCampaignKey } = await import(
    "~/domains/security/services/rate-limit.server"
  );

  const rateLimitKey = createEmailCampaignKey(email, campaignId);
  const rateLimitResult = await checkRateLimit(
    rateLimitKey,
    config.rateLimitAction,
    RATE_LIMITS.EMAIL_PER_CAMPAIGN,
    { email, campaignId }
  );

  if (!rateLimitResult.allowed) {
    console.warn(`${config.logPrefix} Rate limit exceeded for ${email}`);
    return createErrorResponse("You've already played today", 429);
  }

  return { allowed: true };
}

// ============================================================================
// CAMPAIGN & PRIZE HANDLING
// ============================================================================

export interface CampaignData {
  id: string;
  storeId: string;
  name: string;
  templateType: string;
  contentConfig: Record<string, unknown>;
}

/**
 * Fetch and validate campaign
 */
export async function fetchAndValidateCampaign(
  campaignId: string,
  config: GamePopupConfig
): Promise<CampaignData | ReturnType<typeof data>> {
  const campaign = await prisma.campaign.findUnique({
    where: { id: campaignId },
    select: {
      id: true,
      storeId: true,
      name: true,
      templateType: true,
      contentConfig: true,
    },
  });

  if (!campaign) {
    return createErrorResponse("Campaign not found", 404);
  }

  if (campaign.templateType !== config.type) {
    return createErrorResponse("Invalid campaign type", 400);
  }

  return {
    ...campaign,
    contentConfig: parseContentConfig(campaign.contentConfig),
  };
}

/**
 * Extract prizes from campaign content config
 */
export function extractPrizes(
  contentConfig: Record<string, unknown>,
  config: GamePopupConfig
): Prize[] | ReturnType<typeof data> {
  const prizes = (contentConfig[config.prizesField] as Prize[]) || [];

  if (prizes.length === 0) {
    return createErrorResponse(config.noPrizesError, 400);
  }

  return prizes;
}


// ============================================================================
// DISCOUNT & LEAD HANDLING
// ============================================================================

export interface DiscountResult {
  success: true;
  discountCode: string;
}

/**
 * Generate discount code for winning prize
 */
export async function generateDiscountCode(
  admin: AdminApiContext,
  campaign: CampaignData,
  prize: Prize,
  email: string | undefined,
  config: GamePopupConfig
): Promise<DiscountResult | ReturnType<typeof data>> {
  const discountConfig = prize.discountConfig;

  if (!discountConfig || !discountConfig.enabled) {
    return createErrorResponse("No discount configured for this prize", 400);
  }

  const result = await getCampaignDiscountCode(
    admin,
    campaign.storeId,
    campaign.id,
    discountConfig as Parameters<typeof getCampaignDiscountCode>[3],
    email
  );

  if (!result.success || !result.discountCode) {
    console.error(`${config.logPrefix} Code generation failed:`, result.errors);
    return createErrorResponse(
      result.errors?.join(", ") || "Failed to generate discount code",
      500
    );
  }

  return { success: true, discountCode: result.discountCode };
}

export interface LeadMetadata {
  source: string;
  prizeId: string;
  prizeLabel: string;
  sessionId: string;
  generatedAt: string;
  [key: string]: unknown;
}

/**
 * Store lead with generated discount code
 * Handles both email and anonymous leads
 * Returns the lead ID if created successfully
 */
export async function storeLead(
  campaign: CampaignData,
  prize: Prize,
  discountCode: string,
  email: string | undefined,
  sessionId: string,
  source: string,
  config: GamePopupConfig
): Promise<{ id: string } | null> {
  try {
    const leadMetadata: LeadMetadata = {
      source,
      prizeId: prize.id,
      prizeLabel: prize.label,
      sessionId,
      generatedAt: new Date().toISOString(),
    };

    if (email) {
      // If email provided, upsert by email
      const lead = await prisma.lead.upsert({
        where: {
          storeId_campaignId_email: {
            storeId: campaign.storeId,
            campaignId: campaign.id,
            email,
          },
        },
        create: {
          email,
          campaignId: campaign.id,
          storeId: campaign.storeId,
          discountCode,
          sessionId,
          metadata: JSON.stringify(leadMetadata),
        },
        update: {
          discountCode,
          metadata: JSON.stringify(leadMetadata),
          updatedAt: new Date(),
        },
        select: { id: true },
      });
      return lead;
    } else {
      // If no email, create anonymous lead record for this session
      const anonymousEmail = `session_${sessionId}@anonymous.local`;
      const lead = await prisma.lead.create({
        data: {
          email: anonymousEmail,
          campaignId: campaign.id,
          storeId: campaign.storeId,
          discountCode,
          sessionId,
          metadata: JSON.stringify(leadMetadata),
        },
        select: { id: true },
      });
      return lead;
    }
  } catch (error) {
    console.error(`${config.logPrefix} Lead storage failed:`, error);
    // Continue anyway - code was generated successfully
    return null;
  }
}

/**
 * Record SUBMIT and COUPON_ISSUED events for game popup interactions
 * This ensures game popups are tracked in analytics alongside newsletter submissions
 */
interface RecordGamePopupEventsParams {
  storeId: string;
  campaignId: string;
  leadId?: string;
  sessionId: string;
  visitorId?: string;
  discountCode: string;
  email?: string;
  prizeId: string;
  prizeLabel: string;
  source: string;
  config: GamePopupConfig;
}

async function recordGamePopupEvents(params: RecordGamePopupEventsParams): Promise<void> {
  const {
    storeId,
    campaignId,
    leadId,
    sessionId,
    visitorId,
    discountCode,
    email,
    prizeId,
    prizeLabel,
    source,
    config,
  } = params;

  try {
    // Record SUBMIT event (user completed the game interaction)
    await PopupEventService.recordEvent({
      storeId,
      campaignId,
      leadId: leadId ?? null,
      sessionId,
      visitorId: visitorId ?? null,
      eventType: "SUBMIT",
      pageUrl: null,
      pageTitle: null,
      referrer: null,
      userAgent: null,
      ipAddress: null,
      deviceType: null,
      metadata: {
        email: email ?? null,
        source,
        prizeId,
        prizeLabel,
        gameType: config.type,
      },
    });

    // Record COUPON_ISSUED event (discount code was generated)
    await PopupEventService.recordEvent({
      storeId,
      campaignId,
      leadId: leadId ?? null,
      sessionId,
      visitorId: visitorId ?? null,
      eventType: "COUPON_ISSUED",
      pageUrl: null,
      userAgent: null,
      ipAddress: null,
      deviceType: null,
      metadata: {
        discountCode,
        prizeId,
        prizeLabel,
        source,
        gameType: config.type,
      },
    });

    console.log(`${config.logPrefix} Analytics events recorded (SUBMIT + COUPON_ISSUED)`);
  } catch (error) {
    // Don't fail the request if analytics recording fails
    console.error(`${config.logPrefix} Failed to record analytics events:`, error);
  }
}

/**
 * Build success response with prize and discount info
 */
export function buildSuccessResponse(
  prize: Prize,
  discountCode: string,
  discountConfig: Prize["discountConfig"]
): GamePopupResponse {
  const behavior = discountConfig?.behavior || "SHOW_CODE_AND_AUTO_APPLY";

  return {
    success: true,
    prize: {
      id: prize.id,
      label: prize.label,
      color: prize.color,
    },
    discountCode,
    behavior: String(behavior),
    displayCode: true,
    autoApply: behavior === "SHOW_CODE_AND_AUTO_APPLY",
  };
}

// ============================================================================
// MAIN HANDLER
// ============================================================================

export interface HandleGamePopupOptions {
  /** The game popup configuration */
  config: GamePopupConfig;
  /** The validated request data */
  validatedRequest: GamePopupRequest & { email?: string };
  /** The authenticated admin context */
  admin: AdminApiContext;
  /** The campaign data */
  campaign: CampaignData;
  /** The content config from the campaign */
  contentConfig: Record<string, unknown>;
  /** Lead source identifier (e.g., "spin_to_win_popup") */
  leadSource: string;
}

/**
 * Main handler for game popup prize generation
 *
 * This function handles the core flow after authentication and campaign validation:
 * 1. Extract prizes from content config
 * 2. Select a prize based on probability
 * 3. Generate discount code
 * 4. Store lead
 * 5. Return success response
 */
export async function handleGamePopupPrize(
  options: HandleGamePopupOptions
): Promise<ReturnType<typeof data>> {
  const { config, validatedRequest, admin, campaign, contentConfig, leadSource } = options;
  const { email, sessionId } = validatedRequest;

  // Extract prizes
  const prizesResult = extractPrizes(contentConfig, config);
  if (!Array.isArray(prizesResult)) {
    return prizesResult; // Error response
  }
  const prizes = prizesResult;

  // Select winning prize
  const winningPrize = selectPrizeByProbability(prizes);
  console.log(`${config.logPrefix} Server selected prize:`, {
    prizeId: winningPrize.id,
    label: winningPrize.label,
  });

  // Generate discount code
  const discountResult = await generateDiscountCode(
    admin,
    campaign,
    winningPrize,
    email,
    config
  );
  if (!("success" in discountResult) || !discountResult.success) {
    return discountResult as ReturnType<typeof data>;
  }
  const { discountCode } = discountResult;

  // Store lead
  const lead = await storeLead(
    campaign,
    winningPrize,
    discountCode,
    email,
    sessionId,
    leadSource,
    config
  );

  // Record analytics events (SUBMIT and COUPON_ISSUED)
  await recordGamePopupEvents({
    storeId: campaign.storeId,
    campaignId: campaign.id,
    leadId: lead?.id,
    sessionId,
    visitorId: validatedRequest.visitorId,
    discountCode,
    email,
    prizeId: winningPrize.id,
    prizeLabel: winningPrize.label,
    source: leadSource,
    config,
  });

  // Build and return success response
  const response = buildSuccessResponse(
    winningPrize,
    discountCode,
    winningPrize.discountConfig
  );

  return data(response, { status: 200 });
}

