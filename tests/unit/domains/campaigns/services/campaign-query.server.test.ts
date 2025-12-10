/**
 * Unit Tests for Campaign Query Service
 *
 * Tests all read operations for campaigns:
 * - getAll
 * - getById
 * - getByTemplateType
 * - getActive
 * - getByStatus
 * - getByExperiment
 */

import { describe, it, expect, vi, beforeEach } from "vitest";

// Mock Prisma
vi.mock("~/db.server", () => ({
  default: {
    campaign: {
      findMany: vi.fn(),
      findFirst: vi.fn(),
    },
    store: {
      findUnique: vi.fn(),
    },
  },
}));

// Mock json-helpers
vi.mock("~/domains/campaigns/utils/json-helpers", () => ({
  parseCampaignFields: vi.fn((campaign) => campaign),
}));

// Mock schedule-helpers
vi.mock("~/domains/campaigns/utils/schedule-helpers", () => ({
  isWithinSchedule: vi.fn(() => true),
}));

import { CampaignQueryService } from "~/domains/campaigns/services/campaign-query.server";
import prisma from "~/db.server";
import { isWithinSchedule } from "~/domains/campaigns/utils/schedule-helpers";

// ==========================================================================
// TEST HELPERS
// ==========================================================================

function createMockCampaign(overrides: Partial<Record<string, unknown>> = {}) {
  return {
    id: "campaign-123",
    name: "Test Campaign",
    description: null,
    storeId: "store-123",
    templateId: "template-123",
    templateType: "NEWSLETTER",
    goal: "NEWSLETTER_SIGNUP",
    status: "ACTIVE",
    priority: 1,
    contentConfig: {},
    designConfig: {},
    targetRules: {},
    discountConfig: {},
    experimentId: null,
    variantKey: null,
    isControl: false,
    startDate: null,
    endDate: null,
    marketingEventId: null,
    utmCampaign: null,
    utmSource: null,
    utmMedium: null,
    createdAt: new Date(),
    updatedAt: new Date(),
    ...overrides,
  };
}

// ==========================================================================
// GET ALL TESTS
// ==========================================================================

describe("CampaignQueryService.getAll", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("should return all campaigns for a store", async () => {
    const mockCampaigns = [
      createMockCampaign({ id: "1", name: "Campaign 1" }),
      createMockCampaign({ id: "2", name: "Campaign 2" }),
    ];
    vi.mocked(prisma.campaign.findMany).mockResolvedValue(mockCampaigns);

    const result = await CampaignQueryService.getAll("store-123");

    expect(result).toHaveLength(2);
    expect(prisma.campaign.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { storeId: "store-123" },
        orderBy: { createdAt: "desc" },
      })
    );
  });

  it("should return empty array when no campaigns exist", async () => {
    vi.mocked(prisma.campaign.findMany).mockResolvedValue([]);

    const result = await CampaignQueryService.getAll("store-123");

    expect(result).toEqual([]);
  });

  it("should throw CampaignServiceError on database error", async () => {
    vi.mocked(prisma.campaign.findMany).mockRejectedValue(new Error("DB Error"));

    await expect(CampaignQueryService.getAll("store-123")).rejects.toThrow(
      "Failed to fetch campaigns"
    );
  });
});

// ==========================================================================
// GET BY ID TESTS
// ==========================================================================

describe("CampaignQueryService.getById", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("should return campaign when found", async () => {
    const mockCampaign = createMockCampaign();
    vi.mocked(prisma.campaign.findFirst).mockResolvedValue(mockCampaign);

    const result = await CampaignQueryService.getById("campaign-123", "store-123");

    expect(result).toEqual(mockCampaign);
    expect(prisma.campaign.findFirst).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { id: "campaign-123", storeId: "store-123" },
      })
    );
  });

  it("should return null when campaign not found", async () => {
    vi.mocked(prisma.campaign.findFirst).mockResolvedValue(null);

    const result = await CampaignQueryService.getById("nonexistent", "store-123");

    expect(result).toBeNull();
  });

  it("should throw CampaignServiceError on database error", async () => {
    vi.mocked(prisma.campaign.findFirst).mockRejectedValue(new Error("DB Error"));

    await expect(
      CampaignQueryService.getById("campaign-123", "store-123")
    ).rejects.toThrow("Failed to fetch campaign");
  });
});

// ==========================================================================
// GET ACTIVE TESTS
// ==========================================================================

