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
import { PopupGridContainer } from "app/domains/storefront/popups-new/components/shared/PopupGridContainer";
import type { PopupDesignConfig, Prize } from "./types";
import type { SpinToWinContent } from "~/domains/campaigns/types/campaign";
import { prefersReducedMotion, debounce, getAdaptiveMutedColor } from "app/domains/storefront/popups-new/utils/utils";
import { POPUP_SPACING } from "app/domains/storefront/popups-new/utils/spacing";

// Import custom hooks
import { usePopupForm, useDiscountCode, usePopupAnimation } from "./hooks";

// Import canvas utilities

// Import reusable components
import { EmailInput, NameInput, GdprCheckbox } from "./components";

// Import shared components from Phase 1 & 2
import { DiscountCodeDisplay } from "./components/shared";
import { WheelRenderer } from "app/domains/storefront/popups-new/utils/wheel-canvas";

/**
 * Utility function to adjust color brightness
 * Used for creating 3D effects on buttons and elements
 */
function adjustBrightness(hex: string, percent: number): string {
  // Handle rgba/rgb colors
  if (hex.startsWith("rgb")) return hex;

  // Remove # if present
  const cleanHex = hex.replace("#", "");

  // Parse hex
  const num = parseInt(cleanHex, 16);
  const r = Math.min(255, Math.max(0, ((num >> 16) & 0xff) + Math.round((255 * percent) / 100)));
  const g = Math.min(255, Math.max(0, ((num >> 8) & 0xff) + Math.round((255 * percent) / 100)));
  const b = Math.min(255, Math.max(0, (num & 0xff) + Math.round((255 * percent) / 100)));

  return `#${((1 << 24) + (r << 16) + (g << 8) + b).toString(16).slice(1)}`;
}

/**
 * CSS Custom Properties for container-relative responsive design
 * These scale based on the popup container size (cqi = container query inline)
 */
