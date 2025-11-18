"use client"
import { useState, useEffect, useRef, useMemo } from "react"
import {
  type PopupTheme,
  type ThemeColors,
  getThemeColors,
  getWheelBorderConfig,
  type WheelBorderConfig,
} from "@/lib/popup-themes"

export type ImagePosition = "left" | "right" | "top" | "bottom" | "none"

export interface Prize {
  id: string
  label: string
  value: string
  probability: number
  color: string
}

export interface SpinToWinPopupProps {
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
  /** Spin button text */
  spinButtonText?: string
  /** Success message after winning */
  successMessage?: string
  /** Prizes on the wheel */
  prizes?: Prize[]
  /** Whether to show GDPR checkbox */
  showGdprCheckbox?: boolean
  /** GDPR checkbox label */
  gdprLabel?: string
  /** Whether to collect name field */
  collectName?: boolean
  /** Custom color overrides */
  colors?: Partial<ThemeColors>
  /** Wheel border configuration */
  wheelBorder?: Partial<WheelBorderConfig>
  /** Callback when form is submitted and spin is complete */
  onWin?: (data: { email: string; name?: string; gdprConsent: boolean; prize: Prize }) => void | Promise<void>
}

const defaultPrizes: Prize[] = [
  { id: "1", label: "10% OFF", value: "SAVE10", probability: 30, color: "#3b82f6" },
  { id: "2", label: "15% OFF", value: "SAVE15", probability: 25, color: "#8b5cf6" },
  { id: "3", label: "20% OFF", value: "SAVE20", probability: 20, color: "#ec4899" },
  { id: "4", label: "FREE SHIPPING", value: "FREESHIP", probability: 15, color: "#10b981" },
  { id: "5", label: "25% OFF", value: "SAVE25", probability: 8, color: "#f59e0b" },
  { id: "6", label: "30% OFF", value: "SAVE30", probability: 2, color: "#ef4444" },
]

const generateSliceColors = (theme: PopupTheme): string[] => {
  const themeMap: Record<PopupTheme, string[]> = {
    modern: ["#3b82f6", "#2563eb", "#1d4ed8", "#1e40af", "#1e3a8a", "#60a5fa"],
    minimal: ["#6b7280", "#4b5563", "#374151", "#1f2937", "#9ca3af", "#d1d5db"],
    elegant: ["#be185d", "#9f1239", "#831843", "#701a40", "#ec4899", "#f9a8d4"],
    bold: ["#dc2626", "#ea580c", "#d97706", "#ca8a04", "#eab308", "#84cc16"],
    glass: [
      "rgba(59, 130, 246, 0.5)",
      "rgba(99, 102, 241, 0.5)",
      "rgba(139, 92, 246, 0.5)",
      "rgba(168, 85, 247, 0.5)",
      "rgba(236, 72, 153, 0.5)",
      "rgba(244, 114, 182, 0.5)",
    ],
    dark: ["#3b82f6", "#8b5cf6", "#ec4899", "#ef4444", "#f59e0b", "#10b981"],
    gradient: ["#a855f7", "#9333ea", "#7e22ce", "#6b21a8", "#581c87", "#c084fc"],
    luxury: ["#d97706", "#b45309", "#92400e", "#78350f", "#ca8a04", "#f59e0b"],
    neon: ["#06b6d4", "#8b5cf6", "#ec4899", "#f59e0b", "#10b981", "#6366f1"],
    ocean: ["#06b6d4", "#0891b2", "#0e7490", "#155e75", "#22d3ee", "#67e8f9"],
  }
  return themeMap[theme]
}

