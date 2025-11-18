"use client"

import { useState, useEffect, useMemo } from "react"
import type { PopupTheme, ThemeColors } from "@/lib/popup-themes"
import { getThemeColors } from "@/lib/popup-themes"

export type BannerPosition = "top" | "bottom"
export type ColorScheme = "urgent" | "success" | "info" | "custom"

export interface CountdownTimerBannerProps {
  isVisible: boolean
  theme?: PopupTheme
  customColors?: Partial<ThemeColors>
  position?: BannerPosition
  colorScheme?: ColorScheme
  headline: string
  subheadline?: string
  endTime?: Date
  countdownDuration?: number
  ctaText: string
  ctaUrl?: string
  onCtaClick?: () => void
  showStockCounter?: boolean
  stockCount?: number
  showCloseButton?: boolean
  onClose?: () => void
  hideOnExpiry?: boolean
  sticky?: boolean
}

interface TimeRemaining {
  days: number
  hours: number
  minutes: number
  seconds: number
  total: number
}

export function CountdownTimerBanner({
  isVisible,
  theme = "modern",
  customColors,
  position = "top",
  colorScheme = "urgent",
  headline,
  subheadline,
  endTime,
  countdownDuration,
  ctaText,
  ctaUrl,
  onCtaClick,
  showStockCounter = false,
  stockCount,
  showCloseButton = true,
  onClose,
  hideOnExpiry = true,
  sticky = true,
}: CountdownTimerBannerProps) {
  const [isDismissed, setIsDismissed] = useState(false)
  const [timeRemaining, setTimeRemaining] = useState<TimeRemaining>({ days: 0, hours: 0, minutes: 0, seconds: 0, total: 0 })
  const [isExpired, setIsExpired] = useState(false)

  const colors = useMemo(() => getThemeColors(theme, customColors), [theme, customColors])

  const calculateTimeRemaining = (targetTime: Date): TimeRemaining => {
    const now = new Date().getTime()
    const target = targetTime.getTime()
    const difference = target - now

    if (difference <= 0) {
      return { days: 0, hours: 0, minutes: 0, seconds: 0, total: 0 }
    }

    return {
      days: Math.floor(difference / (1000 * 60 * 60 * 24)),
      hours: Math.floor((difference % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60)),
      minutes: Math.floor((difference % (1000 * 60 * 60)) / (1000 * 60)),
      seconds: Math.floor((difference % (1000 * 60)) / 1000),
      total: difference,
    }
  }

  useEffect(() => {
    let targetTime: Date

    if (endTime) {
      targetTime = endTime
    } else if (countdownDuration) {
      targetTime = new Date(Date.now() + countdownDuration)
    } else {
      targetTime = new Date(Date.now() + 24 * 60 * 60 * 1000)
    }

    const updateTimer = () => {
      const remaining = calculateTimeRemaining(targetTime)
      setTimeRemaining(remaining)

      if (remaining.total <= 0 && !isExpired) {
        setIsExpired(true)
        if (hideOnExpiry) {
          setIsDismissed(true)
        }
      }
    }

    updateTimer()
    const interval = setInterval(updateTimer, 1000)

    return () => clearInterval(interval)
  }, [endTime, countdownDuration, hideOnExpiry, isExpired])

  const handleClose = () => {
    setIsDismissed(true)
    if (onClose) {
      onClose()
    }
  }

  const handleCtaClick = () => {
    if (onCtaClick) {
      onCtaClick()
    } else if (ctaUrl) {
      window.location.href = ctaUrl
    }
  }

  if (!isVisible || isDismissed) {
    return null
  }

  const positionStyle = sticky
    ? {
        position: "fixed" as const,
        [position]: 0,
        left: 0,
        right: 0,
        zIndex: 9999,
      }
    : {
        position: "relative" as const,
      }

  const getColorSchemeStyles = () => {
    switch (colorScheme) {
      case "urgent":
        return {
          background: "linear-gradient(135deg, #dc2626 0%, #f97316 100%)",
          text: "#ffffff",
          timerBg: "rgba(255, 255, 255, 0.2)",
          timerText: "#ffffff",
          ctaBg: "#ffffff",
          ctaText: "#dc2626",
        }
      case "success":
        return {
          background: "linear-gradient(135deg, #10b981 0%, #14b8a6 100%)",
          text: "#ffffff",
          timerBg: "rgba(255, 255, 255, 0.2)",
          timerText: "#ffffff",
          ctaBg: "#ffffff",
          ctaText: "#10b981",
        }
      case "info":
        return {
          background: "linear-gradient(135deg, #3b82f6 0%, #6366f1 100%)",
          text: "#ffffff",
          timerBg: "rgba(255, 255, 255, 0.2)",
          timerText: "#ffffff",
          ctaBg: "#ffffff",
          ctaText: "#3b82f6",
        }
      default:
        return {
          background: colors.background,
          text: colors.text,
          timerBg: colors.timerBg || colors.secondary,
          timerText: colors.timerText || colors.text,
          ctaBg: colors.ctaBg || colors.primary,
          ctaText: colors.ctaText || "#ffffff",
        }
    }
  }

  const schemeColors = getColorSchemeStyles()

  return (
    <>
      <style>
        {`
          .countdown-banner {
            font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif;
            ${colors.blur ? "backdrop-filter: blur(10px);" : ""}
          }

          .countdown-banner-content {
            max-width: 1200px;
            margin: 0 auto;
            padding: 1rem 1.5rem;
            display: flex;
            align-items: center;
            justify-content: space-between;
            gap: 1.5rem;
            position: relative;
            padding-right: 3.5rem; // Added padding to prevent close button overlap with content
          }

          .countdown-banner-left {
            flex: 1;
            min-width: 0;
          }

          .countdown-banner-headline {
            font-size: 1.125rem;
            font-weight: 700;
            line-height: 1.4;
            margin: 0 0 0.25rem 0;
          }

          .countdown-banner-subheadline {
            font-size: 0.875rem;
            line-height: 1.4;
            margin: 0;
            opacity: 0.9;
          }

          .countdown-banner-center {
            display: flex;
            flex-direction: column;
            align-items: center;
            gap: 0.5rem;
          }

          .countdown-banner-timer {
            display: flex;
            gap: 0.5rem;
            align-items: center;
          }

          .countdown-banner-timer-unit {
            display: flex;
            flex-direction: column;
            align-items: center;
            padding: 0.5rem 0.75rem;
            border-radius: 0.375rem;
            min-width: 3.5rem;
          }

          .countdown-banner-timer-value {
            font-size: 1.5rem;
            font-weight: 700;
            line-height: 1;
            font-variant-numeric: tabular-nums;
          }

          .countdown-banner-timer-label {
            font-size: 0.625rem;
            text-transform: uppercase;
            opacity: 0.8;
            margin-top: 0.25rem;
            letter-spacing: 0.5px;
          }

          .countdown-banner-timer-separator {
            font-size: 1.25rem;
            font-weight: 700;
            opacity: 0.6;
          }

          .countdown-banner-stock {
            font-size: 0.75rem;
            font-weight: 600;
            padding: 0.25rem 0.75rem;
            border-radius: 999px;
            background: rgba(255, 255, 255, 0.2);
            white-space: nowrap;
          }

          .countdown-banner-right {
            display: flex;
            align-items: center;
            gap: 0.75rem;
          }

          .countdown-banner-cta {
            padding: 0.75rem 1.5rem;
            font-size: 1rem;
            font-weight: 600;
            border: none;
            border-radius: 0.375rem;
            cursor: pointer;
            white-space: nowrap;
            transition: transform 0.2s, box-shadow 0.2s;
            box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
          }

          .countdown-banner-cta:hover {
            transform: translateY(-1px);
            box-shadow: 0 4px 8px rgba(0, 0, 0, 0.15);
          }

          .countdown-banner-cta:active {
            transform: translateY(0);
          }

          .countdown-banner-cta:disabled {
            opacity: 0.5;
            cursor: not-allowed;
            transform: none;
          }

          .countdown-banner-close {
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
            z-index: 10; // Added z-index to ensure close button is above other content
          }

          .countdown-banner-close:hover {
            opacity: 1;
          }

          .countdown-banner-expired {
            text-align: center;
            padding: 0.5rem;
            font-weight: 600;
          }

          @media (max-width: 768px) {
            .countdown-banner-content {
              flex-direction: column;
              padding: 1.25rem 1rem;
              gap: 1rem;
              text-align: center;
              padding-right: 3rem; // Added more padding on mobile to prevent overlap
            }

            .countdown-banner-left {
              order: 1;
            }

            .countdown-banner-center {
              order: 2;
            }

            .countdown-banner-right {
              order: 3;
              width: 100%;
            }

            .countdown-banner-cta {
              width: 100%;
            }

            .countdown-banner-headline {
              font-size: 1rem;
            }

            .countdown-banner-subheadline {
              font-size: 0.8125rem;
            }

            .countdown-banner-timer-unit {
              min-width: 3rem;
              padding: 0.375rem 0.5rem;
            }

            .countdown-banner-timer-value {
              font-size: 1.25rem;
            }

            .countdown-banner-timer-label {
              font-size: 0.5625rem;
            }

            .countdown-banner-close {
              top: 0.5rem;
              right: 0.5rem;
            }
          }

          @media (max-width: 480px) {
            .countdown-banner-content {
              padding: 1rem 0.75rem;
              padding-right: 2.5rem; // Ensure padding on small screens too
            }

            .countdown-banner-timer {
              gap: 0.25rem;
            }

            .countdown-banner-timer-unit {
              min-width: 2.5rem;
              padding: 0.25rem 0.375rem;
            }

            .countdown-banner-timer-value {
              font-size: 1.125rem;
            }

            .countdown-banner-timer-separator {
              font-size: 1rem;
            }
          }
        `}
      </style>

      <div
        className="countdown-banner"
        style={{
          ...positionStyle,
          background: schemeColors.background,
          color: schemeColors.text,
          boxShadow: position === "top" ? "0 2px 8px rgba(0, 0, 0, 0.1)" : "0 -2px 8px rgba(0, 0, 0, 0.1)",
        }}
      >
        <div className="countdown-banner-content">
          {showCloseButton && (
            <button
              className="countdown-banner-close"
              onClick={handleClose}
              style={{ color: schemeColors.text }}
              aria-label="Close banner"
            >
              ×
            </button>
          )}

          <div className="countdown-banner-left">
            <h2 className="countdown-banner-headline">{headline}</h2>
            {subheadline && <p className="countdown-banner-subheadline">{subheadline}</p>}
          </div>

          <div className="countdown-banner-center">
            {!isExpired ? (
              <>
                <div className="countdown-banner-timer">
                  {timeRemaining.days > 0 && (
                    <>
                      <div
                        className="countdown-banner-timer-unit"
                        style={{
                          background: schemeColors.timerBg,
                          color: schemeColors.timerText,
                        }}
                      >
                        <div className="countdown-banner-timer-value">{String(timeRemaining.days).padStart(2, "0")}</div>
                        <div className="countdown-banner-timer-label">Days</div>
                      </div>
                      <span className="countdown-banner-timer-separator" style={{ color: schemeColors.text }}>
                        :
                      </span>
                    </>
                  )}

                  <div
                    className="countdown-banner-timer-unit"
                    style={{
                      background: schemeColors.timerBg,
                      color: schemeColors.timerText,
                    }}
                  >
                    <div className="countdown-banner-timer-value">{String(timeRemaining.hours).padStart(2, "0")}</div>
                    <div className="countdown-banner-timer-label">Hours</div>
                  </div>

                  <span className="countdown-banner-timer-separator" style={{ color: schemeColors.text }}>
                    :
                  </span>

                  <div
                    className="countdown-banner-timer-unit"
                    style={{
                      background: schemeColors.timerBg,
                      color: schemeColors.timerText,
                    }}
                  >
                    <div className="countdown-banner-timer-value">{String(timeRemaining.minutes).padStart(2, "0")}</div>
                    <div className="countdown-banner-timer-label">Mins</div>
                  </div>

                  <span className="countdown-banner-timer-separator" style={{ color: schemeColors.text }}>
                    :
                  </span>

                  <div
                    className="countdown-banner-timer-unit"
                    style={{
                      background: schemeColors.timerBg,
                      color: schemeColors.timerText,
                    }}
                  >
                    <div className="countdown-banner-timer-value">{String(timeRemaining.seconds).padStart(2, "0")}</div>
                    <div className="countdown-banner-timer-label">Secs</div>
                  </div>
                </div>

                {showStockCounter && stockCount && (
                  <div className="countdown-banner-stock" style={{ color: schemeColors.text }}>
                    ⚡ Only {stockCount} left in stock
                  </div>
                )}
              </>
            ) : (
              <div className="countdown-banner-expired" style={{ color: schemeColors.text }}>
                Offer has ended
              </div>
            )}
          </div>

          <div className="countdown-banner-right">
            <button
              className="countdown-banner-cta"
              onClick={handleCtaClick}
              disabled={isExpired}
              style={{
                background: schemeColors.ctaBg,
                color: schemeColors.ctaText,
              }}
            >
              {isExpired ? "Offer Expired" : ctaText}
            </button>
          </div>
        </div>
      </div>
    </>
  )
}
