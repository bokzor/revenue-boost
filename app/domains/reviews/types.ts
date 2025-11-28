/**
 * Shopify App Bridge Reviews API Types
 *
 * TypeScript interfaces for the Reviews API responses and configurations.
 * Used to request app reviews directly within the Shopify admin interface.
 *
 * @see https://shopify.dev/docs/api/app-bridge-library/reference/reviews
 */

// ============================================================================
// Response Types
// ============================================================================

/**
 * Successful review request response
 */
export interface ReviewRequestSuccessResponse {
  success: true;
  code: "success";
  message: "Review modal shown successfully";
}

/**
 * Possible decline codes returned by the Reviews API
 */
export type ReviewRequestDeclinedCode =
  | "mobile-app" // On mobile Shopify app
  | "already-reviewed" // Merchant already left a review
  | "annual-limit-reached" // Too many requests this year
  | "cooldown-period" // Too soon since last request
  | "merchant-ineligible"; // Doesn't meet eligibility criteria (e.g., dev store)

/**
 * Declined review request response
 */
export interface ReviewRequestDeclinedResponse {
  success: false;
  code: ReviewRequestDeclinedCode;
  message: string;
}

/**
 * Union type for all possible review request responses
 */
export type ReviewRequestResponse =
  | ReviewRequestSuccessResponse
  | ReviewRequestDeclinedResponse;

// ============================================================================
// Timing & Trigger Types
// ============================================================================

/**
 * Types of triggers that can initiate a review request
 * - post-billing: After successful payment/subscription upgrade (highest conversion)
 * - milestone: After reaching usage milestones (e.g., 100 campaigns created)
 * - success-action: After completing key features successfully
 */
export type ReviewTriggerType = "post-billing" | "milestone" | "success-action";

/**
 * Configuration for when to request a review
 */
export interface ReviewTiming {
  /** Type of trigger that initiated the request */
  trigger: ReviewTriggerType;
  /** Additional context about what triggered the request */
  context?: string;
  /** Extra metadata for analytics */
  metadata?: Record<string, unknown>;
}

// ============================================================================
// Hook Types
// ============================================================================

/**
 * Options for the useReviewRequest hook
 */
export interface UseReviewRequestOptions {
  /** Callback when review modal is shown successfully */
  onSuccess?: () => void;
  /** Callback when review request is declined */
  onDecline?: (code: ReviewRequestDeclinedCode, message: string) => void;
  /** Analytics tracking function */
  analytics?: (event: string, data: Record<string, unknown>) => void;
}

/**
 * Return type for the useReviewRequest hook
 */
export interface UseReviewRequestResult {
  /** Function to request a review */
  requestReview: (timing?: ReviewTiming) => Promise<ReviewRequestResponse | null>;
  /** Whether a request is currently in progress */
  isRequesting: boolean;
  /** Last result from a review request */
  lastResult: ReviewRequestResponse | null;
}

// ============================================================================
// Component Props Types
// ============================================================================

/**
 * Props for the AutoReviewTrigger component
 */
export interface AutoReviewTriggerProps {
  /** Whether the trigger condition is met */
  shouldTrigger: boolean;
  /** Type of trigger */
  trigger: ReviewTriggerType;
  /** Context description for logging/analytics */
  context: string;
  /** Additional metadata */
  metadata?: Record<string, unknown>;
  /** Delay in milliseconds before triggering (default: 2000) */
  delay?: number;
}

/**
 * Props for the PostBillingReviewTrigger component
 */
export interface PostBillingReviewTriggerProps {
  /** Shopify charge ID from URL params */
  chargeId: string | null;
  /** Recent subscription upgrade info */
  recentUpgrade: {
    fromPlan: string;
    toPlan: string;
    createdAt: string;
  } | null;
}

// ============================================================================
// Storage Keys
// ============================================================================

/**
 * localStorage/sessionStorage keys used for review state management
 */
export const REVIEW_STORAGE_KEYS = {
  /** Date of last review request dismissal (localStorage) */
  DISMISSED_DATE: "reviewRequestDismissedDate",
  /** Whether merchant has already reviewed (localStorage) */
  HAS_REVIEWED: "hasReviewed",
  /** Year when annual limit was reached (localStorage) */
  ANNUAL_LIMIT_YEAR: "reviewAnnualLimitReached",
  /** Array of charge IDs already shown (sessionStorage) */
  SHOWN_CHARGES: "reviewShownCharges",
} as const;

/**
 * Cooldown period in days before showing another review request
 */
export const REVIEW_COOLDOWN_DAYS = 30;

