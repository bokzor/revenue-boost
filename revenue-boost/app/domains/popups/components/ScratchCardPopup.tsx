/**
 * ScratchCardPopup Component
 *
 * Interactive scratch card popup with canvas-based scratching effect.
 * Works in both admin preview and storefront environments.
 *
 * Features:
 * - Canvas-based scratch effect (mouse and touch support)
 * - Optional email capture before or after scratching
 * - Configurable scratch threshold for reveal
 * - Prize/discount code reveal
 * - Customizable colors, messages, and behavior
 * - Success state with discount code display
 */

import React, { useState, useRef, useEffect, useCallback } from "react";
import { BasePopup, type PopupConfig } from "./BasePopup";
import type { ScratchCardTemplateConfig } from "~/lib/template-configs";
import type { DiscountConfig } from "~/domains/popups/services/discounts/discount.server";

export interface ScratchCardConfig extends PopupConfig {
  // Template type
  templateType?: string;

  // Content
  headline?: string;
  subheadline?: string;
  scratchInstruction?: string;
  prizeMessage?: string;
  revealMessage?: string;
  submitButtonText?: string;

  // Email capture
  emailRequired?: boolean;
  emailPlaceholder?: string;
  emailLabel?: string;
  emailBeforeScratching?: boolean; // Capture email before allowing scratch

  // Scratch behavior
  scratchThreshold?: number; // 0-100, percentage of area to scratch before reveal (default: 50)
  scratchRadius?: number; // Brush size in pixels (default: 20)

  // Discount configuration (unified system)
  discountConfig?: DiscountConfig;

  // Discount properties for compatibility
  discountEnabled?: boolean;
  discountCode?: string;
  discountPercentage?: number;
  discountValue?: number;
  discountType?: "percentage" | "fixed" | "free_shipping";
  valueType?: "PERCENTAGE" | "FIXED_AMOUNT" | "FREE_SHIPPING";
  deliveryMode?:
    | "show_code"
    | "send_email"
    | "show_code_fallback"
    | "show_in_popup_authorized_only";

  // Prizes configuration
  prizes?: Array<{
    id?: string;
    label: string;
    probability?: number;
    discountCode?: string;
    discountPercentage?: number;
    discountValue?: number;
    discountType?: "percentage" | "fixed" | "free_shipping";
    valueType?: "PERCENTAGE" | "FIXED_AMOUNT" | "FREE_SHIPPING";
  }>;

  // Scratch card appearance
  scratchCardWidth?: number;
  scratchCardHeight?: number;
  scratchCardBackgroundColor?: string;
  scratchCardTextColor?: string;
  scratchOverlayColor?: string;
  scratchOverlayImage?: string;

  // Success behavior
  successMessage?: string;
  failureMessage?: string;
  showCopyCodeButton?: boolean;
  autoCloseDelay?: number; // Auto-close after X seconds (0 = disabled)
}

export interface ScratchCardPopupProps {
  config: ScratchCardConfig;
  isVisible: boolean;
  onClose: () => void;
  campaignId?: string;
  renderInline?: boolean;
  onScratchComplete?: (data: {
    email?: string;
    revealed: boolean;
  }) => Promise<void>;
}

