/**
 * useCTAHandler Hook
 *
 * Shared hook for handling CTA (Call-to-Action) button logic across all popup components.
 *
 * Single-click flow:
 * 1. Issue discount (if configured)
 * 2. Execute action (add to cart, navigate)
 * 3. Show success state with discount code
 * 4. Auto-close after configurable delay
 *
 * Supports:
 * - Cart actions: add_to_cart, add_to_cart_checkout
 * - Navigation: navigate_url, navigate_product, navigate_collection
 * - Secondary CTA: dismiss or navigate
 * - Success state with auto-close countdown
 */

import { useState, useCallback, useEffect, useRef, useMemo } from "react";

// =============================================================================
// TYPES
// =============================================================================

export type CTAAction =
  | "navigate_url"
  | "navigate_product"
  | "navigate_collection"
  | "add_to_cart"
  | "add_to_cart_checkout";

/** Configuration for what happens after action completes */
export interface SuccessBehavior {
  /** Show the discount code in success state */
  showDiscountCode?: boolean;
  /** Seconds before auto-close (0 = no auto-close, default: 5) */
  autoCloseDelay?: number;
  /** Optional secondary action in success state */
  secondaryAction?: {
    label: string;
    url: string;
  };
}

export interface CTAConfig {
  label: string;
  action: CTAAction;
  variant?: "primary" | "secondary" | "link";
  url?: string;
  productId?: string;
  productHandle?: string;
  collectionId?: string;
  collectionHandle?: string;
  variantId?: string;
  quantity?: number;
  openInNewTab?: boolean;
  /** @deprecated Use successBehavior instead */
  applyDiscountFirst?: boolean;
  /** Configuration for success state after action completes */
  successBehavior?: SuccessBehavior;
}

export interface SecondaryCTAConfig {
  label: string;
  action: "dismiss" | "navigate_url";
  url?: string;
}

export interface UseCTAHandlerOptions {
  cta?: CTAConfig;
  secondaryCta?: SecondaryCTAConfig;
  buttonText?: string;
  ctaUrl?: string;
  ctaOpenInNewTab?: boolean;
  dismissLabel?: string;
  hasDiscount: boolean;
  isPreview?: boolean;
  hasExpired?: boolean;
  isSoldOut?: boolean;
  issueDiscount?: (options?: { cartSubtotalCents?: number }) => Promise<{ code?: string; behavior?: string } | null>;
  getCartSubtotalCents?: () => number | undefined;
  onCtaClick?: () => void;
  onClose: () => void;
  failureMessage?: string;
  /** Default success message if not specified in CTA config */
  defaultSuccessMessage?: string;
  /** Default auto-close delay if not specified in CTA config (default: 5) */
  defaultAutoCloseDelay?: number;
}

export interface UseCTAHandlerReturn {
  /** Current label for the CTA button */
  ctaLabel: string;
  /** Label for secondary CTA */
  secondaryCtaLabel: string;
  /** Whether the action has completed successfully */
  actionCompleted: boolean;
  /** Whether the action is currently in progress */
  isProcessing: boolean;
  /** Discount code (if issued) */
  discountCode: string | null;
  /** Error message if action failed */
  actionError: string | null;
  /** Whether CTA button should be disabled */
  isCtaDisabled: boolean;
  /** Seconds remaining before auto-close (null if not auto-closing) */
  autoCloseCountdown: number | null;
  /** Success message to display */
  successMessage: string | null;
  /** Success behavior config for UI rendering */
  successBehavior: SuccessBehavior | null;
  /** Handle primary CTA click */
  handleCtaClick: () => Promise<void>;
  /** Handle secondary CTA click */
  handleSecondaryCta: () => void;
  /** Manually set discount code (for external sources) */
  setDiscountCode: (code: string | null) => void;
  /** Cancel auto-close (user interaction) */
  cancelAutoClose: () => void;
  /** Pending navigation URL (when discount is shown before navigation) */
  pendingNavigationUrl: string | null;

  // Legacy compatibility (deprecated)
  /** @deprecated Use actionCompleted instead */
  hasClaimedDiscount: boolean;
  /** @deprecated Use isProcessing instead */
  isClaimingDiscount: boolean;
  /** @deprecated Use actionError instead */
  discountError: string | null;
}

