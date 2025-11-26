/**
 * Unit Tests for Scratch Card API
 * 
 * Tests the /api/popups/scratch-card endpoint including:
 * - Challenge token validation
 * - Prize selection
 * - Discount code generation
 * - Lead creation (with and without email)
 */

import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import type { ActionFunctionArgs } from "react-router";

// Mock dependencies before importing the route module
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
      create: vi.fn(),
      upsert: vi.fn(),
    },
  },
}));

vi.mock("~/domains/commerce/services/discount.server", () => ({
  getCampaignDiscountCode: vi.fn(),
}));

vi.mock("~/domains/security/services/challenge-token.server", () => ({
  validateAndConsumeToken: vi.fn(),
}));

vi.mock("~/domains/analytics/popup-events.server", () => ({
  PopupEventService: {
    recordEvent: vi.fn(),
  },
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

import { authenticate } from "~/shopify.server";
import prisma from "~/db.server";
import * as discountModule from "~/domains/commerce/services/discount.server";
import * as challengeTokenModule from "~/domains/security/services/challenge-token.server";

const appProxyMock = authenticate.public.appProxy as unknown as ReturnType<typeof vi.fn>;
const campaignFindUniqueMock = prisma.campaign.findUnique as unknown as ReturnType<typeof vi.fn>;
const leadCreateMock = prisma.lead.create as unknown as ReturnType<typeof vi.fn>;
const leadUpsertMock = prisma.lead.upsert as unknown as ReturnType<typeof vi.fn>;
const getCampaignDiscountCodeMock = discountModule.getCampaignDiscountCode as unknown as ReturnType<typeof vi.fn>;
const validateAndConsumeTokenMock = challengeTokenModule.validateAndConsumeToken as unknown as ReturnType<typeof vi.fn>;

import { action as scratchCardAction } from "~/routes/api.popups.scratch-card";

describe("api.popups.scratch-card action", () => {
  const mockCampaignId = "cm123456789012345678901234";
  const mockSessionId = "session_123";
  const mockChallengeToken = "challenge_token_123";
  const mockStoreId = "store_123";

  beforeEach(() => {
    vi.clearAllMocks();

    // Default mock setup
    appProxyMock.mockResolvedValue({
      admin: {},
      session: { shop: "test.myshopify.com" },
    });

    validateAndConsumeTokenMock.mockResolvedValue({ valid: true });
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe("Challenge Token Validation", () => {
    it("should validate and consume challenge token", async () => {
      campaignFindUniqueMock.mockResolvedValue({
        id: mockCampaignId,
        storeId: mockStoreId,
        templateType: "SCRATCH_CARD",
        contentConfig: {
          emailRequired: false,
          prizes: [
            { id: "1", label: "10% OFF", probability: 1.0, discountConfig: { enabled: true } },
          ],
        },
      });

      getCampaignDiscountCodeMock.mockResolvedValue({
        success: true,
        discountCode: "SCRATCH10",
      });

      leadCreateMock.mockResolvedValue({ id: "lead_123" });

      const request = new Request("http://localhost/api/popups/scratch-card", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          campaignId: mockCampaignId,
          sessionId: mockSessionId,
          challengeToken: mockChallengeToken,
        }),
      });

      await scratchCardAction({ request } as unknown as ActionFunctionArgs);

      expect(validateAndConsumeTokenMock).toHaveBeenCalledWith(
        mockChallengeToken,
        mockCampaignId,
        mockSessionId,
        expect.any(String),
        false
      );
    });

    it("should reject invalid challenge token", async () => {
      validateAndConsumeTokenMock.mockResolvedValue({
        valid: false,
        error: "Token already used",
      });

      const request = new Request("http://localhost/api/popups/scratch-card", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          campaignId: mockCampaignId,
          sessionId: mockSessionId,
          challengeToken: mockChallengeToken,
        }),
      });

      const response = await scratchCardAction({ request } as unknown as ActionFunctionArgs);
      const payload = (response as any).data as any;

      expect(payload.success).toBe(false);
      expect(payload.error).toBe("Token already used");
    });
  });

  describe("Lead Creation - Scenario 2 & 3: Email After Scratching", () => {
    it("should create anonymous lead when email is NOT provided", async () => {
      campaignFindUniqueMock.mockResolvedValue({
        id: mockCampaignId,
        storeId: mockStoreId,
        templateType: "SCRATCH_CARD",
        contentConfig: {
          emailRequired: false,
          prizes: [
            { id: "1", label: "10% OFF", probability: 1.0, discountConfig: { enabled: true } },
          ],
        },
      });

      getCampaignDiscountCodeMock.mockResolvedValue({
        success: true,
        discountCode: "SCRATCH10",
      });

      leadCreateMock.mockResolvedValue({ id: "lead_123" });

      const request = new Request("http://localhost/api/popups/scratch-card", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          campaignId: mockCampaignId,
          sessionId: mockSessionId,
          challengeToken: mockChallengeToken,
          // NO EMAIL PROVIDED
        }),
      });

      const response = await scratchCardAction({ request } as unknown as ActionFunctionArgs);
      const payload = (response as any).data as any;

      expect(payload.success).toBe(true);
      expect(payload.discountCode).toBe("SCRATCH10");

      // Verify anonymous lead was created
      expect(leadCreateMock).toHaveBeenCalledWith({
        data: expect.objectContaining({
          email: `session_${mockSessionId}@anonymous.local`,
          campaignId: mockCampaignId,
          storeId: mockStoreId,
          discountCode: "SCRATCH10",
          sessionId: mockSessionId,
        }),
      });
    });

    it("should create lead with email when email IS provided (Scenario 1)", async () => {
      const testEmail = "test@example.com";

      campaignFindUniqueMock.mockResolvedValue({
        id: mockCampaignId,
        storeId: mockStoreId,
        templateType: "SCRATCH_CARD",
        contentConfig: {
          emailRequired: true,
          emailBeforeScratching: true,
          prizes: [
            { id: "1", label: "10% OFF", probability: 1.0, discountConfig: { enabled: true } },
          ],
        },
      });

      getCampaignDiscountCodeMock.mockResolvedValue({
        success: true,
        discountCode: "SCRATCH10",
      });

      leadUpsertMock.mockResolvedValue({ id: "lead_123" });

      const request = new Request("http://localhost/api/popups/scratch-card", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          campaignId: mockCampaignId,
          sessionId: mockSessionId,
          challengeToken: mockChallengeToken,
          email: testEmail,
        }),
      });

      const response = await scratchCardAction({ request } as unknown as ActionFunctionArgs);
      const payload = (response as any).data as any;

      expect(payload.success).toBe(true);
      expect(payload.discountCode).toBe("SCRATCH10");

      // Verify lead was upserted with real email
      expect(leadUpsertMock).toHaveBeenCalledWith({
        where: {
          storeId_campaignId_email: {
            storeId: mockStoreId,
            campaignId: mockCampaignId,
            email: testEmail,
          },
        },
        create: expect.objectContaining({
          email: testEmail,
          discountCode: "SCRATCH10",
        }),
        update: expect.objectContaining({
          discountCode: "SCRATCH10",
        }),
      });
    });
  });

  describe("Prize Selection", () => {
    it("should select prize based on probability", async () => {
      campaignFindUniqueMock.mockResolvedValue({
        id: mockCampaignId,
        storeId: mockStoreId,
        templateType: "SCRATCH_CARD",
        contentConfig: {
          prizes: [
            { id: "1", label: "10% OFF", probability: 0.5, discountConfig: { enabled: true } },
            { id: "2", label: "20% OFF", probability: 0.5, discountConfig: { enabled: true } },
          ],
        },
      });

      getCampaignDiscountCodeMock.mockResolvedValue({
        success: true,
        discountCode: "SCRATCH10",
      });

      leadCreateMock.mockResolvedValue({ id: "lead_123" });

      const request = new Request("http://localhost/api/popups/scratch-card", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          campaignId: mockCampaignId,
          sessionId: mockSessionId,
          challengeToken: mockChallengeToken,
        }),
      });

      const response = await scratchCardAction({ request } as unknown as ActionFunctionArgs);
      const payload = (response as any).data as any;

      expect(payload.success).toBe(true);
      expect(payload.prize).toBeDefined();
      expect(["1", "2"]).toContain(payload.prize.id);
    });
  });
});

