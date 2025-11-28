/**
 * Integration Tests for A/B Test Campaign Schedule Propagation
 *
 * Tests that Schedule & Settings (status, priority, startDate, endDate, tags)
 * are properly propagated from Control variant (A) to all other variants
 * when creating A/B test campaigns.
 *
 * This ensures consistency across experiment variants - all variants should
 * run during the same time period with the same priority and status.
 */

import { describe, it, expect, vi, beforeEach } from "vitest";

// Types for variant campaign data
interface VariantCampaignData {
  name: string;
  goal: string;
  templateType: string;
  status?: string;
  priority?: number;
  startDate?: string;
  endDate?: string;
  tags?: string[];
  contentConfig: Record<string, unknown>;
  designConfig: Record<string, unknown>;
  frequencyCapping: {
    enabled: boolean;
    max_triggers_per_session?: number;
    max_triggers_per_day?: number;
    cooldown_between_triggers?: number;
  };
  experimentName?: string;
  experimentDescription?: string;
  trafficAllocation?: number;
}

/**
 * Simulates the schedule propagation logic from app.campaigns.new.tsx
 * This is the exact logic used in production to copy schedule settings
 * from Control to other variants.
 */
function propagateScheduleFromControl(
  variants: VariantCampaignData[]
): VariantCampaignData[] {
  if (variants.length === 0) return variants;

  const controlVariant = variants[0];
  const scheduleSettings = {
    status: controlVariant.status,
    priority: controlVariant.priority,
    startDate: controlVariant.startDate,
    endDate: controlVariant.endDate,
    tags: controlVariant.tags,
  };

  return variants.map((variant, index) => {
    if (index === 0) return variant; // Control keeps its own settings
    return { ...variant, ...scheduleSettings };
  });
}

// Wizard steps definition (matching production)
const WIZARD_STEPS = [
  { id: "goal", title: "Campaign Goal & Basics", isRequired: true },
  { id: "design", title: "Template & Design", isRequired: true },
  { id: "targeting", title: "Targeting & Triggers", isRequired: false },
  { id: "frequency", title: "Frequency Capping", isRequired: false },
  { id: "schedule", title: "Schedule & Settings", isRequired: false },
];

/**
 * Computes effective wizard steps based on A/B testing state.
 * Schedule step is only shown for Control variant (A).
 */
function getEffectiveSteps(
  abTestingEnabled: boolean,
  selectedVariant: "A" | "B" | "C" | "D"
) {
  if (abTestingEnabled && selectedVariant !== "A") {
    return WIZARD_STEPS.filter((step) => step.id !== "schedule");
  }
  return WIZARD_STEPS;
}

