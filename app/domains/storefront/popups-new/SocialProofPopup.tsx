/**
 * SocialProofPopup Component
 *
 * Social proof notification popup featuring:
 * - Multiple notification types (purchase/visitor/review)
 * - Notification rotation system
 * - Configurable display duration
 * - Position control (corners)
 * - Slide-in/slide-out animations
 * - Product images and details
 * - Real-time visitor counts
 */

import React, { useState, useEffect, useCallback, useMemo } from "react";
import type { PopupDesignConfig } from "./types";
import type { SocialProofContent } from "~/domains/campaigns/types/campaign";
import { prefersReducedMotion } from "./utils";
import { POPUP_SPACING } from "./spacing";

// Import custom hooks
import { usePopupAnimation } from "./hooks";
import { buildScopedCss } from "~/domains/storefront/shared/css";

export interface SocialProofNotification {
  id: string;
  type: "purchase" | "visitor" | "review";
  name?: string;
  location?: string;
  product?: string;
  productImage?: string;
  count?: number;
  rating?: number;
  timestamp?: Date;
  // Extended fields used for Tier 2 / advanced variants
  context?: string; // e.g. "left in stock", "added to cart in the last hour"
  trending?: boolean;
}

/**
 * SocialProofConfig - Extends both design config AND campaign content type
 * All content fields come from SocialProofContent
 * All design fields come from PopupDesignConfig
 */
export interface SocialProofConfig extends PopupDesignConfig, SocialProofContent {
  // Storefront-specific fields only
  // Note: displayDuration, messageTemplates, enablePurchaseNotifications, etc.
  // all come from SocialProofContent
  customCSS?: string;
  globalCustomCSS?: string;
}

export interface SocialProofPopupProps {
  config: SocialProofConfig;
  isVisible: boolean;
  onClose: () => void;
  notifications?: SocialProofNotification[];
}

