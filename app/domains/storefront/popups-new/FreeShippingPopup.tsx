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
import type { PopupDesignConfig } from './types';
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
}

export interface FreeShippingPopupProps {
  config: FreeShippingConfig;
  isVisible: boolean;
  onClose: () => void;
  cartTotal?: number;
}

export const FreeShippingPopup: React.FC<FreeShippingPopupProps> = ({
  config,
  isVisible,
  onClose,
  cartTotal: propCartTotal,
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

  const [internalDismissed, setInternalDismissed] = useState(false);
  const [celebrating, setCelebrating] = useState(false);
  const [isEntering, setIsEntering] = useState(false);
  const [isExiting, setIsExiting] = useState(false);
  const prevUnlockedRef = useRef(false);
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

  // Trigger celebration animation when unlocking
  useEffect(() => {
    const isUnlocked = state === "unlocked";
    const wasLocked = prevUnlockedRef.current === false;

    if (isUnlocked && wasLocked && celebrateOnUnlock) {
      setCelebrating(true);
      const timer = setTimeout(() => setCelebrating(false), 1000);
      return () => clearTimeout(timer);
    }

    prevUnlockedRef.current = isUnlocked;
  }, [state, celebrateOnUnlock]);

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
        className={`free-shipping-bar ${isExiting ? 'exiting' : ''}`}
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

