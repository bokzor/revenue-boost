/**
 * SpinToWinPopup Component - Modern & Professional Design
 *
 * A clean, modern gamification popup with:
 * - Minimalist wheel design with subtle gradients
 * - Smooth, professional animations
 * - Clean email capture
 * - Elegant prize reveal
 * - Modern typography and spacing
 * - Professional color palette
 */

import React, { useState, useCallback, useRef, useEffect, useMemo } from "react";
import { PopupPortal } from "./PopupPortal";
import { PopupGridContainer } from "./PopupGridContainer";
import type { PopupDesignConfig, Prize } from "./types";
import type { SpinToWinContent } from "~/domains/campaigns/types/campaign";
import { prefersReducedMotion, debounce } from "./utils";
import { POPUP_SPACING, getContainerPadding, SPACING_GUIDELINES } from "./spacing";

// Import custom hooks
import { usePopupForm, useDiscountCode, usePopupAnimation } from "./hooks";

// Import canvas utilities
import { WheelRenderer } from "./utils/canvas";

// Import reusable components
import { EmailInput, NameInput, GdprCheckbox, SubmitButton } from "./components";

// Import shared components from Phase 1 & 2
import { LeadCaptureForm, DiscountCodeDisplay, SuccessState } from "./components/shared";

/**
 * SpinToWinConfig - Extends both design config AND campaign content type
 * All content fields (headline, spinButtonText, emailPlaceholder, etc.) come from SpinToWinContent
 * All design fields (colors, position, size, etc.) come from PopupDesignConfig
 */
export interface SpinToWinConfig extends PopupDesignConfig, SpinToWinContent {
  // Storefront-specific fields only
  animationDuration?: number;
  showConfetti?: boolean;

  // Note: wheelSegments, emailRequired, emailPlaceholder, spinButtonText, etc.
  // all come from SpinToWinContent
}

export interface SpinToWinPopupProps {
  config: SpinToWinConfig;
  isVisible: boolean;
  onClose: () => void;
  onSpin?: (email: string) => Promise<void>;
  onWin?: (prize: Prize) => void;
}

