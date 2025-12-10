/**
 * Unit Tests for Experiment Analytics Service
 *
 * Tests A/B testing analytics functions:
 * - getVariantPerformance
 * - Statistical significance calculation
 */

import { describe, it, expect, vi, beforeEach } from "vitest";

// Mock Prisma
vi.mock("~/db.server", () => ({
  default: {
    campaign: {
      findMany: vi.fn(),
    },
    popupEvent: {
      groupBy: vi.fn(),
    },
    campaignConversion: {
      groupBy: vi.fn(),
    },
  },
}));

import { getVariantPerformance } from "~/domains/analytics/experiment-analytics.server";
import prisma from "~/db.server";

// ==========================================================================
// TEST HELPERS
// ==========================================================================

const mockStoreId = "store-123";
const mockExperimentId = "exp-123";

function createMockCampaigns() {
  return [
    { id: "campaign-A", name: "Variant A", variantKey: "A", isControl: true },
    { id: "campaign-B", name: "Variant B", variantKey: "B", isControl: false },
  ];
}

function createMockEventCounts(campaignId: string, views: number, clicks: number, submissions: number) {
  return [
    { campaignId, eventType: "VIEW", _count: { id: views } },
    { campaignId, eventType: "CLICK", _count: { id: clicks } },
    { campaignId, eventType: "SUBMIT", _count: { id: submissions } },
    { campaignId, eventType: "COUPON_ISSUED", _count: { id: submissions } },
  ];
}

// ==========================================================================
// TESTS
// ==========================================================================

describe("getVariantPerformance", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("should return empty variants when no campaigns found", async () => {
    vi.mocked(prisma.campaign.findMany).mockResolvedValue([]);

    const result = await getVariantPerformance(mockExperimentId, mockStoreId);

    expect(result).toEqual({
      variants: [],
      winner: null,
      pValue: null,
      isSignificant: false,
    });
  });

  it("should calculate metrics for each variant", async () => {
    const campaigns = createMockCampaigns();
    vi.mocked(prisma.campaign.findMany).mockResolvedValue(campaigns as any);

    // Mock event counts
    vi.mocked(prisma.popupEvent.groupBy).mockResolvedValue([
      ...createMockEventCounts("campaign-A", 100, 50, 10),
      ...createMockEventCounts("campaign-B", 100, 60, 15),
    ] as any);

    // Mock revenue data
    vi.mocked(prisma.campaignConversion.groupBy).mockResolvedValue([
      { campaignId: "campaign-A", _sum: { totalPrice: 500 }, _count: { id: 5 } },
      { campaignId: "campaign-B", _sum: { totalPrice: 750 }, _count: { id: 6 } },
    ] as any);

    const result = await getVariantPerformance(mockExperimentId, mockStoreId);

    expect(result.variants).toHaveLength(2);

    const variantA = result.variants.find((v) => v.variantKey === "A");
    expect(variantA).toBeDefined();
    expect(variantA?.impressions).toBe(100);
    expect(variantA?.clicks).toBe(50);
    expect(variantA?.submissions).toBe(10);
    expect(variantA?.conversionRate).toBe(10); // 10/100 * 100
    expect(variantA?.isControl).toBe(true);

    const variantB = result.variants.find((v) => v.variantKey === "B");
    expect(variantB).toBeDefined();
    expect(variantB?.impressions).toBe(100);
    expect(variantB?.submissions).toBe(15);
    expect(variantB?.conversionRate).toBe(15); // 15/100 * 100
  });

  it("should handle missing event data gracefully", async () => {
    vi.mocked(prisma.campaign.findMany).mockResolvedValue(createMockCampaigns() as any);
    vi.mocked(prisma.popupEvent.groupBy).mockResolvedValue([]);
    vi.mocked(prisma.campaignConversion.groupBy).mockResolvedValue([]);

    const result = await getVariantPerformance(mockExperimentId, mockStoreId);

    expect(result.variants).toHaveLength(2);
    result.variants.forEach((variant) => {
      expect(variant.impressions).toBe(0);
      expect(variant.clicks).toBe(0);
      expect(variant.submissions).toBe(0);
      expect(variant.conversionRate).toBe(0);
      expect(variant.revenue).toBe(0);
    });
  });

  it("should not determine winner when sample size is insufficient", async () => {
    vi.mocked(prisma.campaign.findMany).mockResolvedValue(createMockCampaigns() as any);
    // Less than 30 impressions per variant
    vi.mocked(prisma.popupEvent.groupBy).mockResolvedValue([
      { campaignId: "campaign-A", eventType: "VIEW", _count: { id: 20 } },
      { campaignId: "campaign-B", eventType: "VIEW", _count: { id: 25 } },
    ] as any);
    vi.mocked(prisma.campaignConversion.groupBy).mockResolvedValue([]);

    const result = await getVariantPerformance(mockExperimentId, mockStoreId);

    expect(result.isSignificant).toBe(false);
    expect(result.winner).toBeNull();
    expect(result.pValue).toBe(1); // No significance with small sample
  });

  it("should determine statistical significance with large sample", async () => {
    vi.mocked(prisma.campaign.findMany).mockResolvedValue(createMockCampaigns() as any);
    // Large sample with clear difference
    vi.mocked(prisma.popupEvent.groupBy).mockResolvedValue([
      { campaignId: "campaign-A", eventType: "VIEW", _count: { id: 1000 } },
      { campaignId: "campaign-A", eventType: "SUBMIT", _count: { id: 50 } },
      { campaignId: "campaign-B", eventType: "VIEW", _count: { id: 1000 } },
      { campaignId: "campaign-B", eventType: "SUBMIT", _count: { id: 150 } },
    ] as any);
    vi.mocked(prisma.campaignConversion.groupBy).mockResolvedValue([]);

    const result = await getVariantPerformance(mockExperimentId, mockStoreId);

    // With such a large difference (5% vs 15%), should be significant
    expect(result.pValue).toBeLessThan(0.05);
    expect(result.isSignificant).toBe(true);
    expect(result.winner).toBe("B");
  });
});

