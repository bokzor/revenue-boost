/**
 * Unit Tests for Shop Service
 *
 * Tests shop timezone fetching and caching:
 * - getShopTimezone
 * - fetchShopDetails
 * - isTimezoneCacheFresh
 * - getTimezoneByShopDomain
 */

import { describe, it, expect, vi, beforeEach } from "vitest";

// Mock Prisma
vi.mock("~/db.server", () => ({
  default: {
    store: {
      findUnique: vi.fn(),
      update: vi.fn(),
    },
  },
}));

import { ShopService } from "~/domains/shops/services/shop.server";
import prisma from "~/db.server";

// ==========================================================================
// TEST HELPERS
// ==========================================================================

function createMockAdmin(shopData: any) {
  return {
    graphql: vi.fn().mockResolvedValue({
      json: vi.fn().mockResolvedValue({
        data: { shop: shopData },
      }),
    }),
  } as any;
}

// ==========================================================================
// GET SHOP TIMEZONE TESTS
// ==========================================================================

describe("ShopService.getShopTimezone", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("should return cached timezone when fresh", async () => {
    const freshDate = new Date(Date.now() - 1000 * 60 * 60); // 1 hour ago
    vi.mocked(prisma.store.findUnique).mockResolvedValue({
      timezone: "America/New_York",
      timezoneUpdatedAt: freshDate,
    } as any);

    const mockAdmin = createMockAdmin({ ianaTimezone: "America/Los_Angeles" });
    const result = await ShopService.getShopTimezone(mockAdmin, "store-123");

    expect(result).toBe("America/New_York");
    expect(mockAdmin.graphql).not.toHaveBeenCalled(); // Should use cache
  });

  it("should fetch fresh timezone when cache is stale", async () => {
    const staleDate = new Date(Date.now() - 1000 * 60 * 60 * 25); // 25 hours ago
    vi.mocked(prisma.store.findUnique).mockResolvedValue({
      timezone: "America/New_York",
      timezoneUpdatedAt: staleDate,
    } as any);
    vi.mocked(prisma.store.update).mockResolvedValue({} as any);

    const mockAdmin = createMockAdmin({
      ianaTimezone: "America/Los_Angeles",
      name: "Test Shop",
    });
    const result = await ShopService.getShopTimezone(mockAdmin, "store-123");

    expect(result).toBe("America/Los_Angeles");
    expect(mockAdmin.graphql).toHaveBeenCalled();
    expect(prisma.store.update).toHaveBeenCalled();
  });

  it("should return UTC when store not found", async () => {
    vi.mocked(prisma.store.findUnique).mockResolvedValue(null);

    const mockAdmin = createMockAdmin({});
    const result = await ShopService.getShopTimezone(mockAdmin, "nonexistent");

    expect(result).toBe("UTC");
  });

  it("should fallback to cached timezone on error", async () => {
    vi.mocked(prisma.store.findUnique)
      .mockResolvedValueOnce({
        timezone: "Europe/London",
        timezoneUpdatedAt: null, // Will trigger fetch
      } as any)
      .mockResolvedValueOnce({
        timezone: "Europe/London",
      } as any);

    const mockAdmin = {
      graphql: vi.fn().mockRejectedValue(new Error("API Error")),
    } as any;

    const result = await ShopService.getShopTimezone(mockAdmin, "store-123");

    expect(result).toBe("Europe/London");
  });
});

// ==========================================================================
// FETCH SHOP DETAILS TESTS
// ==========================================================================

describe("ShopService.fetchShopDetails", () => {
  it("should fetch shop details from Shopify", async () => {
    const mockAdmin = createMockAdmin({
      ianaTimezone: "Asia/Tokyo",
      name: "Tokyo Shop",
    });

    const result = await ShopService.fetchShopDetails(mockAdmin);

    expect(result.ianaTimezone).toBe("Asia/Tokyo");
    expect(result.name).toBe("Tokyo Shop");
  });

  it("should default to UTC when timezone not available", async () => {
    const mockAdmin = createMockAdmin({
      ianaTimezone: null,
      name: "No Timezone Shop",
    });

    const result = await ShopService.fetchShopDetails(mockAdmin);

    expect(result.ianaTimezone).toBe("UTC");
  });

  it("should throw when shop data not available", async () => {
    const mockAdmin = {
      graphql: vi.fn().mockResolvedValue({
        json: vi.fn().mockResolvedValue({ data: { shop: null } }),
      }),
    } as any;

    await expect(ShopService.fetchShopDetails(mockAdmin)).rejects.toThrow(
      "Failed to fetch shop details from Shopify"
    );
  });
});

// ==========================================================================
// IS TIMEZONE CACHE FRESH TESTS
// ==========================================================================

describe("ShopService.isTimezoneCacheFresh", () => {
  it("should return false for null date", () => {
    expect(ShopService.isTimezoneCacheFresh(null)).toBe(false);
  });

  it("should return true for recent date", () => {
    const recentDate = new Date(Date.now() - 1000 * 60 * 60); // 1 hour ago
    expect(ShopService.isTimezoneCacheFresh(recentDate)).toBe(true);
  });

  it("should return false for old date", () => {
    const oldDate = new Date(Date.now() - 1000 * 60 * 60 * 25); // 25 hours ago
    expect(ShopService.isTimezoneCacheFresh(oldDate)).toBe(false);
  });
});

