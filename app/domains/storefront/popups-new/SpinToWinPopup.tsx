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
 * - **Truly responsive design using container-relative units**
 */

import React, { useState, useCallback, useRef, useEffect, useMemo } from "react";
import { PopupPortal } from "./PopupPortal";
import { PopupGridContainer } from "./PopupGridContainer";
import type { PopupDesignConfig, Prize } from "./types";
import type { SpinToWinContent } from "~/domains/campaigns/types/campaign";
import { prefersReducedMotion, debounce } from "./utils";
import { POPUP_SPACING } from "./spacing";

// Import custom hooks
import { usePopupForm, useDiscountCode, usePopupAnimation } from "./hooks";

// Import canvas utilities
import { WheelRenderer } from "./utils/canvas";

// Import reusable components
import { EmailInput, NameInput, GdprCheckbox, SubmitButton } from "./components";

// Import shared components from Phase 1 & 2
import { LeadCaptureForm, DiscountCodeDisplay, SuccessState } from "./components/shared";

/**
 * CSS Custom Properties for container-relative responsive design
 * These scale based on the popup container size (cqi = container query inline)
 */
const RESPONSIVE_CSS_VARS = `
  /* ============================================
   * CONTAINER-RELATIVE DESIGN TOKENS
   * All values scale with popup container size
   * ============================================ */
  
  /* Wheel Sizing - Uses cqmin for square proportions */
  --stw-wheel-size: clamp(200px, 65cqmin, 380px);
  --stw-wheel-size-mobile: clamp(180px, 55cqi, 280px);
  
  /* Center Button */
  --stw-center-btn-size: clamp(50px, 18cqmin, 80px);
  --stw-center-btn-font: clamp(9px, 2.5cqmin, 12px);
  --stw-center-btn-border: clamp(2px, 0.8cqmin, 4px);
  
  /* Pointer */
  --stw-pointer-size: clamp(12px, 3.5cqmin, 18px);
  --stw-pointer-length: clamp(18px, 5cqmin, 28px);
  
  /* Typography - Fluid scaling */
  --stw-headline-size: clamp(1.25rem, 5cqi, 2.25rem);
  --stw-subheadline-size: clamp(0.875rem, 3cqi, 1.25rem);
  --stw-body-size: clamp(0.875rem, 2.5cqi, 1rem);
  --stw-button-size: clamp(0.9375rem, 3.5cqi, 1.125rem);
  
  /* Spacing - Container-relative */
  --stw-padding-x: clamp(1rem, 4cqi, 2rem);
  --stw-padding-y: clamp(1.25rem, 5cqi, 2.5rem);
  --stw-gap-sm: clamp(0.5rem, 1.5cqi, 0.75rem);
  --stw-gap-md: clamp(0.75rem, 2cqi, 1rem);
  --stw-gap-lg: clamp(1rem, 3cqi, 1.5rem);
  
  /* Border Radius - Proportional */
  --stw-radius-sm: clamp(6px, 1.5cqi, 10px);
  --stw-radius-md: clamp(10px, 2.5cqi, 16px);
  --stw-radius-lg: clamp(12px, 3cqi, 20px);
  
  /* Input Fields */
  --stw-input-height: clamp(44px, 10cqi, 56px);
  --stw-input-padding: clamp(12px, 3cqi, 16px);
`;

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

  // Wheel sizing is now primarily handled by CSS container queries (--stw-wheel-size)
  // The wheelSize state is only used for canvas pixel dimensions
  // CSS handles the visual scaling via the .spin-wheel-wrapper class

  // Button styles - use fixed sizing like other popup components for consistency
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
      showBranding={config.showBranding}
      ariaLabel={config.ariaLabel || config.headline}
      ariaDescribedBy={config.ariaDescribedBy}
      customCSS={config.customCSS}
      globalCustomCSS={config.globalCustomCSS}
    >
      {/* Inject container-relative CSS for truly responsive design */}
      <style>
        {`
          /* ============================================
           * CONTAINER-RELATIVE DESIGN SYSTEM
           * Uses cqi/cqmin for proportional scaling
           * ============================================ */
          ${RESPONSIVE_CSS_VARS}

          @keyframes slideUpFade {
            from { opacity: 0; transform: translateY(clamp(10px, 3cqi, 20px)); }
            to { opacity: 1; transform: translateY(0); }
          }

          @keyframes spin {
            from { transform: rotate(0deg); }
            to { transform: rotate(360deg); }
          }

          @keyframes pulseGlow {
            0%, 100% { box-shadow: 0 0 0 0 rgba(${accentColor}, 0.4); }
            50% { box-shadow: 0 0 clamp(15px, 4cqi, 25px) clamp(3px, 1cqi, 6px) rgba(${accentColor}, 0.2); }
          }

          /* Dynamic placeholder color */
          .spin-to-win-input::placeholder {
            color: ${inputTextColor ? `${inputTextColor}80` : "rgba(107, 114, 128, 0.5)"};
            opacity: 1;
          }

          /* ============================================
           * WHEEL CELL - Mobile First (Stacked Layout)
           * ============================================ */
          .spin-wheel-cell {
            position: relative;
            display: flex;
            justify-content: center;
            align-items: center;
            overflow: visible;
            padding: var(--stw-gap-md);
            z-index: 10;
            /* Mobile: Use container width for height calculation */
            min-height: clamp(220px, 60cqi, 320px);
            width: 100%;
          }

          /* ============================================
           * FORM CELL - Mobile First
           * ============================================ */
          .spin-form-cell {
            display: flex;
            flex-direction: column;
            justify-content: center;
            align-items: center;
            /* Container-relative padding */
            padding: var(--stw-padding-y) var(--stw-padding-x);
            z-index: 20;
            background-color: ${baseBackground};
            width: 100%;
          }

          .spin-form-content {
            width: 100%;
            max-width: clamp(280px, 85cqi, 400px);
            display: flex;
            flex-direction: column;
            gap: var(--stw-gap-md);
          }

          /* ============================================
           * WHEEL WRAPPER - Container-Relative Sizing
           * ============================================ */
          .spin-wheel-wrapper {
            position: relative;
            /* Container-relative sizing using cqmin for square aspect */
            width: var(--stw-wheel-size-mobile);
            height: var(--stw-wheel-size-mobile);
            z-index: 10;
            transition: width 0.3s ease, height 0.3s ease;
          }

          /* Wheel canvas container */
          .spin-wheel-canvas-container {
            position: relative;
            width: 100%;
            height: 100%;
            filter: drop-shadow(0 clamp(6px, 2cqi, 12px) clamp(15px, 5cqi, 30px) rgba(15,23,42,0.35));
            transition: filter 0.3s ease;
          }

          .spin-wheel-canvas-container.has-spun {
            filter: drop-shadow(0 clamp(10px, 3cqi, 18px) clamp(25px, 7cqi, 45px) rgba(15,23,42,0.55));
          }

          /* ============================================
           * POINTER - Container-Relative
           * ============================================ */
          .spin-pointer {
            position: absolute;
            top: 50%;
            right: calc(-1 * var(--stw-pointer-length) * 0.5);
            transform: translateY(-50%);
            width: 0;
            height: 0;
            border-top: var(--stw-pointer-size) solid transparent;
            border-bottom: var(--stw-pointer-size) solid transparent;
            border-right: var(--stw-pointer-length) solid #FFFFFF;
            filter: drop-shadow(clamp(-1px, -0.3cqi, -2px) 0 clamp(2px, 0.6cqi, 4px) rgba(0,0,0,0.25));
            z-index: 20;
          }

          /* ============================================
           * CENTER BUTTON - Container-Relative
           * ============================================ */
          .spin-center-button {
            position: absolute;
            top: 50%;
            left: 50%;
            transform: translate(-50%, -50%);
            width: var(--stw-center-btn-size);
            height: var(--stw-center-btn-size);
            border-radius: 50%;
            background-color: ${accentColor};
            border: var(--stw-center-btn-border) solid rgba(15,23,42,0.85);
            display: flex;
            align-items: center;
            justify-content: center;
            color: #F9FAFB;
            font-size: var(--stw-center-btn-font);
            font-weight: 600;
            letter-spacing: 0.12em;
            text-transform: uppercase;
            font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
            box-shadow: 0 clamp(2px, 0.5cqi, 4px) clamp(8px, 2cqi, 12px) rgba(15,23,42,0.4);
            pointer-events: none;
            z-index: 15;
          }

          /* ============================================
           * TYPOGRAPHY - Container-Relative
           * ============================================ */
          .spin-headline {
            font-size: var(--stw-headline-size);
            font-weight: 900;
            line-height: 1.1;
            margin-bottom: var(--stw-gap-sm);
            text-align: center;
          }

          .spin-subheadline {
            font-size: var(--stw-subheadline-size);
            font-weight: 500;
            line-height: 1.5;
            text-align: center;
          }


          /* ============================================
           * INPUTS - Container-Relative
           * ============================================ */
          .spin-input-wrapper {
            width: 100%;
          }

          .spin-input-wrapper input {
            height: var(--stw-input-height);
            padding: 0 var(--stw-input-padding);
            font-size: var(--stw-body-size);
            border-radius: var(--stw-radius-sm);
          }

          /* ============================================
           * SUCCESS STATE - Container-Relative
           * ============================================ */
          .spin-success-section {
            width: 100%;
            text-align: center;
            animation: slideUpFade 0.5s ease-out;
          }

          .spin-discount-wrapper {
            margin-top: var(--stw-gap-md);
          }

          /* ============================================
           * DESKTOP LAYOUT (Container Query @ 600px)
           * ============================================ */
          @container popup (min-width: 600px) {
            .spin-wheel-cell {
              justify-content: flex-end;
              align-items: center;
              min-height: auto;
              padding: var(--stw-gap-lg);
            }

            .spin-form-cell {
              padding: var(--stw-padding-y) var(--stw-padding-x);
              background-color: transparent;
            }

            .spin-form-content {
              max-width: clamp(300px, 42cqi, 380px);
            }

            .spin-wheel-wrapper {
              /* Desktop uses larger wheel size */
              width: var(--stw-wheel-size);
              height: var(--stw-wheel-size);
            }

            .spin-headline {
              font-size: clamp(1.5rem, 4.5cqi, 2.25rem);
            }

            .spin-subheadline {
              font-size: clamp(1rem, 2.8cqi, 1.25rem);
            }
          }

          /* ============================================
           * LARGE DESKTOP (Container Query @ 800px)
           * ============================================ */
          @container popup (min-width: 800px) {
            .spin-wheel-wrapper {
              /* Max out wheel size on large containers */
              width: clamp(320px, 55cqmin, 400px);
              height: clamp(320px, 55cqmin, 400px);
            }

            .spin-form-content {
              gap: var(--stw-gap-lg);
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
          <div className="spin-wheel-wrapper">
            {/* Rotating wheel canvas - uses CSS for sizing */}
            <div
              ref={wheelContainerRef}
              className={`spin-wheel-canvas-container ${hasSpun ? "has-spun" : ""}`}
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

            {/* Pointer - uses container-relative CSS */}
            <div className="spin-pointer" />

            {/* Center button - uses container-relative CSS */}
            <div className="spin-center-button">
              {isSpinning ? "..." : "SPIN"}
            </div>
          </div>
        </div>

        {/* Form Cell */}
        <div className="spin-form-cell">
          <div className="spin-form-content">
            {/* Header - uses container-relative typography */}
            <div style={{ textAlign: "center", marginBottom: "var(--stw-gap-lg)" }}>
              <h2
                className="spin-headline"
                style={{
                  color: config.textColor || "#111827",
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
                className="spin-subheadline"
                style={{ color: descriptionColor }}
              >
                {resultMessage || config.subheadline || "Try your luck to win exclusive discounts!"}
              </p>
            </div>

            {/* Form or Result */}
            {!hasSpun ? (
              <>
                {collectName && (
                  <div className="spin-input-wrapper">
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
                  <div className="spin-input-wrapper">
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
                    marginTop: "var(--stw-gap-md)",
                    opacity: isSpinning ? 0.5 : 1,
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
                    <span style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: "10px" }}>
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
                      marginTop: "var(--stw-gap-sm)",
                    }}
                    onMouseEnter={(e) => (e.currentTarget.style.opacity = "1")}
                    onMouseLeave={(e) => (e.currentTarget.style.opacity = "0.9")}
                  >
                    {isSpinning ? "Close" : (config.dismissLabel || "No thanks")}
                  </button>
                )}
              </>
            ) : (
              <div className="spin-success-section">
                {wonPrize?.generatedCode ? (
                  <div className="spin-discount-wrapper">
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
                  <div className="spin-discount-wrapper">
                    <p style={{ fontSize: "var(--stw-body-size)", color: descriptionColor }}>
                      {config.failureMessage || "Better luck next time!"}
                    </p>
                  </div>
                )}

                <button
                  onClick={onClose}
                  style={{
                    ...buttonStyles,
                    marginTop: "var(--stw-gap-lg)",
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
