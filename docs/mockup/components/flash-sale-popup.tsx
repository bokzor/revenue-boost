"use client"
import { useState, useEffect, useRef } from "react"
import { type PopupTheme, type ThemeColors, getThemeColors } from "@/lib/popup-themes"

export type SaleSize = "compact" | "standard" | "wide" | "full"

export interface FlashSalePopupProps {
  /** Whether the popup is open */
  isOpen: boolean
  /** Callback to close the popup */
  onClose: () => void
  /** Theme variant */
  theme?: PopupTheme
  /** Size variant for popup width */
  size?: SaleSize
  /** Sale headline */
  headline?: string
  /** Supporting text below headline */
  supportingText?: string
  /** Discount percentage (e.g., "50") */
  discountPercent?: string
  /** Original price (e.g., "$199") */
  originalPrice?: string
  /** Sale price (e.g., "$99") */
  salePrice?: string
  /** Urgency message above timer */
  urgencyMessage?: string
  /** End time for countdown (Date object or timestamp) */
  endTime: Date | number
  /** Stock availability message (optional) */
  stockMessage?: string
  /** CTA button text */
  ctaText?: string
  /** CTA button URL or callback */
  onCtaClick?: () => void
  /** Auto-hide popup when timer expires */
  autoHideOnExpire?: boolean
  /** Custom color overrides */
  colors?: Partial<ThemeColors>
}

interface TimeRemaining {
  days: number
  hours: number
  minutes: number
  seconds: number
  expired: boolean
}

function calculateTimeRemaining(endTime: Date | number): TimeRemaining {
  const end = typeof endTime === "number" ? endTime : endTime.getTime()
  const now = Date.now()
  const diff = end - now

  if (diff <= 0) {
    return { days: 0, hours: 0, minutes: 0, seconds: 0, expired: true }
  }

  return {
    days: Math.floor(diff / (1000 * 60 * 60 * 24)),
    hours: Math.floor((diff / (1000 * 60 * 60)) % 24),
    minutes: Math.floor((diff / (1000 * 60)) % 60),
    seconds: Math.floor((diff / 1000) % 60),
    expired: false,
  }
}

