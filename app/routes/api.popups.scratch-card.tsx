/**
 * API Route: Scratch Card Prize Code Generation
 *
 * Dynamically generates unique discount codes when users scratch the card.
 * Integrates with DiscountService to create single-use codes based on prize configuration.
 */

import { data, type ActionFunctionArgs } from "react-router";
import { z } from "zod";
import { authenticate } from "~/shopify.server";
import prisma from "~/db.server";
import { getCampaignDiscountCode } from "~/domains/commerce/services/discount.server";
import { PopupEventService } from "~/domains/analytics/popup-events.server";

// Request validation schema
const ScratchCardRequestSchema = z.object({
  campaignId: z.string().min(1).refine(
    (id) => id.startsWith("preview-") || /^[cC][^\s-]{8,}$/.test(id),
    "Invalid campaign ID format"
  ),
  email: z.string().email().optional(), // Optional: email may not be required before scratching
  sessionId: z.string().min(1, "Session ID is required"),
  challengeToken: z.string().min(1, "Challenge token is required"), // REQUIRED: Challenge token for security
});

type ScratchCardRequest = z.infer<typeof ScratchCardRequestSchema>;

// Response types
interface ScratchCardResponse {
  success: boolean;
  prize?: {
    id: string;
    label: string;
  };
  discountCode?: string;
  displayCode?: boolean; // Whether to show code to user
  autoApply?: boolean; // Whether to auto-apply
  behavior?: string;
  expiresAt?: string;
  error?: string;
}