export const ScratchCardPopup: React.FC<ScratchCardPopupProps> = ({
  config,
  isVisible,
  onClose,
  campaignId,
  renderInline,
  onScratchComplete,
}) => {
  // State management
  const [email, setEmail] = useState("");
  const [emailSubmitted, setEmailSubmitted] = useState(false);
  const [isScratching, setIsScratching] = useState(false);
  const [scratchPercentage, setScratchPercentage] = useState(0);
  const [isRevealed, setIsRevealed] = useState(false);
  const [error, setError] = useState("");
  const [copied, setCopied] = useState(false);
  const [showConfetti, setShowConfetti] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [localDiscountCode, setLocalDiscountCode] = useState<
    string | undefined
  >(undefined);

  // Refs for reveal decoration
  const revealContainerRef = useRef<HTMLDivElement>(null);
  const confettiCanvasRef = useRef<HTMLCanvasElement>(null);

  // Canvas refs
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const contextRef = useRef<CanvasRenderingContext2D | null>(null);
  const scratchedPixelsRef = useRef<Set<string>>(new Set());
  const totalPixelsRef = useRef<number>(0);

  // Configuration with defaults
  console.log("[ScratchCardPopup] 🔍 Config received:", {
    emailRequired: config.emailRequired,
    emailBeforeScratching: config.emailBeforeScratching,
    headline: config.headline,
    prizes: config.prizes,
  });
  const emailRequired = config.emailRequired ?? true;
  const emailBeforeScratching = config.emailBeforeScratching ?? true;
  console.log("[ScratchCardPopup] 📊 Computed values:", {
    emailRequired,
    emailBeforeScratching,
  });
  const scratchThreshold = config.scratchThreshold ?? 50;
  const scratchRadius = config.scratchRadius ?? 20;
  const scratchCardWidth = config.scratchCardWidth ?? 300;
  const scratchCardHeight = config.scratchCardHeight ?? 200;
  const scratchOverlayColor = config.scratchOverlayColor ?? "#C0C0C0";
  const scratchCardBg = config.scratchCardBackgroundColor ?? "#F59E0B";
  const scratchCardText = config.scratchCardTextColor ?? "#FFFFFF";

  // Check if scratch card should be visible
  const shouldShowScratchCard = useCallback((): boolean => {
    // If email is not required, show scratch card immediately
    if (!emailRequired) return true;

    // If email is required but not before scratching, show scratch card immediately
    if (!emailBeforeScratching) return true;

    // If email is required AND before scratching, only show after email submitted
    if (emailRequired && emailBeforeScratching) {
      return emailSubmitted;
    }

    return true;
  }, [emailRequired, emailBeforeScratching, emailSubmitted]);

  // Reset state when popup visibility changes
  useEffect(() => {
    if (!isVisible) {
      setEmail("");
      setEmailSubmitted(false);
      setIsScratching(false);
      setScratchPercentage(0);
      setIsRevealed(false);
      setError("");
      setCopied(false);
      setShowConfetti(false);
      setIsSubmitting(false);
      setLocalDiscountCode(undefined);
      scratchedPixelsRef.current.clear();
    }
  }, [isVisible]);

  // Initialize canvas
  useEffect(() => {
    if (!isVisible) return;

    // Only initialize canvas when scratch card should be visible
    if (!shouldShowScratchCard()) return;

    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    // Reset scratch state when canvas is re-initialized
    scratchedPixelsRef.current.clear();
    setScratchPercentage(0);

    // Set canvas size
    canvas.width = scratchCardWidth;
    canvas.height = scratchCardHeight;

    // Draw scratch overlay
    if (config.scratchOverlayImage) {
      const img = new Image();
      img.crossOrigin = "anonymous";
      img.onload = () => {
        ctx.drawImage(img, 0, 0, scratchCardWidth, scratchCardHeight);
      };
      img.src = config.scratchOverlayImage;
    } else {
      // Metallic gradient background inspired by scratch cards
      const grad = ctx.createLinearGradient(
        0,
        0,
        scratchCardWidth,
        scratchCardHeight,
      );
      grad.addColorStop(0, "#bfc3c7");
      grad.addColorStop(0.25, "#e3e5e8");
      grad.addColorStop(0.5, "#c7cbcf");
      grad.addColorStop(0.75, "#f1f2f4");
      grad.addColorStop(1, "#b5b8bb");
      ctx.fillStyle = grad;
      ctx.fillRect(0, 0, scratchCardWidth, scratchCardHeight);

      // Subtle diagonal hatch texture
      const patternSize = 16;
      const pCanvas = document.createElement("canvas");
      pCanvas.width = patternSize;
      pCanvas.height = patternSize;
      const pctx = pCanvas.getContext("2d");
      if (pctx) {
        pctx.strokeStyle = "rgba(255,255,255,0.15)";
        pctx.lineWidth = 2;
        pctx.beginPath();
        pctx.moveTo(0, patternSize);
        pctx.lineTo(patternSize, 0);
        pctx.stroke();
        const pattern = ctx.createPattern(pCanvas, "repeat");
        if (pattern) {
          ctx.globalAlpha = 0.6;
          ctx.fillStyle = pattern;
          ctx.fillRect(0, 0, scratchCardWidth, scratchCardHeight);
          ctx.globalAlpha = 1;
        }
      }

      // Instruction text with soft shadow
      ctx.fillStyle = "#ffffff";
      ctx.font = "600 20px system-ui, -apple-system, Segoe UI, Roboto, Arial";
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";
      ctx.shadowColor = "rgba(0,0,0,0.25)";
      ctx.shadowBlur = 6;
      ctx.shadowOffsetY = 2;
      ctx.fillText(
        config.scratchInstruction || "🎫 SCRATCH HERE!",
        scratchCardWidth / 2,
        scratchCardHeight / 2,
      );
      ctx.shadowColor = "transparent";
      ctx.shadowBlur = 0;
      ctx.shadowOffsetY = 0;
    }

    // Set up eraser mode
    ctx.globalCompositeOperation = "destination-out";
    contextRef.current = ctx;

    // Calculate total pixels for percentage tracking
    totalPixelsRef.current = scratchCardWidth * scratchCardHeight;
  }, [
    isVisible,
    scratchCardWidth,
    scratchCardHeight,
    config.scratchOverlayImage,
    scratchOverlayColor,
    config.scratchInstruction,
    shouldShowScratchCard,
    emailSubmitted,
    emailRequired,
    emailBeforeScratching,
  ]);

  // Validate email
  const validateEmail = (email: string): boolean => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  };

  // Handle email submission
  const handleEmailSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError("");

    if (!validateEmail(email)) {
      setError("Please enter a valid email address");
      return;
    }

    // Require campaignId to make the API call
    if (!campaignId) {
      console.warn(
        "[ScratchCardPopup] Missing campaignId; proceeding without API call",
      );
      setEmailSubmitted(true);
      return;
    }

    try {
      setIsSubmitting(true);
      const sessionId =
        typeof window !== "undefined"
          ? window.sessionStorage?.getItem("split_pop_session_id") ||
            `session-${Date.now()}`
          : `session-${Date.now()}`;
      if (typeof window !== "undefined") {
        try {
          window.sessionStorage.setItem("split_pop_session_id", sessionId);
        } catch {}
      }

      // Get shop domain from window config or Shopify global
      interface WindowWithSplitPop extends Window {
        SPLIT_POP_CONFIG?: { shopDomain?: string };
        Shopify?: { shop?: string };
      }

      const shopDomain =
        typeof window !== "undefined"
          ? (window as WindowWithSplitPop).SPLIT_POP_CONFIG?.shopDomain ||
            (window as WindowWithSplitPop).Shopify?.shop ||
            window.location.hostname
          : "";

      // Build URL with shop parameter
      const url = new URL(
        "/apps/split-pop/commerce/leads/subscribe",
        window.location.origin,
      );
      if (shopDomain) {
        url.searchParams.set("shop", shopDomain);
      }

      const resp = await fetch(url.toString(), {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email,
          campaignId,
          consent: true,
          sessionId,
          pageUrl:
            typeof window !== "undefined" ? window.location.href : undefined,
          referrer:
            typeof window !== "undefined" ? document.referrer : undefined,
        }),
      });

      if (!resp.ok) {
        const err = await resp.json().catch(() => ({}));
        const errorMessage =
          err?.errors?.[0] || err?.error || "Subscription failed";
        throw new Error(errorMessage);
      }

      const result = await resp.json();
      if (result?.discountCode) {
        setLocalDiscountCode(result.discountCode);
      }
      setEmailSubmitted(true);
    } catch (err) {
      console.error("[ScratchCardPopup] Lead subscribe failed", err);
      setError(
        err instanceof Error
          ? err.message
          : "Failed to subscribe. Please try again.",
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  // Scratch functions
  const scratch = (x: number, y: number) => {
    const ctx = contextRef.current;
    if (!ctx) return;

    // Soft brush with radial gradient for smoother edges
    const g = ctx.createRadialGradient(
      x,
      y,
      Math.max(1, scratchRadius * 0.3),
      x,
      y,
      scratchRadius,
    );
    g.addColorStop(0, "rgba(0,0,0,1)");
    g.addColorStop(1, "rgba(0,0,0,0)");
    ctx.fillStyle = g;
    ctx.beginPath();
    ctx.arc(x, y, scratchRadius, 0, Math.PI * 2);
    ctx.fill();

    // Track scratched pixels for percentage calculation
    const pixelSize = 5; // Sample every 5 pixels for performance
    for (let px = x - scratchRadius; px < x + scratchRadius; px += pixelSize) {
      for (
        let py = y - scratchRadius;
        py < y + scratchRadius;
        py += pixelSize
      ) {
        const distance = Math.sqrt((px - x) ** 2 + (py - y) ** 2);
        if (distance <= scratchRadius) {
          scratchedPixelsRef.current.add(`${Math.floor(px)},${Math.floor(py)}`);
        }
      }
    }

    // Update scratch percentage
    const scratchedCount =
      scratchedPixelsRef.current.size * (pixelSize * pixelSize);
    const percentage = Math.min(
      (scratchedCount / totalPixelsRef.current) * 100,
      100,
    );
    setScratchPercentage(percentage);

    // Auto-reveal when threshold reached
    if (!isRevealed && percentage >= scratchThreshold) {
      handleReveal();
    }
  };

  const handleMouseDown = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (!canScratch()) return;
    setIsScratching(true);
    const rect = canvasRef.current?.getBoundingClientRect();
    if (rect) {
      scratch(e.clientX - rect.left, e.clientY - rect.top);
    }
  };

  const handleMouseMove = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (!isScratching || !canScratch()) return;
    const rect = canvasRef.current?.getBoundingClientRect();
    if (rect) {
      scratch(e.clientX - rect.left, e.clientY - rect.top);
    }
  };

  const handleMouseUp = () => {
    setIsScratching(false);
  };

  const handleTouchStart = (e: React.TouchEvent<HTMLCanvasElement>) => {
    if (!canScratch()) return;
    e.preventDefault();
    setIsScratching(true);
    const rect = canvasRef.current?.getBoundingClientRect();
    if (rect && e.touches[0]) {
      scratch(
        e.touches[0].clientX - rect.left,
        e.touches[0].clientY - rect.top,
      );
    }
  };

  const handleTouchMove = (e: React.TouchEvent<HTMLCanvasElement>) => {
    if (!isScratching || !canScratch()) return;
    e.preventDefault();
    const rect = canvasRef.current?.getBoundingClientRect();
    if (rect && e.touches[0]) {
      scratch(
        e.touches[0].clientX - rect.left,
        e.touches[0].clientY - rect.top,
      );
    }
  };

  const handleTouchEnd = () => {
    setIsScratching(false);
  };

  // Check if user can scratch
  const canScratch = (): boolean => {
    if (emailRequired && emailBeforeScratching) {
      return emailSubmitted;
    }
    return true;
  };

  // Handle reveal
  const handleReveal = async () => {
    setIsRevealed(true);

    // Clear entire canvas to show prize
    const ctx = contextRef.current;
    if (ctx) {
      ctx.globalCompositeOperation = "destination-out";
      ctx.fillRect(0, 0, scratchCardWidth, scratchCardHeight);
    }

    // Trigger confetti celebration
    setShowConfetti(true);

    // Call completion callback
    if (onScratchComplete) {
      await onScratchComplete({
        email: emailSubmitted ? email : undefined,
        revealed: true,
      });
    }

    // Auto-close if configured
    if (config.autoCloseDelay && config.autoCloseDelay > 0) {
      setTimeout(() => {
        onClose();
      }, config.autoCloseDelay * 1000);
    }
  };

  // Confetti animation when revealed
  useEffect(() => {
    if (!showConfetti) return;
    const container = revealContainerRef.current;
    const canvas = confettiCanvasRef.current;
    if (!container || !canvas) return;

    const rect = container.getBoundingClientRect();
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    // Size canvas to container
    const dpr = Math.max(1, window.devicePixelRatio || 1);
    canvas.width = Math.floor(rect.width * dpr);
    canvas.height = Math.floor(rect.height * dpr);
    canvas.style.width = `${rect.width}px`;
    canvas.style.height = `${rect.height}px`;
    ctx.scale(dpr, dpr);

    const colors = [
      "#ffffff",
      "#fde68a", // amber-200
      "#fca5a5", // red-300
      "#93c5fd", // blue-300
      "#86efac", // green-300
      "#f5d0fe", // fuchsia-200
    ];

    type Particle = {
      x: number;
      y: number;
      w: number;
      h: number;
      vx: number;
      vy: number;
      rot: number;
      vr: number;
      color: string;
    };
    const particles: Particle[] = [];
    const count = Math.max(
      24,
      Math.min(80, Math.floor((rect.width * rect.height) / 5000)),
    );

    for (let i = 0; i < count; i++) {
      particles.push({
        x: Math.random() * rect.width,
        y: -10 - Math.random() * rect.height * 0.3,
        w: 6 + Math.random() * 6,
        h: 8 + Math.random() * 10,
        vx: (Math.random() - 0.5) * 1.2,
        vy: 1.5 + Math.random() * 2.5,
        rot: Math.random() * Math.PI,
        vr: (Math.random() - 0.5) * 0.2,
        color: colors[Math.floor(Math.random() * colors.length)],
      });
    }

    let raf = 0;
    const start = performance.now();
    const duration = 1800; // ms

    const draw = (now: number) => {
      const t = now - start;
      ctx.clearRect(0, 0, rect.width, rect.height);
      particles.forEach((p) => {
        p.x += p.vx;
        p.y += p.vy;
        p.rot += p.vr;
        // simple bounds warp to keep density
        if (p.y > rect.height + 20) p.y = -20;
        if (p.x < -20) p.x = rect.width + 20;
        if (p.x > rect.width + 20) p.x = -20;

        ctx.save();
        ctx.translate(p.x, p.y);
        ctx.rotate(p.rot);
        ctx.fillStyle = p.color;
        ctx.fillRect(-p.w / 2, -p.h / 2, p.w, p.h);
        ctx.restore();
      });

      if (t < duration) {
        raf = requestAnimationFrame(draw);
      } else {
        // Fade out
        const fadeStart = performance.now();
        const fade = () => {
          const ft = performance.now() - fadeStart;
          const alpha = Math.max(0, 1 - ft / 400);
          ctx.globalAlpha = alpha;
          ctx.clearRect(0, 0, rect.width, rect.height);
          particles.forEach((p) => {
            ctx.save();
            ctx.translate(p.x, p.y);
            ctx.rotate(p.rot);
            ctx.fillStyle = p.color;
            ctx.fillRect(-p.w / 2, -p.h / 2, p.w, p.h);
            ctx.restore();
          });
          if (alpha > 0) {
            raf = requestAnimationFrame(fade);
          } else {
            ctx.globalAlpha = 1;
            setShowConfetti(false);
          }
        };
        raf = requestAnimationFrame(fade);
      }
    };

    raf = requestAnimationFrame(draw);

    const onResize = () => {
      // Keep it simple: stop confetti on resize
      cancelAnimationFrame(raf);
      setShowConfetti(false);
    };
    window.addEventListener("resize", onResize);

    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener("resize", onResize);
    };
  }, [showConfetti]);

  // Copy discount code to clipboard
  const handleCopyCode = async () => {
    if (effectiveDiscountCode) {
      try {
        await navigator.clipboard.writeText(effectiveDiscountCode);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
      } catch (err) {
        console.error("Failed to copy code:", err);
      }
    }
  };

  // Get discount configuration (prefer discountConfig, fallback to legacy fields)
  const getDiscountInfo = () => {
    const discount = config.discountConfig;

    if (discount?.enabled) {
      // Use unified discount system
      return {
        code: localDiscountCode || undefined, // Code will be generated/provided by backend
        valueType: discount.valueType,
        value: discount.value,
      };
    }

    // Fallback to legacy fields for backward compatibility
    return {
      code: localDiscountCode || config.discountCode,
      percentage: config.discountPercentage,
      fixedValue: config.discountValue,
      type: config.discountType,
    };
  };

  // Render discount value
  const renderDiscountValue = () => {
    const discountInfo = getDiscountInfo();

    // New system
    if (discountInfo.valueType) {
      if (discountInfo.valueType === "PERCENTAGE") {
        return `${discountInfo.value}% OFF`;
      } else if (discountInfo.valueType === "FIXED_AMOUNT") {
        return `$${discountInfo.value} OFF`;
      } else if (discountInfo.valueType === "FREE_SHIPPING") {
        return "FREE SHIPPING";
      }
    }

    // Legacy system (backward compatibility)
    if (discountInfo.percentage) {
      return `${discountInfo.percentage}% OFF`;
    } else if (discountInfo.fixedValue) {
      return `$${discountInfo.fixedValue} OFF`;
    } else if (discountInfo.type === "free_shipping") {
      return "FREE SHIPPING";
    }

    return "SPECIAL PRIZE";
  };

  const effectiveDiscountCode = getDiscountInfo().code;

  // Disable overlay click when showing revealed prize with discount code
  const popupConfig = {
    ...config,
    // Prevent accidental dismiss only when a code is visible and we aren't auto-closing
    closeOnOverlayClick: !(isRevealed && !!effectiveDiscountCode),
    showCloseButton: config.showCloseButton !== false,
  };

  return (
    <BasePopup
      config={popupConfig}
      isVisible={isVisible}
      onClose={onClose}
      onButtonClick={() => {}}
      renderInline={renderInline}
    >
      <div style={{ textAlign: "center", padding: "20px" }}>
        {/* Header */}
        <div style={{ marginBottom: "24px" }}>
          <div style={{ fontSize: "36px", marginBottom: "8px" }}>🎫</div>
          <h2
            style={{
              fontSize: "28px",
              fontWeight: "bold",
              margin: "0 0 8px 0",
              color: config.textColor || "#1A1A1A",
            }}
          >
            {config.headline || "Scratch & Win!"}
          </h2>
          {config.subheadline && (
            <p
              style={{
                fontSize: "16px",
                margin: 0,
                color: config.textColor || "#666",
              }}
            >
              {config.subheadline}
            </p>
          )}
        </div>

        {/* Loading state after email submission */}
        {emailRequired &&
          emailBeforeScratching &&
          emailSubmitted &&
          isSubmitting && (
            <div
              style={{
                marginBottom: "24px",
                padding: "40px",
                textAlign: "center",
              }}
            >
              <div
                style={{
                  display: "inline-block",
                  width: "40px",
                  height: "40px",
                  border: "4px solid #E5E7EB",
                  borderTopColor: config.buttonColor || "#007BFF",
                  borderRadius: "50%",
                  animation: "spin 0.8s linear infinite",
                  marginBottom: "16px",
                }}
              />
              <style>{`
              @keyframes spin {
                to { transform: rotate(360deg); }
              }
            `}</style>
              <p
                style={{
                  fontSize: "16px",
                  color: config.textColor || "#666",
                  margin: 0,
                }}
              >
                Preparing your scratch card...
              </p>
            </div>
          )}

        {/* Email capture (before scratching) */}
        {emailRequired && emailBeforeScratching && !emailSubmitted && (
          <form onSubmit={handleEmailSubmit} style={{ marginBottom: "24px" }}>
            <div style={{ marginBottom: "12px" }}>
              <label
                style={{
                  display: "block",
                  fontSize: "14px",
                  fontWeight: "500",
                  marginBottom: "8px",
                  textAlign: "left",
                  color: config.textColor || "#1A1A1A",
                }}
              >
                {config.emailLabel || "Enter your email to play"}
              </label>
              <input
                type="email"
                name="email"
                autoComplete="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder={config.emailPlaceholder || "your@email.com"}
                required
                style={{
                  width: "100%",
                  padding: "12px",
                  border: "2px solid #E5E7EB",
                  borderRadius: "6px",
                  fontSize: "16px",
                  boxSizing: "border-box",
                }}
              />
            </div>
            {error && (
              <p
                style={{ color: "#EF4444", fontSize: "14px", margin: "8px 0" }}
              >
                {error}
              </p>
            )}
            <button
              type="submit"
              disabled={isSubmitting}
              style={{
                width: "100%",
                padding: "12px 24px",
                backgroundColor: isSubmitting
                  ? "#9CA3AF"
                  : config.buttonColor || "#007BFF",
                color: config.buttonTextColor || "#FFFFFF",
                border: "none",
                borderRadius: "6px",
                fontSize: "16px",
                fontWeight: "600",
                cursor: isSubmitting ? "not-allowed" : "pointer",
                opacity: isSubmitting ? 0.7 : 1,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                gap: "8px",
              }}
            >
              {isSubmitting ? (
                <>
                  <span
                    style={{
                      display: "inline-block",
                      width: "16px",
                      height: "16px",
                      border: "2px solid #FFFFFF",
                      borderTopColor: "transparent",
                      borderRadius: "50%",
                      animation: "spin 0.6s linear infinite",
                    }}
                  />
                  <style>{`
                    @keyframes spin {
                      to { transform: rotate(360deg); }
                    }
                  `}</style>
                  Loading...
                </>
              ) : (
                config.submitButtonText || "Start Scratching!"
              )}
            </button>
          </form>
        )}

        {/* Scratch card */}
        {shouldShowScratchCard() && !isRevealed && (
          <div style={{ marginBottom: "24px" }}>
            <div
              style={{
                position: "relative",
                display: "inline-block",
                cursor: canScratch()
                  ? isScratching
                    ? "grabbing"
                    : "grab"
                  : "not-allowed",
                transform: isScratching ? "scale(0.99)" : "scale(1)",
                transition: "transform 120ms ease",
                touchAction: "none",
              }}
            >
              {/* Prize content (behind canvas) */}
              <div
                style={{
                  position: "absolute",
                  top: 0,
                  left: 0,
                  width: `${scratchCardWidth}px`,
                  height: `${scratchCardHeight}px`,
                  backgroundColor: scratchCardBg,
                  borderRadius: "8px",
                  display: "flex",
                  flexDirection: "column",
                  alignItems: "center",
                  justifyContent: "center",
                  padding: "20px",
                  boxSizing: "border-box",
                }}
              >
                <div
                  style={{
                    fontSize: "48px",
                    marginBottom: "8px",
                    color: scratchCardText,
                  }}
                >
                  🎉
                </div>
                <div
                  style={{
                    fontSize: "24px",
                    fontWeight: "bold",
                    color: scratchCardText,
                    marginBottom: "8px",
                  }}
                >
                  {renderDiscountValue()}
                </div>
                {effectiveDiscountCode && (
                  <div
                    style={{
                      fontSize: "18px",
                      fontWeight: "600",
                      color: scratchCardText,
                      backgroundColor: "rgba(255,255,255,0.2)",
                      padding: "8px 16px",
                      borderRadius: "4px",
                      marginTop: "8px",
                    }}
                  >
                    {effectiveDiscountCode}
                  </div>
                )}
              </div>

              {/* Scratch canvas (on top) */}
              <canvas
                ref={canvasRef}
                onMouseDown={handleMouseDown}
                onMouseMove={handleMouseMove}
                onMouseUp={handleMouseUp}
                onMouseLeave={handleMouseUp}
                onTouchStart={handleTouchStart}
                onTouchMove={handleTouchMove}
                onTouchEnd={handleTouchEnd}
                style={{
                  position: "relative",
                  borderRadius: "8px",
                  boxShadow: "0 4px 6px rgba(0,0,0,0.1)",
                  cursor: canScratch() ? "inherit" : "not-allowed",
                }}
              />
            </div>

            {/* Progress indicator */}
            {scratchPercentage > 0 && scratchPercentage < scratchThreshold && (
              <div
                style={{ marginTop: "12px", fontSize: "14px", color: "#666" }}
              >
                {Math.round(scratchPercentage)}% revealed - Keep scratching!
              </div>
            )}
          </div>
        )}

        {/* Revealed state */}
        {isRevealed && (
          <div style={{ marginBottom: "24px" }}>
            <div
              ref={revealContainerRef}
              style={{
                position: "relative",
                overflow: "hidden",
                backgroundColor: scratchCardBg,
                borderRadius: "8px",
                padding: "32px",
                marginBottom: "16px",
              }}
            >
              {/* Confetti canvas overlay */}
              {showConfetti && (
                <canvas
                  ref={confettiCanvasRef}
                  style={{
                    position: "absolute",
                    inset: 0,
                    pointerEvents: "none",
                  }}
                />
              )}
              <div style={{ fontSize: "48px", marginBottom: "12px" }}>🎉</div>
              <h3
                style={{
                  fontSize: "24px",
                  fontWeight: "bold",
                  color: scratchCardText,
                  margin: "0 0 12px 0",
                }}
              >
                {config.prizeMessage || "Congratulations!"}
              </h3>
              <div
                style={{
                  fontSize: "32px",
                  fontWeight: "bold",
                  color: scratchCardText,
                  marginBottom: "16px",
                }}
              >
                {renderDiscountValue()}
              </div>
              {effectiveDiscountCode && (
                <div>
                  <div
                    style={{
                      fontSize: "20px",
                      fontWeight: "600",
                      color: scratchCardText,
                      backgroundColor: "rgba(255,255,255,0.3)",
                      padding: "12px 20px",
                      borderRadius: "6px",
                      display: "inline-block",
                      marginBottom: "12px",
                    }}
                  >
                    {effectiveDiscountCode}
                  </div>
                  {config.showCopyCodeButton !== false && (
                    <div>
                      <button
                        onClick={handleCopyCode}
                        style={{
                          padding: "10px 20px",
                          backgroundColor: "rgba(255,255,255,0.9)",
                          color: scratchCardBg,
                          border: "none",
                          borderRadius: "6px",
                          fontSize: "14px",
                          fontWeight: "600",
                          cursor: "pointer",
                          marginTop: "8px",
                        }}
                      >
                        {copied ? "✓ Copied!" : "Copy Code"}
                      </button>
                    </div>
                  )}
                </div>
              )}
            </div>
            {config.revealMessage && (
              <p
                style={{
                  fontSize: "14px",
                  color: config.textColor || "#666",
                  margin: 0,
                }}
              >
                {config.revealMessage}
              </p>
            )}
          </div>
        )}

        {/* Email capture (after scratching) */}
        {emailRequired &&
          !emailBeforeScratching &&
          isRevealed &&
          !emailSubmitted && (
            <form onSubmit={handleEmailSubmit} style={{ marginTop: "24px" }}>
              <div style={{ marginBottom: "12px" }}>
                <label
                  style={{
                    display: "block",
                    fontSize: "14px",
                    fontWeight: "500",
                    marginBottom: "8px",
                    textAlign: "left",
                    color: config.textColor || "#1A1A1A",
                  }}
                >
                  {config.emailLabel || "Enter your email to receive the code"}
                </label>
                <input
                  type="email"
                  name="email"
                  autoComplete="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder={config.emailPlaceholder || "your@email.com"}
                  required
                  style={{
                    width: "100%",
                    padding: "12px",
                    border: "2px solid #E5E7EB",
                    borderRadius: "6px",
                    fontSize: "16px",
                    boxSizing: "border-box",
                  }}
                />
              </div>
              {error && (
                <p
                  style={{
                    color: "#EF4444",
                    fontSize: "14px",
                    margin: "8px 0",
                  }}
                >
                  {error}
                </p>
              )}
              <button
                type="submit"
                style={{
                  width: "100%",
                  padding: "12px 24px",
                  backgroundColor: config.buttonColor || "#007BFF",
                  color: config.buttonTextColor || "#FFFFFF",
                  border: "none",
                  borderRadius: "6px",
                  fontSize: "16px",
                  fontWeight: "600",
                  cursor: "pointer",
                }}
              >
                Get My Code
              </button>
            </form>
          )}
      </div>
    </BasePopup>
  );
};

export default ScratchCardPopup;
