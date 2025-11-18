"use client"

import type React from "react"
import { useState, useEffect } from "react"
import { type PopupTheme, type ThemeColors, getThemeColors } from "@/lib/popup-themes"

export interface CartItem {
  id: string
  name: string
  image?: string
  price: number
  quantity: number
}

export interface CartRecoveryPopupProps {
  /** Whether the popup is open */
  isOpen: boolean
  /** Callback to close the popup */
  onClose: () => void
  /** Theme variant */
  theme?: PopupTheme
  /** Popup title */
  title?: string
  /** Popup description */
  description?: string
  /** Label/badge text */
  badgeText?: string
  /** Button text */
  buttonText?: string
  /** Secondary button text */
  secondaryButtonText?: string
  /** Success message after submission */
  successMessage?: string
  /** Cart items to display in summary */
  cartItems?: CartItem[]
  /** Show cart summary */
  showCartSummary?: boolean
  /** Privacy note text */
  privacyNote?: string
  /** Consent text */
  consentText?: string
  /** Custom color overrides */
  colors?: Partial<ThemeColors>
  /** Callback when form is submitted successfully */
  onSubmit?: (data: { email: string }) => void | Promise<void>
}

export function CartRecoveryPopup({
                                    isOpen,
                                    onClose,
                                    theme = "modern",
                                    title = "Want to save your cart?",
                                    description = "Enter your email and we'll send you a link to restore your cart later.",
                                    badgeText = "Cart Reminder",
                                    buttonText = "Send my cart",
                                    secondaryButtonText = "No thanks",
                                    successMessage = "Your cart is saved!",
                                    cartItems = [],
                                    showCartSummary = true,
                                    privacyNote = "You can unsubscribe at any time.",
                                    consentText = "We'll only email you a link to recover your cart.",
                                    colors: customColors,
                                    onSubmit,
                                  }: CartRecoveryPopupProps) {
  const [email, setEmail] = useState("")
  const [isSubmitted, setIsSubmitted] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState<string>("")

  const colors = getThemeColors(theme, customColors)

  const cartTotal = cartItems.reduce((sum, item) => sum + item.price * item.quantity, 0)
  const cartItemCount = cartItems.reduce((sum, item) => sum + item.quantity, 0)

  // Reset form when popup closes
  useEffect(() => {
    if (!isOpen) {
      const timer = setTimeout(() => {
        setIsSubmitted(false)
        setEmail("")
        setError("")
      }, 300)
      return () => clearTimeout(timer)
    }
  }, [isOpen])

  // Prevent body scroll when popup is open
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

  // Handle ESC key to close
  useEffect(() => {
    const handleEsc = (e: KeyboardEvent) => {
      if (e.key === "Escape" && isOpen) {
        onClose()
      }
    }
    window.addEventListener("keydown", handleEsc)
    return () => window.removeEventListener("keydown", handleEsc)
  }, [isOpen, onClose])

  const validateEmail = (email: string) => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    return emailRegex.test(email)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!email) {
      setError("Email is required")
      return
    }

    if (!validateEmail(email)) {
      setError("Please enter a valid email address")
      return
    }

    setIsSubmitting(true)
    setError("")

    try {
      if (onSubmit) {
        await onSubmit({ email })
      }
      setIsSubmitted(true)
    } catch (error) {
      console.error("Cart recovery submission error:", error)
      setError("Something went wrong. Please try again.")
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleSecondaryAction = () => {
    onClose()
  }

  if (!isOpen) return null

  return (
    <>
      <style>{`
        .cart-recovery-overlay {
          position: fixed;
          inset: 0;
          z-index: 9999;
          display: flex;
          align-items: flex-end;
          justify-content: center;
          animation: fadeIn 0.2s ease-out;
        }

        .cart-recovery-backdrop {
          position: absolute;
          inset: 0;
          background: rgba(0, 0, 0, 0.5);
        }

        .cart-recovery-container {
          position: relative;
          width: 100%;
          background: white;
          border-radius: 1rem 1rem 0 0;
          box-shadow: 0 -10px 40px rgba(0, 0, 0, 0.2);
          animation: slideUp 0.3s ease-out;
          max-height: 85vh;
          overflow-y: auto;
        }

        .cart-recovery-content {
          padding: 1.5rem;
          padding-bottom: 2rem;
        }

        .cart-recovery-header {
          display: flex;
          align-items: flex-start;
          justify-content: space-between;
          margin-bottom: 1.5rem;
        }

        .cart-recovery-close {
          padding: 0.5rem;
          border-radius: 9999px;
          background: rgba(0, 0, 0, 0.05);
          border: none;
          cursor: pointer;
          transition: background 0.2s;
          flex-shrink: 0;
        }

        .cart-recovery-close:hover {
          background: rgba(0, 0, 0, 0.1);
        }

        .cart-recovery-badge {
          display: inline-block;
          padding: 0.375rem 0.75rem;
          border-radius: 9999px;
          font-size: 0.75rem;
          font-weight: 600;
          margin-bottom: 0.75rem;
          text-transform: uppercase;
          letter-spacing: 0.05em;
        }

        .cart-recovery-title {
          font-size: 1.5rem;
          font-weight: 700;
          margin-bottom: 0.5rem;
          line-height: 1.3;
        }

        .cart-recovery-description {
          font-size: 0.9375rem;
          line-height: 1.6;
          margin-bottom: 1.25rem;
        }

        .cart-recovery-summary {
          display: flex;
          align-items: center;
          gap: 0.75rem;
          padding: 0.875rem;
          border-radius: 0.5rem;
          margin-bottom: 1.25rem;
        }

        .cart-recovery-summary-image {
          width: 3rem;
          height: 3rem;
          border-radius: 0.375rem;
          object-fit: cover;
          flex-shrink: 0;
        }

        .cart-recovery-summary-text {
          flex: 1;
          font-size: 0.875rem;
          font-weight: 500;
          display: flex;
          align-items: center;
          gap: 0.5rem;
        }

        .cart-recovery-summary-price {
          font-weight: 700;
          font-size: 1rem;
        }

        .cart-recovery-input-wrapper {
          margin-bottom: 0.75rem;
        }

        .cart-recovery-label {
          display: block;
          font-size: 0.875rem;
          font-weight: 600;
          margin-bottom: 0.5rem;
        }

        .cart-recovery-input {
          width: 100%;
          padding: 0.75rem 1rem;
          border-radius: 0.5rem;
          border: 1px solid;
          font-size: 0.9375rem;
          transition: border-color 0.2s, box-shadow 0.2s;
        }

        .cart-recovery-input:focus {
          outline: none;
          box-shadow: 0 0 0 3px rgba(0, 0, 0, 0.05);
        }

        .cart-recovery-input.error {
          border-color: #dc2626;
        }

        .cart-recovery-error {
          font-size: 0.875rem;
          color: #dc2626;
          margin-top: 0.375rem;
        }

        .cart-recovery-consent {
          font-size: 0.8125rem;
          line-height: 1.5;
          margin-bottom: 1rem;
          opacity: 0.8;
        }

        .cart-recovery-button {
          width: 100%;
          padding: 0.875rem 1.25rem;
          border-radius: 0.5rem;
          border: none;
          font-weight: 600;
          font-size: 1rem;
          cursor: pointer;
          transition: opacity 0.2s, transform 0.1s;
          margin-bottom: 0.75rem;
        }

        .cart-recovery-button:hover:not(:disabled) {
          opacity: 0.9;
        }

        .cart-recovery-button:active:not(:disabled) {
          transform: scale(0.98);
        }

        .cart-recovery-button:disabled {
          opacity: 0.6;
          cursor: not-allowed;
        }

        .cart-recovery-button-secondary {
          width: 100%;
          padding: 0.875rem 1.25rem;
          border-radius: 0.5rem;
          border: none;
          background: transparent;
          font-weight: 500;
          font-size: 0.9375rem;
          cursor: pointer;
          transition: opacity 0.2s;
          text-decoration: underline;
          text-underline-offset: 2px;
        }

        .cart-recovery-button-secondary:hover {
          opacity: 0.7;
        }

        .cart-recovery-privacy {
          font-size: 0.75rem;
          text-align: center;
          opacity: 0.6;
          margin-top: 1rem;
        }

        .cart-recovery-success-icon {
          width: 4rem;
          height: 4rem;
          border-radius: 9999px;
          background: #dcfce7;
          display: flex;
          align-items: center;
          justify-content: center;
          margin: 0 auto 1rem;
        }

        .cart-recovery-success-title {
          font-size: 1.5rem;
          font-weight: 700;
          text-align: center;
          margin-bottom: 0.5rem;
        }

        .cart-recovery-success-description {
          text-align: center;
          line-height: 1.6;
        }

        @keyframes fadeIn {
          from { opacity: 0; }
          to { opacity: 1; }
        }

        @keyframes slideUp {
          from {
            transform: translateY(100%);
          }
          to {
            transform: translateY(0);
          }
        }

        @media (min-width: 768px) {
          .cart-recovery-overlay {
            align-items: center;
            padding: 1rem;
          }

          .cart-recovery-container {
            max-width: 28rem;
            border-radius: 1rem;
            animation: zoomIn 0.2s ease-out;
          }

          .cart-recovery-content {
            padding: 2rem;
          }

          @keyframes zoomIn {
            from {
              opacity: 0;
              transform: scale(0.95);
            }
            to {
              opacity: 1;
              transform: scale(1);
            }
          }
        }
      `}</style>

      <div className="cart-recovery-overlay">
        <div className="cart-recovery-backdrop" onClick={onClose} aria-hidden="true" />

        <div
          className="cart-recovery-container"
          style={{
            background: colors.background,
            color: colors.text,
            ...(colors.blur && { backdropFilter: "blur(20px)" }),
          }}
        >
          <div className="cart-recovery-content">
            <div className="cart-recovery-header">
              <div style={{ flex: 1 }}>
                <div
                  className="cart-recovery-badge"
                  style={{
                    background: colors.accent,
                    color: colors.primary,
                  }}
                >
                  {badgeText}
                </div>
              </div>
              <button onClick={onClose} className="cart-recovery-close" aria-label="Close popup">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <line x1="18" y1="6" x2="6" y2="18" />
                  <line x1="6" y1="6" x2="18" y2="18" />
                </svg>
              </button>
            </div>

            {!isSubmitted ? (
              <>
                <h2 className="cart-recovery-title">{title}</h2>
                <p
                  className="cart-recovery-description"
                  style={{
                    color: colors.descColor,
                  }}
                >
                  {description}
                </p>

                {showCartSummary && cartItems.length > 0 && (
                  <div
                    className="cart-recovery-summary"
                    style={{
                      background: colors.secondary,
                      border: `1px solid ${colors.border}`,
                    }}
                  >
                    {cartItems[0]?.image && (
                      <img
                        src={cartItems[0].image || "/placeholder.svg"}
                        alt={cartItems[0].name}
                        className="cart-recovery-summary-image"
                        style={{
                          background: colors.imageBg,
                        }}
                      />
                    )}
                    <div className="cart-recovery-summary-text">
                      <span>
                        {cartItemCount} {cartItemCount === 1 ? "item" : "items"}
                      </span>
                      <span style={{ opacity: 0.5 }}>•</span>
                      <span className="cart-recovery-summary-price">${cartTotal.toFixed(2)} total</span>
                    </div>
                  </div>
                )}

                <form onSubmit={handleSubmit}>
                  <div className="cart-recovery-input-wrapper">
                    <label htmlFor="cart-email" className="cart-recovery-label">
                      Email address
                    </label>
                    <input
                      id="cart-email"
                      type="email"
                      placeholder="you@example.com"
                      value={email}
                      onChange={(e) => {
                        setEmail(e.target.value)
                        if (error) setError("")
                      }}
                      className={`cart-recovery-input ${error ? "error" : ""}`}
                      style={{
                        borderColor: error ? "#dc2626" : colors.inputBorder,
                        background:
                          theme === "glass" || theme === "gradient" || theme === "dark" || theme === "luxury" || theme === "neon"
                            ? colors.secondary
                            : "transparent",
                        color: colors.text,
                        ...(colors.blur && { backdropFilter: "blur(10px)" }),
                      }}
                      disabled={isSubmitting}
                    />
                    {error && <div className="cart-recovery-error">{error}</div>}
                  </div>

                  <p className="cart-recovery-consent" style={{ color: colors.descColor }}>
                    {consentText}
                  </p>

                  <button
                    type="submit"
                    className="cart-recovery-button"
                    style={{
                      background: colors.ctaBg,
                      color: colors.ctaText,
                    }}
                    disabled={isSubmitting}
                  >
                    {isSubmitting ? "Sending..." : buttonText}
                  </button>

                  <button
                    type="button"
                    className="cart-recovery-button-secondary"
                    style={{
                      color: colors.descColor,
                    }}
                    onClick={handleSecondaryAction}
                  >
                    {secondaryButtonText}
                  </button>
                </form>

                <p className="cart-recovery-privacy" style={{ color: colors.descColor }}>
                  {privacyNote}
                </p>
              </>
            ) : (
              <div style={{ padding: "2rem 0" }}>
                <div className="cart-recovery-success-icon">
                  <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="#16a34a" strokeWidth="3">
                    <polyline points="20 6 9 17 4 12" />
                  </svg>
                </div>
                <h3 className="cart-recovery-success-title">Success!</h3>
                <p
                  className="cart-recovery-success-description"
                  style={{
                    color: colors.descColor,
                  }}
                >
                  {successMessage}
                  <br />
                  We've sent you a link to restore your cart.
                </p>
              </div>
            )}
          </div>
        </div>
      </div>
    </>
  )
}
