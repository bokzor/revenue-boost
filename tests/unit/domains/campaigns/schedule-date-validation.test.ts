/**
 * Schedule Date Validation Tests
 *
 * Tests for campaign schedule date validation:
 * - Client-side validation (validateScheduleDates helper)
 * - Server-side validation (Zod schema refinement)
 */

import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { validateScheduleDates } from "~/domains/campaigns/utils/schedule-helpers";
import { CampaignCreateDataSchema } from "~/domains/campaigns/types/campaign";

describe("Schedule Date Validation", () => {
  describe("validateScheduleDates (client-side)", () => {
    beforeEach(() => {
      // Mock current time: 2024-06-15 12:00:00 UTC
      vi.useFakeTimers();
      vi.setSystemTime(new Date("2024-06-15T12:00:00Z"));
    });

    afterEach(() => {
      vi.useRealTimers();
    });

    it("should return no errors when no dates provided", () => {
      const result = validateScheduleDates(undefined, undefined);
      expect(result).toEqual({});
    });

    it("should return no errors for valid future start date", () => {
      const result = validateScheduleDates("2024-06-16T12:00:00Z", undefined);
      expect(result).toEqual({});
    });

    it("should return no errors for valid future end date", () => {
      const result = validateScheduleDates(undefined, "2024-06-16T12:00:00Z");
      expect(result).toEqual({});
    });

    it("should return no errors when end date is after start date", () => {
      const result = validateScheduleDates("2024-06-16T12:00:00Z", "2024-06-17T12:00:00Z");
      expect(result).toEqual({});
    });

    it("should return error for past start date", () => {
      const result = validateScheduleDates("2024-06-14T12:00:00Z", undefined);
      expect(result.startDateError).toBe("Start date cannot be in the past");
      expect(result.endDateError).toBeUndefined();
    });

    it("should return error for past end date", () => {
      const result = validateScheduleDates(undefined, "2024-06-14T12:00:00Z");
      expect(result.endDateError).toBe("End date cannot be in the past");
      expect(result.startDateError).toBeUndefined();
    });

    it("should return error when end date is before start date", () => {
      const result = validateScheduleDates("2024-06-17T12:00:00Z", "2024-06-16T12:00:00Z");
      expect(result.endDateError).toBe("End date must be after start date");
      expect(result.startDateError).toBeUndefined();
    });

    it("should return error when end date equals start date", () => {
      const result = validateScheduleDates("2024-06-16T12:00:00Z", "2024-06-16T12:00:00Z");
      expect(result.endDateError).toBe("End date must be after start date");
    });

    it("should prioritize past date error over order error", () => {
      // Both dates in past, end before start
      const result = validateScheduleDates("2024-06-14T12:00:00Z", "2024-06-13T12:00:00Z");
      expect(result.startDateError).toBe("Start date cannot be in the past");
      expect(result.endDateError).toBe("End date cannot be in the past");
    });
  });

  describe("CampaignCreateDataSchema (server-side)", () => {
    beforeEach(() => {
      // Mock current time: 2024-06-15 12:00:00 UTC
      vi.useFakeTimers();
      vi.setSystemTime(new Date("2024-06-15T12:00:00Z"));
    });

    afterEach(() => {
      vi.useRealTimers();
    });

    const validBaseData = {
      name: "Test Campaign",
      goal: "NEWSLETTER_SIGNUP",
      templateType: "NEWSLETTER",
    };

    it("should pass validation with no dates", () => {
      const result = CampaignCreateDataSchema.safeParse(validBaseData);
      expect(result.success).toBe(true);
    });

    it("should pass validation with valid future dates", () => {
      const result = CampaignCreateDataSchema.safeParse({
        ...validBaseData,
        startDate: "2024-06-16T12:00:00Z",
        endDate: "2024-06-17T12:00:00Z",
      });
      expect(result.success).toBe(true);
    });

    it("should fail validation when end date is before start date", () => {
      const result = CampaignCreateDataSchema.safeParse({
        ...validBaseData,
        startDate: "2024-06-17T12:00:00Z",
        endDate: "2024-06-16T12:00:00Z",
      });
      expect(result.success).toBe(false);
      if (!result.success) {
        const endDateError = result.error.issues.find((i) => i.path.includes("endDate"));
        expect(endDateError?.message).toBe("End date must be after start date");
      }
    });

    it("should fail validation when start date is in the past", () => {
      const result = CampaignCreateDataSchema.safeParse({
        ...validBaseData,
        startDate: "2024-06-10T12:00:00Z", // 5 days in past (outside 1 min tolerance)
      });
      expect(result.success).toBe(false);
      if (!result.success) {
        const startDateError = result.error.issues.find((i) => i.path.includes("startDate"));
        expect(startDateError?.message).toBe("Start date cannot be in the past");
      }
    });

    it("should allow start date within 1 minute tolerance", () => {
      // Set system time to 12:00:30 and start date to 12:00:00 (30 seconds ago)
      vi.setSystemTime(new Date("2024-06-15T12:00:30Z"));
      const result = CampaignCreateDataSchema.safeParse({
        ...validBaseData,
        startDate: "2024-06-15T12:00:00Z",
      });
      expect(result.success).toBe(true);
    });

    it("should handle empty string dates as undefined", () => {
      const result = CampaignCreateDataSchema.safeParse({
        ...validBaseData,
        startDate: "",
        endDate: "",
      });
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.startDate).toBeUndefined();
        expect(result.data.endDate).toBeUndefined();
      }
    });
  });
});

