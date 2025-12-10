/**
 * Unit Tests for Reviews Types
 */

import { describe, it, expect } from "vitest";

import {
  REVIEW_STORAGE_KEYS,
  REVIEW_COOLDOWN_DAYS,
  type ReviewRequestSuccessResponse,
  type ReviewRequestDeclinedResponse,
  type ReviewRequestDeclinedCode,
  type ReviewTriggerType,
  type ReviewTiming,
  type UseReviewRequestOptions,
  type AutoReviewTriggerProps,
  type PostBillingReviewTriggerProps,
} from "~/domains/reviews/types";

describe("Reviews Types", () => {
  describe("REVIEW_STORAGE_KEYS", () => {
    it("should have all required storage keys", () => {
      expect(REVIEW_STORAGE_KEYS.DISMISSED_DATE).toBe("reviewRequestDismissedDate");
      expect(REVIEW_STORAGE_KEYS.HAS_REVIEWED).toBe("hasReviewed");
      expect(REVIEW_STORAGE_KEYS.ANNUAL_LIMIT_YEAR).toBe("reviewAnnualLimitReached");
      expect(REVIEW_STORAGE_KEYS.SHOWN_CHARGES).toBe("reviewShownCharges");
    });

    it("should be readonly", () => {
      // TypeScript ensures this at compile time, but we can verify the values exist
      expect(Object.keys(REVIEW_STORAGE_KEYS)).toHaveLength(4);
    });
  });

  describe("REVIEW_COOLDOWN_DAYS", () => {
    it("should be 30 days", () => {
      expect(REVIEW_COOLDOWN_DAYS).toBe(30);
    });
  });

  describe("Type Structures", () => {
    it("should allow valid ReviewRequestSuccessResponse", () => {
      const response: ReviewRequestSuccessResponse = {
        success: true,
        code: "success",
        message: "Review modal shown successfully",
      };

      expect(response.success).toBe(true);
      expect(response.code).toBe("success");
    });

    it("should allow valid ReviewRequestDeclinedResponse", () => {
      const response: ReviewRequestDeclinedResponse = {
        success: false,
        code: "cooldown-period",
        message: "Too soon since last request",
      };

      expect(response.success).toBe(false);
      expect(response.code).toBe("cooldown-period");
    });

    it("should allow all valid decline codes", () => {
      const codes: ReviewRequestDeclinedCode[] = [
        "mobile-app",
        "already-reviewed",
        "annual-limit-reached",
        "cooldown-period",
        "merchant-ineligible",
      ];

      codes.forEach((code) => {
        const response: ReviewRequestDeclinedResponse = {
          success: false,
          code,
          message: "Test message",
        };
        expect(response.code).toBe(code);
      });
    });

    it("should allow all valid trigger types", () => {
      const triggers: ReviewTriggerType[] = ["post-billing", "milestone", "success-action"];

      triggers.forEach((trigger) => {
        const timing: ReviewTiming = {
          trigger,
          context: "Test context",
        };
        expect(timing.trigger).toBe(trigger);
      });
    });

    it("should allow ReviewTiming with metadata", () => {
      const timing: ReviewTiming = {
        trigger: "milestone",
        context: "100 campaigns created",
        metadata: {
          campaignCount: 100,
          userId: "user-123",
        },
      };

      expect(timing.metadata?.campaignCount).toBe(100);
    });

    it("should allow UseReviewRequestOptions with callbacks", () => {
      const options: UseReviewRequestOptions = {
        onSuccess: () => {},
        onDecline: (code, message) => {
          expect(code).toBeDefined();
          expect(message).toBeDefined();
        },
        analytics: (event, data) => {
          expect(event).toBeDefined();
          expect(data).toBeDefined();
        },
      };

      expect(options.onSuccess).toBeDefined();
    });

    it("should allow AutoReviewTriggerProps", () => {
      const props: AutoReviewTriggerProps = {
        shouldTrigger: true,
        trigger: "success-action",
        context: "Campaign published",
        metadata: { campaignId: "123" },
        delay: 3000,
      };

      expect(props.shouldTrigger).toBe(true);
      expect(props.delay).toBe(3000);
    });

    it("should allow PostBillingReviewTriggerProps", () => {
      const props: PostBillingReviewTriggerProps = {
        chargeId: "charge-123",
        recentUpgrade: {
          fromPlan: "free",
          toPlan: "pro",
          createdAt: "2024-01-01T00:00:00Z",
        },
      };

      expect(props.chargeId).toBe("charge-123");
      expect(props.recentUpgrade?.toPlan).toBe("pro");
    });

    it("should allow PostBillingReviewTriggerProps with null values", () => {
      const props: PostBillingReviewTriggerProps = {
        chargeId: null,
        recentUpgrade: null,
      };

      expect(props.chargeId).toBeNull();
      expect(props.recentUpgrade).toBeNull();
    });
  });
});

