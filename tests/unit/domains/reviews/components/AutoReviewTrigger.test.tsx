/**
 * AutoReviewTrigger Component Unit Tests
 *
 * Tests the automatic review trigger logic and cooldown behavior.
 * Uses REAL cooldownManager to test actual integration.
 */

import React from "react";
import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import { render } from "@testing-library/react";
import { REVIEW_STORAGE_KEYS } from "~/domains/reviews/types";

// Mock useAppBridge - this is the ONLY mock needed (external dependency)
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

import { AutoReviewTrigger } from "~/domains/reviews/components/AutoReviewTrigger";

describe("AutoReviewTrigger", () => {
  let localStorageMock: ReturnType<typeof createStorageMock>;
  let sessionStorageMock: ReturnType<typeof createStorageMock>;

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
      <AutoReviewTrigger
        shouldTrigger={false}
        trigger="success-action"
        context="test"
      />
    );

    expect(container.firstChild).toBeNull();
  });

  it("does not trigger when shouldTrigger is false", async () => {
    render(
      <AutoReviewTrigger
        shouldTrigger={false}
        trigger="success-action"
        context="test"
      />
    );

    await vi.advanceTimersByTimeAsync(5000);

    expect(mockReviewRequest).not.toHaveBeenCalled();
  });

  it("triggers review request when shouldTrigger is true and no cooldown", async () => {
    mockReviewRequest.mockResolvedValue({ success: true });

    render(
      <AutoReviewTrigger
        shouldTrigger={true}
        trigger="success-action"
        context="campaign_created"
        delay={1000}
      />
    );

    await vi.advanceTimersByTimeAsync(1500);

    expect(mockReviewRequest).toHaveBeenCalledTimes(1);
  });

  it("respects custom delay", async () => {
    mockReviewRequest.mockResolvedValue({ success: true });

    render(
      <AutoReviewTrigger
        shouldTrigger={true}
        trigger="milestone"
        context="test"
        delay={3000}
      />
    );

    await vi.advanceTimersByTimeAsync(2000);
    expect(mockReviewRequest).not.toHaveBeenCalled();

    await vi.advanceTimersByTimeAsync(1500);
    expect(mockReviewRequest).toHaveBeenCalledTimes(1);
  });

  it("only triggers once even if props change (uses ref)", async () => {
    mockReviewRequest.mockResolvedValue({ success: true });

    const { rerender } = render(
      <AutoReviewTrigger
        shouldTrigger={true}
        trigger="success-action"
        context="test"
        delay={100}
      />
    );

    await vi.advanceTimersByTimeAsync(200);
    expect(mockReviewRequest).toHaveBeenCalledTimes(1);

    rerender(
      <AutoReviewTrigger
        shouldTrigger={true}
        trigger="success-action"
        context="test2"
        delay={100}
      />
    );

    await vi.advanceTimersByTimeAsync(200);
    expect(mockReviewRequest).toHaveBeenCalledTimes(1);
  });

  it("does not trigger when merchant has already reviewed (real cooldown logic)", async () => {
    // Set up real storage state - merchant already reviewed
    localStorageMock.setItem(REVIEW_STORAGE_KEYS.HAS_REVIEWED, "true");

    render(
      <AutoReviewTrigger
        shouldTrigger={true}
        trigger="success-action"
        context="test"
        delay={100}
      />
    );

    await vi.advanceTimersByTimeAsync(200);

    expect(mockReviewRequest).not.toHaveBeenCalled();
  });

  it("does not trigger when in cooldown period (real cooldown logic)", async () => {
    // Set up real storage state - dismissed 5 days ago (within 30-day cooldown)
    const fiveDaysAgo = new Date();
    fiveDaysAgo.setDate(fiveDaysAgo.getDate() - 5);
    localStorageMock.setItem(REVIEW_STORAGE_KEYS.DISMISSED_DATE, fiveDaysAgo.toISOString());

    render(
      <AutoReviewTrigger
        shouldTrigger={true}
        trigger="success-action"
        context="test"
        delay={100}
      />
    );

    await vi.advanceTimersByTimeAsync(200);

    expect(mockReviewRequest).not.toHaveBeenCalled();
  });

  it("stores dismissal date after successful request (real integration)", async () => {
    mockReviewRequest.mockResolvedValue({ success: true });

    render(
      <AutoReviewTrigger
        shouldTrigger={true}
        trigger="success-action"
        context="test"
        delay={100}
      />
    );

    await vi.advanceTimersByTimeAsync(200);

    // Verify the REAL cooldown manager stored the dismissal date
    expect(localStorageMock.setItem).toHaveBeenCalledWith(
      REVIEW_STORAGE_KEYS.DISMISSED_DATE,
      expect.any(String)
    );
  });
});

