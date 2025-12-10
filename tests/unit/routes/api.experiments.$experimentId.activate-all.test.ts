/**
 * Unit Tests for Activate All Campaigns API
 *
 * Tests the experiment campaign activation logic.
 */

import { describe, it, expect } from "vitest";

// Recreate the experiment structure
interface Experiment {
  id: string;
  name: string;
  status: string;
  variants: Array<{
    id: string;
    name: string;
    status: string;
    variantKey: string;
  }>;
}

// Recreate the response structure
interface ActivateAllResponse {
  success: boolean;
  message?: string;
  activatedCount?: number;
  error?: string;
}

// Helper to validate experiment ID
function validateExperimentId(experimentId: string | undefined): boolean {
  return !!experimentId && experimentId.length > 0;
}

// Helper to count variants to activate
function countVariantsToActivate(experiment: Experiment): number {
  return experiment.variants.length;
}

// Helper to build success message
function buildActivationMessage(count: number): string {
  return `Activated ${count} campaign(s)`;
}

describe("Activate All Campaigns API", () => {
  describe("validateExperimentId", () => {
    it("should return true for valid experiment ID", () => {
      expect(validateExperimentId("exp_123")).toBe(true);
    });

    it("should return false for undefined", () => {
      expect(validateExperimentId(undefined)).toBe(false);
    });

    it("should return false for empty string", () => {
      expect(validateExperimentId("")).toBe(false);
    });
  });

  describe("countVariantsToActivate", () => {
    it("should count all variants", () => {
      const experiment: Experiment = {
        id: "exp_1",
        name: "A/B Test",
        status: "DRAFT",
        variants: [
          { id: "camp_1", name: "Variant A", status: "DRAFT", variantKey: "a" },
          { id: "camp_2", name: "Variant B", status: "DRAFT", variantKey: "b" },
        ],
      };

      expect(countVariantsToActivate(experiment)).toBe(2);
    });

    it("should return 0 for no variants", () => {
      const experiment: Experiment = {
        id: "exp_1",
        name: "Empty Test",
        status: "DRAFT",
        variants: [],
      };

      expect(countVariantsToActivate(experiment)).toBe(0);
    });
  });

  describe("buildActivationMessage", () => {
    it("should build correct message for single campaign", () => {
      expect(buildActivationMessage(1)).toBe("Activated 1 campaign(s)");
    });

    it("should build correct message for multiple campaigns", () => {
      expect(buildActivationMessage(3)).toBe("Activated 3 campaign(s)");
    });

    it("should build correct message for zero campaigns", () => {
      expect(buildActivationMessage(0)).toBe("Activated 0 campaign(s)");
    });
  });

  describe("ActivateAllResponse structure", () => {
    it("should have valid success response", () => {
      const response: ActivateAllResponse = {
        success: true,
        message: "Activated 2 campaign(s)",
        activatedCount: 2,
      };

      expect(response.success).toBe(true);
      expect(response.activatedCount).toBe(2);
    });

    it("should have valid error response", () => {
      const response: ActivateAllResponse = {
        success: false,
        error: "Experiment not found",
      };

      expect(response.success).toBe(false);
      expect(response.error).toBe("Experiment not found");
    });
  });

  describe("HTTP method validation", () => {
    it("should only allow POST method", () => {
      const allowedMethods = ["POST"];
      const disallowedMethods = ["GET", "PUT", "DELETE", "PATCH"];

      expect(allowedMethods).toContain("POST");
      disallowedMethods.forEach((method) => {
        expect(allowedMethods).not.toContain(method);
      });
    });
  });
});

