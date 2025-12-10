/**
 * Unit Tests for Experiment Service
 *
 * Tests A/B testing experiment operations:
 * - Get all experiments
 * - Get experiment by ID
 * - Create experiment
 * - Update experiment
 * - Get running experiments
 */

import { describe, it, expect, vi, beforeEach } from "vitest";

// Mock Prisma before importing the module
vi.mock("~/db.server", () => ({
  default: {
    experiment: {
      findMany: vi.fn(),
      findFirst: vi.fn(),
      create: vi.fn(),
      update: vi.fn(),
    },
  },
}));

// Mock PlanGuardService
vi.mock("~/domains/billing/services/plan-guard.server", () => ({
  PlanGuardService: {
    assertCanCreateExperiment: vi.fn().mockResolvedValue(undefined),
  },
}));

import { ExperimentService } from "~/domains/campaigns/services/experiment.server";
import prisma from "~/db.server";
import { ExperimentServiceError } from "~/lib/errors.server";

// ==========================================================================
// TEST HELPERS
// ==========================================================================

const mockStoreId = "store-123";

function createMockExperiment(overrides = {}) {
  return {
    id: "exp-123",
    storeId: mockStoreId,
    name: "Test Experiment",
    description: "Test description",
    hypothesis: "Test hypothesis",
    status: "DRAFT",
    trafficAllocation: JSON.stringify({ A: 50, B: 50 }),
    statisticalConfig: JSON.stringify({ confidenceLevel: 0.95 }),
    successMetrics: JSON.stringify({ primaryMetric: "conversion_rate" }),
    startDate: null,
    endDate: null,
    plannedDurationDays: 14,
    createdAt: new Date(),
    updatedAt: new Date(),
    campaigns: [],
    ...overrides,
  };
}

function createMockCampaign(overrides = {}) {
  return {
    id: "campaign-123",
    name: "Variant A",
    variantKey: "A",
    isControl: true,
    status: "ACTIVE",
    ...overrides,
  };
}

// ==========================================================================
// GET ALL EXPERIMENTS TESTS
// ==========================================================================

describe("ExperimentService.getAllExperiments", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("should return all experiments for a store", async () => {
    const mockExperiments = [
      createMockExperiment({ id: "exp-1" }),
      createMockExperiment({ id: "exp-2", name: "Second Experiment" }),
    ];
    vi.mocked(prisma.experiment.findMany).mockResolvedValue(mockExperiments as any);

    const result = await ExperimentService.getAllExperiments(mockStoreId);

    expect(result).toHaveLength(2);
    expect(result[0].id).toBe("exp-1");
    expect(result[1].id).toBe("exp-2");
    expect(prisma.experiment.findMany).toHaveBeenCalledWith({
      where: { storeId: mockStoreId },
      orderBy: { createdAt: "desc" },
      include: expect.any(Object),
    });
  });

  it("should return empty array when no experiments exist", async () => {
    vi.mocked(prisma.experiment.findMany).mockResolvedValue([]);

    const result = await ExperimentService.getAllExperiments(mockStoreId);

    expect(result).toEqual([]);
  });

  it("should parse JSON fields correctly", async () => {
    const mockExperiment = createMockExperiment({
      trafficAllocation: JSON.stringify({ A: 60, B: 40 }),
      campaigns: [createMockCampaign()],
    });
    vi.mocked(prisma.experiment.findMany).mockResolvedValue([mockExperiment] as any);

    const result = await ExperimentService.getAllExperiments(mockStoreId);

    expect(result[0].trafficAllocation).toEqual({ A: 60, B: 40 });
  });

  it("should throw ExperimentServiceError on database failure", async () => {
    vi.mocked(prisma.experiment.findMany).mockRejectedValue(new Error("DB error"));

    await expect(ExperimentService.getAllExperiments(mockStoreId)).rejects.toThrow(
      ExperimentServiceError
    );
  });
});

// ==========================================================================
// GET EXPERIMENT BY ID TESTS
// ==========================================================================

describe("ExperimentService.getExperimentById", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("should return experiment when found", async () => {
    const mockExperiment = createMockExperiment();
    vi.mocked(prisma.experiment.findFirst).mockResolvedValue(mockExperiment as any);

    const result = await ExperimentService.getExperimentById("exp-123", mockStoreId);

    expect(result).not.toBeNull();
    expect(result!.id).toBe("exp-123");
    expect(result!.name).toBe("Test Experiment");
  });

  it("should return null when experiment not found", async () => {
    vi.mocked(prisma.experiment.findFirst).mockResolvedValue(null);

    const result = await ExperimentService.getExperimentById("non-existent", mockStoreId);

    expect(result).toBeNull();
  });

  it("should map campaigns to variants", async () => {
    const mockExperiment = createMockExperiment({
      campaigns: [
        createMockCampaign({ variantKey: "A", isControl: true }),
        createMockCampaign({ id: "campaign-456", variantKey: "B", isControl: false }),
      ],
    });
    vi.mocked(prisma.experiment.findFirst).mockResolvedValue(mockExperiment as any);

    const result = await ExperimentService.getExperimentById("exp-123", mockStoreId);

    expect(result!.variants).toHaveLength(2);
  });
});

// ==========================================================================
// GET EXPERIMENTS BY IDS TESTS
// ==========================================================================

