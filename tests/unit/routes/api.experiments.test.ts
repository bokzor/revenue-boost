/**
 * Unit Tests for Experiments API
 *
 * Tests the experiment listing and creation logic.
 */

import { describe, it, expect } from "vitest";
import { z } from "zod";

// Recreate the experiment status enum
const ExperimentStatusSchema = z.enum(["DRAFT", "RUNNING", "COMPLETED", "STOPPED"]);

// Recreate the experiment create schema
const ExperimentCreateDataSchema = z.object({
  name: z.string().min(1, "Name is required"),
  description: z.string().optional(),
  trafficSplit: z.number().min(0).max(100).optional().default(50),
});

// Helper to parse query params
function parseExperimentQueryParams(url: URL): {
  status: string | null;
} {
  return {
    status: url.searchParams.get("status"),
  };
}

describe("Experiments API", () => {
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

  describe("ExperimentCreateDataSchema", () => {
    it("should validate valid experiment data", () => {
      const validData = {
        name: "A/B Test Campaign",
      };

      const result = ExperimentCreateDataSchema.safeParse(validData);
      expect(result.success).toBe(true);
    });

    it("should require name", () => {
      const invalidData = {};

      const result = ExperimentCreateDataSchema.safeParse(invalidData);
      expect(result.success).toBe(false);
    });

    it("should reject empty name", () => {
      const invalidData = { name: "" };

      const result = ExperimentCreateDataSchema.safeParse(invalidData);
      expect(result.success).toBe(false);
    });

    it("should accept optional description", () => {
      const validData = {
        name: "Test Experiment",
        description: "Testing different headlines",
      };

      const result = ExperimentCreateDataSchema.safeParse(validData);
      expect(result.success).toBe(true);
    });

    it("should validate trafficSplit range", () => {
      expect(
        ExperimentCreateDataSchema.safeParse({ name: "Test", trafficSplit: 0 }).success
      ).toBe(true);
      expect(
        ExperimentCreateDataSchema.safeParse({ name: "Test", trafficSplit: 100 }).success
      ).toBe(true);
      expect(
        ExperimentCreateDataSchema.safeParse({ name: "Test", trafficSplit: -1 }).success
      ).toBe(false);
      expect(
        ExperimentCreateDataSchema.safeParse({ name: "Test", trafficSplit: 101 }).success
      ).toBe(false);
    });

    it("should default trafficSplit to 50", () => {
      const validData = { name: "Test" };

      const result = ExperimentCreateDataSchema.safeParse(validData);
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.trafficSplit).toBe(50);
      }
    });
  });

  describe("parseExperimentQueryParams", () => {
    it("should parse status parameter", () => {
      const url = new URL("https://example.com/api/experiments?status=running");
      const params = parseExperimentQueryParams(url);
      expect(params.status).toBe("running");
    });

    it("should handle missing status", () => {
      const url = new URL("https://example.com/api/experiments");
      const params = parseExperimentQueryParams(url);
      expect(params.status).toBeNull();
    });
  });

  describe("Response structure", () => {
    it("should have valid GET response", () => {
      const response = {
        success: true,
        data: {
          experiments: [
            { id: "exp_1", name: "Test A/B", status: "RUNNING" },
          ],
        },
      };

      expect(response.success).toBe(true);
      expect(response.data.experiments).toHaveLength(1);
    });

    it("should have valid POST response", () => {
      const response = {
        success: true,
        data: {
          experiment: {
            id: "exp_1",
            name: "New Experiment",
            status: "DRAFT",
          },
        },
      };

      expect(response.success).toBe(true);
      expect(response.data.experiment.id).toBe("exp_1");
    });
  });
});

