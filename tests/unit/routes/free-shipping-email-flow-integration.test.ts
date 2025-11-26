/**
 * Integration Tests: Free Shipping Email-Required Flow
 * 
 * Tests the complete flow for Free Shipping popup with email capture:
 * 1. Issue discount (consumes challenge token)
 * 2. Save email with discount code (no token needed)
 * 
 * This ensures the challenge token is only consumed once.
 */

import { describe, it, expect, vi, beforeEach } from "vitest";
import { action as issueDiscountAction } from "~/routes/api.discounts.issue";
import { action as saveEmailAction } from "~/routes/api.leads.save-email";

// Mock dependencies
vi.mock("~/shopify.server", () => ({
  authenticate: {
    public: {
      appProxy: vi.fn(),
    },
  },
}));

vi.mock("~/db.server", () => ({
  default: {
    campaign: {
      findUnique: vi.fn(),
    },
    lead: {
      upsert: vi.fn(),
    },
  },
}));

vi.mock("~/domains/security/services/challenge-token.server", () => ({
  validateAndConsumeToken: vi.fn(),
}));

vi.mock("~/domains/commerce/services/discount.server", () => ({
  getCampaignDiscountCode: vi.fn(),
}));

vi.mock("~/domains/security/services/rate-limit.server", () => ({
  checkRateLimit: vi.fn(),
}));

import { authenticate } from "~/shopify.server";
import prisma from "~/db.server";
import { validateAndConsumeToken } from "~/domains/security/services/challenge-token.server";
import { getCampaignDiscountCode } from "~/domains/commerce/services/discount.server";
import { checkRateLimit } from "~/domains/security/services/rate-limit.server";

