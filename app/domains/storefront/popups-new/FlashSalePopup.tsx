/**
 * FlashSalePopup Component - Enhanced
 *
 * Complete redesign featuring:
 * - Multiple discount types (basic, tiered, BOGO, free gift)
 * - Advanced timer modes (duration, fixed_end, personal, stock_limited)
 * - Real-time inventory tracking via API
 * - Reservation timer countdown
 * - Enhanced expired states
 * - Responsive design with themes
 */

import React, { useState, useEffect } from 'react';
import type { PopupDesignConfig, DiscountConfig as StorefrontDiscountConfig } from './types';
import type { FlashSaleContent } from '~/domains/campaigns/types/campaign';
import { PopupPortal } from './PopupPortal';

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
  issueDiscount?: (options?: { cartSubtotalCents?: number }) => Promise<{ code?: string; autoApplyMode?: string } | null>;
}

interface TimeRemaining {
  total: number;
  days: number;
  hours: number;
  minutes: number;
  seconds: number;
}

function calculateTimeRemaining(endTime: Date | string): TimeRemaining {
  const end = typeof endTime === "string" ? new Date(endTime).getTime() : endTime.getTime();
  const now = Date.now();
  const diff = Math.max(0, end - now);

  return {
    total: diff,
    days: Math.floor(diff / (1000 * 60 * 60 * 24)),
    hours: Math.floor((diff / (1000 * 60 * 60)) % 24),
    minutes: Math.floor((diff / (1000 * 60)) % 60),
    seconds: Math.floor((diff / 1000) % 60),
  };
}

