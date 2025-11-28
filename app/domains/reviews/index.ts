/**
 * Reviews Domain - Public API
 *
 * Shopify App Bridge Reviews API integration for requesting app reviews
 * directly within the Shopify admin interface.
 *
 * @see https://shopify.dev/docs/api/app-bridge-library/reference/reviews
 */

// Types
export * from "./types";

// Hooks
export { useReviewRequest } from "./hooks/useReviewRequest";

// Components
export { AutoReviewTrigger } from "./components/AutoReviewTrigger";
export { PostBillingReviewTrigger } from "./components/PostBillingReviewTrigger";

// Utilities
export {
  canRequestReview,
  isInCooldownPeriod,
  hasAlreadyReviewed,
  hasReachedAnnualLimit,
  hasShownForCharge,
  markChargeAsShown,
  recordReviewRequestDismissal,
  handleReviewResponseCode,
  getCooldownDaysRemaining,
} from "./utils/reviewCooldownManager";

