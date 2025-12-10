/**
 * Unit Tests for Campaign Mutation Service
 *
 * Tests campaign write operations:
 * - Create campaign
 * - Update campaign
 * - Delete campaign
 * - Plan-based feature sanitization
 */

import { describe, it, expect, vi, beforeEach } from "vitest";

// Mock Prisma before importing the module
vi.mock("~/db.server", () => ({
  default: {
    campaign: {
      create: vi.fn(),
      updateMany: vi.fn(),
      update: vi.fn(),
      deleteMany: vi.fn(),
      findUnique: vi.fn(),
      count: vi.fn(),
    },
    experiment: {
      findUnique: vi.fn(),
      delete: vi.fn(),
      update: vi.fn(),
    },
  },
}));

// Mock PlanGuardService
vi.mock("~/domains/billing/services/plan-guard.server", () => ({
  PlanGuardService: {
    assertCanCreateCampaign: vi.fn().mockResolvedValue(undefined),
    assertCanAddVariant: vi.fn().mockResolvedValue(undefined),
    getPlanContext: vi.fn().mockResolvedValue({
      definition: { features: { advancedTargeting: true } },
    }),
  },
}));

// Mock MarketingEventsService
vi.mock("~/domains/marketing-events/services/marketing-events.server", () => ({
  MarketingEventsService: {
    createMarketingEvent: vi.fn().mockResolvedValue(null),
    updateMarketingEvent: vi.fn().mockResolvedValue(null),
    deleteMarketingEvent: vi.fn().mockResolvedValue(null),
  },
}));

// Mock CampaignQueryService
vi.mock("~/domains/campaigns/services/campaign-query.server", () => ({
  CampaignQueryService: {
    getById: vi.fn(),
  },
}));

// Mock campaign validation to allow tests to proceed
const mockValidation = vi.hoisted(() => ({
  validateCampaignCreateData: vi.fn().mockReturnValue({ success: true }),
  validateCampaignUpdateData: vi.fn().mockReturnValue({ success: true }),
  validateCampaignForActivation: vi.fn().mockReturnValue({ success: true }),
}));

vi.mock("~/domains/campaigns/validation/campaign-validation", () => mockValidation);

import { CampaignMutationService } from "~/domains/campaigns/services/campaign-mutation.server";
import prisma from "~/db.server";
import { CampaignServiceError } from "~/lib/errors.server";
import { PlanGuardService } from "~/domains/billing/services/plan-guard.server";
import * as campaignValidation from "~/domains/campaigns/validation/campaign-validation";

// ==========================================================================
// TEST HELPERS
// ==========================================================================

const mockStoreId = "store-123";

function createMockCampaign(overrides = {}) {
  return {
    id: "campaign-123",
    storeId: mockStoreId,
    name: "Test Campaign",
    description: "Test description",
    goal: "NEWSLETTER_SIGNUP",
    status: "DRAFT",
    priority: 0,
    templateId: "template-123",
    templateType: "NEWSLETTER",
    contentConfig: JSON.stringify({ headline: "Test" }),
    designConfig: JSON.stringify({}),
    targetRules: JSON.stringify({}),
    discountConfig: JSON.stringify({}),
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
    template: { id: "template-123", name: "Newsletter", templateType: "NEWSLETTER" },
    experiment: null,
    ...overrides,
  };
}

const validCreateData = {
  name: "New Campaign",
  description: "Test description",
  goal: "NEWSLETTER_SIGNUP" as const,
  templateId: "template-123",
  templateType: "NEWSLETTER" as const,
  contentConfig: { headline: "Subscribe Now" },
  // designConfig is optional, omit to avoid type errors
};

// ==========================================================================
// CREATE CAMPAIGN TESTS
// ==========================================================================

