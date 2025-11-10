/**
 * Social Proof Notification Component
 *
 * Renders individual social proof notifications (purchase, visitor, review).
 * Features auto-dismiss, animations, and click tracking.
 */

import React, { useEffect, useState, useCallback } from "react";
import type { SocialProofNotification, SocialProofConfig } from "./types";

export interface SocialProofNotificationProps {
  notification: SocialProofNotification;
  config: SocialProofConfig;
  onDismiss: () => void;
  onClick?: () => void;
}

export const SocialProofNotificationComponent: React.FC<
  SocialProofNotificationProps
> = ({ notification, config, onDismiss, onClick }) => {
  const [isVisible, setIsVisible] = useState(false);
  const [isExiting, setIsExiting] = useState(false);

  const handleDismiss = useCallback(() => {
    setIsExiting(true);
    setTimeout(() => {
      onDismiss();
    }, 300); // Match animation duration
  }, [onDismiss]);

  // Slide in animation on mount
  useEffect(() => {
    const timer = setTimeout(() => setIsVisible(true), 100);
    return () => clearTimeout(timer);
  }, []);

  // Auto-dismiss after displayDuration
  useEffect(() => {
    const timer = setTimeout(() => {
      handleDismiss();
    }, config.displayDuration * 1000);

    return () => clearTimeout(timer);
  }, [config.displayDuration, handleDismiss]);

  const handleClick = () => {
    if (onClick) {
      onClick();
    }
  };

  const getPositionStyles = (): React.CSSProperties => {
    const base: React.CSSProperties = {
      position: "fixed",
      zIndex: 999998,
    };

    switch (config.position) {
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

  const renderPurchaseNotification = (
    notif: SocialProofNotification & { type: "purchase" },
  ) => (
    <>
      {config.showIcons && (
        <span style={{ fontSize: "20px", marginRight: "8px" }}>🛍️</span>
      )}
      <div style={{ flex: 1 }}>
        <div
          style={{
            fontSize: "14px",
            fontWeight: "600",
            marginBottom: "4px",
            color: config.customerNameColor || config.textColor,
          }}
        >
          {notif.customerName} from {notif.location}
        </div>
        <div
          style={{
            fontSize: "13px",
            opacity: 0.8,
            marginBottom: "2px",
            color: config.actionTextColor || config.textColor,
          }}
        >
          just purchased:
        </div>
        <div
          style={{
            fontSize: "13px",
            fontWeight: "500",
            color: config.productNameColor || config.textColor,
          }}
        >
          {notif.productName}
        </div>
        <div
          style={{
            fontSize: "12px",
            opacity: 0.6,
            marginTop: "4px",
            color: config.timestampColor || config.textColor,
          }}
        >
          {notif.timeAgo}
          {config.showVerifiedBadge && notif.verified && (
            <span style={{ marginLeft: "6px", color: config.accentColor }}>
              ✓
            </span>
          )}
        </div>
      </div>
      {notif.productImage && (
        <img
          src={notif.productImage}
          alt={notif.productName}
          style={{
            width: "48px",
            height: "48px",
            borderRadius: "6px",
            objectFit: "cover",
            marginLeft: "12px",
          }}
        />
      )}
    </>
  );

  const renderVisitorNotification = (
    notif: SocialProofNotification & { type: "visitor" },
  ) => (
    <>
      {config.showIcons && (
        <span style={{ fontSize: "20px", marginRight: "8px" }}>👥</span>
      )}
      <div style={{ flex: 1 }}>
        <div
          style={{ fontSize: "14px", fontWeight: "600", marginBottom: "4px" }}
        >
          {notif.count} {notif.count === 1 ? "person" : "people"}
        </div>
        <div style={{ fontSize: "13px", opacity: 0.8 }}>{notif.context}</div>
        {notif.trending && (
          <div
            style={{
              fontSize: "12px",
              marginTop: "4px",
              color: config.accentColor,
              fontWeight: "500",
            }}
          >
            🔥 Trending
          </div>
        )}
      </div>
    </>
  );

  const renderReviewNotification = (
    notif: SocialProofNotification & { type: "review" },
  ) => (
    <>
      {config.showIcons && (
        <span style={{ fontSize: "20px", marginRight: "8px" }}>⭐</span>
      )}
      <div style={{ flex: 1 }}>
        <div
          style={{ fontSize: "14px", fontWeight: "600", marginBottom: "4px" }}
        >
          {notif.rating.toFixed(1)} from {notif.reviewCount.toLocaleString()}{" "}
          reviews
        </div>
        {notif.recentReview && (
          <>
            <div
              style={{
                fontSize: "13px",
                opacity: 0.8,
                fontStyle: "italic",
                marginBottom: "2px",
              }}
            >
              &quot;{notif.recentReview.text}&quot;
            </div>
            <div style={{ fontSize: "12px", opacity: 0.6 }}>
              - {notif.recentReview.author}
              {config.showVerifiedBadge && notif.recentReview.verified && (
                <span style={{ marginLeft: "4px", color: config.accentColor }}>
                  ✓
                </span>
              )}
            </div>
          </>
        )}
      </div>
    </>
  );

  const renderNotificationContent = () => {
    switch (notification.type) {
      case "purchase":
        return renderPurchaseNotification(notification);
      case "visitor":
        return renderVisitorNotification(notification);
      case "review":
        return renderReviewNotification(notification);
      default:
        return null;
    }
  };

  const getAnimationClass = () => {
    if (isExiting) return "social-proof-exit";
    if (isVisible) return "social-proof-enter";
    return "";
  };

  return (
    <>
      <div
        className={`social-proof-notification ${getAnimationClass()}`}
        style={{
          ...getPositionStyles(),
          width: "320px",
          maxWidth: "calc(100vw - 40px)",
          backgroundColor:
            config.notificationBackgroundColor || config.backgroundColor,
          color: config.textColor,
          borderRadius: "12px",
          boxShadow: "0 4px 16px rgba(0, 0, 0, 0.12)",
          padding: "16px",
          display: "flex",
          alignItems: "flex-start",
          cursor: onClick ? "pointer" : "default",
          transition: "transform 0.2s ease",
        }}
        onClick={handleClick}
        onMouseEnter={(e) => {
          if (onClick) {
            e.currentTarget.style.transform = "translateY(-2px)";
          }
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.transform = "translateY(0)";
        }}
      >
        {renderNotificationContent()}

        {/* Close Button */}
        <button
          onClick={(e) => {
            e.stopPropagation();
            handleDismiss();
          }}
          style={{
            position: "absolute",
            top: "8px",
            right: "8px",
            background: "transparent",
            border: "none",
            cursor: "pointer",
            padding: "4px",
            opacity: 0.5,
            fontSize: "16px",
            lineHeight: "1",
            color: config.textColor,
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.opacity = "1";
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.opacity = "0.5";
          }}
          aria-label="Dismiss notification"
        >
          ×
        </button>
      </div>

      {/* Animations */}
      <style>{`
        .social-proof-notification {
          /* Start invisible and off-screen, will be animated in */
          opacity: 0;
          transform: translateX(-100%);
          /* Ensure it's not hidden by default */
          visibility: visible;
        }

        .social-proof-notification.social-proof-enter {
          animation: slideInLeft 0.3s ease-out forwards;
        }

        .social-proof-notification.social-proof-exit {
          animation: fadeOut 0.3s ease-out forwards;
        }

        @keyframes slideInLeft {
          from {
            opacity: 0;
            transform: translateX(-100%);
            visibility: visible;
          }
          to {
            opacity: 1;
            transform: translateX(0);
            visibility: visible;
          }
        }

        @keyframes fadeOut {
          from {
            opacity: 1;
            visibility: visible;
          }
          to {
            opacity: 0;
            visibility: visible;
          }
        }

        /* Mobile responsiveness */
        @media (max-width: 640px) {
          .social-proof-notification {
            width: calc(100vw - 40px) !important;
            font-size: 13px;
          }
        }
      `}</style>
    </>
  );
};