export const FlashSalePopup: React.FC<FlashSalePopupProps> = ({
  config,
  isVisible,
  onClose,
  onExpiry,
  onCtaClick,
  issueDiscount,
}) => {
  const [timeRemaining, setTimeRemaining] = useState(() => {
    // Determine end time based on timer mode
    const timerMode = config.timer?.mode || 'duration';

    if (timerMode === 'fixed_end' && config.timer?.endTimeISO) {
      return calculateTimeRemaining(config.timer.endTimeISO);
    } else if (timerMode === 'personal' && config.timer?.personalWindowSeconds) {
      const endDate = new Date(Date.now() + config.timer.personalWindowSeconds * 1000);
      return calculateTimeRemaining(endDate);
    } else if (config.endTime) {
      return calculateTimeRemaining(config.endTime);
    } else if (config.countdownDuration) {
      const endDate = new Date(Date.now() + config.countdownDuration * 1000);
      return calculateTimeRemaining(endDate);
    }

    return { total: 0, days: 0, hours: 0, minutes: 0, seconds: 0 };
  });

  const [hasExpired, setHasExpired] = useState(false);
  const [inventoryTotal, setInventoryTotal] = useState<number | null>(null);
  const [reservationTime, setReservationTime] = useState<TimeRemaining | null>(null);
  const [hasClaimedDiscount, setHasClaimedDiscount] = useState(false);
  const [isClaimingDiscount, setIsClaimingDiscount] = useState(false);
  const [claimedDiscountCode, setClaimedDiscountCode] = useState<string | null>(null);
  const [discountError, setDiscountError] = useState<string | null>(null);



  // Fetch inventory if configured
  useEffect(() => {
    // In preview mode, avoid real API calls and rely on pseudo config only
    if ((config as any).previewMode) {
      if (!config.inventory || config.inventory.mode === 'pseudo') {
        if (config.inventory?.pseudoMax) {
          setInventoryTotal(config.inventory.pseudoMax);
        }
      }
      return;
    }

    if (!config.inventory || config.inventory.mode === 'pseudo') {
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
          params.set('productIds', JSON.stringify(config.inventory.productIds));
        }
        if (config.inventory?.variantIds?.length) {
          params.set('variantIds', JSON.stringify(config.inventory.variantIds));
        }
        if (config.inventory?.collectionIds?.length) {
          params.set('collectionIds', JSON.stringify(config.inventory.collectionIds));
        }

        const response = await fetch(`/apps/revenue-boost/api/inventory?${params.toString()}`);
        if (response.ok) {
          const data = await response.json();
          setInventoryTotal(data.total);
        }
      } catch (error) {
        console.error('[FlashSalePopup] Failed to fetch inventory:', error);
      }
    };

    fetchInventory();
    const interval = setInterval(fetchInventory, 10000); // Refresh every 10s
    return () => clearInterval(interval);
  }, [config.inventory]);

  // Update countdown timer
  useEffect(() => {
    if (!config.showCountdown || hasExpired) return;

    // Compute a fixed end timestamp once for this effect run
    const timerMode = config.timer?.mode || 'duration';
    let endTimestamp: number | null = null;

    if (timerMode === 'fixed_end' && config.timer?.endTimeISO) {
      endTimestamp = new Date(config.timer.endTimeISO).getTime();
    } else if (timerMode === 'personal' && config.timer?.personalWindowSeconds) {
      endTimestamp = Date.now() + config.timer.personalWindowSeconds * 1000;
    } else if (config.endTime) {
      endTimestamp = new Date(config.endTime).getTime();
    } else if (config.countdownDuration) {
      endTimestamp = Date.now() + config.countdownDuration * 1000;
    }

    if (!endTimestamp) return;

    const updateTimer = () => {
      const now = Date.now();
      const diff = Math.max(0, endTimestamp! - now);

      const newTime: TimeRemaining = {
        total: diff,
        days: Math.floor(diff / (1000 * 60 * 60 * 24)),
        hours: Math.floor((diff / (1000 * 60 * 60)) % 24),
        minutes: Math.floor((diff / (1000 * 60)) % 60),
        seconds: Math.floor((diff / 1000) % 60),
      };

      setTimeRemaining(newTime);

      if (newTime.total <= 0) {
        setHasExpired(true);
        if (onExpiry) {
          onExpiry();
        }

        const onExpireAction = config.timer?.onExpire || 'auto_hide';
        if (onExpireAction === 'auto_hide' || config.hideOnExpiry || config.autoHideOnExpire) {
          setTimeout(() => onClose(), config.autoHideOnExpire ? 2000 : 0);
        }
      }
    };

    // Run immediately so UI updates without 1s delay
    updateTimer();
    const timer = setInterval(updateTimer, 1000);

    return () => clearInterval(timer);
  }, [
    config.showCountdown,
    config.timer?.mode,
    config.timer?.endTimeISO,
    config.timer?.personalWindowSeconds,
    config.endTime,
    config.countdownDuration,
    hasExpired,
    onExpiry,
    onClose,
  ]);

  // Handle reservation timer
  useEffect(() => {
    // When reservation is disabled or misconfigured, clear any existing timer state
    if (!config.reserve?.enabled || !config.reserve?.minutes) {
      setReservationTime(null);
      return;
    }

    const reservationEnd = new Date(Date.now() + config.reserve.minutes * 60 * 1000);

    const updateReservation = () => {
      const remaining = calculateTimeRemaining(reservationEnd);
      setReservationTime(remaining);

      if (remaining.total <= 0) {
        setReservationTime(null);
      }
    };

    updateReservation();
    const interval = setInterval(updateReservation, 1000);
    return () => clearInterval(interval);
  }, [config.reserve]);

  const isPreview = (config as any).previewMode;
  const discount = (config.discount ?? (config as any).discount) as StorefrontDiscountConfig | undefined;
  // In preview, always behave as if a discount exists so the full flow can be exercised
  const hasDiscount = isPreview ? true : !!discount?.enabled;

  const isSoldOut = inventoryTotal !== null && inventoryTotal <= 0;
  const isSoldOutAndMissed =
    isSoldOut && config.inventory?.soldOutBehavior === 'missed_it';

  const getCartSubtotalCents = () => {
    const total = config.currentCartTotal;
    if (typeof total === 'number' && Number.isFinite(total)) {
      return Math.round(total * 100);
    }
    return undefined;
  };

  const getCtaLabel = () => {
    if (hasExpired || isSoldOutAndMissed) {
      return config.buttonText || config.ctaText || 'Offer unavailable';
    }
    if (isClaimingDiscount) {
      return 'Applying...';
    }
    if (hasDiscount && !hasClaimedDiscount) {
      return config.buttonText || config.ctaText || 'Get this offer';
    }
    return config.buttonText || config.ctaText || 'Shop Now';
  };

  const handleCtaClick = async () => {
    const canClaimDiscount =
      hasDiscount &&
      !hasClaimedDiscount &&
      !hasExpired &&
      !isSoldOutAndMissed;

    if (canClaimDiscount) {
      setDiscountError(null);
      setIsClaimingDiscount(true);
      try {
        if (issueDiscount) {
          const cartSubtotalCents = getCartSubtotalCents();
          const result = await issueDiscount(
            cartSubtotalCents ? { cartSubtotalCents } : undefined,
          );
          if (result?.code) {
            setClaimedDiscountCode(result.code);
          }
          setHasClaimedDiscount(true);
        }
      } catch (error) {
        console.error('[FlashSalePopup] Failed to claim discount:', error);
        setDiscountError('Something went wrong applying your discount. Please try again.');
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
        window.open(config.ctaUrl, '_blank', 'noopener,noreferrer');
      } else {
        window.location.href = config.ctaUrl;
      }
    }
  };

  if (!isVisible) return null;

  if (isSoldOut && config.inventory?.soldOutBehavior === 'hide') {
    return null;
  }

  // Determine discount display message
  const getDiscountMessage = () => {
    const dc = config.discountConfig;

    if (dc?.tiers?.length) {
      // Tiered discount
      const tiers = dc.tiers.map((t: any) => {
        const threshold = (t.thresholdCents / 100).toFixed(0);
        if (t.discount.kind === 'free_shipping') return `$${threshold} free ship`;
        return `$${threshold} get ${t.discount.value}${t.discount.kind === 'percentage' ? '%' : '$'} off`;
      });
      return `Spend more, save more: ${tiers.join(', ')}`;
    }

    if (dc?.bogo) {
      const buy = dc.bogo.buy.quantity;
      const get = dc.bogo.get.quantity;
      if (dc.bogo.get.discount.kind === 'free_product') {
        return `Buy ${buy} Get ${get} Free`;
      }
      return `Buy ${buy} Get ${get} at ${dc.bogo.get.discount.value}% off`;
    }

    if (dc?.freeGift) {
      const min = dc.freeGift.minSubtotalCents ? `over $${(dc.freeGift.minSubtotalCents / 100).toFixed(0)}` : '';
      return `Free gift with purchase ${min}`.trim();
    }

    // Basic discount
    if (config.discountPercentage) {
      return `${config.discountPercentage}% OFF`;
    }

    return null;
  };

  // Size configuration
  const popupSize = config.popupSize || 'wide';
  const maxWidth = popupSize === 'compact' ? '24rem' :
                   popupSize === 'wide' ? '56rem' :
                   popupSize === 'full' ? '90%' : '32rem';

  const padding = popupSize === 'compact' ? '2rem 1.5rem' :
                  popupSize === 'wide' || popupSize === 'full' ? '3rem' : '2.5rem 2rem';

  const headlineSize = popupSize === 'compact' ? '2rem' :
                       popupSize === 'wide' || popupSize === 'full' ? '3rem' : '2.5rem';

  const discountSize = popupSize === 'compact' ? '6rem' :
                       popupSize === 'wide' || popupSize === 'full' ? '10rem' : '8rem';

  const discountMessage = getDiscountMessage();

  // Respect presentation.showInventory flag from content config (admin toggle)
  const presentationShowInventory = config.presentation?.showInventory !== false;

  const showInventory = presentationShowInventory &&
                        config.inventory?.showOnlyXLeft &&
                        inventoryTotal !== null &&
                        inventoryTotal <= (config.inventory?.showThreshold || 10);

  const displayMode = config.displayMode || 'modal';

  // Banner layout for flash sale (top/bottom announcement bar)
  if (displayMode === 'banner') {
    const bannerPosition = config.position === 'bottom' ? 'bottom' : 'top';

    return (
      <>
        <style>{`
          .flash-sale-banner {
            font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif;
          }
          .flash-sale-banner-inner {
            max-width: 1200px;
            margin: 0 auto;
            padding: 1rem 1.5rem;
            display: flex;
            align-items: center;
            justify-content: space-between;
            gap: 1.25rem;
            position: relative;
            padding-right: 3.5rem;
          }
          .flash-sale-banner-left {
            flex: 1;
            min-width: 0;
          }
          .flash-sale-banner-badge {
            display: inline-flex;
            align-items: center;
            gap: 0.5rem;
            padding: 0.25rem 0.75rem;
            border-radius: 9999px;
            font-size: 0.75rem;
            font-weight: 700;
            letter-spacing: 0.08em;
            text-transform: uppercase;
            margin-bottom: 0.25rem;
            background: ${config.accentColor || '#ef4444'};
            color: ${config.backgroundColor || '#ffffff'};
          }
          .flash-sale-banner-headline {
            font-size: 1.125rem;
            font-weight: 700;
            line-height: 1.4;
            margin: 0 0 0.25rem 0;
          }
          .flash-sale-banner-subheadline {
            font-size: 0.875rem;
            line-height: 1.4;
            margin: 0;
            opacity: 0.9;
          }
          .flash-sale-banner-discount {
            margin-top: 0.5rem;
            font-size: 0.875rem;
            font-weight: 600;
          }
          .flash-sale-banner-center {
            display: flex;
            flex-direction: column;
            align-items: center;
            gap: 0.5rem;
          }
          .flash-sale-banner-timer {
            display: flex;
            gap: 0.5rem;
            align-items: center;
          }
          .flash-sale-banner-timer-unit {
            display: flex;
            flex-direction: column;
            align-items: center;
            padding: 0.5rem 0.75rem;
            border-radius: 0.375rem;
            min-width: 3.25rem;
          }
          .flash-sale-banner-timer-value {
            font-size: 1.35rem;
            font-weight: 700;
            line-height: 1;
            font-variant-numeric: tabular-nums;
          }
          .flash-sale-banner-timer-label {
            font-size: 0.625rem;
            text-transform: uppercase;
            opacity: 0.85;
            margin-top: 0.15rem;
            letter-spacing: 0.5px;
          }
          .flash-sale-banner-timer-separator {
            font-size: 1.25rem;
            font-weight: 700;
            opacity: 0.6;
          }
          .flash-sale-banner-stock {
            font-size: 0.75rem;
            font-weight: 600;
            padding: 0.25rem 0.75rem;
            border-radius: 999px;
            background: rgba(255, 255, 255, 0.2);
            white-space: nowrap;
          }
          .flash-sale-banner-reservation {
            font-size: 0.75rem;
            font-weight: 500;
            opacity: 0.9;
          }
          .flash-sale-banner-right {
            display: flex;
            align-items: center;
            gap: 0.75rem;
          }
          .flash-sale-banner-cta {
            padding: 0.75rem 1.5rem;
            font-size: 0.95rem;
            font-weight: 600;
            border: none;
            border-radius: 0.375rem;
            cursor: pointer;
            white-space: nowrap;
            transition: transform 0.2s, box-shadow 0.2s;
            box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
          }
          .flash-sale-banner-cta:hover:not(:disabled) {
            transform: translateY(-1px);
            box-shadow: 0 4px 8px rgba(0, 0, 0, 0.15);
          }
          .flash-sale-banner-cta:disabled {
            opacity: 0.5;
            cursor: not-allowed;
          }
          .flash-sale-banner-close {
            position: absolute;
            top: 0.75rem;
            right: 0.75rem;
            background: transparent;
            border: none;
            font-size: 1.5rem;
            line-height: 1;
            cursor: pointer;
            opacity: 0.7;
            transition: opacity 0.2s;
            padding: 0.25rem;
            width: 2rem;
            height: 2rem;
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
            font-size: 0.875rem;
          }
          @media (max-width: 768px) {
            .flash-sale-banner-inner {
              flex-direction: column;
              padding: 1.1rem 1rem;
              gap: 0.75rem;
              text-align: center;
              padding-right: 3rem;
            }
            .flash-sale-banner-right {
              width: 100%;
              justify-content: center;
            }
            .flash-sale-banner-cta {
              width: 100%;
            }
            .flash-sale-banner-headline {
              font-size: 1rem;
            }
            .flash-sale-banner-subheadline {
              font-size: 0.8125rem;
            }
          }
        `}</style>

        <div
          className="flash-sale-banner"
          style={{
            position: 'fixed',
            [bannerPosition]: 0,
            left: 0,
            right: 0,
            zIndex: 9999,
            background: config.backgroundColor || '#111827',
            color: config.textColor || '#ffffff',
            boxShadow:
              bannerPosition === 'bottom'
                ? '0 -2px 8px rgba(0, 0, 0, 0.15)'
                : '0 2px 8px rgba(0, 0, 0, 0.15)',
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
              <div className="flash-sale-banner-badge">
                Limited Time Offer
              </div>
              <h2 className="flash-sale-banner-headline">
                {config.headline || 'Flash Sale!'}
              </h2>
              {config.subheadline && (
                <p className="flash-sale-banner-subheadline">{config.subheadline}</p>
              )}
              {(claimedDiscountCode || discountMessage) && (
                <div className="flash-sale-banner-discount">
                  {claimedDiscountCode ? (
                    <>
                      Use code <strong>{claimedDiscountCode}</strong> at checkout.
                    </>
                  ) : (
                    discountMessage
                  )}
                </div>
              )}
            </div>

            <div className="flash-sale-banner-center">
              {isSoldOut && config.inventory?.soldOutBehavior === 'missed_it' ? (
                <div className="flash-sale-banner-expired">
                  {config.inventory?.soldOutMessage || 'This deal is sold out. Check back later!'}
                </div>
              ) : hasExpired ? (
                <div className="flash-sale-banner-expired">
                  {config.timer?.expiredMessage || 'Sale ended'}
                </div>
              ) : (
                <>
                  {config.showCountdown && timeRemaining.total > 0 && (
                    <div className="flash-sale-banner-timer">
                      {timeRemaining.days > 0 && (
                        <>
                          <div
                            className="flash-sale-banner-timer-unit"
                            style={{
                              background: config.accentColor ? `${config.accentColor}20` : 'rgba(239, 68, 68, 0.15)',
                              color: config.accentColor || '#ffffff',
                            }}
                          >
                            <div className="flash-sale-banner-timer-value">
                              {String(timeRemaining.days).padStart(2, '0')}
                            </div>
                            <div className="flash-sale-banner-timer-label">Days</div>
                          </div>
                          <span
                            className="flash-sale-banner-timer-separator"
                          >
                            :
                          </span>
                        </>
                      )}

                      <div
                        className="flash-sale-banner-timer-unit"
                        style={{
                          background: config.accentColor ? `${config.accentColor}20` : 'rgba(239, 68, 68, 0.15)',
                          color: config.accentColor || '#ffffff',
                        }}
                      >
                        <div className="flash-sale-banner-timer-value">
                          {String(timeRemaining.hours).padStart(2, '0')}
                        </div>
                        <div className="flash-sale-banner-timer-label">Hours</div>
                      </div>

                      <span className="flash-sale-banner-timer-separator">:</span>

                      <div
                        className="flash-sale-banner-timer-unit"
                        style={{
                          background: config.accentColor ? `${config.accentColor}20` : 'rgba(239, 68, 68, 0.15)',
                          color: config.accentColor || '#ffffff',
                        }}
                      >
                        <div className="flash-sale-banner-timer-value">
                          {String(timeRemaining.minutes).padStart(2, '0')}
                        </div>
                        <div className="flash-sale-banner-timer-label">Mins</div>
                      </div>

                      <span className="flash-sale-banner-timer-separator">:</span>

                      <div
                        className="flash-sale-banner-timer-unit"
                        style={{
                          background: config.accentColor ? `${config.accentColor}20` : 'rgba(239, 68, 68, 0.15)',
                          color: config.accentColor || '#ffffff',
                        }}
                      >
                        <div className="flash-sale-banner-timer-value">
                          {String(timeRemaining.seconds).padStart(2, '0')}
                        </div>
                        <div className="flash-sale-banner-timer-label">Secs</div>
                      </div>
                    </div>
                  )}

                  {showInventory && inventoryTotal !== null && (
                    <div className="flash-sale-banner-stock">
                      ⚡ Only {inventoryTotal} left in stock
                    </div>
                  )}

                  {reservationTime && reservationTime.total > 0 && (
                    <div className="flash-sale-banner-reservation">
                      {(config.reserve?.label || 'Offer reserved for:') + ' '}
                      {reservationTime.minutes}:{String(reservationTime.seconds).padStart(2, '0')}
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
                  disabled={
                    hasExpired ||
                    isSoldOutAndMissed ||
                    isClaimingDiscount
                  }
                  style={{
                    background: config.buttonColor || config.accentColor || '#ffffff',
                    color: config.buttonTextColor || config.textColor || '#111827',
                    borderRadius: typeof config.borderRadius === 'number'
                      ? `${config.borderRadius}px`
                      : (config.borderRadius || '6px'),
                  }}
                >
                  {getCtaLabel()}
                </button>
              )}
            </div>
          </div>
        </div>
      </>
    );
  }


  return (
    <PopupPortal
      isVisible={isVisible}
      onClose={onClose}
      backdrop={{
        color: config.overlayColor || 'rgba(0, 0, 0, 0.7)',
        opacity: config.overlayOpacity ?? 0.7,
        blur: 4,
      }}
      animation={{
        type: config.animation || 'zoom',
      }}
      position={config.position || 'center'}
      closeOnEscape={config.closeOnEscape !== false}
      closeOnBackdropClick={config.closeOnOverlayClick !== false}
      previewMode={config.previewMode}
      ariaLabel={config.ariaLabel || config.headline || 'Flash Sale'}
      ariaDescribedBy={config.ariaDescribedBy}
    >
      <style>{`
        .flash-sale-container {
          position: relative;
          width: 100%;
          max-width: ${maxWidth};
          border-radius: ${typeof config.borderRadius === 'number' ? config.borderRadius : parseFloat(config.borderRadius || '16')}px;
          overflow: hidden;
          box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.25);
          background: ${config.backgroundColor || '#ffffff'};
          color: ${config.textColor || '#111827'};
          font-family: ${config.fontFamily || 'inherit'};
        }

        .flash-sale-close {
          position: absolute;
          top: 1rem;
          right: 1rem;
          z-index: 10;
          padding: 0.5rem;
          border-radius: 9999px;
          background: rgba(0, 0, 0, 0.1);
          border: none;
          cursor: pointer;
          transition: background 0.2s;
          color: ${config.descriptionColor || config.textColor || '#52525b'};
        }

        .flash-sale-close:hover {
          background: rgba(0, 0, 0, 0.2);
        }

        .flash-sale-content {
          padding: ${padding};
          text-align: center;
        }

        .flash-sale-badge {
          display: inline-block;
          padding: 0.5rem 1.5rem;
          border-radius: 9999px;
          font-size: 0.875rem;
          font-weight: 700;
          letter-spacing: 0.05em;
          margin-bottom: 1rem;
          text-transform: uppercase;
          background: ${config.accentColor || '#ef4444'};
          color: ${config.backgroundColor || '#ffffff'};
        }

        .flash-sale-headline {
          font-size: ${headlineSize};
          font-weight: 900;
          line-height: 1.1;
          margin-bottom: 0.75rem;
          color: ${config.textColor || '#111827'};
        }

        .flash-sale-supporting {
          font-size: 1.125rem;
          line-height: 1.6;
          margin-bottom: 2rem;
          color: ${config.descriptionColor || config.textColor || '#52525b'};
        }

        .flash-sale-discount-message {
          font-size: 1rem;
          font-weight: 600;
          padding: 1rem 1.5rem;
          border-radius: 0.5rem;
          margin-bottom: 1.5rem;
          background: ${config.accentColor ? `${config.accentColor}15` : 'rgba(239, 68, 68, 0.1)'};
          color: ${config.accentColor || '#ef4444'};
          border: 2px solid ${config.accentColor ? `${config.accentColor}40` : 'rgba(239, 68, 68, 0.25)'};
        }

        .flash-sale-urgency {
          font-size: 0.875rem;
          font-weight: 600;
          text-transform: uppercase;
          letter-spacing: 0.1em;
          margin-bottom: 1rem;
          color: ${config.descriptionColor || config.textColor || '#52525b'};
        }

        .flash-sale-timer {
          display: flex;
          gap: 0.75rem;
          justify-content: center;
          margin-bottom: 1.5rem;
        }

        .flash-sale-timer-unit {
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 0.5rem;
          min-width: 4rem;
          padding: 1rem 0.75rem;
          border-radius: 0.5rem;
          background: ${config.accentColor ? `${config.accentColor}20` : 'rgba(239, 68, 68, 0.1)'};
          color: ${config.accentColor || '#ef4444'};
        }

        .flash-sale-timer-value {
          font-size: 2rem;
          font-weight: 900;
          line-height: 1;
        }

        .flash-sale-timer-label {
          font-size: 0.75rem;
          font-weight: 500;
          text-transform: uppercase;
          letter-spacing: 0.05em;
          opacity: 0.8;
        }

        .flash-sale-inventory {
          display: inline-flex;
          align-items: center;
          gap: 0.5rem;
          padding: 0.75rem 1.25rem;
          border-radius: 9999px;
          font-size: 0.875rem;
          font-weight: 600;
          margin-bottom: 1.5rem;
          background: ${config.accentColor ? `${config.accentColor}20` : 'rgba(239, 68, 68, 0.1)'};
          color: ${config.accentColor || '#ef4444'};
        }

        .flash-sale-inventory-dot {
          width: 0.5rem;
          height: 0.5rem;
          border-radius: 9999px;
          background: ${config.accentColor || '#ef4444'};
          animation: pulse 2s infinite;
        }

        .flash-sale-reservation {
          font-size: 0.875rem;
          padding: 0.75rem 1rem;
          border-radius: 0.5rem;
          margin-bottom: 1rem;
          background: rgba(59, 130, 246, 0.1);
          color: #3b82f6;
          border: 1px solid rgba(59, 130, 246, 0.3);
        }

        .flash-sale-cta {
          width: 100%;
          padding: 1rem 2rem;
          border-radius: 0.5rem;
          border: none;
          font-size: 1.125rem;
          font-weight: 700;
          cursor: pointer;
          transition: all 0.2s;
          text-transform: uppercase;
          letter-spacing: 0.05em;
          background: ${config.buttonColor || config.accentColor || '#ef4444'};
          color: ${config.buttonTextColor || '#ffffff'};
        }

        .flash-sale-cta:hover {
          transform: translateY(-2px);
          box-shadow: 0 10px 25px -5px rgba(0, 0, 0, 0.3);
        }

        .flash-sale-cta:disabled {
          opacity: 0.5;
          cursor: not-allowed;
        }

        .flash-sale-secondary-cta {
          margin-top: 0.75rem;
          width: 100%;
          padding: 0.75rem 2rem;
          border-radius: 0.5rem;
          border: 1px solid rgba(148, 163, 184, 0.6);
          background: transparent;
          color: ${config.textColor || '#e5e7eb'};
          font-size: 0.875rem;
          font-weight: 500;
          cursor: pointer;
        }

        .flash-sale-secondary-cta:hover {
          background: rgba(15, 23, 42, 0.08);
        }

        .flash-sale-expired {
          padding: 2rem;
          text-align: center;
        }

        .flash-sale-sold-out {
          padding: 2rem;
          text-align: center;
        }

        @keyframes pulse {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.5; }
        }

        @media (max-width: 640px) {
          .flash-sale-content {
            padding: 2rem 1.5rem;
          }

          .flash-sale-headline {
            font-size: 2rem;
          }

          .flash-sale-timer-unit {
            min-width: 3.5rem;
            padding: 0.75rem 0.5rem;
          }

          .flash-sale-timer-value {
            font-size: 1.5rem;
          }
        }
      `}</style>

      <div className="flash-sale-container">
        <button
          onClick={onClose}
          className="flash-sale-close"
          aria-label="Close popup"
        >
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <line x1="18" y1="6" x2="6" y2="18" />
            <line x1="6" y1="6" x2="18" y2="18" />
          </svg>
        </button>

        {isSoldOut && config.inventory?.soldOutBehavior === 'missed_it' ? (
          <div className="flash-sale-sold-out">
            <h3 style={{ marginBottom: '0.5rem', fontSize: '1.5rem', fontWeight: '700' }}>
              You Missed It!
            </h3>
            <p style={{ opacity: 0.8 }}>
              {config.inventory.soldOutMessage || 'This deal is sold out. Check back later!'}
            </p>
          </div>
        ) : hasExpired ? (
          <div className="flash-sale-expired">
            <h3 style={{ marginBottom: '0.5rem', fontSize: '1.5rem', fontWeight: '700' }}>
              Sale Ended
            </h3>
            <p style={{ opacity: 0.8 }}>
              {config.timer?.expiredMessage || 'This flash sale has expired. Check back soon for more deals!'}
            </p>
          </div>
        ) : (
          <div className="flash-sale-content">
            <div className="flash-sale-badge">
              Limited Time
            </div>

            <h2 className="flash-sale-headline">
              {config.headline || 'Flash Sale!'}
            </h2>

            <p className="flash-sale-supporting">
              {config.subheadline || "Limited time offer - Don't miss out!"}
            </p>

            {(claimedDiscountCode || discountMessage) && (
              <div className="flash-sale-discount-message">
                {claimedDiscountCode ? (
                  <>
                    Use code <strong>{claimedDiscountCode}</strong> at checkout.
                  </>
                ) : (
                  discountMessage
                )}
              </div>
            )}

            {config.urgencyMessage && (
              <div className="flash-sale-urgency">
                {config.urgencyMessage}
              </div>
            )}

            {config.showCountdown && timeRemaining.total > 0 && (
              <div className="flash-sale-timer">
                {timeRemaining.days > 0 && (
                  <div className="flash-sale-timer-unit">
                    <div className="flash-sale-timer-value">
                      {String(timeRemaining.days).padStart(2, "0")}
                    </div>
                    <div className="flash-sale-timer-label">Days</div>
                  </div>
                )}
                <div className="flash-sale-timer-unit">
                  <div className="flash-sale-timer-value">
                    {String(timeRemaining.hours).padStart(2, "0")}
                  </div>
                  <div className="flash-sale-timer-label">Hours</div>
                </div>
                <div className="flash-sale-timer-unit">
                  <div className="flash-sale-timer-value">
                    {String(timeRemaining.minutes).padStart(2, "0")}
                  </div>
                  <div className="flash-sale-timer-label">Mins</div>
                </div>
                <div className="flash-sale-timer-unit">
                  <div className="flash-sale-timer-value">
                    {String(timeRemaining.seconds).padStart(2, "0")}
                  </div>
                  <div className="flash-sale-timer-label">Secs</div>
                </div>
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
                {config.reserve?.label || 'Offer reserved for:'} {reservationTime.minutes}:{String(reservationTime.seconds).padStart(2, '0')}
                {config.reserve?.disclaimer && (
                  <div style={{ fontSize: '0.75rem', marginTop: '0.25rem', opacity: 0.7 }}>
                    {config.reserve.disclaimer}
                  </div>
                )}
              </div>
            )}

            <button
              onClick={handleCtaClick}
              className="flash-sale-cta"
              disabled={
                hasExpired ||
                isSoldOutAndMissed ||
                isClaimingDiscount
              }
            >
              {getCtaLabel()}
            </button>

            <button
              type="button"
              onClick={onClose}
              className="flash-sale-secondary-cta"
            >
              {config.dismissLabel || 'No thanks'}
            </button>
          </div>
        )}
      </div>
    </PopupPortal>
  );
};

export default FlashSalePopup;
