/**
 * SocialProofPopup Component
 *
 * Social proof notification popup featuring:
 * - Modern card layout with avatar and footer
 * - SVG icons (no emoji)
 * - Verified purchase badge in footer
 * - Responsive animations (slide up mobile, slide in desktop)
 * - Uses --sp-* CSS variables for theming
 */

import React, { useState, useEffect, useCallback, useMemo } from "react";
import type { PopupDesignConfig } from "./types";
import type { SocialProofContent } from "~/domains/campaigns/types/campaign";
import type {
  SocialProofNotification,
  PurchaseNotification,
  VisitorNotification,
  ReviewNotification,
} from "~/domains/storefront/notifications/social-proof/types";
import { buildScopedCss } from "~/domains/storefront/shared/css";

// =============================================================================
// SVG ICONS (inline, no dependencies)
// =============================================================================

function ShoppingBagIcon() {
  return (
    <svg
      className="sp-icon sp-icon--accent"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M6 2 3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4Z" />
      <path d="M3 6h18" />
      <path d="M16 10a4 4 0 0 1-8 0" />
    </svg>
  );
}

function UsersIcon() {
  return (
    <svg
      className="sp-icon sp-icon--primary"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" />
      <circle cx="9" cy="7" r="4" />
      <path d="M22 21v-2a4 4 0 0 0-3-3.87" />
      <path d="M16 3.13a4 4 0 0 1 0 7.75" />
    </svg>
  );
}

function StarIcon() {
  return (
    <svg
      className="sp-icon sp-icon--warning sp-icon--filled"
      viewBox="0 0 24 24"
      fill="currentColor"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
    </svg>
  );
}

function CloseIcon() {
  return (
    <svg
      className="sp-icon"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M18 6 6 18" />
      <path d="m6 6 12 12" />
    </svg>
  );
}

function CheckCircleIcon() {
  return (
    <svg
      className="sp-icon sp-icon--small sp-icon--accent"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <circle cx="12" cy="12" r="10" />
      <path d="m9 12 2 2 4-4" />
    </svg>
  );
}

function NotificationIcon({ type }: { type: "purchase" | "visitor" | "review" }) {
  switch (type) {
    case "purchase":
      return <ShoppingBagIcon />;
    case "visitor":
      return <UsersIcon />;
    case "review":
      return <StarIcon />;
  }
}

// =============================================================================
// HELPERS
// =============================================================================

