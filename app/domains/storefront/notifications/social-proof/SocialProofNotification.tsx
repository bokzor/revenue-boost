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

  const colors = {
    background:
      config.notificationBackgroundColor || config.backgroundColor || "#FFFFFF",
    text: config.textColor || "#1F2937",
    primary:
      config.customerNameColor ||
      config.accentColor ||
      config.textColor ||
      "#111827",
    secondary: "#F3F4F6",
    success: config.accentColor || "#16A34A",
    warning: "#F59E0B",
    border: "#E5E7EB",
  };

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
    <div className="notification-content">
      {config.showIcons && (
        <div className="notification-icon">🛍️</div>
      )}
      <div className="notification-body">
        <p className="notification-text">
          <strong style={{ color: colors.primary }}>{notif.customerName}</strong>
          {config.showCustomerLocation !== false && notif.location && (
            <>
              {" "}
              <span style={{ color: colors.text, opacity: 0.8 }}>
                from {notif.location}
              </span>
            </>
          )}
          <br />
          <span style={{ color: colors.text, opacity: 0.7 }}>just purchased:</span>
          <br />
          <strong style={{ color: colors.text }}>{notif.productName}</strong>
        </p>
        <div className="notification-meta" style={{ color: colors.text }}>
          <span>{notif.timeAgo}</span>
          {config.showVerifiedBadge && notif.verified && (
            <span
              className="verified-badge"
              style={{ background: colors.success, color: "#FFFFFF" }}
            >
              <span>✓</span> Verified
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
    </div>
  );

  const renderVisitorNotification = (
    notif: SocialProofNotification & { type: "visitor" },
  ) => {
    const contextText = notif.context;
    const isLowStock = /left in stock!$/i.test(contextText);

    // Special layout for low stock alerts (inventory-based, not "people")
    if (isLowStock) {
      return (
        <div className="notification-content">
          {config.showIcons && (
            <div className="notification-icon">⚠️</div>
          )}
          <div className="notification-body">
            <p className="notification-text">
              <strong style={{ color: colors.warning }}>
                {notif.count === 1
                  ? "Only 1 left in stock!"
                  : `Only ${notif.count} left in stock!`}
              </strong>
            </p>
          </div>
        </div>
      );
    }

    // Default layout for visitor / sales-count / cart-activity / recently-viewed
    return (
      <div className="notification-content">
        {config.showIcons && (
          <div className="notification-icon">👥</div>
        )}
        <div className="notification-body">
          <p className="notification-text">
            <strong style={{ color: colors.primary }}>
              {notif.count} {notif.count === 1 ? "person" : "people"}
            </strong>
            <br />
            <span style={{ color: colors.text, opacity: 0.8 }}>
              {contextText}
            </span>
          </p>
          {notif.trending && (
            <div className="notification-meta">
              <span
                className="trending-indicator"
                style={{ color: colors.warning }}
              >
                <span>🔥</span> Trending
              </span>
            </div>
          )}
        </div>
      </div>
    );
  };

  const renderReviewNotification = (
    notif: SocialProofNotification & { type: "review" },
  ) => {
    const renderStars = (rating: number) =>
      Array.from({ length: 5 }, (_, i) => (
        <span
          // eslint-disable-next-line react/no-array-index-key
          key={i}
          style={{
            color: i < rating ? "#FBBF24" : colors.border,
          }}
        >
          ★
        </span>
      ));

    return (
      <div className="notification-content">
        {config.showIcons && (
          <div className="notification-icon">⭐</div>
        )}
        <div className="notification-body">
          <p className="notification-text">
            <span className="star-rating">{renderStars(notif.rating)}</span>
            <br />
            <strong style={{ color: colors.primary }}>
              {notif.rating.toFixed(1)}
            </strong>{" "}
            <span style={{ color: colors.text, opacity: 0.8 }}>
              from {notif.reviewCount.toLocaleString()} reviews
            </span>
          </p>

          {notif.recentReview && (
            <div
              className="review-quote"
              style={{
                background: colors.secondary,
                borderLeft: `3px solid ${colors.primary}`,
              }}
            >
              <p className="review-text">
                &quot;{notif.recentReview.text}&quot;
              </p>
              <div className="review-author">
                <span>— {notif.recentReview.author}</span>
                {config.showVerifiedBadge && notif.recentReview.verified && (
                  <span
                    className="verified-badge"
                    style={{ background: colors.success, color: "#FFFFFF" }}
                  >
                    <span>✓</span> Verified
                  </span>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    );
  };

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
          minWidth: "280px",
          maxWidth: "calc(100vw - 40px)",
          background: colors.background,
          color: colors.text,
          borderRadius: "12px",
          boxShadow:
            "0 10px 40px rgba(0, 0, 0, 0.15), 0 4px 8px rgba(0, 0, 0, 0.1)",
          padding: "16px",
          paddingRight: "40px",
          cursor: onClick ? "pointer" : "default",
          border: `1px solid ${colors.border}`,
          transition: "transform 0.3s ease-out, opacity 0.3s ease-out",
        }}
        onClick={handleClick}
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
            color: colors.text,
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

      {/* Animations & layout */}
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

        .social-proof-notification:hover {
          transform: translateY(-2px);
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

        .notification-content {
          display: flex;
          align-items: flex-start;
          gap: 12px;
        }

        .notification-icon {
          flex-shrink: 0;
          font-size: 24px;
          line-height: 1;
        }

        .notification-body {
          flex: 1;
          min-width: 0;
        }

        .notification-text {
          margin: 0;
          font-size: 14px;
          line-height: 1.5;
        }

        .notification-meta {
          margin-top: 4px;
          font-size: 12px;
          opacity: 0.7;
          display: flex;
          align-items: center;
          gap: 4px;
          flex-wrap: wrap;
        }

        .verified-badge {
          display: inline-flex;
          align-items: center;
          gap: 4px;
          font-size: 11px;
          padding: 2px 6px;
          border-radius: 4px;
          font-weight: 500;
        }

        .trending-indicator {
          display: inline-flex;
          align-items: center;
          gap: 4px;
          font-size: 12px;
          font-weight: 600;
        }

        .star-rating {
          display: inline-flex;
          align-items: center;
          gap: 2px;
        }

        .review-quote {
          margin-top: 8px;
          padding: 8px 12px;
          border-radius: 8px;
        }

        .review-text {
          font-style: italic;
          font-size: 13px;
          line-height: 1.4;
          margin: 0 0 6px 0;
        }

        .review-author {
          font-size: 12px;
          font-weight: 500;
          opacity: 0.8;
          display: flex;
          align-items: center;
          gap: 4px;
        }

        /* Mobile responsiveness */
        @media (max-width: 640px) {
          .social-proof-notification {
            width: calc(100vw - 40px) !important;
            font-size: 13px;
          }

          .notification-text {
            font-size: 13px;
          }

          .notification-meta {
            font-size: 11px;
          }

          .notification-icon {
            font-size: 20px;
          }
        }
      `}</style>
    </>
  );
};