export function FlashSalePopup({
  isOpen,
  onClose,
  theme = "modern",
  size = "standard",
  headline = "Flash Sale!",
  supportingText = "Limited time offer - Don't miss out!",
  discountPercent = "50",
  originalPrice,
  salePrice,
  urgencyMessage = "Hurry! Sale ends soon!",
  endTime,
  stockMessage,
  ctaText = "Shop Now",
  onCtaClick,
  autoHideOnExpire = false,
  colors: customColors,
}: FlashSalePopupProps) {
  const [timeRemaining, setTimeRemaining] = useState<TimeRemaining>(() => calculateTimeRemaining(endTime))
  const intervalRef = useRef<NodeJS.Timeout>()

  const colors = getThemeColors(theme, customColors)

  useEffect(() => {
    if (!isOpen) return

    intervalRef.current = setInterval(() => {
      const newTime = calculateTimeRemaining(endTime)
      setTimeRemaining(newTime)

      if (newTime.expired) {
        clearInterval(intervalRef.current)
        if (autoHideOnExpire) {
          setTimeout(() => onClose(), 2000)
        }
      }
    }, 1000)

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current)
      }
    }
  }, [isOpen, endTime, autoHideOnExpire, onClose])

  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = "hidden"
    } else {
      document.body.style.overflow = ""
    }
    return () => {
      document.body.style.overflow = ""
    }
  }, [isOpen])

  useEffect(() => {
    const handleEsc = (e: KeyboardEvent) => {
      if (e.key === "Escape" && isOpen) {
        onClose()
      }
    }
    window.addEventListener("keydown", handleEsc)
    return () => window.removeEventListener("keydown", handleEsc)
  }, [isOpen, onClose])

  if (!isOpen) return null

  const sizeConfig = {
    compact: {
      maxWidth: "24rem",
      padding: "2rem 1.5rem",
      headlineSize: "2rem",
      discountSize: "6rem",
    },
    standard: {
      maxWidth: "32rem",
      padding: "2.5rem 2rem",
      headlineSize: "2.5rem",
      discountSize: "8rem",
    },
    wide: {
      maxWidth: "56rem",
      padding: "3rem 3rem",
      headlineSize: "3rem",
      discountSize: "10rem",
    },
    full: {
      maxWidth: "90%",
      padding: "2.5rem 3rem",
      headlineSize: "3rem",
      discountSize: "10rem",
    },
  }

  const currentSize = sizeConfig[size]
  const isWide = size === "wide" || size === "full"

  return (
    <>
      <style>{`
        .flash-sale-overlay {
          position: fixed;
          inset: 0;
          z-index: 9999;
          display: flex;
          align-items: center;
          justify-content: center;
          padding: 1rem;
          animation: fadeIn 0.2s ease-out;
        }
        
        .flash-sale-backdrop {
          position: absolute;
          inset: 0;
          background: rgba(0, 0, 0, 0.7);
          backdrop-filter: blur(4px);
        }
        
        .flash-sale-container {
          position: relative;
          width: 100%;
          border-radius: 1rem;
          overflow: hidden;
          box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.5);
          animation: zoomIn 0.3s cubic-bezier(0.34, 1.56, 0.64, 1);
          margin: 0 auto;
        }

        .flash-sale-close {
          position: absolute;
          top: 1rem;
          right: 1rem;
          z-index: 10;
          padding: 0.5rem;
          border-radius: 9999px;
          background: rgba(0, 0, 0, 0.2);
          border: none;
          cursor: pointer;
          transition: background 0.2s;
          color: inherit;
        }
        
        .flash-sale-close:hover {
          background: rgba(0, 0, 0, 0.3);
        }
        
        .flash-sale-content {
          text-align: center;
          max-width: 100%;
          margin: 0 auto;
        }
        
        .flash-sale-content-wide {
          text-align: center;
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 1.5rem;
        }
        
        .flash-sale-content-wide .flash-sale-headline {
          max-width: 48rem;
          line-height: 1.15;
        }
        
        .flash-sale-content-wide .flash-sale-supporting {
          max-width: 40rem;
        }
        
        .flash-sale-content-wide .flash-sale-timer {
          gap: 1.5rem;
        }
        
        .flash-sale-content-wide .flash-sale-timer-unit {
          min-width: 6rem;
          padding: 1.5rem 1.25rem;
        }
        
        .flash-sale-content-wide .flash-sale-timer-value {
          font-size: 3rem;
        }
        
        .flash-sale-content-wide .flash-sale-cta {
          max-width: 28rem;
          padding: 1.25rem 2.5rem;
          font-size: 1.25rem;
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
        }
        
        .flash-sale-headline {
          font-weight: 900;
          line-height: 1.1;
          margin-bottom: 0.75rem;
        }
        
        .flash-sale-supporting {
          font-size: 1.125rem;
          line-height: 1.6;
          margin-bottom: 2rem;
          opacity: 0.9;
        }
        
        .flash-sale-discount {
          display: inline-flex;
          align-items: center;
          justify-content: center;
          border-radius: 9999px;
          margin-bottom: 2rem;
          position: relative;
        }
        
        .flash-sale-discount::before {
          content: '';
          position: absolute;
          inset: -4px;
          border-radius: 9999px;
          padding: 4px;
          background: currentColor;
          -webkit-mask: linear-gradient(#fff 0 0) content-box, linear-gradient(#fff 0 0);
          -webkit-mask-composite: xor;
          mask-composite: exclude;
          opacity: 0.3;
        }
        
        .flash-sale-discount-inner {
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
        }
        
        .flash-sale-discount-percent {
          font-weight: 900;
          line-height: 1;
        }
        
        .flash-sale-discount-label {
          font-size: 0.875rem;
          font-weight: 600;
          text-transform: uppercase;
          letter-spacing: 0.05em;
          opacity: 0.8;
        }
        
        .flash-sale-prices {
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 1rem;
          margin-bottom: 2rem;
        }
        
        .flash-sale-original-price {
          font-size: 1.25rem;
          text-decoration: line-through;
          opacity: 0.6;
        }
        
        .flash-sale-sale-price {
          font-size: 2rem;
          font-weight: 900;
        }
        
        .flash-sale-urgency {
          font-size: 0.875rem;
          font-weight: 600;
          text-transform: uppercase;
          letter-spacing: 0.1em;
          margin-bottom: 1rem;
        }
        
        .flash-sale-timer {
          display: flex;
          gap: 0.75rem;
          justify-content: center;
          margin-bottom: 2rem;
        }
        
        .flash-sale-timer-unit {
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 0.5rem;
          min-width: 4rem;
          padding: 1rem 0.75rem;
          border-radius: 0.5rem;
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
        
        .flash-sale-stock {
          display: inline-flex;
          align-items: center;
          gap: 0.5rem;
          padding: 0.75rem 1.25rem;
          border-radius: 9999px;
          font-size: 0.875rem;
          font-weight: 600;
          margin-bottom: 2rem;
        }
        
        .flash-sale-stock-dot {
          width: 0.5rem;
          height: 0.5rem;
          border-radius: 9999px;
          animation: pulse 2s infinite;
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
        }
        
        .flash-sale-cta:hover {
          transform: translateY(-2px);
          box-shadow: 0 10px 25px -5px rgba(0, 0, 0, 0.3);
        }
        
        .flash-sale-cta:active {
          transform: translateY(0);
        }
        
        .flash-sale-expired {
          padding: 2rem;
          text-align: center;
        }
        
        .flash-sale-expired-icon {
          width: 4rem;
          height: 4rem;
          border-radius: 9999px;
          background: rgba(255, 255, 255, 0.2);
          display: flex;
          align-items: center;
          justify-content: center;
          margin: 0 auto 1rem;
        }
        
        @keyframes fadeIn {
          from { opacity: 0; }
          to { opacity: 1; }
        }
        
        @keyframes zoomIn {
          from { 
            opacity: 0;
            transform: scale(0.8);
          }
          to { 
            opacity: 1;
            transform: scale(1);
          }
        }
        
        @keyframes pulse {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.5; }
        }
        
        @media (max-width: 768px) {
          .flash-sale-content-wide {
            text-align: center;
          }
        }
        
        @media (max-width: 640px) {
          .flash-sale-content {
            padding: 2rem 1.5rem;
          }
          
          .flash-sale-headline {
            font-size: 2rem;
          }
          
          .flash-sale-discount {
            width: 7rem;
            height: 7rem;
          }
          
          .flash-sale-discount-percent {
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

      <div className="flash-sale-overlay">
        <div className="flash-sale-backdrop" onClick={onClose} aria-hidden="true" />

        <div
          className="flash-sale-container"
          style={{
            background: colors.background,
            color: colors.text,
            maxWidth: currentSize.maxWidth,
            ...(colors.blur && { backdropFilter: "blur(20px)" }),
          }}
        >
          <button
            onClick={onClose}
            className="flash-sale-close"
            aria-label="Close popup"
            style={{ color: colors.text }}
          >
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <line x1="18" y1="6" x2="6" y2="18" />
              <line x1="6" y1="6" x2="18" y2="18" />
            </svg>
          </button>

          {!timeRemaining.expired ? (
            <div
              className={`flash-sale-content ${isWide ? "flash-sale-content-wide" : ""}`}
              style={{
                padding: currentSize.padding,
              }}
            >
              <div
                className="flash-sale-badge"
                style={{
                  background: colors.accent,
                  color: colors.background,
                  ...(theme === "neon" && {
                    boxShadow: `0 0 20px ${colors.accent}`,
                  }),
                }}
              >
                Limited Time
              </div>

              <h2
                className="flash-sale-headline"
                style={{
                  fontSize: currentSize.headlineSize,
                  ...(theme === "elegant" && { fontFamily: "serif" }),
                  ...(theme === "luxury" && { fontFamily: "serif" }),
                  ...(theme === "neon" && {
                    textShadow: `0 0 20px ${colors.text}, 0 0 40px ${colors.text}`,
                  }),
                }}
              >
                {headline}
              </h2>

              <p className="flash-sale-supporting">{supportingText}</p>

              <div
                className="flash-sale-discount"
                style={{
                  background: colors.timerBg,
                  color: colors.timerText,
                  width: currentSize.discountSize,
                  height: currentSize.discountSize,
                }}
              >
                <div className="flash-sale-discount-inner">
                  <div
                    className="flash-sale-discount-percent"
                    style={{
                      fontSize: size === "compact" ? "2rem" : size === "standard" ? "2.5rem" : "3rem",
                    }}
                  >
                    {discountPercent}%
                  </div>
                  <div className="flash-sale-discount-label">OFF</div>
                </div>
              </div>

              {(originalPrice || salePrice) && (
                <div className="flash-sale-prices">
                  {originalPrice && <div className="flash-sale-original-price">{originalPrice}</div>}
                  {salePrice && <div className="flash-sale-sale-price">{salePrice}</div>}
                </div>
              )}

              <div className="flash-sale-urgency" style={{ color: colors.accent }}>
                {urgencyMessage}
              </div>

              <div className="flash-sale-timer">
                {timeRemaining.days > 0 && (
                  <div
                    className="flash-sale-timer-unit"
                    style={{
                      background: colors.timerBg,
                      color: colors.timerText,
                    }}
                  >
                    <div className="flash-sale-timer-value">{String(timeRemaining.days).padStart(2, "0")}</div>
                    <div className="flash-sale-timer-label">Days</div>
                  </div>
                )}
                <div
                  className="flash-sale-timer-unit"
                  style={{
                    background: colors.timerBg,
                    color: colors.timerText,
                  }}
                >
                  <div className="flash-sale-timer-value">{String(timeRemaining.hours).padStart(2, "0")}</div>
                  <div className="flash-sale-timer-label">Hours</div>
                </div>
                <div
                  className="flash-sale-timer-unit"
                  style={{
                    background: colors.timerBg,
                    color: colors.timerText,
                  }}
                >
                  <div className="flash-sale-timer-value">{String(timeRemaining.minutes).padStart(2, "0")}</div>
                  <div className="flash-sale-timer-label">Mins</div>
                </div>
                <div
                  className="flash-sale-timer-unit"
                  style={{
                    background: colors.timerBg,
                    color: colors.timerText,
                  }}
                >
                  <div className="flash-sale-timer-value">{String(timeRemaining.seconds).padStart(2, "0")}</div>
                  <div className="flash-sale-timer-label">Secs</div>
                </div>
              </div>

              {stockMessage && (
                <div
                  className="flash-sale-stock"
                  style={{
                    background: colors.timerBg,
                  }}
                >
                  <div className="flash-sale-stock-dot" style={{ background: colors.warning }} />
                  {stockMessage}
                </div>
              )}

              <button
                onClick={onCtaClick}
                className="flash-sale-cta"
                style={{
                  background: colors.ctaBg,
                  color: colors.ctaText,
                  ...(theme === "neon" && {
                    boxShadow: `0 0 30px ${colors.ctaBg}`,
                  }),
                }}
              >
                {ctaText}
              </button>
            </div>
          ) : (
            <div className="flash-sale-expired">
              <div className="flash-sale-expired-icon">
                <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <circle cx="12" cy="12" r="10" />
                  <line x1="12" y1="8" x2="12" y2="12" />
                  <line x1="12" y1="16" x2="12.01" y2="16" />
                </svg>
              </div>
              <h3 style={{ fontSize: "1.5rem", fontWeight: 700, marginBottom: "0.5rem" }}>Sale Has Ended</h3>
              <p style={{ opacity: 0.8 }}>This offer is no longer available.</p>
            </div>
          )}
        </div>
      </div>
    </>
  )
}
