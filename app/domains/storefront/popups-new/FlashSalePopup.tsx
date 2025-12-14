/**
 * FlashSalePopup Component v2
 *
 * A high-converting flash sale popup with:
 * - Mobile-first responsive design (60%+ traffic is mobile)
 * - Clean, focused layout with prominent countdown timer
 * - Large, bold timer digits for maximum visibility
 * - Touch-friendly CTA buttons (48px+ tap targets)
 * - Multiple display modes: modal (default) and banner
 * - Real-time inventory tracking
 * - Discount code display with copy functionality
 * - Container queries for preview/device-based responsiveness
 * - Fully responsive with container-relative units (no vh/vw)
 */

import React, { useState, useEffect } from "react";
import type { PopupDesignConfig, DiscountConfig as StorefrontDiscountConfig } from "./types";
import type { FlashSaleContent } from "~/domains/campaigns/types/campaign";
import { PopupPortal } from "./PopupPortal";
import { BannerPortal } from "./BannerPortal";

import {
  getContainerPadding,
  POPUP_SPACING,
} from "./utils/spacing";

// Import custom hooks
import { useCountdownTimer, useDiscountCode, useCTAHandler } from "./hooks";

// Import shared components
import { DiscountCodeDisplay, PopupCloseButton, TimerDisplay, PromotionDisplay, SuccessState } from "./components/shared";

/**
 * FlashSale-specific configuration
 * Background image settings (imageUrl, imagePosition, backgroundImageMode, backgroundOverlayOpacity)
 * come from PopupDesignConfig
 */
// Discount tier type
interface DiscountTier {
  thresholdCents: number;
  discount: { kind: string; value: number };
}

// Advanced discount config type
interface AdvancedDiscountConfig {
  enabled?: boolean;
  tiers?: DiscountTier[];
  bogo?: {
    buy: { quantity: number };
    get: { quantity: number; discount: { kind: string; value: number } };
  };
  freeGift?: {
    enabled?: boolean;
    productId?: string;
    variantId?: string;
    productTitle?: string;
    productImageUrl?: string;
    quantity?: number;
    minSubtotalCents?: number;
  };
}

export interface FlashSaleConfig extends PopupDesignConfig, FlashSaleContent {
  // Storefront-specific fields
  ctaOpenInNewTab?: boolean;
  discountConfig?: AdvancedDiscountConfig; // Legacy/advanced config (tiers, BOGO, free gift)
  discount?: StorefrontDiscountConfig; // Normalized storefront discount summary
  currentCartTotal?: number; // Injected by storefront runtime
  // Note: cta and secondaryCta are inherited from FlashSaleContent
}

export interface FlashSalePopupProps {
  config: FlashSaleConfig;
  isVisible: boolean;
  onClose: () => void;
  onExpiry?: () => void;
  onCtaClick?: () => void;
  issueDiscount?: (options?: {
    cartSubtotalCents?: number;
  }) => Promise<{ code?: string; behavior?: string } | null>;
}

