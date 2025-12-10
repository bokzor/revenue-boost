/**
 * Integration Tests for Scratch Card Challenge Token Flow
 * 
 * Tests the complete flow from scratch-card API to save-email API:
 * - Challenge token is validated once (in scratch-card API)
 * - Anonymous lead is created without email
 * - Save-email API verifies discount code (not challenge token)
 * - Anonymous lead is updated with real email
 */

import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import type { ActionFunctionArgs } from "react-router";

// Mock dependencies
vi.mock("~/shopify.server", () => ({
  authenticate: {
    public: {
      appProxy: vi.fn(),
    },
  },
}));

vi.mock("~/domains/commerce/services/discount.server", () => ({
  getCampaignDiscountCode: vi.fn(),
}));

vi.mock("~/domains/security/services/submission-validator.server", () => ({
  validateStorefrontRequest: vi.fn().mockResolvedValue({ valid: true }),
}));

vi.mock("~/domains/analytics/popup-events.server", () => ({
  PopupEventService: {
    recordEvent: vi.fn(),
  },
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

vi.mock("~/lib/cors.server", () => ({
  storefrontCors: vi.fn(() => ({
    "Access-Control-Allow-Origin": "*",
  })),
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

// Use in-memory mock for Prisma
vi.mock("~/db.server", () => {
  const leads = new Map<string, any>();
  const campaigns = new Map<string, any>();

  return {
    default: {
      campaign: {
        findUnique: vi.fn((args: any) => {
          return Promise.resolve(campaigns.get(args.where.id) || null);
        }),
        findFirst: vi.fn((args: any) => {
          return Promise.resolve(campaigns.get(args.where.id) || null);
        }),
      },
      lead: {
        create: vi.fn((args: any) => {
          const lead = { id: `lead_${Date.now()}`, ...args.data };
          leads.set(lead.id, lead);
          return Promise.resolve(lead);
        }),
        upsert: vi.fn((args: any) => {
          const existingLead = Array.from(leads.values()).find(
            (l) => l.email === args.where.storeId_campaignId_email.email
          );
          if (existingLead) {
            Object.assign(existingLead, args.update);
            return Promise.resolve(existingLead);
          }
          const lead = { id: `lead_${Date.now()}`, ...args.create };
          leads.set(lead.id, lead);
          return Promise.resolve(lead);
        }),
        findFirst: vi.fn((args: any) => {
          const lead = Array.from(leads.values()).find(
            (l) =>
              l.discountCode === args.where.discountCode &&
              l.campaignId === args.where.campaignId &&
              l.sessionId === args.where.sessionId
          );
          return Promise.resolve(lead || null);
        }),
        update: vi.fn((args: any) => {
          const lead = leads.get(args.where.id);
          if (lead) {
            Object.assign(lead, args.data);
          }
          return Promise.resolve(lead);
        }),
      },
      // Helper to setup test data
      __setupCampaign: (campaign: any) => {
        campaigns.set(campaign.id, campaign);
      },
      __clearData: () => {
        leads.clear();
        campaigns.clear();
      },
    },
  };
});

import { authenticate } from "~/shopify.server";
import prisma from "~/db.server";
import * as discountModule from "~/domains/commerce/services/discount.server";
import * as submissionValidatorModule from "~/domains/security/services/submission-validator.server";
import * as customerModule from "~/lib/shopify/customer.server";

const appProxyMock = authenticate.public.appProxy as unknown as ReturnType<typeof vi.fn>;
const getCampaignDiscountCodeMock = discountModule.getCampaignDiscountCode as unknown as ReturnType<typeof vi.fn>;
const validateStorefrontRequestMock = submissionValidatorModule.validateStorefrontRequest as unknown as ReturnType<typeof vi.fn>;
const upsertCustomerMock = customerModule.upsertCustomer as unknown as ReturnType<typeof vi.fn>;

import { action as scratchCardAction } from "~/routes/api.popups.scratch-card";
import { action as saveEmailAction } from "~/routes/api.leads.save-email";

describe("Scratch Card Submission Validation Flow - Integration", () => {
  const mockCampaignId = "cm123456789012345678901234";
  const mockSessionId = "session_integration_test";
  const mockStoreId = "store_integration";
  const mockShop = "test.myshopify.com";
  const mockEmail = "integration@example.com";

  beforeEach(() => {
    vi.clearAllMocks();
    (prisma as any).__clearData();

    // Setup test campaign
    (prisma as any).__setupCampaign({
      id: mockCampaignId,
      storeId: mockStoreId,
      templateType: "SCRATCH_CARD",
      name: "Integration Test Campaign",
      contentConfig: {
        emailRequired: true,
        emailBeforeScratching: false,
        prizes: [
          { id: "1", label: "10% OFF", probability: 1.0, discountConfig: { enabled: true } },
        ],
      },
      store: {
        id: mockStoreId,
        shopifyDomain: mockShop,
        accessToken: "test_token",
      },
    });

    // Default mocks
    appProxyMock.mockResolvedValue({
      admin: {},
      session: { shop: mockShop },
    });

    validateStorefrontRequestMock.mockResolvedValue({ valid: true });

    getCampaignDiscountCodeMock.mockResolvedValue({
      success: true,
      discountCode: "SCRATCH10",
    });

    upsertCustomerMock.mockResolvedValue({
      success: true,
      shopifyCustomerId: "gid://shopify/Customer/123",
      isNewCustomer: true,
    });
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe("Scenario 2: Email NOT Required", () => {
    it("should complete full flow: scratch without email → save email later", async () => {
      // Step 1: User scratches card WITHOUT email
      const scratchRequest = new Request("http://localhost/api/popups/scratch-card", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          campaignId: mockCampaignId,
          sessionId: mockSessionId,
          popupShownAt: Date.now() - 5000,
          // NO EMAIL
        }),
      });

      const scratchResponse = await scratchCardAction({
        request: scratchRequest,
      } as unknown as ActionFunctionArgs);
      const scratchPayload = (scratchResponse as any).data as any;

      // Verify scratch was successful
      expect(scratchPayload.success).toBe(true);
      expect(scratchPayload.discountCode).toBe("SCRATCH10");

      // Verify submission was validated
      expect(validateStorefrontRequestMock).toHaveBeenCalledTimes(1);
      expect(validateStorefrontRequestMock).toHaveBeenCalledWith(
        expect.any(Request),
        expect.objectContaining({
          campaignId: mockCampaignId,
          sessionId: mockSessionId,
        })
      );

      // Verify anonymous lead was created
      expect(prisma.lead.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            email: `session_${mockSessionId}@anonymous.local`,
            discountCode: "SCRATCH10",
            campaignId: mockCampaignId,
            sessionId: mockSessionId,
          }),
        })
      );

      // Step 2: User provides email later
      const saveEmailRequest = new Request(
        `http://localhost/api/leads/save-email?shop=${mockShop}`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            email: mockEmail,
            campaignId: mockCampaignId,
            sessionId: mockSessionId,
            discountCode: "SCRATCH10",
            consent: true,
          }),
        }
      );

      const saveEmailResponse = await saveEmailAction({
        request: saveEmailRequest,
      } as unknown as ActionFunctionArgs);
      const saveEmailPayload = (saveEmailResponse as any).data as any;

      // Verify email was saved successfully
      expect(saveEmailPayload.success).toBe(true);
      expect(saveEmailPayload.discountCode).toBe("SCRATCH10");

      // Verify submission validation was NOT called again
      expect(validateStorefrontRequestMock).toHaveBeenCalledTimes(1); // Still only 1 call

      // Verify lead was updated with real email
      expect(prisma.lead.update).toHaveBeenCalledWith({
        where: { id: expect.any(String) },
        data: expect.objectContaining({
          email: mockEmail.toLowerCase(),
        }),
      });
    });
  });

  describe("Scenario 1: Email BEFORE Scratching", () => {
    it("should complete full flow: provide email → scratch card with email", async () => {
      // Setup campaign with emailBeforeScratching enabled
      (prisma as any).__clearData();
      (prisma as any).__setupCampaign({
        id: mockCampaignId,
        storeId: mockStoreId,
        templateType: "SCRATCH_CARD",
        name: "Email Before Scratch Test",
        contentConfig: {
          emailRequired: true,
          emailBeforeScratching: true, // ← Key difference
          prizes: [
            { id: "1", label: "10% OFF", probability: 1.0, discountConfig: { enabled: true } },
          ],
        },
        store: {
          id: mockStoreId,
          shopifyDomain: mockShop,
          accessToken: "test_token",
        },
      });

      // User provides email and scratches in one request
      // The scratch-card API should handle both email submission AND prize generation
      const scratchRequest = new Request("http://localhost/api/popups/scratch-card", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          campaignId: mockCampaignId,
          sessionId: mockSessionId,
          popupShownAt: Date.now() - 5000,
          email: mockEmail, // ← Email provided upfront
        }),
      });

      const scratchResponse = await scratchCardAction({
        request: scratchRequest,
      } as unknown as ActionFunctionArgs);
      const scratchPayload = (scratchResponse as any).data as any;

      // Verify scratch was successful
      expect(scratchPayload.success).toBe(true);
      expect(scratchPayload.discountCode).toBe("SCRATCH10");

      // Verify submission was validated ONCE
      expect(validateStorefrontRequestMock).toHaveBeenCalledTimes(1);
      expect(validateStorefrontRequestMock).toHaveBeenCalledWith(
        expect.any(Request),
        expect.objectContaining({
          campaignId: mockCampaignId,
          sessionId: mockSessionId,
        })
      );

      // Verify lead was created with email (not anonymous)
      expect(prisma.lead.upsert).toHaveBeenCalledWith(
        expect.objectContaining({
          where: {
            storeId_campaignId_email: {
              storeId: mockStoreId,
              campaignId: mockCampaignId,
              email: mockEmail,
            },
          },
          create: expect.objectContaining({
            email: mockEmail,
            discountCode: "SCRATCH10",
            campaignId: mockCampaignId,
            sessionId: mockSessionId,
          }),
          update: expect.objectContaining({
            discountCode: "SCRATCH10",
          }),
        })
      );

      // Note: upsertCustomer is NOT called by scratch-card API
      // It's only called by /api/leads/submit which we bypass for emailBeforeScratching
      // This is acceptable as the lead is still created in our database
    });
  });

  describe("Scenario 3: Email AFTER Scratching", () => {
    it("should complete full flow: scratch → provide required email", async () => {
      // Step 1: User scratches card WITHOUT email (email required but after scratching)
      const scratchRequest = new Request("http://localhost/api/popups/scratch-card", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          campaignId: mockCampaignId,
          sessionId: mockSessionId,
          popupShownAt: Date.now() - 5000,
        }),
      });

      const scratchResponse = await scratchCardAction({
        request: scratchRequest,
      } as unknown as ActionFunctionArgs);
      const scratchPayload = (scratchResponse as any).data as any;

      expect(scratchPayload.success).toBe(true);
      expect(scratchPayload.discountCode).toBe("SCRATCH10");

      // Step 2: User MUST provide email (required)
      const saveEmailRequest = new Request(
        `http://localhost/api/leads/save-email?shop=${mockShop}`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            email: mockEmail,
            campaignId: mockCampaignId,
            sessionId: mockSessionId,
            discountCode: "SCRATCH10",
          }),
        }
      );

      const saveEmailResponse = await saveEmailAction({
        request: saveEmailRequest,
      } as unknown as ActionFunctionArgs);
      const saveEmailPayload = (saveEmailResponse as any).data as any;

      expect(saveEmailPayload.success).toBe(true);

      // Verify only ONE submission validation occurred
      expect(validateStorefrontRequestMock).toHaveBeenCalledTimes(1);
    });
  });

  describe("Security: Bot Detection", () => {
    it("should detect bots via honeypot field", async () => {
      // First request succeeds
      validateStorefrontRequestMock.mockResolvedValueOnce({ valid: true });

      const request1 = new Request("http://localhost/api/popups/scratch-card", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          campaignId: mockCampaignId,
          sessionId: mockSessionId,
          popupShownAt: Date.now() - 5000,
        }),
      });

      const response1 = await scratchCardAction({
        request: request1,
      } as unknown as ActionFunctionArgs);
      const payload1 = (response1 as any).data as any;

      expect(payload1.success).toBe(true);

      // Second request with honeypot filled is detected as bot
      validateStorefrontRequestMock.mockResolvedValueOnce({
        valid: false,
        reason: "honeypot",
        isBotLikely: true,
      });

      const request2 = new Request("http://localhost/api/popups/scratch-card", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          campaignId: mockCampaignId,
          sessionId: mockSessionId,
          honeypot: "bot-filled-this", // Bot indicator
        }),
      });

      const response2 = await scratchCardAction({
        request: request2,
      } as unknown as ActionFunctionArgs);
      const payload2 = (response2 as any).data as any;

      // Bots get fake success
      expect(payload2.success).toBe(true);
    });

    it("should NOT require submission validation in save-email API", async () => {
      // Create anonymous lead first
      await prisma.lead.create({
        data: {
          email: `session_${mockSessionId}@anonymous.local`,
          campaignId: mockCampaignId,
          storeId: mockStoreId,
          discountCode: "SCRATCH10",
          sessionId: mockSessionId,
          metadata: JSON.stringify({}),
        },
      });

      // Save email
      const request = new Request(`http://localhost/api/leads/save-email?shop=${mockShop}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: mockEmail,
          campaignId: mockCampaignId,
          sessionId: mockSessionId,
          discountCode: "SCRATCH10",
        }),
      });

      const response = await saveEmailAction({
        request,
      } as unknown as ActionFunctionArgs);
      const payload = (response as any).data as any;

      expect(payload.success).toBe(true);

      // Verify submission validation was never called for save-email
      expect(validateStorefrontRequestMock).not.toHaveBeenCalled();
    });
  });
});