const RESPONSIVE_CSS_VARS = `
  .popup-grid-container.SpinToWinPopup {
    /* ============================================
     * CONTAINER-RELATIVE DESIGN TOKENS
     * All values scale with popup container size
     * ============================================ */

    /* Wheel Sizing - Uses cqi with aspect-ratio for square proportions */
    /* Increased max sizes for more prominent wheel display */
    --stw-wheel-size: clamp(280px, 55cqi, 440px);
    --stw-wheel-size-mobile: clamp(220px, 70cqi, 340px);

    /* Center Button */
    --stw-center-btn-size: clamp(50px, 12cqi, 80px);
    --stw-center-btn-font: clamp(9px, 1.8cqi, 12px);
    --stw-center-btn-border: clamp(2px, 0.5cqi, 4px);

    /* Pointer */
    --stw-pointer-size: clamp(12px, 2.5cqi, 18px);
    --stw-pointer-length: clamp(18px, 3.5cqi, 28px);

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
    --stw-gap-xl: clamp(1.5rem, 4cqi, 2rem);

    /* Border Radius - Proportional */
    --stw-radius-sm: clamp(6px, 1.5cqi, 10px);
    --stw-radius-md: clamp(10px, 2.5cqi, 16px);
    --stw-radius-lg: clamp(12px, 3cqi, 20px);

    /* Input Fields */
    --stw-input-height: clamp(44px, 10cqi, 56px);
    --stw-input-padding: clamp(12px, 3cqi, 16px);
  }
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

  // Audio & Haptic feedback options (default: true)
  enableSound?: boolean;
  enableHaptic?: boolean;

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
    isSubmitting: _isSubmitting,
  } = usePopupForm({
    config: {
      emailRequired: config.emailRequired,
      emailErrorMessage: config.emailErrorMessage,
      nameFieldEnabled: config.nameFieldEnabled,
      nameFieldRequired: config.nameFieldRequired,
      consentFieldEnabled: config.consentFieldEnabled,
      consentFieldRequired: config.consentFieldRequired,
      campaignId: config.campaignId,
      previewMode: config.previewMode,
    },
  });

  // Use animation hook
  const { showContent: _showContent } = usePopupAnimation({ isVisible });

  // Use discount code hook
  const {
    discountCode: _discountCode,
    setDiscountCode,
    copiedCode,
    handleCopyCode,
  } = useDiscountCode();

  const [hasSpun, setHasSpun] = useState(false);
  const [isSpinning, setIsSpinning] = useState(false);
  const [isSlowingDown, setIsSlowingDown] = useState(false); // Track anticipation phase
  const [isGeneratingCode, setIsGeneratingCode] = useState(false);
  const [wonPrize, setWonPrize] = useState<Prize | null>(null);
  const [_codeError, setCodeError] = useState("");
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

  const [_emailFocused, _setEmailFocused] = useState(false);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const wheelContainerRef = useRef<HTMLDivElement | null>(null);
  const wheelCellRef = useRef<HTMLDivElement | null>(null);
  const _cardRef = useRef<HTMLDivElement | null>(null);

  const [_containerWidth, _setContainerWidth] = useState<number | null>(null);
  const [_cardWidth, _setCardWidth] = useState<number | null>(null);
  const [wheelSize, setWheelSize] = useState(config.wheelSize || 380);
  const _radius = wheelSize / 2;
  const segments = useMemo(() => config.wheelSegments || [], [config.wheelSegments]);
  const _segmentAngle = 360 / Math.max(1, segments.length);
  // Use CSS variable as fallback for accent color - defined in design-tokens.css
  const accentColor = config.accentColor || config.buttonColor || "var(--rb-primary, #007BFF)";
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

  // Enhanced wheel styling (for premium themes like Lucky Fortune)
  const wheelGlowEnabled = config.wheelGlowEnabled ?? false;
  const wheelGlowColor = config.wheelGlowColor || accentColor;
  const wheelCenterStyle = config.wheelCenterStyle || "simple";

  // Card background styling (supports gradient backgrounds from themes)
  const baseBackground = config.backgroundColor || "#FFFFFF";
  const _backgroundStyles: React.CSSProperties = baseBackground.startsWith("linear-gradient(")
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
  const inputPlaceholderColor = config.inputPlaceholderColor || `${inputTextColor}99`; // Default: inputTextColor with 60% opacity

  // Theme-aware colors for success/prize surfaces
  // eslint-disable-next-line @typescript-eslint/no-explicit-any -- config has dynamic fields
  const configRecord = config as any;
  const _successColor = (configRecord.successColor as string) || accentColor;
  // Use adaptive muted color based on background for proper contrast
  const descriptionColor = (configRecord.descriptionColor as string) || getAdaptiveMutedColor(baseBackground);

  // Optional extended behavior flags (storefront-only)
  const collectName = config.nameFieldEnabled ?? false;
  const showGdpr = config.consentFieldEnabled ?? false;

  const resultMessage =
    hasSpun && wonPrize
      ? wonPrize.generatedCode
        ? `You won ${wonPrize.label}!`
        : config.failureMessage || wonPrize.label || "Thanks for playing!"
      : null;

  // ============================================
  // TICK SOUND & HAPTIC FEEDBACK
  // ============================================
  const audioContextRef = useRef<AudioContext | null>(null);
  const lastTickSegmentRef = useRef<number>(-1);
  const enableSound = config.enableSound !== false; // Default to true
  const enableHaptic = config.enableHaptic !== false; // Default to true

  // Create tick sound using Web Audio API
  const playTickSound = useCallback(() => {
    if (!enableSound || prefersReducedMotion()) return;

    try {
      // Lazy-init AudioContext (requires user interaction)
      if (!audioContextRef.current) {
        audioContextRef.current = new (window.AudioContext ||
          (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext)();
      }

      const ctx = audioContextRef.current;
      if (ctx.state === "suspended") {
        ctx.resume();
      }

      // Create a short "tick" sound
      const oscillator = ctx.createOscillator();
      const gainNode = ctx.createGain();

      oscillator.connect(gainNode);
      gainNode.connect(ctx.destination);

      // High-pitched click sound
      oscillator.frequency.setValueAtTime(1800, ctx.currentTime);
      oscillator.frequency.exponentialRampToValueAtTime(800, ctx.currentTime + 0.02);

      // Quick attack and decay
      gainNode.gain.setValueAtTime(0.15, ctx.currentTime);
      gainNode.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.03);

      oscillator.start(ctx.currentTime);
      oscillator.stop(ctx.currentTime + 0.03);
    } catch {
      // Silently fail if audio isn't available
    }
  }, [enableSound]);

  // Trigger haptic feedback
  const triggerHaptic = useCallback(() => {
    if (!enableHaptic || prefersReducedMotion()) return;

    try {
      if (navigator.vibrate) {
        navigator.vibrate(10); // Short 10ms vibration
      }
    } catch {
      // Silently fail if haptic isn't available
    }
  }, [enableHaptic]);

  // Track segment changes during spin for tick effect
  useEffect(() => {
    if (!isSpinning || segments.length === 0) {
      lastTickSegmentRef.current = -1;
      return;
    }

    const segmentAngle = 360 / segments.length;
    // Normalize rotation to 0-360 range
    const normalizedRotation = ((rotation % 360) + 360) % 360;
    // Calculate which segment is at the pointer (right side / 0 degrees)
    const currentSegment = Math.floor(((360 - normalizedRotation + 90) % 360) / segmentAngle);

    if (lastTickSegmentRef.current !== currentSegment && lastTickSegmentRef.current !== -1) {
      playTickSound();
      triggerHaptic();
    }

    lastTickSegmentRef.current = currentSegment;
  }, [rotation, isSpinning, segments.length, playTickSound, triggerHaptic]);

  // Cleanup audio context
  useEffect(() => {
    return () => {
      if (audioContextRef.current) {
        audioContextRef.current.close();
      }
    };
  }, []);

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
      enableEnhancedStyle: true,
      // Enhanced styling options
      wheelGlowEnabled,
      wheelGlowColor,
      wheelCenterStyle,
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
    wheelGlowEnabled,
    wheelGlowColor,
    wheelCenterStyle,
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
    const _reduceMotion = prefersReducedMotion();

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
    const _easeInOutQuad = (t: number) => (t < 0.5 ? 2 * t * t : -1 + (4 - 2 * t) * t);

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

      // Detect slowing down phase (last 30% of animation) for anticipation wobble
      if (t > 0.7 && t < 1) {
        setIsSlowingDown(true);
      }

      if (t < 1) {
        spinAnimationFrameRef.current = requestAnimationFrame(animate);
      } else {
        spinAnimationFrameRef.current = null;
        setRotation(spinToRef.current);
        setHasSpun(true);
        setIsSpinning(false);
        setIsSlowingDown(false);
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
          // Use secure API helper (includes sessionId, visitorId, popupShownAt)
          const { securePost } = await import("./utils/popup-api");
          const data = await securePost<{
            success: boolean;
            prize?: { id: string; label: string; color?: string };
            discountCode?: string;
            autoApply?: boolean;
            error?: string;
          }>("/apps/revenue-boost/api/popups/spin-win", config.campaignId, {
            email: formState.email,
          });

          if (data.success && data.prize && data.discountCode) {
            serverPrize = {
              id: data.prize.id,
              label: data.prize.label,
              color: data.prize.color,
              probability: 0,
              generatedCode: data.discountCode,
            };
            generatedCode = data.discountCode;
            autoApply = data.autoApply ?? false;
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
        // Preview mode: pick a winning prize (not "Try Again")
        // Filter out non-winning segments first
        const winningSegments = segments.filter(
          (s) => s.label?.toLowerCase() !== "try again" && s.discountConfig?.enabled !== false
        );
        const segmentsToPickFrom = winningSegments.length > 0 ? winningSegments : segments;
        const randomIdx = Math.floor(Math.random() * segmentsToPickFrom.length);
        const selectedSegment = segmentsToPickFrom[randomIdx];

        // Generate a simple preview code based on the segment's label
        // e.g., "15% OFF" -> "PREVIEW-15OFF", "FREE SHIPPING" -> "PREVIEW-FREESHIP"
        const label = selectedSegment.label || "";
        if (label.toLowerCase().includes("shipping")) {
          generatedCode = "PREVIEW-FREESHIP";
        } else {
          const match = label.match(/(\d+)/);
          generatedCode = match ? `PREVIEW-${match[1]}OFF` : "PREVIEW-SAVE";
        }

        // Clone the segment and add the generated code so the UI displays it
        serverPrize = {
          ...selectedSegment,
          generatedCode,
        };
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
          // Use centralized storefront utility for auto-apply
          const { handleDiscountAutoApply } = await import(
            "../../../../extensions/storefront-src/utils/discount"
          );
          void handleDiscountAutoApply(generatedCode, true, "SpinToWin");
        }
      }
    } catch (error) {
      console.error("Spin error:", error);
      setIsSpinning(false);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps -- gdprConsent/name intentionally excluded to avoid re-renders
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
    fontFamily:
      config.fontFamily ||
      'system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
    textTransform: "uppercase",
    letterSpacing: "0.05em",
  };

  const secondaryButtonStyles: React.CSSProperties = {
    ...buttonStyles,
    padding: POPUP_SPACING.component.buttonSecondary,
    backgroundColor: "transparent",
    color: config.textColor || "var(--rb-muted, #4B5563)",
    boxShadow: "none",
    cursor: "pointer",
    textTransform: "none",
    letterSpacing: "normal",
  };

  // Full background mode detection (derive from leadCaptureLayout)
  const isFullBackground = config.leadCaptureLayout?.desktop === "overlay" && !!config.imageUrl;
  const bgOverlayOpacity = config.backgroundOverlayOpacity ?? 0.6;

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
      mobilePresentationMode="fullscreen"
      closeOnEscape={config.closeOnEscape !== false}
      closeOnBackdropClick={config.closeOnOverlayClick !== false}
      previewMode={config.previewMode}
      showBranding={config.showBranding}
      ariaLabel={config.ariaLabel || config.headline}
      ariaDescribedBy={config.ariaDescribedBy}
      customCSS={config.customCSS}
      globalCustomCSS={config.globalCustomCSS}
      designTokensCSS={config.designTokensCSS}
    >
      {/* Inject container-relative CSS for truly responsive design */}
      <style>
        {`
          /* ============================================
           * FULL BACKGROUND MODE STYLES
           * Background elements are absolutely positioned
           * and excluded from flex layout
           * ============================================ */
          .SpinToWinPopup .stw-full-bg-image,
          .SpinToWinPopup .stw-full-bg-overlay {
            position: absolute;
            inset: 0;
            border-radius: inherit;
            pointer-events: none;
            /* Exclude from flex layout calculations */
            flex: 0 0 0 !important;
            width: 0 !important;
            height: auto !important;
            min-width: 0 !important;
            min-height: 0 !important;
            overflow: visible !important;
          }

          .SpinToWinPopup .stw-full-bg-image {
            z-index: 0;
            width: 100% !important;
            height: 100% !important;
          }

          .SpinToWinPopup .stw-full-bg-image img {
            position: absolute;
            inset: 0;
            width: 100%;
            height: 100%;
            object-fit: cover;
          }

          .SpinToWinPopup .stw-full-bg-overlay {
            background: ${config.backgroundColor || "#ffffff"};
            opacity: ${bgOverlayOpacity};
            z-index: 1;
            width: 100% !important;
            height: 100% !important;
          }

          /* Content layers above background */
          .SpinToWinPopup.has-full-bg .spin-wheel-cell,
          .SpinToWinPopup.has-full-bg .spin-form-cell {
            position: relative;
            z-index: 2;
            background: transparent !important;
          }

          /* Override flex distribution when background is present */
          .SpinToWinPopup.has-full-bg .popup-grid-content > .spin-wheel-cell {
            flex: 1 1 45% !important;
          }
          .SpinToWinPopup.has-full-bg .popup-grid-content > .spin-form-cell {
            flex: 1 1 55% !important;
          }
          @container popup (min-width: 700px) {
            .SpinToWinPopup.has-full-bg .popup-grid-content > .spin-wheel-cell,
            .SpinToWinPopup.has-full-bg .popup-grid-content > .spin-form-cell {
              flex: 1 1 50% !important;
            }
          }

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

          /* ============================================
           * POINTER ANIMATIONS
           * ============================================ */
          @keyframes pointerBounce {
            0%, 100% { transform: translateY(-50%) translateX(0); }
            25% { transform: translateY(-50%) translateX(-4px); }
            50% { transform: translateY(-50%) translateX(0); }
            75% { transform: translateY(-50%) translateX(-2px); }
          }

          @keyframes pointerGlow {
            0%, 100% {
              filter: drop-shadow(-2px 0 6px rgba(255, 215, 0, 0.3))
                      drop-shadow(-1px 0 3px rgba(255, 215, 0, 0.5));
            }
            50% {
              filter: drop-shadow(-4px 0 12px rgba(255, 215, 0, 0.6))
                      drop-shadow(-2px 0 6px rgba(255, 215, 0, 0.8));
            }
          }

          @keyframes pointerWinBounce {
            0% { transform: translateY(-50%) translateX(0) scale(1); }
            15% { transform: translateY(-50%) translateX(-8px) scale(1.1); }
            30% { transform: translateY(-50%) translateX(4px) scale(0.95); }
            45% { transform: translateY(-50%) translateX(-4px) scale(1.05); }
            60% { transform: translateY(-50%) translateX(2px) scale(0.98); }
            75% { transform: translateY(-50%) translateX(-1px) scale(1.02); }
            100% { transform: translateY(-50%) translateX(0) scale(1); }
          }

          /* ============================================
           * CENTER BUTTON ANIMATIONS
           * ============================================ */
          @keyframes centerButtonPulse {
            0%, 100% {
              transform: translate(-50%, -50%) scale(1);
              box-shadow: 0 2px 8px rgba(15,23,42,0.4),
                          0 0 0 0 ${accentColor}40;
            }
            50% {
              transform: translate(-50%, -50%) scale(1.03);
              box-shadow: 0 4px 16px rgba(15,23,42,0.5),
                          0 0 20px 4px ${accentColor}30;
            }
          }

          @keyframes centerButtonGlow {
            0%, 100% {
              box-shadow: 0 2px 8px rgba(15,23,42,0.4),
                          inset 0 -2px 4px rgba(0,0,0,0.2),
                          inset 0 2px 4px rgba(255,255,255,0.1);
            }
            50% {
              box-shadow: 0 4px 20px rgba(15,23,42,0.5),
                          0 0 30px 8px ${accentColor}40,
                          inset 0 -2px 4px rgba(0,0,0,0.2),
                          inset 0 2px 4px rgba(255,255,255,0.1);
            }
          }

          /* ============================================
           * ANTICIPATION EFFECTS (non-rotational)
           * Uses scale and shadow pulse to avoid interfering with wheel spin
           * ============================================ */
          @keyframes anticipationPulse {
            0%, 100% {
              transform: scale(1);
              filter: drop-shadow(0 8px 20px rgba(15,23,42,0.35));
            }
            50% {
              transform: scale(1.02);
              filter: drop-shadow(0 12px 30px rgba(15,23,42,0.5));
            }
          }

          @keyframes pointerAnticipation {
            0%, 100% {
              transform: translateY(-50%) translateX(0);
            }
            30% {
              transform: translateY(-50%) translateX(-3px);
            }
            60% {
              transform: translateY(-50%) translateX(1px);
            }
          }

          /* ============================================
           * TICK SOUND VISUAL FEEDBACK
           * ============================================ */
          @keyframes tickPulse {
            0% { opacity: 1; transform: scale(1); }
            50% { opacity: 0.8; transform: scale(0.98); }
            100% { opacity: 1; transform: scale(1); }
          }

          /* Prize reveal celebration */
          @keyframes prizeCardReveal {
            0% {
              opacity: 0;
              transform: perspective(600px) rotateX(-20deg) translateY(30px) scale(0.9);
            }
            60% {
              transform: perspective(600px) rotateX(5deg) translateY(-5px) scale(1.02);
            }
            100% {
              opacity: 1;
              transform: perspective(600px) rotateX(0) translateY(0) scale(1);
            }
          }

          @keyframes celebrationBounce {
            0% { transform: scale(0.3); opacity: 0; }
            50% { transform: scale(1.1); }
            70% { transform: scale(0.95); }
            100% { transform: scale(1); opacity: 1; }
          }

          @keyframes confettiFloat {
            0% {
              opacity: 1;
              transform: translateY(0) rotate(0deg) scale(1);
            }
            100% {
              opacity: 0;
              transform: translateY(120px) rotate(720deg) scale(0.3);
            }
          }

          @keyframes shimmerSweep {
            0% { left: -100%; }
            100% { left: 100%; }
          }

          @keyframes glowPulse {
            0%, 100% {
              box-shadow: 0 0 10px ${accentColor}40, 0 0 20px ${accentColor}20;
            }
            50% {
              box-shadow: 0 0 20px ${accentColor}60, 0 0 40px ${accentColor}30, 0 0 60px ${accentColor}10;
            }
          }

          /* ============================================
           * ENHANCED PARTICLE EFFECTS
           * ============================================ */
          @keyframes sparkleFloat {
            0% {
              opacity: 1;
              transform: translateY(0) translateX(0) rotate(0deg) scale(1);
            }
            50% {
              opacity: 1;
              transform: translateY(-30px) translateX(var(--sparkle-x, 10px)) rotate(180deg) scale(1.2);
            }
            100% {
              opacity: 0;
              transform: translateY(-60px) translateX(var(--sparkle-x2, 20px)) rotate(360deg) scale(0);
            }
          }

          @keyframes rayBurst {
            0% {
              opacity: 0;
              transform: scaleY(0) rotate(var(--ray-angle, 0deg));
            }
            30% {
              opacity: 1;
              transform: scaleY(1) rotate(var(--ray-angle, 0deg));
            }
            100% {
              opacity: 0;
              transform: scaleY(1.5) rotate(var(--ray-angle, 0deg));
            }
          }

          @keyframes starPop {
            0% {
              opacity: 0;
              transform: scale(0) rotate(0deg);
            }
            50% {
              opacity: 1;
              transform: scale(1.3) rotate(180deg);
            }
            100% {
              opacity: 0;
              transform: scale(0.5) rotate(360deg);
            }
          }

          /* Sparkle particles */
          .spin-sparkle {
            position: absolute;
            width: 8px;
            height: 8px;
            pointer-events: none;
            z-index: 100;
          }

          .spin-sparkle::before,
          .spin-sparkle::after {
            content: '';
            position: absolute;
            background: #FFD700;
            border-radius: 2px;
          }

          .spin-sparkle::before {
            width: 100%;
            height: 30%;
            top: 35%;
            left: 0;
          }

          .spin-sparkle::after {
            width: 30%;
            height: 100%;
            top: 0;
            left: 35%;
          }

          .spin-sparkle:nth-child(1) { --sparkle-x: 15px; --sparkle-x2: 25px; left: 15%; top: 20%; animation: sparkleFloat 1.2s ease-out 0s forwards; }
          .spin-sparkle:nth-child(2) { --sparkle-x: -10px; --sparkle-x2: -20px; left: 25%; top: 15%; animation: sparkleFloat 1s ease-out 0.1s forwards; }
          .spin-sparkle:nth-child(3) { --sparkle-x: 20px; --sparkle-x2: 35px; left: 75%; top: 18%; animation: sparkleFloat 1.3s ease-out 0.15s forwards; }
          .spin-sparkle:nth-child(4) { --sparkle-x: -15px; --sparkle-x2: -30px; left: 85%; top: 22%; animation: sparkleFloat 1.1s ease-out 0.05s forwards; }

          /* Ray burst effect */
          .spin-rays {
            position: absolute;
            top: 50%;
            left: 50%;
            width: 200px;
            height: 200px;
            transform: translate(-50%, -50%);
            pointer-events: none;
            z-index: 99;
          }

          .spin-ray {
            position: absolute;
            top: 50%;
            left: 50%;
            width: 4px;
            height: 80px;
            background: linear-gradient(to top, transparent, ${accentColor}80, #FFD70080);
            transform-origin: bottom center;
            border-radius: 2px;
          }

          .spin-ray:nth-child(1) { --ray-angle: 0deg; animation: rayBurst 0.8s ease-out 0s forwards; }
          .spin-ray:nth-child(2) { --ray-angle: 45deg; animation: rayBurst 0.8s ease-out 0.05s forwards; }
          .spin-ray:nth-child(3) { --ray-angle: 90deg; animation: rayBurst 0.8s ease-out 0.1s forwards; }
          .spin-ray:nth-child(4) { --ray-angle: 135deg; animation: rayBurst 0.8s ease-out 0.15s forwards; }
          .spin-ray:nth-child(5) { --ray-angle: 180deg; animation: rayBurst 0.8s ease-out 0.2s forwards; }
          .spin-ray:nth-child(6) { --ray-angle: 225deg; animation: rayBurst 0.8s ease-out 0.25s forwards; }
          .spin-ray:nth-child(7) { --ray-angle: 270deg; animation: rayBurst 0.8s ease-out 0.3s forwards; }
          .spin-ray:nth-child(8) { --ray-angle: 315deg; animation: rayBurst 0.8s ease-out 0.35s forwards; }

          /* Star pop effect */
          .spin-star {
            position: absolute;
            font-size: 20px;
            pointer-events: none;
            z-index: 101;
          }

          .spin-star:nth-child(1) { left: 10%; top: 25%; animation: starPop 0.6s ease-out 0.2s forwards; }
          .spin-star:nth-child(2) { left: 90%; top: 30%; animation: starPop 0.7s ease-out 0.3s forwards; }
          .spin-star:nth-child(3) { left: 50%; top: 10%; animation: starPop 0.5s ease-out 0.4s forwards; }

          /* Success section animations */
          .spin-success-section {
            animation: celebrationBounce 0.6s ease-out forwards;
          }

          .spin-discount-wrapper {
            position: relative;
            overflow: hidden;
            animation: prizeCardReveal 0.7s ease-out 0.2s both;
          }

          .spin-discount-wrapper::before {
            content: '';
            position: absolute;
            top: 0;
            left: -100%;
            width: 200%;
            height: 100%;
            background: linear-gradient(
              90deg,
              transparent 0%,
              rgba(255,255,255,0.4) 50%,
              transparent 100%
            );
            animation: shimmerSweep 1s ease-in-out 0.5s forwards;
            pointer-events: none;
          }

          /* Prize label styling */
          .spin-prize-label {
            font-size: var(--stw-headline-size);
            font-weight: 700;
            color: ${descriptionColor};
            margin-bottom: var(--stw-gap-md);
            animation: slideUpFade 0.5s ease-out 0.1s both;
            max-width: 100%;
            word-wrap: break-word;
            line-height: 1.2;
          }

          /* Smaller font for medium-length labels (8-12 chars) */
          .spin-prize-label--medium {
            font-size: calc(var(--stw-headline-size) * 0.75);
          }

          /* Even smaller for long labels (13+ chars) */
          .spin-prize-label--long {
            font-size: calc(var(--stw-headline-size) * 0.6);
          }

          /* Confetti particles */
          .spin-confetti {
            position: absolute;
            width: 10px;
            height: 10px;
            pointer-events: none;
            z-index: 100;
          }

          .spin-confetti:nth-child(1) { background: #fbbf24; left: 10%; top: 10%; animation: confettiFloat 1.5s ease-out 0s forwards; }
          .spin-confetti:nth-child(2) { background: #ec4899; left: 20%; top: 5%; animation: confettiFloat 1.3s ease-out 0.1s forwards; border-radius: 50%; }
          .spin-confetti:nth-child(3) { background: #8b5cf6; left: 30%; top: 15%; animation: confettiFloat 1.6s ease-out 0.2s forwards; }
          .spin-confetti:nth-child(4) { background: #06b6d4; left: 70%; top: 10%; animation: confettiFloat 1.4s ease-out 0.15s forwards; border-radius: 50%; }
          .spin-confetti:nth-child(5) { background: var(--rb-success, #10b981); left: 80%; top: 5%; animation: confettiFloat 1.5s ease-out 0.05s forwards; }
          .spin-confetti:nth-child(6) { background: ${accentColor}; left: 90%; top: 15%; animation: confettiFloat 1.7s ease-out 0.25s forwards; border-radius: 50%; }

          /* Dynamic placeholder color - applies to all inputs in spin-input-wrapper */
          .spin-input-wrapper input::placeholder {
            color: ${inputPlaceholderColor};
            opacity: 1;
          }

          .spin-to-win-input::placeholder {
            color: ${inputPlaceholderColor};
            opacity: 1;
          }

          /* ============================================
           * MOBILE STACKED: Even space distribution
           * ============================================ */
          .SpinToWinPopup .popup-grid-content {
            /* Distribute space evenly: top - wheel - middle - form - bottom */
            justify-content: space-around;
            /* Ensure full height on mobile fullscreen */
            min-height: 100%;
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
            width: 100%;
            /* Let space-around handle vertical distribution */
            flex: 0 0 auto;
          }

          /* ============================================
           * FORM CELL - Mobile First
           * ============================================ */
          .spin-form-cell {
            display: flex;
            flex-direction: column;
            justify-content: flex-start;
            align-items: center;
            padding: var(--stw-gap-md) var(--stw-padding-x);
            z-index: 20;
            background-color: ${baseBackground};
            width: 100%;
            /* Let space-around handle vertical distribution */
            flex: 0 0 auto;
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
            /* Container-relative sizing with aspect-ratio for square */
            width: var(--stw-wheel-size-mobile);
            aspect-ratio: 1;
            z-index: 10;
            transition: width 0.3s ease;
          }

          /* Anticipation effects when slowing down - uses scale pulse instead of rotation */
          .spin-wheel-wrapper.is-slowing .spin-wheel-canvas-container {
            animation: anticipationPulse 0.25s ease-in-out infinite;
          }

          /* Pointer oscillation during slowdown */
          .spin-wheel-wrapper.is-slowing .spin-pointer {
            animation: pointerAnticipation 0.2s ease-in-out infinite;
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
           * 3D POINTER - Metallic Arrow with Animations
           * ============================================ */
          .spin-pointer {
            position: absolute;
            top: 50%;
            right: calc(-1 * var(--stw-pointer-length) * 0.3);
            transform: translateY(-50%);
            width: var(--stw-pointer-length);
            height: calc(var(--stw-pointer-size) * 2.2);
            z-index: 20;
            /* Reset border-based triangle */
            border: none;
            /* 3D Arrow shape using clip-path */
            clip-path: polygon(0% 50%, 100% 0%, 85% 50%, 100% 100%);
            /* Metallic gradient */
            background: linear-gradient(
              135deg,
              #f0f0f0 0%,
              #ffffff 15%,
              #d4d4d4 30%,
              #ffffff 45%,
              #e8e8e8 60%,
              #c0c0c0 80%,
              #a0a0a0 100%
            );
            /* Multiple shadows for 3D depth */
            filter:
              drop-shadow(-3px 0 6px rgba(0,0,0,0.4))
              drop-shadow(-1px 0 2px rgba(0,0,0,0.3));
            transition: filter 0.3s ease, transform 0.3s ease;
          }

          /* Pointer inner highlight for 3D effect */
          .spin-pointer::before {
            content: '';
            position: absolute;
            inset: 15% 20% 15% 10%;
            background: linear-gradient(
              180deg,
              rgba(255,255,255,0.9) 0%,
              rgba(255,255,255,0.3) 50%,
              rgba(0,0,0,0.1) 100%
            );
            clip-path: polygon(0% 50%, 100% 10%, 80% 50%, 100% 90%);
          }

          /* Golden accent edge */
          .spin-pointer::after {
            content: '';
            position: absolute;
            left: -2px;
            top: 50%;
            transform: translateY(-50%);
            width: 4px;
            height: 60%;
            background: linear-gradient(
              180deg,
              #ffd700 0%,
              #ffec8b 50%,
              #ffd700 100%
            );
            border-radius: 2px;
            box-shadow: 0 0 8px rgba(255, 215, 0, 0.6);
          }

          /* Spinning state - subtle glow animation */
          .spin-wheel-wrapper.is-spinning .spin-pointer {
            animation: pointerGlow 0.3s ease-in-out infinite;
          }

          /* Stopped/Won state - bounce animation */
          .spin-wheel-wrapper.has-won .spin-pointer {
            animation: pointerWinBounce 0.8s ease-out 1;
            filter:
              drop-shadow(-4px 0 12px rgba(255, 215, 0, 0.6))
              drop-shadow(-2px 0 6px rgba(255, 215, 0, 0.8))
              drop-shadow(-3px 0 6px rgba(0,0,0,0.4));
          }

          /* ============================================
           * CENTER BUTTON - Enhanced 3D with Pulse
           * ============================================ */
          .spin-center-button {
            position: absolute;
            top: 50%;
            left: 50%;
            transform: translate(-50%, -50%);
            width: var(--stw-center-btn-size);
            height: var(--stw-center-btn-size);
            border-radius: 50%;
            /* 3D gradient background */
            background:
              radial-gradient(circle at 30% 30%,
                rgba(255,255,255,0.4) 0%,
                transparent 50%),
              radial-gradient(circle at 70% 70%,
                rgba(0,0,0,0.2) 0%,
                transparent 50%),
              linear-gradient(
                145deg,
                ${adjustBrightness(accentColor, 20)} 0%,
                ${accentColor} 50%,
                ${adjustBrightness(accentColor, -15)} 100%
              );
            /* Metallic border */
            border: var(--stw-center-btn-border) solid;
            border-color:
              ${adjustBrightness(accentColor, -30)}
              ${adjustBrightness(accentColor, -40)}
              ${adjustBrightness(accentColor, -50)}
              ${adjustBrightness(accentColor, -35)};
            display: flex;
            align-items: center;
            justify-content: center;
            color: #F9FAFB;
            font-size: var(--stw-center-btn-font);
            font-weight: 700;
            letter-spacing: 0.15em;
            text-transform: uppercase;
            text-shadow: 0 1px 2px rgba(0,0,0,0.3);
            font-family: ${config.fontFamily || 'system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif'};
            /* 3D shadow layers */
            box-shadow:
              0 clamp(2px, 0.5cqi, 4px) clamp(8px, 2cqi, 12px) rgba(15,23,42,0.4),
              inset 0 -3px 6px rgba(0,0,0,0.2),
              inset 0 3px 6px rgba(255,255,255,0.15),
              0 0 0 2px rgba(255,255,255,0.1);
            pointer-events: none;
            z-index: 15;
            transition: all 0.3s ease;
          }

          /* Idle state - pulsing glow to attract attention */
          .spin-wheel-wrapper:not(.is-spinning):not(.has-won) .spin-center-button {
            animation: centerButtonPulse 2s ease-in-out infinite;
          }

          /* Spinning state - steady glow */
          .spin-wheel-wrapper.is-spinning .spin-center-button {
            animation: centerButtonGlow 1s ease-in-out infinite;
            transform: translate(-50%, -50%) scale(0.98);
          }

          /* Won state - celebratory glow */
          .spin-wheel-wrapper.has-won .spin-center-button {
            box-shadow:
              0 clamp(4px, 1cqi, 8px) clamp(16px, 4cqi, 24px) rgba(15,23,42,0.5),
              0 0 30px 10px ${accentColor}50,
              inset 0 -3px 6px rgba(0,0,0,0.2),
              inset 0 3px 6px rgba(255,255,255,0.2);
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
            /* Desktop: side-by-side layout, reset space-around */
            .SpinToWinPopup .popup-grid-content {
              justify-content: stretch;
              min-height: auto;
            }

            .spin-wheel-cell {
              justify-content: center;
              align-items: center;
              padding: var(--stw-gap-xl);
            }

            .spin-form-cell {
              padding: var(--stw-gap-lg) var(--stw-padding-x);
              background-color: transparent;
              justify-content: center;
            }

            .spin-form-content {
              max-width: clamp(300px, 42cqi, 380px);
            }

            .spin-wheel-wrapper {
              /* Desktop uses larger wheel size */
              width: var(--stw-wheel-size);
              aspect-ratio: 1;
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
              width: clamp(340px, 48cqi, 460px);
              aspect-ratio: 1;
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
        imagePosition="left"
        className={`SpinToWinPopup ${isFullBackground ? "has-full-bg" : ""}`}
        data-splitpop="true"
        data-template="spin-to-win"
      >
        {/* Full Background (when enabled) */}
        {isFullBackground && (
          <>
            <div className="stw-full-bg-image">
              <img src={config.imageUrl} alt="" aria-hidden="true" />
            </div>
            <div className="stw-full-bg-overlay" />
          </>
        )}
        {/* Wheel Cell */}
        <div className="spin-wheel-cell" ref={wheelCellRef}>
          <div
            className={`spin-wheel-wrapper ${isSpinning ? "is-spinning" : ""} ${isSlowingDown ? "is-slowing" : ""} ${hasSpun && wonPrize ? "has-won" : ""}`}
          >
            {/* Rotating wheel canvas - uses CSS for sizing */}
            <div
              ref={wheelContainerRef}
              className={`spin-wheel-canvas-container ${hasSpun ? "has-spun" : ""} ${isSpinning ? "is-spinning" : ""} ${isSlowingDown ? "is-slowing" : ""}`}
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

            {/* 3D Pointer with metallic gradient */}
            <div className="spin-pointer" />

            {/* Center button with pulsing animation */}
            <div className="spin-center-button">{isSpinning ? "..." : "SPIN"}</div>
          </div>
        </div>

        {/* Form Cell */}
        <div className="spin-form-cell">
          <div className="spin-form-content">
            {/* Header - uses container-relative typography */}
            <div style={{ textAlign: "center", marginBottom: "var(--stw-gap-lg)" }}>
              {/* Promotional Badge */}
              {config.badgeEnabled && config.badgeText && !wonPrize && (
                <div
                  className="spin-badge"
                  style={{
                    display: "inline-flex",
                    alignItems: "center",
                    gap: "0.5em",
                    marginBottom: "var(--stw-gap-md)",
                    padding: "0.5em 1em",
                    backgroundColor: `${accentColor}20`,
                    border: `1px solid ${accentColor}50`,
                    borderRadius: "9999px",
                    fontSize: "0.75rem",
                    fontWeight: 600,
                    color: accentColor,
                    textTransform: "uppercase",
                    letterSpacing: "0.05em",
                  }}
                >
                  {config.badgeIcon === "sparkles" && "✨"}
                  {config.badgeIcon === "star" && "⭐"}
                  {config.badgeIcon === "gift" && "🎁"}
                  {config.badgeIcon === "fire" && "🔥"}
                  {config.badgeIcon === "clock" && "⏰"}
                  {config.badgeText}
                </div>
              )}

              {/* Result Trophy Icon */}
              {wonPrize && config.showResultIcon && (
                <div
                  className="spin-result-icon"
                  style={{
                    display: "inline-flex",
                    alignItems: "center",
                    justifyContent: "center",
                    width: "4rem",
                    height: "4rem",
                    marginBottom: "var(--stw-gap-md)",
                    backgroundColor: `${accentColor}20`,
                    border: `2px solid ${accentColor}`,
                    borderRadius: "50%",
                    fontSize: "2rem",
                    animation: "pulse 2s ease-in-out infinite",
                  }}
                >
                  {config.resultIconType === "trophy" && "🏆"}
                  {config.resultIconType === "gift" && "🎁"}
                  {config.resultIconType === "star" && "⭐"}
                  {config.resultIconType === "confetti" && "🎉"}
                  {!config.resultIconType && "🏆"}
                </div>
              )}

              <h2
                className="spin-headline"
                style={{
                  color: config.textColor || "#111827",
                  textShadow: configRecord.titleTextShadow as string | undefined,
                }}
              >
                {wonPrize
                  ? wonPrize.label.includes("OFF")
                    ? "YOU WON!"
                    : "CONGRATS!"
                  : config.headline || "SPIN TO WIN!"}
              </h2>
              <p className="spin-subheadline" style={{ color: descriptionColor }}>
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
                      placeholder={(configRecord.nameFieldPlaceholder as string) || "Your Name"}
                      label={configRecord.nameFieldLabel as string | undefined}
                      error={errors.name}
                      required={config.nameFieldRequired}
                      disabled={isSpinning || isGeneratingCode}
                      accentColor={accentColor}
                      textColor={inputTextColor}
                      backgroundColor={inputBackground}
                      borderColor={inputBorderColor}
                      placeholderColor={inputPlaceholderColor}
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
                      borderColor={inputBorderColor}
                      placeholderColor={inputPlaceholderColor}
                    />
                  </div>
                )}

                {showGdpr && (
                  <GdprCheckbox
                    checked={formState.gdprConsent}
                    onChange={setGdprConsent}
                    text={config.consentFieldText}
                    error={errors.gdpr}
                    required={config.consentFieldRequired}
                    disabled={isSpinning || isGeneratingCode}
                    accentColor={accentColor}
                    textColor={descriptionColor}
                    privacyPolicyUrl={config.privacyPolicyUrl}
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
                      marginTop: "var(--stw-gap-sm)",
                    }}
                    onMouseEnter={(e) => (e.currentTarget.style.opacity = "1")}
                    onMouseLeave={(e) => (e.currentTarget.style.opacity = "0.9")}
                  >
                    {isSpinning ? "Close" : config.dismissLabel || "No thanks"}
                  </button>
                )}
              </>
            ) : (
              <div className="spin-success-section">
                {/* Enhanced celebration effects */}
                {wonPrize?.generatedCode && (
                  <>
                    {/* Ray burst from center */}
                    <div className="spin-rays">
                      <div className="spin-ray" />
                      <div className="spin-ray" />
                      <div className="spin-ray" />
                      <div className="spin-ray" />
                      <div className="spin-ray" />
                      <div className="spin-ray" />
                      <div className="spin-ray" />
                      <div className="spin-ray" />
                    </div>

                    {/* Sparkle particles */}
                    <div className="spin-sparkle" />
                    <div className="spin-sparkle" />
                    <div className="spin-sparkle" />
                    <div className="spin-sparkle" />

                    {/* Star pop effects */}
                    <div className="spin-star">⭐</div>
                    <div className="spin-star">✨</div>
                    <div className="spin-star">🌟</div>

                    {/* Original confetti */}
                    <div className="spin-confetti" />
                    <div className="spin-confetti" />
                    <div className="spin-confetti" />
                    <div className="spin-confetti" />
                    <div className="spin-confetti" />
                    <div className="spin-confetti" />
                  </>
                )}

                {/* Prize announcement */}
                {wonPrize?.generatedCode && (
                  <div
                    className={`spin-prize-label${
                      (wonPrize.label?.length ?? 0) > 12
                        ? " spin-prize-label--long"
                        : (wonPrize.label?.length ?? 0) > 7
                          ? " spin-prize-label--medium"
                          : ""
                    }`}
                  >
                    {wonPrize.label || "You Won!"}
                  </div>
                )}

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
                    marginTop: "24px",
                    animation: "slideUpFade 0.5s ease-out 0.5s both",
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