export const SocialProofPopup: React.FC<SocialProofPopupProps> = ({
  config,
  isVisible,
  onClose,
  notifications = [],
}) => {
  // Use animation hook
  const { showContent: _showContent } = usePopupAnimation({ isVisible });

  // Component-specific state
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isAnimating, setIsAnimating] = useState(false);
  const [shownCount, setShownCount] = useState(0);

  const rotationInterval = (config.rotationInterval || 8) * 1000;

  console.log("[SocialProofPopup] render", {
    isVisible,
    notificationsLength: notifications.length,
    rotationInterval,
    currentIndex,
    shownCount,
    flags: {
      enablePurchaseNotifications: config.enablePurchaseNotifications,
      enableVisitorNotifications: config.enableVisitorNotifications,
      enableReviewNotifications: config.enableReviewNotifications,
      maxNotificationsPerSession: config.maxNotificationsPerSession,
      minVisitorCount: config.minVisitorCount,
      minReviewRating: config.minReviewRating,
    },
  });

  // Filter notifications based on config
  const filteredNotifications = notifications.filter((notif) => {
    if (notif.type === "purchase" && !config.enablePurchaseNotifications) return false;
    if (notif.type === "visitor" && !config.enableVisitorNotifications) return false;
    if (notif.type === "review" && !config.enableReviewNotifications) return false;

    if (notif.type === "visitor" && config.minVisitorCount && notif.count) {
      if (notif.count < config.minVisitorCount) return false;
    }

    if (notif.type === "review" && config.minReviewRating && notif.rating) {
      if (notif.rating < config.minReviewRating) return false;
    }

    return true;
  });

  console.log("[SocialProofPopup] filtered notifications", {
    inputLength: notifications.length,
    outputLength: filteredNotifications.length,
  });

  const currentNotification = filteredNotifications[currentIndex];

  // Rotate notifications
  useEffect(() => {
    if (!isVisible || filteredNotifications.length === 0) {
      console.log("[SocialProofPopup] skipping rotation - not visible or no notifications", {
        isVisible,
        filteredLength: filteredNotifications.length,
      });
      return;
    }

    if (config.maxNotificationsPerSession && shownCount >= config.maxNotificationsPerSession) {
      console.log("[SocialProofPopup] maxNotificationsPerSession reached, closing", {
        shownCount,
        max: config.maxNotificationsPerSession,
      });
      onClose();
      return;
    }

    console.log("[SocialProofPopup] scheduling rotation timer", {
      currentIndex,
      shownCount,
      filteredLength: filteredNotifications.length,
      rotationInterval,
    });

    const timer = setTimeout(() => {
      setIsAnimating(true);

      setTimeout(() => {
        setCurrentIndex((prev) => {
          const nextIndex = (prev + 1) % filteredNotifications.length;
          console.log("[SocialProofPopup] advancing notification", {
            prevIndex: prev,
            nextIndex,
          });
          return nextIndex;
        });
        setShownCount((prev) => {
          const nextShown = prev + 1;
          console.log("[SocialProofPopup] incrementing shownCount", {
            prevShown: prev,
            nextShown,
          });
          return nextShown;
        });
        setIsAnimating(false);
      }, 300);
    }, rotationInterval);

    return () => clearTimeout(timer);
  }, [
    isVisible,
    currentIndex,
    filteredNotifications.length,
    rotationInterval,
    config.maxNotificationsPerSession,
    shownCount,
    onClose,
  ]);

  const getPositionStyles = (): React.CSSProperties => {
    const position = config.cornerPosition || "bottom-left";
    const base: React.CSSProperties = {
      position: "fixed",
      zIndex: 10000,
    };

    switch (position) {
      case "bottom-left":
        return { ...base, bottom: "20px", left: "20px" };
      case "bottom-right":
        return { ...base, bottom: "20px", right: "20px" };
      case "top-left":
        return { ...base, top: "20px", left: "20px" };
      case "top-right":
        return { ...base, top: "20px", right: "20px" };
      default:
        return { ...base, bottom: "20px", left: "20px" };
    }
  };

  const getMessage = useCallback(
    (notification: SocialProofNotification): string => {
      const templates = config.messageTemplates || {};

      switch (notification.type) {
        case "purchase": {
          const purchaseTemplate =
            templates.purchase || "{{name}} from {{location}} just purchased {{product}}";
          return purchaseTemplate
            .replace("{{name}}", notification.name || "Someone")
            .replace("{{location}}", notification.location || "nearby")
            .replace("{{product}}", notification.product || "this item");
        }

        case "visitor": {
          const visitorTemplate =
            templates.visitor || "{{count}} people are viewing this right now";

          // Tier 2 / advanced variants can provide a custom context message
          if (notification.context) {
            // If context already contains a {{count}} placeholder, respect it
            if (notification.context.includes("{{count}}")) {
              return notification.context.replace("{{count}}", String(notification.count ?? 0));
            }

            // Otherwise build "<count> <context>" style messages, e.g.:
            // "3 left in stock!", "5 added to cart in the last hour"
            if (typeof notification.count === "number") {
              return `${notification.count} ${notification.context}`;
            }

            // Fallback to raw context if count is missing
            return notification.context;
          }

          return visitorTemplate.replace("{{count}}", String(notification.count || 0));
        }

        case "review": {
          const reviewTemplate = templates.review || "{{name}} gave this {{rating}} stars";
          return reviewTemplate
            .replace("{{name}}", notification.name || "Someone")
            .replace("{{rating}}", String(notification.rating || 5));
        }

        default:
          return "";
      }
    },
    [config.messageTemplates]
  );

  const getIcon = (type: string): string => {
    switch (type) {
      case "purchase":
        return "🛍️";
      case "visitor":
        return "👀";
      case "review":
        return "⭐";
      default:
        return "✨";
    }
  };

  const background = config.backgroundColor || "#111827";

  const scopedCss = useMemo(
    () =>
      buildScopedCss(
        config.globalCustomCSS,
        config.customCSS,
        "data-rb-social-proof",
        "social-proof",
      ),
    [config.customCSS, config.globalCustomCSS],
  );

  if (!isVisible || !currentNotification || filteredNotifications.length === 0) {
    return null;
  }

  const containerStyles: React.CSSProperties = {
    ...getPositionStyles(),
    // Use `background` so both solid colors and gradients work
    background,
    color: config.textColor,
    fontFamily: config.fontFamily || 'system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif',
    borderRadius: `${config.borderRadius ?? 8}px`,
    padding: POPUP_SPACING.component.card,
    boxShadow: "0 4px 12px rgba(0,0,0,0.15)",
    width: "calc(100% - 40px)", // Ensure it fits on mobile
    maxWidth: "350px",
    display: "flex",
    gap: POPUP_SPACING.gap.sm,
    alignItems: "center",
    opacity: isAnimating ? 0 : 1,
    transform: isAnimating ? "translateY(10px)" : "translateY(0)",
    transition: prefersReducedMotion() ? "none" : "opacity 0.3s, transform 0.3s",
    containerType: "inline-size",
    containerName: "social-proof",
  };

  const closeButtonStyles: React.CSSProperties = {
    background: "transparent",
    border: "none",
    color: config.textColor,
    fontSize: "18px",
    cursor: "pointer",
    opacity: 0.6,
    padding: "2px 6px",
    lineHeight: 1,
    flexShrink: 0,
    alignSelf: "flex-start",
    marginLeft: "8px",
  };

  return (
    <div style={containerStyles} data-rb-social-proof>
      {scopedCss ? <style dangerouslySetInnerHTML={{ __html: scopedCss }} /> : null}
      {/* Icon */}
      <div style={{ fontSize: "24px", flexShrink: 0 }}>{getIcon(currentNotification.type)}</div>

      {/* Product image */}
      {config.showProductImage && currentNotification.productImage && (
        <img
          src={currentNotification.productImage}
          alt={currentNotification.product || "Product"}
          style={{
            width: "50px",
            height: "50px",
            objectFit: "cover",
            borderRadius: "6px",
            flexShrink: 0,
          }}
        />
      )}

      {/* Message */}
      <div style={{ flex: 1, fontSize: "14px", lineHeight: 1.5, fontWeight: 600 }}>
        {getMessage(currentNotification)}

        {/* Timer */}
        {config.showTimer && currentNotification.timestamp && (
          <div style={{ fontSize: "12px", opacity: 0.7, marginTop: POPUP_SPACING.section.xs }}>
            {getTimeAgo(currentNotification.timestamp)}
          </div>
        )}
      </div>

      {/* Close button (pinned to the right) */}
      {config.showCloseButton !== false && (
        <button
          onClick={onClose}
          style={closeButtonStyles}
          aria-label="Close notification"
          onMouseEnter={(e) => (e.currentTarget.style.opacity = "1")}
          onMouseLeave={(e) => (e.currentTarget.style.opacity = "0.6")}
        >
          ×
        </button>
      )}
    </div>
  );
};

// Helper function to get time ago
function getTimeAgo(date: Date): string {
  const seconds = Math.floor((new Date().getTime() - date.getTime()) / 1000);

  if (seconds < 60) return "Just now";
  if (seconds < 3600) return `${Math.floor(seconds / 60)}m ago`;
  if (seconds < 86400) return `${Math.floor(seconds / 3600)}h ago`;
  return `${Math.floor(seconds / 86400)}d ago`;
}