describe("CampaignQueryService.getActive", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.spyOn(console, "log").mockImplementation(() => {});
  });

  it("should return active campaigns within schedule", async () => {
    const mockCampaigns = [
      createMockCampaign({ id: "1", status: "ACTIVE" }),
      createMockCampaign({ id: "2", status: "ACTIVE" }),
    ];
    vi.mocked(prisma.store.findUnique).mockResolvedValue({ timezone: "America/New_York" } as any);
    vi.mocked(prisma.campaign.findMany).mockResolvedValue(mockCampaigns);
    vi.mocked(isWithinSchedule).mockReturnValue(true);

    const result = await CampaignQueryService.getActive("store-123");

    expect(result).toHaveLength(2);
    expect(prisma.campaign.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { storeId: "store-123", status: "ACTIVE" },
      })
    );
  });

  it("should filter out campaigns outside schedule", async () => {
    const mockCampaigns = [
      createMockCampaign({ id: "1", status: "ACTIVE" }),
      createMockCampaign({ id: "2", status: "ACTIVE" }),
    ];
    vi.mocked(prisma.store.findUnique).mockResolvedValue({ timezone: "UTC" } as any);
    vi.mocked(prisma.campaign.findMany).mockResolvedValue(mockCampaigns);
    vi.mocked(isWithinSchedule)
      .mockReturnValueOnce(true)
      .mockReturnValueOnce(false);

    const result = await CampaignQueryService.getActive("store-123");

    expect(result).toHaveLength(1);
  });

  it("should use UTC when store timezone not found", async () => {
    vi.mocked(prisma.store.findUnique).mockResolvedValue(null);
    vi.mocked(prisma.campaign.findMany).mockResolvedValue([]);

    await CampaignQueryService.getActive("store-123");

    expect(isWithinSchedule).not.toHaveBeenCalled(); // No campaigns to filter
  });
});

// ==========================================================================
// GET BY STATUS TESTS
// ==========================================================================

describe("CampaignQueryService.getByStatus", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("should return campaigns with specified status", async () => {
    const mockCampaigns = [
      createMockCampaign({ id: "1", status: "DRAFT" }),
    ];
    vi.mocked(prisma.campaign.findMany).mockResolvedValue(mockCampaigns);

    const result = await CampaignQueryService.getByStatus("store-123", "DRAFT");

    expect(result).toHaveLength(1);
    expect(prisma.campaign.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { storeId: "store-123", status: "DRAFT" },
      })
    );
  });

  it("should throw CampaignServiceError on database error", async () => {
    vi.mocked(prisma.campaign.findMany).mockRejectedValue(new Error("DB Error"));

    await expect(
      CampaignQueryService.getByStatus("store-123", "ACTIVE")
    ).rejects.toThrow("Failed to fetch ACTIVE campaigns");
  });
});

// ==========================================================================
// GET BY TEMPLATE TYPE TESTS
// ==========================================================================

describe("CampaignQueryService.getByTemplateType", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("should return campaigns with specified template type", async () => {
    const mockCampaigns = [
      createMockCampaign({ id: "1", templateType: "SPIN_TO_WIN" }),
    ];
    vi.mocked(prisma.campaign.findMany).mockResolvedValue(mockCampaigns);

    const result = await CampaignQueryService.getByTemplateType("store-123", "SPIN_TO_WIN");

    expect(result).toHaveLength(1);
    expect(prisma.campaign.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { storeId: "store-123", templateType: "SPIN_TO_WIN" },
      })
    );
  });
});

// ==========================================================================
// GET BY EXPERIMENT TESTS
// ==========================================================================

describe("CampaignQueryService.getByExperiment", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("should return campaigns for specified experiment", async () => {
    const mockCampaigns = [
      createMockCampaign({ id: "1", experimentId: "exp-123" }),
      createMockCampaign({ id: "2", experimentId: "exp-123" }),
    ];
    vi.mocked(prisma.campaign.findMany).mockResolvedValue(mockCampaigns);

    const result = await CampaignQueryService.getByExperiment("store-123", "exp-123");

    expect(result).toHaveLength(2);
    expect(prisma.campaign.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { storeId: "store-123", experimentId: "exp-123" },
      })
    );
  });

  it("should throw CampaignServiceError on database error", async () => {
    vi.mocked(prisma.campaign.findMany).mockRejectedValue(new Error("DB Error"));

    await expect(
      CampaignQueryService.getByExperiment("store-123", "exp-123")
    ).rejects.toThrow("Failed to fetch campaigns by experiment");
  });
});

