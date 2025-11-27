/**
 * FreeShippingPopup Component
 *
 * Free shipping progress bar featuring:
 * - 4 states: empty, progress, near-miss, unlocked
 * - Dynamic icons and messaging per state
 * - Progress bar with state-based styling
 * - Celebration animation when unlocked
 * - Top/bottom positioning
 * - Dismissible with close button
 */

import React, { useEffect, useState, useRef, useCallback, useMemo } from "react";
import type { PopupDesignConfig, DiscountConfig as StorefrontDiscountConfig } from "./types";
import type { FreeShippingContent } from "~/domains/campaigns/types/campaign";
import { debounce } from "./utils";
import { POPUP_SPACING } from "./spacing";

// Import custom hooks
import { usePopupAnimation, usePopupForm, useDiscountCode } from "./hooks";
import { buildScopedCss } from "~/domains/storefront/shared/css";

// Import shared components from Phase 1 & 2
import { LeadCaptureForm, PopupCloseButton } from "./components/shared";

// Import session for lazy token loading (only in storefront context)
let sessionModule: any = null;
if (typeof window !== "undefined") {
  try {
    // Dynamic import for storefront bundle
    sessionModule = (window as any).__RB_SESSION;
  } catch {
    // Fallback - will use window.__RB_SESSION_ID if available
  }
}

export type ShippingBarState = "empty" | "progress" | "near-miss" | "unlocked";

/**
 * FreeShippingConfig - Extends both design config AND campaign content type
 * All content fields come from FreeShippingContent
 * All design fields come from PopupDesignConfig
 */
export interface FreeShippingConfig extends PopupDesignConfig, FreeShippingContent {
  // Storefront-specific fields only
  currentCartTotal?: number;
  discount?: StorefrontDiscountConfig;
}

export interface FreeShippingPopupProps {
  config: FreeShippingConfig;
  isVisible: boolean;
  onClose: () => void;
  cartTotal?: number;
  onSubmit?: (data: { email: string }) => Promise<string | undefined>;
  issueDiscount?: (options?: {
    cartSubtotalCents?: number;
  }) => Promise<{ code?: string; behavior?: string } | null>;
}

