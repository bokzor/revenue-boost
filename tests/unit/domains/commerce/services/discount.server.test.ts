/**
 * Unit Tests for Discount Service
 *
 * Tests the business logic for discount code issuance:
 * - getCampaignDiscountCode
 * - Tiered discount selection
 * - Shared discount creation
 * - Single-use discount creation
 * - Applicability scoping
 * - Error handling
 */

import { describe, it, expect, vi, beforeEach } from "vitest";

// Mocks so we can inspect inputs passed to Shopify discount creation
vi.mock("~/db.server", () => {
  const campaign = {
    findUnique: vi.fn(),
    update: vi.fn(),
  };
  return { default: { campaign } };
});

vi.mock("~/lib/shopify/discount.server", () => ({
  createDiscountCode: vi.fn(),
  createBxGyDiscountCode: vi.fn(),
  getDiscountCode: vi.fn(),
}));

vi.mock("~/lib/shopify/customer.server", () => ({
  findCustomerByEmail: vi
    .fn()
    .mockResolvedValue({ customer: { id: "gid://shopify/Customer/1" }, errors: [] }),
  createCustomer: vi.fn(),
}));

import prisma from "~/db.server";
import * as shopifyDiscountModule from "~/lib/shopify/discount.server";
import {
  getCampaignDiscountCode,
  createEmailSpecificDiscount,
} from "~/domains/commerce/services/discount.server";
import { parseDiscountConfig } from "~/domains/campaigns/utils/json-helpers";
import type { DiscountConfig } from "~/domains/campaigns/types/campaign";

// ==========================================================================
// TEST HELPERS
// ==========================================================================

/**
 * Creates a valid DiscountConfig with required fields and optional overrides.
 * This ensures tests pass TypeScript validation while keeping test code concise.
 */
function createDiscountConfig(overrides: Partial<DiscountConfig>): DiscountConfig {
  return {
    enabled: false,
    showInPreview: true,
    behavior: "SHOW_CODE_AND_AUTO_APPLY",
    strategy: "simple",
    ...overrides,
  };
}

// ==========================================================================
// STRATEGY INFERENCE
// ==========================================================================

describe("parseDiscountConfig", () => {
  it("returns default values for empty config", () => {
    const result = parseDiscountConfig({});
    expect(result.enabled).toBe(false);
    expect(result.showInPreview).toBe(true);
    expect(result.behavior).toBe("SHOW_CODE_AND_AUTO_APPLY");
  });

  it("parses enabled=true", () => {
    const result = parseDiscountConfig({ enabled: true });
    expect(result.enabled).toBe(true);
  });

  it("parses strategy when explicitly set", () => {
    const result = parseDiscountConfig({ strategy: "bundle" });
    expect(result.strategy).toBe("bundle");
  });

  it("parses tiered strategy when explicitly set", () => {
    const result = parseDiscountConfig({ strategy: "tiered" });
    expect(result.strategy).toBe("tiered");
  });

  it("parses value and valueType", () => {
    const result = parseDiscountConfig({
      enabled: true,
      value: 15,
      valueType: "PERCENTAGE",
    });
    expect(result.value).toBe(15);
    expect(result.valueType).toBe("PERCENTAGE");
  });

  it("parses behavior", () => {
    const result = parseDiscountConfig({
      behavior: "SHOW_CODE_AND_ASSIGN_TO_EMAIL",
    });
    expect(result.behavior).toBe("SHOW_CODE_AND_ASSIGN_TO_EMAIL");
  });
});

// ==========================================================================
// APPLICABILITY WIRING TESTS (existing tests)
// ==========================================================================

