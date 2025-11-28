/**
 * useReviewRequest Hook
 *
 * Custom hook for requesting app reviews via Shopify App Bridge Reviews API.
 * Handles the review request flow with proper state management, callbacks, and analytics.
 *
 * @example
 * const { requestReview, isRequesting } = useReviewRequest({
 *   onSuccess: () => console.log('Review modal shown!'),
 *   onDecline: (code) => console.log('Declined:', code),
 * });
 *
 * // Trigger after successful action
 * await requestReview({ trigger: 'milestone', context: 'campaign_created' });
 */

import { useAppBridge } from "@shopify/app-bridge-react";
import { useCallback, useState } from "react";
import type {
  ReviewRequestResponse,
  ReviewTiming,
  UseReviewRequestOptions,
  UseReviewRequestResult,
} from "../types";

export function useReviewRequest(
  options: UseReviewRequestOptions = {}
): UseReviewRequestResult {
  const shopify = useAppBridge();
  const [isRequesting, setIsRequesting] = useState(false);
  const [lastResult, setLastResult] = useState<ReviewRequestResponse | null>(null);

  const requestReview = useCallback(
    async (timing?: ReviewTiming): Promise<ReviewRequestResponse | null> => {
      // Prevent concurrent requests
      if (isRequesting) {
        console.log("[Review Request] Already requesting, skipping...");
        return null;
      }

      // Check if reviews API is available
      if (!shopify?.reviews?.request) {
        console.warn(
          "[Review Request] Reviews API not available. " +
            "This may be a UI Extension (not supported) or development environment."
        );
        return null;
      }

      setIsRequesting(true);
      const startTime = Date.now();

      try {
        // Log timing context
        console.log("[Review Request] Initiating:", {
          timing: timing?.trigger || "manual",
          context: timing?.context,
          timestamp: new Date().toISOString(),
        });

        const result = (await shopify.reviews.request()) as ReviewRequestResponse;
        setLastResult(result);

        // Track performance
        const duration = Date.now() - startTime;

        if (result.success) {
          console.log("[Review Request] Success! Modal shown in", duration, "ms");
          options.onSuccess?.();
          options.analytics?.("review_modal_shown", {
            timing: timing?.trigger,
            duration,
            ...timing?.metadata,
          });
        } else {
          console.log("[Review Request] Declined:", result.code, "-", result.message);
          options.onDecline?.(result.code, result.message);
          options.analytics?.("review_modal_declined", {
            code: result.code,
            timing: timing?.trigger,
            duration,
            ...timing?.metadata,
          });
        }

        return result;
      } catch (error) {
        console.error("[Review Request] Error:", error);
        options.analytics?.("review_request_error", {
          error: error instanceof Error ? error.message : "Unknown error",
          timing: timing?.trigger,
        });
        return null;
      } finally {
        setIsRequesting(false);
      }
    },
    [shopify, isRequesting, options]
  );

  return {
    requestReview,
    isRequesting,
    lastResult,
  };
}

