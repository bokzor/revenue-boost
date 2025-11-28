/**
 * useReviewRequest Hook Unit Tests
 *
 * Tests for the review request hook that interfaces with Shopify App Bridge.
 */

import { describe, it, expect, beforeEach, vi } from "vitest";
import { renderHook, act, waitFor } from "@testing-library/react";

// Mock useAppBridge
const mockReviewRequest = vi.fn();
vi.mock("@shopify/app-bridge-react", () => ({
  useAppBridge: () => ({
    reviews: {
      request: mockReviewRequest,
    },
  }),
}));

import { useReviewRequest } from "~/domains/reviews/hooks/useReviewRequest";
import type { ReviewRequestResponse } from "~/domains/reviews/types";

describe("useReviewRequest", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("initialization", () => {
    it("initializes with correct default state", () => {
      const { result } = renderHook(() => useReviewRequest());

      expect(result.current.isRequesting).toBe(false);
      expect(result.current.lastResult).toBeNull();
      expect(typeof result.current.requestReview).toBe("function");
    });
  });

  describe("requestReview", () => {
    it("calls shopify.reviews.request and returns success result", async () => {
      const successResponse: ReviewRequestResponse = {
        success: true,
        code: "success",
        message: "Review modal shown successfully",
      };
      mockReviewRequest.mockResolvedValue(successResponse);

      const onSuccess = vi.fn();
      const { result } = renderHook(() => useReviewRequest({ onSuccess }));

      let response: ReviewRequestResponse | null = null;
      await act(async () => {
        response = await result.current.requestReview({
          trigger: "post-billing",
          context: "test",
        });
      });

      expect(mockReviewRequest).toHaveBeenCalledTimes(1);
      expect(response).toEqual(successResponse);
      expect(result.current.lastResult).toEqual(successResponse);
      expect(onSuccess).toHaveBeenCalledTimes(1);
    });

    it("handles declined response correctly", async () => {
      const declinedResponse: ReviewRequestResponse = {
        success: false,
        code: "cooldown-period",
        message: "In cooldown period",
      };
      mockReviewRequest.mockResolvedValue(declinedResponse);

      const onDecline = vi.fn();
      const { result } = renderHook(() => useReviewRequest({ onDecline }));

      await act(async () => {
        await result.current.requestReview();
      });

      expect(onDecline).toHaveBeenCalledWith("cooldown-period", "In cooldown period");
      expect(result.current.lastResult).toEqual(declinedResponse);
    });

    it("prevents concurrent requests", async () => {
      mockReviewRequest.mockImplementation(
        () => new Promise((resolve) => setTimeout(() => resolve({ success: true }), 100))
      );

      const { result } = renderHook(() => useReviewRequest());

      // Start first request
      act(() => {
        result.current.requestReview();
      });

      // Try to start second request immediately
      let secondResult: ReviewRequestResponse | null = null;
      await act(async () => {
        secondResult = await result.current.requestReview();
      });

      // Second request should return null (blocked)
      expect(secondResult).toBeNull();
      // Only one actual API call should be made
      expect(mockReviewRequest).toHaveBeenCalledTimes(1);
    });

    it("tracks isRequesting state correctly", async () => {
      let resolveRequest: (value: ReviewRequestResponse) => void;
      mockReviewRequest.mockImplementation(
        () =>
          new Promise((resolve) => {
            resolveRequest = resolve;
          })
      );

      const { result } = renderHook(() => useReviewRequest());

      expect(result.current.isRequesting).toBe(false);

      // Start request
      act(() => {
        result.current.requestReview();
      });

      expect(result.current.isRequesting).toBe(true);

      // Resolve request
      await act(async () => {
        resolveRequest!({ success: true, code: "success", message: "Review modal shown successfully" });
      });

      await waitFor(() => {
        expect(result.current.isRequesting).toBe(false);
      });
    });

    it("calls analytics on success", async () => {
      mockReviewRequest.mockResolvedValue({
        success: true,
        code: "success",
        message: "Success",
      });

      const analytics = vi.fn();
      const { result } = renderHook(() => useReviewRequest({ analytics }));

      await act(async () => {
        await result.current.requestReview({
          trigger: "milestone",
          context: "test_context",
          metadata: { count: 100 },
        });
      });

      expect(analytics).toHaveBeenCalledWith(
        "review_modal_shown",
        expect.objectContaining({
          timing: "milestone",
          count: 100,
        })
      );
    });
  });
});

