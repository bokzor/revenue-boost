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
      findFirst: vi.fn(),
    },
    lead: {
      upsert: vi.fn(),
      findFirst: vi.fn(),
      update: vi.fn(),
    },
  },
}));

vi.mock("~/lib/cors.server", () => ({
  storefrontCors: vi.fn(() => ({})),
}));

vi.mock("~/lib/auth-helpers.server", () => ({
  getStoreIdFromShop: vi.fn((shop: string) => shop.replace(".myshopify.com", "")),
  createAdminApiContext: vi.fn(() => ({ graphql: vi.fn() })),
}));

vi.mock("~/lib/shopify/customer.server", () => ({
  upsertCustomer: vi.fn().mockResolvedValue({ success: true, shopifyCustomerId: "gid://shopify/Customer/123" }),
  sanitizeCustomerData: vi.fn((data: any) => data),
  extractCustomerId: vi.fn((gid: string) => gid.split("/").pop()),
}));

vi.mock("~/domains/security/services/challenge-token.server", () => ({
  validateAndConsumeToken: vi.fn(),
}));

vi.mock("~/domains/commerce/services/discount.server", () => ({
  getCampaignDiscountCode: vi.fn(),
}));

vi.mock("~/domains/analytics/popup-events.server", () => ({
  PopupEventService: {
    recordEvent: vi.fn().mockResolvedValue(undefined),
  },
}));

vi.mock("~/domains/security/services/rate-limit.server", () => ({
  checkRateLimit: vi.fn().mockResolvedValue({
    allowed: true,
    remaining: 10,
    resetAt: new Date(),
  }),
  RATE_LIMITS: {
    CHALLENGE_REQUEST: { maxRequests: 3, windowSeconds: 600 },
    DISCOUNT_GENERATION: { maxRequests: 5, windowSeconds: 3600 },
    LEAD_SUBMISSION: { maxRequests: 10, windowSeconds: 3600 },
    EMAIL_PER_CAMPAIGN: { maxRequests: 1, windowSeconds: 86400 },
  },
  createEmailCampaignKey: vi.fn((email: string, campaignId: string) =>
    `email:${email}:campaign:${campaignId}`,
  ),
  createSessionKey: vi.fn((sessionId: string, action?: string) =>
    action ? `session:${sessionId}:${action}` : `session:${sessionId}`,
  ),
  createIpKey: vi.fn((ip: string, action?: string) =>
    action ? `ip:${ip}:${action}` : `ip:${ip}`,
  ),
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
          behavior: "SHOW_CODE_ONLY",
        },
      };

      vi.mocked(prisma.campaign.findUnique).mockResolvedValue(mockCampaign as any);

      // Mock challenge token validation
      vi.mocked(validateAndConsumeToken).mockResolvedValue({
        valid: true,
      });

      // Mock discount code generation
      vi.mocked(getCampaignDiscountCode).mockResolvedValue({
        success: true,
        discountCode: mockDiscountCode,
        isNewDiscount: true,
      });

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

      const issueResponse = await issueDiscountAction({ request: issueRequest } as any);
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
        expect.any(String), // IP address
        false // skipRateLimitCheck
      );

      // Setup mocks for save-email action
      // Mock lead.findFirst to verify discount code
      vi.mocked(prisma.lead.findFirst).mockResolvedValue({
        id: "lead_123",
        email: `session_${mockSessionId}@anonymous.local`, // Anonymous email placeholder
      } as any);

      // Mock campaign.findFirst to return campaign with store info
      vi.mocked(prisma.campaign.findFirst).mockResolvedValue({
        id: mockCampaignId,
        name: "Free Shipping Test",
        store: {
          id: mockStoreId,
          shopifyDomain: "test-store.myshopify.com",
          accessToken: "test-token",
        },
      } as any);

      // Mock lead.update
      vi.mocked(prisma.lead.update).mockResolvedValue({
        id: "lead_123",
        email: mockEmail,
        discountCode: mockDiscountCode,
      } as any);

      // Step 2: Save email with discount code (NO challenge token needed)
      // Note: The save-email route requires ?shop= query param
      const saveEmailRequest = new Request("http://localhost/api/leads/save-email?shop=test-store.myshopify.com", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          campaignId: mockCampaignId,
          sessionId: mockSessionId,
          email: mockEmail,
          discountCode: mockDiscountCode,
        }),
      });

      const saveEmailResponse = await saveEmailAction({ request: saveEmailRequest } as any);
      const saveEmailPayload = (saveEmailResponse as any).data as any;

      // Verify email was saved successfully
      expect(saveEmailPayload.success).toBe(true);

      // Verify challenge token was NOT validated again (still only 1 call)
      expect(validateAndConsumeToken).toHaveBeenCalledTimes(1);

      // Verify lead was updated with real email
      expect(prisma.lead.update).toHaveBeenCalledWith({
        where: { id: "lead_123" },
        data: expect.objectContaining({
          email: mockEmail.toLowerCase(),
        }),
      });
    });

    it("should fail if discount issuance fails (no code returned)", async () => {
      // Use a unique session ID for this test to avoid cache hits from previous tests
      const uniqueSessionId = "session-fail-test-123";

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
      });

      // Mock discount generation failure (success: false means failure)
      vi.mocked(getCampaignDiscountCode).mockResolvedValue({
        success: false,
        discountCode: undefined,
        isNewDiscount: false,
        errors: ["Failed to create discount"],
      });

      const issueRequest = new Request("http://localhost/api/discounts/issue", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          campaignId: mockCampaignId,
          sessionId: uniqueSessionId, // Use unique session
          challengeToken: mockChallengeToken,
          cartSubtotalCents: 5000,
        }),
      });

      const issueResponse = await issueDiscountAction({ request: issueRequest } as any);
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

      const issueResponse = await issueDiscountAction({ request: issueRequest } as any);
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
      });
      vi.mocked(getCampaignDiscountCode).mockResolvedValue({
        success: true,
        discountCode: mockDiscountCode,
        isNewDiscount: true,
      });

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

      const issueResponse = await issueDiscountAction({ request: issueRequest } as any);
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