export function SpinToWinPopup({
  isOpen,
  onClose,
  theme = "modern",
  imagePosition = "left",
  imageUrl,
  title = "Spin to Win!",
  description = "Enter your email and spin the wheel for a chance to win exciting discounts!",
  buttonText = "Spin Now",
  spinButtonText = "SPIN",
  successMessage = "Congratulations!",
  prizes = defaultPrizes,
  showGdprCheckbox = true,
  gdprLabel = "I agree to receive marketing emails and accept the privacy policy",
  collectName = true,
  colors: customColors,
  wheelBorder: customWheelBorder,
  onWin,
}: SpinToWinPopupProps) {
  const [email, setEmail] = useState("")
  const [name, setName] = useState("")
  const [gdprConsent, setGdprConsent] = useState(false)
  const [isSpinning, setIsSpinning] = useState(false)
  const [hasSpun, setHasSpun] = useState(false)
  const [wonPrize, setWonPrize] = useState<Prize | null>(null)
  const [rotation, setRotation] = useState(0)
  const [errors, setErrors] = useState<{ email?: string; name?: string; gdpr?: string }>({})
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const wheelRef = useRef<HTMLDivElement>(null)

  const colors = useMemo(() => getThemeColors(theme, customColors), [theme, customColors])
  const sliceColors = useMemo(() => generateSliceColors(theme), [theme])
  const wheelBorder = useMemo(() => getWheelBorderConfig(theme, customWheelBorder), [theme, customWheelBorder])

  const arrowColor = useMemo(() => {
    const themeArrowMap: Record<PopupTheme, string> = {
      modern: "#3b82f6",
      minimal: "#4b5563",
      elegant: "#be185d",
      bold: "#dc2626",
      glass: "#06b6d4",
      dark: "#3b82f6",
      gradient: "#a855f7",
      luxury: "#d97706",
      neon: "#06b6d4",
      ocean: "#06b6d4",
    }
    return themeArrowMap[theme]
  }, [theme])

  useEffect(() => {
    const canvas = canvasRef.current
    const wheelContainer = wheelRef.current

    if (!canvas || !wheelContainer) {
      console.log("[v0] Canvas or wheel container not available")
      return
    }

    const drawWheel = () => {
      const ctx = canvas.getContext("2d")
      if (!ctx) {
        console.log("[v0] Cannot get canvas context")
        return
      }

      const rect = wheelContainer.getBoundingClientRect()
      const dpr = window.devicePixelRatio || 1

      console.log("[v0] Drawing wheel with dimensions:", { width: rect.width, height: rect.height, dpr })

      const canvasWidth = rect.width * dpr
      const canvasHeight = rect.height * dpr
      canvas.width = canvasWidth
      canvas.height = canvasHeight

      ctx.scale(dpr, dpr)

      const centerX = rect.width / 2
      const centerY = rect.height / 2
      const radius = Math.min(rect.width, rect.height) / 2 - 10

      const segmentAngle = (2 * Math.PI) / prizes.length

      ctx.clearRect(0, 0, rect.width, rect.height)

      console.log("[v0] Drawing", prizes.length, "segments with radius:", radius)

      prizes.forEach((prize, index) => {
        const startAngle = index * segmentAngle - Math.PI / 2
        const endAngle = startAngle + segmentAngle
        const color = sliceColors[index % sliceColors.length]

        ctx.beginPath()
        ctx.moveTo(centerX, centerY)
        ctx.arc(centerX, centerY, radius, startAngle, endAngle)
        ctx.closePath()
        ctx.fillStyle = color
        ctx.fill()

        ctx.strokeStyle = "#ffffff"
        ctx.lineWidth = 3
        ctx.stroke()

        ctx.save()
        ctx.translate(centerX, centerY)
        ctx.rotate(startAngle + segmentAngle / 2)
        ctx.textAlign = "center"
        ctx.textBaseline = "middle"
        ctx.fillStyle = "#ffffff"

        const maxTextWidth = radius * 0.5
        const textDistance = radius * 0.65

        let fontSize = Math.max(10, rect.width / 25)
        ctx.font = `bold ${fontSize}px sans-serif`

        const textWidth = ctx.measureText(prize.label).width
        if (textWidth > maxTextWidth) {
          fontSize = (fontSize * maxTextWidth) / textWidth
          ctx.font = `bold ${fontSize}px sans-serif`
        }

        ctx.shadowColor = "rgba(0, 0, 0, 0.8)"
        ctx.shadowBlur = 6
        ctx.shadowOffsetX = 0
        ctx.shadowOffsetY = 2

        const words = prize.label.split(" ")
        if (words.length > 1 && textWidth > maxTextWidth * 0.9) {
          const line1 = words.slice(0, Math.ceil(words.length / 2)).join(" ")
          const line2 = words.slice(Math.ceil(words.length / 2)).join(" ")
          ctx.fillText(line1, textDistance, -fontSize * 0.5)
          ctx.fillText(line2, textDistance, fontSize * 0.5)
        } else {
          ctx.fillText(prize.label, textDistance, 0)
        }
        ctx.restore()
      })

      if (wheelBorder.enabled) {
        ctx.beginPath()
        ctx.arc(centerX, centerY, radius, 0, 2 * Math.PI)
        ctx.strokeStyle = wheelBorder.color
        ctx.lineWidth = wheelBorder.width

        if (wheelBorder.style === "dashed") {
          ctx.setLineDash([15, 10])
        } else if (wheelBorder.style === "dotted") {
          ctx.setLineDash([2, 8])
        } else {
          ctx.setLineDash([])
        }

        ctx.stroke()
        ctx.setLineDash([]) // Reset line dash
      }

      console.log("[v0] Wheel drawing complete")
    }

    drawWheel()

    const resizeObserver = new ResizeObserver(() => {
      console.log("[v0] Wheel container resized, redrawing...")
      drawWheel()
    })

    resizeObserver.observe(wheelContainer)

    return () => {
      resizeObserver.disconnect()
    }
  }, [prizes, isOpen, sliceColors, wheelBorder])

  useEffect(() => {
    if (!isOpen) {
      const timer = setTimeout(() => {
        setHasSpun(false)
        setWonPrize(null)
        setEmail("")
        setName("")
        setGdprConsent(false)
        setErrors({})
        setRotation(0)
      }, 300)
      return () => clearTimeout(timer)
    }
  }, [isOpen])

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
      if (e.key === "Escape" && isOpen && !isSpinning) {
        onClose()
      }
    }
    window.addEventListener("keydown", handleEsc)
    return () => window.removeEventListener("keydown", handleEsc)
  }, [isOpen, isSpinning, onClose])

  const validateForm = () => {
    const newErrors: { email?: string; name?: string; gdpr?: string } = {}

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!email) {
      newErrors.email = "Email is required"
    } else if (!emailRegex.test(email)) {
      newErrors.email = "Please enter a valid email"
    }

    if (collectName && !name.trim()) {
      newErrors.name = "Name is required"
    }

    if (showGdprCheckbox && !gdprConsent) {
      newErrors.gdpr = "You must accept the terms to continue"
    }

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const selectPrize = (): Prize => {
    const random = Math.random() * 100
    let cumulative = 0

    for (const prize of prizes) {
      cumulative += prize.probability
      if (random <= cumulative) {
        return prize
      }
    }

    return prizes[0]
  }

  const handleSpin = async () => {
    if (!validateForm() || isSpinning || hasSpun) return

    setIsSpinning(true)

    const prize = selectPrize()
    const prizeIndex = prizes.findIndex((p) => p.id === prize.id)
    const segmentAngle = 360 / prizes.length
    const targetRotation = 360 * 5 + (360 - prizeIndex * segmentAngle - segmentAngle / 2)

    setRotation(targetRotation)

    setTimeout(async () => {
      setWonPrize(prize)
      setHasSpun(true)
      setIsSpinning(false)

      if (onWin) {
        await onWin({
          email,
          name: collectName ? name : undefined,
          gdprConsent,
          prize,
        })
      }
    }, 4000)
  }

  if (!isOpen) return null

  const defaultImage = imageUrl || `/placeholder.svg?height=600&width=500&query=festive prize wheel celebration`

  return (
    <>
      <style>{`
        .spin-popup-overlay {
          position: fixed;
          inset: 0;
          z-index: 9999;
          display: flex;
          align-items: center;
          justify-content: center;
          padding: 1rem;
          animation: fadeIn 0.2s ease-out;
        }
        
        .spin-popup-backdrop {
          position: absolute;
          inset: 0;
          background: rgba(0, 0, 0, 0.6);
          backdrop-filter: blur(4px);
        }
        
        .spin-popup-container {
          position: relative;
          width: 100%;
          max-width: 64rem;
          max-height: 95vh;
          overflow-y: auto;
          border-radius: 1rem;
          box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.25);
          animation: zoomIn 0.2s ease-out;
          margin: 0 auto;
        }
        
        .spin-popup-content {
          display: flex;
          flex-direction: row;
          position: relative;
          overflow: hidden;
        }
        
        .spin-popup-content.partial-wheel {
          flex-direction: row;
          overflow: hidden;
        }
        
        .spin-partial-wheel-container {
          position: relative;
          width: 70%;
          flex-shrink: 0;
          display: flex;
          align-items: center;
          justify-content: flex-start;
          overflow: visible;
          margin-left: -20%;
        }
        
        .spin-wheel-container {
          position: relative;
          width: 550px;
          height: 550px;
          flex-shrink: 0;
        }
        
        .spin-wheel-pointer {
          position: absolute;
          top: 50%;
          right: -15px;
          transform: translateY(-50%);
          width: 0;
          height: 0;
          border-top: 25px solid transparent;
          border-bottom: 25px solid transparent;
          border-right: 35px solid #ef4444;
          z-index: 10;
          filter: drop-shadow(-4px 0 8px rgba(239, 68, 68, 0.4));
        }
        
        .spin-wheel-pointer::before {
          content: '';
          position: absolute;
          right: -38px;
          top: -20px;
          width: 0;
          height: 0;
          border-top: 20px solid transparent;
          border-bottom: 20px solid transparent;
          border-right: 30px solid #dc2626;
        }
        
        .spin-wheel {
          position: relative;
          width: 100%;
          height: 100%;
          transition: transform 4s cubic-bezier(0.25, 0.1, 0.25, 1);
        }
        
        .spin-wheel.spinning {
          transition: transform 4s cubic-bezier(0.25, 0.1, 0.25, 1);
        }
        
        .spin-wheel-center {
          position: absolute;
          top: 50%;
          left: 50%;
          transform: translate(-50%, -50%);
          width: 80px;
          height: 80px;
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
          font-weight: 700;
          font-size: 1rem;
          box-shadow: 0 4px 12px rgba(0, 0, 0, 0.3);
          transition: transform 0.2s;
          z-index: 5;
          border: 4px solid white;
        }
        
        .spin-wheel-center:hover:not(.spinning) {
          transform: translate(-50%, -50%) scale(1.05);
        }
        
        .spin-wheel-center.spinning {
          pointer-events: none;
          opacity: 0.8;
        }
        
        .spin-popup-input {
          width: 100%;
          padding: 0.75rem 1rem;
          border-radius: 0.5rem;
          border: 2px solid;
          font-size: 1rem;
          transition: border-color 0.2s, box-shadow 0.2s;
        }
        
        .spin-popup-input:focus {
          outline: none;
          border-color: currentColor;
          box-shadow: 0 0 0 3px rgba(0, 0, 0, 0.1);
        }
        
        .spin-popup-input.error {
          border-color: #dc2626;
        }
        
        .spin-popup-label {
          display: block;
          font-size: 0.875rem;
          font-weight: 600;
          margin-bottom: 0.5rem;
        }
        
        .spin-popup-checkbox {
          width: 1.125rem;
          height: 1.125rem;
          border-radius: 0.25rem;
          border: 2px solid;
          cursor: pointer;
          flex-shrink: 0;
          margin-top: 0.125rem;
        }
        
        .spin-popup-button {
          width: 100%;
          padding: 0.875rem 1.5rem;
          border-radius: 0.5rem;
          border: none;
          font-weight: 600;
          font-size: 1rem;
          cursor: pointer;
          transition: opacity 0.2s, transform 0.1s;
        }
        
        .spin-popup-button:hover:not(:disabled) {
          opacity: 0.9;
        }
        
        .spin-popup-button:active:not(:disabled) {
          transform: scale(0.98);
        }
        
        .spin-popup-button:disabled {
          opacity: 0.6;
          cursor: not-allowed;
        }
        
        .spin-popup-error {
          font-size: 0.875rem;
          color: #dc2626;
          margin-top: 0.375rem;
        }
        
        .spin-popup-success-icon {
          width: 4rem;
          height: 4rem;
          border-radius: 9999px;
          background: #dcfce7;
          display: flex;
          align-items: center;
          justify-content: center;
          margin: 0 auto 1rem;
          animation: popIn 0.3s ease-out;
        }
        
        .spin-popup-prize {
          padding: 2rem;
          border-radius: 0.75rem;
          border: 3px solid;
          margin-top: 1rem;
          animation: popIn 0.4s ease-out 0.1s both;
        }
        
        .spin-popup-no-thanks {
          width: 100%;
          padding: 0.75rem 1.5rem;
          border: none;
          background: transparent;
          font-weight: 500;
          font-size: 0.875rem;
          cursor: pointer;
          transition: opacity 0.2s;
          text-align: center;
          margin-top: 0.75rem;
        }
        
        .spin-popup-no-thanks:hover:not(:disabled) {
          opacity: 0.7;
          text-decoration: underline;
        }
        
        .spin-popup-no-thanks:disabled {
          opacity: 0.4;
          cursor: not-allowed;
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
        
        @keyframes popIn {
          0% {
            opacity: 0;
            transform: scale(0.8);
          }
          50% {
            transform: scale(1.05);
          }
          100% {
            opacity: 1;
            transform: scale(1);
          }
        }
        
        @media (min-width: 768px) {
          .spin-popup-form-section {
            padding: 3.5rem 3rem 3.5rem 2.5rem;
          }
          
          .spin-wheel-container {
            width: 500px;
            height: 500px;
          }
        }
        
        @media (max-width: 767px) {
          .spin-popup-content.partial-wheel {
            flex-direction: column;
          }
          
          .spin-partial-wheel-container {
            width: 100%;
            margin-left: 0;
            margin-top: -20%;
            justify-content: center;
          }
          
          .spin-wheel-container {
            width: 350px;
            height: 350px;
          }
          
          .spin-popup-form-section {
            padding: 2rem 1.5rem;
          }
        }
        
        @media (max-width: 480px) {
          .spin-partial-wheel-container {
            margin-top: -25%;
          }
          
          .spin-wheel-container {
            width: 300px;
            height: 300px;
          }
          
          .spin-wheel-center {
            width: 70px;
            height: 70px;
            font-size: 0.875rem;
          }
          
          .spin-popup-form-section {
            padding: 1.5rem 1.25rem;
          }
        }
      `}</style>

      <div className="spin-popup-overlay">
        <div className="spin-popup-backdrop" onClick={isSpinning ? undefined : onClose} aria-hidden="true" />

        <div
          className="spin-popup-container"
          style={{
            background: colors.background,
            color: colors.text,
            ...(colors.blur && { backdropFilter: "blur(20px)" }),
          }}
        >
          <div className="spin-popup-content partial-wheel">
            <div className="spin-partial-wheel-container">
              <div className="spin-wheel-container">
                <div 
                  className="spin-wheel-pointer"
                  style={{
                    borderRightColor: arrowColor,
                    filter: `drop-shadow(-4px 0 8px ${arrowColor}66)`,
                  }}
                >
                  <div
                    style={{
                      position: 'absolute',
                      right: '-38px',
                      top: '-20px',
                      width: 0,
                      height: 0,
                      borderTop: '20px solid transparent',
                      borderBottom: '20px solid transparent',
                      borderRight: `30px solid ${arrowColor}dd`,
                    }}
                  />
                </div>
                <div
                  ref={wheelRef}
                  className="spin-wheel"
                  style={{
                    transform: `rotate(${rotation}deg)`,
                  }}
                >
                  <canvas
                    ref={canvasRef}
                    width={500}
                    height={500}
                    style={{
                      width: "100%",
                      height: "100%",
                      borderRadius: "50%",
                    }}
                  />
                </div>
                <div
                  className={`spin-wheel-center ${isSpinning ? "spinning" : ""}`}
                  onClick={handleSpin}
                  style={{
                    background: colors.ctaBg,
                    color: colors.ctaText,
                    cursor: isSpinning ? "not-allowed" : "pointer",
                  }}
                >
                  {isSpinning ? "..." : spinButtonText}
                </div>
              </div>
            </div>

            <div className="spin-popup-form-section">
              {!hasSpun ? (
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
                      color: colors.descColor,
                      marginBottom: "1.5rem",
                      fontSize: theme === "minimal" ? "0.875rem" : "1rem",
                      lineHeight: 1.6,
                      fontWeight: theme === "bold" ? 500 : 400,
                    }}
                  >
                    {description}
                  </p>

                  <form
                    onSubmit={(e) => {
                      e.preventDefault()
                      handleSpin()
                    }}
                    style={{ display: "flex", flexDirection: "column", gap: "1rem" }}
                  >
                    {collectName && (
                      <div>
                        <label htmlFor="name" className="spin-popup-label">
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
                          className={`spin-popup-input ${errors.name ? "error" : ""}`}
                          style={{
                            borderColor: errors.name ? "#dc2626" : colors.inputBorder,
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
                          disabled={isSpinning}
                        />
                        {errors.name && <div className="spin-popup-error">{errors.name}</div>}
                      </div>
                    )}

                    <div>
                      <label htmlFor="email" className="spin-popup-label">
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
                        className={`spin-popup-input ${errors.email ? "error" : ""}`}
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
                          ...(theme === "neon" && {
                            boxShadow: "0 0 20px rgba(0, 255, 255, 0.1)",
                          }),
                        }}
                        disabled={isSpinning}
                      />
                      {errors.email && <div className="spin-popup-error">{errors.email}</div>}
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
                          className="spin-popup-checkbox"
                          style={{ borderColor: errors.gdpr ? "#dc2626" : colors.inputBorder }}
                          disabled={isSpinning}
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
                          {errors.gdpr && <div className="spin-popup-error">{errors.gdpr}</div>}
                        </div>
                      </div>
                    )}

                    <button
                      type="submit"
                      className="spin-popup-button"
                      style={{
                        background: colors.ctaBg,
                        color: colors.ctaText,
                        ...(theme === "neon" && {
                          boxShadow: "0 0 20px rgba(0, 255, 255, 0.5), 0 0 40px rgba(255, 0, 255, 0.3)",
                        }),
                      }}
                      disabled={isSpinning}
                    >
                      {isSpinning ? "Spinning..." : buttonText}
                    </button>

                    <button
                      type="button"
                      onClick={onClose}
                      className="spin-popup-no-thanks"
                      style={{
                        color: colors.descColor,
                      }}
                      disabled={isSpinning}
                    >
                      No thanks
                    </button>
                  </form>
                </>
              ) : (
                <div style={{ textAlign: "center", padding: "2rem 0" }}>
                  <div className="spin-popup-success-icon">
                    <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="#16a34a" strokeWidth="3">
                      <polyline points="20 6 9 17 4 12" />
                    </svg>
                  </div>
                  <h3
                    style={{
                      fontSize: theme === "minimal" ? "1.5rem" : "1.875rem",
                      fontWeight: theme === "minimal" ? 300 : theme === "bold" || theme === "neon" ? 900 : 700,
                      fontFamily: theme === "elegant" || theme === "luxury" ? "serif" : "inherit",
                      marginBottom: "0.5rem",
                      ...(theme === "neon" && {
                        textShadow: "0 0 20px currentColor, 0 0 40px currentColor",
                      }),
                    }}
                  >
                    {successMessage}
                  </h3>
                  <p
                    style={{
                      color: colors.descColor,
                      marginBottom: "1.5rem",
                      lineHeight: 1.6,
                    }}
                  >
                    You won:
                  </p>
                  {wonPrize && (
                    <div
                      className="spin-popup-prize"
                      style={{
                        background: colors.imageBg,
                        borderColor: wonPrize.color,
                      }}
                    >
                      <p
                        style={{
                          fontSize: "1.5rem",
                          fontWeight: 700,
                          marginBottom: "0.5rem",
                          color: wonPrize.color,
                        }}
                      >
                        {wonPrize.label}
                      </p>
                      <p style={{ fontSize: "0.875rem", fontWeight: 500, marginBottom: "0.25rem" }}>Use code:</p>
                      <p style={{ fontSize: "1.25rem", fontWeight: 700, letterSpacing: "0.05em" }}>{wonPrize.value}</p>
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