export const SpinToWinPopup: React.FC<SpinToWinPopupProps> = ({
  config,
  isVisible,
  onClose,
  onSpin,
  onWin,
}) => {
  // Use custom hooks for form management
  const {
    formState,
    setEmail,
    setName,
    setGdprConsent,
    errors,
    handleSubmit: handleFormSubmit,
    isSubmitting,
  } = usePopupForm({
    config: {
      emailRequired: config.emailRequired,
      emailErrorMessage: undefined, // SpinToWinContent doesn't have this field
      nameFieldEnabled: config.collectName,
      nameFieldRequired: config.nameFieldRequired,
      consentFieldEnabled: config.showGdprCheckbox,
      consentFieldRequired: config.consentFieldRequired,
      campaignId: config.campaignId,
      previewMode: config.previewMode,
    },
  });

  // Use animation hook
  const { showContent } = usePopupAnimation({ isVisible });

  // Use discount code hook
  const { discountCode, setDiscountCode, copiedCode, handleCopyCode } = useDiscountCode();

  const [hasSpun, setHasSpun] = useState(false);
  const [isSpinning, setIsSpinning] = useState(false);
  const [isGeneratingCode, setIsGeneratingCode] = useState(false);
  const [wonPrize, setWonPrize] = useState<Prize | null>(null);
  const [codeError, setCodeError] = useState("");
  const [rotation, setRotation] = useState(0);
  const rotationRef = useRef(0);
  const spinAnimationFrameRef = useRef<number | null>(null);
  const spinStartTimeRef = useRef<number | null>(null);
  const spinFromRef = useRef(0);
  const spinToRef = useRef(0);

  useEffect(() => {
    rotationRef.current = rotation;
  }, [rotation]);

  useEffect(() => {
    return () => {
      if (spinAnimationFrameRef.current !== null && typeof cancelAnimationFrame !== "undefined") {
        cancelAnimationFrame(spinAnimationFrameRef.current);
      }
    };
  }, []);

  const [emailFocused, setEmailFocused] = useState(false);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const wheelContainerRef = useRef<HTMLDivElement | null>(null);
  const wheelCellRef = useRef<HTMLDivElement | null>(null);
  const cardRef = useRef<HTMLDivElement | null>(null);

  const [containerWidth, setContainerWidth] = useState<number | null>(null);
  const [cardWidth, setCardWidth] = useState<number | null>(null);
  const [wheelSize, setWheelSize] = useState(config.wheelSize || 380);
  const radius = wheelSize / 2;
  const segments = useMemo(() => config.wheelSegments || [], [config.wheelSegments]);
  const segmentAngle = 360 / Math.max(1, segments.length);
  const accentColor = config.accentColor || config.buttonColor || "#000000";
  const borderRadius =
    typeof config.borderRadius === "string"
      ? parseFloat(config.borderRadius) || 16
      : (config.borderRadius ?? 16);
  const animDuration = config.animationDuration ?? 300;

  // Responsive wheel sizing based on container dimensions
  // We now rely on the wheelCellRef size which is determined by CSS Grid layout
  const updateWheelSize = useCallback(() => {
    if (typeof window === "undefined") return;
    const container = wheelCellRef.current;
    if (!container) return;

    const measuredWidth = container.clientWidth;
    const measuredHeight = container.clientHeight;

    if (!measuredWidth || !measuredHeight) return;

    // Determine if we are in a stacked (mobile) or side-by-side (desktop) layout
    // We can infer this from the aspect ratio of the container or by checking the parent grid
    // But simpler: just fit the wheel into the available cell space

    const size = Math.min(measuredWidth, measuredHeight);

    // Ensure it's not too small but also fits with some padding
    const newSize = Math.max(250, size - 40);

    setWheelSize(newSize);
  }, []);

  // Debounce the update to avoid excessive re-renders during resize
  const debouncedUpdateWheelSize = useMemo(() => debounce(updateWheelSize, 100), [updateWheelSize]);

  // Trigger update when cardRef's size changes (which happens on container resize)
  useEffect(() => {
    if (!isVisible || typeof window === "undefined") return;

    let observer: ResizeObserver | null = null;

    const measureAndSetWheelSize = () => {
      debouncedUpdateWheelSize();
    };

    if (typeof ResizeObserver !== "undefined" && wheelCellRef.current) {
      observer = new ResizeObserver(measureAndSetWheelSize);
      observer.observe(wheelCellRef.current as Element);
    } else {
      // Fallback for older browsers
      window.addEventListener("resize", measureAndSetWheelSize);
    }

    // Initial measurement
    measureAndSetWheelSize();

    return () => {
      if (observer) {
        observer.disconnect();
      } else {
        window.removeEventListener("resize", measureAndSetWheelSize);
      }
    };
  }, [isVisible, debouncedUpdateWheelSize]);

  // Wheel border styling (theme-aware via admin config)
  const wheelBorderColor = config.wheelBorderColor || "#FFFFFF";
  const wheelBorderWidth = config.wheelBorderWidth ?? 3;

  // Card background styling (supports gradient backgrounds from themes)
  const baseBackground = config.backgroundColor || "#FFFFFF";
  const backgroundStyles: React.CSSProperties = baseBackground.startsWith("linear-gradient(")
    ? {
        backgroundImage: baseBackground,
        backgroundColor: "transparent",
      }
    : {
        backgroundColor: baseBackground,
      };

  // Input colors derived from design config (theme-aware)
  const inputBackground = config.inputBackgroundColor || "#FFFFFF";
  const inputTextColor = config.inputTextColor || "#111827";
  const inputBorderColor = config.inputBorderColor || "#E5E7EB";

  // Theme-aware colors for success/prize surfaces
  const successColor = (config as any).successColor || accentColor;
  const descriptionColor = (config as any).descriptionColor || "#6B7280";

  // Optional extended behavior flags (storefront-only)
  const collectName = config.collectName ?? false;
  const showGdpr = config.showGdprCheckbox ?? false;
  const gdprLabel =
    config.gdprLabel || "I agree to receive marketing emails and accept the privacy policy";

  const resultMessage =
    hasSpun && wonPrize
      ? wonPrize.generatedCode
        ? `You won ${wonPrize.label}!`
        : config.failureMessage || wonPrize.label || "Thanks for playing!"
      : null;

  // Canvas-based wheel rendering using WheelRenderer utility
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas || segments.length === 0) return;

    const renderer = new WheelRenderer(canvas);
    renderer.render(segments, {
      wheelSize,
      rotation,
      accentColor,
      wheelBorderColor,
      wheelBorderWidth,
      hasSpun,
      wonPrize,
    });
  }, [
    segments,
    wheelSize,
    accentColor,
    wheelBorderColor,
    wheelBorderWidth,
    hasSpun,
    wonPrize,
    rotation,
  ]);

  // Auto-close timer
  useEffect(() => {
    if (!isVisible || !config.autoCloseDelay || config.autoCloseDelay <= 0) return;

    const timer = setTimeout(onClose, config.autoCloseDelay * 1000);
    return () => clearTimeout(timer);
  }, [isVisible, config.autoCloseDelay, onClose]);

  // Prize selection and wheel rotation now handled server-side for security

  const handleSpin = useCallback(async () => {
    // Validate form manually (don't submit yet - we'll submit via /api/popups/spin-win)
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    const newErrors: { email?: string; name?: string; gdpr?: string } = {};

    if (config.emailRequired && !formState.email) {
      newErrors.email = "Email is required";
    } else if (formState.email && !emailRegex.test(formState.email)) {
      newErrors.email = "Please enter a valid email";
    }

    if (config.nameFieldRequired && !formState.name?.trim()) {
      newErrors.name = "Name is required";
    }

    if (config.consentFieldRequired && !formState.gdprConsent) {
      newErrors.gdpr = "You must accept the terms to continue";
    }

    if (Object.keys(newErrors).length > 0) {
      // Trigger validation errors in the form hook
      await handleFormSubmit();
      return;
    }

    setIsSpinning(true);
    setCodeError("");

    // 1. Start spinning indefinitely (or to a very distant target)
    // We'll adjust the target once we have the prize
    const duration = config.spinDuration || 4000;
    const reduceMotion = prefersReducedMotion();

    if (spinAnimationFrameRef.current !== null && typeof cancelAnimationFrame !== "undefined") {
      cancelAnimationFrame(spinAnimationFrameRef.current);
    }

    // Initial "loading" spin - rotate fast
    spinFromRef.current = rotationRef.current;
    // Target a far rotation so it keeps spinning until we update it
    const initialTarget = rotationRef.current + 360 * 10;
    spinToRef.current = initialTarget;
    spinStartTimeRef.current = performance.now();

    const easeOutCubic = (t: number) => 1 - Math.pow(1 - t, 3);
    const easeInOutQuad = (t: number) => (t < 0.5 ? 2 * t * t : -1 + (4 - 2 * t) * t);

    // Animation loop
    const animate = (timestamp: number) => {
      if (spinStartTimeRef.current === null) return;

      const elapsed = timestamp - spinStartTimeRef.current;
      // If we don't have a prize yet, keep spinning linearly or gently easing
      // If we DO have a prize, we switch to easing out to the final target

      // Simplified approach: Always ease out, but update the target when prize comes in
      const t = Math.min(1, elapsed / duration);
      const eased = easeOutCubic(t);

      const current = spinFromRef.current + (spinToRef.current - spinFromRef.current) * eased;
      setRotation(current);

      if (t < 1) {
        spinAnimationFrameRef.current = requestAnimationFrame(animate);
      } else {
        spinAnimationFrameRef.current = null;
        setRotation(spinToRef.current);
        setHasSpun(true);
        setIsSpinning(false);
      }
    };

    spinAnimationFrameRef.current = requestAnimationFrame(animate);

    try {
      if (!config.previewMode && onSpin) {
        await onSpin(formState.email);
      }

      // 2. Fetch Prize
      let serverPrize: Prize | null = null;
      let generatedCode: string | undefined;
      let autoApply = false;

      if (!config.previewMode && config.campaignId) {
        setIsGeneratingCode(true);
        try {
          // Get sessionId from global session object (set by storefront extension)
          const sessionId =
            typeof window !== "undefined"
              ? (window as any).__RB_SESSION_ID ||
                window.sessionStorage?.getItem("revenue_boost_session") ||
                ""
              : "";

          const response = await fetch("/apps/revenue-boost/api/popups/spin-win", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              campaignId: config.campaignId,
              email: formState.email,
              sessionId,
              challengeToken: config.challengeToken,
            }),
          });
          const data = await response.json();
          if (data.success && data.prize && data.discountCode) {
            serverPrize = {
              id: data.prize.id,
              label: data.prize.label,
              color: data.prize.color,
              probability: 0,
              generatedCode: data.discountCode,
            };
            generatedCode = data.discountCode;
            autoApply = data.autoApply;
            if (generatedCode) {
              setDiscountCode(generatedCode);
            }
          } else {
            setCodeError(data.error || "Could not generate discount code");
          }
        } catch (err) {
          console.error("API error", err);
          setCodeError("Network error");
        } finally {
          setIsGeneratingCode(false);
        }
      } else {
        // Preview mode: pick random
        const randomIdx = Math.floor(Math.random() * segments.length);
        serverPrize = segments[randomIdx];
        generatedCode = "PREVIEW10";
        setDiscountCode(generatedCode);
      }

      // 3. Calculate Final Rotation
      if (serverPrize) {
        setWonPrize(serverPrize);

        // Find index
        const prizeIndex = segments.findIndex((s) => s.id === serverPrize?.id);
        if (prizeIndex !== -1) {
          // Calculate target angle to align winning segment to 3 o'clock (0deg / 360deg)
          // Segment starts at: index * segmentAngle - 90
          // Center of segment: index * segmentAngle - 90 + segmentAngle/2
          // We want Center to be at 0 (East)
          // So we need to rotate by: 0 - Center
          // But we want to add full spins: 360 * 5 + (0 - Center)

          const segmentAngle = 360 / segments.length;
          const segmentCenter = prizeIndex * segmentAngle - 90 + segmentAngle / 2;

          // Normalize segmentCenter to 0-360
          // e.g. if center is -45, we want to rotate +45 to bring it to 0.
          // target = -segmentCenter

          const baseTarget = -segmentCenter;

          // Add extra spins to ensure we spin forward and enough times
          // Current rotation is somewhere in the middle of the initial spin
          // We want to extend the animation to land exactly on target

          const currentRot = rotationRef.current;
          const minSpins = 5;
          const targetRotation = currentRot + 360 * minSpins + (baseTarget - (currentRot % 360));

          // Adjust spinToRef to the calculated target
          // We also reset the start time to ensure a smooth ease-out from current position to new target
          spinFromRef.current = currentRot;
          spinToRef.current = targetRotation;
          spinStartTimeRef.current = performance.now();

          // The animation loop will pick up the new spinToRef and ease towards it
        }

        if (onWin && serverPrize) onWin(serverPrize);

        if (autoApply && generatedCode && typeof window !== "undefined") {
          window.localStorage.setItem("rb_discount_code", generatedCode);
        }
      }
    } catch (error) {
      console.error("Spin error:", error);
      setIsSpinning(false);
    }
  }, [handleFormSubmit, config, formState.email, onSpin, segments, onWin, setDiscountCode]);

  const buttonStyles: React.CSSProperties = {
    width: "100%",
    padding: POPUP_SPACING.component.button,
    fontSize: "16px",
    fontWeight: 700,
    border: "none",
    borderRadius: `${borderRadius}px`,
    backgroundColor: config.buttonColor || accentColor,
    color: config.buttonTextColor || "#FFFFFF",
    cursor: "pointer",
    opacity: isSpinning ? 0.5 : 1,
    transition: `all ${animDuration}ms cubic-bezier(0.4, 0, 0.2, 1)`,
    fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
    textTransform: "uppercase",
    letterSpacing: "0.05em",
  };

  const secondaryButtonStyles: React.CSSProperties = {
    ...buttonStyles,
    padding: POPUP_SPACING.component.buttonSecondary,
    backgroundColor: "transparent",
    color: config.textColor || "#4B5563",
    boxShadow: "none",
    cursor: "pointer",
    opacity: 0.9,
    textTransform: "none",
    letterSpacing: "normal",
  };

  if (!isVisible) return null;

  return (
    <PopupPortal
      isVisible={isVisible}
      onClose={onClose}
      backdrop={{
        color: config.overlayColor || "rgba(0, 0, 0, 1)",
        opacity: config.overlayOpacity ?? 0.6,
        blur: 4,
      }}
      animation={{
        type: config.animation || "fade",
        duration: animDuration,
      }}
      position="center"
      size={config.size || "large"}
      closeOnEscape={config.closeOnEscape !== false}
      closeOnBackdropClick={config.closeOnOverlayClick !== false}
      previewMode={config.previewMode}
      ariaLabel={config.ariaLabel || config.headline}
      ariaDescribedBy={config.ariaDescribedBy}
      customCSS={config.customCSS}
      globalCustomCSS={config.globalCustomCSS}
    >
      {/* Inject CSS for animations and placeholder colors */}
      <style>
        {`
          @keyframes slideUpFade {
            from {
              opacity: 0;
              transform: translateY(20px);
            }
            to {
              opacity: 1;
              transform: translateY(0);
            }
          }

          /* Dynamic placeholder color based on inputTextColor */
          .spin-to-win-input::placeholder {
            color: ${inputTextColor ? `${inputTextColor}80` : "rgba(107, 114, 128, 0.5)"};
            opacity: 1;
          }

          /* Wheel Cell - Mobile First */
          .spin-wheel-cell {
            position: relative;
            display: flex;
            justify-content: center;
            align-items: flex-end;
            overflow: visible;
            padding: 0;
            z-index: 10;
            min-height: 300px;
            width: 100%;
            height: 100%;
          }

          /* Form Cell - Mobile First */
          .spin-form-cell {
            display: flex;
            flex-direction: column;
            justify-content: center;
            align-items: center;
            padding: ${getContainerPadding(config.size)};
            z-index: 20;
            /* Ensure background is solid on mobile so text is readable over wheel if they overlap */
            background-color: ${baseBackground};
            width: 100%;
          }

          .spin-form-content {
            width: 100%;
            display: flex;
            flex-direction: column;
            gap: ${SPACING_GUIDELINES.betweenFields};
          }

          /* Wheel Wrapper - Mobile First */
          .spin-wheel-wrapper {
            position: absolute;
            /* Center horizontally */
            left: 50%;
            transform: translateX(-50%) rotate(90deg); /* Rotate 90deg for mobile */
            transform-origin: center center;
            bottom: 0;
            z-index: 10;
            transition: transform 0.3s ease;
          }

          /* Pointer - Mobile First (Bottom/6 o'clock relative to visual, but 3 o'clock relative to rotated wheel) */
          .spin-pointer {
             position: absolute;
             top: 50%;
             right: -12px; /* Points to the right side of the wrapper (which is bottom visually due to rotation) */
             transform: translateY(-50%);
             width: 0;
             height: 0;
             border-top: 16px solid transparent;
             border-bottom: 16px solid transparent;
             border-right: 24px solid #FFFFFF;
             filter: drop-shadow(-2px 0 4px rgba(0,0,0,0.2));
             z-index: 20;
          }


          /* ✅ Desktop Layout (via Container Query) */
          @container popup (min-width: 600px) {
            .spin-wheel-cell {
              justify-content: flex-end; /* Align to center line */
              align-items: center;
              min-height: auto;
            }

            .spin-form-cell {
              padding: ${POPUP_SPACING.padding.wide};
              background-color: transparent; /* Transparent on desktop */
            }

            .spin-wheel-wrapper {
              left: auto;
              right: 0; /* Align to right edge of cell (center of popup) */
              top: 50%;
              bottom: auto;
              transform: translateY(-50%); /* No rotation, just vertical center */
            }
          }
        `}
      </style>

      <PopupGridContainer
        config={config}
        onClose={onClose}
        imagePosition="left" // Wheel is always left (or top on mobile)
        className="SpinToWinPopup"
        data-splitpop="true"
        data-template="spin-to-win"
      >
        {/* Wheel Cell */}
        <div className="spin-wheel-cell" ref={wheelCellRef}>
          <div
            className="spin-wheel-wrapper"
            style={{
              width: wheelSize,
              height: wheelSize,
            }}
          >
            {/* Rotating wheel canvas */}
            <div
              ref={wheelContainerRef}
              style={{
                position: "relative",
                width: "100%",
                height: "100%",
                filter: hasSpun
                  ? "drop-shadow(0 18px 45px rgba(15,23,42,0.55))"
                  : "drop-shadow(0 10px 30px rgba(15,23,42,0.35))",
              }}
            >
              <canvas
                ref={canvasRef}
                width={wheelSize}
                height={wheelSize}
                style={{
                  width: "100%",
                  height: "100%",
                  borderRadius: "50%",
                }}
              />
            </div>

            {/* Pointer */}
            <div className="spin-pointer" />

            {/* Center button visual */}
            <div
              style={{
                position: "absolute",
                top: "50%",
                left: "50%",
                transform: "translate(-50%, -50%)",
                width: 80,
                height: 80,
                borderRadius: "50%",
                backgroundColor: accentColor,
                border: "4px solid rgba(15,23,42,0.85)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                color: "#F9FAFB",
                fontSize: 12,
                fontWeight: 600,
                letterSpacing: "0.12em",
                textTransform: "uppercase",
                fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
                boxShadow: "0 4px 12px rgba(15,23,42,0.4)",
                pointerEvents: "none",
                zIndex: 15,
              }}
            >
              {isSpinning ? "..." : "SPIN"}
            </div>
          </div>
        </div>

        {/* Form Cell */}
        <div className="spin-form-cell">
          <div className="spin-form-content">
            {/* Header */}
            <div style={{ textAlign: "center", marginBottom: SPACING_GUIDELINES.afterDescription }}>
              <h2
                style={{
                  fontSize: (config as any).titleFontSize || config.fontSize || "2rem",
                  fontWeight: (config as any).titleFontWeight || config.fontWeight || 900,
                  color: config.textColor || "#111827",
                  marginBottom: SPACING_GUIDELINES.afterHeadline,
                  lineHeight: 1.1,
                  textShadow: (config as any).titleTextShadow,
                }}
              >
                {wonPrize
                  ? wonPrize.label.includes("OFF")
                    ? "YOU WON!"
                    : "CONGRATS!"
                  : config.headline || "SPIN TO WIN!"}
              </h2>
              <p
                style={{
                  fontSize: (config as any).descriptionFontSize || config.fontSize || "1.125rem",
                  color: descriptionColor,
                  fontWeight: (config as any).descriptionFontWeight || config.fontWeight || 500,
                  lineHeight: 1.6,
                }}
              >
                {resultMessage || config.subheadline || "Try your luck to win exclusive discounts!"}
              </p>
            </div>

            {/* Form or Result */}
            {!hasSpun ? (
              <>
                {collectName && (
                  <div style={{ width: "100%" }}>
                    <NameInput
                      value={formState.name}
                      onChange={setName}
                      placeholder={(config as any).nameFieldPlaceholder || "Your Name"}
                      label={(config as any).nameFieldLabel}
                      error={errors.name}
                      required={config.nameFieldRequired}
                      disabled={isSpinning || isGeneratingCode}
                      accentColor={accentColor}
                      textColor={inputTextColor}
                      backgroundColor={inputBackground}
                    />
                  </div>
                )}

                {config.emailRequired && (
                  <div style={{ width: "100%" }}>
                    <EmailInput
                      value={formState.email}
                      onChange={setEmail}
                      placeholder={config.emailPlaceholder || "Enter your email"}
                      label={config.emailLabel}
                      error={errors.email}
                      required={config.emailRequired}
                      disabled={isSpinning || isGeneratingCode}
                      accentColor={accentColor}
                      textColor={inputTextColor}
                      backgroundColor={inputBackground}
                    />
                  </div>
                )}

                {showGdpr && (
                  <GdprCheckbox
                    checked={formState.gdprConsent}
                    onChange={setGdprConsent}
                    text={gdprLabel}
                    error={errors.gdpr}
                    required={config.consentFieldRequired}
                    disabled={isSpinning || isGeneratingCode}
                    accentColor={accentColor}
                    textColor={descriptionColor}
                  />
                )}

                <button
                  onClick={handleSpin}
                  disabled={isSpinning || isGeneratingCode}
                  style={{
                    ...buttonStyles,
                    marginTop: POPUP_SPACING.section.md,
                    position: "relative",
                    overflow: "hidden",
                  }}
                  onMouseEnter={(e) => {
                    if (!isSpinning && !hasSpun) {
                      e.currentTarget.style.transform = "translateY(-2px)";
                    }
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.transform = "translateY(0)";
                  }}
                >
                  {isSpinning ? (
                    <span
                      style={{
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        gap: "10px",
                      }}
                    >
                      <span
                        style={{
                          width: "16px",
                          height: "16px",
                          border: "2px solid rgba(255,255,255,0.3)",
                          borderTopColor: "#FFF",
                          borderRadius: "50%",
                          animation: "spin 0.8s linear infinite",
                        }}
                      />
                      {config.loadingText || "Spinning..."}
                    </span>
                  ) : (
                    config.spinButtonText || "Spin to Win!"
                  )}
                </button>

                {/* Hide "No thanks" button after spin */}
                {!hasSpun && (
                  <button
                    type="button"
                    onClick={onClose}
                    style={{
                      ...secondaryButtonStyles,
                      marginTop: SPACING_GUIDELINES.betweenButtons,
                    }}
                    onMouseEnter={(e) => (e.currentTarget.style.opacity = "1")}
                    onMouseLeave={(e) => (e.currentTarget.style.opacity = "0.9")}
                  >
                    {config.dismissLabel || "No thanks"}
                  </button>
                )}
              </>
            ) : (
              <div
                style={{
                  width: "100%",
                  textAlign: "center",
                  animation: "slideUpFade 0.5s ease-out",
                }}
              >
                {wonPrize?.generatedCode ? (
                  <div style={{ marginTop: "1rem" }}>
                    <DiscountCodeDisplay
                      code={wonPrize.generatedCode}
                      onCopy={handleCopyCode}
                      copied={copiedCode}
                      label="Your Discount Code"
                      variant="dashed"
                      accentColor={accentColor}
                      textColor={descriptionColor}
                      size="lg"
                    />
                  </div>
                ) : (
                  <div style={{ marginTop: "1rem" }}>
                    <p style={{ fontSize: "16px", color: descriptionColor }}>
                      {config.failureMessage || "Better luck next time!"}
                    </p>
                  </div>
                )}

                <button
                  onClick={onClose}
                  style={{
                    ...buttonStyles,
                    marginTop: "1.5rem",
                  }}
                >
                  CONTINUE SHOPPING
                </button>
              </div>
            )}
          </div>
        </div>
      </PopupGridContainer>
    </PopupPortal>
  );
};
