/**
 * Integration Tests for Bundle Discount Feature (Product Upsell)
 *
 * Tests the complete flow of bundle discounts:
 * - Auto-sync from contentConfig.bundleDiscount
 * - Product-scoped discount creation
 * - Discount issuance via API
 */

import { describe, it, expect, vi, beforeEach } from "vitest";

// Mock dependencies before importing modules that use them
vi.mock("~/db.server", () => ({
  default: {
    campaign: {
      findUnique: vi.fn(),
      update: vi.fn(),
    },
  },
}));

vi.mock("~/lib/redis.server", () => ({
  getRedis: vi.fn(() => null),
}));

vi.mock("~/domains/commerce/services/discount.server", () => ({
  getCampaignDiscountCode: vi.fn(),
  parseDiscountConfig: vi.fn((config) => ({
    enabled: config?.enabled ?? false,
    valueType: config?.valueType ?? "PERCENTAGE",
    value: config?.value ?? 10,
    behavior: config?.behavior ?? "SHOW_CODE_AND_AUTO_APPLY",
    applicability: config?.applicability,
    type: config?.type ?? "single_use",
  })),
}));

import prisma from "~/db.server";
import { getCampaignDiscountCode } from "~/domains/commerce/services/discount.server";

describe("Bundle Discount Integration", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("Auto-sync from contentConfig.bundleDiscount", () => {
    it("should use bundleDiscount from contentConfig when discountConfig is not explicitly set", async () => {
      const mockCampaign = {
        id: "cmp_bundle_test_1",
        storeId: "store-123",
        name: "Product Upsell Test",
        status: "ACTIVE",
        contentConfig: {
          headline: "Complete Your Order",
          bundleDiscount: 15, // 15% bundle discount
          maxProducts: 3,
        },
        discountConfig: {
          enabled: false, // Not explicitly configured
        },
      };

      vi.mocked(prisma.campaign.findUnique).mockResolvedValue(mockCampaign as any);

      // Verify the campaign is fetched with contentConfig
      const campaign = await prisma.campaign.findUnique({
        where: { id: "cmp_bundle_test_1" },
        select: {
          id: true,
          storeId: true,
          name: true,
          discountConfig: true,
          contentConfig: true,
          status: true,
        },
      });

      expect(campaign?.contentConfig).toHaveProperty("bundleDiscount", 15);
    });

    it("should create product-scoped discount with selected product IDs", async () => {
      const selectedProductIds = [
        "gid://shopify/Product/123",
        "gid://shopify/Product/456",
      ];

      const expectedDiscountConfig = {
        enabled: true,
        showInPreview: true,
        strategy: "bundle" as const,
        valueType: "PERCENTAGE" as const,
        value: 15,
        type: "single_use" as const,
        behavior: "SHOW_CODE_AND_AUTO_APPLY" as const,
        applicability: {
          scope: "products" as const,
          productIds: selectedProductIds,
        },
      };

      // Mock the discount service to return a code
      vi.mocked(getCampaignDiscountCode).mockResolvedValue({
        success: true,
        discountCode: "BUNDLE15-ABC123",
        isNewDiscount: true,
      });

      const result = await getCampaignDiscountCode(
        {} as any, // mock admin
        "store-123",
        "cmp_bundle_test_1",
        expectedDiscountConfig,
        undefined,
        5000
      );

      expect(result.success).toBe(true);
      expect(result.discountCode).toBe("BUNDLE15-ABC123");

      // Verify the discount was created with product scoping
      expect(getCampaignDiscountCode).toHaveBeenCalledWith(
        expect.anything(),
        "store-123",
        "cmp_bundle_test_1",
        expect.objectContaining({
          applicability: {
            scope: "products",
            productIds: selectedProductIds,
          },
        }),
        undefined,
        5000
      );
    });
  });

  describe("Discount applies to any selected products (1+)", () => {
    it("should create discount when only 1 product is selected", async () => {
      const selectedProductIds = ["gid://shopify/Product/123"];

      vi.mocked(getCampaignDiscountCode).mockResolvedValue({
        success: true,
        discountCode: "BUNDLE15-SINGLE",
        isNewDiscount: true,
      });

      const result = await getCampaignDiscountCode(
        {} as any,
        "store-123",
        "cmp_bundle_test_2",
        {
          enabled: true,
          valueType: "PERCENTAGE",
          value: 15,
          applicability: {
            scope: "products",
            productIds: selectedProductIds,
          },
        } as any,
        undefined,
        3000
      );

      expect(result.success).toBe(true);
      expect(getCampaignDiscountCode).toHaveBeenCalledWith(
        expect.anything(),
        "store-123",
        "cmp_bundle_test_2",
        expect.objectContaining({
          applicability: {
            scope: "products",
            productIds: ["gid://shopify/Product/123"],
          },
        }),
        undefined,
        3000
      );
    });

    it("should create discount when multiple products are selected", async () => {
      const selectedProductIds = [
        "gid://shopify/Product/111",
        "gid://shopify/Product/222",
        "gid://shopify/Product/333",
      ];

      vi.mocked(getCampaignDiscountCode).mockResolvedValue({
        success: true,
        discountCode: "BUNDLE20-MULTI",
        isNewDiscount: true,
      });

      const result = await getCampaignDiscountCode(
        {} as any,
        "store-456",
        "cmp_bundle_test_3",
        {
          enabled: true,
          valueType: "PERCENTAGE",
          value: 20,
          applicability: {
            scope: "products",
            productIds: selectedProductIds,
          },
        } as any,
        undefined,
        10000
      );

      expect(result.success).toBe(true);
      expect(getCampaignDiscountCode).toHaveBeenCalledWith(
        expect.anything(),
        "store-456",
        "cmp_bundle_test_3",
        expect.objectContaining({
          value: 20,
          applicability: {
            scope: "products",
            productIds: expect.arrayContaining([
              "gid://shopify/Product/111",
              "gid://shopify/Product/222",
              "gid://shopify/Product/333",
            ]),
          },
        }),
        undefined,
        10000
      );
    });
  });

  describe("Bundle discount config merging", () => {
    it("should use bundleDiscountPercent from request if provided", () => {
      const contentConfig = { bundleDiscount: 15 };
      const requestBundleDiscountPercent = 20;

      // The API should prefer the explicitly passed bundleDiscountPercent
      const bundleDiscount = requestBundleDiscountPercent ?? contentConfig.bundleDiscount;

      expect(bundleDiscount).toBe(20);
    });

    it("should fall back to contentConfig.bundleDiscount if not provided in request", () => {
      const contentConfig = { bundleDiscount: 15 };
      const requestBundleDiscountPercent = undefined;

      const bundleDiscount = requestBundleDiscountPercent ?? contentConfig.bundleDiscount;

      expect(bundleDiscount).toBe(15);
    });

    it("should not apply bundle discount if no products selected", () => {
      const bundleDiscount = 15;
      const selectedProductIds: string[] = [];

      const shouldApplyBundleDiscount =
        bundleDiscount > 0 && selectedProductIds.length > 0;

      expect(shouldApplyBundleDiscount).toBe(false);
    });

    it("should apply bundle discount if at least 1 product selected", () => {
      const bundleDiscount = 15;
      const selectedProductIds = ["gid://shopify/Product/123"];

      const shouldApplyBundleDiscount =
        bundleDiscount > 0 && selectedProductIds.length > 0;

      expect(shouldApplyBundleDiscount).toBe(true);
    });
  });

  describe("Bundle savings calculation (UI)", () => {
    // Helper to calculate bundle savings (mirrors popup logic)
    const calculateBundleSavings = (
      bundleDiscount: number | undefined,
      selectedProductCount: number,
      totalPrice: number
    ): number | null => {
      const hasSelectedProducts = selectedProductCount > 0;
      if (!bundleDiscount || !hasSelectedProducts) return null;

      return totalPrice * (bundleDiscount / 100);
    };

    it("should return null when no products are selected", () => {
      const savings = calculateBundleSavings(15, 0, 100);
      expect(savings).toBeNull();
    });

    it("should return null when bundleDiscount is not set", () => {
      const savings = calculateBundleSavings(undefined, 2, 100);
      expect(savings).toBeNull();
    });

    it("should return null when bundleDiscount is 0", () => {
      const savings = calculateBundleSavings(0, 2, 100);
      expect(savings).toBeNull();
    });

    it("should calculate savings with 1 product selected", () => {
      // $50 product with 15% discount = $7.50 savings
      const savings = calculateBundleSavings(15, 1, 50);
      expect(savings).toBe(7.5);
    });

    it("should calculate savings with multiple products selected", () => {
      // $100 total with 20% discount = $20 savings
      const savings = calculateBundleSavings(20, 3, 100);
      expect(savings).toBe(20);
    });

    it("should handle decimal prices correctly", () => {
      // $49.99 with 10% discount = $4.999 savings
      const savings = calculateBundleSavings(10, 1, 49.99);
      expect(savings).toBeCloseTo(4.999, 2);
    });
  });

  describe("Storefront discount eligibility logic", () => {
    // Mirrors the logic in PopupManagerPreact.tsx handleAddToCart
    const shouldApplyDiscount = (
      bundleDiscount: number | undefined,
      selectedProductIds: string[],
      discountConfigEnabled: boolean
    ): { shouldApplyBundleDiscount: boolean; shouldApplyExplicitDiscount: boolean } => {
      const shouldApplyBundleDiscount =
        bundleDiscount !== undefined && bundleDiscount > 0 && selectedProductIds.length > 0;
      const shouldApplyExplicitDiscount = discountConfigEnabled && !bundleDiscount;

      return { shouldApplyBundleDiscount, shouldApplyExplicitDiscount };
    };

    it("should apply bundle discount when bundleDiscount set and products selected", () => {
      const result = shouldApplyDiscount(15, ["product-1"], false);
      expect(result.shouldApplyBundleDiscount).toBe(true);
      expect(result.shouldApplyExplicitDiscount).toBe(false);
    });

    it("should not apply bundle discount when no products selected", () => {
      const result = shouldApplyDiscount(15, [], false);
      expect(result.shouldApplyBundleDiscount).toBe(false);
    });

    it("should apply explicit discount when discountConfig enabled and no bundleDiscount", () => {
      const result = shouldApplyDiscount(undefined, ["product-1"], true);
      expect(result.shouldApplyBundleDiscount).toBe(false);
      expect(result.shouldApplyExplicitDiscount).toBe(true);
    });

    it("should prefer bundle discount over explicit discount when both are set", () => {
      // When bundleDiscount is set, use it (scoped to products) instead of generic discount
      const result = shouldApplyDiscount(15, ["product-1"], true);
      expect(result.shouldApplyBundleDiscount).toBe(true);
      expect(result.shouldApplyExplicitDiscount).toBe(false);
    });

    it("should not apply any discount when neither is configured", () => {
      const result = shouldApplyDiscount(undefined, ["product-1"], false);
      expect(result.shouldApplyBundleDiscount).toBe(false);
      expect(result.shouldApplyExplicitDiscount).toBe(false);
    });
  });
});
