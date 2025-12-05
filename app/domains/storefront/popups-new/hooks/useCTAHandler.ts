/**
 * useCTAHandler Hook
 *
 * Shared hook for handling CTA (Call-to-Action) button logic across all popup components.
 * Supports:
 * - Two-step flow: Apply discount first, then execute action
 * - Cart actions: add_to_cart, add_to_cart_checkout
 * - Navigation: navigate_url, navigate_product, navigate_collection
 * - Secondary CTA: dismiss or navigate
 */

import { useState, useCallback } from "react";

// =============================================================================
// TYPES
// =============================================================================

export type CTAAction =
  | "navigate_url"
  | "navigate_product"
  | "navigate_collection"
  | "add_to_cart"
  | "add_to_cart_checkout";

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
  applyDiscountFirst?: boolean;
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
  issueDiscount?: (options?: { cartSubtotalCents?: number }) => Promise<{ code?: string } | null>;
  getCartSubtotalCents?: () => number | undefined;
  onCtaClick?: () => void;
  onClose: () => void;
  failureMessage?: string;
}

export interface UseCTAHandlerReturn {
  ctaLabel: string;
  secondaryCtaLabel: string;
  hasClaimedDiscount: boolean;
  isClaimingDiscount: boolean;
  discountCode: string | null;
  discountError: string | null;
  isCtaDisabled: boolean;
  handleCtaClick: () => Promise<void>;
  handleSecondaryCta: () => void;
  setDiscountCode: (code: string | null) => void;
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

export function useCTAHandler(options: UseCTAHandlerOptions): UseCTAHandlerReturn {
  const {
    cta, secondaryCta, buttonText, ctaUrl, ctaOpenInNewTab, dismissLabel,
    hasDiscount, isPreview = false, hasExpired = false, isSoldOut = false,
    issueDiscount, getCartSubtotalCents, onCtaClick, onClose, failureMessage,
  } = options;

  const [hasClaimedDiscount, setHasClaimedDiscount] = useState(false);
  const [isClaimingDiscount, setIsClaimingDiscount] = useState(false);
  const [discountCode, setDiscountCode] = useState<string | null>(null);
  const [discountError, setDiscountError] = useState<string | null>(null);

  const isDisabled = hasExpired || isSoldOut;

  const getCtaLabel = useCallback((): string => {
    const baseLabel = cta?.label || buttonText || "Shop Now";
    if (hasExpired || isSoldOut) return "Offer unavailable";
    if (isClaimingDiscount) return "Applying...";
    if (hasClaimedDiscount && cta?.action && cta.action !== "add_to_cart") return "Shop Now";
    return baseLabel;
  }, [cta, buttonText, hasExpired, isSoldOut, isClaimingDiscount, hasClaimedDiscount]);

  const getSecondaryCtaLabel = useCallback((): string => {
    return secondaryCta?.label || dismissLabel || "No thanks";
  }, [secondaryCta, dismissLabel]);

  const handleCtaClick = useCallback(async () => {
    const canClaimDiscount = hasDiscount && !hasClaimedDiscount && !hasExpired && !isSoldOut;
    const shouldApplyDiscountFirst = cta?.applyDiscountFirst !== false;

    // Step 1: Apply discount if configured and not yet claimed
    if (canClaimDiscount && shouldApplyDiscountFirst && issueDiscount) {
      setDiscountError(null);
      setIsClaimingDiscount(true);
      try {
        const cartSubtotalCents = getCartSubtotalCents?.();
        const result = await issueDiscount(cartSubtotalCents ? { cartSubtotalCents } : undefined);
        if (result?.code) setDiscountCode(result.code);
        setHasClaimedDiscount(true);
      } catch (error) {
        console.error("[useCTAHandler] Failed to claim discount:", error);
        setDiscountError(failureMessage || "Something went wrong. Please try again.");
      } finally {
        setIsClaimingDiscount(false);
      }
      return; // Wait for second click
    }

    if (isPreview) return;
    onCtaClick?.();

    // Step 2: Execute the CTA action
    try {
      if (cta) {
        const { action, variantId, quantity, openInNewTab } = cta;

        console.log("[useCTAHandler] Executing action:", { action, variantId, quantity });

        // Handle cart actions
        if (action === "add_to_cart" || action === "add_to_cart_checkout") {
          if (variantId) {
            await addToCart(variantId, quantity || 1);
            console.log("[useCTAHandler] Item added to cart successfully");
          } else {
            console.warn("[useCTAHandler] No variantId provided for cart action");
          }
        }

        // Handle navigation
        const url = buildDestinationUrl(cta);
        console.log("[useCTAHandler] Destination URL:", url);
        if (url) {
          navigateTo(url, openInNewTab || false);
        }
      } else if (ctaUrl) {
        console.log("[useCTAHandler] Using legacy ctaUrl:", ctaUrl);
        navigateTo(ctaUrl, ctaOpenInNewTab || false);
      }
    } catch (error) {
      console.error("[useCTAHandler] CTA action failed:", error);
    }
  }, [cta, ctaUrl, ctaOpenInNewTab, hasDiscount, hasClaimedDiscount, hasExpired, isSoldOut,
      isPreview, issueDiscount, getCartSubtotalCents, onCtaClick, failureMessage]);

  const handleSecondaryCta = useCallback(() => {
    if (secondaryCta?.action === "navigate_url" && secondaryCta.url) {
      navigateTo(secondaryCta.url);
    } else {
      onClose();
    }
  }, [secondaryCta, onClose]);

  return {
    ctaLabel: getCtaLabel(),
    secondaryCtaLabel: getSecondaryCtaLabel(),
    hasClaimedDiscount,
    isClaimingDiscount,
    discountCode,
    discountError,
    isCtaDisabled: isDisabled || isClaimingDiscount,
    handleCtaClick,
    handleSecondaryCta,
    setDiscountCode,
  };
}

export default useCTAHandler;
