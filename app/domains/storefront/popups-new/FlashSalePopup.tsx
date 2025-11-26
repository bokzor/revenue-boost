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
import { getSizeDimensions } from "./utils";
import { getContainerPadding, POPUP_SPACING } from "./spacing";

// Import custom hooks
import { useCountdownTimer, useDiscountCode } from "./hooks";

// Import shared components
import { DiscountCodeDisplay, PopupCloseButton, TimerDisplay } from "./components/shared";

/**
 * FlashSale-specific configuration
 */
export interface FlashSaleConfig extends PopupDesignConfig, FlashSaleContent {
  // Storefront-specific fields
  ctaOpenInNewTab?: boolean;
  discountConfig?: any; // Legacy/advanced config (tiers, BOGO, free gift)
  discount?: StorefrontDiscountConfig; // Normalized storefront discount summary
  currentCartTotal?: number; // Injected by storefront runtime
}

export interface FlashSalePopupProps {
  config: FlashSaleConfig;
  isVisible: boolean;
  onClose: () => void;
  onExpiry?: () => void;
  onCtaClick?: () => void;
  issueDiscount?: (options?: {
    cartSubtotalCents?: number;
  }) => Promise<{ code?: string; autoApplyMode?: string } | null>;
}

export const FlashSalePopup: React.FC<FlashSalePopupProps> = ({
  config,
  isVisible,
  onClose,
  onExpiry,
  onCtaClick,
  issueDiscount,
}) => {
  // Use countdown timer hook
  const timerMode = config.timer?.mode || "duration";
  // Map 'stock_limited' to 'duration' for the hook (stock_limited is handled separately)
  const hookTimerMode = timerMode === "stock_limited" ? "duration" : timerMode;
  const { timeRemaining, hasExpired, formattedTime } = useCountdownTimer({
    enabled: config.showCountdown !== false,
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

  // Use discount code hook
  const { discountCode, setDiscountCode, copiedCode, handleCopyCode } = useDiscountCode();

  // Component-specific state
  const [inventoryTotal, setInventoryTotal] = useState<number | null>(null);
  const [hasClaimedDiscount, setHasClaimedDiscount] = useState(false);
  const [isClaimingDiscount, setIsClaimingDiscount] = useState(false);
  const [discountError, setDiscountError] = useState<string | null>(null);

  // Fetch inventory if configured
  useEffect(() => {
    // In preview mode, avoid real API calls and rely on pseudo config only
    if ((config as any).previewMode) {
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
  }, [config.inventory]);

  // Timer is now handled by useCountdownTimer hook

  // Reservation timer using separate countdown hook instance
  const reservationTimer = useCountdownTimer({
    enabled: config.reserve?.enabled === true && !!config.reserve?.minutes,
    mode: "duration",
    duration: (config.reserve?.minutes || 0) * 60,
  });

  const reservationTime = reservationTimer.hasExpired ? null : reservationTimer.timeRemaining;

  const isPreview = (config as any).previewMode;
  const discount = (config.discount ?? (config as any).discount) as
    | StorefrontDiscountConfig
    | undefined;
  // In preview, always behave as if a discount exists so the full flow can be exercised
  const hasDiscount = isPreview ? true : !!discount?.enabled;

  const isSoldOut = inventoryTotal !== null && inventoryTotal <= 0;
  const isSoldOutAndMissed = isSoldOut && config.inventory?.soldOutBehavior === "missed_it";

  const getCartSubtotalCents = () => {
    const total = config.currentCartTotal;
    if (typeof total === "number" && Number.isFinite(total)) {
      return Math.round(total * 100);
    }
    return undefined;
  };

  const getCtaLabel = () => {
    if (hasExpired || isSoldOutAndMissed) {
      return config.buttonText || config.ctaText || "Offer unavailable";
    }
    if (isClaimingDiscount) {
      return "Applying...";
    }
    if (hasDiscount && !hasClaimedDiscount) {
      return config.buttonText || config.ctaText || "Get this offer";
    }
    return config.buttonText || config.ctaText || "Shop Now";
  };

  const handleCtaClick = async () => {
    const canClaimDiscount =
      hasDiscount && !hasClaimedDiscount && !hasExpired && !isSoldOutAndMissed;

    if (canClaimDiscount) {
      setDiscountError(null);
      setIsClaimingDiscount(true);
      try {
        if (issueDiscount) {
          const cartSubtotalCents = getCartSubtotalCents();
          const result = await issueDiscount(cartSubtotalCents ? { cartSubtotalCents } : undefined);
          if (result?.code) {
            setDiscountCode(result.code);
          }
          setHasClaimedDiscount(true);
        }
      } catch (error) {
        console.error("[FlashSalePopup] Failed to claim discount:", error);
        setDiscountError("Something went wrong applying your discount. Please try again.");
      } finally {
        setIsClaimingDiscount(false);
      }

      // First click used to claim discount only
      return;
    }

    // In preview mode, never navigate away from the editor
    if (isPreview) {
      return;
    }

    if (onCtaClick) {
      onCtaClick();
    }

    if (config.ctaUrl) {
      if (config.ctaOpenInNewTab) {
        window.open(config.ctaUrl, "_blank", "noopener,noreferrer");
      } else {
        window.location.href = config.ctaUrl;
      }
    }
  };

  if (!isVisible) return null;

  if (isSoldOut && config.inventory?.soldOutBehavior === "hide") {
    return null;
  }

  // Determine discount display message
  const getDiscountMessage = () => {
    const dc = config.discountConfig;

    if (dc?.tiers?.length) {
      // Tiered discount
      const tiers = dc.tiers.map((t: any) => {
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
      const min = dc.freeGift.minSubtotalCents
        ? `over $${(dc.freeGift.minSubtotalCents / 100).toFixed(0)}`
        : "";
      return `Free gift with purchase ${min}`.trim();
    }

    // Basic discount
    if (config.discountPercentage) {
      return `${config.discountPercentage}% OFF`;
    }

    return null;
  };

  // Design tokens
  const accentColor = config.accentColor || "#EF4444";
  const textColor = config.textColor || "#111827";
  const bgColor = config.backgroundColor || "#FFFFFF";
  const borderRadius = typeof config.borderRadius === "number" 
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
      <>
        <style>{`
          .flash-sale-banner {
            font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif;
            container-type: inline-size;
            container-name: flash-banner;
          }
          .flash-sale-banner-inner {
            max-width: 75rem;
            margin: 0 auto;
            padding: 1em 1.5em;
            display: flex;
            align-items: center;
            justify-content: space-between;
            gap: 1.25em;
            position: relative;
            padding-right: 3.5em;
          }
          .flash-sale-banner-left {
            flex: 1;
            min-width: 0;
          }
          .flash-sale-banner-badge {
            display: inline-flex;
            align-items: center;
            gap: 0.5em;
            padding: 0.25em 0.75em;
            border-radius: 9999px;
            font-size: clamp(0.625rem, 2cqi, 0.75rem);
            font-weight: 700;
            letter-spacing: 0.08em;
            text-transform: uppercase;
            margin-bottom: 0.25em;
            background: ${accentColor};
            color: ${bgColor};
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
            display: flex;
            align-items: center;
            gap: 0.75em;
          }
          .flash-sale-banner-cta {
            padding: 0.75em 1.5em;
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

          /* Banner container query: small screens */
          @container flash-banner (max-width: 600px) {
            .flash-sale-banner-inner {
              flex-direction: column;
              padding: 1em;
              gap: 0.75em;
              text-align: center;
              padding-right: 2.5em;
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
                flex-direction: column;
                padding: 1em;
                gap: 0.75em;
                text-align: center;
                padding-right: 2.5em;
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
            position: "fixed",
            [bannerPosition]: 0,
            left: 0,
            right: 0,
            zIndex: 9999,
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

            <div className="flash-sale-banner-left">
              <div className="flash-sale-banner-badge">Limited Time Offer</div>
              <h2 className="flash-sale-banner-headline">{config.headline || "Flash Sale!"}</h2>
              {config.subheadline && (
                <p className="flash-sale-banner-subheadline">{config.subheadline}</p>
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
                      accentColor={config.accentColor || "#ef4444"}
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
                  {config.showCountdown && timeRemaining.total > 0 && (
                    <TimerDisplay
                      timeRemaining={timeRemaining}
                      format="full"
                      showDays={timeRemaining.days > 0}
                      showLabels={true}
                      accentColor={config.accentColor || "#ef4444"}
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
                  disabled={hasExpired || isSoldOutAndMissed || isClaimingDiscount}
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
                  {isClaimingDiscount && (
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
                  {getCtaLabel()}
                </button>
              )}
            </div>
          </div>
        </div>
      </>
    );
  }

  // Get responsive size dimensions
  const sizeDimensions = getSizeDimensions(config.size || "medium", config.previewMode);
  const containerPadding = getContainerPadding(config.size || "medium");

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
      ariaLabel={config.ariaLabel || config.headline || "Flash Sale"}
      ariaDescribedBy={config.ariaDescribedBy}
      customCSS={config.customCSS}
      globalCustomCSS={config.globalCustomCSS}
    >
      <style>{`
        .flash-sale-container {
          position: relative;
          width: 100%;
          max-width: ${sizeDimensions.maxWidth};
          border-radius: ${borderRadius}px;
          overflow: hidden;
          box-shadow: 0 1.5625em 3.125em -0.75em rgba(0, 0, 0, 0.25);
          background: ${bgColor};
          color: ${textColor};
          font-family: ${config.fontFamily || "inherit"};
          container-type: inline-size;
          container-name: flash-sale;
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

        .flash-sale-close:hover {
          background: rgba(0, 0, 0, 0.2);
        }

        .flash-sale-content {
          padding: ${containerPadding};
          text-align: center;
        }

        .flash-sale-badge {
          display: inline-block;
          padding: 0.5em 1.5em;
          border-radius: 9999px;
          font-size: clamp(0.75rem, 2.5cqi, 0.875rem);
          font-weight: 700;
          letter-spacing: 0.05em;
          margin-bottom: ${POPUP_SPACING.section.md};
          text-transform: uppercase;
          background: ${accentColor};
          color: ${bgColor};
        }

        .flash-sale-headline {
          font-size: clamp(1.5rem, 8cqi, 2.5rem);
          font-weight: 900;
          line-height: 1.1;
          margin-bottom: ${POPUP_SPACING.section.sm};
          color: ${textColor};
        }

        .flash-sale-supporting {
          font-size: clamp(0.875rem, 4cqi, 1.125rem);
          line-height: 1.6;
          margin-bottom: ${POPUP_SPACING.section.xl};
          color: ${config.descriptionColor || textColor};
        }

        .flash-sale-discount-message {
          font-size: clamp(0.875rem, 3.5cqi, 1rem);
          font-weight: 600;
          padding: 1em 1.5em;
          border-radius: 0.5em;
          margin-bottom: ${POPUP_SPACING.section.lg};
          background: ${accentColor}15;
          color: ${accentColor};
          border: 2px solid ${accentColor}40;
        }

        .flash-sale-urgency {
          font-size: clamp(0.75rem, 3cqi, 0.875rem);
          font-weight: 600;
          text-transform: uppercase;
          letter-spacing: 0.1em;
          margin-bottom: ${POPUP_SPACING.section.md};
          color: ${config.descriptionColor || textColor};
        }

        .flash-sale-timer {
          display: flex;
          gap: clamp(0.5rem, 2cqi, 0.75rem);
          justify-content: center;
          flex-wrap: wrap;
          margin-bottom: ${POPUP_SPACING.section.lg};
        }

        .flash-sale-timer-unit {
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 0.375em;
          min-width: clamp(3rem, 12cqi, 4rem);
          padding: clamp(0.625rem, 2.5cqi, 1rem) clamp(0.5rem, 2cqi, 0.75rem);
          border-radius: 0.5em;
          background: ${accentColor}20;
          color: ${accentColor};
        }

        .flash-sale-timer-value {
          font-size: clamp(1.25rem, 6cqi, 2rem);
          font-weight: 900;
          line-height: 1;
          font-variant-numeric: tabular-nums;
        }

        .flash-sale-timer-label {
          font-size: clamp(0.625rem, 2.5cqi, 0.75rem);
          font-weight: 500;
          text-transform: uppercase;
          letter-spacing: 0.05em;
          opacity: 0.8;
        }

        .flash-sale-inventory {
          display: inline-flex;
          align-items: center;
          gap: 0.5em;
          padding: 0.75em 1.25em;
          border-radius: 9999px;
          font-size: clamp(0.75rem, 3cqi, 0.875rem);
          font-weight: 600;
          margin-bottom: ${POPUP_SPACING.section.lg};
          background: ${accentColor}20;
          color: ${accentColor};
        }

        .flash-sale-inventory-dot {
          width: 0.5em;
          height: 0.5em;
          border-radius: 9999px;
          background: ${accentColor};
          animation: flash-sale-pulse 2s infinite;
        }

        .flash-sale-reservation {
          font-size: clamp(0.75rem, 3cqi, 0.875rem);
          padding: 0.75em 1em;
          border-radius: 0.5em;
          margin-bottom: ${POPUP_SPACING.section.md};
          background: rgba(59, 130, 246, 0.1);
          color: #3b82f6;
          border: 1px solid rgba(59, 130, 246, 0.3);
        }

        .flash-sale-cta {
          width: 100%;
          min-height: 3rem;
          padding: 1em 2em;
          border-radius: 0.5em;
          border: none;
          font-size: clamp(0.9375rem, 4cqi, 1.125rem);
          font-weight: 700;
          cursor: pointer;
          transition: all 0.2s;
          text-transform: uppercase;
          letter-spacing: 0.05em;
          background: ${config.buttonColor || accentColor};
          color: ${config.buttonTextColor || "#ffffff"};
        }

        .flash-sale-cta:hover:not(:disabled) {
          transform: translateY(-0.125em);
          box-shadow: 0 0.625em 1.5625em -0.3125em rgba(0, 0, 0, 0.3);
        }

        .flash-sale-cta:disabled {
          opacity: 0.5;
          cursor: not-allowed;
          transform: none;
        }

        .flash-sale-secondary-cta {
          margin-top: ${POPUP_SPACING.section.sm};
          width: 100%;
          min-height: 2.75rem;
          padding: 0.75em 2em;
          border-radius: 0.5em;
          border: 1px solid rgba(148, 163, 184, 0.6);
          background: transparent;
          color: ${textColor};
          font-size: clamp(0.8125rem, 3cqi, 0.875rem);
          font-weight: 500;
          cursor: pointer;
          transition: background 0.2s;
        }

        .flash-sale-secondary-cta:hover {
          background: rgba(15, 23, 42, 0.08);
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

        /* Container query: small containers */
        @container flash-sale (max-width: 400px) {
          .flash-sale-content {
            padding: 1.5rem 1rem;
          }

          .flash-sale-timer {
            gap: 0.375rem;
          }

          .flash-sale-timer-unit {
            min-width: 2.75rem;
            padding: 0.5rem 0.375rem;
          }

          .flash-sale-cta,
          .flash-sale-secondary-cta {
            padding-left: 1em;
            padding-right: 1em;
          }
        }

        /* Container query: medium containers */
        @container flash-sale (min-width: 401px) and (max-width: 640px) {
          .flash-sale-content {
            padding: 2rem 1.5rem;
          }
        }

        /* Container query: large containers */
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

      <div className="flash-sale-container">
        <PopupCloseButton
          onClose={onClose}
          color={config.textColor}
          size={20}
          className="flash-sale-close"
          position="custom"
        />

        {isSoldOut && config.inventory?.soldOutBehavior === "missed_it" ? (
          <div className="flash-sale-sold-out">
            <h3 style={{ marginBottom: "0.5em", fontWeight: "700" }}>
              You Missed It!
            </h3>
            <p style={{ opacity: 0.8 }}>
              {config.inventory.soldOutMessage || "This deal is sold out. Check back later!"}
            </p>
          </div>
        ) : hasExpired ? (
          <div className="flash-sale-expired">
            <h3 style={{ marginBottom: "0.5em", fontWeight: "700" }}>
              Sale Ended
            </h3>
            <p style={{ opacity: 0.8 }}>
              {config.timer?.expiredMessage ||
                "This flash sale has expired. Check back soon for more deals!"}
            </p>
          </div>
        ) : (
          <div className="flash-sale-content">
            <div className="flash-sale-badge">Limited Time</div>

            <h2 className="flash-sale-headline">{config.headline || "Flash Sale!"}</h2>

            <p className="flash-sale-supporting">
              {config.subheadline || "Limited time offer - Don't miss out!"}
            </p>

            {(discountCode || discountMessage) && (
              <div className="flash-sale-discount-message">
                {discountCode ? (
                  <DiscountCodeDisplay
                    code={discountCode}
                    onCopy={handleCopyCode}
                    copied={copiedCode}
                    label="Use code at checkout:"
                    variant="minimal"
                    size="sm"
                    accentColor={config.accentColor || "#ef4444"}
                    textColor={config.textColor}
                  />
                ) : (
                  discountMessage
                )}
              </div>
            )}

            {config.urgencyMessage && (
              <div className="flash-sale-urgency">{config.urgencyMessage}</div>
            )}

            {config.showCountdown && timeRemaining.total > 0 && (
              <TimerDisplay
                timeRemaining={timeRemaining}
                format="full"
                showDays={timeRemaining.days > 0}
                showLabels={true}
                accentColor={config.accentColor || "#ef4444"}
                textColor={config.textColor}
                className="flash-sale-timer"
              />
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

            <button
              onClick={handleCtaClick}
              className="flash-sale-cta"
              disabled={hasExpired || isSoldOutAndMissed || isClaimingDiscount}
            >
              {getCtaLabel()}
            </button>

            <button type="button" onClick={onClose} className="flash-sale-secondary-cta">
              {config.dismissLabel || "No thanks"}
            </button>
          </div>
        )}
      </div>
    </PopupPortal>
  );
};

export default FlashSalePopup;