// =============================================================================
// HELPERS
// =============================================================================

async function addToCart(variantId: string, quantity: number = 1): Promise<void> {
  // Extract numeric ID from GID (e.g., "gid://shopify/ProductVariant/123" -> "123")
  const numericId = variantId.includes("/") ? variantId.split("/").pop() : variantId;

  console.log("[useCTAHandler] Adding to cart:", { variantId, numericId, quantity });

  const response = await fetch("/cart/add.js", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ items: [{ id: numericId, quantity }] }),
  });

  if (!response.ok) {
    const errorText = await response.text();
    console.error("[useCTAHandler] Add to cart failed:", response.status, errorText);
    throw new Error(`Failed to add item to cart: ${response.status}`);
  }

  const result = await response.json();
  console.log("[useCTAHandler] Add to cart success:", result);
}

function navigateTo(url: string, openInNewTab: boolean = false): void {
  if (openInNewTab) {
    window.open(url, "_blank", "noopener,noreferrer");
  } else {
    window.location.href = url;
  }
}

function buildDestinationUrl(cta: CTAConfig): string | null {
  switch (cta.action) {
    case "navigate_url":
      return cta.url || null;
    case "navigate_product":
      // Use handle, fallback to "all" if not set
      return `/products/${cta.productHandle || "all"}`;
    case "navigate_collection":
      // Use handle, fallback to "all" if not set
      return `/collections/${cta.collectionHandle || "all"}`;
    case "add_to_cart_checkout":
      return "/checkout";
    default:
      return null;
  }
}

// =============================================================================
// HOOK
// =============================================================================

const DEFAULT_AUTO_CLOSE_DELAY = 5;

