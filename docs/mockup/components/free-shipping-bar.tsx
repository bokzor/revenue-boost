"use client"

import type React from "react"

import { useEffect, useState, useRef } from "react"
import type { PopupTheme, ThemeColors } from "@/lib/popup-themes"
import { getThemeColors } from "@/lib/popup-themes"

export type ShippingBarPosition = "top" | "bottom"
export type ShippingBarState = "empty" | "progress" | "near-miss" | "unlocked"

export interface FreeShippingBarProps {
  isVisible: boolean
  onClose?: () => void
  theme?: PopupTheme
  customColors?: Partial<ThemeColors>
  position?: ShippingBarPosition
  threshold: number
  currentValue: number
  currency?: string
  nearMissThreshold?: number
  emptyMessage?: string
  progressMessage?: string
  nearMissMessage?: string
  unlockedMessage?: string
  dismissible?: boolean
  isDismissed?: boolean
  celebrateOnUnlock?: boolean
  showIcon?: boolean
  animationDuration?: number
  showEmailCapture?: boolean
  claimButtonText?: string
  emailPlaceholder?: string
  onEmailSubmit?: (email: string) => void
}

export function FreeShippingBar({
  isVisible,
  onClose,
  theme = "modern",
  customColors,
  position = "top",
  threshold,
  currentValue,
  currency = "$",
  nearMissThreshold = 10,
  emptyMessage = "Add items to unlock free shipping",
  progressMessage = "You're {remaining} away from free shipping",
  nearMissMessage = "Only {remaining} to go!",
  unlockedMessage = "You've unlocked free shipping! 🎉",
  dismissible = true,
  isDismissed = false,
  celebrateOnUnlock = true,
  showIcon = true,
  animationDuration = 500,
  showEmailCapture = false,
  claimButtonText = "Claim Discount",
  emailPlaceholder = "Enter your email",
  onEmailSubmit,
}: FreeShippingBarProps) {
  const colors = getThemeColors(theme, customColors)
  const [internalDismissed, setInternalDismissed] = useState(isDismissed)
  const [prevProgress, setPrevProgress] = useState(0)
  const [celebrating, setCelebrating] = useState(false)
  const prevUnlockedRef = useRef(false)
  const [showEmailInput, setShowEmailInput] = useState(false)
  const [email, setEmail] = useState("")
  const [emailSubmitted, setEmailSubmitted] = useState(false)

  const remaining = Math.max(0, threshold - currentValue)
  const progress = Math.min(1, Math.max(0, currentValue / threshold))
  const state: ShippingBarState =
    currentValue === 0
      ? "empty"
      : remaining === 0
        ? "unlocked"
        : remaining <= nearMissThreshold
          ? "near-miss"
          : "progress"

  const formatCurrency = (value: number) => {
    return `${currency}${value.toFixed(2)}`
  }

  const getMessage = () => {
    const remainingFormatted = formatCurrency(remaining)

    switch (state) {
      case "empty":
        return emptyMessage
      case "unlocked":
        return unlockedMessage
      case "near-miss":
        return nearMissMessage.replace("{remaining}", remainingFormatted)
      case "progress":
      default:
        return progressMessage.replace("{remaining}", remainingFormatted)
    }
  }

  useEffect(() => {
    const isUnlocked = state === "unlocked"
    const wasLocked = prevUnlockedRef.current === false

    if (isUnlocked && wasLocked && celebrateOnUnlock) {
      setCelebrating(true)
      const timer = setTimeout(() => setCelebrating(false), 1000)
      return () => clearTimeout(timer)
    }

    prevUnlockedRef.current = isUnlocked
  }, [state, celebrateOnUnlock])

  useEffect(() => {
    const timer = setTimeout(() => setPrevProgress(progress), animationDuration)
    return () => clearTimeout(timer)
  }, [progress, animationDuration])

  const handleDismiss = () => {
    setInternalDismissed(true)
    onClose?.()
  }

  const handleEmailSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (email && email.includes("@")) {
      onEmailSubmit?.(email)
      setEmailSubmitted(true)
    }
  }

  const handleClaimClick = () => {
    setShowEmailInput(true)
  }

  if (!isVisible || internalDismissed) {
    return null
  }

  return (
    <>
      <style>{`
        .free-shipping-bar {
          position: fixed;
          left: 0;
          right: 0;
          width: 100%;
          z-index: 9999;
          font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif;
          box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
          transition: transform 0.3s ease-in-out;
        }

        .free-shipping-bar[data-position="top"] {
          top: 0;
        }

        .free-shipping-bar[data-position="bottom"] {
          bottom: 0;
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

        .free-shipping-bar-claim-button {
          background: var(--claim-button-bg);
          color: var(--claim-button-text);
          border: none;
          padding: 0.5rem 1.25rem;
          font-size: 0.875rem;
          font-weight: 600;
          border-radius: 0.375rem;
          cursor: pointer;
          transition: opacity 0.2s, transform 0.2s;
          white-space: nowrap;
          flex-shrink: 0;
        }

        .free-shipping-bar-claim-button:hover {
          opacity: 0.9;
          transform: translateY(-1px);
        }

        .free-shipping-bar-claim-button:active {
          transform: translateY(0);
        }

        .free-shipping-bar-email-form {
          display: flex;
          gap: 0.5rem;
          align-items: center;
          flex-shrink: 0;
        }

        .free-shipping-bar-email-input {
          padding: 0.5rem 0.75rem;
          border: 1px solid currentColor;
          border-radius: 0.375rem;
          font-size: 0.875rem;
          background: rgba(255, 255, 255, 0.1);
          color: inherit;
          min-width: 200px;
        }

        .free-shipping-bar-email-input::placeholder {
          color: currentColor;
          opacity: 0.6;
        }

        .free-shipping-bar-email-input:focus {
          outline: 2px solid currentColor;
          outline-offset: 2px;
          background: rgba(255, 255, 255, 0.15);
        }

        .free-shipping-bar-email-submit {
          background: var(--claim-button-bg);
          color: var(--claim-button-text);
          border: none;
          padding: 0.5rem 1rem;
          font-size: 0.875rem;
          font-weight: 600;
          border-radius: 0.375rem;
          cursor: pointer;
          transition: opacity 0.2s;
          white-space: nowrap;
        }

        .free-shipping-bar-email-submit:hover {
          opacity: 0.9;
        }

        .free-shipping-bar-email-submit:disabled {
          opacity: 0.5;
          cursor: not-allowed;
        }

        .free-shipping-bar-success-message {
          font-size: 0.875rem;
          font-weight: 500;
          color: var(--success-color);
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
          
          .free-shipping-bar[data-state="unlocked"] .free-shipping-bar-progress {
            animation: none;
          }
        }

        @media (max-width: 640px) {
          .free-shipping-bar-content {
            padding: 0.75rem 1rem;
            gap: 0.75rem;
            flex-wrap: wrap;
          }

          .free-shipping-bar-text {
            font-size: 0.875rem;
          }

          .free-shipping-bar-icon {
            font-size: 1.125rem;
          }

          .free-shipping-bar-email-input {
            min-width: 150px;
            flex: 1;
          }

          .free-shipping-bar-email-form {
            width: 100%;
          }

          .free-shipping-bar-claim-button {
            padding: 0.5rem 1rem;
            font-size: 0.8125rem;
          }
        }
      `}</style>

      <div
        className="free-shipping-bar"
        data-position={position}
        data-state={state}
        role="region"
        aria-live="polite"
        aria-atomic="true"
        style={
          {
            background: colors.background,
            color: colors.text,
            "--shipping-bar-progress-bg":
              state === "unlocked" ? colors.success : state === "near-miss" ? colors.warning : colors.primary,
            "--claim-button-bg": colors.primary,
            "--claim-button-text": colors.buttonText,
            "--success-color": colors.success,
          } as React.CSSProperties & { [key: `--${string}`]: string }
        }
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
                {state === "unlocked" ? "✓" : state === "near-miss" ? "⚡" : "🚚"}
              </span>
            )}
            <p className="free-shipping-bar-text">{getMessage()}</p>
          </div>

          {state === "unlocked" && showEmailCapture && !emailSubmitted && (
            <>
              {!showEmailInput ? (
                <button className="free-shipping-bar-claim-button" onClick={handleClaimClick}>
                  {claimButtonText}
                </button>
              ) : (
                <form className="free-shipping-bar-email-form" onSubmit={handleEmailSubmit}>
                  <input
                    type="email"
                    className="free-shipping-bar-email-input"
                    placeholder={emailPlaceholder}
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                    autoFocus
                  />
                  <button
                    type="submit"
                    className="free-shipping-bar-email-submit"
                    disabled={!email || !email.includes("@")}
                  >
                    Submit
                  </button>
                </form>
              )}
            </>
          )}

          {emailSubmitted && (
            <span className="free-shipping-bar-success-message">✓ Discount claimed!</span>
          )}

          {dismissible && (
            <button
              className="free-shipping-bar-close"
              onClick={handleDismiss}
              aria-label="Dismiss shipping bar"
              style={{ color: colors.text }}
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
  )
}
