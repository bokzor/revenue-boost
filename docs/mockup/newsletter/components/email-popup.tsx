"use client"

import type React from "react"
import { useState, useEffect } from "react"

export type PopupTheme =
  | "modern"
  | "minimal"
  | "elegant"
  | "bold"
  | "glass"
  | "dark"
  | "gradient"
  | "luxury"
  | "neon"
  | "ocean"
export type ImagePosition = "left" | "right" | "top" | "bottom" | "none"

export interface EmailPopupProps {
  /** Whether the popup is open */
  isOpen: boolean
  /** Callback to close the popup */
  onClose: () => void
  /** Theme variant */
  theme?: PopupTheme
  /** Image position relative to form */
  imagePosition?: ImagePosition
  /** Image URL or placeholder query */
  imageUrl?: string
  /** Popup title */
  title?: string
  /** Popup description */
  description?: string
  /** Button text */
  buttonText?: string
  /** Success message after submission */
  successMessage?: string
  /** Optional discount code to show on success */
  discountCode?: string
  /** Whether to show GDPR checkbox (required for GDPR compliance) */
  showGdprCheckbox?: boolean
  /** GDPR checkbox label */
  gdprLabel?: string
  /** Whether to collect name field */
  collectName?: boolean
  /** Custom color overrides */
  colors?: {
    primary?: string
    secondary?: string
    accent?: string
    background?: string
    text?: string
  }
  /** Callback when form is submitted successfully */
  onSubmit?: (data: { email: string; name?: string; gdprConsent: boolean }) => void | Promise<void>
}