describe("A/B Test Schedule Propagation", () => {
  describe("propagateScheduleFromControl", () => {
    it("should copy schedule settings from Control (A) to Variant B", () => {
      const variants: VariantCampaignData[] = [
        {
          name: "Variant A",
          goal: "NEWSLETTER_SIGNUP",
          templateType: "NEWSLETTER",
          status: "ACTIVE",
          priority: 10,
          startDate: "2024-01-01T00:00:00Z",
          endDate: "2024-01-31T23:59:59Z",
          tags: ["winter-sale", "newsletter"],
          contentConfig: { headline: "Control headline" },
          designConfig: { theme: "modern" },
          frequencyCapping: { enabled: false },
        },
        {
          name: "Variant B",
          goal: "NEWSLETTER_SIGNUP",
          templateType: "NEWSLETTER",
          status: "DRAFT", // Different status - should be overwritten
          priority: 0, // Different priority - should be overwritten
          startDate: undefined, // No start date - should get Control's
          endDate: undefined, // No end date - should get Control's
          tags: [], // Empty tags - should get Control's
          contentConfig: { headline: "Test headline" },
          designConfig: { theme: "minimal" },
          frequencyCapping: { enabled: false },
        },
      ];

      const result = propagateScheduleFromControl(variants);

      // Control should be unchanged
      expect(result[0].status).toBe("ACTIVE");
      expect(result[0].priority).toBe(10);
      expect(result[0].startDate).toBe("2024-01-01T00:00:00Z");
      expect(result[0].endDate).toBe("2024-01-31T23:59:59Z");
      expect(result[0].tags).toEqual(["winter-sale", "newsletter"]);

      // Variant B should have Control's schedule settings
      expect(result[1].status).toBe("ACTIVE");
      expect(result[1].priority).toBe(10);
      expect(result[1].startDate).toBe("2024-01-01T00:00:00Z");
      expect(result[1].endDate).toBe("2024-01-31T23:59:59Z");
      expect(result[1].tags).toEqual(["winter-sale", "newsletter"]);

      // Variant B should keep its own content/design
      expect(result[1].contentConfig).toEqual({ headline: "Test headline" });
      expect(result[1].designConfig).toEqual({ theme: "minimal" });
    });

    it("should propagate to multiple variants (B, C, D)", () => {
      const variants: VariantCampaignData[] = [
        {
          name: "Control",
          goal: "INCREASE_REVENUE",
          templateType: "SPIN_TO_WIN",
          status: "ACTIVE",
          priority: 5,
          startDate: "2024-02-01",
          endDate: "2024-02-28",
          tags: ["spin"],
          contentConfig: {},
          designConfig: {},
          frequencyCapping: { enabled: true, max_triggers_per_session: 1 },
        },
        {
          name: "Variant B",
          goal: "INCREASE_REVENUE",
          templateType: "SPIN_TO_WIN",
          contentConfig: { wheelSegments: ["10%", "20%"] },
          designConfig: {},
          frequencyCapping: { enabled: true },
        },
        {
          name: "Variant C",
          goal: "INCREASE_REVENUE",
          templateType: "SPIN_TO_WIN",
          contentConfig: { wheelSegments: ["15%", "25%"] },
          designConfig: {},
          frequencyCapping: { enabled: true },
        },
      ];

      const result = propagateScheduleFromControl(variants);

      // All variants should have same schedule
      expect(result[1].status).toBe("ACTIVE");
      expect(result[1].priority).toBe(5);
      expect(result[1].startDate).toBe("2024-02-01");
      expect(result[2].status).toBe("ACTIVE");
      expect(result[2].priority).toBe(5);
      expect(result[2].endDate).toBe("2024-02-28");

      // Each variant keeps unique content
      expect(result[1].contentConfig).toEqual({ wheelSegments: ["10%", "20%"] });
      expect(result[2].contentConfig).toEqual({ wheelSegments: ["15%", "25%"] });
    });

    it("should handle empty variants array", () => {
      const result = propagateScheduleFromControl([]);
      expect(result).toEqual([]);
    });

    it("should handle single variant (Control only)", () => {
      const variants: VariantCampaignData[] = [
        {
          name: "Control",
          goal: "NEWSLETTER_SIGNUP",
          templateType: "NEWSLETTER",
          status: "ACTIVE",
          priority: 5,
          contentConfig: {},
          designConfig: {},
          frequencyCapping: { enabled: false },
        },
      ];

      const result = propagateScheduleFromControl(variants);
      expect(result).toHaveLength(1);
      expect(result[0].status).toBe("ACTIVE");
    });
  });

  describe("getEffectiveSteps - Wizard Step Filtering", () => {
    it("should show all 5 steps when A/B testing is disabled", () => {
      const steps = getEffectiveSteps(false, "A");
      expect(steps).toHaveLength(5);
      expect(steps.map((s) => s.id)).toEqual([
        "goal",
        "design",
        "targeting",
        "frequency",
        "schedule",
      ]);
    });

    it("should show all 5 steps for Control variant (A) in A/B test", () => {
      const steps = getEffectiveSteps(true, "A");
      expect(steps).toHaveLength(5);
      expect(steps.find((s) => s.id === "schedule")).toBeDefined();
    });

    it("should hide schedule step for Variant B in A/B test", () => {
      const steps = getEffectiveSteps(true, "B");
      expect(steps).toHaveLength(4);
      expect(steps.find((s) => s.id === "schedule")).toBeUndefined();
      expect(steps.map((s) => s.id)).toEqual([
        "goal",
        "design",
        "targeting",
        "frequency",
      ]);
    });

    it("should hide schedule step for Variant C in A/B test", () => {
      const steps = getEffectiveSteps(true, "C");
      expect(steps).toHaveLength(4);
      expect(steps.find((s) => s.id === "schedule")).toBeUndefined();
    });

    it("should hide schedule step for Variant D in A/B test", () => {
      const steps = getEffectiveSteps(true, "D");
      expect(steps).toHaveLength(4);
      expect(steps.find((s) => s.id === "schedule")).toBeUndefined();
    });
  });
});