function getInitials(name: string): string {
  return name
    .split(" ")
    .map((n) => n[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);
}

function formatTimeAgo(timestamp: number, timeAgoString?: string): string {
  // If timeAgo string is provided (from API), use it directly
  if (timeAgoString) return timeAgoString;

  // Calculate from timestamp
  const seconds = Math.floor((Date.now() - timestamp) / 1000);

  if (seconds < 60) return "Just now";
  if (seconds < 3600) return `${Math.floor(seconds / 60)}m ago`;
  if (seconds < 86400) return `${Math.floor(seconds / 3600)}h ago`;
  return `${Math.floor(seconds / 86400)}d ago`;
}

// Get customer name for purchase notifications
function getCustomerName(notif: SocialProofNotification): string {
  if (notif.type === "purchase") {
    return (notif as PurchaseNotification).customerName || "Someone";
  }
  if (notif.type === "review") {
    return (notif as ReviewNotification).recentReview?.author || "Customer";
  }
  return "Someone";
}

// Get product name for purchase notifications
function getProductName(notif: SocialProofNotification): string {
  if (notif.type === "purchase") {
    return (notif as PurchaseNotification).productName || "an item";
  }
  return "an item";
}

// Get time ago string for notifications
function getTimeAgoString(notif: SocialProofNotification): string {
  if (notif.type === "purchase") {
    const purchase = notif as PurchaseNotification;
    return formatTimeAgo(purchase.timestamp, purchase.timeAgo);
  }
  return formatTimeAgo(notif.timestamp);
}

// =============================================================================
// TYPES (re-export from canonical source)
// =============================================================================

// Re-export notification types from canonical source
export type { SocialProofNotification, PurchaseNotification, VisitorNotification, ReviewNotification };

export interface SocialProofConfig extends PopupDesignConfig, SocialProofContent {
  customCSS?: string;
  globalCustomCSS?: string;
  // Display toggles
  showVerifiedBadge?: boolean;
  showCloseButton?: boolean;
  previewMode?: boolean;
}

export interface SocialProofPopupProps {
  config: SocialProofConfig;
  isVisible: boolean;
  onClose: () => void;
  notifications?: SocialProofNotification[];
}

// =============================================================================
// COMPONENT
// =============================================================================

export const SocialProofPopup: React.FC<SocialProofPopupProps> = ({
  config,
  isVisible,
  onClose,
  notifications = [],
}) => {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isEntering, setIsEntering] = useState(false);
  const [isExiting, setIsExiting] = useState(false);
  const [shownCount, setShownCount] = useState(0);

  const rotationInterval = (config.rotationInterval || 8) * 1000;

  // Filter notifications based on config
  const filteredNotifications = useMemo(() => {
    return notifications.filter((notif) => {
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
  }, [notifications, config]);

  const currentNotification = filteredNotifications[currentIndex];

  // Enter animation
  useEffect(() => {
    if (isVisible && filteredNotifications.length > 0) {
      const timer = setTimeout(() => setIsEntering(true), 50);
      return () => clearTimeout(timer);
    }
  }, [isVisible, filteredNotifications.length]);

  // Rotate notifications
  useEffect(() => {
    if (!isVisible || filteredNotifications.length === 0) return;

    if (config.maxNotificationsPerSession && shownCount >= config.maxNotificationsPerSession) {
      onClose();
      return;
    }

    const timer = setTimeout(() => {
      setIsExiting(true);

      setTimeout(() => {
        setCurrentIndex((prev) => (prev + 1) % filteredNotifications.length);
        setShownCount((prev) => prev + 1);
        setIsExiting(false);
        setIsEntering(true);
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

  const handleDismiss = useCallback(() => {
    setIsExiting(true);
    setTimeout(() => onClose(), 300);
  }, [onClose]);

  const scopedCss = useMemo(
    () =>
      buildScopedCss(
        config.globalCustomCSS,
        config.customCSS,
        "data-rb-social-proof",
        "social-proof"
      ),
    [config.customCSS, config.globalCustomCSS]
  );

  // Build CSS variables from config (matching mock's --sp-* naming)
  const cssVariables: React.CSSProperties = {
    "--sp-background": config.backgroundColor || "#ffffff",
    "--sp-foreground": config.textColor || "#0a0a0a",
    "--sp-muted": "#737373",
    "--sp-muted-bg": "#f5f5f5",
    "--sp-border": "#e5e5e5",
    "--sp-primary": config.textColor || "#171717",
    "--sp-primary-light": "rgba(23, 23, 23, 0.1)",
    "--sp-accent": config.accentColor || "#16a34a",
    "--sp-warning": "#f59e0b",
    "--sp-shadow": "rgba(0, 0, 0, 0.08)",
  } as React.CSSProperties;

  // Position class
  const getPositionClass = () => {
    const position = config.cornerPosition || "bottom-left";
    switch (position) {
      case "bottom-right":
        return "sp-position--bottom-right";
      case "top-left":
        return "sp-position--top-left";
      case "top-right":
        return "sp-position--top-right";
      default:
        return "sp-position--bottom-left";
    }
  };

  if (!isVisible || !currentNotification || filteredNotifications.length === 0) {
    return null;
  }

  const containerClasses = [
    "sp-notification",
    getPositionClass(),
    config.previewMode ? "sp-notification--preview" : "",
    isExiting ? "sp-notification--exiting" : isEntering ? "sp-notification--entering" : "",
  ]
    .filter(Boolean)
    .join(" ");

  // Render message content
  const renderMessage = () => {
    switch (currentNotification.type) {
      case "purchase": {
        const purchase = currentNotification as PurchaseNotification;
        return (
          <>
            <span className="sp-text--semibold">{purchase.customerName}</span>
            <span className="sp-text--muted"> just purchased </span>
            <span className="sp-text--medium">{purchase.productName}</span>
          </>
        );
      }
      case "visitor": {
        const visitor = currentNotification as VisitorNotification;
        const isLowStock = visitor.context?.includes("left in stock");
        if (isLowStock) {
          return (
            <span className="sp-text--warning sp-text--semibold">
              Only {visitor.count} left in stock!
            </span>
          );
        }
        return (
          <>
            <span className="sp-text--semibold">
              {visitor.count} {visitor.count === 1 ? "person" : "people"}
            </span>
            <span className="sp-text--muted"> {visitor.context || "are viewing this right now"}</span>
          </>
        );
      }
      case "review": {
        const review = currentNotification as ReviewNotification;
        return (
          <>
            <span className="sp-text--semibold">{review.recentReview?.author || "Customer"}</span>
            <span className="sp-text--muted"> left a </span>
            <span className="sp-text--medium">{review.rating}-star review</span>
          </>
        );
      }
    }
  };

  // Get location from purchase notifications
  const getLocation = (): string => {
    if (currentNotification.type === "purchase") {
      return (currentNotification as PurchaseNotification).location || "Nearby";
    }
    return "Nearby";
  };

  // Footer is always shown (matching mock design)
  const showFooter = config.showVerifiedBadge !== false;

  return (
    <>
      <div className={containerClasses} style={cssVariables} data-rb-social-proof>
        <div className="sp-notification__card">
          <div className="sp-notification__body">
            <div className="sp-notification__content">
              {/* Avatar */}
              <div className="sp-avatar">
                {currentNotification.type === "purchase" &&
                (currentNotification as PurchaseNotification).productImage &&
                config.showProductImage ? (
                  <img
                    src={(currentNotification as PurchaseNotification).productImage}
                    alt={getProductName(currentNotification)}
                    className="sp-avatar__image"
                  />
                ) : (
                  <span className="sp-avatar__initials">
                    {getInitials(getCustomerName(currentNotification))}
                  </span>
                )}
              </div>

              {/* Content */}
              <div className="sp-notification__text">
                <p className="sp-notification__message">{renderMessage()}</p>
                <div className="sp-notification__meta">
                  <NotificationIcon type={currentNotification.type} />
                  <span className="sp-meta__text">{getLocation()}</span>
                  <span className="sp-meta__separator">•</span>
                  <span className="sp-meta__text">{getTimeAgoString(currentNotification)}</span>
                </div>
              </div>

              {/* Close button */}
              {config.showCloseButton !== false && (
                <button
                  onClick={handleDismiss}
                  className="sp-close-btn"
                  aria-label="Dismiss notification"
                >
                  <CloseIcon />
                </button>
              )}
            </div>
          </div>

          {/* Verified badge footer - always shown like the mock */}
          {showFooter && (
            <div className="sp-notification__footer">
              <div className="sp-verified">
                <CheckCircleIcon />
                <span className="sp-verified__text">Verified purchase</span>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Custom CSS from config */}
      {scopedCss ? <style dangerouslySetInnerHTML={{ __html: scopedCss }} /> : null}

      {/* Component styles using --rb-* CSS variables */}
      <style dangerouslySetInnerHTML={{ __html: SOCIAL_PROOF_STYLES }} />
    </>
  );
};

// =============================================================================
// STYLES
// =============================================================================

const SOCIAL_PROOF_STYLES = `
/* ========================================
   Social Proof Notification
   Uses --sp-* CSS variables for theming
   (matching the mock design exactly)
   ======================================== */

/* Animations */
@keyframes sp-slide-in {
  from {
    opacity: 0;
    transform: translateY(100%);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

@keyframes sp-slide-out {
  from {
    opacity: 1;
    transform: translateY(0);
  }
  to {
    opacity: 0;
    transform: translateY(100%);
  }
}

@keyframes sp-slide-in-tablet {
  from {
    opacity: 0;
    transform: translateX(-50%) translateY(100%);
  }
  to {
    opacity: 1;
    transform: translateX(-50%) translateY(0);
  }
}

@keyframes sp-slide-out-tablet {
  from {
    opacity: 1;
    transform: translateX(-50%) translateY(0);
  }
  to {
    opacity: 0;
    transform: translateX(-50%) translateY(100%);
  }
}

/* Container - Mobile first (full width) */
.sp-notification {
  position: fixed;
  z-index: 9999;
  bottom: 16px;
  left: 16px;
  right: 16px;
  font-family: var(--sp-font-family, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif);
}

.sp-notification--preview {
  position: absolute;
}

.sp-notification--entering {
  animation: sp-slide-in 0.4s ease-out forwards;
}

.sp-notification--exiting {
  animation: sp-slide-out 0.3s ease-in forwards;
}

/* Tablet: centered with max-width */
@container (min-width: 640px) {
  .sp-notification {
    left: 50%;
    right: auto;
    width: 360px;
    transform: translateX(-50%);
  }

  .sp-notification--entering {
    animation: sp-slide-in-tablet 0.4s ease-out forwards;
  }

  .sp-notification--exiting {
    animation: sp-slide-out-tablet 0.3s ease-in forwards;
  }
}

/* Desktop: bottom-left fixed position */
@container (min-width: 768px) {
  .sp-notification {
    left: 24px;
    right: auto;
    bottom: 24px;
    width: 380px;
    transform: none;
  }

  .sp-notification--entering {
    animation: sp-slide-in 0.4s ease-out forwards;
  }

  .sp-notification--exiting {
    animation: sp-slide-out 0.3s ease-in forwards;
  }

  /* Position variants for desktop */
  .sp-notification.sp-position--bottom-left {
    left: 24px;
    right: auto;
    bottom: 24px;
  }

  .sp-notification.sp-position--bottom-right {
    left: auto;
    right: 24px;
    bottom: 24px;
  }

  .sp-notification.sp-position--top-left {
    left: 24px;
    right: auto;
    top: 24px;
    bottom: auto;
  }

  .sp-notification.sp-position--top-right {
    left: auto;
    right: 24px;
    top: 24px;
    bottom: auto;
  }
}

/* Card */
.sp-notification__card {
  background-color: var(--sp-background);
  border: 1px solid var(--sp-border);
  border-radius: 12px;
  box-shadow: 0 4px 12px var(--sp-shadow);
  overflow: hidden;
}

.sp-notification__body {
  padding: 16px;
}

.sp-notification__content {
  display: flex;
  align-items: flex-start;
  gap: 12px;
}

/* Avatar */
.sp-avatar {
  flex-shrink: 0;
  width: 40px;
  height: 40px;
  border-radius: 50%;
  background-color: var(--sp-primary-light);
  display: flex;
  align-items: center;
  justify-content: center;
  box-shadow: 0 0 0 2px var(--sp-background), 0 1px 3px var(--sp-shadow);
}

.sp-avatar__initials {
  font-size: 14px;
  font-weight: 500;
  color: var(--sp-primary);
}

.sp-avatar__image {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

/* Text Content */
.sp-notification__text {
  flex: 1;
  min-width: 0;
}

.sp-notification__message {
  font-size: 14px;
  line-height: 1.4;
  margin: 0;
  color: var(--sp-foreground);
}

.sp-text--semibold {
  font-weight: 600;
  color: var(--sp-foreground);
}

.sp-text--medium {
  font-weight: 500;
  color: var(--sp-foreground);
}

.sp-text--muted {
  color: var(--sp-muted);
}

/* Meta Info */
.sp-notification__meta {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-top: 6px;
}

.sp-meta__text {
  font-size: 12px;
  color: var(--sp-muted);
}

.sp-meta__separator {
  font-size: 12px;
  color: var(--sp-muted);
}

/* Icons */
.sp-icon {
  width: 16px;
  height: 16px;
  flex-shrink: 0;
}

.sp-icon--small {
  width: 14px;
  height: 14px;
}

.sp-icon--primary {
  color: var(--sp-primary);
}

.sp-icon--accent {
  color: var(--sp-accent);
}

.sp-icon--warning {
  color: var(--sp-warning);
}

.sp-icon--filled {
  fill: var(--sp-warning);
}

/* Close Button */
.sp-close-btn {
  flex-shrink: 0;
  padding: 4px;
  border: none;
  background: transparent;
  border-radius: 50%;
  cursor: pointer;
  color: var(--sp-muted);
  transition: background-color 0.15s ease, color 0.15s ease;
  display: flex;
  align-items: center;
  justify-content: center;
}

.sp-close-btn:hover {
  background-color: var(--sp-muted-bg);
  color: var(--sp-foreground);
}

/* Footer / Verified Badge */
.sp-notification__footer {
  padding: 8px 16px;
  background-color: var(--sp-muted-bg);
  border-top: 1px solid var(--sp-border);
}

.sp-verified {
  display: flex;
  align-items: center;
  gap: 6px;
}

.sp-verified__text {
  font-size: 12px;
  font-weight: 500;
  color: var(--sp-muted);
}
`;
