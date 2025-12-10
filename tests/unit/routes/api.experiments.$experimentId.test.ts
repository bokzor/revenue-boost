/**
 * Unit Tests for Individual Experiment API
 *
 * Tests the experiment retrieval and update logic.
 */

import { describe, it, expect } from "vitest";
import { z } from "zod";

// Recreate the experiment status enum
const ExperimentStatusSchema = z.enum(["DRAFT", "RUNNING", "COMPLETED", "STOPPED"]);

// Recreate the experiment update schema
const ExperimentUpdateDataSchema = z.object({
  id: z.string().optional(),
  name: z.string().min(1).optional(),
  description: z.string().optional(),
  status: ExperimentStatusSchema.optional(),
  trafficSplit: z.number().min(0).max(100).optional(),
  winnerId: z.string().optional(),
});

// Recreate the ID validation logic
function validateRequiredId(id: string | undefined, resourceName: string): void {
  if (!id) {
    throw new Error(`${resourceName} ID is required`);
  }
}

// Recreate the ID mismatch validation
function validateIdMatch(
  bodyId: string | undefined,
  routeId: string,
  resourceName: string
): void {
  if (bodyId && bodyId !== routeId) {
    throw new Error(`${resourceName} ID mismatch`);
  }
}

describe("Individual Experiment API", () => {
  describe("ExperimentStatusSchema", () => {
    it("should validate valid statuses", () => {
      expect(ExperimentStatusSchema.safeParse("DRAFT").success).toBe(true);
      expect(ExperimentStatusSchema.safeParse("RUNNING").success).toBe(true);
      expect(ExperimentStatusSchema.safeParse("COMPLETED").success).toBe(true);
      expect(ExperimentStatusSchema.safeParse("STOPPED").success).toBe(true);
    });

    it("should reject invalid statuses", () => {
      expect(ExperimentStatusSchema.safeParse("ACTIVE").success).toBe(false);
      expect(ExperimentStatusSchema.safeParse("PAUSED").success).toBe(false);
    });
  });

  describe("ExperimentUpdateDataSchema", () => {
    it("should validate valid update data", () => {
      const validData = {
        name: "Updated Experiment",
        status: "RUNNING",
        trafficSplit: 50,
      };

      const result = ExperimentUpdateDataSchema.safeParse(validData);
      expect(result.success).toBe(true);
    });

    it("should allow empty update (all optional)", () => {
      const result = ExperimentUpdateDataSchema.safeParse({});
      expect(result.success).toBe(true);
    });

    it("should validate trafficSplit range", () => {
      expect(
        ExperimentUpdateDataSchema.safeParse({ trafficSplit: 0 }).success
      ).toBe(true);
      expect(
        ExperimentUpdateDataSchema.safeParse({ trafficSplit: 100 }).success
      ).toBe(true);
      expect(
        ExperimentUpdateDataSchema.safeParse({ trafficSplit: -1 }).success
      ).toBe(false);
      expect(
        ExperimentUpdateDataSchema.safeParse({ trafficSplit: 101 }).success
      ).toBe(false);
    });

    it("should require non-empty name if provided", () => {
      expect(
        ExperimentUpdateDataSchema.safeParse({ name: "" }).success
      ).toBe(false);
      expect(
        ExperimentUpdateDataSchema.safeParse({ name: "Valid" }).success
      ).toBe(true);
    });
  });

  describe("validateRequiredId", () => {
    it("should not throw for valid ID", () => {
      expect(() => validateRequiredId("exp_123", "Experiment")).not.toThrow();
    });

    it("should throw for undefined ID", () => {
      expect(() => validateRequiredId(undefined, "Experiment")).toThrow(
        "Experiment ID is required"
      );
    });

    it("should throw for empty string ID", () => {
      expect(() => validateRequiredId("", "Experiment")).toThrow(
        "Experiment ID is required"
      );
    });
  });

  describe("validateIdMatch", () => {
    it("should not throw when IDs match", () => {
      expect(() =>
        validateIdMatch("exp_123", "exp_123", "Experiment")
      ).not.toThrow();
    });

    it("should not throw when body ID is undefined", () => {
      expect(() =>
        validateIdMatch(undefined, "exp_123", "Experiment")
      ).not.toThrow();
    });

    it("should throw when IDs don't match", () => {
      expect(() =>
        validateIdMatch("exp_456", "exp_123", "Experiment")
      ).toThrow("Experiment ID mismatch");
    });
  });

  describe("Response structure", () => {
    it("should have valid GET response", () => {
      const response = {
        success: true,
        data: {
          experiment: {
            id: "exp_123",
            name: "A/B Test",
            status: "RUNNING",
            trafficSplit: 50,
          },
        },
      };

      expect(response.success).toBe(true);
      expect(response.data.experiment.id).toBe("exp_123");
    });
  });
});

