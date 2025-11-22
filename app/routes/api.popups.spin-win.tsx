/**
 * API Route: Spin-to-Win Prize Code Generation
 *
 * Dynamically generates unique discount codes when users win prizes on the spin-to-win popup.
 * Integrates with DiscountService to create single-use codes based on segment configuration.
 *
 * Features:
 * - Per-segment discount configuration
 * - Unique code generation via Shopify API
 * - Lead tracking with generated codes
 * - Support for all discount types (%, fixed, free shipping)
 */

import { data, type ActionFunctionArgs } from "react-router";
import { z } from "zod";
import { authenticate } from "~/shopify.server";
import prisma from "~/db.server";
import { getCampaignDiscountCode } from "~/domains/commerce/services/discount.server";
import { PopupEventService } from "~/domains/analytics/popup-events.server";

// Request validation schema - NO prizeId (security fix)
const SpinWinRequestSchema = z.object({
    campaignId: z.string().cuid(),
    email: z.string().email(),
    sessionId: z.string(),
    challengeToken: z.string(), // REQUIRED: Challenge token for security
});

type SpinWinRequest = z.infer<typeof SpinWinRequestSchema>;

// Response types
interface SpinWinResponse {
    success: boolean;
    prize?: {
        id: string;
        label: string;
        color?: string;
    };
    discountCode?: string;
    displayCode?: boolean; // Whether to show code to user
    autoApply?: boolean; // Whether to auto-apply
    deliveryMode?: string;
    expiresAt?: string;
    error?: string;
}