export const FlashSalePopup: React.FC<FlashSalePopupProps> = ({
  config,
  isVisible,
  onClose,
  onExpiry,
  onCtaClick,
  issueDiscount,
}) => {
  // Respect both showCountdown and presentation.showTimer flags
  // showCountdown = top-level toggle, presentation.showTimer = presentation toggle
  const shouldShowTimer =
    config.showCountdown !== false && config.presentation?.showTimer !== false;

  // Use countdown timer hook
  const timerMode = config.timer?.mode || "duration";
  // Map 'stock_limited' to 'duration' for the hook (stock_limited is handled separately)
  const hookTimerMode = timerMode === "stock_limited" ? "duration" : timerMode;
  const { timeRemaining, hasExpired } = useCountdownTimer({
    enabled: shouldShowTimer,
    mode: hookTimerMode,
    duration: config.countdownDuration,
    endTime: config.timer?.endTimeISO || config.endTime,
    personalWindowSeconds: config.timer?.personalWindowSeconds,
    onExpire: () => {
      if (onExpiry) onExpiry();
      if (config.timer?.onExpire === "auto_hide" || config.hideOnExpiry) {
        onClose();
      }
    },
    autoHide: config.timer?.onExpire === "auto_hide" || config.hideOnExpiry,
    autoHideDelay: 1000,
  });

  // Use discount code hook for copy functionality (discountCode comes from useCTAHandler)
  const { copiedCode, handleCopyCode } = useDiscountCode();

  // Component-specific state
  const [inventoryTotal, setInventoryTotal] = useState<number | null>(null);

  // eslint-disable-next-line @typescript-eslint/no-explicit-any -- config has dynamic fields
  const configRecord = config as any;

  // Fetch inventory if configured
  useEffect(() => {
    // In preview mode, avoid real API calls and rely on pseudo config only
    if (configRecord.previewMode) {
      if (!config.inventory || config.inventory.mode === "pseudo") {
        if (config.inventory?.pseudoMax) {
          setInventoryTotal(config.inventory.pseudoMax);
        }
      }
      return;
    }

    if (!config.inventory || config.inventory.mode === "pseudo") {
      // Use pseudo inventory
      if (config.inventory?.pseudoMax) {
        setInventoryTotal(config.inventory.pseudoMax);
      }
      return;
    }

    // Fetch real inventory from API via app proxy
    const fetchInventory = async () => {
      try {
        const params = new URLSearchParams();
        if (config.inventory?.productIds?.length) {
          params.set("productIds", JSON.stringify(config.inventory.productIds));
        }
        if (config.inventory?.variantIds?.length) {
          params.set("variantIds", JSON.stringify(config.inventory.variantIds));
        }
        if (config.inventory?.collectionIds?.length) {
          params.set("collectionIds", JSON.stringify(config.inventory.collectionIds));
        }

        const response = await fetch(`/apps/revenue-boost/api/inventory?${params.toString()}`);
        if (response.ok) {
          const data = await response.json();
          setInventoryTotal(data.total);
        }
      } catch (error) {
        console.error("[FlashSalePopup] Failed to fetch inventory:", error);
      }
    };

    fetchInventory();
    const interval = setInterval(fetchInventory, 10000); // Refresh every 10s
    return () => clearInterval(interval);
    // eslint-disable-next-line react-hooks/exhaustive-deps -- Only re-run when inventory config changes
  }, [config.inventory]);

  // Timer is now handled by useCountdownTimer hook

  // Reservation timer using separate countdown hook instance
  const reservationTimer = useCountdownTimer({
    enabled: config.reserve?.enabled === true && !!config.reserve?.minutes,
    mode: "duration",
    duration: (config.reserve?.minutes || 0) * 60,
  });

  const reservationTime = reservationTimer.hasExpired ? null : reservationTimer.timeRemaining;

  const isPreview = configRecord.previewMode;
  const discount = config.discount as StorefrontDiscountConfig | undefined;
  // Check both normalized discount and raw discountConfig (for BOGO, tiers, etc.)
  const rawDiscountConfig = config.discountConfig;
  // In preview, always behave as if a discount exists so the full flow can be exercised
  // On storefront, check both normalized `discount` and raw `discountConfig.enabled`
  const hasDiscount = isPreview ? true : (!!discount?.enabled || !!rawDiscountConfig?.enabled);

  const isSoldOut = inventoryTotal !== null && inventoryTotal <= 0;
  const isSoldOutAndMissed = isSoldOut && config.inventory?.soldOutBehavior === "missed_it";

  const getCartSubtotalCents = () => {
    const total = config.currentCartTotal;
    if (typeof total === "number" && Number.isFinite(total)) {
      return Math.round(total * 100);
    }
    return undefined;
  };

  // Use shared CTA handler hook (new single-click flow with success state)
  const {
    ctaLabel,
    secondaryCtaLabel,
    actionCompleted,
    isProcessing,
    discountCode,
    actionError,
    isCtaDisabled,
    autoCloseCountdown,
    successMessage,
    successBehavior,
    handleCtaClick,
    handleSecondaryCta,
    cancelAutoClose,
    pendingNavigationUrl,
  } = useCTAHandler({
    cta: config.cta,
    secondaryCta: config.secondaryCta,
    buttonText: config.buttonText || config.ctaText,
    ctaUrl: config.ctaUrl,
    ctaOpenInNewTab: config.ctaOpenInNewTab,
    dismissLabel: config.dismissLabel,
    hasDiscount,
    isPreview,
    hasExpired: hasExpired || isSoldOutAndMissed,
    isSoldOut: isSoldOutAndMissed,
    issueDiscount,
    getCartSubtotalCents,
    onCtaClick,
    onClose,
    failureMessage: config.failureMessage,
    defaultSuccessMessage: config.successMessage || "Deal claimed!",
    defaultAutoCloseDelay: 5,
  });

  if (isSoldOut && config.inventory?.soldOutBehavior === "hide") {
    return null;
  }

  // Determine discount display message
  const getDiscountMessage = () => {
    const dc = config.discountConfig;

    if (dc?.tiers?.length) {
      // Tiered discount
      const tiers = dc.tiers.map((t: DiscountTier) => {
        const threshold = (t.thresholdCents / 100).toFixed(0);
        if (t.discount.kind === "free_shipping") return `$${threshold} free ship`;
        return `$${threshold} get ${t.discount.value}${t.discount.kind === "percentage" ? "%" : "$"} off`;
      });
      return `Spend more, save more: ${tiers.join(", ")}`;
    }

    if (dc?.bogo) {
      const buy = dc.bogo.buy.quantity;
      const get = dc.bogo.get.quantity;
      if (dc.bogo.get.discount.kind === "free_product") {
        return `Buy ${buy} Get ${get} Free`;
      }
      return `Buy ${buy} Get ${get} at ${dc.bogo.get.discount.value}% off`;
    }

    if (dc?.freeGift) {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any -- freeGift has dynamic shape
      const freeGift = dc.freeGift as any;
      const min = freeGift.minSubtotalCents
        ? `over $${(freeGift.minSubtotalCents / 100).toFixed(0)}`
        : "";
      return `Free gift with purchase ${min}`.trim();
    }

    // Basic discount
    if (config.discountPercentage) {
      return `${config.discountPercentage}% OFF`;
    }

    return null;
  };

  // Design tokens - accent falls back to error color (red) for flash sales
  const accentColor = config.accentColor || "var(--rb-error, #EF4444)";
  const textColor = config.textColor || "#111827";
  const bgColor = config.backgroundColor || "#FFFFFF";
  const borderRadius =
    typeof config.borderRadius === "number"
      ? config.borderRadius
      : parseFloat(config.borderRadius || "16");

  const discountMessage = getDiscountMessage();

  // Respect presentation.showInventory flag from content config (admin toggle)
  const presentationShowInventory = config.presentation?.showInventory !== false;

  const showInventory =
    presentationShowInventory &&
    config.inventory?.showOnlyXLeft &&
    inventoryTotal !== null &&
    inventoryTotal <= (config.inventory?.showThreshold || 10);

  const displayMode = config.displayMode || "modal";

  // Banner layout for flash sale (top/bottom announcement bar)
  if (displayMode === "banner") {
    const bannerPosition = config.position === "bottom" ? "bottom" : "top";

    return (
      <BannerPortal
        isVisible={isVisible}
        position={bannerPosition}
        previewMode={config.previewMode}
      >
        <style>{`
          .flash-sale-banner {
            font-family: ${config.fontFamily || 'system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif'};
            container-type: inline-size;
            container-name: flash-banner;
          }
          .flash-sale-banner-inner {
            max-width: 75rem;
            margin: 0 auto;
            padding: 1em 1.5em;
            display: grid;
            grid-template-columns: 1fr auto 1fr;
            grid-template-rows: auto auto;
            grid-template-areas:
              "badge badge badge"
              "left center right";
            align-items: center;
            gap: 0.75em 1.25em;
            position: relative;
            padding-right: 3.5em;
          }
          .flash-sale-banner-badge {
            grid-area: badge;
            justify-self: center;
            display: inline-flex;
            align-items: center;
            gap: 0.5em;
            padding: 0.25em 0.75em;
            border-radius: 9999px;
            font-size: clamp(0.625rem, 2cqi, 0.75rem);
            font-weight: 700;
            letter-spacing: 0.08em;
            text-transform: uppercase;
            background: ${accentColor};
            color: ${bgColor};
          }
          .flash-sale-banner-left {
            grid-area: left;
            min-width: 0;
          }
          .flash-sale-banner-headline {
            font-size: clamp(0.9375rem, 3cqi, 1.125rem);
            font-weight: 700;
            line-height: 1.4;
            margin: 0 0 0.25em 0;
          }
          .flash-sale-banner-subheadline {
            font-size: clamp(0.75rem, 2.5cqi, 0.875rem);
            line-height: 1.4;
            margin: 0;
            opacity: 0.9;
          }
          .flash-sale-banner-discount {
            margin-top: 0.5em;
            font-size: clamp(0.75rem, 2.5cqi, 0.875rem);
            font-weight: 600;
          }
          .flash-sale-banner-center {
            grid-area: center;
            display: flex;
            flex-direction: column;
            align-items: center;
            gap: 0.5em;
          }
          .flash-sale-banner-timer {
            display: flex;
            gap: 0.5em;
            align-items: center;
            flex-wrap: wrap;
            justify-content: center;
          }
          .flash-sale-banner-timer-unit {
            display: flex;
            flex-direction: column;
            align-items: center;
            padding: 0.5em 0.75em;
            border-radius: 0.375em;
            min-width: clamp(2.5rem, 8cqi, 3.25rem);
          }
          .flash-sale-banner-timer-value {
            font-size: clamp(1rem, 3.5cqi, 1.35rem);
            font-weight: 700;
            line-height: 1;
            font-variant-numeric: tabular-nums;
          }
          .flash-sale-banner-timer-label {
            font-size: clamp(0.5rem, 1.5cqi, 0.625rem);
            text-transform: uppercase;
            opacity: 0.85;
            margin-top: 0.15em;
            letter-spacing: 0.5px;
          }
          .flash-sale-banner-timer-separator {
            font-size: clamp(1rem, 3cqi, 1.25rem);
            font-weight: 700;
            opacity: 0.6;
          }
          .flash-sale-banner-stock {
            font-size: clamp(0.625rem, 2cqi, 0.75rem);
            font-weight: 600;
            padding: 0.25em 0.75em;
            border-radius: 999px;
            background: rgba(255, 255, 255, 0.2);
            white-space: nowrap;
          }
          .flash-sale-banner-reservation {
            font-size: clamp(0.625rem, 2cqi, 0.75rem);
            font-weight: 500;
            opacity: 0.9;
          }
          .flash-sale-banner-right {
            grid-area: right;
            display: flex;
            align-items: center;
            justify-content: flex-end;
            gap: 0.75em;
          }
          .flash-sale-banner-cta {
            padding: 0.75em 1.5em;
            font-family: inherit;
            font-size: clamp(0.8125rem, 2.5cqi, 0.95rem);
            font-weight: 600;
            border: none;
            border-radius: 0.375em;
            cursor: pointer;
            white-space: nowrap;
            transition: transform 0.2s, box-shadow 0.2s;
            box-shadow: 0 0.125em 0.25em rgba(0, 0, 0, 0.1);
            min-height: 2.75rem;
          }
          .flash-sale-banner-cta:hover:not(:disabled) {
            transform: translateY(-0.0625em);
            box-shadow: 0 0.25em 0.5em rgba(0, 0, 0, 0.15);
          }
          .flash-sale-banner-cta:disabled {
            opacity: 0.5;
            cursor: not-allowed;
            transform: none;
          }
          .flash-sale-banner-close {
            position: absolute;
            top: 0.75em;
            right: 0.75em;
            background: transparent;
            border: none;
            font-size: 1.5em;
            line-height: 1;
            cursor: pointer;
            opacity: 0.7;
            transition: opacity 0.2s;
            padding: 0.25em;
            width: 2em;
            height: 2em;
            display: flex;
            align-items: center;
            justify-content: center;
          }
          .flash-sale-banner-close:hover {
            opacity: 1;
          }
          .flash-sale-banner-expired {
            text-align: center;
            font-weight: 600;
            font-size: clamp(0.75rem, 2.5cqi, 0.875rem);
          }

          /* Banner container query: small screens - single column layout */
          @container flash-banner (max-width: 600px) {
            .flash-sale-banner-inner {
              display: flex;
              flex-direction: column;
              padding: 1em;
              gap: 0.75em;
              text-align: center;
              padding-right: 2.5em;
            }
            .flash-sale-banner-badge {
              align-self: center;
            }
            .flash-sale-banner-right {
              width: 100%;
              justify-content: center;
            }
            .flash-sale-banner-cta {
              width: 100%;
            }
          }

          /* Fallback media query for browsers without container query support */
          @supports not (container-type: inline-size) {
            @media (max-width: 768px) {
              .flash-sale-banner-inner {
                display: flex;
                flex-direction: column;
                padding: 1em;
                gap: 0.75em;
                text-align: center;
                padding-right: 2.5em;
              }
              .flash-sale-banner-badge {
                align-self: center;
              }
              .flash-sale-banner-right {
                width: 100%;
                justify-content: center;
              }
              .flash-sale-banner-cta {
                width: 100%;
              }
            }
          }

          /* Reduced motion support */
          @media (prefers-reduced-motion: reduce) {
            .flash-sale-banner-cta,
            .flash-sale-banner-close {
              transition: none !important;
            }
          }

          @keyframes flash-sale-spin {
            from { transform: rotate(0deg); }
            to { transform: rotate(360deg); }
          }
        `}</style>

        <div
          className="flash-sale-banner"
          style={{
            background: config.backgroundColor || "#111827",
            color: config.textColor || "#ffffff",
            boxShadow:
              bannerPosition === "bottom"
                ? "0 -2px 8px rgba(0, 0, 0, 0.15)"
                : "0 2px 8px rgba(0, 0, 0, 0.15)",
          }}
        >
          <div className="flash-sale-banner-inner">
            {config.showCloseButton !== false && (
              <button
                className="flash-sale-banner-close"
                onClick={onClose}
                aria-label="Close flash sale banner"
              >
                ×
              </button>
            )}

            {/* Badge centered at top spanning full width */}
            <div className="flash-sale-banner-badge">Limited Time Offer</div>

            <div className="flash-sale-banner-left">
              <h2 className="flash-sale-banner-headline">{config.headline || "Flash Sale!"}</h2>
              {config.subheadline && (
                <p className="flash-sale-banner-subheadline">{config.subheadline}</p>
              )}
              {/* Success message after action completed */}
              {actionCompleted && (successMessage || config.successMessage) && (
                <div className="flash-sale-success-message" style={{ color: "var(--rb-success, #22c55e)" }}>
                  {successMessage || config.successMessage}
                </div>
              )}
              {/* Error message if action failed */}
              {actionError && (
                <div className="flash-sale-error-message" style={{ color: "var(--rb-error, #ef4444)" }}>
                  {actionError}
                </div>
              )}
              {(discountCode || discountMessage) && (
                <div className="flash-sale-banner-discount">
                  {discountCode ? (
                    <DiscountCodeDisplay
                      code={discountCode}
                      onCopy={handleCopyCode}
                      copied={copiedCode}
                      label="Use code at checkout:"
                      variant="minimal"
                      size="sm"
                      accentColor={config.accentColor || "var(--rb-error, #ef4444)"}
                      textColor={config.textColor}
                    />
                  ) : (
                    discountMessage
                  )}
                </div>
              )}
            </div>

            <div className="flash-sale-banner-center">
              {isSoldOut && config.inventory?.soldOutBehavior === "missed_it" ? (
                <div className="flash-sale-banner-expired">
                  {config.inventory?.soldOutMessage || "This deal is sold out. Check back later!"}
                </div>
              ) : hasExpired ? (
                <div className="flash-sale-banner-expired">
                  {config.timer?.expiredMessage || "Sale ended"}
                </div>
              ) : (
                <>
                  {shouldShowTimer && timeRemaining.total > 0 && (
                    <TimerDisplay
                      timeRemaining={timeRemaining}
                      format="full"
                      showDays={timeRemaining.days > 0}
                      showLabels={true}
                      accentColor={config.accentColor || "var(--rb-error, #ef4444)"}
                      textColor={config.textColor}
                      className="flash-sale-banner-timer"
                    />
                  )}

                  {showInventory && inventoryTotal !== null && (
                    <div className="flash-sale-banner-stock">
                      ⚡ Only {inventoryTotal} left in stock
                    </div>
                  )}

                  {reservationTime && reservationTime.total > 0 && (
                    <div className="flash-sale-banner-reservation">
                      {(config.reserve?.label || "Offer reserved for:") + " "}
                      {reservationTime.minutes}:{String(reservationTime.seconds).padStart(2, "0")}
                    </div>
                  )}
                </>
              )}
            </div>

            <div className="flash-sale-banner-right">
              {(config.buttonText || config.ctaText) && (
                <button
                  className="flash-sale-banner-cta"
                  onClick={handleCtaClick}
                  disabled={hasExpired || isSoldOutAndMissed || isProcessing}
                  style={{
                    background: config.buttonColor || config.accentColor || "#ffffff",
                    color: config.buttonTextColor || config.textColor || "#111827",
                    borderRadius:
                      typeof config.borderRadius === "number"
                        ? `${config.borderRadius / 16}rem`
                        : config.borderRadius || "0.375rem",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    gap: "0.5em",
                  }}
                >
                  {isProcessing && (
                    <span
                      style={{
                        width: "1em",
                        height: "1em",
                        border: "0.125em solid rgba(255,255,255,0.3)",
                        borderTopColor: config.buttonTextColor || config.textColor || "#111827",
                        borderRadius: "50%",
                        animation: "flash-sale-spin 0.8s linear infinite",
                      }}
                    />
                  )}
                  {isProcessing ? "Processing..." : ctaLabel}
                </button>
              )}
            </div>
          </div>
        </div>
      </BannerPortal>
    );
  }

  // Get responsive size dimensions based on popupSize (Flash Sale specific)
  // Map popupSize to dimensions: compact=400px, standard=520px, wide=700px, full=900px
  const getFlashSaleSizeDimensions = (popupSize?: "compact" | "standard" | "wide" | "full") => {
    switch (popupSize) {
      case "compact":
        return { width: "100%", maxWidth: "400px" };
      case "standard":
        return { width: "100%", maxWidth: "520px" };
      case "full":
        return { width: "100%", maxWidth: "900px" };
      case "wide":
      default:
        return { width: "100%", maxWidth: "700px" };
    }
  };
  const sizeDimensions = getFlashSaleSizeDimensions(config.popupSize);
  // Map popupSize to spacing: compact=small, standard/wide=medium, full=large
  const sizeForPadding =
    config.popupSize === "compact" ? "small" : config.popupSize === "full" ? "large" : "medium";
  const containerPadding = getContainerPadding(sizeForPadding);

  return (
    <PopupPortal
      isVisible={isVisible}
      onClose={onClose}
      backdrop={{
        color: config.overlayColor || "rgba(0, 0, 0, 0.7)",
        opacity: config.overlayOpacity ?? 0.7,
        blur: 4,
      }}
      animation={{
        type: config.animation || "zoom",
      }}
      position={config.position || "center"}
      size={config.size || "medium"}
      closeOnEscape={config.closeOnEscape !== false}
      closeOnBackdropClick={config.closeOnOverlayClick !== false}
      previewMode={config.previewMode}
      showBranding={config.showBranding}
      ariaLabel={config.ariaLabel || config.headline || "Flash Sale"}
      ariaDescribedBy={config.ariaDescribedBy}
      customCSS={config.customCSS}
      globalCustomCSS={config.globalCustomCSS}
      designTokensCSS={config.designTokensCSS}
    >
      <style>{`
        .flash-sale-container {
          position: relative;
          /* Use min() to allow proper centering while respecting max-width */
          width: min(${sizeDimensions.maxWidth}, calc(100vw - 2rem));
          border-radius: ${borderRadius}px;
          overflow: hidden;
          box-shadow: 0 1.5625em 3.125em -0.75em rgba(0, 0, 0, 0.25);
          background: ${bgColor};
          color: ${textColor};
          font-family: ${config.fontFamily || "inherit"};
          container-type: inline-size;
          container-name: flash-sale;
        }

        /* Background image support */
        .flash-sale-bg-image {
          position: absolute;
          inset: 0;
          z-index: 0;
        }

        .flash-sale-bg-image img {
          width: 100%;
          height: 100%;
          object-fit: cover;
        }

        .flash-sale-bg-overlay {
          position: absolute;
          inset: 0;
          background: ${bgColor};
          opacity: ${config.backgroundOverlayOpacity ?? 0.6};
          z-index: 1;
        }

        .flash-sale-container.has-bg-image .flash-sale-content,
        .flash-sale-container.has-bg-image .flash-sale-expired,
        .flash-sale-container.has-bg-image .flash-sale-sold-out {
          position: relative;
          z-index: 2;
        }

        .flash-sale-close {
          position: absolute;
          top: 1em;
          right: 1em;
          z-index: 10;
          padding: 0.5em;
          border-radius: 9999px;
          background: rgba(0, 0, 0, 0.1);
          border: none;
          cursor: pointer;
          transition: background 0.2s;
          color: ${config.descriptionColor || textColor};
        }

        /* Ensure close button stays above background image */
        .flash-sale-container.has-bg-image .flash-sale-close {
          z-index: 10;
        }

        .flash-sale-close:hover {
          background: rgba(0, 0, 0, 0.2);
        }

        .flash-sale-content {
          padding: ${containerPadding};
          text-align: center;
          display: flex;
          flex-direction: column;
          align-items: center;
        }

        .flash-sale-header {
          display: flex;
          flex-direction: column;
          align-items: center;
          margin-bottom: ${POPUP_SPACING.section.md};
        }

        .flash-sale-badge {
          display: inline-block;
          padding: 0.4em 1.25em;
          border-radius: 9999px;
          font-size: clamp(0.65rem, 2cqi, 0.75rem);
          font-weight: 700;
          letter-spacing: 0.08em;
          margin-bottom: 0.75rem;
          text-transform: uppercase;
          background: ${accentColor};
          color: ${bgColor};
        }

        .flash-sale-headline {
          font-size: clamp(1.5rem, 7cqi, 2.25rem);
          font-weight: 800;
          line-height: 1.15;
          margin: 0;
          color: ${textColor};
        }

        .flash-sale-supporting {
          font-size: clamp(0.875rem, 3.5cqi, 1rem);
          line-height: 1.5;
          margin: 0;
          margin-bottom: ${POPUP_SPACING.section.lg};
          color: ${config.descriptionColor || textColor};
          opacity: 0.85;
          max-width: 32ch;
        }

        .flash-sale-discount-message {
          font-size: clamp(0.8rem, 3cqi, 0.9375rem);
          font-weight: 600;
          padding: 0.75em 1.25em;
          border-radius: 0.5em;
          margin-bottom: ${POPUP_SPACING.section.md};
          background: ${accentColor}15;
          color: ${accentColor};
          border: 1.5px solid ${accentColor}35;
        }

        .flash-sale-urgency {
          font-size: clamp(0.7rem, 2.5cqi, 0.8rem);
          font-weight: 600;
          text-transform: uppercase;
          letter-spacing: 0.08em;
          margin-bottom: ${POPUP_SPACING.section.sm};
          color: ${config.descriptionColor || textColor};
          opacity: 0.7;
        }

        .flash-sale-timer {
          display: flex;
          justify-content: center;
          gap: clamp(0.5rem, 2cqi, 0.625rem);
          margin-bottom: ${POPUP_SPACING.section.lg};
        }

        .flash-sale-timer-unit {
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 0.25em;
          min-width: clamp(3.25rem, 11cqi, 4rem);
          padding: clamp(0.625rem, 2cqi, 0.875rem) clamp(0.5rem, 1.5cqi, 0.625rem);
          border-radius: 0.5em;
          background: ${accentColor}12;
          border: 1px solid ${accentColor}25;
        }

        .flash-sale-timer-value {
          font-size: clamp(1.35rem, 5.5cqi, 1.75rem);
          font-weight: 800;
          line-height: 1;
          font-variant-numeric: tabular-nums;
          color: ${textColor};
        }

        .flash-sale-timer-label {
          font-size: clamp(0.55rem, 2cqi, 0.65rem);
          font-weight: 600;
          text-transform: uppercase;
          letter-spacing: 0.04em;
          color: ${config.descriptionColor || textColor};
          opacity: 0.6;
        }

        .flash-sale-timer-separator {
          font-size: clamp(1.25rem, 5cqi, 1.5rem);
          font-weight: 700;
          color: ${textColor};
          opacity: 0.3;
          align-self: center;
          margin-top: -0.25em;
        }

        .flash-sale-inventory {
          display: inline-flex;
          align-items: center;
          gap: 0.5em;
          padding: 0.5em 1em;
          border-radius: 9999px;
          font-size: clamp(0.7rem, 2.5cqi, 0.8rem);
          font-weight: 600;
          margin-bottom: ${POPUP_SPACING.section.md};
          background: ${accentColor}15;
          color: ${accentColor};
        }

        .flash-sale-inventory-dot {
          width: 0.4em;
          height: 0.4em;
          border-radius: 9999px;
          background: ${accentColor};
          animation: flash-sale-pulse 1.5s ease-in-out infinite;
        }

        .flash-sale-reservation {
          font-size: clamp(0.7rem, 2.5cqi, 0.8rem);
          padding: 0.625em 1em;
          border-radius: 0.375em;
          margin-bottom: ${POPUP_SPACING.section.sm};
          background: rgba(59, 130, 246, 0.08);
          color: #3b82f6;
          border: 1px solid rgba(59, 130, 246, 0.2);
        }

        .flash-sale-actions {
          width: 100%;
          max-width: 20rem;
          display: flex;
          flex-direction: column;
          gap: 0.625rem;
        }

        .flash-sale-cta {
          width: 100%;
          min-height: 3rem;
          padding: 0.875em 1.5em;
          border-radius: 0.5em;
          border: none;
          font-family: ${config.fontFamily || 'system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif'};
          font-size: clamp(0.875rem, 3.5cqi, 1rem);
          font-weight: 700;
          cursor: pointer;
          transition: all 0.2s ease;
          text-transform: uppercase;
          letter-spacing: 0.04em;
          background: ${config.buttonColor || accentColor};
          color: ${config.buttonTextColor || "#ffffff"};
          box-shadow: 0 2px 8px ${accentColor}30;
        }

        .flash-sale-cta:hover:not(:disabled) {
          transform: translateY(-2px);
          box-shadow: 0 6px 20px ${accentColor}40;
        }

        .flash-sale-cta:active:not(:disabled) {
          transform: translateY(0);
        }

        .flash-sale-cta:disabled {
          opacity: 0.5;
          cursor: not-allowed;
          transform: none;
          box-shadow: none;
        }

        .flash-sale-secondary-cta {
          width: 100%;
          min-height: 2.5rem;
          padding: 0.625em 1.5em;
          border-radius: 0.5em;
          border: none;
          background: transparent;
          color: ${textColor};
          font-family: ${config.fontFamily || 'system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif'};
          font-size: clamp(0.75rem, 2.5cqi, 0.8125rem);
          font-weight: 500;
          cursor: pointer;
          transition: opacity 0.2s;
          opacity: 0.6;
        }

        .flash-sale-secondary-cta:hover {
          opacity: 1;
        }

        .flash-sale-expired {
          padding: 2em;
          text-align: center;
        }

        .flash-sale-expired h3 {
          font-size: clamp(1.25rem, 5cqi, 1.5rem);
        }

        .flash-sale-sold-out {
          padding: 2em;
          text-align: center;
        }

        .flash-sale-sold-out h3 {
          font-size: clamp(1.25rem, 5cqi, 1.5rem);
        }

        @keyframes flash-sale-pulse {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.5; }
        }

        @keyframes flash-sale-spin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }

        /* ============================================
         * MOBILE-FIRST: Small containers (< 400px)
         * Optimized compact layout for small screens
         * ============================================ */
        @container flash-sale (max-width: 400px) {
          .flash-sale-content {
            padding: 1.25rem 1rem 1.5rem;
          }

          .flash-sale-close {
            top: 0.5rem;
            right: 0.5rem;
            padding: 0.35rem;
          }

          .flash-sale-badge {
            padding: 0.35em 1em;
            font-size: 0.65rem;
            margin-bottom: 0.75rem;
          }

          .flash-sale-headline {
            font-size: 1.35rem;
            margin-bottom: 0.5rem;
            line-height: 1.15;
          }

          .flash-sale-supporting {
            font-size: 0.8rem;
            margin-bottom: 1rem;
            line-height: 1.5;
          }

          .flash-sale-urgency {
            font-size: 0.7rem;
            margin-bottom: 0.625rem;
            letter-spacing: 0.08em;
          }

          .flash-sale-timer {
            gap: 0.35rem;
            margin-bottom: 1rem;
          }

          .flash-sale-timer-unit {
            min-width: 3.25rem;
            padding: 0.5rem 0.35rem;
            border-radius: 0.375rem;
          }

          .flash-sale-timer-value {
            font-size: 1.25rem;
          }

          .flash-sale-timer-label {
            font-size: 0.55rem;
            margin-top: 0.15rem;
          }

          .flash-sale-discount-message {
            font-size: 0.8rem;
            padding: 0.75em 1em;
            margin-bottom: 1rem;
          }

          .flash-sale-inventory {
            font-size: 0.7rem;
            padding: 0.5em 1em;
            margin-bottom: 1rem;
          }

          .flash-sale-reservation {
            font-size: 0.7rem;
            padding: 0.625em 0.875em;
            margin-bottom: 0.75rem;
          }

          .flash-sale-cta {
            min-height: 2.75rem;
            padding: 0.875em 1.25em;
            font-size: 0.875rem;
            border-radius: 0.5rem;
          }

          .flash-sale-secondary-cta {
            margin-top: 0.625rem;
            min-height: 2.25rem;
            padding: 0.5em 1em;
            font-size: 0.75rem;
          }

          .flash-sale-expired,
          .flash-sale-sold-out {
            padding: 1.5rem 1rem;
          }

          .flash-sale-expired h3,
          .flash-sale-sold-out h3 {
            font-size: 1.125rem;
            margin-bottom: 0.375rem;
          }

          .flash-sale-expired p,
          .flash-sale-sold-out p {
            font-size: 0.8rem;
          }
        }

        /* ============================================
         * MEDIUM: Containers 401px - 640px
         * Balanced layout with more breathing room
         * ============================================ */
        @container flash-sale (min-width: 401px) and (max-width: 640px) {
          .flash-sale-content {
            padding: 1.75rem 1.5rem 2rem;
          }

          .flash-sale-badge {
            margin-bottom: 1rem;
          }

          .flash-sale-headline {
            font-size: 1.75rem;
          }

          .flash-sale-timer-unit {
            min-width: 3.5rem;
            padding: 0.625rem 0.5rem;
          }

          .flash-sale-timer-value {
            font-size: 1.5rem;
          }
        }

        /* ============================================
         * LARGE: Containers 641px+
         * Full desktop experience
         * ============================================ */
        @container flash-sale (min-width: 641px) {
          .flash-sale-content {
            padding: 2.5rem 2rem;
          }
        }

        /* Reduced motion support */
        @media (prefers-reduced-motion: reduce) {
          .flash-sale-cta,
          .flash-sale-secondary-cta,
          .flash-sale-close,
          .flash-sale-inventory-dot {
            animation: none !important;
            transition: none !important;
          }
        }
      `}</style>

      <div
        className={`flash-sale-container${config.imageUrl && config.leadCaptureLayout?.desktop === "overlay" ? " has-bg-image" : ""}`}
        data-splitpop="true"
        data-template="flash-sale"
      >
        {/* Background image with overlay */}
        {config.imageUrl && config.leadCaptureLayout?.desktop === "overlay" && (
          <>
            <div className="flash-sale-bg-image">
              <img src={config.imageUrl} alt="" aria-hidden="true" />
            </div>
            <div className="flash-sale-bg-overlay" />
          </>
        )}

        <PopupCloseButton
          onClose={onClose}
          color={config.textColor}
          size={20}
          className="flash-sale-close"
          position="custom"
          show={config.showCloseButton !== false}
        />

        {isSoldOut && config.inventory?.soldOutBehavior === "missed_it" ? (
          <div className="flash-sale-sold-out">
            <h3 style={{ marginBottom: "0.5em", fontWeight: "700" }}>You Missed It!</h3>
            <p style={{ opacity: 0.8 }}>
              {config.inventory.soldOutMessage || "This deal is sold out. Check back later!"}
            </p>
          </div>
        ) : hasExpired ? (
          <div className="flash-sale-expired">
            <h3 style={{ marginBottom: "0.5em", fontWeight: "700" }}>Sale Ended</h3>
            <p style={{ opacity: 0.8 }}>
              {config.timer?.expiredMessage ||
                "This flash sale has expired. Check back soon for more deals!"}
            </p>
          </div>
        ) : actionCompleted ? (
          /* SUCCESS STATE - Shows after CTA action completes */
          <SuccessState
            message={successMessage || "Deal claimed!"}
            discountCode={successBehavior?.showDiscountCode ? (discountCode || undefined) : undefined}
            onCopyCode={handleCopyCode}
            copiedCode={copiedCode}
            discountLabel="Your discount code:"
            accentColor={accentColor}
            successColor={accentColor}
            textColor={textColor}
            autoCloseIn={autoCloseCountdown}
            onCancelAutoClose={cancelAutoClose}
            secondaryAction={
              // If there's a pending navigation (e.g., navigate_collection after showing discount), show "Continue" button
              pendingNavigationUrl
                ? { label: "Continue Shopping →", onClick: handleSecondaryCta }
                : config.cta?.action === "add_to_cart"
                  ? { label: "View Cart", onClick: () => window.location.href = "/cart" }
                  : undefined
            }
          />
        ) : (
          <div className="flash-sale-content">
            {/* Centered Header: Badge + Headline */}
            <div className="flash-sale-header">
              <div className="flash-sale-badge">Limited Time</div>
              <h2 className="flash-sale-headline">{config.headline || "Flash Sale!"}</h2>
            </div>

            <p className="flash-sale-supporting">
              {config.subheadline || "Limited time offer - Don't miss out!"}
            </p>

            {/* Error message if action failed */}
            {actionError && (
              <div className="flash-sale-error-message" style={{ color: "var(--rb-error, #ef4444)", marginBottom: "1rem" }}>
                {actionError}
              </div>
            )}

            {/* Promotion Display - Visual representation of discount type */}
            {config.discountConfig && (
              <div className="flash-sale-promotion" style={{ marginBottom: POPUP_SPACING.section.md }}>
                <PromotionDisplay
                  tiers={config.discountConfig.tiers}
                  bogo={config.discountConfig.bogo}
                  freeGift={config.discountConfig.freeGift}
                  discountPercentage={config.discountPercentage}
                  currentCartTotalCents={config.currentCartTotal ? Math.round(config.currentCartTotal * 100) : 0}
                  accentColor={accentColor}
                  textColor={textColor}
                  backgroundColor={bgColor}
                  size="md"
                />
              </div>
            )}

            {/* Fallback text message for simple discounts without visual display */}
            {!config.discountConfig && discountMessage && (
              <div className="flash-sale-discount-message">
                {discountMessage}
              </div>
            )}

            {config.urgencyMessage && (
              <div className="flash-sale-urgency">{config.urgencyMessage}</div>
            )}

            {shouldShowTimer && timeRemaining.total > 0 && (
              <div className="flash-sale-timer">
                <TimerDisplay
                  timeRemaining={timeRemaining}
                  format="full"
                  showDays={timeRemaining.days > 0}
                  showLabels={true}
                  accentColor={config.accentColor || "var(--rb-error, #ef4444)"}
                  textColor={config.textColor}
                />
              </div>
            )}

            {showInventory && (
              <div className="flash-sale-inventory">
                <div className="flash-sale-inventory-dot" />
                Only {inventoryTotal} left in stock!
              </div>
            )}

            {reservationTime && reservationTime.total > 0 && (
              <div className="flash-sale-reservation">
                {config.reserve?.label || "Offer reserved for:"} {reservationTime.minutes}:
                {String(reservationTime.seconds).padStart(2, "0")}
                {config.reserve?.disclaimer && (
                  <div style={{ fontSize: "0.85em", marginTop: "0.25em", opacity: 0.7 }}>
                    {config.reserve.disclaimer}
                  </div>
                )}
              </div>
            )}

            {/* Actions: CTA + Dismiss */}
            <div className="flash-sale-actions">
              <button onClick={handleCtaClick} className="flash-sale-cta" disabled={isCtaDisabled}>
                {isProcessing ? "Processing..." : ctaLabel}
              </button>

              <button
                type="button"
                onClick={handleSecondaryCta}
                className="flash-sale-secondary-cta"
              >
                {secondaryCtaLabel}
              </button>
            </div>
          </div>
        )}
      </div>
    </PopupPortal>
  );
};

export default FlashSalePopup;