describe("Free Shipping Email-Required Flow - Integration Tests", () => {
  const mockCampaignId = "cm123456789012345678901234"; // Valid format: starts with 'c', 8+ chars
  const mockStoreId = "store123456789";
  const mockSessionId = "session456789";
  const mockEmail = "customer@example.com";
  const mockChallengeToken = "validchallengetokenxyz";
  const mockDiscountCode = "FREESHIP50";

  let mockAdmin: any;
  let mockSession: any;

  beforeEach(() => {
    vi.clearAllMocks();

    // Setup mock admin and session
    mockAdmin = {
      graphql: vi.fn(),
    };

    mockSession = {
      shop: "test-store.myshopify.com",
      accessToken: "test-token",
    };

    vi.mocked(authenticate.public.appProxy).mockResolvedValue({
      admin: mockAdmin,
      session: mockSession,
    } as any);

    // Mock rate limiting (allow all requests by default)
    vi.mocked(checkRateLimit).mockResolvedValue({
      allowed: true,
      remaining: 100,
      resetAt: new Date(Date.now() + 60000),
    } as any);
  });

  describe("Scenario: Email Required - Issue Discount Then Save Email", () => {
    it("should complete full flow: issue discount → save email with code", async () => {
      // Setup campaign with free shipping discount and email required
      const mockCampaign = {
        id: mockCampaignId,
        storeId: mockStoreId,
        templateType: "FREE_SHIPPING",
        name: "Free Shipping Email Test",
        status: "ACTIVE",
        contentConfig: {
          threshold: 50,
          requireEmailToClaim: true,
        },
        discountConfig: {
          enabled: true,
          type: "generated",
          valueType: "FREE_SHIPPING",
          prefix: "FREESHIP",
          deliveryMode: "show_code_always",
        },
      };

      vi.mocked(prisma.campaign.findUnique).mockResolvedValue(mockCampaign as any);

      // Mock challenge token validation (consumed once)
      vi.mocked(validateAndConsumeToken).mockResolvedValue({
        valid: true,
        consumed: true,
      });

      // Mock discount code generation
      vi.mocked(getCampaignDiscountCode).mockResolvedValue({
        discountCode: mockDiscountCode,
        isNewDiscount: true,
      } as any);

      // Step 1: Issue discount (consumes challenge token)
      const issueRequest = new Request("http://localhost/api/discounts/issue", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          campaignId: mockCampaignId,
          sessionId: mockSessionId,
          challengeToken: mockChallengeToken,
          cartSubtotalCents: 5000, // $50 cart
        }),
      });

      const issueResponse = await issueDiscountAction({ request: issueRequest });
      const issuePayload = (issueResponse as any).data as any;

      // Verify discount was issued successfully
      expect(issuePayload.success).toBe(true);
      expect(issuePayload.code).toBe(mockDiscountCode);

      // Verify challenge token was validated and consumed ONCE
      expect(validateAndConsumeToken).toHaveBeenCalledTimes(1);
      expect(validateAndConsumeToken).toHaveBeenCalledWith(
        mockChallengeToken,
        mockCampaignId,
        mockSessionId,
        expect.any(String) // IP address
      );

      // Step 2: Save email with discount code (NO challenge token needed)
      const saveEmailRequest = new Request("http://localhost/api/leads/save-email", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          campaignId: mockCampaignId,
          sessionId: mockSessionId,
          email: mockEmail,
          discountCode: mockDiscountCode,
        }),
      });

      const saveEmailResponse = await saveEmailAction({ request: saveEmailRequest });
      const saveEmailPayload = (saveEmailResponse as any).data as any;

      // Verify email was saved successfully
      expect(saveEmailPayload.success).toBe(true);

      // Verify challenge token was NOT validated again (still only 1 call)
      expect(validateAndConsumeToken).toHaveBeenCalledTimes(1);

      // Verify lead was created/updated with email and discount code
      expect(prisma.lead.upsert).toHaveBeenCalledWith({
        where: {
          storeId_campaignId_email: {
            storeId: mockStoreId,
            campaignId: mockCampaignId,
            email: mockEmail,
          },
        },
        create: expect.objectContaining({
          email: mockEmail,
          discountCode: mockDiscountCode,
          campaignId: mockCampaignId,
          sessionId: mockSessionId,
          storeId: mockStoreId,
        }),
        update: expect.objectContaining({
          discountCode: mockDiscountCode,
        }),
      });
    });

    it("should fail if discount issuance fails (no code returned)", async () => {
      const mockCampaign = {
        id: mockCampaignId,
        storeId: mockStoreId,
        templateType: "FREE_SHIPPING",
        status: "ACTIVE",
        contentConfig: {
          threshold: 50,
          requireEmailToClaim: true,
        },
        discountConfig: {
          enabled: true,
          type: "generated",
          valueType: "FREE_SHIPPING",
        },
      };

      vi.mocked(prisma.campaign.findUnique).mockResolvedValue(mockCampaign as any);
      vi.mocked(validateAndConsumeToken).mockResolvedValue({
        valid: true,
        consumed: true,
      });

      // Mock discount generation failure
      vi.mocked(getCampaignDiscountCode).mockResolvedValue({
        discountCode: null,
        isNewDiscount: false,
      } as any);

      const issueRequest = new Request("http://localhost/api/discounts/issue", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          campaignId: mockCampaignId,
          sessionId: mockSessionId,
          challengeToken: mockChallengeToken,
          cartSubtotalCents: 5000,
        }),
      });

      const issueResponse = await issueDiscountAction({ request: issueRequest });
      const issuePayload = (issueResponse as any).data as any;

      // Verify discount issuance failed
      expect(issuePayload.success).toBe(false);
      expect(issuePayload.error).toBeDefined();

      // Challenge token was still consumed
      expect(validateAndConsumeToken).toHaveBeenCalledTimes(1);
    });

    it("should fail if challenge token is invalid", async () => {
      const mockCampaign = {
        id: mockCampaignId,
        storeId: mockStoreId,
        status: "ACTIVE",
        discountConfig: { enabled: true },
      };

      vi.mocked(prisma.campaign.findUnique).mockResolvedValue(mockCampaign as any);

      // Mock invalid challenge token
      vi.mocked(validateAndConsumeToken).mockResolvedValue({
        valid: false,
        consumed: false,
        error: "Token expired",
      });

      const issueRequest = new Request("http://localhost/api/discounts/issue", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          campaignId: mockCampaignId,
          sessionId: mockSessionId,
          challengeToken: "invalid-token",
          cartSubtotalCents: 5000,
        }),
      });

      const issueResponse = await issueDiscountAction({ request: issueRequest });
      const issuePayload = (issueResponse as any).data as any;

      // Verify request failed due to invalid token
      expect(issuePayload.success).toBe(false);
      expect(issuePayload.error).toBeDefined();
      // Error message could be "Token expired" or "Security check failed"
      expect(issuePayload.error).toMatch(/Token expired|Security check failed/);

      // Discount code generation should NOT have been called
      expect(getCampaignDiscountCode).not.toHaveBeenCalled();
    });
  });

  describe("Scenario: Email NOT Required - Auto-Issue Discount", () => {
    it("should issue discount without email when threshold is reached", async () => {
      const mockCampaign = {
        id: mockCampaignId,
        storeId: mockStoreId,
        templateType: "FREE_SHIPPING",
        status: "ACTIVE",
        contentConfig: {
          threshold: 50,
          requireEmailToClaim: false, // No email required
        },
        discountConfig: {
          enabled: true,
          type: "generated",
          valueType: "FREE_SHIPPING",
          prefix: "FREESHIP",
        },
      };

      vi.mocked(prisma.campaign.findUnique).mockResolvedValue(mockCampaign as any);
      vi.mocked(validateAndConsumeToken).mockResolvedValue({
        valid: true,
        consumed: true,
      });
      vi.mocked(getCampaignDiscountCode).mockResolvedValue({
        discountCode: mockDiscountCode,
        isNewDiscount: true,
      } as any);

      const issueRequest = new Request("http://localhost/api/discounts/issue", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          campaignId: mockCampaignId,
          sessionId: mockSessionId,
          challengeToken: mockChallengeToken,
          cartSubtotalCents: 5000,
        }),
      });

      const issueResponse = await issueDiscountAction({ request: issueRequest });
      const issuePayload = (issueResponse as any).data as any;

      // Verify discount was issued
      expect(issuePayload.success).toBe(true);
      expect(issuePayload.code).toBe(mockDiscountCode);

      // Challenge token consumed once
      expect(validateAndConsumeToken).toHaveBeenCalledTimes(1);

      // No email saved (email not required)
      expect(prisma.lead.upsert).not.toHaveBeenCalled();
    });
  });
});


