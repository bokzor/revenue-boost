/**
 * reviewCooldownManager Unit Tests
 *
 * Tests for the review cooldown and state management utilities.
 */

import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import {
  isInCooldownPeriod,
  hasAlreadyReviewed,
  hasReachedAnnualLimit,
  hasShownForCharge,
  markChargeAsShown,
  recordReviewRequestDismissal,
  handleReviewResponseCode,
  canRequestReview,
  getCooldownDaysRemaining,
} from "~/domains/reviews/utils/reviewCooldownManager";
import { REVIEW_STORAGE_KEYS, REVIEW_COOLDOWN_DAYS } from "~/domains/reviews/types";

// Mock localStorage and sessionStorage
const localStorageMock = (() => {
  let store: Record<string, string> = {};
  return {
    getItem: vi.fn((key: string) => store[key] || null),
    setItem: vi.fn((key: string, value: string) => {
      store[key] = value;
    }),
    removeItem: vi.fn((key: string) => {
      delete store[key];
    }),
    clear: vi.fn(() => {
      store = {};
    }),
  };
})();

const sessionStorageMock = (() => {
  let store: Record<string, string> = {};
  return {
    getItem: vi.fn((key: string) => store[key] || null),
    setItem: vi.fn((key: string, value: string) => {
      store[key] = value;
    }),
    removeItem: vi.fn((key: string) => {
      delete store[key];
    }),
    clear: vi.fn(() => {
      store = {};
    }),
  };
})();

