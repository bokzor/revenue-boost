/**
 * Campaign Schedule Filtering Integration Tests
 *
 * Tests that active campaigns are correctly filtered by schedule
 */

import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { CampaignQueryService } from "~/domains/campaigns/services/campaign-query.server";
import prisma from "~/db.server";

// Mock Prisma
vi.mock("~/db.server", () => ({
  default: {
    store: {
      findUnique: vi.fn(),
    },
    campaign: {
      findMany: vi.fn(),
    },
  },
}));

describe("CampaignQueryService - Schedule Filtering", () => {
  const mockStoreId = "store-123";
  const mockTimezone = "America/New_York";

  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it("should include campaigns with no schedule constraints", async () => {
    // Mock current time: 2024-01-15 12:00 UTC
    vi.setSystemTime(new Date("2024-01-15T12:00:00Z"));

    // Mock store with timezone
    vi.mocked(prisma.store.findUnique).mockResolvedValue({
      id: mockStoreId,
      timezone: mockTimezone,
    } as any);

    // Mock campaign with no schedule
    vi.mocked(prisma.campaign.findMany).mockResolvedValue([
      {
        id: "campaign-1",
        storeId: mockStoreId,
        name: "Always Active Campaign",
        status: "ACTIVE",
        templateType: "NEWSLETTER",
        priority: 10,
        contentConfig: {},
        designConfig: {},
        targetRules: {},
        discountConfig: {},
        startDate: null,
        endDate: null,
        createdAt: new Date(),
        updatedAt: new Date(),
      },
    ] as any);

    const result = await CampaignQueryService.getActive(mockStoreId);

    expect(result).toHaveLength(1);
    expect(result[0].name).toBe("Always Active Campaign");
  });

  it("should exclude campaigns that haven't started yet", async () => {
    // Mock current time: 2024-01-10 12:00 UTC
    vi.setSystemTime(new Date("2024-01-10T12:00:00Z"));

    vi.mocked(prisma.store.findUnique).mockResolvedValue({
      id: mockStoreId,
      timezone: "UTC",
    } as any);

    // Campaign starts in the future
    vi.mocked(prisma.campaign.findMany).mockResolvedValue([
      {
        id: "campaign-future",
        storeId: mockStoreId,
        name: "Future Campaign",
        status: "ACTIVE",
        templateType: "NEWSLETTER",
        priority: 10,
        contentConfig: {},
        designConfig: {},
        targetRules: {},
        discountConfig: {},
        startDate: new Date("2024-01-15T12:00:00Z"), // Starts in 5 days
        endDate: null,
        createdAt: new Date(),
        updatedAt: new Date(),
      },
    ] as any);

    const result = await CampaignQueryService.getActive(mockStoreId);

    expect(result).toHaveLength(0);
  });

  it("should exclude campaigns that have already ended", async () => {
    // Mock current time: 2024-01-20 12:00 UTC
    vi.setSystemTime(new Date("2024-01-20T12:00:00Z"));

    vi.mocked(prisma.store.findUnique).mockResolvedValue({
      id: mockStoreId,
      timezone: "UTC",
    } as any);

    // Campaign ended in the past
    vi.mocked(prisma.campaign.findMany).mockResolvedValue([
      {
        id: "campaign-past",
        storeId: mockStoreId,
        name: "Expired Campaign",
        status: "ACTIVE",
        templateType: "FLASH_SALE",
        priority: 10,
        contentConfig: {},
        designConfig: {},
        targetRules: {},
        discountConfig: {},
        startDate: null,
        endDate: new Date("2024-01-15T12:00:00Z"), // Ended 5 days ago
        createdAt: new Date(),
        updatedAt: new Date(),
      },
    ] as any);

    const result = await CampaignQueryService.getActive(mockStoreId);

    expect(result).toHaveLength(0);
  });

  it("should include campaigns within their schedule window", async () => {
    // Mock current time: 2024-01-15 12:00 UTC (middle of campaign)
    vi.setSystemTime(new Date("2024-01-15T12:00:00Z"));

    vi.mocked(prisma.store.findUnique).mockResolvedValue({
      id: mockStoreId,
      timezone: "UTC",
    } as any);

    vi.mocked(prisma.campaign.findMany).mockResolvedValue([
      {
        id: "campaign-active",
        storeId: mockStoreId,
        name: "Active Campaign",
        status: "ACTIVE",
        templateType: "SPIN_TO_WIN",
        priority: 10,
        contentConfig: {},
        designConfig: {},
        targetRules: {},
        discountConfig: {},
        startDate: new Date("2024-01-10T12:00:00Z"), // Started 5 days ago
        endDate: new Date("2024-01-20T12:00:00Z"), // Ends in 5 days
        createdAt: new Date(),
        updatedAt: new Date(),
      },
    ] as any);

    const result = await CampaignQueryService.getActive(mockStoreId);

    expect(result).toHaveLength(1);
    expect(result[0].name).toBe("Active Campaign");
  });
});

