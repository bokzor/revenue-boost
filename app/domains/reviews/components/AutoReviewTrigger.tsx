/**
 * AutoReviewTrigger Component
 *
 * Automatically triggers a review request after successful workflows.
 * This component renders nothing (no UI) - it only handles the trigger logic.
 *
 * Following Shopify's best practices:
 * - ✅ Uses automatic triggers after successful actions
 * - ❌ Does NOT use buttons or user-initiated triggers
 *
 * @example
 * <AutoReviewTrigger
 *   shouldTrigger={campaignCreated}
 *   trigger="success-action"
 *   context="campaign_creation"
 *   metadata={{ campaignId: '123' }}
 * />
 */

import { useEffect, useRef } from "react";
import { useReviewRequest } from "../hooks/useReviewRequest";
import {
  canRequestReview,
  recordReviewRequestDismissal,
  handleReviewResponseCode,
} from "../utils/reviewCooldownManager";
import type { AutoReviewTriggerProps } from "../types";

export function AutoReviewTrigger({
  shouldTrigger,
  trigger,
  context,
  metadata,
  delay = 2000,
}: AutoReviewTriggerProps) {
  const { requestReview } = useReviewRequest({
    onDecline: (code) => {
      handleReviewResponseCode(code);
    },
  });
  const hasTriggered = useRef(false);

  useEffect(() => {
    // Only trigger once and when condition is met
    if (!shouldTrigger || hasTriggered.current) {
      return;
    }

    // Check local cooldown/eligibility before making API call
    if (!canRequestReview()) {
      console.log("[AutoReviewTrigger] Skipping - local checks failed");
      return;
    }

    hasTriggered.current = true;

    const timer = setTimeout(async () => {
      console.log("[AutoReviewTrigger] Auto-triggering review request after successful workflow");

      const result = await requestReview({
        trigger,
        context,
        metadata,
      });

      // Record dismissal regardless of result to respect cooldown
      if (result) {
        recordReviewRequestDismissal();
      }
    }, delay);

    return () => clearTimeout(timer);
  }, [shouldTrigger, trigger, context, metadata, delay, requestReview]);

  // No UI - this component only handles logic
  return null;
}

