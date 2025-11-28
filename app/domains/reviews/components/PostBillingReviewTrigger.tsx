/**
 * PostBillingReviewTrigger Component
 *
 * Automatically triggers a review request after a successful billing/subscription upgrade.
 * This is the highest-converting timing strategy (15-20% response rate).
 *
 * How it works:
 * 1. Detects charge_id in URL params (redirect from Shopify billing)
 * 2. Verifies a recent subscription upgrade occurred
 * 3. Triggers review modal after a short delay
 *
 * @example
 * // In your dashboard loader:
 * const chargeId = url.searchParams.get("charge_id");
 * const recentUpgrade = await getRecentUpgrade(session.shop);
 *
 * // In your component:
 * <PostBillingReviewTrigger
 *   chargeId={chargeId}
 *   recentUpgrade={recentUpgrade}
 * />
 */

import { useEffect, useRef } from "react";
import { useReviewRequest } from "../hooks/useReviewRequest";
import {
  canRequestReview,
  hasShownForCharge,
  markChargeAsShown,
  recordReviewRequestDismissal,
  handleReviewResponseCode,
} from "../utils/reviewCooldownManager";
import type { PostBillingReviewTriggerProps } from "../types";

export function PostBillingReviewTrigger({
  chargeId,
  recentUpgrade,
}: PostBillingReviewTriggerProps) {
  const { requestReview } = useReviewRequest({
    onDecline: (code) => {
      handleReviewResponseCode(code);
    },
  });
  const hasTriggered = useRef(false);

  useEffect(() => {
    // Must have both charge ID and recent upgrade
    if (!chargeId || !recentUpgrade || hasTriggered.current) {
      return;
    }

    // Check if we've already shown for this charge (session-based)
    if (hasShownForCharge(chargeId)) {
      console.log("[PostBillingReviewTrigger] Already shown for charge:", chargeId);
      return;
    }

    // Check local cooldown/eligibility
    if (!canRequestReview()) {
      console.log("[PostBillingReviewTrigger] Skipping - local checks failed");
      return;
    }

    const triggerReview = async () => {
      hasTriggered.current = true;

      // Wait for page to settle after billing redirect
      await new Promise((resolve) => setTimeout(resolve, 2000));

      console.log("[PostBillingReviewTrigger] Triggering review after subscription upgrade:", {
        fromPlan: recentUpgrade.fromPlan,
        toPlan: recentUpgrade.toPlan,
      });

      const result = await requestReview({
        trigger: "post-billing",
        context: "subscription_upgrade",
        metadata: {
          fromPlan: recentUpgrade.fromPlan,
          toPlan: recentUpgrade.toPlan,
          chargeId,
        },
      });

      // Track shown charge and record dismissal
      if (result) {
        markChargeAsShown(chargeId);
        recordReviewRequestDismissal();
      }
    };

    triggerReview();
  }, [chargeId, recentUpgrade, requestReview]);

  // No UI - this component only handles logic
  return null;
}