describe("CampaignMutationService.create", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("should create campaign with valid data", async () => {
    const mockCreated = createMockCampaign();
    vi.mocked(prisma.campaign.create).mockResolvedValue(mockCreated as any);

    const result = await CampaignMutationService.create(mockStoreId, validCreateData);

    expect(result.id).toBe("campaign-123");
    expect(prisma.campaign.create).toHaveBeenCalledWith({
      data: expect.objectContaining({
        storeId: mockStoreId,
        name: "New Campaign",
        templateType: "NEWSLETTER",
      }),
      include: expect.any(Object),
    });
  });

  it("should throw validation error for empty name", async () => {
    // Mock validation to fail
    vi.mocked(campaignValidation.validateCampaignCreateData).mockReturnValueOnce({
      success: false,
      errors: ["Campaign name is required"],
    });

    await expect(
      CampaignMutationService.create(mockStoreId, {
        ...validCreateData,
        name: "",
      })
    ).rejects.toThrow(CampaignServiceError);
  });

  it("should set default status to DRAFT", async () => {
    const mockCreated = createMockCampaign();
    vi.mocked(prisma.campaign.create).mockResolvedValue(mockCreated as any);

    await CampaignMutationService.create(mockStoreId, validCreateData);

    expect(prisma.campaign.create).toHaveBeenCalledWith({
      data: expect.objectContaining({
        status: "DRAFT",
      }),
      include: expect.any(Object),
    });
  });

  it("should check plan limits when creating ACTIVE campaign", async () => {
    const mockCreated = createMockCampaign({ status: "ACTIVE" });
    vi.mocked(prisma.campaign.create).mockResolvedValue(mockCreated as any);

    await CampaignMutationService.create(mockStoreId, {
      ...validCreateData,
      status: "ACTIVE",
    });

    expect(PlanGuardService.assertCanCreateCampaign).toHaveBeenCalledWith(mockStoreId);
  });

  it("should check variant limits when experimentId is provided", async () => {
    const mockCreated = createMockCampaign({ experimentId: "exp-123" });
    vi.mocked(prisma.campaign.create).mockResolvedValue(mockCreated as any);

    await CampaignMutationService.create(mockStoreId, {
      ...validCreateData,
      experimentId: "exp-123",
    });

    expect(PlanGuardService.assertCanAddVariant).toHaveBeenCalledWith(mockStoreId, "exp-123");
  });

  it("should throw CampaignServiceError when create fails", async () => {
    vi.mocked(prisma.campaign.create).mockRejectedValue(new Error("DB error"));

    await expect(
      CampaignMutationService.create(mockStoreId, validCreateData)
    ).rejects.toThrow(CampaignServiceError);
  });
});

// ==========================================================================
// UPDATE CAMPAIGN TESTS
// ==========================================================================

describe("CampaignMutationService.update", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("should update campaign with valid data", async () => {
    const mockUpdated = createMockCampaign({ name: "Updated Name" });
    vi.mocked(prisma.campaign.updateMany).mockResolvedValue({ count: 1 });
    vi.mocked(prisma.campaign.findUnique).mockResolvedValue(null);

    // Mock CampaignQueryService.getById
    const { CampaignQueryService } = await import(
      "~/domains/campaigns/services/campaign-query.server"
    );
    vi.mocked(CampaignQueryService.getById).mockResolvedValue(mockUpdated as any);

    const result = await CampaignMutationService.update(
      "campaign-123",
      mockStoreId,
      { name: "Updated Name" }
    );

    expect(result?.name).toBe("Updated Name");
    expect(prisma.campaign.updateMany).toHaveBeenCalled();
  });

  it("should return null when campaign not found", async () => {
    vi.mocked(prisma.campaign.updateMany).mockResolvedValue({ count: 0 });

    const result = await CampaignMutationService.update(
      "nonexistent",
      mockStoreId,
      { name: "New Name" }
    );

    expect(result).toBeNull();
  });

  it("should validate activation requirements when status changes to ACTIVE", async () => {
    const currentCampaign = createMockCampaign({ status: "DRAFT" });
    vi.mocked(prisma.campaign.findUnique).mockResolvedValue(currentCampaign as any);
    vi.mocked(prisma.campaign.updateMany).mockResolvedValue({ count: 1 });

    const { CampaignQueryService } = await import(
      "~/domains/campaigns/services/campaign-query.server"
    );
    vi.mocked(CampaignQueryService.getById).mockResolvedValue({
      ...currentCampaign,
      status: "ACTIVE",
    } as any);

    const result = await CampaignMutationService.update(
      "campaign-123",
      mockStoreId,
      { status: "ACTIVE" }
    );

    expect(PlanGuardService.assertCanCreateCampaign).toHaveBeenCalledWith(mockStoreId);
    expect(result?.status).toBe("ACTIVE");
  });

  it("should throw validation error for invalid update data", async () => {
    // Mock validation to fail
    vi.mocked(campaignValidation.validateCampaignUpdateData).mockReturnValueOnce({
      success: false,
      errors: ["Priority must be non-negative"],
    });

    await expect(
      CampaignMutationService.update("campaign-123", mockStoreId, {
        priority: -10, // Invalid negative priority
      } as any)
    ).rejects.toThrow(CampaignServiceError);
  });
});

