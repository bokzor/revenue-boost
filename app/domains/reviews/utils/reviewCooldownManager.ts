/**
 * Review Cooldown Manager
 *
 * Utilities for managing review request cooldowns, rate limiting,
 * and state persistence in localStorage/sessionStorage.
 *
 * Follows Shopify's guidelines:
 * - 30-day cooldown after any interaction
 * - Annual limits (tracked by year)
 * - One review per merchant per app lifetime
 */

import {
  REVIEW_STORAGE_KEYS,
  REVIEW_COOLDOWN_DAYS,
  type ReviewRequestDeclinedCode,
} from "../types";

/**
 * Check if we're within the cooldown period (30 days since last request)
 */
export function isInCooldownPeriod(): boolean {
  if (typeof window === "undefined") return false;

  const lastDismissal = localStorage.getItem(REVIEW_STORAGE_KEYS.DISMISSED_DATE);
  if (!lastDismissal) return false;

  const daysSince = Math.floor(
    (Date.now() - new Date(lastDismissal).getTime()) / (1000 * 60 * 60 * 24)
  );

  return daysSince < REVIEW_COOLDOWN_DAYS;
}

/**
 * Check if the merchant has already reviewed the app
 */
export function hasAlreadyReviewed(): boolean {
  if (typeof window === "undefined") return false;
  return localStorage.getItem(REVIEW_STORAGE_KEYS.HAS_REVIEWED) === "true";
}

/**
 * Check if annual limit was reached this year
 */
export function hasReachedAnnualLimit(): boolean {
  if (typeof window === "undefined") return false;

  const limitYear = localStorage.getItem(REVIEW_STORAGE_KEYS.ANNUAL_LIMIT_YEAR);
  if (!limitYear) return false;

  return parseInt(limitYear, 10) === new Date().getFullYear();
}

/**
 * Check if a review was already shown for a specific charge ID (this session)
 */
export function hasShownForCharge(chargeId: string): boolean {
  if (typeof window === "undefined") return false;

  const shownCharges = JSON.parse(
    sessionStorage.getItem(REVIEW_STORAGE_KEYS.SHOWN_CHARGES) || "[]"
  ) as string[];

  return shownCharges.includes(chargeId);
}

/**
 * Mark a charge ID as having shown the review modal
 */
export function markChargeAsShown(chargeId: string): void {
  if (typeof window === "undefined") return;

  const shownCharges = JSON.parse(
    sessionStorage.getItem(REVIEW_STORAGE_KEYS.SHOWN_CHARGES) || "[]"
  ) as string[];

  if (!shownCharges.includes(chargeId)) {
    shownCharges.push(chargeId);
    sessionStorage.setItem(REVIEW_STORAGE_KEYS.SHOWN_CHARGES, JSON.stringify(shownCharges));
  }
}

/**
 * Record that a review request was made (for cooldown tracking)
 */
export function recordReviewRequestDismissal(): void {
  if (typeof window === "undefined") return;
  localStorage.setItem(REVIEW_STORAGE_KEYS.DISMISSED_DATE, new Date().toISOString());
}

/**
 * Handle review response codes by updating local storage appropriately
 */
export function handleReviewResponseCode(code: ReviewRequestDeclinedCode): void {
  if (typeof window === "undefined") return;

  switch (code) {
    case "already-reviewed":
      // Disable all review prompts permanently
      localStorage.setItem(REVIEW_STORAGE_KEYS.HAS_REVIEWED, "true");
      console.log("[Review] Merchant has already reviewed - disabling prompts");
      break;

    case "annual-limit-reached":
      // Disable until next year
      localStorage.setItem(
        REVIEW_STORAGE_KEYS.ANNUAL_LIMIT_YEAR,
        new Date().getFullYear().toString()
      );
      console.log("[Review] Annual limit reached - disabling until next year");
      break;

    case "cooldown-period":
      // Record the dismissal date (Shopify enforces this, but we track locally too)
      recordReviewRequestDismissal();
      console.log("[Review] In cooldown period");
      break;

    case "mobile-app":
      console.log("[Review] Mobile app - reviews not supported");
      break;

    case "merchant-ineligible":
      console.log("[Review] Merchant ineligible (may be dev store or staff account)");
      break;

    default:
      console.warn("[Review] Unknown response code:", code);
  }
}

/**
 * Check if we can attempt to request a review
 * Returns true if all local checks pass
 */
export function canRequestReview(): boolean {
  if (hasAlreadyReviewed()) {
    console.log("[Review] Skipping - merchant already reviewed");
    return false;
  }

  if (hasReachedAnnualLimit()) {
    console.log("[Review] Skipping - annual limit reached");
    return false;
  }

  if (isInCooldownPeriod()) {
    console.log("[Review] Skipping - in cooldown period");
    return false;
  }

  return true;
}

/**
 * Get days remaining in cooldown period (0 if not in cooldown)
 */
export function getCooldownDaysRemaining(): number {
  if (typeof window === "undefined") return 0;

  const lastDismissal = localStorage.getItem(REVIEW_STORAGE_KEYS.DISMISSED_DATE);
  if (!lastDismissal) return 0;

  const daysSince = Math.floor(
    (Date.now() - new Date(lastDismissal).getTime()) / (1000 * 60 * 60 * 24)
  );

  return Math.max(0, REVIEW_COOLDOWN_DAYS - daysSince);
}

