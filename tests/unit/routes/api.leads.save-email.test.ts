/**
 * Unit Tests for Save Email API
 * 
 * Tests the /api/leads/save-email endpoint including:
 * - Discount code verification (replaces challenge token validation)
 * - Anonymous email placeholder handling
 * - Lead update with real email
 * - Rate limiting
 * - Idempotency
 */

import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import type { ActionFunctionArgs } from "react-router";

// Mock dependencies before importing the route module
vi.mock("~/db.server", () => ({
  default: {
    lead: {
      findFirst: vi.fn(),
      update: vi.fn(),
    },
    campaign: {
      findFirst: vi.fn(),
    },
  },
}));

vi.mock("~/lib/cors.server", () => ({
  storefrontCors: vi.fn(() => ({
    "Access-Control-Allow-Origin": "*",
  })),
}));

vi.mock("~/lib/auth-helpers.server", () => ({
  getStoreIdFromShop: vi.fn((shop: string) => shop.replace(".myshopify.com", "")),
  createAdminApiContext: vi.fn(() => ({ graphql: vi.fn() })),
}));

vi.mock("~/lib/shopify/customer.server", () => ({
  upsertCustomer: vi.fn(),
  sanitizeCustomerData: vi.fn((data) => data),
  extractCustomerId: vi.fn((gid: string) => gid.split("/").pop()),
}));

vi.mock("~/domains/security/services/rate-limit.server", () => ({
  checkRateLimit: vi.fn().mockResolvedValue({
    allowed: true,
    remaining: 1,
    resetAt: new Date(),
  }),
  RATE_LIMITS: {
    EMAIL_PER_CAMPAIGN: { maxRequests: 5, windowSeconds: 86400 },
  },
  createEmailCampaignKey: vi.fn((email: string, campaignId: string) =>
    `email:${email}:campaign:${campaignId}`
  ),
}));

import prisma from "~/db.server";
import * as customerModule from "~/lib/shopify/customer.server";
import * as rateLimitModule from "~/domains/security/services/rate-limit.server";

const leadFindFirstMock = prisma.lead.findFirst as unknown as ReturnType<typeof vi.fn>;
const leadUpdateMock = prisma.lead.update as unknown as ReturnType<typeof vi.fn>;
const campaignFindFirstMock = prisma.campaign.findFirst as unknown as ReturnType<typeof vi.fn>;
const upsertCustomerMock = customerModule.upsertCustomer as unknown as ReturnType<typeof vi.fn>;
const checkRateLimitMock = rateLimitModule.checkRateLimit as unknown as ReturnType<typeof vi.fn>;

import { action as saveEmailAction } from "~/routes/api.leads.save-email";

