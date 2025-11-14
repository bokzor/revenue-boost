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

import React, { useEffect, useState, useRef } from 'react';
import type { PopupDesignConfig, DiscountConfig as StorefrontDiscountConfig } from './types';
import type { FreeShippingContent } from '~/domains/campaigns/types/campaign';
import { debounce } from './utils';

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
  issueDiscount?: (options?: { cartSubtotalCents?: number }) => Promise<{ code?: string; autoApplyMode?: string } | null>;
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
  const barPosition = config.barPosition || 'top'; // Use barPosition instead of position
  const nearMissThreshold = config.nearMissThreshold ?? 10;
  const currency = config.currency || '$';
  const dismissible = config.dismissible ?? true;
  const celebrateOnUnlock = config.celebrateOnUnlock ?? true;
  const showIcon = config.showIcon ?? true;
  const animationDuration = config.animationDuration ?? 500;
  const discount = config.discount as StorefrontDiscountConfig | undefined;
  const requireEmailToClaim = (config as any).requireEmailToClaim ?? false;
  const claimButtonLabel = (config as any).claimButtonLabel || 'Claim discount';
  const claimEmailPlaceholder = (config as any).claimEmailPlaceholder || 'Enter your email';
  const claimSuccessMessage = (config as any).claimSuccessMessage as string | undefined;
  const claimErrorMessage = (config as any).claimErrorMessage as string | undefined;

  const [internalDismissed, setInternalDismissed] = useState(false);
  const [celebrating, setCelebrating] = useState(false);
  const [isEntering, setIsEntering] = useState(false);
  const [isExiting, setIsExiting] = useState(false);
  const [showClaimForm, setShowClaimForm] = useState(false);
  const [claimEmail, setClaimEmail] = useState('');
  const [claimError, setClaimError] = useState<string | null>(null);
  const [isClaiming, setIsClaiming] = useState(false);
  const [hasClaimed, setHasClaimed] = useState(false);
  const [claimedDiscountCode, setClaimedDiscountCode] = useState<string | undefined>(undefined);
  const prevUnlockedRef = useRef(false);
  const hasIssuedDiscountRef = useRef(false);
  const currencyCodeRef = useRef<string | undefined>(undefined);
  const bannerRef = useRef<HTMLDivElement>(null);

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

  // Handle close with exit animation
  const handleClose = () => {
    if (!dismissible) return;

    setIsExiting(true);
    setTimeout(() => {
      setInternalDismissed(true);
      onClose();
      setIsExiting(false);
    }, 300); // Match animation duration
  };

  const formatCurrency = (value: number) => {
    const code = currencyCodeRef.current;
    if (code && /^[A-Z]{3}$/.test(code)) {
      try {
        return new Intl.NumberFormat('en-US', { style: 'currency', currency: code }).format(value);
      } catch {
        // Fallback below
      }
    }
    return `${currency}${value.toFixed(2)}`;
  };

  // Handle enter animation on mount
  useEffect(() => {
    if (isVisible && !internalDismissed) {
      setIsEntering(true);
      const timer = setTimeout(() => setIsEntering(false), 300);
      return () => clearTimeout(timer);
    }
  }, [isVisible, internalDismissed]);

  // Add body padding to prevent content overlap
  useEffect(() => {
    if (!isVisible || internalDismissed || config.previewMode) return;

    const updateBodyPadding = () => {
      if (!bannerRef.current) return;

      const height = bannerRef.current.offsetHeight;
      if (barPosition === 'top') {
        document.body.style.paddingTop = `${height}px`;
      } else {
        document.body.style.paddingBottom = `${height}px`;
      }
    };

    // Update padding after animation completes
    const timer = setTimeout(updateBodyPadding, 350);

    return () => {
      clearTimeout(timer);
      document.body.style.paddingTop = '';
      document.body.style.paddingBottom = '';
    };
  }, [isVisible, internalDismissed, barPosition, config.previewMode]);

  // Read currency ISO from app embed if available
  useEffect(() => {
    try {
      const w: any = window as any;
      const iso = w?.REVENUE_BOOST_CONFIG?.currency;
      if (typeof iso === 'string') {
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
        const res = await fetch('/cart.js', { credentials: 'same-origin' });
        const cart = await res.json();
        const cents = (typeof cart?.subtotal_price === 'number')
          ? cart.subtotal_price
          : (Number(cart?.items_subtotal_price || 0) - Number(cart?.total_discount || 0));
        const value = Number.isFinite(cents) ? Math.max(0, cents / 100) : 0;
        setCartTotal(value);
      } catch {
        // ignore network errors
      }
    };

    const debouncedRefresh = debounce(refresh, 300);
    const eventNames = ['cart:update','cart:change','cart:updated','theme:cart:update','cart:item-added','cart:add'];
    eventNames.forEach((name) => document.addEventListener(name, debouncedRefresh as any));

    // Initial sync if no initial cart total was provided
    if (propCartTotal == null && config.currentCartTotal == null) {
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
          const urlStr = typeof url === 'string' ? url : url?.toString?.();
          const method = (opts as any)?.method ? String((opts as any).method).toUpperCase() : 'GET';
          const isCartMutation = !!urlStr && urlStr.includes('/cart') && method !== 'GET';
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
        console.error('[FreeShippingPopup] Failed to restore fetch:', error);
      }
    };
  }, [isVisible]);

  // In preview mode (admin), allow external control of cart total via prop or config
  useEffect(() => {
    if ((config as any)?.previewMode) {
      const next = typeof propCartTotal === 'number'
        ? propCartTotal
        : (typeof config.currentCartTotal === 'number' ? config.currentCartTotal : undefined);
      if (typeof next === 'number') setCartTotal(next);
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
        return (config.nearMissMessage || "Only {remaining} to go!").replace("{remaining}", remainingFormatted);
      case "progress":
      default:
        return (config.progressMessage || "You're {remaining} away from free shipping").replace("{remaining}", remainingFormatted);
    }
  };

  const handleClaimSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    const email = claimEmail.trim();
    if (!email) {
      setClaimError('Please enter your email');
      return;
    }

    setIsClaiming(true);
    setClaimError(null);

    try {
      if ((config as any)?.previewMode) {
        await new Promise((resolve) => setTimeout(resolve, 800));
        setHasClaimed(true);
        console.log('[FreeShippingPopup] Preview claim simulated');
      } else if (onSubmit) {
        const code = await onSubmit({ email });
        if (code) setClaimedDiscountCode(code);
        setHasClaimed(true);
        console.log('[FreeShippingPopup] Discount claim successful', {
          email,
          hasCode: Boolean(code),
        });
      } else {
        setHasClaimed(true);
        console.log('[FreeShippingPopup] Claim completed without onSubmit handler');
      }
    } catch (error) {
      console.error('[FreeShippingPopup] Claim submission error:', error);
      setClaimError(claimErrorMessage || 'Something went wrong. Please try again.');
    } finally {
      setIsClaiming(false);
    }
  };

  // Trigger celebration animation, logging, and discount issuance when unlocking
  useEffect(() => {
    const isUnlocked = state === "unlocked";
    const wasLocked = prevUnlockedRef.current === false;

    if (isUnlocked && wasLocked) {
      console.log('[FreeShippingPopup] Free shipping unlocked', {
        threshold,
        cartTotal,
        deliveryMode: discount?.deliveryMode,
      });

      if (discount?.deliveryMode === 'auto_apply_only') {
        console.log('[FreeShippingPopup] Auto-apply mode active for free shipping', {
          threshold,
          cartTotal,
        });
      }

      // For non-email-gated flows, issue a discount code when the bar first unlocks
      if (!requireEmailToClaim && discount && typeof issueDiscount === 'function' && !hasIssuedDiscountRef.current) {
        hasIssuedDiscountRef.current = true;
        const cartSubtotalCents = Math.round(cartTotal * 100);

        (async () => {
          try {
            const result = await issueDiscount({ cartSubtotalCents });
            if (result?.code) {
              setClaimedDiscountCode(result.code);
              console.log('[FreeShippingPopup] Discount code issued for free shipping', {
                code: result.code,
              });
            } else if (result && !result.code) {
              console.log('[FreeShippingPopup] Discount issued without code (possible auto-apply only mode)');
            }
          } catch (err) {
            console.error('[FreeShippingPopup] Failed to issue discount code:', err);
          }
        })();
      }
    }

    if (isUnlocked && wasLocked && celebrateOnUnlock) {
      setCelebrating(true);
      const timer = setTimeout(() => setCelebrating(false), 1000);
      return () => clearTimeout(timer);
    }

    prevUnlockedRef.current = isUnlocked;
  }, [state, celebrateOnUnlock, threshold, cartTotal, discount, issueDiscount, requireEmailToClaim]);

  // Don't render if not visible and not animating out
  if ((!isVisible || internalDismissed) && !isExiting) {
    return null;
  }

  // Get progress bar color based on state
  const getProgressColor = () => {
    if (state === "unlocked") return config.accentColor || '#10B981';
    if (state === "near-miss") return '#F59E0B'; // Warning color
    return config.accentColor || '#3B82F6'; // Primary color
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
        }

        .free-shipping-bar[data-position="top"] {
          top: 0;
          animation: slideInFromTop 0.3s ease-out forwards;
        }

        .free-shipping-bar[data-position="bottom"] {
          bottom: 0;
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
          justify-content: space-between;
          gap: 1rem;
          padding: 0.875rem 1.5rem;
          position: relative;
          overflow: hidden;
        }

        .free-shipping-bar.celebrating {
          animation: celebrate-bar 0.65s ease-in-out;
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
          gap: 0.75rem;
          flex: 1;
          z-index: 1;
        }

        .free-shipping-bar-icon {
          font-size: 1.25rem;
          line-height: 1;
          flex-shrink: 0;
        }

        .free-shipping-bar-text {
          font-size: 0.9375rem;
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
          margin-top: 0.25rem;
          display: flex;
          flex-wrap: wrap;
          gap: 0.5rem;
          align-items: center;
          justify-content: flex-end;
        }

        .free-shipping-bar-claim-input {
          min-width: 160px;
          padding: 0.35rem 0.5rem;
          border-radius: 4px;
          border: 1px solid rgba(0, 0, 0, 0.15);
          font-size: 0.875rem;
        }

        .free-shipping-bar-claim-button {
          padding: 0.35rem 0.75rem;
          border-radius: 9999px;
          border: none;
          cursor: pointer;
          font-size: 0.875rem;
          font-weight: 500;
        }

        .free-shipping-bar-claim-error {
          margin: 0.25rem 0 0;
          font-size: 0.75rem;
          color: #b91c1c;
        }

        .free-shipping-bar-close {
          background: transparent;
          border: none;
          cursor: pointer;
          padding: 0.25rem;
          display: flex;
          align-items: center;
          justify-content: center;
          opacity: 0.6;
          transition: opacity 0.2s;
          z-index: 1;
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

        .free-shipping-bar-progress {
          position: absolute;
          left: 0;
          top: 0;
          bottom: 0;
          background: var(--shipping-bar-progress-bg);
          transition: width ${animationDuration}ms ease-out;
          z-index: 0;
        }

        .free-shipping-bar[data-state="unlocked"] .free-shipping-bar-progress {
          animation: ${celebrating ? "celebrate 1s ease-in-out" : "none"};
        }

        @keyframes celebrate {
          0%, 100% { transform: translateX(0); }
          25% { transform: translateX(-5px); }
          50% { transform: translateX(5px); }
          75% { transform: translateX(-5px); }
        }

        @media (prefers-reduced-motion: reduce) {
          .free-shipping-bar,
          .free-shipping-bar-progress {
            transition: none;
          }

          .free-shipping-bar[data-position="top"],
          .free-shipping-bar[data-position="bottom"] {
            animation: none !important;
          }

          .free-shipping-bar[data-state="unlocked"] .free-shipping-bar-progress {
            animation: none;
          }
        }

        @media (max-width: 640px) {
          .free-shipping-bar-content {
            padding: 0.75rem 1rem;
            gap: 0.75rem;
          }

          .free-shipping-bar-text {
            font-size: 0.875rem;
          }

          .free-shipping-bar-icon {
            font-size: 1.125rem;
          }
        }
      `}</style>

      <div
        ref={bannerRef}
        className={`free-shipping-bar ${isExiting ? 'exiting' : ''} ${celebrating ? 'celebrating' : ''}`}
        data-position={barPosition}
        data-state={state}
        role="region"
        aria-live="polite"
        aria-atomic="true"
        style={{
          position: (config as any)?.previewMode ? 'absolute' : undefined,
          background: config.backgroundColor || '#ffffff',
          color: config.textColor || '#111827',
          ['--shipping-bar-progress-bg' as any]: getProgressColor(),
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
          <div className="free-shipping-bar-message">
            {showIcon && (
              <span className="free-shipping-bar-icon" aria-hidden="true">
                {getIcon()}
              </span>
            )}
            <p className="free-shipping-bar-text">{getMessage()}</p>

            {state === "unlocked" && requireEmailToClaim && !hasClaimed && (
              <div className="free-shipping-bar-claim-container">
                {!showClaimForm && (
                  <button
                    type="button"
                    className="free-shipping-bar-claim-button"
                    onClick={() => setShowClaimForm(true)}
                    style={{ background: config.buttonColor || '#111827', color: config.buttonTextColor || '#ffffff' }}
                  >
                    {claimButtonLabel}
                  </button>
                )}

                {showClaimForm && (
                  <form className="free-shipping-bar-claim-container" onSubmit={handleClaimSubmit}>
                    <input
                      type="email"
                      className="free-shipping-bar-claim-input"
                      value={claimEmail}
                      onChange={(e) => setClaimEmail(e.target.value)}
                      placeholder={claimEmailPlaceholder}
                    />
                    <button
                      type="submit"
                      className="free-shipping-bar-claim-button"
                      disabled={isClaiming}
                      style={{ background: config.buttonColor || '#111827', color: config.buttonTextColor || '#ffffff' }}
                    >
                      {isClaiming ? 'Claiming...' : claimButtonLabel}
                    </button>
                  </form>
                )}

                {claimError && (
                  <p className="free-shipping-bar-claim-error">{claimError}</p>
                )}
              </div>
            )}

            {state === "unlocked" && discount && (!requireEmailToClaim || hasClaimed) && (
              discount.deliveryMode === 'auto_apply_only' ? (
                <p className="free-shipping-bar-discount-text">
                  Free shipping will be applied automatically at checkout.
                </p>
              ) : (claimedDiscountCode || discount.code) ? (
                <p className="free-shipping-bar-discount-text">
                  <>Use code <span className="free-shipping-bar-discount-code">{claimedDiscountCode || discount.code}</span> at checkout.</>
                </p>
              ) : null
            )}

            {state === "unlocked" && hasClaimed && claimSuccessMessage && (
              <p className="free-shipping-bar-discount-text">{claimSuccessMessage}</p>
            )}
          </div>

          {dismissible && (
            <button
              className="free-shipping-bar-close"
              onClick={handleClose}
              aria-label="Dismiss shipping bar"
              style={{ color: config.textColor || '#111827' }}
            >
              <svg width="20" height="20" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path
                  d="M15 5L5 15M5 5L15 15"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
            </button>
          )}
        </div>
      </div>
    </>
  );
};

