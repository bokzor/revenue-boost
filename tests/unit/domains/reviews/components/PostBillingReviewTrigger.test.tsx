/**
 * PostBillingReviewTrigger Component Unit Tests
 *
 * Tests the post-billing review trigger logic.
 * Uses REAL cooldownManager to test actual integration.
 */

import React from "react";
import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import { render } from "@testing-library/react";
import { REVIEW_STORAGE_KEYS } from "~/domains/reviews/types";

// Mock useAppBridge - this is the ONLY mock needed (external Shopify dependency)
const mockReviewRequest = vi.fn();
vi.mock("@shopify/app-bridge-react", () => ({
  useAppBridge: () => ({
    reviews: {
      request: mockReviewRequest,
    },
  }),
}));

// Mock localStorage/sessionStorage (browser APIs not available in test)
const createStorageMock = () => {
  let store: Record<string, string> = {};
  return {
    getItem: vi.fn((key: string) => store[key] || null),
    setItem: vi.fn((key: string, value: string) => { store[key] = value; }),
    removeItem: vi.fn((key: string) => { delete store[key]; }),
    clear: vi.fn(() => { store = {}; }),
    get length() { return Object.keys(store).length; },
    key: vi.fn((i: number) => Object.keys(store)[i] || null),
  };
};

import { PostBillingReviewTrigger } from "~/domains/reviews/components/PostBillingReviewTrigger";

describe("PostBillingReviewTrigger", () => {
  let localStorageMock: ReturnType<typeof createStorageMock>;
  let sessionStorageMock: ReturnType<typeof createStorageMock>;

  const mockRecentUpgrade = {
    fromPlan: "FREE",
    toPlan: "GROWTH",
    createdAt: new Date().toISOString(),
  };

  beforeEach(() => {
    vi.clearAllMocks();
    vi.useFakeTimers();

    // Setup fresh storage mocks for each test
    localStorageMock = createStorageMock();
    sessionStorageMock = createStorageMock();
    Object.defineProperty(global, "localStorage", { value: localStorageMock, writable: true });
    Object.defineProperty(global, "sessionStorage", { value: sessionStorageMock, writable: true });
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it("renders nothing (no UI)", () => {
    const { container } = render(
      <PostBillingReviewTrigger chargeId={null} recentUpgrade={null} />
    );

    expect(container.firstChild).toBeNull();
  });

  it("does not trigger when chargeId is null", async () => {
    render(
      <PostBillingReviewTrigger chargeId={null} recentUpgrade={mockRecentUpgrade} />
    );

    await vi.advanceTimersByTimeAsync(3000);

    expect(mockReviewRequest).not.toHaveBeenCalled();
  });

  it("does not trigger when recentUpgrade is null", async () => {
    render(
      <PostBillingReviewTrigger chargeId="charge_123" recentUpgrade={null} />
    );

    await vi.advanceTimersByTimeAsync(3000);

    expect(mockReviewRequest).not.toHaveBeenCalled();
  });

  it("triggers review when both chargeId and recentUpgrade are present", async () => {
    mockReviewRequest.mockResolvedValue({ success: true });

    render(
      <PostBillingReviewTrigger
        chargeId="charge_123"
        recentUpgrade={mockRecentUpgrade}
      />
    );

    await vi.advanceTimersByTimeAsync(2500);

    expect(mockReviewRequest).toHaveBeenCalledTimes(1);
  });

  it("does not trigger when charge was already shown in session (real integration)", async () => {
    // Set up real storage - charge already shown this session
    sessionStorageMock.setItem(REVIEW_STORAGE_KEYS.SHOWN_CHARGES, JSON.stringify(["charge_123"]));

    render(
      <PostBillingReviewTrigger
        chargeId="charge_123"
        recentUpgrade={mockRecentUpgrade}
      />
    );

    await vi.advanceTimersByTimeAsync(3000);

    expect(mockReviewRequest).not.toHaveBeenCalled();
  });

  it("does not trigger when merchant already reviewed (real integration)", async () => {
    // Set up real storage - merchant already reviewed
    localStorageMock.setItem(REVIEW_STORAGE_KEYS.HAS_REVIEWED, "true");

    render(
      <PostBillingReviewTrigger
        chargeId="charge_456"
        recentUpgrade={mockRecentUpgrade}
      />
    );

    await vi.advanceTimersByTimeAsync(3000);

    expect(mockReviewRequest).not.toHaveBeenCalled();
  });

  it("does not trigger when in cooldown period (real integration)", async () => {
    // Set up real storage - dismissed 10 days ago
    const tenDaysAgo = new Date();
    tenDaysAgo.setDate(tenDaysAgo.getDate() - 10);
    localStorageMock.setItem(REVIEW_STORAGE_KEYS.DISMISSED_DATE, tenDaysAgo.toISOString());

    render(
      <PostBillingReviewTrigger
        chargeId="charge_789"
        recentUpgrade={mockRecentUpgrade}
      />
    );

    await vi.advanceTimersByTimeAsync(3000);

    expect(mockReviewRequest).not.toHaveBeenCalled();
  });

  it("marks charge as shown in sessionStorage after successful request", async () => {
    mockReviewRequest.mockResolvedValue({ success: true });

    render(
      <PostBillingReviewTrigger
        chargeId="charge_abc"
        recentUpgrade={mockRecentUpgrade}
      />
    );

    await vi.advanceTimersByTimeAsync(2500);

    // Verify the REAL cooldown manager stored the charge
    expect(sessionStorageMock.setItem).toHaveBeenCalledWith(
      REVIEW_STORAGE_KEYS.SHOWN_CHARGES,
      expect.stringContaining("charge_abc")
    );
  });

  it("records dismissal in localStorage after request", async () => {
    mockReviewRequest.mockResolvedValue({ success: true });

    render(
      <PostBillingReviewTrigger
        chargeId="charge_xyz"
        recentUpgrade={mockRecentUpgrade}
      />
    );

    await vi.advanceTimersByTimeAsync(2500);

    // Verify the REAL cooldown manager stored the dismissal date
    expect(localStorageMock.setItem).toHaveBeenCalledWith(
      REVIEW_STORAGE_KEYS.DISMISSED_DATE,
      expect.any(String)
    );
  });

  it("only triggers once even with multiple renders (uses ref)", async () => {
    mockReviewRequest.mockResolvedValue({ success: true });

    const { rerender } = render(
      <PostBillingReviewTrigger
        chargeId="charge_999"
        recentUpgrade={mockRecentUpgrade}
      />
    );

    await vi.advanceTimersByTimeAsync(2500);
    expect(mockReviewRequest).toHaveBeenCalledTimes(1);

    rerender(
      <PostBillingReviewTrigger
        chargeId="charge_999"
        recentUpgrade={mockRecentUpgrade}
      />
    );

    await vi.advanceTimersByTimeAsync(2500);
    expect(mockReviewRequest).toHaveBeenCalledTimes(1);
  });
});