export function EmailPopup({
  isOpen,
  onClose,
  theme = "modern",
  imagePosition = "left",
  imageUrl,
  title = "Join Our Newsletter",
  description = "Subscribe to get special offers, free giveaways, and exclusive deals.",
  buttonText = "Subscribe",
  successMessage = "Thank you for subscribing!",
  discountCode,
  showGdprCheckbox = true,
  gdprLabel = "I agree to receive marketing emails and accept the privacy policy",
  collectName = true,
  colors,
  onSubmit,
}: EmailPopupProps) {
  const [email, setEmail] = useState("")
  const [name, setName] = useState("")
  const [gdprConsent, setGdprConsent] = useState(false)
  const [isSubmitted, setIsSubmitted] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [errors, setErrors] = useState<{ email?: string; name?: string; gdpr?: string }>({})

  // Reset form when popup closes
  useEffect(() => {
    if (!isOpen) {
      const timer = setTimeout(() => {
        setIsSubmitted(false)
        setEmail("")
        setName("")
        setGdprConsent(false)
        setErrors({})
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

  const validateForm = () => {
    const newErrors: { email?: string; name?: string; gdpr?: string } = {}

    // Email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!email) {
      newErrors.email = "Email is required"
    } else if (!emailRegex.test(email)) {
      newErrors.email = "Please enter a valid email"
    }

    // Name validation
    if (collectName && !name.trim()) {
      newErrors.name = "Name is required"
    }

    // GDPR validation
    if (showGdprCheckbox && !gdprConsent) {
      newErrors.gdpr = "You must accept the terms to continue"
    }

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!validateForm()) return

    setIsSubmitting(true)

    try {
      if (onSubmit) {
        await onSubmit({
          email,
          name: collectName ? name : undefined,
          gdprConsent,
        })
      }
      setIsSubmitted(true)
    } catch (error) {
      console.error("Popup form submission error:", error)
      setErrors({ email: "Something went wrong. Please try again." })
    } finally {
      setIsSubmitting(false)
    }
  }

  if (!isOpen) return null

  const showImage = imagePosition !== "none"
  const isVertical = imagePosition === "left" || imagePosition === "right"
  const imageFirst = imagePosition === "left" || imagePosition === "top"
  const defaultImage = imageUrl || `/placeholder.svg?height=600&width=500&query=modern email newsletter subscription`

  return (
    <>
      <style>{`
        .email-popup-overlay {
          position: fixed;
          inset: 0;
          z-index: 9999;
          display: flex;
          align-items: center;
          justify-content: center;
          padding: 1rem;
          animation: fadeIn 0.2s ease-out;
        }
        
        .email-popup-backdrop {
          position: absolute;
          inset: 0;
          background: rgba(0, 0, 0, 0.6);
          backdrop-filter: blur(4px);
        }
        
        .email-popup-container {
          position: relative;
          width: 100%;
          max-width: 80rem;
          border-radius: 1rem;
          overflow: hidden;
          box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.25);
          animation: zoomIn 0.2s ease-out;
        }
        
        .email-popup-close {
          position: absolute;
          top: 1rem;
          right: 1rem;
          z-index: 10;
          padding: 0.5rem;
          border-radius: 9999px;
          background: rgba(0, 0, 0, 0.1);
          border: none;
          cursor: pointer;
          transition: background 0.2s;
        }
        
        .email-popup-close:hover {
          background: rgba(0, 0, 0, 0.2);
        }
        
        .email-popup-content {
          display: flex;
        }
        
        .email-popup-content.horizontal {
          flex-direction: column;
        }
        
        .email-popup-content.horizontal.reverse {
          flex-direction: column-reverse;
        }
        
        .email-popup-content.vertical {
          flex-direction: column;
        }
        
        .email-popup-content.vertical.reverse {
          flex-direction: column-reverse;
        }
        
        .email-popup-content.single-column {
          flex-direction: column;
        }
        
        .email-popup-content.single-column .email-popup-form-section {
          max-width: 32rem;
          margin: 0 auto;
        }
        
        .email-popup-image {
          position: relative;
          overflow: hidden;
          display: flex;
          align-items: center;
          justify-content: center;
        }
        
        .email-popup-image img {
          width: 100%;
          height: 100%;
          object-fit: cover;
        }
        
        .email-popup-form-section {
          padding: 2rem;
          display: flex;
          flex-direction: column;
          justify-content: center;
        }
        
        .email-popup-input {
          width: 100%;
          padding: 0.625rem 0.75rem;
          border-radius: 0.375rem;
          border: 1px solid;
          font-size: 0.875rem;
          transition: border-color 0.2s, box-shadow 0.2s;
        }
        
        .email-popup-input:focus {
          outline: none;
          border-color: currentColor;
          box-shadow: 0 0 0 3px rgba(0, 0, 0, 0.1);
        }
        
        .email-popup-input.error {
          border-color: #dc2626;
        }
        
        .email-popup-checkbox {
          width: 1rem;
          height: 1rem;
          border-radius: 0.25rem;
          border: 1px solid;
          cursor: pointer;
          flex-shrink: 0;
        }
        
        .email-popup-button {
          width: 100%;
          padding: 0.625rem 1rem;
          border-radius: 0.375rem;
          border: none;
          font-weight: 500;
          cursor: pointer;
          transition: opacity 0.2s, transform 0.1s;
          font-size: 0.875rem;
        }
        
        .email-popup-button:hover:not(:disabled) {
          opacity: 0.9;
        }
        
        .email-popup-button:active:not(:disabled) {
          transform: scale(0.98);
        }
        
        .email-popup-button:disabled {
          opacity: 0.6;
          cursor: not-allowed;
        }
        
        .email-popup-label {
          display: block;
          font-size: 0.875rem;
          font-weight: 500;
          margin-bottom: 0.5rem;
        }
        
        .email-popup-error {
          font-size: 0.875rem;
          color: #dc2626;
          margin-top: 0.25rem;
        }
        
        .email-popup-success-icon {
          width: 4rem;
          height: 4rem;
          border-radius: 9999px;
          background: #dcfce7;
          display: flex;
          align-items: center;
          justify-content: center;
          margin: 0 auto 1rem;
        }
        
        .email-popup-discount {
          display: inline-block;
          padding: 0.75rem 1.5rem;
          border-radius: 0.5rem;
          border: 2px dashed currentColor;
        }
        
        @keyframes fadeIn {
          from { opacity: 0; }
          to { opacity: 1; }
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
        
        @media (min-width: 768px) {
          .email-popup-content.horizontal .email-popup-image {
            height: 16rem;
          }
          
          .email-popup-content.vertical {
            flex-direction: row;
          }
          
          .email-popup-content.vertical.reverse {
            flex-direction: row-reverse;
          }
          
          .email-popup-content.vertical .email-popup-image {
            width: 50%;
            height: auto;
          }
          
          .email-popup-content.vertical .email-popup-form-section {
            width: 50%;
          }
          
          .email-popup-form-section {
            padding: 3rem;
          }
          
          .email-popup-content.single-column .email-popup-form-section {
            max-width: 36rem;
          }
        }
        
        @media (max-width: 767px) {
          .email-popup-content.horizontal .email-popup-image {
            height: 12rem;
          }
          
          .email-popup-content.vertical .email-popup-image {
            height: 12rem;
          }
        }
      `}</style>

      <div className="email-popup-overlay">
        <div className="email-popup-backdrop" onClick={onClose} aria-hidden="true" />

        <div
          className="email-popup-container"
          style={{
            background: colors?.background || "#ffffff",
            color: colors?.text || "#18181b",
            ...(colors?.blur && { backdropFilter: "blur(20px)" }),
          }}
        >
          <button onClick={onClose} className="email-popup-close" aria-label="Close popup">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <line x1="18" y1="6" x2="6" y2="18" />
              <line x1="6" y1="6" x2="18" y2="18" />
            </svg>
          </button>

          <div
            className={`email-popup-content ${
              !showImage ? "single-column" : isVertical ? "vertical" : "horizontal"
            } ${!imageFirst && showImage ? "reverse" : ""}`}
          >
            {showImage && (
              <div
                className="email-popup-image"
                style={{
                  background: colors?.imageBg || "#f4f4f5",
                }}
              >
                <img src={defaultImage || "/placeholder.svg"} alt="Newsletter" />
              </div>
            )}

            <div className="email-popup-form-section">
              {!isSubmitted ? (
                <>
                  <h2
                    style={{
                      fontSize: theme === "minimal" ? "1.5rem" : "1.875rem",
                      fontWeight: theme === "minimal" ? 300 : theme === "bold" || theme === "neon" ? 900 : 700,
                      marginBottom: "0.75rem",
                      lineHeight: 1.2,
                      fontFamily: theme === "elegant" || theme === "luxury" ? "serif" : "inherit",
                      ...(theme === "neon" && {
                        textShadow: "0 0 20px currentColor, 0 0 40px currentColor",
                      }),
                    }}
                  >
                    {title}
                  </h2>
                  <p
                    style={{
                      color: colors?.descColor || "#52525b",
                      marginBottom: "1.5rem",
                      fontSize: theme === "minimal" ? "0.875rem" : "1rem",
                      lineHeight: 1.6,
                      fontWeight: theme === "bold" ? 500 : 400,
                    }}
                  >
                    {description}
                  </p>

                  <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
                    {collectName && (
                      <div>
                        <label htmlFor="name" className="email-popup-label">
                          Name
                        </label>
                        <input
                          id="name"
                          type="text"
                          placeholder="Enter your name"
                          value={name}
                          onChange={(e) => {
                            setName(e.target.value)
                            if (errors.name) setErrors({ ...errors, name: undefined })
                          }}
                          className={`email-popup-input ${errors.name ? "error" : ""}`}
                          style={{
                            borderColor: errors.name ? "#dc2626" : colors?.inputBorder || "#d4d4d8",
                            ...(theme === "glass" && {
                              background: "rgba(255, 255, 255, 0.5)",
                              backdropFilter: "blur(10px)",
                            }),
                            ...(theme === "gradient" && {
                              background: "rgba(255, 255, 255, 0.15)",
                              backdropFilter: "blur(10px)",
                              color: "#ffffff",
                            }),
                            ...(theme === "dark" && {
                              background: "#18181b",
                              color: "#fafafa",
                            }),
                            ...(theme === "luxury" && {
                              background: "#2a2a1a",
                              color: "#d4af37",
                            }),
                            ...(theme === "neon" && {
                              background: "#1a1a3a",
                              color: "#00ffff",
                              boxShadow: "0 0 10px rgba(0, 255, 255, 0.1)",
                            }),
                          }}
                          disabled={isSubmitting}
                        />
                        {errors.name && <div className="email-popup-error">{errors.name}</div>}
                      </div>
                    )}

                    <div>
                      <label htmlFor="email" className="email-popup-label">
                        Email
                      </label>
                      <input
                        id="email"
                        type="email"
                        placeholder="Enter your email"
                        value={email}
                        onChange={(e) => {
                          setEmail(e.target.value)
                          if (errors.email) setErrors({ ...errors, email: undefined })
                        }}
                        className={`email-popup-input ${errors.email ? "error" : ""}`}
                        style={{
                          borderColor: errors.email ? "#dc2626" : colors?.inputBorder || "#d4d4d8",
                          ...(theme === "glass" && {
                            background: "rgba(255, 255, 255, 0.5)",
                            backdropFilter: "blur(10px)",
                          }),
                          ...(theme === "gradient" && {
                            background: "rgba(255, 255, 255, 0.15)",
                            backdropFilter: "blur(10px)",
                            color: "#ffffff",
                          }),
                          ...(theme === "dark" && {
                            background: "#18181b",
                            color: "#fafafa",
                          }),
                          ...(theme === "luxury" && {
                            background: "#2a2a1a",
                            color: "#d4af37",
                          }),
                          ...(theme === "neon" && {
                            background: "#1a1a3a",
                            color: "#00ffff",
                            boxShadow: "0 0 10px rgba(0, 255, 255, 0.1)",
                          }),
                        }}
                        disabled={isSubmitting}
                      />
                      {errors.email && <div className="email-popup-error">{errors.email}</div>}
                    </div>

                    {showGdprCheckbox && (
                      <div style={{ display: "flex", alignItems: "start", gap: "0.75rem" }}>
                        <input
                          id="gdpr"
                          type="checkbox"
                          checked={gdprConsent}
                          onChange={(e) => {
                            setGdprConsent(e.target.checked)
                            if (errors.gdpr) setErrors({ ...errors, gdpr: undefined })
                          }}
                          className="email-popup-checkbox"
                          style={{ borderColor: errors.gdpr ? "#dc2626" : colors?.inputBorder || "#d4d4d8" }}
                          disabled={isSubmitting}
                        />
                        <div style={{ flex: 1 }}>
                          <label
                            htmlFor="gdpr"
                            style={{
                              fontSize: "0.875rem",
                              lineHeight: 1.6,
                              cursor: "pointer",
                              fontWeight: 400,
                            }}
                          >
                            {gdprLabel}
                          </label>
                          {errors.gdpr && <div className="email-popup-error">{errors.gdpr}</div>}
                        </div>
                      </div>
                    )}

                    <button
                      type="submit"
                      className="email-popup-button"
                      style={{
                        background: colors?.primary || "#18181b",
                        color: colors?.text || "#ffffff",
                        ...(theme === "neon" && {
                          boxShadow: "0 0 20px rgba(0, 255, 255, 0.5), 0 0 40px rgba(255, 0, 255, 0.3)",
                        }),
                      }}
                      disabled={isSubmitting}
                    >
                      {isSubmitting ? "Subscribing..." : buttonText}
                    </button>
                  </form>
                </>
              ) : (
                <div style={{ textAlign: "center", padding: "2rem 0" }}>
                  <div className="email-popup-success-icon">
                    <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="#16a34a" strokeWidth="3">
                      <polyline points="20 6 9 17 4 12" />
                    </svg>
                  </div>
                  <h3
                    style={{
                      fontSize: theme === "minimal" ? "1.5rem" : "1.875rem",
                      fontWeight: theme === "minimal" ? 300 : theme === "bold" || theme === "neon" ? 900 : 700,
                      fontFamily: theme === "elegant" || theme === "luxury" ? "serif" : "inherit",
                      ...(theme === "neon" && {
                        textShadow: "0 0 20px currentColor, 0 0 40px currentColor",
                      }),
                    }}
                  >
                    Success!
                  </h3>
                  <p
                    style={{
                      color: colors?.descColor || "#52525b",
                      marginBottom: "1.5rem",
                      lineHeight: 1.6,
                    }}
                  >
                    {successMessage}
                  </p>
                  {discountCode && (
                    <div
                      className="email-popup-discount"
                      style={{
                        background: colors?.imageBg || "#f4f4f5",
                      }}
                    >
                      <p style={{ fontSize: "0.875rem", fontWeight: 500, marginBottom: "0.25rem" }}>
                        Your discount code:
                      </p>
                      <p style={{ fontSize: "1.5rem", fontWeight: 700, letterSpacing: "0.05em" }}>{discountCode}</p>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </>
  )
}