describe("DiscountService applicability wiring", () => {
  const admin: any = {}; // AdminApiContext is not used because Shopify calls are mocked

  beforeEach(() => {
    vi.clearAllMocks();

    const createDiscountCodeMock = vi.mocked(shopifyDiscountModule.createDiscountCode);
    createDiscountCodeMock.mockResolvedValue({
      discount: { id: "gid://shopify/DiscountCode/1" } as any,
      errors: undefined,
    } as any);

    // Default campaign lookup used by getCampaignDiscountCode
    (prisma.campaign.findUnique as any).mockResolvedValue({
      id: "campaign-1",
      name: "Test Campaign",
      discountConfig: "{}",
      storeId: "store-1",
    });

    (prisma.campaign.update as any).mockResolvedValue({});
  });

  it("passes applicability to shared discount creation", async () => {
    const config: any = {
      enabled: true,
      type: "shared",
      valueType: "PERCENTAGE",
      value: 10,
      prefix: "WELCOME",
      deliveryMode: "show_code_always",
      applicability: {
        scope: "products",
        productIds: ["gid://shopify/Product/1", "gid://shopify/Product/2"],
      },
    };

    await getCampaignDiscountCode(admin, "store-1", "campaign-1", config);

    const createDiscountCodeMock = vi.mocked(shopifyDiscountModule.createDiscountCode);
    expect(createDiscountCodeMock).toHaveBeenCalledTimes(1);
    const [, input] = createDiscountCodeMock.mock.calls[0];
    expect(input.applicability).toEqual(config.applicability);
  });

  it("passes applicability to single-use discount creation", async () => {
    const config: any = {
      enabled: true,
      type: "single_use",
      valueType: "PERCENTAGE",
      value: 15,
      prefix: "ONEOFF",
      deliveryMode: "show_code_always",
      applicability: {
        scope: "collections",
        collectionIds: ["gid://shopify/Collection/1"],
      },
    };

    await getCampaignDiscountCode(admin, "store-1", "campaign-1", config, "user@example.com");

    const createDiscountCodeMock = vi.mocked(shopifyDiscountModule.createDiscountCode);
    expect(createDiscountCodeMock).toHaveBeenCalledTimes(1);
    const [, input] = createDiscountCodeMock.mock.calls[0];
    expect(input.applicability).toEqual(config.applicability);
  });

  it("passes applicability to email-authorized discount creation", async () => {
    const config: any = {
      enabled: true,
      type: "shared",
      valueType: "PERCENTAGE",
      value: 20,
      prefix: "EMAIL",
      deliveryMode: "show_in_popup_authorized_only",
      applicability: {
        scope: "products",
        productIds: ["gid://shopify/Product/3"],
      },
    };

    const result = await createEmailSpecificDiscount(
      admin,
      "user@example.com",
      {
        id: "campaign-1",
        name: "Test Campaign",
        discountConfig: "{}",
        storeId: "store-1",
      } as any,
      config
    );

    expect(result.success).toBe(true);
    const createDiscountCodeMock = vi.mocked(shopifyDiscountModule.createDiscountCode);
    expect(createDiscountCodeMock).toHaveBeenCalledTimes(1);
    const [, input] = createDiscountCodeMock.mock.calls[0];
    expect(input.applicability).toEqual(config.applicability);
  });
});

// ==========================================================================
// COMPREHENSIVE DISCOUNT SERVICE TESTS
// ==========================================================================

