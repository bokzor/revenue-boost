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
  },
}));

vi.mock("~/domains/commerce/services/discount.server", () => ({
  getCampaignDiscountCode: vi.fn(),
  parseDiscountConfig: vi.fn(),
  getSuccessMessage: vi.fn(),
  shouldShowDiscountCode: vi.fn(),
}));

// Security & rate-limiting mocks (challenge token + rate limit) so tests don't hit real services
vi.mock("~/domains/security/services/challenge-token.server", () => ({
  validateAndConsumeToken: vi.fn().mockResolvedValue({ valid: true }),
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
    `email:${email}:campaign:${campaignId}`,
  ),
}));

import { authenticate } from "~/shopify.server";
import prisma from "~/db.server";
import * as discountModule from "~/domains/commerce/services/discount.server";

const appProxyMock = authenticate.public.appProxy as unknown as ReturnType<typeof vi.fn>;
const campaignFindUniqueMock = prisma.campaign
  .findUnique as unknown as ReturnType<typeof vi.fn>;

const getCampaignDiscountCodeMock =
  discountModule.getCampaignDiscountCode as unknown as ReturnType<typeof vi.fn>;
const parseDiscountConfigMock =
  discountModule.parseDiscountConfig as unknown as ReturnType<typeof vi.fn>;
const getSuccessMessageMock =
  discountModule.getSuccessMessage as unknown as ReturnType<typeof vi.fn>;
const shouldShowDiscountCodeMock =
  discountModule.shouldShowDiscountCode as unknown as ReturnType<typeof vi.fn>;

import { action as emailRecoveryAction } from "~/routes/api.cart.email-recovery";

describe("api.cart.email-recovery action", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("returns 401 when session is invalid", async () => {
    appProxyMock.mockResolvedValue({ admin: {}, session: {} });

    const request = new Request("http://localhost/api/cart/email-recovery", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        campaignId: "ck123456789012345678901234",
        email: "test@example.com",
        sessionId: "test-session",
        challengeToken: "test-token",
      }),
    });

    const response = await emailRecoveryAction({
      request,
    } as unknown as ActionFunctionArgs);

    const payload = (response as any).data as any;
    expect(payload.success).toBe(false);
    expect(payload.error).toBe("Invalid session");
  });

  it("returns success with discount code when issuance succeeds", async () => {
    appProxyMock.mockResolvedValue({
      admin: {},
      session: { shop: "test.myshopify.com" },
    });

    campaignFindUniqueMock.mockResolvedValue({
      id: "ck123456789012345678901234",
      storeId: "store-1",
      name: "Cart Recovery",
      discountConfig: { enabled: true },
      status: "ACTIVE",
    } as any);

    parseDiscountConfigMock.mockImplementation((cfg: any) => ({
      ...cfg,
      enabled: true,
      behavior: "SHOW_CODE_ONLY",
    }));
    getCampaignDiscountCodeMock.mockResolvedValue({
      success: true,
      discountCode: "SAVE10",
    } as any);
    getSuccessMessageMock.mockReturnValue("Success");
    shouldShowDiscountCodeMock.mockReturnValue(true);

    const request = new Request("http://localhost/api/cart/email-recovery", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        campaignId: "ck123456789012345678901234",
        email: "test@example.com",
        cartSubtotalCents: 12345,
        sessionId: "test-session",
        challengeToken: "test-token",
      }),
    });

    const response = await emailRecoveryAction({
      request,
    } as unknown as ActionFunctionArgs);

    const payload = (response as any).data as any;

    expect(payload.success).toBe(true);
    expect(payload.discountCode).toBe("SAVE10");
    expect(payload.behavior).toBe("SHOW_CODE_ONLY");

    expect(getCampaignDiscountCodeMock).toHaveBeenCalledWith(
      {},
      "store-1",
      "ck123456789012345678901234",
      expect.objectContaining({
        enabled: true,
      }),
      "test@example.com",
      12345,
    );
  });

  it("authorizes email when behavior is SHOW_CODE_AND_ASSIGN_TO_EMAIL", async () => {
    appProxyMock.mockResolvedValue({
      admin: {},
      session: { shop: "test.myshopify.com" },
    });

    campaignFindUniqueMock.mockResolvedValue({
      id: "ck123456789012345678901234",
      storeId: "store-1",
      name: "Cart Recovery",
      discountConfig: { enabled: true },
      status: "ACTIVE",
    } as any);

    parseDiscountConfigMock.mockImplementation((cfg: any) => ({
      ...cfg,
      enabled: true,
      behavior: "SHOW_CODE_AND_ASSIGN_TO_EMAIL",
    }));

    getCampaignDiscountCodeMock.mockResolvedValue({
      success: true,
      discountCode: "LOCKED10",
    } as any);
    getSuccessMessageMock.mockReturnValue("Success");
    shouldShowDiscountCodeMock.mockReturnValue(true);

    const request = new Request("http://localhost/api/cart/email-recovery", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        campaignId: "ck123456789012345678901234",
        email: "locked@example.com",
        sessionId: "test-session",
        challengeToken: "test-token",
      }),
    });

    await emailRecoveryAction({
      request,
    } as unknown as ActionFunctionArgs);

    // Ensure discount config was enriched with authorizedEmail + requireEmailMatch
    const [_adminArg, _storeIdArg, _campaignIdArg, discountCfg] =
      getCampaignDiscountCodeMock.mock.calls[0];

    expect(discountCfg.authorizedEmail).toBe("locked@example.com");
    expect(discountCfg.requireEmailMatch).toBe(true);
  });
});

  it("returns 400 when discount is disabled", async () => {
    appProxyMock.mockResolvedValue({
      admin: {},
      session: { shop: "test.myshopify.com" },
    });

    campaignFindUniqueMock.mockResolvedValue({
      id: "ck123456789012345678901234",
      storeId: "store-1",
      name: "Cart Recovery",
      discountConfig: { enabled: false },
      status: "ACTIVE",
    } as any);

    parseDiscountConfigMock.mockImplementation((cfg: any) => ({
      ...cfg,
      enabled: false,
    }));

    const request = new Request("http://localhost/api/cart/email-recovery", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        campaignId: "ck123456789012345678901234",
        email: "test@example.com",
        sessionId: "test-session",
        challengeToken: "test-token",
      }),
    });

    const response = await emailRecoveryAction({
      request,
    } as unknown as ActionFunctionArgs);

    const payload = (response as any).data as any;

    expect(payload.success).toBe(false);
    expect(payload.error).toMatch(/discount not enabled/i);
  });