export async function action({ request }: ActionFunctionArgs) {
  try {
    // Authenticate via app proxy (storefront context)
    const { admin, session } = await authenticate.public.appProxy(request);

    if (!session?.shop) {
      return data({ success: false, error: "Invalid session" }, { status: 401 });
    }

    // Parse and validate request body
    const body = await request.json();
    const validatedRequest = ScratchCardRequestSchema.parse(body);

    const { campaignId, email, sessionId } = validatedRequest;

    // Fetch campaign with full config
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
      return data({ success: false, error: "Campaign not found" }, { status: 404 });
    }

    if (campaign.templateType !== "SCRATCH_CARD") {
      return data({ success: false, error: "Invalid campaign type" }, { status: 400 });
    }

    // Validate email requirements based on campaign configuration
    const contentConfig = campaign.contentConfig as any;
    const emailRequired = contentConfig?.emailRequired !== false; // Default to true
    const emailBeforeScratching = contentConfig?.emailBeforeScratching === true;

    // Scenario 1: Email required before scratching
    if (emailRequired && emailBeforeScratching && !email) {
      console.log("[Scratch Card] Email required before scratching but not provided");
      return data(
        {
          success: false,
          error: "Email is required before scratching for this campaign",
          requiresEmail: true,
        },
        { status: 400 }
      );
    }

    console.log("[Scratch Card] Email validation passed:", {
      emailRequired,
      emailBeforeScratching,
      emailProvided: !!email,
      scenario:
        emailRequired && emailBeforeScratching
          ? "Email before scratch"
          : emailRequired
            ? "Email after scratch"
            : "No email required",
    });

    // SECURITY: Validate challenge token
    const ip =
      request.headers.get("x-forwarded-for")?.split(",")[0] ||
      request.headers.get("x-real-ip") ||
      "unknown";

    const { validateAndConsumeToken } = await import(
      "~/domains/security/services/challenge-token.server"
    );
    const tokenValidation = await validateAndConsumeToken(
      validatedRequest.challengeToken,
      validatedRequest.campaignId,
      validatedRequest.sessionId,
      ip,
      false
    );

    if (!tokenValidation.valid) {
      console.warn(`[Scratch Card] Token validation failed: ${tokenValidation.error}`);
      return data(
        { success: false, error: tokenValidation.error || "Invalid or expired token" },
        { status: 403 }
      );
    }

    // PREVIEW MODE: Return mock prize
    // BYPASS RATE LIMITING for preview mode to allow unlimited testing
    const isPreviewCampaign = validatedRequest.campaignId.startsWith("preview-");
    if (isPreviewCampaign) {
      console.log(`[Scratch Card] ✅ Preview mode - returning mock prize (BYPASSING RATE LIMITS)`);
      return data(
        {
          success: true,
          prize: {
            type: "discount",
            value: "10% OFF",
            discountCode: "PREVIEW10",
          },
          message: "Preview mode: Prize revealed (mock data)",
        },
        { status: 200 }
      );
    }

    // PRODUCTION MODE: Rate limit per email+campaign (only if email is provided)
    if (email) {
      const { checkRateLimit, RATE_LIMITS, createEmailCampaignKey } = await import(
        "~/domains/security/services/rate-limit.server"
      );
      const rateLimitKey = createEmailCampaignKey(email, validatedRequest.campaignId);
      const rateLimitResult = await checkRateLimit(
        rateLimitKey,
        "scratch_card",
        RATE_LIMITS.EMAIL_PER_CAMPAIGN,
        { email, campaignId: validatedRequest.campaignId }
      );

      if (!rateLimitResult.allowed) {
        console.warn(`[Scratch Card] Rate limit exceeded for ${email}`);
        return data({ success: false, error: "You've already played today" }, { status: 429 });
      }
    }

    // Extract prizes from content config (already declared above at line 85)
    const prizes = contentConfig?.prizes || [];

    if (prizes.length === 0) {
      return data({ success: false, error: "No prizes configured" }, { status: 400 });
    }

    // SERVER-SIDE PRIZE SELECTION
    // Calculate total probability
    const totalProbability = prizes.reduce((sum: number, p: any) => sum + (p.probability || 0), 0);

    // Select a random prize based on probability
    let random = Math.random() * totalProbability;
    let winningPrize = prizes[0]; // Fallback

    for (const prize of prizes) {
      random -= prize.probability || 0;
      if (random <= 0) {
        winningPrize = prize;
        break;
      }
    }

    console.log(`[Scratch Card] Server selected prize:`, {
      prizeId: winningPrize.id,
      label: winningPrize.label,
    });

    // Check if prize has discount config
    const discountConfig = winningPrize.discountConfig;

    if (!discountConfig || !discountConfig.enabled) {
      return data(
        { success: false, error: "No discount configured for this prize" },
        { status: 400 }
      );
    }

    // Generate unique discount code using DiscountService
    // Only pass email if it's actually provided (not a session fallback)
    // The discount service will handle anonymous users appropriately
    const result = await getCampaignDiscountCode(
      admin,
      campaign.storeId,
      campaignId,
      discountConfig,
      email // Pass undefined if no email provided
    );

    if (!result.success || !result.discountCode) {
      console.error("[Scratch Card] Code generation failed:", result.errors);
      return data(
        {
          success: false,
          error: result.errors?.join(", ") || "Failed to generate discount code",
        },
        { status: 500 }
      );
    }

    // ALWAYS store lead with generated code (even without email)
    // This allows save-email endpoint to verify the discount code was legitimately generated
    try {
      const prizeId = winningPrize.id;
      const leadMetadata = {
        source: "scratch_card_popup",
        prizeId,
        prizeLabel: winningPrize.label,
        sessionId,
        generatedAt: new Date().toISOString(),
      };

      if (email) {
        // If email provided, upsert by email
        await prisma.lead.upsert({
          where: {
            storeId_campaignId_email: {
              storeId: campaign.storeId,
              campaignId,
              email,
            },
          },
          create: {
            email,
            campaignId,
            storeId: campaign.storeId,
            discountCode: result.discountCode,
            sessionId,
            metadata: JSON.stringify(leadMetadata),
          },
          update: {
            discountCode: result.discountCode,
            metadata: JSON.stringify(leadMetadata),
            updatedAt: new Date(),
          },
        });
      } else {
        // If no email, create anonymous lead record for this session
        // Use a temporary email format that will be replaced when real email is provided
        // Format: session_{sessionId}@anonymous.local
        const anonymousEmail = `session_${sessionId}@anonymous.local`;

        await prisma.lead.create({
          data: {
            email: anonymousEmail,
            campaignId,
            storeId: campaign.storeId,
            discountCode: result.discountCode,
            sessionId,
            metadata: JSON.stringify(leadMetadata),
          },
        });
      }
    } catch (error) {
      console.error("[Scratch Card] Lead storage failed:", error);
      // Continue anyway - code was generated successfully
    }

    // Determine display settings based on behavior
    const behavior = discountConfig.behavior || "SHOW_CODE_AND_AUTO_APPLY";

    const response: ScratchCardResponse = {
      success: true,
      prize: {
        id: winningPrize.id,
        label: winningPrize.label,
      },
      discountCode: result.discountCode,
      behavior,
      displayCode: true, // All behaviors show the code
      autoApply: behavior === "SHOW_CODE_AND_AUTO_APPLY",
    };

    return data(response, { status: 200 });
  } catch (error) {
    console.error("[Scratch Card API] Error:", error);

    if (error instanceof z.ZodError) {
      return data(
        {
          success: false,
          error: "Invalid request data",
          details: error.issues,
        },
        { status: 400 }
      );
    }

    return data({ success: false, error: "Internal server error" }, { status: 500 });
  }
}
