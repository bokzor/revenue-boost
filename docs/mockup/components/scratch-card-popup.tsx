"use client"

import type React from "react"
import { useState, useEffect, useRef } from "react"
import { type PopupTheme, type ThemeColors, getThemeColors } from "@/lib/popup-themes"

export type ImagePosition = "left" | "right" | "top" | "bottom" | "none"

export interface Prize {
  text: string
  subtext?: string
  code?: string
}

export interface ScratchCardPopupProps {
  isOpen: boolean
  onClose: () => void
  theme?: PopupTheme
  imagePosition?: ImagePosition
  imageUrl?: string
  title?: string
  description?: string
  prize?: Prize
  scratchText?: string
  revealThreshold?: number
  collectEmail?: boolean
  emailLabel?: string
  buttonText?: string
  showGdprCheckbox?: boolean
  gdprLabel?: string
  colors?: Partial<ThemeColors>
  onSubmit?: (data: { email?: string; gdprConsent?: boolean; prizeRevealed: boolean }) => void | Promise<void>
}

export function ScratchCardPopup({
  isOpen,
  onClose,
  theme = "modern",
  imagePosition = "left",
  imageUrl,
  title = "Scratch to Win!",
  description = "Scratch the card below to reveal your exclusive prize!",
  prize = {
    text: "20% OFF",
    subtext: "Your Next Purchase",
    code: "SCRATCH20",
  },
  scratchText = "Scratch Here",
  revealThreshold = 50,
  collectEmail = true,
  emailLabel = "Enter your email to claim your prize",
  buttonText = "Claim Prize",
  showGdprCheckbox = true,
  gdprLabel = "I agree to receive promotional emails",
  colors: customColors,
  onSubmit,
}: ScratchCardPopupProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const [isScratching, setIsScratching] = useState(false)
  const [isRevealed, setIsRevealed] = useState(false)
  const [scratchProgress, setScratchProgress] = useState(0)
  const [email, setEmail] = useState("")
  const [gdprConsent, setGdprConsent] = useState(false)
  const [emailSubmitted, setEmailSubmitted] = useState(false)
  const [isSubmitted, setIsSubmitted] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [errors, setErrors] = useState<{ email?: string; gdpr?: string }>({})

  const colors = getThemeColors(theme, customColors)

  // Initialize scratch canvas
  useEffect(() => {
    if (!isOpen || !canvasRef.current || (collectEmail && !emailSubmitted)) return

    const canvas = canvasRef.current
    const ctx = canvas.getContext("2d")
    if (!ctx) return

    // Set canvas size
    const rect = canvas.getBoundingClientRect()
    const dpr = window.devicePixelRatio || 1
    canvas.width = rect.width * dpr
    canvas.height = rect.height * dpr
    ctx.scale(dpr, dpr)

    // Draw scratch surface
    ctx.fillStyle = colors.secondary
    ctx.fillRect(0, 0, rect.width, rect.height)

    // Add scratch text
    ctx.fillStyle = colors.text
    ctx.font = `600 ${theme === "bold" ? "32px" : "28px"} system-ui`
    ctx.textAlign = "center"
    ctx.textBaseline = "middle"
    ctx.fillText(scratchText, rect.width / 2, rect.height / 2)

    // Add sparkles or pattern
    ctx.globalAlpha = 0.3
    for (let i = 0; i < 20; i++) {
      const x = Math.random() * rect.width
      const y = Math.random() * rect.height
      ctx.fillStyle = colors.primary
      ctx.beginPath()
      ctx.arc(x, y, 2, 0, Math.PI * 2)
      ctx.fill()
    }
    ctx.globalAlpha = 1
  }, [isOpen, colors, scratchText, theme, emailSubmitted])

  // Calculate scratch progress
  const calculateProgress = () => {
    if (!canvasRef.current) return 0

    const canvas = canvasRef.current
    const ctx = canvas.getContext("2d")
    if (!ctx) return 0

    const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height)
    const pixels = imageData.data
    let transparent = 0

    for (let i = 3; i < pixels.length; i += 4) {
      if (pixels[i] < 128) transparent++
    }

    return (transparent / (pixels.length / 4)) * 100
  }

  // Scratch effect
  const scratch = (e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>) => {
    if (!canvasRef.current || isRevealed || (collectEmail && !emailSubmitted)) return

    const canvas = canvasRef.current
    const ctx = canvas.getContext("2d")
    if (!ctx) return

    const rect = canvas.getBoundingClientRect()
    const x = "touches" in e ? e.touches[0].clientX - rect.left : e.clientX - rect.left
    const y = "touches" in e ? e.touches[0].clientY - rect.top : e.clientY - rect.top

    ctx.globalCompositeOperation = "destination-out"
    ctx.beginPath()
    ctx.arc(x, y, 25, 0, Math.PI * 2)
    ctx.fill()

    const progress = calculateProgress()
    setScratchProgress(progress)

    if (progress >= revealThreshold) {
      setIsRevealed(true)
      // Clear entire canvas to reveal prize
      ctx.clearRect(0, 0, canvas.width, canvas.height)
    }
  }

  const handleMouseDown = () => setIsScratching(true)
  const handleMouseUp = () => setIsScratching(false)

  const handleMouseMove = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (isScratching) scratch(e)
  }

  const handleTouchMove = (e: React.TouchEvent<HTMLCanvasElement>) => {
    e.preventDefault()
    if (isScratching) scratch(e)
  }

  const validateForm = () => {
    if (!collectEmail) return true

    const newErrors: { email?: string; gdpr?: string } = {}

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!email) {
      newErrors.email = "Email is required"
    } else if (!emailRegex.test(email)) {
      newErrors.email = "Please enter a valid email"
    }

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
      // Set email as submitted to enable scratching
      setEmailSubmitted(true)
      setIsSubmitting(false)
    } catch (error) {
      console.error("Scratch card submission error:", error)
      setErrors({ email: "Something went wrong. Please try again." })
      setIsSubmitting(false)
    }
  }

  const handleClaimPrize = async () => {
    setIsSubmitting(true)
    
    try {
      if (onSubmit) {
        await onSubmit({
          email: collectEmail ? email : undefined,
          gdprConsent: showGdprCheckbox ? gdprConsent : undefined,
          prizeRevealed: isRevealed,
        })
      }
      setIsSubmitted(true)
    } catch (error) {
      console.error("Scratch card submission error:", error)
      setErrors({ email: "Something went wrong. Please try again." })
    } finally {
      setIsSubmitting(false)
    }
  }

  // Reset form when popup closes
  useEffect(() => {
    if (!isOpen) {
      const timer = setTimeout(() => {
        setIsRevealed(false)
        setScratchProgress(0)
        setIsSubmitted(false)
        setEmailSubmitted(false)
        setEmail("")
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

  if (!isOpen) return null

  const showImage = imagePosition !== "none"
  const isVertical = imagePosition === "left" || imagePosition === "right"
  const imageFirst = imagePosition === "left" || imagePosition === "top"
  const defaultImage = imageUrl || `/placeholder.svg?height=600&width=500&query=scratch card lottery prize winner`

  return (
    <>
      <style>{`
        .scratch-popup-overlay {
          position: fixed;
          inset: 0;
          z-index: 9999;
          display: flex;
          align-items: center;
          justify-content: center;
          padding: 1rem;
          animation: fadeIn 0.2s ease-out;
        }
        
        .scratch-popup-backdrop {
          position: absolute;
          inset: 0;
          background: rgba(0, 0, 0, 0.6);
          backdrop-filter: blur(4px);
        }
        
        .scratch-popup-container {
          position: relative;
          width: 100%;
          max-width: 80rem;
          border-radius: 1rem;
          overflow: hidden;
          box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.25);
          animation: zoomIn 0.2s ease-out;
          margin: 0 auto;
        }
        
        .scratch-popup-close {
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
        
        .scratch-popup-close:hover {
          background: rgba(0, 0, 0, 0.2);
        }
        
        .scratch-popup-content {
          display: flex;
        }
        
        .scratch-popup-content.horizontal {
          flex-direction: column;
        }
        
        .scratch-popup-content.horizontal.reverse {
          flex-direction: column-reverse;
        }
        
        .scratch-popup-content.vertical {
          flex-direction: row;
        }
        
        .scratch-popup-content.vertical.reverse {
          flex-direction: row-reverse;
        }
        
        .scratch-popup-content.single-column {
          flex-direction: column;
        }
        
        .scratch-popup-image {
          position: relative;
          overflow: hidden;
          display: flex;
          align-items: center;
          justify-content: center;
        }
        
        .scratch-popup-image img {
          width: 100%;
          height: 100%;
          object-fit: cover;
        }
        
        .scratch-popup-form-section {
          padding: 2rem;
          display: flex;
          flex-direction: column;
          justify-content: center;
        }
        
        .scratch-card-container {
          position: relative;
          width: 100%;
          max-width: 24rem;
          margin: 0 auto 1.5rem;
          border-radius: 0.75rem;
          overflow: hidden;
          box-shadow: 0 10px 30px -5px rgba(0, 0, 0, 0.2);
        }
        
        .scratch-card-prize {
          padding: 3rem 2rem;
          text-align: center;
          border-radius: 0.75rem;
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          min-height: 200px;
        }
        
        .scratch-card-canvas {
          position: absolute;
          inset: 0;
          cursor: pointer;
          touch-action: none;
        }
        
        .scratch-progress {
          font-size: 0.875rem;
          text-align: center;
          margin-top: 0.5rem;
          opacity: 0.7;
        }
        
        .scratch-popup-input {
          width: 100%;
          padding: 0.625rem 0.75rem;
          border-radius: 0.375rem;
          border: 1px solid;
          font-size: 0.875rem;
          transition: border-color 0.2s, box-shadow 0.2s;
        }
        
        .scratch-popup-input:focus {
          outline: none;
          border-color: currentColor;
          box-shadow: 0 0 0 3px rgba(0, 0, 0, 0.1);
        }
        
        .scratch-popup-input.error {
          border-color: #dc2626;
        }
        
        .scratch-popup-checkbox {
          width: 1rem;
          height: 1rem;
          border-radius: 0.25rem;
          border: 1px solid;
          cursor: pointer;
          flex-shrink: 0;
        }
        
        .scratch-popup-button {
          width: 100%;
          padding: 0.625rem 1rem;
          border-radius: 0.375rem;
          border: none;
          font-weight: 500;
          cursor: pointer;
          transition: opacity 0.2s, transform 0.1s;
          font-size: 0.875rem;
        }
        
        .scratch-popup-button:hover:not(:disabled) {
          opacity: 0.9;
        }
        
        .scratch-popup-button:active:not(:disabled) {
          transform: scale(0.98);
        }
        
        .scratch-popup-button:disabled {
          opacity: 0.6;
          cursor: not-allowed;
        }
        
        .scratch-popup-error {
          font-size: 0.875rem;
          color: #dc2626;
          margin-top: 0.25rem;
        }
        
        .scratch-popup-success-icon {
          width: 4rem;
          height: 4rem;
          border-radius: 9999px;
          background: #dcfce7;
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
            transform: scale(0.95);
          }
          to { 
            opacity: 1;
            transform: scale(1);
          }
        }
        
        @keyframes pulse {
          0%, 100% {
            transform: scale(1);
          }
          50% {
            transform: scale(1.05);
          }
        }
        
        .revealed-animation {
          animation: pulse 0.5s ease-out;
        }
        
        @media (min-width: 768px) {
          .scratch-popup-content.horizontal .scratch-popup-image {
            height: 16rem;
          }
          
          .scratch-popup-content.vertical {
            flex-direction: row;
          }
          
          .scratch-popup-content.vertical.reverse {
            flex-direction: row-reverse;
          }
          
          .scratch-popup-content.vertical .scratch-popup-image {
            width: 50%;
            height: auto;
            min-height: 400px;
          }
          
          .scratch-popup-content.vertical .scratch-popup-form-section {
            width: 50%;
          }
          
          .scratch-popup-form-section {
            padding: 3.5rem 3rem;
          }
          
          .scratch-popup-content.single-column .scratch-popup-form-section {
            max-width: 36rem;
            margin: 0 auto;
            padding: 3.5rem 3rem;
          }
        }
        
        @media (max-width: 767px) {
          .scratch-popup-content.horizontal .scratch-popup-image {
            height: 12rem;
          }
          
          .scratch-popup-content.vertical .scratch-popup-image {
            height: 12rem;
          }
        }
      `}</style>

      <div className="scratch-popup-overlay">
        <div className="scratch-popup-backdrop" onClick={onClose} aria-hidden="true" />

        <div
          className="scratch-popup-container"
          style={{
            background: colors.background,
            color: colors.text,
            ...(colors.blur && { backdropFilter: "blur(20px)" }),
          }}
        >
          <button onClick={onClose} className="scratch-popup-close" aria-label="Close popup">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <line x1="18" y1="6" x2="6" y2="18" />
              <line x1="6" y1="6" x2="18" y2="18" />
            </svg>
          </button>

          <div
            className={`scratch-popup-content ${
              !showImage ? "single-column" : isVertical ? "vertical" : "horizontal"
            } ${!imageFirst && showImage ? "reverse" : ""}`}
          >
            {showImage && (
              <div
                className="scratch-popup-image"
                style={{
                  background: colors.imageBg,
                }}
              >
                <img src={defaultImage || "/placeholder.svg"} alt="Scratch Card" />
              </div>
            )}

            <div className="scratch-popup-form-section">
              {!isSubmitted ? (
                <>
                  <h2
                    style={{
                      fontSize: theme === "minimal" ? "1.5rem" : "1.875rem",
                      fontWeight: theme === "minimal" ? 300 : theme === "bold" || theme === "neon" ? 900 : 700,
                      marginBottom: "0.75rem",
                      lineHeight: 1.2,
                      textAlign: "center",
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
                      color: colors.descColor,
                      marginBottom: "1.5rem",
                      fontSize: theme === "minimal" ? "0.875rem" : "1rem",
                      lineHeight: 1.6,
                      textAlign: "center",
                      fontWeight: theme === "bold" ? 500 : 400,
                    }}
                  >
                    {collectEmail && !emailSubmitted 
                      ? "Enter your email below to unlock your scratch card and reveal your prize!" 
                      : description}
                  </p>

                  {collectEmail && !emailSubmitted ? (
                    <form
                      onSubmit={handleSubmit}
                      style={{ marginTop: "1.5rem", display: "flex", flexDirection: "column", gap: "1rem" }}
                    >
                      <div>
                        <label
                          htmlFor="email"
                          style={{
                            display: "block",
                            fontSize: "0.875rem",
                            fontWeight: 500,
                            marginBottom: "0.5rem",
                          }}
                        >
                          Email Address
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
                          className={`scratch-popup-input ${errors.email ? "error" : ""}`}
                          style={{
                            borderColor: errors.email ? "#dc2626" : colors.inputBorder,
                            background:
                              theme === "glass" ||
                              theme === "gradient" ||
                              theme === "dark" ||
                              theme === "luxury" ||
                              theme === "neon"
                                ? colors.secondary
                                : "transparent",
                            color: colors.text,
                            ...(colors.blur && { backdropFilter: "blur(10px)" }),
                          }}
                          disabled={isSubmitting}
                        />
                        {errors.email && <div className="scratch-popup-error">{errors.email}</div>}
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
                            className="scratch-popup-checkbox"
                            style={{ borderColor: errors.gdpr ? "#dc2626" : colors.inputBorder }}
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
                            {errors.gdpr && <div className="scratch-popup-error">{errors.gdpr}</div>}
                          </div>
                        </div>
                      )}

                      <button
                        type="submit"
                        className="scratch-popup-button"
                        style={{
                          background: colors.ctaBg,
                          color: colors.ctaText,
                          ...(theme === "neon" && {
                            boxShadow: "0 0 20px rgba(0, 255, 255, 0.5), 0 0 40px rgba(255, 0, 255, 0.3)",
                          }),
                        }}
                        disabled={isSubmitting}
                      >
                        {isSubmitting ? "Processing..." : "Unlock Scratch Card"}
                      </button>
                    </form>
                  ) : (
                    <>
                      <div className="scratch-card-container">
                        <div
                          className={`scratch-card-prize ${isRevealed ? "revealed-animation" : ""}`}
                          style={{
                            background: `linear-gradient(135deg, ${colors.primary}, ${colors.accent})`,
                            border: `3px solid ${colors.border}`,
                          }}
                        >
                          <div
                            style={{
                              fontSize: theme === "bold" ? "3rem" : "2.5rem",
                              fontWeight: 900,
                              color: colors.ctaText || "#ffffff",
                              marginBottom: "0.5rem",
                              textShadow: theme === "neon" ? "0 0 20px currentColor" : "none",
                            }}
                          >
                            {prize.text}
                          </div>
                          {prize.subtext && (
                            <div
                              style={{
                                fontSize: "1.125rem",
                                fontWeight: 600,
                                color: colors.ctaText || "#ffffff",
                                marginBottom: "1rem",
                              }}
                            >
                              {prize.subtext}
                            </div>
                          )}
                          {prize.code && isRevealed && (
                            <div
                              style={{
                                padding: "0.75rem 1.5rem",
                                background: "rgba(255, 255, 255, 0.2)",
                                borderRadius: "0.5rem",
                                border: "2px dashed rgba(255, 255, 255, 0.5)",
                                backdropFilter: "blur(10px)",
                              }}
                            >
                              <div
                                style={{
                                  fontSize: "0.875rem",
                                  fontWeight: 500,
                                  color: colors.ctaText || "#ffffff",
                                  marginBottom: "0.25rem",
                                }}
                              >
                                Code:
                              </div>
                              <div
                                style={{
                                  fontSize: "1.5rem",
                                  fontWeight: 700,
                                  color: colors.ctaText || "#ffffff",
                                  letterSpacing: "0.1em",
                                }}
                              >
                                {prize.code}
                              </div>
                            </div>
                          )}
                        </div>
                        {!isRevealed && (
                          <canvas
                            ref={canvasRef}
                            className="scratch-card-canvas"
                            onMouseDown={handleMouseDown}
                            onMouseUp={handleMouseUp}
                            onMouseMove={handleMouseMove}
                            onTouchStart={handleMouseDown}
                            onTouchEnd={handleMouseUp}
                            onTouchMove={handleTouchMove}
                          />
                        )}
                      </div>

                      {!isRevealed && scratchProgress > 0 && (
                        <div className="scratch-progress" style={{ color: colors.descColor }}>
                          {Math.round(scratchProgress)}% revealed
                        </div>
                      )}

                      {isRevealed && (
                        <button
                          onClick={handleClaimPrize}
                          className="scratch-popup-button"
                          style={{
                            background: colors.ctaBg,
                            color: colors.ctaText,
                            marginTop: "1.5rem",
                            ...(theme === "neon" && {
                              boxShadow: "0 0 20px rgba(0, 255, 255, 0.5), 0 0 40px rgba(255, 0, 255, 0.3)",
                            }),
                          }}
                          disabled={isSubmitting}
                        >
                          {isSubmitting ? "Processing..." : buttonText}
                        </button>
                      )}
                    </>
                  )}
                </>
              ) : (
                <div style={{ textAlign: "center", padding: "2rem 0" }}>
                  <div className="scratch-popup-success-icon">
                    <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="#16a34a" strokeWidth="3">
                      <polyline points="20 6 9 17 4 12" />
                    </svg>
                  </div>
                  <h3
                    style={{
                      fontSize: theme === "minimal" ? "1.5rem" : "1.875rem",
                      fontWeight: theme === "minimal" ? 300 : theme === "bold" || theme === "neon" ? 900 : 700,
                      fontFamily: theme === "elegant" || theme === "luxury" ? "serif" : "inherit",
                      marginBottom: "0.75rem",
                    }}
                  >
                    Prize Claimed!
                  </h3>
                  <p
                    style={{
                      color: colors.descColor,
                      lineHeight: 1.6,
                    }}
                  >
                    Check your email for details on how to redeem your prize.
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </>
  )
}