// ==========================================================================
// DELETE CAMPAIGN TESTS
// ==========================================================================

describe("CampaignMutationService.delete", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("should delete campaign successfully", async () => {
    vi.mocked(prisma.campaign.findUnique).mockResolvedValue(
      createMockCampaign({ marketingEventId: null, experimentId: null }) as any
    );
    vi.mocked(prisma.campaign.deleteMany).mockResolvedValue({ count: 1 });

    const result = await CampaignMutationService.delete("campaign-123", mockStoreId);

    expect(result).toBe(true);
    expect(prisma.campaign.deleteMany).toHaveBeenCalledWith({
      where: { id: "campaign-123", storeId: mockStoreId },
    });
  });

  it("should return false when campaign not found", async () => {
    vi.mocked(prisma.campaign.findUnique).mockResolvedValue(null);

    const result = await CampaignMutationService.delete("nonexistent", mockStoreId);

    expect(result).toBe(false);
  });

  it("should cleanup draft experiment when last variant deleted", async () => {
    vi.mocked(prisma.campaign.findUnique).mockResolvedValue({
      marketingEventId: null,
      experimentId: "exp-123",
    } as any);
    vi.mocked(prisma.campaign.deleteMany).mockResolvedValue({ count: 1 });
    vi.mocked(prisma.campaign.count).mockResolvedValue(0); // No remaining variants
    vi.mocked(prisma.experiment.findUnique).mockResolvedValue({ status: "DRAFT" } as any);
    vi.mocked(prisma.experiment.delete).mockResolvedValue({} as any);

    await CampaignMutationService.delete("campaign-123", mockStoreId);

    expect(prisma.experiment.delete).toHaveBeenCalledWith({
      where: { id: "exp-123" },
    });
  });

  it("should archive running experiment when last variant deleted", async () => {
    vi.mocked(prisma.campaign.findUnique).mockResolvedValue({
      marketingEventId: null,
      experimentId: "exp-123",
    } as any);
    vi.mocked(prisma.campaign.deleteMany).mockResolvedValue({ count: 1 });
    vi.mocked(prisma.campaign.count).mockResolvedValue(0);
    vi.mocked(prisma.experiment.findUnique).mockResolvedValue({ status: "RUNNING" } as any);
    vi.mocked(prisma.experiment.update).mockResolvedValue({} as any);

    await CampaignMutationService.delete("campaign-123", mockStoreId);

    expect(prisma.experiment.update).toHaveBeenCalledWith({
      where: { id: "exp-123" },
      data: { status: "ARCHIVED" },
    });
  });

  it("should not cleanup experiment if variants remain", async () => {
    vi.mocked(prisma.campaign.findUnique).mockResolvedValue({
      marketingEventId: null,
      experimentId: "exp-123",
    } as any);
    vi.mocked(prisma.campaign.deleteMany).mockResolvedValue({ count: 1 });
    vi.mocked(prisma.campaign.count).mockResolvedValue(2); // Other variants exist

    await CampaignMutationService.delete("campaign-123", mockStoreId);

    expect(prisma.experiment.delete).not.toHaveBeenCalled();
    expect(prisma.experiment.update).not.toHaveBeenCalled();
  });
});

