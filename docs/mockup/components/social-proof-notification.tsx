"use client"

import { useState, useEffect, useMemo } from "react"
import { getThemeColors, type PopupTheme, type ThemeColors } from "@/lib/popup-themes"

export type NotificationType = "purchase" | "visitor" | "review"
export type NotificationPosition = "bottom-left" | "bottom-right" | "top-left" | "top-right"

export interface PurchaseData {
  customerName: string
  location: string
  productName: string
  timestamp: string
  verified?: boolean
}

export interface VisitorData {
  count: number
  context: "viewing" | "shopping"
  trending?: boolean
}

export interface ReviewData {
  rating: number
  reviewCount: number
  recentReview?: {
    text: string
    author: string
    verified?: boolean
  }
}

export interface NotificationConfig {
  type: NotificationType
  data: PurchaseData | VisitorData | ReviewData
  duration?: number
  showIcon?: boolean
}

export interface SocialProofNotificationProps {
  notifications: NotificationConfig[]
  theme?: PopupTheme
  customColors?: Partial<ThemeColors>
  position?: NotificationPosition
  rotationInterval?: number
  maxPerSession?: number
  showIcons?: boolean
  onClick?: (notification: NotificationConfig) => void
}

export function SocialProofNotification({
  notifications,
  theme = "modern",
  customColors,
  position = "bottom-left",
  rotationInterval = 5000,
  maxPerSession = 5,
  showIcons = true,
  onClick,
}: SocialProofNotificationProps) {
  const [currentIndex, setCurrentIndex] = useState(0)
  const [isVisible, setIsVisible] = useState(false)
  const [shownCount, setShownCount] = useState(0)
  const [isExiting, setIsExiting] = useState(false)

  const colors = useMemo(() => getThemeColors(theme, customColors), [theme, customColors])

  useEffect(() => {
    if (notifications.length === 0 || shownCount >= maxPerSession) return

    // Show first notification after a brief delay
    const showTimer = setTimeout(() => {
      setIsVisible(true)
      setShownCount((prev) => prev + 1)
    }, 1000)

    return () => clearTimeout(showTimer)
  }, [notifications.length, shownCount, maxPerSession])

  useEffect(() => {
    if (!isVisible || notifications.length === 0) return

    const currentNotification = notifications[currentIndex]
    const duration = currentNotification.duration || rotationInterval

    const hideTimer = setTimeout(() => {
      setIsExiting(true)

      setTimeout(() => {
        setIsVisible(false)
        setIsExiting(false)

        // Move to next notification
        const nextIndex = (currentIndex + 1) % notifications.length
        setCurrentIndex(nextIndex)

        if (shownCount < maxPerSession) {
          setTimeout(() => {
            setIsVisible(true)
            setShownCount((prev) => prev + 1)
          }, 1000)
        }
      }, 300)
    }, duration)

    return () => clearTimeout(hideTimer)
  }, [isVisible, currentIndex, notifications, rotationInterval, shownCount, maxPerSession])

  if (!isVisible || notifications.length === 0 || shownCount > maxPerSession) {
    return null
  }

  const currentNotification = notifications[currentIndex]

  const handleClick = () => {
    if (onClick) {
      onClick(currentNotification)
    }
  }

  const renderNotification = () => {
    switch (currentNotification.type) {
      case "purchase":
        return (
          <PurchaseNotification
            data={currentNotification.data as PurchaseData}
            colors={colors}
            showIcon={showIcons && (currentNotification.showIcon ?? true)}
          />
        )
      case "visitor":
        return (
          <VisitorNotification
            data={currentNotification.data as VisitorData}
            colors={colors}
            showIcon={showIcons && (currentNotification.showIcon ?? true)}
          />
        )
      case "review":
        return (
          <ReviewNotification
            data={currentNotification.data as ReviewData}
            colors={colors}
            showIcon={showIcons && (currentNotification.showIcon ?? true)}
          />
        )
      default:
        return null
    }
  }

  return (
    <>
      <style>{`
        .social-proof-notification {
          position: fixed;
          width: 320px;
          max-width: calc(100vw - 40px);
          background: ${colors.background};
          color: ${colors.text};
          border-radius: 12px;
          padding: 16px;
          box-shadow: 0 10px 40px rgba(0, 0, 0, 0.15), 0 4px 8px rgba(0, 0, 0, 0.1);
          z-index: 999998;
          cursor: pointer;
          transition: transform 0.3s ease-out, opacity 0.3s ease-out;
          ${colors.blur ? "backdrop-filter: blur(10px); -webkit-backdrop-filter: blur(10px);" : ""}
          border: 1px solid ${colors.border};
        }

        .social-proof-notification.bottom-left {
          bottom: 20px;
          left: 20px;
        }

        .social-proof-notification.bottom-right {
          bottom: 20px;
          right: 20px;
        }

        .social-proof-notification.top-left {
          top: 20px;
          left: 20px;
        }

        .social-proof-notification.top-right {
          top: 20px;
          right: 20px;
        }

        .social-proof-notification.entering {
          animation: slideIn 0.3s ease-out;
        }

        .social-proof-notification.exiting {
          animation: fadeOut 0.3s ease-out;
        }

        .social-proof-notification:hover {
          transform: translateY(-2px);
        }

        @keyframes slideIn {
          from {
            transform: translateX(-100%);
            opacity: 0;
          }
          to {
            transform: translateX(0);
            opacity: 1;
          }
        }

        @keyframes fadeOut {
          from {
            opacity: 1;
          }
          to {
            opacity: 0;
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
        }

        .verified-badge {
          display: inline-flex;
          align-items: center;
          gap: 2px;
          font-size: 11px;
          padding: 2px 6px;
          background: ${colors.success};
          color: white;
          border-radius: 4px;
          font-weight: 500;
        }

        .trending-indicator {
          display: inline-flex;
          align-items: center;
          gap: 4px;
          font-size: 12px;
          color: ${colors.warning};
          font-weight: 600;
        }

        .star-rating {
          display: inline-flex;
          align-items: center;
          gap: 2px;
          color: #fbbf24;
        }

        .review-quote {
          margin-top: 8px;
          padding: 8px 12px;
          background: ${colors.secondary};
          border-radius: 8px;
          border-left: 3px solid ${colors.primary};
        }

        .review-text {
          font-style: italic;
          font-size: 13px;
          line-height: 1.4;
          margin: 0 0 6px 0;
          color: ${colors.text};
        }

        .review-author {
          font-size: 12px;
          font-weight: 500;
          color: ${colors.text};
          opacity: 0.8;
          display: flex;
          align-items: center;
          gap: 4px;
        }

        @media (max-width: 640px) {
          .social-proof-notification {
            width: calc(100vw - 40px);
            padding: 14px;
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

      <div
        className={`social-proof-notification ${position} ${isExiting ? "exiting" : "entering"}`}
        onClick={handleClick}
      >
        {renderNotification()}
      </div>
    </>
  )
}

function PurchaseNotification({
  data,
  colors,
  showIcon,
}: { data: PurchaseData; colors: ThemeColors; showIcon: boolean }) {
  return (
    <div className="notification-content">
      {showIcon && <div className="notification-icon">🛍️</div>}
      <div className="notification-body">
        <p className="notification-text">
          <strong style={{ color: colors.primary }}>{data.customerName}</strong> from{" "}
          <span style={{ color: colors.text, opacity: 0.8 }}>{data.location}</span>
          <br />
          <span style={{ color: colors.text, opacity: 0.7 }}>just purchased:</span>
          <br />
          <strong style={{ color: colors.text }}>{data.productName}</strong>
        </p>
        <div className="notification-meta" style={{ color: colors.text }}>
          <span>{data.timestamp}</span>
          {data.verified && (
            <span className="verified-badge">
              <span>✓</span> Verified
            </span>
          )}
        </div>
      </div>
    </div>
  )
}

function VisitorNotification({
  data,
  colors,
  showIcon,
}: { data: VisitorData; colors: ThemeColors; showIcon: boolean }) {
  const contextText = data.context === "viewing" ? "viewing this product" : "shopping now"

  return (
    <div className="notification-content">
      {showIcon && <div className="notification-icon">👥</div>}
      <div className="notification-body">
        <p className="notification-text">
          <strong style={{ color: colors.primary }}>
            {data.count} {data.count === 1 ? "person" : "people"}
          </strong>
          <br />
          <span style={{ color: colors.text, opacity: 0.8 }}>{contextText}</span>
        </p>
        {data.trending && (
          <div className="notification-meta">
            <span className="trending-indicator">
              <span>🔥</span> Trending
            </span>
          </div>
        )}
      </div>
    </div>
  )
}

function ReviewNotification({ data, colors, showIcon }: { data: ReviewData; colors: ThemeColors; showIcon: boolean }) {
  const renderStars = (rating: number) => {
    return Array.from({ length: 5 }, (_, i) => (
      <span key={i} style={{ color: i < rating ? "#fbbf24" : colors.border }}>
        ★
      </span>
    ))
  }

  return (
    <div className="notification-content">
      {showIcon && <div className="notification-icon">⭐</div>}
      <div className="notification-body">
        <p className="notification-text">
          <span className="star-rating">{renderStars(data.rating)}</span>
          <br />
          <strong style={{ color: colors.primary }}>{data.rating.toFixed(1)}</strong>{" "}
          <span style={{ color: colors.text, opacity: 0.8 }}>from {data.reviewCount.toLocaleString()} reviews</span>
        </p>

        {data.recentReview && (
          <div className="review-quote">
            <p className="review-text">"{data.recentReview.text}"</p>
            <div className="review-author">
              <span>— {data.recentReview.author}</span>
              {data.recentReview.verified && (
                <span className="verified-badge">
                  <span>✓</span> Verified
                </span>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