export async function action({ request }: ActionFunctionArgs) {
    try {
        // Authenticate via app proxy (storefront context)
        const { admin, session } = await authenticate.public.appProxy(request);

        if (!session?.shop) {
            return data(
                { success: false, error: "Invalid session" },
                { status: 401 }
            );
        }

        // Parse and validate request body
        const body = await request.json();
        const validatedRequest = SpinWinRequestSchema.parse(body);

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
            return data(
                { success: false, error: "Campaign not found" },
                { status: 404 }
            );
        }

        if (campaign.templateType !== "SPIN_TO_WIN") {
            return data(
                { success: false, error: "Invalid campaign type" },
                { status: 400 }
            );
        }

        // SECURITY: Validate challenge token
        const ip = request.headers.get("x-forwarded-for")?.split(",")[0] ||
            request.headers.get("x-real-ip") ||
            "unknown";

        const { validateAndConsumeToken } = await import("~/domains/security/services/challenge-token.server");
        const tokenValidation = await validateAndConsumeToken(
            validatedRequest.challengeToken,
            validatedRequest.campaignId,
            validatedRequest.sessionId,
            ip,
            false
        );

        if (!tokenValidation.valid) {
            console.warn(`[Spin-to-Win] Token validation failed: ${tokenValidation.error}`);
            return data(
                { success: false, error: tokenValidation.error || "Invalid or expired token" },
                { status: 403 }
            );
        }

        // SECURITY: Rate limit per email+campaign
        const { checkRateLimit, RATE_LIMITS, createEmailCampaignKey } = await import("~/domains/security/services/rate-limit.server");
        const rateLimitKey = createEmailCampaignKey(email, validatedRequest.campaignId);
        const rateLimitResult = await checkRateLimit(
            rateLimitKey,
            "spin_to_win",
            RATE_LIMITS.EMAIL_PER_CAMPAIGN,
            { email, campaignId: validatedRequest.campaignId }
        );

        if (!rateLimitResult.allowed) {
            console.warn(`[Spin-to-Win] Rate limit exceeded for ${email}`);
            return data(
                { success: false, error: "You've already played today" },
                { status: 429 }
            );
        }

        // Extract wheel segments from content config
        let contentConfig = campaign.contentConfig as any;
        if (typeof contentConfig === 'string') {
            try {
                contentConfig = JSON.parse(contentConfig);
            } catch (e) {
                console.error("[Spin-to-Win] Failed to parse contentConfig:", e);
                contentConfig = {};
            }
        }
        const wheelSegments = contentConfig?.wheelSegments || [];

        if (wheelSegments.length === 0) {
            return data(
                { success: false, error: "No wheel segments configured" },
                { status: 400 }
            );
        }

        // SERVER-SIDE PRIZE SELECTION (SECURITY FIX)
        // Calculate total probability
        const totalProbability = wheelSegments.reduce((sum: number, seg: any) => sum + (seg.probability || 0), 0);

        // Select a random segment based on probability
        let random = Math.random() * totalProbability;
        let winningSegment = wheelSegments[0]; // Fallback

        for (const segment of wheelSegments) {
            random -= (segment.probability || 0);
            if (random <= 0) {
                winningSegment = segment;
                break;
            }
        }

        console.log(`[Spin-to-Win] Server selected prize:`, {
            prizeId: winningSegment.id,
            label: winningSegment.label,
        });

        // Check if segment has discount config
        const discountConfig = winningSegment.discountConfig;

        if (!discountConfig || !discountConfig.enabled) {
            return data(
                { success: false, error: "No discount configured for this prize" },
                { status: 400 }
            );
        }

        // Generate unique discount code using DiscountService
        const result = await getCampaignDiscountCode(
            admin,
            campaign.storeId,
            campaignId,
            discountConfig,
            email
        );

        if (!result.success || !result.discountCode) {
            console.error("[Spin-to-Win] Code generation failed:", result.errors);
            return data(
                {
                    success: false,
                    error: result.errors?.join(", ") || "Failed to generate discount code"
                },
                { status: 500 }
            );
        }

        // Store lead with generated code
        try {
            const prizeId = winningSegment.id;
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
                    sessionId,
                    discountCode: result.discountCode,
                    metadata: JSON.stringify({
                        prizeId,
                        segmentLabel: winningSegment.label,
                        sessionId,
                        generatedAt: new Date().toISOString(),
                        source: "spin_to_win_popup",
                    }),
                },
                update: {
                    discountCode: result.discountCode,
                    metadata: JSON.stringify({
                        prizeId,
                        segmentLabel: winningSegment.label,
                        sessionId,
                        generatedAt: new Date().toISOString(),
                        source: "spin_to_win_popup",
                    }),
                    updatedAt: new Date(),
                },
            });
        } catch (error) {
            console.error("[Spin-to-Win] Lead storage failed:", error);
            // Continue anyway - code was generated successfully
        }

        // Track the win event
        // TODO: Uncomment when PopupEventService.trackEvent is available
        /*
        try {
            const prizeId = winningSegment.id;
            await PopupEventService.track({
                campaignId,
                storeId: campaign.storeId,
                eventType: "win",
                sessionId: sessionId || undefined,
                metadata: {
                    prizeId,
                    segmentLabel: winningSegment.label,
                    discountCode: result.discountCode,
                    email,
                },
            });
        } catch (error) {
            console.error("[Spin-to-Win] Event tracking failed:", error);
            // Continue anyway
        }
        */

        // Determine display settings based on delivery mode
        const deliveryMode = discountConfig.deliveryMode || "show_code_fallback";
        const codePresentation = discountConfig.codePresentation || "show_code";

        const response: SpinWinResponse = {
            success: true,
            prize: {
                id: winningSegment.id,
                label: winningSegment.label,
                color: winningSegment.color,
            },
            discountCode: result.discountCode,
            deliveryMode,
            displayCode: codePresentation === "show_code",
            autoApply:
                deliveryMode === "auto_apply_only" ||
                deliveryMode === "show_code_fallback",
        };

        return data(response, { status: 200 });

    } catch (error) {
        console.error("[Spin-to-Win API] Error:", error);

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

        return data(
            { success: false, error: "Internal server error" },
            { status: 500 }
        );
    }
}