describe("reviewCooldownManager", () => {
  beforeEach(() => {
    // Setup mocks
    Object.defineProperty(global, "localStorage", { value: localStorageMock });
    Object.defineProperty(global, "sessionStorage", { value: sessionStorageMock });
    localStorageMock.clear();
    sessionStorageMock.clear();
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe("isInCooldownPeriod", () => {
    it("returns false when no dismissal date is stored", () => {
      expect(isInCooldownPeriod()).toBe(false);
    });

    it("returns true when within 30-day cooldown", () => {
      const tenDaysAgo = new Date();
      tenDaysAgo.setDate(tenDaysAgo.getDate() - 10);
      localStorageMock.setItem(REVIEW_STORAGE_KEYS.DISMISSED_DATE, tenDaysAgo.toISOString());

      expect(isInCooldownPeriod()).toBe(true);
    });

    it("returns false when cooldown has expired", () => {
      const fortyDaysAgo = new Date();
      fortyDaysAgo.setDate(fortyDaysAgo.getDate() - 40);
      localStorageMock.setItem(REVIEW_STORAGE_KEYS.DISMISSED_DATE, fortyDaysAgo.toISOString());

      expect(isInCooldownPeriod()).toBe(false);
    });
  });

  describe("hasAlreadyReviewed", () => {
    it("returns false when not reviewed", () => {
      expect(hasAlreadyReviewed()).toBe(false);
    });

    it("returns true when reviewed", () => {
      localStorageMock.setItem(REVIEW_STORAGE_KEYS.HAS_REVIEWED, "true");
      expect(hasAlreadyReviewed()).toBe(true);
    });
  });

  describe("hasReachedAnnualLimit", () => {
    it("returns false when no limit reached", () => {
      expect(hasReachedAnnualLimit()).toBe(false);
    });

    it("returns true when limit reached this year", () => {
      const currentYear = new Date().getFullYear().toString();
      localStorageMock.setItem(REVIEW_STORAGE_KEYS.ANNUAL_LIMIT_YEAR, currentYear);
      expect(hasReachedAnnualLimit()).toBe(true);
    });

    it("returns false when limit was reached last year", () => {
      const lastYear = (new Date().getFullYear() - 1).toString();
      localStorageMock.setItem(REVIEW_STORAGE_KEYS.ANNUAL_LIMIT_YEAR, lastYear);
      expect(hasReachedAnnualLimit()).toBe(false);
    });
  });

  describe("hasShownForCharge / markChargeAsShown", () => {
    it("returns false for new charge", () => {
      expect(hasShownForCharge("charge_123")).toBe(false);
    });

    it("returns true after marking charge as shown", () => {
      markChargeAsShown("charge_123");
      expect(hasShownForCharge("charge_123")).toBe(true);
    });

    it("tracks multiple charges", () => {
      markChargeAsShown("charge_1");
      markChargeAsShown("charge_2");
      expect(hasShownForCharge("charge_1")).toBe(true);
      expect(hasShownForCharge("charge_2")).toBe(true);
      expect(hasShownForCharge("charge_3")).toBe(false);
    });
  });

  describe("recordReviewRequestDismissal", () => {
    it("stores current date in localStorage", () => {
      const before = Date.now();
      recordReviewRequestDismissal();
      const after = Date.now();

      const storedDate = new Date(
        localStorageMock.getItem(REVIEW_STORAGE_KEYS.DISMISSED_DATE) || ""
      ).getTime();

      expect(storedDate).toBeGreaterThanOrEqual(before);
      expect(storedDate).toBeLessThanOrEqual(after);
    });
  });

  describe("handleReviewResponseCode", () => {
    it("stores hasReviewed for already-reviewed code", () => {
      handleReviewResponseCode("already-reviewed");
      expect(localStorageMock.getItem(REVIEW_STORAGE_KEYS.HAS_REVIEWED)).toBe("true");
    });

    it("stores annual limit year for annual-limit-reached code", () => {
      handleReviewResponseCode("annual-limit-reached");
      expect(localStorageMock.getItem(REVIEW_STORAGE_KEYS.ANNUAL_LIMIT_YEAR)).toBe(
        new Date().getFullYear().toString()
      );
    });

    it("records dismissal for cooldown-period code", () => {
      handleReviewResponseCode("cooldown-period");
      expect(localStorageMock.getItem(REVIEW_STORAGE_KEYS.DISMISSED_DATE)).toBeTruthy();
    });
  });

  describe("canRequestReview", () => {
    it("returns true when all checks pass", () => {
      expect(canRequestReview()).toBe(true);
    });

    it("returns false when already reviewed", () => {
      localStorageMock.setItem(REVIEW_STORAGE_KEYS.HAS_REVIEWED, "true");
      expect(canRequestReview()).toBe(false);
    });

    it("returns false when annual limit reached", () => {
      localStorageMock.setItem(
        REVIEW_STORAGE_KEYS.ANNUAL_LIMIT_YEAR,
        new Date().getFullYear().toString()
      );
      expect(canRequestReview()).toBe(false);
    });

    it("returns false when in cooldown period", () => {
      const fiveDaysAgo = new Date();
      fiveDaysAgo.setDate(fiveDaysAgo.getDate() - 5);
      localStorageMock.setItem(REVIEW_STORAGE_KEYS.DISMISSED_DATE, fiveDaysAgo.toISOString());
      expect(canRequestReview()).toBe(false);
    });
  });

  describe("getCooldownDaysRemaining", () => {
    it("returns 0 when no dismissal date", () => {
      expect(getCooldownDaysRemaining()).toBe(0);
    });

    it("returns correct days remaining", () => {
      const tenDaysAgo = new Date();
      tenDaysAgo.setDate(tenDaysAgo.getDate() - 10);
      localStorageMock.setItem(REVIEW_STORAGE_KEYS.DISMISSED_DATE, tenDaysAgo.toISOString());

      const remaining = getCooldownDaysRemaining();
      expect(remaining).toBe(REVIEW_COOLDOWN_DAYS - 10); // 20 days
    });

    it("returns 0 when cooldown expired", () => {
      const fortyDaysAgo = new Date();
      fortyDaysAgo.setDate(fortyDaysAgo.getDate() - 40);
      localStorageMock.setItem(REVIEW_STORAGE_KEYS.DISMISSED_DATE, fortyDaysAgo.toISOString());

      expect(getCooldownDaysRemaining()).toBe(0);
    });
  });
});