describe("DiscountService - getCampaignDiscountCode", () => {
  const mockAdmin: any = {}; // AdminApiContext is not used because Shopify calls are mocked

  beforeEach(() => {
    vi.clearAllMocks();

    // Default successful discount creation mock
    vi.mocked(shopifyDiscountModule.createDiscountCode).mockResolvedValue({
      discount: {
        id: "gid://shopify/DiscountCodeNode/123",
        title: "Test Discount",
        codes: { nodes: [{ id: "code-1", code: "TESTCODE" }] },
        status: "ACTIVE",
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      },
      errors: undefined,
    } as any);

    // Default: no existing discount found
    vi.mocked(shopifyDiscountModule.getDiscountCode).mockResolvedValue({
      discount: undefined,
      errors: ["Discount not found"],
    });

    // Default campaign update mock
    vi.mocked(prisma.campaign.update).mockResolvedValue({} as any);
  });

  // ==========================================================================
  // PARAMETER VALIDATION
  // ==========================================================================

  describe("Parameter Validation", () => {
    it("should return error when discount is disabled", async () => {
      vi.mocked(prisma.campaign.findUnique).mockResolvedValue({
        id: "campaign-123",
        name: "Test Campaign",
        storeId: "test-store",
        discountConfig: {},
      } as any);

      const result = await getCampaignDiscountCode(
        mockAdmin,
        "test-store",
        "campaign-123",
        createDiscountConfig({ enabled: false }),
        undefined,
        5000
      );

      expect(result.success).toBe(false);
      expect(result.errors).toContain("Discount is not enabled for this campaign");
    });

    it("should return error when campaign not found", async () => {
      vi.mocked(prisma.campaign.findUnique).mockResolvedValue(null);

      const result = await getCampaignDiscountCode(
        mockAdmin,
        "test-store",
        "campaign-123",
        createDiscountConfig({ enabled: true }),
        undefined,
        5000
      );

      expect(result.success).toBe(false);
      expect(result.errors).toContain("Campaign not found");
    });

    it("should return error when store ID mismatch", async () => {
      vi.mocked(prisma.campaign.findUnique).mockResolvedValue({
        id: "campaign-123",
        name: "Test Campaign",
        storeId: "different-store",
        discountConfig: {},
      } as any);

      const result = await getCampaignDiscountCode(
        mockAdmin,
        "test-store",
        "campaign-123",
        createDiscountConfig({ enabled: true }),
        undefined,
        5000
      );

      expect(result.success).toBe(false);
      expect(result.errors).toContain("Campaign not found");
    });
  });

  // ==========================================================================
  // SHARED DISCOUNTS
  // ==========================================================================

  describe("Shared Discounts", () => {
    it("should reuse existing shared discount code when valid", async () => {
      const existingDiscountId = "gid://shopify/DiscountCodeNode/existing";
      const existingDiscountCode = "WELCOME-EXISTING";

      vi.mocked(prisma.campaign.findUnique).mockResolvedValue({
        id: "campaign-123",
        name: "Test Campaign",
        storeId: "test-store",
        discountConfig: JSON.stringify({
          sharedDiscountId: existingDiscountId,
          sharedDiscountCode: existingDiscountCode,
        }),
      } as any);

      // Mock that existing discount is valid in Shopify
      vi.mocked(shopifyDiscountModule.getDiscountCode).mockResolvedValue({
        discount: {
          id: existingDiscountId,
          title: "Test Discount",
          codes: { nodes: [{ id: "code-1", code: existingDiscountCode }] },
          status: "ACTIVE",
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        },
        errors: undefined,
      } as any);

      const result = await getCampaignDiscountCode(
        mockAdmin,
        "test-store",
        "campaign-123",
        createDiscountConfig({ enabled: true, type: "shared", valueType: "PERCENTAGE", value: 10 }),
        undefined,
        5000
      );

      expect(result.success).toBe(true);
      expect(result.discountCode).toBe(existingDiscountCode);
      expect(result.isNewDiscount).toBe(false);

      // Should NOT create a new discount
      expect(shopifyDiscountModule.createDiscountCode).not.toHaveBeenCalled();
    });

    it("should create new shared discount when none exists", async () => {
      vi.mocked(prisma.campaign.findUnique).mockResolvedValue({
        id: "campaign-123",
        name: "Test Campaign",
        storeId: "test-store",
        discountConfig: "{}",
      } as any);

      const result = await getCampaignDiscountCode(
        mockAdmin,
        "test-store",
        "campaign-123",
        createDiscountConfig({
          enabled: true,
          type: "shared",
          valueType: "PERCENTAGE",
          value: 15,
          prefix: "WELCOME",
        }),
        undefined,
        5000
      );

      expect(result.success).toBe(true);
      expect(result.isNewDiscount).toBe(true);
      expect(result.discountCode).toMatch(/^WELCOME/);

      // Verify createDiscountCode was called with correct params
      expect(shopifyDiscountModule.createDiscountCode).toHaveBeenCalledTimes(1);
      const [, discountInput] = vi.mocked(shopifyDiscountModule.createDiscountCode).mock.calls[0];
      expect(discountInput.valueType).toBe("PERCENTAGE");
      expect(discountInput.value).toBe(15);
    });

    it("should create new shared discount when existing is invalid in Shopify", async () => {
      vi.mocked(prisma.campaign.findUnique).mockResolvedValue({
        id: "campaign-123",
        name: "Test Campaign",
        storeId: "test-store",
        discountConfig: JSON.stringify({
          sharedDiscountId: "gid://shopify/DiscountCodeNode/deleted",
          sharedDiscountCode: "DELETED-CODE",
        }),
      } as any);

      // Mock that existing discount no longer exists in Shopify
      vi.mocked(shopifyDiscountModule.getDiscountCode).mockResolvedValue({
        discount: undefined,
        errors: ["Discount not found"],
      });

      const result = await getCampaignDiscountCode(
        mockAdmin,
        "test-store",
        "campaign-123",
        createDiscountConfig({ enabled: true, type: "shared", valueType: "PERCENTAGE", value: 10, prefix: "NEW" }),
        undefined,
        5000
      );

      expect(result.success).toBe(true);
      expect(result.isNewDiscount).toBe(true);
      expect(result.discountCode).not.toBe("DELETED-CODE");

      // Should create a new discount
      expect(shopifyDiscountModule.createDiscountCode).toHaveBeenCalledTimes(1);
    });
  });

  // ==========================================================================
  // SINGLE-USE DISCOUNTS
  // ==========================================================================

  describe("Single-Use Discounts", () => {
    it("should create single-use discount with usageLimit=1", async () => {
      vi.mocked(prisma.campaign.findUnique).mockResolvedValue({
        id: "campaign-123",
        name: "Single Use Campaign",
        storeId: "test-store",
        discountConfig: "{}",
      } as any);

      const result = await getCampaignDiscountCode(
        mockAdmin,
        "test-store",
        "campaign-123",
        createDiscountConfig({
          enabled: true,
          type: "single_use",
          valueType: "PERCENTAGE",
          value: 20,
          prefix: "SINGLE",
        }),
        "customer@example.com",
        5000
      );

      expect(result.success).toBe(true);
      expect(result.isNewDiscount).toBe(true);

      // Verify usageLimit is set to 1
      const [, discountInput] = vi.mocked(shopifyDiscountModule.createDiscountCode).mock.calls[0];
      expect(discountInput.usageLimit).toBe(1);
    });

    it("should include email hash in single-use discount code", async () => {
      vi.mocked(prisma.campaign.findUnique).mockResolvedValue({
        id: "campaign-123",
        name: "Single Use Campaign",
        storeId: "test-store",
        discountConfig: "{}",
      } as any);

      const result = await getCampaignDiscountCode(
        mockAdmin,
        "test-store",
        "campaign-123",
        createDiscountConfig({
          enabled: true,
          type: "single_use",
          valueType: "PERCENTAGE",
          value: 20,
          prefix: "SINGLE",
        }),
        "john@example.com",
        5000
      );

      expect(result.success).toBe(true);
      // Code should include part of email (JOHN) and be unique
      expect(result.discountCode).toMatch(/^SINGLE/);
    });
  });

  // ==========================================================================
  // TIERED DISCOUNTS
  // ==========================================================================

  describe("Tiered Discounts", () => {
    const tieredConfig = createDiscountConfig({
      enabled: true,
      type: "shared" as const,
      valueType: "PERCENTAGE" as const,
      prefix: "TIER",
      strategy: "tiered" as const, // Must explicitly set strategy to tiered
      tiers: [
        { thresholdCents: 0, discount: { kind: "percentage" as const, value: 10 } },
        { thresholdCents: 5000, discount: { kind: "percentage" as const, value: 15 } },
        { thresholdCents: 10000, discount: { kind: "percentage" as const, value: 20 } },
      ],
    });

    it("should create tier codes when none exist", async () => {
      // Store reference to campaign config that we can mutate
      const campaignConfig = { _meta: {} as any };

      vi.mocked(prisma.campaign.findUnique).mockResolvedValue({
        id: "campaign-123",
        name: "Tiered",
        storeId: "test-store",
        discountConfig: JSON.stringify(campaignConfig),
      } as any);

      // Track discount ID for each tier
      const createdTiers: Array<{ tierIndex: number; code: string; discountId: string; thresholdCents: number }> = [];
      let discountIndex = 0;

      vi.mocked(shopifyDiscountModule.createDiscountCode).mockImplementation(async (_, input) => {
        const tierIndex = discountIndex++;
        const code = input.code as string;
        const discountId = `gid://shopify/DiscountCodeNode/tier-${tierIndex}`;

        createdTiers.push({
          tierIndex,
          code,
          discountId,
          thresholdCents: tieredConfig.tiers![tierIndex].thresholdCents,
        });

        return {
          discount: {
            id: discountId,
            title: "Tier Discount",
            codes: { nodes: [{ id: "code-1", code }] },
            status: "ACTIVE",
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
          },
          errors: undefined,
        };
      });

      // Mock campaign update to simulate actual DB update behavior
      vi.mocked(prisma.campaign.update).mockImplementation((async ({ data }: any) => {
        // Parse the new config and update our reference
        if (data.discountConfig) {
          const parsed = JSON.parse(data.discountConfig);
          Object.assign(campaignConfig._meta, parsed._meta);
        }
        return {} as any;
      }) as any);

      // After tiers are created, getDiscountCode will be called to verify them
      vi.mocked(shopifyDiscountModule.getDiscountCode).mockImplementation(async (_, discountId) => {
        const tier = createdTiers.find((t) => t.discountId === discountId);
        if (tier) {
          return {
            discount: {
              id: tier.discountId,
              title: "Tier",
              codes: { nodes: [{ id: "code-1", code: tier.code }] },
              status: "ACTIVE",
              createdAt: "",
              updatedAt: "",
            },
            errors: undefined,
          } as any;
        }
        return { discount: undefined, errors: ["Not found"] };
      });

      const result = await getCampaignDiscountCode(
        mockAdmin,
        "test-store",
        "campaign-123",
        tieredConfig,
        undefined,
        3000 // $30 cart - should get tier 0
      );

      expect(result.success).toBe(true);
      expect(result.isNewDiscount).toBe(true);
      expect(result.tierUsed).toBe(0);

      // Should create 3 tier discounts
      expect(shopifyDiscountModule.createDiscountCode).toHaveBeenCalledTimes(3);
    });

    it("should select tier 0 when cart is below first threshold", async () => {
      // Setup with existing tier codes in metadata
      const tierCodes = [
        { tierIndex: 0, thresholdCents: 0, discountId: "tier-0", code: "TIER-0" },
        { tierIndex: 1, thresholdCents: 5000, discountId: "tier-1", code: "TIER-50" },
        { tierIndex: 2, thresholdCents: 10000, discountId: "tier-2", code: "TIER-100" },
      ];

      vi.mocked(prisma.campaign.findUnique).mockResolvedValue({
        id: "campaign-123",
        name: "Tiered",
        storeId: "test-store",
        discountConfig: JSON.stringify({ _meta: { tierCodes } }),
      } as any);

      // All tiers exist in Shopify
      vi.mocked(shopifyDiscountModule.getDiscountCode).mockResolvedValue({
        discount: {
          id: "tier-0",
          title: "Tier",
          codes: { nodes: [] },
          status: "ACTIVE",
          createdAt: "",
          updatedAt: "",
        },
        errors: undefined,
      } as any);

      const result = await getCampaignDiscountCode(
        mockAdmin,
        "test-store",
        "campaign-123",
        tieredConfig,
        undefined,
        2000 // $20 cart
      );

      expect(result.success).toBe(true);
      expect(result.discountCode).toBe("TIER-0");
      expect(result.tierUsed).toBe(0);
      expect(result.isNewDiscount).toBe(false);
    });

    it("should select tier 1 when cart meets second threshold", async () => {
      const tierCodes = [
        { tierIndex: 0, thresholdCents: 0, discountId: "tier-0", code: "TIER-0" },
        { tierIndex: 1, thresholdCents: 5000, discountId: "tier-1", code: "TIER-50" },
        { tierIndex: 2, thresholdCents: 10000, discountId: "tier-2", code: "TIER-100" },
      ];

      vi.mocked(prisma.campaign.findUnique).mockResolvedValue({
        id: "campaign-123",
        name: "Tiered",
        storeId: "test-store",
        discountConfig: JSON.stringify({ _meta: { tierCodes } }),
      } as any);

      vi.mocked(shopifyDiscountModule.getDiscountCode).mockResolvedValue({
        discount: {
          id: "tier-1",
          title: "Tier",
          codes: { nodes: [] },
          status: "ACTIVE",
          createdAt: "",
          updatedAt: "",
        },
        errors: undefined,
      } as any);

      const result = await getCampaignDiscountCode(
        mockAdmin,
        "test-store",
        "campaign-123",
        tieredConfig,
        undefined,
        7500 // $75 cart - meets tier 1 ($50+)
      );

      expect(result.success).toBe(true);
      expect(result.discountCode).toBe("TIER-50");
      expect(result.tierUsed).toBe(1);
    });

    it("should select highest eligible tier", async () => {
      const tierCodes = [
        { tierIndex: 0, thresholdCents: 0, discountId: "tier-0", code: "TIER-0" },
        { tierIndex: 1, thresholdCents: 5000, discountId: "tier-1", code: "TIER-50" },
        { tierIndex: 2, thresholdCents: 10000, discountId: "tier-2", code: "TIER-100" },
      ];

      vi.mocked(prisma.campaign.findUnique).mockResolvedValue({
        id: "campaign-123",
        name: "Tiered",
        storeId: "test-store",
        discountConfig: JSON.stringify({ _meta: { tierCodes } }),
      } as any);

      vi.mocked(shopifyDiscountModule.getDiscountCode).mockResolvedValue({
        discount: {
          id: "tier-2",
          title: "Tier",
          codes: { nodes: [] },
          status: "ACTIVE",
          createdAt: "",
          updatedAt: "",
        },
        errors: undefined,
      } as any);

      const result = await getCampaignDiscountCode(
        mockAdmin,
        "test-store",
        "campaign-123",
        tieredConfig,
        undefined,
        15000 // $150 cart - meets tier 2 ($100+)
      );

      expect(result.success).toBe(true);
      expect(result.discountCode).toBe("TIER-100");
      expect(result.tierUsed).toBe(2);
    });

    it("should recreate tiers when existing tier is invalid in Shopify", async () => {
      const tierCodes = [
        { tierIndex: 0, thresholdCents: 0, discountId: "tier-0", code: "TIER-0" },
        { tierIndex: 1, thresholdCents: 5000, discountId: "tier-1-deleted", code: "TIER-50" },
        { tierIndex: 2, thresholdCents: 10000, discountId: "tier-2", code: "TIER-100" },
      ];

      vi.mocked(prisma.campaign.findUnique).mockResolvedValue({
        id: "campaign-123",
        name: "Tiered",
        storeId: "test-store",
        discountConfig: JSON.stringify({ _meta: { tierCodes } }),
      } as any);

      // First tier valid, second tier deleted
      let callCount = 0;
      vi.mocked(shopifyDiscountModule.getDiscountCode).mockImplementation(async () => {
        callCount++;
        if (callCount === 2) {
          return { discount: undefined, errors: ["Discount not found"] };
        }
        return {
          discount: {
            id: "tier",
            title: "Tier",
            codes: { nodes: [] },
            status: "ACTIVE",
            createdAt: "",
            updatedAt: "",
          },
          errors: undefined,
        } as any;
      });

      const result = await getCampaignDiscountCode(
        mockAdmin,
        "test-store",
        "campaign-123",
        tieredConfig,
        undefined,
        5000
      );

      expect(result.success).toBe(true);
      expect(result.isNewDiscount).toBe(true);

      // Should recreate all 3 tier discounts
      expect(shopifyDiscountModule.createDiscountCode).toHaveBeenCalledTimes(3);
    });
  });

  // ==========================================================================
  // FREE SHIPPING DISCOUNTS
  // ==========================================================================

  describe("Free Shipping Discounts", () => {
    it("should create free shipping discount without value", async () => {
      vi.mocked(prisma.campaign.findUnique).mockResolvedValue({
        id: "campaign-123",
        name: "Free Ship Campaign",
        storeId: "test-store",
        discountConfig: "{}",
      } as any);

      const result = await getCampaignDiscountCode(
        mockAdmin,
        "test-store",
        "campaign-123",
        createDiscountConfig({
          enabled: true,
          type: "shared",
          valueType: "FREE_SHIPPING",
          prefix: "FREESHIP",
        }),
        undefined,
        5000
      );

      expect(result.success).toBe(true);

      const [, discountInput] = vi.mocked(shopifyDiscountModule.createDiscountCode).mock.calls[0];
      expect(discountInput.valueType).toBe("FREE_SHIPPING");
      expect(discountInput.value).toBeUndefined();
    });
  });

  // ==========================================================================
  // ERROR HANDLING
  // ==========================================================================

  describe("Error Handling", () => {
    it("should return error when Shopify discount creation fails", async () => {
      vi.mocked(prisma.campaign.findUnique).mockResolvedValue({
        id: "campaign-123",
        name: "Test Campaign",
        storeId: "test-store",
        discountConfig: "{}",
      } as any);

      vi.mocked(shopifyDiscountModule.createDiscountCode).mockResolvedValue({
        discount: undefined,
        errors: ["Discount code already exists", "Invalid input"],
      } as any);

      const result = await getCampaignDiscountCode(
        mockAdmin,
        "test-store",
        "campaign-123",
        createDiscountConfig({ enabled: true, type: "shared", valueType: "PERCENTAGE", value: 10 }),
        undefined,
        5000
      );

      expect(result.success).toBe(false);
      expect(result.errors).toContain("Discount code already exists");
      expect(result.errors).toContain("Invalid input");
    });

    it("should handle malformed discount config JSON gracefully", async () => {
      vi.mocked(prisma.campaign.findUnique).mockResolvedValue({
        id: "campaign-123",
        name: "Test Campaign",
        storeId: "test-store",
        discountConfig: "not valid json {{{",
      } as any);

      const result = await getCampaignDiscountCode(
        mockAdmin,
        "test-store",
        "campaign-123",
        createDiscountConfig({ enabled: true, type: "shared", valueType: "PERCENTAGE", value: 10 }),
        undefined,
        5000
      );

      // Should still work with empty metadata
      expect(result.success).toBe(true);
    });
  });

  // ==========================================================================
  // MINIMUM AMOUNT & EXPIRY
  // ==========================================================================

  describe("Minimum Amount & Expiry", () => {
    it("should pass minimum amount requirement", async () => {
      vi.mocked(prisma.campaign.findUnique).mockResolvedValue({
        id: "campaign-123",
        name: "Min Amount Campaign",
        storeId: "test-store",
        discountConfig: "{}",
      } as any);

      const result = await getCampaignDiscountCode(
        mockAdmin,
        "test-store",
        "campaign-123",
        createDiscountConfig({
          enabled: true,
          type: "shared",
          valueType: "PERCENTAGE",
          value: 10,
          minimumAmount: 50,
        }),
        undefined,
        5000
      );

      expect(result.success).toBe(true);

      const [, discountInput] = vi.mocked(shopifyDiscountModule.createDiscountCode).mock.calls[0];
      expect(discountInput.minimumRequirement).toEqual({
        greaterThanOrEqualToSubtotal: 50,
      });
    });

    it("should calculate expiry date from expiryDays", async () => {
      vi.mocked(prisma.campaign.findUnique).mockResolvedValue({
        id: "campaign-123",
        name: "Expiry Campaign",
        storeId: "test-store",
        discountConfig: "{}",
      } as any);

      const result = await getCampaignDiscountCode(
        mockAdmin,
        "test-store",
        "campaign-123",
        createDiscountConfig({
          enabled: true,
          type: "shared",
          valueType: "PERCENTAGE",
          value: 10,
          expiryDays: 30,
        }),
        undefined,
        5000
      );

      expect(result.success).toBe(true);

      const [, discountInput] = vi.mocked(shopifyDiscountModule.createDiscountCode).mock.calls[0];
      expect(discountInput.endsAt).toBeDefined();

      // Verify it's approximately 30 days from now
      const endsAt = new Date(discountInput.endsAt!);
      const now = new Date();
      const diffDays = (endsAt.getTime() - now.getTime()) / (1000 * 60 * 60 * 24);
      expect(diffDays).toBeGreaterThan(29);
      expect(diffDays).toBeLessThan(31);
    });
  });
});