export const FreeShippingPopup: React.FC<FreeShippingPopupProps> = ({
  config,
  isVisible,
  onClose,
  cartTotal: propCartTotal,
  onSubmit,
  issueDiscount,
}) => {
  const [cartTotal, setCartTotal] = useState<number>(propCartTotal ?? config.currentCartTotal ?? 0);
  const threshold = config.threshold;
  const barPosition = config.barPosition || "top"; // Use barPosition instead of position
  const nearMissThreshold = config.nearMissThreshold ?? 10;
  const currency = config.currency || "$";
  const dismissible = config.dismissible ?? true;
  const celebrateOnUnlock = config.celebrateOnUnlock ?? true;
  const showIcon = config.showIcon ?? true;
  const animationDuration = config.animationDuration ?? 500;
  const discount = config.discount as StorefrontDiscountConfig | undefined;
  const requireEmailToClaim = (config as any).requireEmailToClaim ?? false;
  const claimButtonLabel = (config as any).claimButtonLabel || "Claim discount";
  const claimEmailPlaceholder = (config as any).claimEmailPlaceholder || "Enter your email";
  const claimSuccessMessage = (config as any).claimSuccessMessage as string | undefined;
  const claimErrorMessage = (config as any).claimErrorMessage as string | undefined;

  // Use animation hook
  const { showContent, isAnimating } = usePopupAnimation({
    isVisible,
    entryDelay: 50,
    exitDelay: animationDuration,
  });

  // Use discount code hook
  const { discountCode, setDiscountCode, copiedCode, handleCopyCode } = useDiscountCode();

  // Use form hook for email claim
  const {
    formState,
    setEmail,
    errors,
    handleSubmit: _handleFormSubmit,
    isSubmitting: isClaiming,
    isSubmitted: hasClaimed,
  } = usePopupForm({
    config: {
      emailRequired: requireEmailToClaim,
      campaignId: config.campaignId,
      previewMode: config.previewMode,
    },
    onSubmit: onSubmit
      ? async (data) => {
          const result = await onSubmit({ email: data.email });
          return result;
        }
      : undefined,
  });

  // Component-specific state
  const [internalDismissed, setInternalDismissed] = useState(false);
  const [celebrating, setCelebrating] = useState(false);
  const [claimError, setClaimError] = useState<string | null>(null);
  const prevUnlockedRef = useRef(false);
  const hasIssuedDiscountRef = useRef(false);
  const currencyCodeRef = useRef<string | undefined>(undefined);
  const bannerRef = useRef<HTMLDivElement>(null);
  const _hasPlayedEntranceRef = useRef(false);

  const remaining = Math.max(0, threshold - cartTotal);
  const progress = Math.min(1, Math.max(0, cartTotal / threshold));

  const state: ShippingBarState =
    cartTotal === 0
      ? "empty"
      : remaining === 0
        ? "unlocked"
        : remaining <= nearMissThreshold
          ? "near-miss"
          : "progress";

  const barSize = config.size || "medium";

  const barPadding =
    barSize === "small" ? "0.75rem 1.25rem" : barSize === "large" ? "1rem 2rem" : "0.875rem 1.5rem";

  const messageFontSize =
    barSize === "small" ? "0.875rem" : barSize === "large" ? "1rem" : "0.9375rem";

  const iconFontSize =
    barSize === "small" ? "1.125rem" : barSize === "large" ? "1.375rem" : "1.25rem";

  // Handle close
  const handleClose = () => {
    if (!dismissible) return;
    setInternalDismissed(true);
    onClose();
  };

  const formatCurrency = (value: number) => {
    const code = currencyCodeRef.current;
    if (code && /^[A-Z]{3}$/.test(code)) {
      try {
        return new Intl.NumberFormat("en-US", { style: "currency", currency: code }).format(value);
      } catch {
        // Fallback below
      }
    }
    return `${currency}${value.toFixed(2)}`;
  };

  // NOTE: Challenge token validation removed - now handled server-side via bot detection

  // Animation is now handled by usePopupAnimation hook

  // Add body padding to prevent content overlap - animate together with bar
  useEffect(() => {
    if (!isVisible || internalDismissed || config.previewMode) return;

    // Add transition to body for smooth animation
    const originalTransition = document.body.style.transition;
    document.body.style.transition = "padding 0.3s ease-out";

    const updateBodyPadding = () => {
      if (!bannerRef.current) return;

      const height = bannerRef.current.offsetHeight;
      if (barPosition === "top") {
        document.body.style.paddingTop = `${height}px`;
      } else {
        document.body.style.paddingBottom = `${height}px`;
      }
    };

    // Update padding immediately (will animate due to transition)
    // Use requestAnimationFrame to ensure the element is rendered first
    requestAnimationFrame(() => {
      requestAnimationFrame(updateBodyPadding);
    });

    return () => {
      // Animate padding removal
      if (barPosition === "top") {
        document.body.style.paddingTop = "0px";
      } else {
        document.body.style.paddingBottom = "0px";
      }

      // Restore original transition after animation
      setTimeout(() => {
        document.body.style.transition = originalTransition;
        document.body.style.paddingTop = "";
        document.body.style.paddingBottom = "";
      }, 300);
    };
  }, [isVisible, internalDismissed, barPosition, config.previewMode]);

  // Read currency ISO from app embed if available
  useEffect(() => {
    try {
      const w: any = window as any;
      const iso = w?.REVENUE_BOOST_CONFIG?.currency;
      if (typeof iso === "string") {
        currencyCodeRef.current = iso;
      }
    } catch {
      // noop
    }
  }, []);

  // Live cart updates: refresh cart total after theme cart events or cart mutations
  useEffect(() => {
    if (!isVisible) return;

    const refresh = async () => {
      try {
        const res = await fetch("/cart.js", { credentials: "same-origin" });
        const cart = await res.json();
        const cents =
          typeof cart?.subtotal_price === "number"
            ? cart.subtotal_price
            : Number(cart?.items_subtotal_price || 0) - Number(cart?.total_discount || 0);
        const value = Number.isFinite(cents) ? Math.max(0, cents / 100) : 0;
        setCartTotal(value);
      } catch {
        // ignore network errors
      }
    };

    const debouncedRefresh = debounce(refresh, 300);
    const eventNames = [
      "cart:update",
      "cart:change",
      "cart:updated",
      "theme:cart:update",
      "cart:item-added",
      "cart:add",
    ];
    eventNames.forEach((name) => document.addEventListener(name, debouncedRefresh as any));

    // Always perform an initial sync from /cart.js so we include any existing cart items
    if (!(config as any)?.previewMode) {
      void refresh();
    }

    // Optional: intercept cart mutations via fetch (guard for double-wrapping)
    const w: any = window as any;
    let originalFetch: typeof window.fetch | null = null;
    if (!w.__RB_FETCH_INTERCEPTED) {
      try {
        originalFetch = window.fetch.bind(window);
        window.fetch = (async (...args: Parameters<typeof fetch>) => {
          const [url, opts] = args;
          const urlStr = typeof url === "string" ? url : url?.toString?.();
          const method = (opts as any)?.method ? String((opts as any).method).toUpperCase() : "GET";
          const isCartMutation = !!urlStr && urlStr.includes("/cart") && method !== "GET";
          const response = await (originalFetch as any)(...args);
          if (isCartMutation) debouncedRefresh();
          return response;
        }) as any;
        w.__RB_FETCH_INTERCEPTED = true;
      } catch {
        // ignore
      }
    }

    return () => {
      eventNames.forEach((name) => document.removeEventListener(name, debouncedRefresh as any));
      try {
        if (originalFetch) {
          window.fetch = originalFetch;
          w.__RB_FETCH_INTERCEPTED = false;
        }
      } catch (error) {
        console.error("[FreeShippingPopup] Failed to restore fetch:", error);
      }
    };
  }, [isVisible]);

  // In preview mode (admin), allow external control of cart total via prop or config
  useEffect(() => {
    if ((config as any)?.previewMode) {
      const next =
        typeof propCartTotal === "number"
          ? propCartTotal
          : typeof config.currentCartTotal === "number"
            ? config.currentCartTotal
            : undefined;
      if (typeof next === "number") setCartTotal(next);
    }
  }, [propCartTotal, config.currentCartTotal, config]);

  const getMessage = () => {
    const remainingFormatted = formatCurrency(remaining);

    switch (state) {
      case "empty":
        return config.emptyMessage || "Add items to unlock free shipping";
      case "unlocked":
        return config.unlockedMessage || "You've unlocked free shipping! 🎉";
      case "near-miss":
        return (config.nearMissMessage || "Only {remaining} to go!").replace(
          "{remaining}",
          remainingFormatted
        );
      case "progress":
      default:
        return (config.progressMessage || "You're {remaining} away from free shipping").replace(
          "{remaining}",
          remainingFormatted
        );
    }
  };

  const handleClaimSubmit = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();

    // For Free Shipping with email required, we need to:
    // 1. Issue the discount (consumes challenge token)
    // 2. Save the email with the discount code (no token needed)
    // This is different from other popups where we submit email first

    try {
      // Step 1: Issue discount with challenge token
      if (!issueDiscount) {
        setClaimError("Discount issuance not available");
        return;
      }

      const cartSubtotalCents = Math.round(cartTotal * 100);
      const result = await issueDiscount({ cartSubtotalCents });

      if (!result?.code) {
        setClaimError(claimErrorMessage || "Failed to issue discount");
        return;
      }

      setDiscountCode(result.code);

      // Step 2: Save email with the discount code (using save-email endpoint)
      if (formState.email && config.campaignId) {
        const { securePost } = await import("./utils/popup-api");
        await securePost("/apps/revenue-boost/api/leads/save-email", config.campaignId, {
          email: formState.email,
          discountCode: result.code,
        });
      }

      console.log("[FreeShippingPopup] Discount claim successful");
    } catch (error) {
      console.error("[FreeShippingPopup] Claim error:", error);
      setClaimError(claimErrorMessage || "Something went wrong. Please try again.");
    }
  };

  // Trigger celebration animation, logging, and discount issuance when unlocking
  useEffect(() => {
    const isUnlocked = state === "unlocked";
    const wasLocked = prevUnlockedRef.current === false;

    if (isUnlocked && wasLocked) {
      console.log("[FreeShippingPopup] Free shipping unlocked", {
        threshold,
        cartTotal,
        behavior: discount?.behavior,
      });

      if (discount?.behavior === "SHOW_CODE_AND_AUTO_APPLY") {
        console.log("[FreeShippingPopup] Auto-apply mode active for free shipping", {
          threshold,
          cartTotal,
        });
      }

      // For non-email-gated flows, issue a discount code when the bar first unlocks
      if (
        !requireEmailToClaim &&
        discount &&
        typeof issueDiscount === "function" &&
        !hasIssuedDiscountRef.current
      ) {
        console.log("[FreeShippingPopup] 🎟️ Threshold reached! Issuing discount...", {
          requireEmailToClaim,
          hasDiscount: !!discount,
          hasIssueDiscountFn: typeof issueDiscount === "function",
          alreadyIssued: hasIssuedDiscountRef.current,
          cartTotal,
          threshold,
          behavior: discount?.behavior,
        });

        hasIssuedDiscountRef.current = true;
        const cartSubtotalCents = Math.round(cartTotal * 100);

        (async () => {
          try {
            console.log(
              "[FreeShippingPopup] 🎟️ Calling issueDiscount with cartSubtotalCents:",
              cartSubtotalCents
            );
            const result = await issueDiscount({ cartSubtotalCents });
            console.log("[FreeShippingPopup] 🎟️ issueDiscount result:", result);

            if (result?.code) {
              setDiscountCode(result.code);
              console.log("[FreeShippingPopup] ✅ Discount code issued for free shipping", {
                code: result.code,
                behavior: result.behavior,
              });
            } else if (result && !result.code) {
              console.log(
                "[FreeShippingPopup] ℹ️ Discount issued without code (possible auto-apply only mode)",
                result
              );
            } else {
              console.warn("[FreeShippingPopup] ⚠️ No result from issueDiscount");
            }
          } catch (err) {
            console.error("[FreeShippingPopup] ❌ Failed to issue discount code:", err);
          }
        })();
      } else {
        console.log("[FreeShippingPopup] ℹ️ Discount issuance skipped", {
          requireEmailToClaim,
          hasDiscount: !!discount,
          hasIssueDiscountFn: typeof issueDiscount === "function",
          alreadyIssued: hasIssuedDiscountRef.current,
        });
      }
    }

    if (isUnlocked && wasLocked && celebrateOnUnlock) {
      setCelebrating(true);
      const timer = setTimeout(() => setCelebrating(false), 1000);
      return () => clearTimeout(timer);
    }

    prevUnlockedRef.current = isUnlocked;
  }, [
    state,
    celebrateOnUnlock,
    threshold,
    cartTotal,
    discount,
    issueDiscount,
    requireEmailToClaim,
  ]);

  // Get progress bar color based on state
  const getProgressColor = () => {
    if (state === "unlocked") return config.accentColor || "#10B981";
    if (state === "near-miss") return "#F59E0B"; // Warning color
    return config.accentColor || "#3B82F6"; // Primary color
  };

  // Get icon based on state
  const getIcon = () => {
    if (!showIcon) return null;
    switch (state) {
      case "unlocked":
        return "✓";
      case "near-miss":
        return "⚡";
      default:
        return "🚚";
    }
  };

  const scopedCss = useMemo(
    () =>
      buildScopedCss(
        config.globalCustomCSS,
        config.customCSS,
        "data-rb-banner",
        "free-shipping",
      ),
    [config.customCSS, config.globalCustomCSS],
  );

  // Don't render if not visible and not animating
  if ((!isVisible || internalDismissed) && !isAnimating) {
    return null;
  }

  return (
    <>
      <style>{`
        .free-shipping-bar {
          position: fixed;
          left: 0;
          right: 0;
          width: 100%;
          z-index: 9999;
          font-family: ${config.fontFamily || '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif'};
          box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
          container-type: inline-size;
          container-name: free-shipping;
        }

        /* Rotating celebratory border shown only while celebrating */
        @property --rb-border-angle {
          syntax: "<angle>";
          inherits: false;
          initial-value: 0deg;
        }

        .free-shipping-bar::before {
          content: "";
          position: absolute;
          inset: -2px;
          border-radius: inherit;
          border: 2px solid transparent;
          background:
            linear-gradient(${config.backgroundColor || "#ffffff"}, ${config.backgroundColor || "#ffffff"}) padding-box,
            conic-gradient(
              from var(--rb-border-angle),
              ${config.accentColor || "#3B82F6"},
              #22c55e,
              #facc15,
              ${config.accentColor || "#3B82F6"}
            ) border-box;
          opacity: 0;
          pointer-events: none;
        }

        .free-shipping-bar.celebrating::before {
          opacity: 1;
          animation: rotating-border 0.7s linear forwards;
        }

        @keyframes rotating-border {
          to {
            --rb-border-angle: 360deg;
            opacity: 0;
          }
        }


        .free-shipping-bar[data-position="top"] {
          top: 0;
        }

        .free-shipping-bar[data-position="bottom"] {
          bottom: 0;
        }

        /* Only animate slide-in on initial mount */
        .free-shipping-bar.entering[data-position="top"] {
          animation: slideInFromTop 0.3s ease-out forwards;
        }

        .free-shipping-bar.entering[data-position="bottom"] {
          animation: slideInFromBottom 0.3s ease-out forwards;
        }

        .free-shipping-bar.exiting[data-position="top"] {
          animation: slideOutToTop 0.3s ease-in forwards;
        }

        .free-shipping-bar.exiting[data-position="bottom"] {
          animation: slideOutToBottom 0.3s ease-in forwards;
        }

        @keyframes slideInFromTop {
          from {
            transform: translateY(-100%);
          }
          to {
            transform: translateY(0);
          }
        }

        @keyframes slideOutToTop {
          from {
            transform: translateY(0);
          }
          to {
            transform: translateY(-100%);
          }
        }

        @keyframes slideInFromBottom {
          from {
            transform: translateY(100%);
          }
          to {
            transform: translateY(0);
          }
        }

        @keyframes slideOutToBottom {
          from {
            transform: translateY(0);
          }
          to {
            transform: translateY(100%);
          }
        }

        .free-shipping-bar-content {
          display: flex;
          align-items: center;
          justify-content: center;
          gap: ${POPUP_SPACING.gap.md};
          padding: ${barPadding};
          position: relative;
          overflow: hidden;
        }

        .free-shipping-bar.celebrating {
          /* Start bounce shortly after the rotating border animation */
          animation: celebrate-bar 0.6s ease-in-out 0.35s;
        }

        @keyframes celebrate-bar {
          0% {
            transform: translateY(0) scale(1);
            box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
          }
          40% {
            transform: translateY(-3px) scale(1.02);
            box-shadow: 0 6px 18px rgba(16, 185, 129, 0.4);
          }
          100% {
            transform: translateY(0) scale(1);
            box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
          }
        }

        .free-shipping-bar-message {
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 0.75rem;
          z-index: 1;
        }

        .free-shipping-bar-main-content {
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 0.5rem;
          width: 100%;
          max-width: 800px;
          text-align: center;
        }

        .free-shipping-bar-icon {
          font-size: ${iconFontSize};
          line-height: 1;
          flex-shrink: 0;
        }

        .free-shipping-bar-text {
          font-size: ${messageFontSize};
          font-weight: 500;
          line-height: 1.4;
          margin: 0;
        }

        .free-shipping-bar-discount-text {
          font-size: 0.875rem;
          font-weight: 500;
          margin: 0.25rem 0 0;
        }

        .free-shipping-bar-discount-code {
          font-weight: 600;
        }

        .free-shipping-bar-claim-container {
          width: 100%;
          max-width: 500px;
        }

        .free-shipping-bar-claim-input {
          min-width: 160px;
          padding: 0.35rem 0.5rem;
          border-radius: 4px;
          border: 1px solid rgba(0, 0, 0, 0.15);
          font-size: 0.875rem;
        }

        .free-shipping-bar-claim-button {
          padding: ${POPUP_SPACING.component.buttonCompact};
          border-radius: 9999px;
          border: none;
          cursor: pointer;
          font-size: 0.875rem;
          font-weight: 700;
          text-transform: uppercase;
          letter-spacing: 0.05em;
        }

        .free-shipping-bar-claim-error {
          margin: 0.25rem 0 0;
          font-size: 0.75rem;
          color: #b91c1c;
        }

        .free-shipping-bar-close {
          position: absolute;
          top: 0.5rem;
          right: 0.5rem;
          background: transparent;
          border: none;
          cursor: pointer;
          padding: 0.25rem;
          display: none !important; /* Hidden on desktop/tablet - !important to override inline styles */
          align-items: center;
          justify-content: center;
          opacity: 0.6;
          transition: opacity 0.2s;
          z-index: 10;
          flex-shrink: 0;
        }

        .free-shipping-bar-close:hover {
          opacity: 1;
        }

        .free-shipping-bar-close:focus {
          outline: 2px solid currentColor;
          outline-offset: 2px;
          opacity: 1;
        }

        .free-shipping-bar-dismiss {
          position: absolute;
          top: 0.75rem;
          right: 2.5rem;
          padding: 0;
          border: none;
          background: transparent;
          color: inherit;
          cursor: pointer;
          text-decoration: underline;
          font-size: 0.8125rem;
          white-space: nowrap;
          opacity: 0.9;
          transition: opacity 0.15s ease-out;
          z-index: 10;
        }

        .free-shipping-bar-dismiss:hover {
          opacity: 1;
        }

        .free-shipping-bar-dismiss:focus {
          outline: 2px solid currentColor;
          outline-offset: 2px;
        }

        .free-shipping-bar-progress {
          position: absolute;
          left: 0;
          top: 0;
          bottom: 0;
          background: var(--shipping-bar-progress-bg);
          transition: width ${animationDuration}ms ease-out;
          z-index: 0;
          transform-origin: left center;
        }

        /* When unlocked, play a subtle progress "finish" animation before the bar bounces */
        .free-shipping-bar[data-state="unlocked"] .free-shipping-bar-progress {
          animation: ${celebrating ? "celebrate-progress 0.45s ease-out forwards" : "none"};
        }

        @keyframes celebrate-progress {
          0% {
            transform: scaleX(0.96);
            opacity: 0.18;
          }
          70% {
            transform: scaleX(1.03);
            opacity: 0.22;
          }
          100% {
            transform: scaleX(1);
            opacity: 0.2;
          }
        }

        @media (prefers-reduced-motion: reduce) {
          .free-shipping-bar,
          .free-shipping-bar-progress {
            transition: none;
          }

          .free-shipping-bar.celebrating,
          .free-shipping-bar.celebrating::before {
            animation: none !important;
            opacity: 0;
          }

          .free-shipping-bar.entering[data-position="top"],
          .free-shipping-bar.entering[data-position="bottom"],
          .free-shipping-bar.celebrating {
            animation: none !important;
          }

          .free-shipping-bar[data-state="unlocked"] .free-shipping-bar-progress {
            animation: none;
          }
        }

        /* Container query for preview/device-based responsiveness */
        @container free-shipping (max-width: 640px) {
          .free-shipping-bar-content {
            padding: 0.75rem 2.5rem 0.75rem 1rem;
            gap: 0.5rem;
          }

          .free-shipping-bar-main-content {
            gap: 0.5rem;
          }

          .free-shipping-bar-text {
            font-size: 0.875rem;
          }

          .free-shipping-bar-icon {
            font-size: 1.125rem;
          }

          /* Hide "No thanks" button on mobile - only show close X */
          .free-shipping-bar-dismiss {
            display: none;
          }

          /* Show close X button on mobile */
          .free-shipping-bar-close {
            display: flex !important; /* !important to override desktop display: none */
          }
        }
        }

      `}</style>
      {scopedCss ? <style dangerouslySetInnerHTML={{ __html: scopedCss }} /> : null}

      <div
        data-rb-banner
        ref={bannerRef}
        className={`free-shipping-bar ${!showContent ? "entering" : ""} ${isAnimating ? "animating" : ""} ${celebrating ? "celebrating" : ""}`}
        data-position={barPosition}
        data-state={state}
        role="region"
        aria-live="polite"
        aria-atomic="true"
        style={{
          position: (config as any)?.previewMode ? "absolute" : undefined,
          background: config.backgroundColor || "#ffffff",
          color: config.textColor || "#111827",
          ["--shipping-bar-progress-bg" as any]: getProgressColor(),
        }}
      >
        <div
          className="free-shipping-bar-progress"
          style={{
            width: `${progress * 100}%`,
            opacity: state === "empty" ? 0 : state === "unlocked" ? 0.2 : 0.15,
          }}
        />

        <div className="free-shipping-bar-content">
          <div className="free-shipping-bar-main-content">
            <div className="free-shipping-bar-message">
              {showIcon && (
                <span className="free-shipping-bar-icon" aria-hidden="true">
                  {getIcon()}
                </span>
              )}
              <p className="free-shipping-bar-text">{getMessage()}</p>
            </div>

            {/* Success message FIRST (when claimed) */}
            {state === "unlocked" && hasClaimed && claimSuccessMessage && (
              <p className="free-shipping-bar-discount-text">{claimSuccessMessage}</p>
            )}

            {/* Inline email form SECOND (when threshold reached and email required) */}
            {state === "unlocked" && requireEmailToClaim && !hasClaimed && (
              <div className="free-shipping-bar-claim-container">
                <LeadCaptureForm
                  data={formState}
                  errors={errors}
                  onEmailChange={setEmail}
                  onNameChange={() => {}}
                  onGdprChange={() => {}}
                  onSubmit={handleClaimSubmit}
                  isSubmitting={isClaiming}
                  showName={false}
                  showGdpr={false}
                  emailRequired={true}
                  placeholders={{
                    email: claimEmailPlaceholder,
                  }}
                  labels={{
                    submit: claimButtonLabel,
                  }}
                  accentColor={config.accentColor || config.buttonColor}
                  textColor={config.textColor}
                  backgroundColor={config.inputBackgroundColor}
                  buttonTextColor={config.buttonTextColor}
                  layout="inline"
                />
                {claimError && <p className="free-shipping-bar-claim-error">{claimError}</p>}
              </div>
            )}

            {/* Discount code display (when no email required OR already claimed) */}
            {state === "unlocked" &&
              discount &&
              (!requireEmailToClaim || hasClaimed) &&
              (discount.behavior === "SHOW_CODE_AND_AUTO_APPLY" && !discountCode && !discount.code ? (
                <p className="free-shipping-bar-discount-text">
                  Free shipping will be applied automatically at checkout.
                </p>
              ) : discountCode || discount.code ? (
                <span
                  className="free-shipping-bar-discount-text"
                  onClick={() => handleCopyCode()}
                  onKeyDown={(e) => { if (e.key === "Enter" || e.key === " ") handleCopyCode(); }}
                  role="button"
                  tabIndex={0}
                  style={{ cursor: "pointer" }}
                >
                  <>
                    Use code{" "}
                    <span className="free-shipping-bar-discount-code">
                      {discountCode || discount.code}
                    </span>{" "}
                    at checkout.
                    {copiedCode && (
                      <span style={{ marginLeft: "0.5rem", color: "#10B981" }}>✓ Copied!</span>
                    )}
                  </>
                </span>
              ) : null)}
          </div>

          {dismissible && (
            <button type="button" className="free-shipping-bar-dismiss" onClick={handleClose}>
              {config.dismissLabel || "No thanks"}
            </button>
          )}

          <PopupCloseButton
            onClose={handleClose}
            color={config.textColor || "#111827"}
            size={20}
            show={dismissible}
            className="free-shipping-bar-close"
            position="custom"
          />
        </div>
      </div>
    </>
  );
};