export function useCTAHandler(options: UseCTAHandlerOptions): UseCTAHandlerReturn {
  const {
    cta,
    secondaryCta,
    buttonText,
    ctaUrl,
    ctaOpenInNewTab,
    dismissLabel,
    hasDiscount,
    isPreview = false,
    hasExpired = false,
    isSoldOut = false,
    issueDiscount,
    getCartSubtotalCents,
    onCtaClick,
    onClose,
    failureMessage,
    defaultSuccessMessage,
    defaultAutoCloseDelay = DEFAULT_AUTO_CLOSE_DELAY,
  } = options;

  // Core state
  const [actionCompleted, setActionCompleted] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [discountCode, setDiscountCode] = useState<string | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);
  const [autoCloseCountdown, setAutoCloseCountdown] = useState<number | null>(null);
  // Pending navigation (used when showing discount before navigating)
  const [pendingNavigationUrl, setPendingNavigationUrl] = useState<string | null>(null);
  const [pendingNavigationNewTab, setPendingNavigationNewTab] = useState(false);

  // Refs for cleanup
  const autoCloseTimerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const countdownRef = useRef<number | null>(null);

  const isDisabled = hasExpired || isSoldOut;

  // Resolve success behavior from CTA config or defaults
  const successBehaviorConfig = cta?.successBehavior;
  const hasExplicitSuccessBehavior = !!successBehaviorConfig;
  const resolvedSuccessBehavior: SuccessBehavior | null = useMemo(() => {
    if (!actionCompleted || !(hasExplicitSuccessBehavior || (hasDiscount && !!discountCode))) {
      return null;
    }

    return {
      showDiscountCode: successBehaviorConfig?.showDiscountCode ?? (hasDiscount && !!discountCode),
      // Only enable auto-close when successBehavior is explicitly configured
      autoCloseDelay: hasExplicitSuccessBehavior
        ? successBehaviorConfig?.autoCloseDelay ?? defaultAutoCloseDelay
        : undefined,
      secondaryAction: successBehaviorConfig?.secondaryAction,
    };
  }, [
    actionCompleted,
    hasExplicitSuccessBehavior,
    hasDiscount,
    discountCode,
    successBehaviorConfig,
    defaultAutoCloseDelay,
  ]);

  // Success message comes from options (contentConfig.successMessage) or defaults
  const resolvedSuccessMessage = actionCompleted
    ? defaultSuccessMessage || getDefaultSuccessMessage(cta?.action)
    : null;

  // Cleanup auto-close timer on unmount
  useEffect(() => {
    return () => {
      if (autoCloseTimerRef.current) {
        clearInterval(autoCloseTimerRef.current);
      }
    };
  }, []);

  // Start auto-close countdown when action completes
  useEffect(() => {
    if (
      !actionCompleted ||
      isPreview ||
      !resolvedSuccessBehavior ||
      resolvedSuccessBehavior.autoCloseDelay === undefined
    ) {
      return;
    }

    const delay = resolvedSuccessBehavior.autoCloseDelay;
    if (delay <= 0) {
      // No delay - if there's a pending navigation, execute it immediately
      if (pendingNavigationUrl) {
        navigateTo(pendingNavigationUrl, pendingNavigationNewTab);
      }
      return;
    }

    // Set initial countdown
    countdownRef.current = delay;
    setAutoCloseCountdown(delay);

    // Start countdown timer
    autoCloseTimerRef.current = setInterval(() => {
      if (countdownRef.current === null) return;

      countdownRef.current -= 1;
      setAutoCloseCountdown(countdownRef.current);

      if (countdownRef.current <= 0) {
        if (autoCloseTimerRef.current) {
          clearInterval(autoCloseTimerRef.current);
        }
        // If there's a pending navigation, navigate instead of just closing
        if (pendingNavigationUrl) {
          navigateTo(pendingNavigationUrl, pendingNavigationNewTab);
        } else {
          onClose();
        }
      }
    }, 1000);

    return () => {
      if (autoCloseTimerRef.current) {
        clearInterval(autoCloseTimerRef.current);
      }
    };
  }, [actionCompleted, isPreview, resolvedSuccessBehavior, defaultAutoCloseDelay, onClose, pendingNavigationUrl, pendingNavigationNewTab]);

  const cancelAutoClose = useCallback(() => {
    if (autoCloseTimerRef.current) {
      clearInterval(autoCloseTimerRef.current);
      autoCloseTimerRef.current = null;
    }
    countdownRef.current = null;
    setAutoCloseCountdown(null);
  }, []);

  const getCtaLabel = useCallback((): string => {
    const baseLabel = cta?.label || buttonText || "Shop Now";
    if (hasExpired || isSoldOut) return "Offer unavailable";
    if (isProcessing) return "Processing...";
    return baseLabel;
  }, [cta, buttonText, hasExpired, isSoldOut, isProcessing]);

  const getSecondaryCtaLabel = useCallback((): string => {
    return secondaryCta?.label || dismissLabel || "No thanks";
  }, [secondaryCta, dismissLabel]);

  const handleCtaClick = useCallback(async () => {
    // Don't allow multiple clicks or clicks when disabled
    if (isProcessing || actionCompleted || isDisabled) return;

    setIsProcessing(true);
    setActionError(null);

    // Track issued discount code locally (state isn't immediately available after setDiscountCode)
    let issuedDiscountCode: string | null = null;

    try {
      // In preview mode, just show success state without executing actions
      if (isPreview) {
        if (hasDiscount) {
          console.log("[useCTAHandler] Preview mode: Using mock discount code");
          issuedDiscountCode = "PREVIEW20";
          setDiscountCode("PREVIEW20");
        }
        onCtaClick?.();
        setActionCompleted(true);
        setIsProcessing(false);
        return;
      }

      // Step 1: Execute the CTA action FIRST (important for free gift discounts!)
      // The product must be in the cart before applying a product-scoped discount
      if (cta) {
        const { action, variantId, quantity } = cta;
        console.log("[useCTAHandler] Executing action:", { action, variantId, quantity });

        // Handle cart actions BEFORE issuing discount
        // This ensures the product is in cart when a product-scoped discount is applied
        if (action === "add_to_cart" || action === "add_to_cart_checkout") {
          if (variantId) {
            await addToCart(variantId, quantity || 1);
            console.log("[useCTAHandler] Item added to cart successfully");
          } else {
            console.warn("[useCTAHandler] No variantId provided for cart action");
          }
        }
      }

      // Step 2: Issue discount AFTER adding to cart
      // This is critical for free gift discounts - the 100% off discount only applies
      // to the free gift product, so it must be in the cart first
      if (hasDiscount && !hasExpired && !isSoldOut) {
        if (issueDiscount) {
          console.log("[useCTAHandler] Issuing discount (after cart update)...");
          const cartSubtotalCents = getCartSubtotalCents?.();
          const result = await issueDiscount(cartSubtotalCents ? { cartSubtotalCents } : undefined);
          if (result?.code) {
            console.log("[useCTAHandler] Discount issued:", result.code);
            issuedDiscountCode = result.code;
            setDiscountCode(result.code);
          }
        }
      }

      // Step 3: Handle navigation (for non-cart actions or add_to_cart_checkout)
      if (cta) {
        const { action, openInNewTab } = cta;

        // Handle navigation (for non-cart actions or add_to_cart_checkout)
        const url = buildDestinationUrl(cta);
        if (url && action !== "add_to_cart") {
          // If a discount was issued, show success state with the code first
          // The user can then navigate via secondary action or wait for auto-redirect
          if (issuedDiscountCode) {
            console.log("[useCTAHandler] Discount issued - showing success state before navigation");
            // Store the pending navigation URL so secondary action can use it
            setPendingNavigationUrl(url);
            setPendingNavigationNewTab(openInNewTab || false);
            // Show success state - navigation will happen via secondary action or auto-redirect
          } else {
            // No discount to show - navigate immediately
            console.log("[useCTAHandler] Navigating to:", url);
            onCtaClick?.();
            setActionCompleted(true);
            navigateTo(url, openInNewTab || false);
            return;
          }
        }
      } else if (ctaUrl) {
        // Legacy: direct URL navigation
        if (issuedDiscountCode) {
          console.log("[useCTAHandler] Discount issued - showing success state before legacy navigation");
          setPendingNavigationUrl(ctaUrl);
          setPendingNavigationNewTab(ctaOpenInNewTab || false);
        } else {
          console.log("[useCTAHandler] Using legacy ctaUrl:", ctaUrl);
          onCtaClick?.();
          setActionCompleted(true);
          navigateTo(ctaUrl, ctaOpenInNewTab || false);
          return;
        }
      }

      // Notify parent
      onCtaClick?.();

      // Step 4: Show success state (for add_to_cart or no-navigation actions)
      setActionCompleted(true);
    } catch (error) {
      console.error("[useCTAHandler] CTA action failed:", error);
      setActionError(failureMessage || "Something went wrong. Please try again.");
    } finally {
      setIsProcessing(false);
    }
  }, [
    cta,
    ctaUrl,
    ctaOpenInNewTab,
    hasDiscount,
    hasExpired,
    isSoldOut,
    isPreview,
    isProcessing,
    actionCompleted,
    isDisabled,
    issueDiscount,
    getCartSubtotalCents,
    onCtaClick,
    failureMessage,
  ]);

  // Handle secondary CTA or "Continue" action when there's a pending navigation
  const handleSecondaryCta = useCallback(() => {
    // If there's a pending navigation (from showing discount before navigate), go there
    if (pendingNavigationUrl) {
      navigateTo(pendingNavigationUrl, pendingNavigationNewTab);
      return;
    }
    // Otherwise, use configured secondary CTA or just close
    if (secondaryCta?.action === "navigate_url" && secondaryCta.url) {
      navigateTo(secondaryCta.url);
    } else {
      onClose();
    }
  }, [secondaryCta, onClose, pendingNavigationUrl, pendingNavigationNewTab]);

  return {
    // New API
    ctaLabel: getCtaLabel(),
    secondaryCtaLabel: getSecondaryCtaLabel(),
    actionCompleted,
    isProcessing,
    discountCode,
    actionError,
    isCtaDisabled: isDisabled || isProcessing,
    autoCloseCountdown,
    successMessage: resolvedSuccessMessage,
    successBehavior: resolvedSuccessBehavior,
    handleCtaClick,
    handleSecondaryCta,
    setDiscountCode,
    cancelAutoClose,
    // Pending navigation URL (when discount is shown before navigation)
    pendingNavigationUrl,

    // Legacy compatibility (deprecated)
    hasClaimedDiscount: actionCompleted,
    isClaimingDiscount: isProcessing,
    discountError: actionError,
  };
}

// Helper to get default success message based on action type
function getDefaultSuccessMessage(action?: CTAAction): string {
  switch (action) {
    case "add_to_cart":
      return "Added to cart!";
    case "add_to_cart_checkout":
      return "Added to cart!";
    default:
      return "Success!";
  }
}

export default useCTAHandler;