describe("api.leads.save-email action", () => {
  const mockCampaignId = "cm123456789012345678901234";
  const mockSessionId = "session_123";
  const mockDiscountCode = "SCRATCH10";
  const mockEmail = "test@example.com";
  const mockShop = "test.myshopify.com";

  beforeEach(() => {
    vi.clearAllMocks();

    // Default mock setup
    upsertCustomerMock.mockResolvedValue({
      success: true,
      shopifyCustomerId: "gid://shopify/Customer/123",
      isNewCustomer: true,
    });

    checkRateLimitMock.mockResolvedValue({
      allowed: true,
      remaining: 1,
      resetAt: new Date(),
    });
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe("Security: Discount Code Verification", () => {
    it("should verify discount code exists for campaign/session", async () => {
      leadFindFirstMock.mockResolvedValueOnce({
        id: "lead_123",
        email: `session_${mockSessionId}@anonymous.local`,
      });

      campaignFindFirstMock.mockResolvedValue({
        id: mockCampaignId,
        name: "Test Campaign",
        store: {
          id: "store_123",
          shopifyDomain: mockShop,
          accessToken: "test_token",
        },
      });

      leadUpdateMock.mockResolvedValue({
        id: "lead_123",
        email: mockEmail,
      });

      const request = new Request(`http://localhost/api/leads/save-email?shop=${mockShop}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: mockEmail,
          campaignId: mockCampaignId,
          sessionId: mockSessionId,
          discountCode: mockDiscountCode,
          consent: true,
        }),
      });

      await saveEmailAction({ request } as unknown as ActionFunctionArgs);

      // Verify discount code was checked
      expect(leadFindFirstMock).toHaveBeenCalledWith({
        where: {
          discountCode: mockDiscountCode,
          campaignId: mockCampaignId,
          sessionId: mockSessionId,
        },
        select: {
          id: true,
          email: true,
        },
      });
    });

    it("should reject invalid discount code", async () => {
      leadFindFirstMock.mockResolvedValueOnce(null); // No lead found

      const request = new Request(`http://localhost/api/leads/save-email?shop=${mockShop}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: mockEmail,
          campaignId: mockCampaignId,
          sessionId: mockSessionId,
          discountCode: "INVALID_CODE",
        }),
      });

      const response = await saveEmailAction({ request } as unknown as ActionFunctionArgs);
      const payload = (response as any).data as any;

      expect(payload.success).toBe(false);
      expect(payload.error).toBe("Invalid discount code. Please refresh and try again.");
    });
  });

  describe("Anonymous Email Placeholder Handling", () => {
    it("should update anonymous lead with real email", async () => {
      const anonymousEmail = `session_${mockSessionId}@anonymous.local`;

      leadFindFirstMock.mockResolvedValueOnce({
        id: "lead_123",
        email: anonymousEmail,
      });

      campaignFindFirstMock.mockResolvedValue({
        id: mockCampaignId,
        name: "Test Campaign",
        store: {
          id: "store_123",
          shopifyDomain: mockShop,
          accessToken: "test_token",
        },
      });

      leadUpdateMock.mockResolvedValue({
        id: "lead_123",
        email: mockEmail,
      });

      const request = new Request(`http://localhost/api/leads/save-email?shop=${mockShop}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: mockEmail,
          campaignId: mockCampaignId,
          sessionId: mockSessionId,
          discountCode: mockDiscountCode,
        }),
      });

      const response = await saveEmailAction({ request } as unknown as ActionFunctionArgs);
      const payload = (response as any).data as any;

      expect(payload.success).toBe(true);
      expect(payload.leadId).toBe("lead_123");

      // Verify lead was updated with real email
      expect(leadUpdateMock).toHaveBeenCalledWith({
        where: { id: "lead_123" },
        data: expect.objectContaining({
          email: mockEmail.toLowerCase(),
        }),
      });
    });

    it("should return success if real email already exists (idempotent)", async () => {
      leadFindFirstMock.mockResolvedValueOnce({
        id: "lead_123",
        email: mockEmail, // Real email already saved
      });

      const request = new Request(`http://localhost/api/leads/save-email?shop=${mockShop}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: mockEmail,
          campaignId: mockCampaignId,
          sessionId: mockSessionId,
          discountCode: mockDiscountCode,
        }),
      });

      const response = await saveEmailAction({ request } as unknown as ActionFunctionArgs);
      const payload = (response as any).data as any;

      expect(payload.success).toBe(true);
      expect(payload.message).toBe("Email already saved");

      // Verify lead was NOT updated (idempotent)
      expect(leadUpdateMock).not.toHaveBeenCalled();
    });
  });

  describe("Rate Limiting", () => {
    it("should enforce rate limit per email+campaign", async () => {
      leadFindFirstMock.mockResolvedValueOnce({
        id: "lead_123",
        email: `session_${mockSessionId}@anonymous.local`,
      });

      checkRateLimitMock.mockResolvedValueOnce({
        allowed: false,
        remaining: 0,
        resetAt: new Date(Date.now() + 3600000),
      });

      const request = new Request(`http://localhost/api/leads/save-email?shop=${mockShop}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: mockEmail,
          campaignId: mockCampaignId,
          sessionId: mockSessionId,
          discountCode: mockDiscountCode,
        }),
      });

      const response = await saveEmailAction({ request } as unknown as ActionFunctionArgs);
      const payload = (response as any).data as any;

      expect(payload.success).toBe(false);
      expect(payload.error).toBe("You've already submitted for this campaign today");
    });
  });

  describe("Customer Creation", () => {
    it("should create/update Shopify customer", async () => {
      leadFindFirstMock.mockResolvedValueOnce({
        id: "lead_123",
        email: `session_${mockSessionId}@anonymous.local`,
      });

      campaignFindFirstMock.mockResolvedValue({
        id: mockCampaignId,
        name: "Test Campaign",
        store: {
          id: "store_123",
          shopifyDomain: mockShop,
          accessToken: "test_token",
        },
      });

      leadUpdateMock.mockResolvedValue({
        id: "lead_123",
        email: mockEmail,
      });

      const request = new Request(`http://localhost/api/leads/save-email?shop=${mockShop}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: mockEmail,
          campaignId: mockCampaignId,
          sessionId: mockSessionId,
          discountCode: mockDiscountCode,
          firstName: "John",
          lastName: "Doe",
          consent: true,
        }),
      });

      await saveEmailAction({ request } as unknown as ActionFunctionArgs);

      // Verify customer was created/updated
      expect(upsertCustomerMock).toHaveBeenCalledWith(
        expect.any(Object),
        expect.objectContaining({
          email: mockEmail,
          firstName: "John",
          lastName: "Doe",
          marketingConsent: true,
        })
      );
    });
  });
});