describe("ExperimentService.getExperimentsByIds", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("should return experiments matching the provided IDs", async () => {
    const mockExperiments = [
      createMockExperiment({ id: "exp-1" }),
      createMockExperiment({ id: "exp-2" }),
    ];
    vi.mocked(prisma.experiment.findMany).mockResolvedValue(mockExperiments as any);

    const result = await ExperimentService.getExperimentsByIds(mockStoreId, ["exp-1", "exp-2"]);

    expect(result).toHaveLength(2);
    expect(prisma.experiment.findMany).toHaveBeenCalledWith({
      where: {
        storeId: mockStoreId,
        id: { in: ["exp-1", "exp-2"] },
      },
      orderBy: { createdAt: "desc" },
      include: expect.any(Object),
    });
  });

  it("should return empty array when no IDs provided", async () => {
    const result = await ExperimentService.getExperimentsByIds(mockStoreId, []);

    expect(result).toEqual([]);
    expect(prisma.experiment.findMany).not.toHaveBeenCalled();
  });
});

// ==========================================================================
// CREATE EXPERIMENT TESTS
// ==========================================================================

// Valid experiment create data for tests
const validExperimentData = {
  name: "New Experiment",
  description: "Test description",
  hypothesis: "Test hypothesis",
  trafficAllocation: { A: 50, B: 50 },
  successMetrics: { primaryMetric: "conversion_rate" as const, secondaryMetrics: [] },
};

describe("ExperimentService.createExperiment", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("should create experiment with valid data", async () => {
    const mockCreated = createMockExperiment();
    vi.mocked(prisma.experiment.create).mockResolvedValue(mockCreated as any);

    const result = await ExperimentService.createExperiment(mockStoreId, validExperimentData);

    expect(result.name).toBe("Test Experiment");
    expect(prisma.experiment.create).toHaveBeenCalledWith({
      data: expect.objectContaining({
        storeId: mockStoreId,
        name: "New Experiment",
      }),
      include: expect.any(Object),
    });
  });

  it("should throw validation error for invalid data", async () => {
    await expect(
      ExperimentService.createExperiment(mockStoreId, {
        name: "", // Empty name should fail
        trafficAllocation: { A: 50, B: 50 },
        successMetrics: { primaryMetric: "conversion_rate" as const, secondaryMetrics: [] },
      })
    ).rejects.toThrow(ExperimentServiceError);
  });

  it("should pass traffic allocation to Prisma", async () => {
    const mockCreated = createMockExperiment();
    vi.mocked(prisma.experiment.create).mockResolvedValue(mockCreated as any);

    await ExperimentService.createExperiment(mockStoreId, {
      ...validExperimentData,
      trafficAllocation: { A: 60, B: 40 },
    });

    expect(prisma.experiment.create).toHaveBeenCalled();
    const callArgs = vi.mocked(prisma.experiment.create).mock.calls[0][0];
    // trafficAllocation is passed as object (Prisma handles JSON serialization)
    expect(callArgs.data.trafficAllocation).toEqual({ A: 60, B: 40 });
  });
});

// ==========================================================================
// UPDATE EXPERIMENT TESTS
// ==========================================================================

describe("ExperimentService.updateExperiment", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("should update experiment with valid data", async () => {
    const mockExisting = createMockExperiment();
    const mockUpdated = createMockExperiment({ name: "Updated Name" });
    vi.mocked(prisma.experiment.findFirst).mockResolvedValue(mockExisting as any);
    vi.mocked(prisma.experiment.update).mockResolvedValue(mockUpdated as any);

    const result = await ExperimentService.updateExperiment("exp-123", mockStoreId, {
      name: "Updated Name",
    });

    expect(result.name).toBe("Updated Name");
    expect(prisma.experiment.update).toHaveBeenCalledWith({
      where: { id: "exp-123" },
      data: expect.objectContaining({ name: "Updated Name" }),
      include: expect.any(Object),
    });
  });

  it("should throw NOT_FOUND when experiment does not exist", async () => {
    vi.mocked(prisma.experiment.findFirst).mockResolvedValue(null);

    await expect(
      ExperimentService.updateExperiment("non-existent", mockStoreId, { name: "Test" })
    ).rejects.toThrow(ExperimentServiceError);
  });

  it("should only update provided fields", async () => {
    const mockExisting = createMockExperiment();
    const mockUpdated = createMockExperiment({ description: "New description" });
    vi.mocked(prisma.experiment.findFirst).mockResolvedValue(mockExisting as any);
    vi.mocked(prisma.experiment.update).mockResolvedValue(mockUpdated as any);

    await ExperimentService.updateExperiment("exp-123", mockStoreId, {
      description: "New description",
    });

    expect(prisma.experiment.update).toHaveBeenCalledWith({
      where: { id: "exp-123" },
      data: { description: "New description" },
      include: expect.any(Object),
    });
  });
});

// ==========================================================================
// GET RUNNING EXPERIMENTS TESTS
// ==========================================================================

describe("ExperimentService.getRunningExperiments", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("should return only running experiments", async () => {
    const mockExperiments = [
      createMockExperiment({ id: "exp-1", status: "RUNNING" }),
    ];
    vi.mocked(prisma.experiment.findMany).mockResolvedValue(mockExperiments as any);

    const result = await ExperimentService.getRunningExperiments(mockStoreId);

    expect(result).toHaveLength(1);
    expect(prisma.experiment.findMany).toHaveBeenCalledWith({
      where: {
        storeId: mockStoreId,
        status: "RUNNING",
      },
      orderBy: { startDate: "desc" },
      include: expect.objectContaining({
        campaigns: expect.objectContaining({
          where: { status: "ACTIVE" },
        }),
      }),
    });
  });

  it("should return empty array when no running experiments", async () => {
    vi.mocked(prisma.experiment.findMany).mockResolvedValue([]);

    const result = await ExperimentService.getRunningExperiments(mockStoreId);

    expect(result).toEqual([]);
  });
});
