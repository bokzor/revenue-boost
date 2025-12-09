/**
 * ScratchCardPopup Component
 *
 * Interactive scratch card popup featuring:
 * - HTML5 Canvas-based scratch interaction
 * - Touch and mouse support
 * - Scratch percentage tracking
 * - Email capture (before or after scratching)
 * - Prize reveal with confetti effect
 * - Configurable scratch threshold and brush radius
 * - Copy discount code functionality
 * - Enhanced metallic foil overlay with holographic shimmer
 * - Scratch particles and sound effects
 * - Premium reveal animations
 */

import { useState, useCallback, useRef, useEffect } from "react";
import { PopupPortal } from "./PopupPortal";
import type { MobilePresentationMode } from "./PopupPortal";
import type { PopupDesignConfig, Prize, LayoutConfig } from "./types";
import type { ScratchCardContent } from "~/domains/campaigns/types/campaign";
import {
  prefersReducedMotion,
  getAdaptiveMutedColor,
} from "app/domains/storefront/popups-new/utils/utils";
import { POPUP_SPACING } from "app/domains/storefront/popups-new/utils/spacing";
import { ScratchCardRenderer } from "./utils/scratch-canvas";
import { LeadCaptureLayout } from "app/domains/storefront/popups-new/components/shared/LeadCaptureLayout";

// Import custom hooks
import { usePopupForm, useDiscountCode, usePopupAnimation, useDesignVariables } from "./hooks";

// Import shared components from Phase 1 & 2
import { DiscountCodeDisplay, LeadCaptureForm } from "./components/shared";

/**
 * Scratch particle system for visual feedback while scratching
 */
interface ScratchParticle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  size: number;
  opacity: number;
  color: string;
  life: number;
}

/**
 * ScratchCardConfig - Extends both design config AND campaign content type
 * All content fields come from ScratchCardContent
 * All design fields come from PopupDesignConfig
 */
export interface ScratchCardConfig extends PopupDesignConfig, ScratchCardContent {
  // Storefront-specific fields only
  scratchCardWidth?: number;
  scratchCardHeight?: number;
  scratchCardBackgroundColor?: string;
  scratchCardTextColor?: string;
  scratchOverlayColor?: string;
  scratchOverlayImage?: string;
  loadingText?: string;

  // Typography (optional, can be set from design theme)
  titleFontSize?: string;
  titleFontWeight?: string;
  titleTextShadow?: string;
  descriptionFontSize?: string;
  descriptionFontWeight?: string;

  // Enhanced scratch card features
  enableSound?: boolean;
  enableHaptic?: boolean;
  enableParticles?: boolean;
  enableMetallicOverlay?: boolean;

  // Note: showGdprCheckbox and gdprLabel come from ScratchCardContent
  // Note: prizes, emailRequired, emailPlaceholder, scratchThreshold, etc.
  // all come from ScratchCardContent
}

export interface ScratchCardPopupProps {
  config: ScratchCardConfig;
  isVisible: boolean;
  onClose: () => void;
  onSubmit?: (data: { email: string; name?: string; gdprConsent?: boolean }) => Promise<void>;
  onReveal?: (prize: Prize) => void;
}

// =============================================================================
// DEFAULT LAYOUT CONFIG
// =============================================================================

const DEFAULT_LAYOUT: LayoutConfig = {
  desktop: "split-left",
  mobile: "stacked", // Default to stacked on mobile (image + scratch card visible)
  visualSizeDesktop: "50%",
  visualSizeMobile: "30%",
  contentOverlap: "0",
  visualGradient: false,
};

export const ScratchCardPopup: React.FC<ScratchCardPopupProps> = ({
  config,
  isVisible,
  onClose,
  onSubmit,
  onReveal,
}) => {
  // Use custom hooks for form management
  const {
    formState,
    setEmail,
    setName,
    setGdprConsent,
    errors,
    handleSubmit: _handleFormSubmit,
    validateForm,
    isSubmitting,
    isSubmitted: _isSubmitted,
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
    onSubmit: onSubmit
      ? async (data) => {
          await onSubmit(data);
          return undefined;
        }
      : undefined,
  });

  // Use discount code hook
  const {
    discountCode: _discountCode,
    setDiscountCode,
    copiedCode,
    handleCopyCode,
  } = useDiscountCode();

  // Use animation hook
  const { showContent: _showContent } = usePopupAnimation({ isVisible });

  // Convert design config to CSS variables
  const designVars = useDesignVariables(config);

  // Component-specific state
  const [emailSubmitted, setEmailSubmitted] = useState(false);
  const [isSubmittingEmail, setIsSubmittingEmail] = useState(false); // For "email after scratching" flow
  const [isScratching, setIsScratching] = useState(false);
  const [scratchPercentage, setScratchPercentage] = useState(0);
  const [isRevealed, setIsRevealed] = useState(false);
  const [wonPrize, setWonPrize] = useState<Prize | null>(null);
  const [particles, setParticles] = useState<ScratchParticle[]>([]);
  const [isNearThreshold, setIsNearThreshold] = useState(false);

  const canvasRef = useRef<HTMLCanvasElement>(null);
  const prizeCanvasRef = useRef<HTMLCanvasElement>(null);
  const _particleCanvasRef = useRef<HTMLCanvasElement>(null);
  const rendererRef = useRef<ScratchCardRenderer | null>(null);
  const isDrawingRef = useRef(false);
  const audioContextRef = useRef<AudioContext | null>(null);
  const lastScratchTimeRef = useRef(0);
  const animationFrameRef = useRef<number | null>(null);

  // State for loaded overlay image
  const [overlayImage, setOverlayImage] = useState<HTMLImageElement | null>(null);
  const overlayImageLoadedRef = useRef(false);

  // State for delayed email overlay appearance (wait for reveal animation)
  const [showEmailOverlay, setShowEmailOverlay] = useState(false);

  const DEFAULT_CARD_WIDTH = 384;
  const DEFAULT_CARD_HEIGHT = 216;

  const cardWidth = config.scratchCardWidth || DEFAULT_CARD_WIDTH;
  const cardHeight = config.scratchCardHeight || DEFAULT_CARD_HEIGHT;
  const threshold = config.scratchThreshold || 50;
  const brushRadius = config.scratchRadius || 20;

  // Feature flags
  const enableSound = config.enableSound !== false;
  const enableHaptic = config.enableHaptic !== false;
  const enableParticles = config.enableParticles !== false;

  // ============================================
  // LOAD OVERLAY IMAGE (if provided)
  // ============================================
  useEffect(() => {
    console.log("[ScratchCardPopup] scratchOverlayImage:", config.scratchOverlayImage);
    if (!config.scratchOverlayImage || overlayImageLoadedRef.current) return;

    const img = new Image();
    img.crossOrigin = "anonymous"; // Allow CORS for canvas manipulation

    img.onload = () => {
      console.log(
        "[ScratchCardPopup] Overlay image loaded successfully:",
        config.scratchOverlayImage
      );
      setOverlayImage(img);
      overlayImageLoadedRef.current = true;
    };

    img.onerror = () => {
      console.warn(
        "[ScratchCardPopup] Failed to load scratch overlay image:",
        config.scratchOverlayImage
      );
      overlayImageLoadedRef.current = true; // Mark as loaded (failed) to prevent retries
    };

    img.src = config.scratchOverlayImage;

    return () => {
      img.onload = null;
      img.onerror = null;
    };
  }, [config.scratchOverlayImage]);

  // ============================================
  // DELAYED EMAIL OVERLAY (wait for reveal animation)
  // ============================================
  useEffect(() => {
    // Only show overlay for email-after-scratch flow when revealed
    if (isRevealed && config.emailRequired && !config.emailBeforeScratching && !emailSubmitted) {
      // Wait 1.5 seconds for the reveal celebration to complete
      const timer = setTimeout(() => {
        setShowEmailOverlay(true);
      }, 1500);

      return () => clearTimeout(timer);
    } else {
      setShowEmailOverlay(false);
    }
  }, [isRevealed, config.emailRequired, config.emailBeforeScratching, emailSubmitted]);

  // ============================================
  // SCRATCH SOUND & HAPTIC FEEDBACK
  // ============================================
  const playScratchSound = useCallback(() => {
    if (!enableSound || prefersReducedMotion()) return;

    const now = performance.now();
    // Throttle sound to avoid overwhelming audio
    if (now - lastScratchTimeRef.current < 50) return;
    lastScratchTimeRef.current = now;

    try {
      if (!audioContextRef.current) {
        audioContextRef.current = new (window.AudioContext ||
          (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext)();
      }

      const ctx = audioContextRef.current;
      if (ctx.state === "suspended") {
        ctx.resume();
      }

      // Create scratch sound (noise burst)
      const bufferSize = 2048;
      const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
      const data = buffer.getChannelData(0);

      for (let i = 0; i < bufferSize; i++) {
        data[i] = (Math.random() * 2 - 1) * 0.15;
      }

      const source = ctx.createBufferSource();
      source.buffer = buffer;

      // Filter to make it sound more like scratching
      const filter = ctx.createBiquadFilter();
      filter.type = "highpass";
      filter.frequency.value = 2000;

      const gainNode = ctx.createGain();
      gainNode.gain.setValueAtTime(0.1, ctx.currentTime);
      gainNode.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.05);

      source.connect(filter);
      filter.connect(gainNode);
      gainNode.connect(ctx.destination);

      source.start(ctx.currentTime);
      source.stop(ctx.currentTime + 0.05);
    } catch {
      // Silently fail if audio isn't available
    }
  }, [enableSound]);

  const triggerHaptic = useCallback(() => {
    if (!enableHaptic || prefersReducedMotion()) return;

    try {
      if (navigator.vibrate) {
        navigator.vibrate(5);
      }
    } catch {
      // Silently fail
    }
  }, [enableHaptic]);

  // ============================================
  // PARTICLE SYSTEM
  // ============================================
  const createParticles = useCallback(
    (x: number, y: number) => {
      if (!enableParticles || prefersReducedMotion()) return;

      const overlayColor = config.scratchOverlayColor || "#C0C0C0";
      const newParticles: ScratchParticle[] = [];
      const particleCount = 3 + Math.floor(Math.random() * 3);

      for (let i = 0; i < particleCount; i++) {
        const angle = Math.random() * Math.PI * 2;
        const speed = 1 + Math.random() * 3;
        newParticles.push({
          x,
          y,
          vx: Math.cos(angle) * speed,
          vy: Math.sin(angle) * speed - 2, // Bias upward
          size: 2 + Math.random() * 4,
          opacity: 0.8 + Math.random() * 0.2,
          color: overlayColor,
          life: 1,
        });
      }

      setParticles((prev) => [...prev.slice(-30), ...newParticles]); // Keep max 30 particles
    },
    [enableParticles, config.scratchOverlayColor]
  );

  // Animate particles
  const hasParticles = particles.length > 0;
  useEffect(() => {
    if (!hasParticles) return;

    const animate = () => {
      setParticles((prev) =>
        prev
          .map((p) => ({
            ...p,
            x: p.x + p.vx,
            y: p.y + p.vy,
            vy: p.vy + 0.15, // Gravity
            life: p.life - 0.03,
            opacity: p.opacity * 0.95,
          }))
          .filter((p) => p.life > 0 && p.opacity > 0.1)
      );

      animationFrameRef.current = requestAnimationFrame(animate);
    };

    animationFrameRef.current = requestAnimationFrame(animate);

    return () => {
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
    };
  }, [hasParticles]);

  // Cleanup audio context
  useEffect(() => {
    return () => {
      if (audioContextRef.current) {
        audioContextRef.current.close();
      }
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
    };
  }, []);

  // Track proximity to threshold for glow effect
  useEffect(() => {
    const nearThreshold = scratchPercentage >= threshold * 0.7 && scratchPercentage < threshold;
    setIsNearThreshold(nearThreshold);
  }, [scratchPercentage, threshold]);

  // Fetch prize from server
  // Note: email is passed as a parameter to avoid triggering re-fetches on every keystroke
  const fetchPrize = useCallback(
    async (emailToUse?: string) => {
      if (config.previewMode) {
        // Preview mode: select a winning prize locally and generate mock discount code
        console.log("[Scratch Card] Preview mode - selecting random prize locally");
        const prizes = config.prizes || [];
        if (prizes.length > 0) {
          // Filter out non-winning prizes (e.g., "Try Again")
          const winningPrizes = prizes.filter(
            (p) => p.label?.toLowerCase() !== "try again" && p.discountConfig?.enabled !== false
          );
          const prizesToPickFrom = winningPrizes.length > 0 ? winningPrizes : prizes;
          const randomPrize = prizesToPickFrom[Math.floor(Math.random() * prizesToPickFrom.length)];

          // Generate a simple preview code based on the prize's label
          // e.g., "15% OFF" -> "PREVIEW-15OFF", "FREE SHIPPING" -> "PREVIEW-FREESHIP"
          const label = randomPrize.label || "";
          let previewCode: string;
          if (label.toLowerCase().includes("shipping")) {
            previewCode = "PREVIEW-FREESHIP";
          } else {
            const match = label.match(/(\d+)/);
            previewCode = match ? `PREVIEW-${match[1]}OFF` : "PREVIEW-SAVE";
          }

          // Add mock discount code for preview
          setWonPrize({
            ...randomPrize,
            generatedCode: previewCode,
            discountCode: previewCode,
          });
        }
        return;
      }

      const emailValue = emailToUse || formState.email;
      if (!config.campaignId) {
        console.error("[Scratch Card] No campaign ID available");
        return;
      }

      try {
        // Use secure API helper (includes sessionId, visitorId, popupShownAt)
        const { securePost } = await import("./utils/popup-api");

        console.log("[Scratch Card] Fetching prize from server", {
          campaignId: config.campaignId,
          hasEmail: !!emailValue,
        });

        const data = await securePost<{
          success: boolean;
          prize?: { id: string; label: string };
          discountCode?: string;
          autoApply?: boolean;
          error?: string;
        }>("/apps/revenue-boost/api/popups/scratch-card", config.campaignId, {
          ...(emailValue ? { email: emailValue } : {}),
        });

        if (data.success && data.prize && data.discountCode) {
          const serverPrize: Prize = {
            id: data.prize.id,
            label: data.prize.label,
            probability: 0,
            generatedCode: data.discountCode,
            discountCode: data.discountCode,
          };
          setWonPrize(serverPrize);

          // Auto-apply discount if configured
          if (data.autoApply && data.discountCode) {
            const { handleDiscountAutoApply } = await import(
              "../../../../extensions/storefront-src/utils/discount"
            );
            void handleDiscountAutoApply(data.discountCode, true, "ScratchCard");
          }
        } else {
          console.error("[Scratch Card] Failed to fetch prize:", data);
        }
      } catch (error) {
        console.error("[Scratch Card] Network error fetching prize:", error);
      }
      // Note: formState.email is NOT in dependencies to prevent re-fetching on every keystroke
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps -- formState.email intentionally excluded
    [config.campaignId, config.previewMode, config.prizes]
  );

  // Initialize canvases (prize + scratch overlay) using ScratchCardRenderer
  useEffect(() => {
    if (!canvasRef.current || !prizeCanvasRef.current) return;
    if (config.emailRequired && config.emailBeforeScratching && !emailSubmitted) return;

    // Create or update renderer
    if (!rendererRef.current) {
      rendererRef.current = new ScratchCardRenderer(
        canvasRef.current,
        prizeCanvasRef.current,
        cardWidth,
        cardHeight
      );
    } else {
      rendererRef.current.setDimensions(cardWidth, cardHeight);
    }

    const renderer = rendererRef.current;

    // Render options for both layers
    const renderOptions = {
      width: cardWidth,
      height: cardHeight,
      backgroundColor: config.scratchCardBackgroundColor,
      textColor: config.scratchCardTextColor || config.buttonTextColor || config.textColor,
      accentColor: config.accentColor || config.buttonColor || "#4f46e5",
      buttonColor: config.buttonColor,
      overlayColor: config.scratchOverlayColor || "#C0C0C0",
      instruction: config.scratchInstruction || "Scratch to reveal!",
      enableMetallic: config.enableMetallicOverlay !== false,
    };

    // Render prize layer (bottom)
    renderer.renderPrizeLayer(wonPrize, renderOptions);

    // Render overlay layer (top - to be scratched)
    renderer.renderOverlayLayer(renderOptions, overlayImage);
  }, [emailSubmitted, config, cardWidth, cardHeight, wonPrize, overlayImage]);

  // Calculate scratch percentage using renderer
  const calculateScratchPercentage = useCallback(() => {
    if (!rendererRef.current) return 0;
    return rendererRef.current.calculateScratchPercentage();
  }, []);

  // Scratch function with enhanced effects using renderer
  const scratch = useCallback(
    (x: number, y: number) => {
      if (!rendererRef.current) return;

      // Use renderer to scratch
      rendererRef.current.scratch(x, y, { radius: brushRadius });

      // Trigger feedback effects
      playScratchSound();
      triggerHaptic();
      createParticles(x, y);

      // Check scratch percentage
      const percentage = calculateScratchPercentage();
      setScratchPercentage(percentage);

      if (percentage >= threshold && !isRevealed) {
        setIsRevealed(true);
        // Strong haptic on reveal
        if (enableHaptic && navigator.vibrate) {
          navigator.vibrate([50, 30, 100]);
        }
        if (wonPrize && onReveal) {
          onReveal(wonPrize);
        }
      }
    },
    [
      brushRadius,
      calculateScratchPercentage,
      threshold,
      isRevealed,
      wonPrize,
      onReveal,
      playScratchSound,
      triggerHaptic,
      createParticles,
      enableHaptic,
    ]
  );

  // Mouse/touch event handlers
  const getCoordinates = (
    e: React.MouseEvent | React.TouchEvent
  ): { x: number; y: number } | null => {
    if (!canvasRef.current) return null;

    const canvas = canvasRef.current;
    const rect = canvas.getBoundingClientRect();

    // Account for CSS scaling (canvas width/height vs. displayed size)
    const scaleX = canvas.width / rect.width || 1;
    const scaleY = canvas.height / rect.height || 1;

    let clientX: number, clientY: number;

    if ("touches" in e) {
      if (e.touches.length === 0) return null;
      clientX = e.touches[0].clientX;
      clientY = e.touches[0].clientY;
    } else {
      clientX = e.clientX;
      clientY = e.clientY;
    }

    return {
      x: (clientX - rect.left) * scaleX,
      y: (clientY - rect.top) * scaleY,
    };
  };

  const handleStart = (e: React.MouseEvent | React.TouchEvent) => {
    e.preventDefault();
    isDrawingRef.current = true;
    setIsScratching(true);

    const coords = getCoordinates(e);
    if (coords) {
      scratch(coords.x, coords.y);
    }
  };

  const handleMove = (e: React.MouseEvent | React.TouchEvent) => {
    if (!isDrawingRef.current) return;
    e.preventDefault();

    const coords = getCoordinates(e);
    if (coords) {
      scratch(coords.x, coords.y);
    }
  };

  const handleEnd = () => {
    isDrawingRef.current = false;
    setIsScratching(false);
  };

  // Typed event wrappers for canvas to satisfy React's specific handler types
  const handleMouseStart = (e: React.MouseEvent<HTMLCanvasElement>) =>
    handleStart(e as unknown as React.MouseEvent<Element>);
  const handleMouseMove = (e: React.MouseEvent<HTMLCanvasElement>) =>
    handleMove(e as unknown as React.MouseEvent<Element>);
  const handleMouseEnd = (_e: React.MouseEvent<HTMLCanvasElement>) => handleEnd();
  const handleTouchStart = (e: React.TouchEvent<HTMLCanvasElement>) =>
    handleStart(e as unknown as React.TouchEvent<Element>);
  const handleTouchMove = (e: React.TouchEvent<HTMLCanvasElement>) =>
    handleMove(e as unknown as React.TouchEvent<Element>);
  const handleTouchEnd = (_e: React.TouchEvent<HTMLCanvasElement>) => handleEnd();

  const handleEmailSubmit = useCallback(
    async (e?: React.FormEvent) => {
      if (e) e.preventDefault();

      // Scenario 1: Email required BEFORE scratching
      // For scratch cards, we skip the normal lead submission and pass email directly to prize fetch
      // This ensures the challenge token is only consumed once (by the scratch-card API)
      if (config.emailBeforeScratching) {
        // Validate form first
        if (!validateForm()) {
          return;
        }
        setEmailSubmitted(true);
        // Fetch prize WITH email - this generates the code AND creates the lead
        fetchPrize(formState.email);
        return;
      }

      // Scenario 2 & 3: Email collected AFTER scratching
      // Prize and code already generated, just save the email
      if (!wonPrize?.discountCode) {
        console.error("[Scratch Card] Cannot save email: no discount code available");
        return;
      }

      // Preview mode: skip API call and just mark as submitted
      if (config.previewMode) {
        console.log("[Scratch Card] Preview mode - skipping email save API call");
        setEmailSubmitted(true);
        return;
      }

      // Call new save-email endpoint with existing discount code
      // NOTE: No challenge token needed - security is verified by checking the discount code
      // was already generated for this campaign/session

      // Set loading state manually for this scenario
      setIsSubmittingEmail(true);

      try {
        if (!config.campaignId) {
          console.error("[Scratch Card] Missing campaignId");
          return;
        }

        // Use secure API helper for consistency
        const { securePost } = await import("./utils/popup-api");
        const data = await securePost<{
          success: boolean;
          discountCode?: string;
          error?: string;
        }>("/apps/revenue-boost/api/leads/save-email", config.campaignId, {
          email: formState.email,
          discountCode: wonPrize.discountCode,
          consent: formState.gdprConsent,
        });

        if (data.success) {
          console.log("[Scratch Card] Email saved successfully");
          setEmailSubmitted(true);
          if (data.discountCode) {
            setDiscountCode(data.discountCode);
          }
        } else {
          console.error("[Scratch Card] Failed to save email:", data.error);
        }
      } catch (error) {
        console.error("[Scratch Card] Error saving email:", error);
      } finally {
        setIsSubmittingEmail(false);
      }
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps -- handleFormSubmit is intentionally excluded to avoid loops
    [validateForm, config, formState, wonPrize, fetchPrize, setDiscountCode]
  );

  // Fetch prize on mount if email is not required before scratching
  useEffect(() => {
    if (isVisible && !wonPrize && (!config.emailRequired || !config.emailBeforeScratching)) {
      console.log("[Scratch Card] Auto-fetching prize on mount:", {
        isVisible,
        hasWonPrize: !!wonPrize,
        emailRequired: config.emailRequired,
        emailBeforeScratching: config.emailBeforeScratching,
      });
      fetchPrize();
    }
    // fetchPrize is intentionally not in dependencies to prevent re-fetching
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isVisible, wonPrize, config.emailRequired, config.emailBeforeScratching]);

  // Copy code handler now from useDiscountCode hook
  // Update discount code when prize is won
  useEffect(() => {
    if (wonPrize?.discountCode) {
      setDiscountCode(wonPrize.discountCode);
    }
  }, [wonPrize, setDiscountCode]);

  const showEmailForm = config.emailRequired && config.emailBeforeScratching && !emailSubmitted;
  const showScratchCard = !showEmailForm;

  // Get layout config from design config (or use default)
  const layout = config.leadCaptureLayout || DEFAULT_LAYOUT;

  // Background image configuration - only the decorative image goes in visualSlot
  // The scratch card canvas always stays in formSlot (never hidden)
  const imageUrl = config.imageUrl;
  const hasVisual = !!imageUrl && layout.desktop !== "content-only";

  // Auto-close timer (migrated from BasePopup)
  useEffect(() => {
    if (!isVisible || !config.autoCloseDelay || config.autoCloseDelay <= 0) return;

    const timer = setTimeout(onClose, config.autoCloseDelay * 1000);
    return () => clearTimeout(timer);
  }, [isVisible, config.autoCloseDelay, onClose]);

  // Infer mobile presentation mode from layout:
  // - "fullscreen" layout → "fullscreen" presentation (fills viewport)
  // - Other layouts → "bottom-sheet" presentation (slides from bottom)
  const mobilePresentationMode: MobilePresentationMode =
    layout.mobile === "fullscreen" ? "fullscreen" : "bottom-sheet";

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
      }}
      position={config.position || "center"}
      size={config.size || "medium"}
      mobilePresentationMode={mobilePresentationMode}
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
      {/* Scratch Card specific styles */}
      <style>{`
        /* Scratch Card Form Section */
        .scratch-popup-form-section {
          padding: 2rem 1.5rem;
          display: flex;
          flex-direction: column;
          justify-content: center;
          gap: 1rem;
          width: 100%;
          min-width: 0;
        }

        @container popup-viewport (min-width: 520px) {
          .scratch-popup-form-section {
            padding: 2.5rem 2rem;
          }
        }

        .scratch-popup-dismiss-button {
          margin-top: 0.75rem;
          background: transparent;
          border: none;
          color: ${config.descriptionColor || getAdaptiveMutedColor(config.backgroundColor)};
          font-size: 0.875rem;
          cursor: pointer;
        }

        .scratch-popup-dismiss-button:hover {
          text-decoration: underline;
        }

        .scratch-card-container {
          position: relative;
          width: 100%;
          max-width: ${cardWidth}px;
          margin: 0 auto 1.5rem;
          border-radius: 0.75rem;
          overflow: hidden;
          box-shadow: 0 10px 30px -5px rgba(0, 0, 0, 0.2);
          aspect-ratio: ${cardWidth} / ${cardHeight};
        }

        .scratch-card-canvas {
          position: absolute;
          inset: 0;
          cursor: pointer;
          touch-action: none;
        }

        .scratch-popup-button {
          width: 100%;
          padding: ${POPUP_SPACING.component.button};
          border-radius: 0.375rem;
          border: none;
          font-weight: 700;
          cursor: pointer;
          transition: all 0.2s;
          font-size: 1rem;
          text-transform: uppercase;
          letter-spacing: 0.05em;
        }

        .scratch-popup-button:hover:not(:disabled) {
          transform: translateY(-2px);
          box-shadow: 0 10px 25px -5px rgba(0, 0, 0, 0.3);
        }

        .scratch-popup-button:active:not(:disabled) {
          transform: translateY(0);
        }

        .scratch-popup-button:disabled {
          opacity: 0.6;
          cursor: not-allowed;
        }

        .scratch-success-section {
          text-align: center;
          padding: 2rem 0;
        }

        .scratch-discount-wrapper {
          margin-bottom: 0.5rem;
        }

        /* Email Capture Overlay (slides up after reveal) */
        .scratch-email-overlay {
          position: absolute;
          bottom: 0;
          left: 0;
          right: 0;
          background: ${config.backgroundColor};
          border-top: 1px solid rgba(0, 0, 0, 0.1);
          padding: 1.5rem;
          transform: translateY(100%);
          animation: slideUp 0.4s ease-out forwards;
          z-index: 10;
        }

        @keyframes slideUp {
          to { transform: translateY(0); }
        }

        .scratch-email-overlay-content {
          max-width: 400px;
          margin: 0 auto;
        }

        /* Premium reveal animations */
        @keyframes goldenShimmer {
          0% { left: -150%; opacity: 0; }
          50% { opacity: 1; }
          100% { left: 150%; opacity: 0; }
        }

        @keyframes celebrationPop {
          0% { opacity: 0; transform: scale(0.5); }
          60% { transform: scale(1.1); }
          80% { transform: scale(0.95); }
          100% { opacity: 1; transform: scale(1); }
        }

        .revealed-animation {
          animation: celebrationPop 0.6s ease-out forwards;
        }

        @keyframes glowPulse {
          0%, 100% { box-shadow: 0 0 15px ${config.accentColor || config.buttonColor}40; }
          50% { box-shadow: 0 0 30px ${config.accentColor || config.buttonColor}60, 0 0 45px ${config.accentColor || config.buttonColor}30; }
        }

        .revealed-animation .scratch-card-container {
          animation: glowPulse 2s ease-in-out infinite;
        }

        /* Near threshold feedback */
        .near-threshold .scratch-card-container {
          animation: pulse 0.5s ease-in-out infinite;
        }

        @keyframes pulse {
          0%, 100% { transform: scale(1); }
          50% { transform: scale(1.02); }
        }

        /* Scratching state */
        .is-scratching .scratch-card-canvas {
          cursor: grabbing;
        }

        /* Scratch sparkles */
        @keyframes sparkleBurst {
          0% { opacity: 0; transform: scaleY(0) rotate(var(--sparkle-angle)); }
          30% { opacity: 1; transform: scaleY(1) rotate(var(--sparkle-angle)); }
          100% { opacity: 0; transform: scaleY(0.5) translateY(-20px) rotate(var(--sparkle-angle)); }
        }

        .scratch-sparkle {
          position: absolute;
          width: 3px;
          height: 60px;
          background: linear-gradient(to top, transparent, ${config.accentColor || config.buttonColor}80, #FFD70080);
          transform-origin: bottom center;
          border-radius: 2px;
          animation: sparkleBurst 0.8s ease-out forwards;
          animation-delay: calc(var(--sparkle-angle) * 0.001s);
        }

        /* Star pop effects */
        @keyframes starPop {
          0% { opacity: 0; transform: scale(0) rotate(0deg); }
          50% { opacity: 1; transform: scale(1.3) rotate(180deg); }
          100% { opacity: 0; transform: scale(0.5) rotate(360deg); }
        }

        .scratch-star {
          position: absolute;
          font-size: 24px;
          pointer-events: none;
          z-index: 102;
          animation: starPop 0.8s ease-out forwards;
        }

        .scratch-star:nth-of-type(1) { animation-delay: 0.2s; }
        .scratch-star:nth-of-type(2) { animation-delay: 0.35s; }
        .scratch-star:nth-of-type(3) { animation-delay: 0.5s; }

        /* Prize canvas glow on reveal */
        .revealed-animation .scratch-prize-canvas {
          animation: prizeGlow 1.5s ease-in-out infinite;
        }

        @keyframes prizeGlow {
          0%, 100% { filter: drop-shadow(0 0 5px ${config.accentColor || config.buttonColor}40); }
          50% { filter: drop-shadow(0 0 15px ${config.accentColor || config.buttonColor}60) drop-shadow(0 0 30px #FFD70040); }
        }

        /* 3D flip reveal effect */
        @keyframes flipReveal {
          0% { transform: perspective(600px) rotateY(-90deg); opacity: 0; }
          50% { transform: perspective(600px) rotateY(10deg); opacity: 1; }
          100% { transform: perspective(600px) rotateY(0deg); opacity: 1; }
        }

        .revealed-animation .scratch-prize-canvas {
          animation: flipReveal 0.6s ease-out forwards, prizeGlow 1.5s ease-in-out 0.6s infinite;
        }

        /* Reduced motion */
        @media (prefers-reduced-motion: reduce) {
          .revealed-animation,
          .scratch-sparkle,
          .scratch-star,
          .scratch-email-overlay,
          .near-threshold .scratch-card-container {
            animation: none !important;
            transition: none !important;
          }
          .scratch-email-overlay {
            transform: translateY(0);
          }
        }
      `}</style>

      {/* Unified Layout using LeadCaptureLayout */}
      <LeadCaptureLayout
        desktopLayout={layout.desktop}
        mobileLayout={layout.mobile}
        visualSize={{
          desktop: layout.visualSizeDesktop || "50%",
          mobile: layout.visualSizeMobile || "30%",
        }}
        contentOverlap={layout.contentOverlap || "0"}
        visualGradient={layout.visualGradient ?? false}
        gradientColor={config.backgroundColor}
        backgroundColor={config.backgroundColor}
        borderRadius={typeof config.borderRadius === "number" ? config.borderRadius : 16}
        overlayOpacity={config.backgroundOverlayOpacity ?? 0.6}
        showCloseButton={config.showCloseButton !== false}
        onClose={onClose}
        className="ScratchCardPopup"
        style={designVars as React.CSSProperties}
        data-splitpop="true"
        data-template="scratch-card"
        visualSlot={
          hasVisual ? (
            <img
              src={imageUrl}
              alt=""
              aria-hidden="true"
              style={{
                width: "100%",
                height: "100%",
                objectFit: "cover",
                objectPosition: "center",
              }}
            />
          ) : undefined
        }
        formSlot={
          <div className="scratch-popup-form-section" style={{ position: "relative" }}>
            {/* Headline - using best practices from PopupHeader component */}
            <div style={{ textAlign: "center", marginBottom: "1.5rem" }}>
              <h2
                style={{
                  fontSize: config.titleFontSize || "1.875rem",
                  fontWeight: config.titleFontWeight || 700,
                  lineHeight: 1.2,
                  margin: 0,
                  marginBottom: config.subheadline || showEmailForm ? "0.75rem" : 0,
                  textShadow: config.titleTextShadow,
                  color: config.textColor,
                }}
              >
                {config.headline}
              </h2>
              {(config.subheadline || showEmailForm) && (
                <p
                  style={{
                    fontSize: config.descriptionFontSize || "1rem",
                    fontWeight: config.descriptionFontWeight || 400,
                    lineHeight: 1.6,
                    margin: 0,
                    opacity: config.descriptionColor ? 1 : 0.85,
                    color: config.descriptionColor || config.textColor,
                  }}
                >
                  {showEmailForm
                    ? "Enter your email below to unlock your scratch card and reveal your prize!"
                    : config.subheadline}
                </p>
              )}
            </div>

            {showEmailForm ? (
              // Lead capture form (before scratching)
              <>
                <LeadCaptureForm
                  data={formState}
                  errors={errors}
                  onEmailChange={setEmail}
                  onNameChange={setName}
                  onGdprChange={setGdprConsent}
                  onSubmit={handleEmailSubmit}
                  isSubmitting={isSubmitting}
                  showName={config.nameFieldEnabled}
                  nameRequired={config.nameFieldRequired}
                  showGdpr={config.consentFieldEnabled}
                  gdprRequired={config.consentFieldRequired}
                  labels={{
                    email: config.emailLabel,
                    name: config.nameFieldLabel,
                    gdpr: config.consentFieldText,
                    submit: config.buttonText || "Unlock Scratch Card",
                  }}
                  placeholders={{
                    email: config.emailPlaceholder || "Enter your email",
                    name: config.nameFieldPlaceholder,
                  }}
                  accentColor={config.accentColor}
                  buttonColor={config.buttonColor}
                  textColor={config.textColor}
                  backgroundColor={config.inputBackgroundColor}
                  buttonTextColor={config.buttonTextColor}
                  inputTextColor={config.inputTextColor}
                  inputBorderColor={config.inputBorderColor}
                  inputPlaceholderColor={config.inputPlaceholderColor}
                  privacyPolicyUrl={config.privacyPolicyUrl}
                  style={{
                    width: "100%",
                    maxWidth: "400px",
                    margin: "0 auto",
                  }}
                />

                {/* Dismiss button for email-before-scratching form */}
                <div style={{ marginTop: "16px", textAlign: "center" }}>
                  <button type="button" className="scratch-popup-dismiss-button" onClick={onClose}>
                    {config.dismissLabel || "No thanks"}
                  </button>
                </div>
              </>
            ) : (
              showScratchCard && (
                // Scratch card with enhanced effects
                <>
                  <div
                    className={`scratch-card-container ${isRevealed ? "revealed-animation" : ""} ${isNearThreshold ? "near-threshold" : ""} ${isScratching ? "is-scratching" : ""}`}
                  >
                    {/* Prize canvas (bottom layer) */}
                    <canvas
                      ref={prizeCanvasRef}
                      width={cardWidth}
                      height={cardHeight}
                      className="scratch-prize-canvas"
                      style={{
                        position: "absolute",
                        inset: 0,
                        width: "100%",
                        height: "100%",
                        zIndex: 1,
                      }}
                    />

                    {/* Scratch overlay canvas (top layer) */}
                    <canvas
                      ref={canvasRef}
                      width={cardWidth}
                      height={cardHeight}
                      onMouseDown={handleMouseStart}
                      onMouseMove={handleMouseMove}
                      onMouseUp={handleMouseEnd}
                      onMouseLeave={handleMouseEnd}
                      onTouchStart={handleTouchStart}
                      onTouchMove={handleTouchMove}
                      onTouchEnd={handleTouchEnd}
                      className="scratch-card-canvas"
                      style={{
                        position: "absolute",
                        inset: 0,
                        width: "100%",
                        height: "100%",
                        cursor: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='32' height='32' viewBox='0 0 32 32'%3E%3Ccircle cx='16' cy='16' r='14' fill='%23FFD700' stroke='%23B8860B' stroke-width='2'/%3E%3Ctext x='16' y='21' font-size='14' font-weight='bold' text-anchor='middle' fill='%238B6914'%3E$%3C/text%3E%3C/svg%3E") 16 16, ${isScratching ? "grabbing" : "grab"}`,
                        touchAction: "none",
                        zIndex: 2,
                      }}
                    />

                    {/* Scratch particles layer */}
                    {enableParticles && particles.length > 0 && (
                      <div
                        className="scratch-particles-layer"
                        style={{
                          position: "absolute",
                          inset: 0,
                          zIndex: 3,
                          pointerEvents: "none",
                          overflow: "hidden",
                        }}
                      >
                        {particles.map((p, i) => (
                          <div
                            key={i}
                            className="scratch-particle"
                            style={{
                              position: "absolute",
                              left: `${(p.x / cardWidth) * 100}%`,
                              top: `${(p.y / cardHeight) * 100}%`,
                              width: p.size,
                              height: p.size,
                              backgroundColor: p.color,
                              opacity: p.opacity,
                              borderRadius: "50%",
                              transform: "translate(-50%, -50%)",
                              boxShadow: `0 0 ${p.size}px ${p.color}`,
                            }}
                          />
                        ))}
                      </div>
                    )}

                    {/* Progress indicator */}
                    {!isRevealed && scratchPercentage > 5 && (
                      <div className="scratch-progress-indicator">
                        <div
                          className="scratch-progress-bar"
                          style={{
                            width: `${Math.min(100, (scratchPercentage / threshold) * 100)}%`,
                          }}
                        />
                      </div>
                    )}

                    {/* Enhanced celebration effects on reveal */}
                    {isRevealed && wonPrize?.discountCode && (
                      <>
                        {/* Sparkle burst */}
                        <div className="scratch-sparkle-burst">
                          {[...Array(12)].map((_, i) => (
                            <div
                              key={i}
                              className="scratch-sparkle"
                              style={{ "--sparkle-angle": `${i * 30}deg` } as React.CSSProperties}
                            />
                          ))}
                        </div>

                        {/* Star effects */}
                        <div className="scratch-star" style={{ left: "15%", top: "20%" }}>
                          ⭐
                        </div>
                        <div className="scratch-star" style={{ left: "85%", top: "25%" }}>
                          ✨
                        </div>
                        <div className="scratch-star" style={{ left: "50%", top: "10%" }}>
                          🌟
                        </div>

                        {/* Confetti particles */}
                        <div className="scratch-confetti" />
                        <div className="scratch-confetti" />
                        <div className="scratch-confetti" />
                        <div className="scratch-confetti" />
                        <div className="scratch-confetti" />
                        <div className="scratch-confetti" />
                      </>
                    )}

                    {/* Code overlay inside card after reveal */}
                    {/* Scenario 2: Show code immediately (email not required) */}
                    {/* Note: For email BEFORE/AFTER flows, code is shown in success section below */}
                    {isRevealed && wonPrize && wonPrize.discountCode && !config.emailRequired && (
                      <div
                        className="scratch-card-code-overlay"
                        style={{
                          position: "absolute",
                          inset: 0,
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                          pointerEvents: "none",
                          zIndex: 3,
                        }}
                      >
                        <div style={{ pointerEvents: "auto" }}>
                          <DiscountCodeDisplay
                            code={wonPrize.discountCode}
                            onCopy={handleCopyCode}
                            copied={copiedCode}
                            label="Your Code:"
                            variant="dashed"
                            size="md"
                            accentColor="#ffffff"
                            textColor="#ffffff"
                            backgroundColor="rgba(255, 255, 255, 0.2)"
                            style={{
                              backdropFilter: "blur(10px)",
                              border: "2px dashed rgba(255, 255, 255, 0.5)",
                            }}
                          />
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Progress indicator removed - already shown inside the scratch card canvas */}

                  {/* Prize reveal fallback (non-discount prizes) */}
                  {isRevealed && wonPrize && !wonPrize.discountCode && (
                    <div
                      style={{
                        marginTop: "16px",
                        padding: "20px",
                        backgroundColor: config.accentColor || "#F3F4F6",
                        borderRadius: "12px",
                        width: "100%",
                        maxWidth: "400px",
                        marginLeft: "auto",
                        marginRight: "auto",
                      }}
                    >
                      <p
                        style={{
                          fontSize: "14px",
                          margin: "0 0 12px 0",
                          textAlign: "center",
                          opacity: 0.8,
                        }}
                      >
                        {config.failureMessage || "Better luck next time!"}
                      </p>
                    </div>
                  )}

                  {/* Post-reveal email capture moved to overlay panel below */}

                  {/* Success state after claiming prize - same pattern as SpinToWin */}
                  {isRevealed && emailSubmitted && (
                    <div className="scratch-success-section">
                      {wonPrize?.generatedCode || wonPrize?.discountCode ? (
                        <div className="scratch-discount-wrapper">
                          <DiscountCodeDisplay
                            code={wonPrize.generatedCode || wonPrize.discountCode || ""}
                            onCopy={handleCopyCode}
                            copied={copiedCode}
                            label="Your Discount Code"
                            variant="dashed"
                            accentColor={config.accentColor || config.buttonColor}
                            textColor={config.descriptionColor || config.textColor}
                            size="lg"
                          />
                        </div>
                      ) : (
                        <div className="scratch-discount-wrapper">
                          <p
                            style={{
                              fontSize: "1rem",
                              color: config.descriptionColor || getAdaptiveMutedColor(config.backgroundColor),
                              lineHeight: 1.6,
                            }}
                          >
                            {config.failureMessage || "Better luck next time!"}
                          </p>
                        </div>
                      )}

                      <button
                        type="button"
                        onClick={onClose}
                        style={{
                          width: "100%",
                          padding: "14px 24px",
                          fontSize: "1rem",
                          fontWeight: 600,
                          textTransform: "uppercase",
                          letterSpacing: "0.05em",
                          color: config.buttonTextColor || "#FFFFFF",
                          backgroundColor: config.buttonColor || "var(--rb-success, #22c55e)",
                          border: "none",
                          borderRadius: "8px",
                          cursor: "pointer",
                          marginTop: "1.5rem",
                        }}
                      >
                        CONTINUE SHOPPING
                      </button>
                    </div>
                  )}

                  {/* Dismiss button - only show when not in success state */}
                  {!(isRevealed && emailSubmitted) && (
                    <div style={{ marginTop: "16px", textAlign: "center" }}>
                      <button
                        type="button"
                        className="scratch-popup-dismiss-button"
                        onClick={onClose}
                      >
                        {isRevealed ? "Close" : config.dismissLabel || "No thanks"}
                      </button>
                    </div>
                  )}
                </>
              )
            )}

            {/* Email Capture Overlay Panel - slides up after reveal animation completes */}
            {showEmailOverlay && (
              <div className="scratch-email-overlay">
                <div className="scratch-email-overlay-content">
                  <h3
                    style={{
                      color: config.textColor,
                      lineHeight: 1.2,
                      margin: "0 0 0.5rem 0",
                    }}
                  >
                    {wonPrize?.label || "You Won!"}
                  </h3>
                  <p
                    style={{
                      color: config.descriptionColor || config.textColor,
                      lineHeight: 1.5,
                      opacity: config.descriptionColor ? 1 : 0.85,
                      margin: "0 0 1rem 0",
                    }}
                  >
                    Enter your email to claim your prize
                  </p>
                  <LeadCaptureForm
                    data={formState}
                    errors={errors}
                    onEmailChange={setEmail}
                    onNameChange={setName}
                    onGdprChange={setGdprConsent}
                    onSubmit={handleEmailSubmit}
                    isSubmitting={isSubmitting || isSubmittingEmail}
                    showName={config.nameFieldEnabled}
                    nameRequired={config.nameFieldRequired}
                    showGdpr={config.consentFieldEnabled}
                    gdprRequired={config.consentFieldRequired}
                    labels={{
                      email: config.emailLabel,
                      name: config.nameFieldLabel,
                      gdpr: config.consentFieldText,
                      submit: config.buttonText || "Claim My Prize",
                    }}
                    placeholders={{
                      email: config.emailPlaceholder || "Enter your email",
                      name: config.nameFieldPlaceholder,
                    }}
                    accentColor={config.accentColor}
                    buttonColor={config.buttonColor}
                    textColor={config.textColor}
                    backgroundColor={config.inputBackgroundColor}
                    buttonTextColor={config.buttonTextColor}
                    inputTextColor={config.inputTextColor}
                    inputBorderColor={config.inputBorderColor}
                    inputPlaceholderColor={config.inputPlaceholderColor}
                    privacyPolicyUrl={config.privacyPolicyUrl}
                  />
                </div>
              </div>
            )}
          </div>
        }
      />
      <style>{`
        /* Scratch Card Specific Styles */
        .scratch-popup-form-section {
          position: relative;
          padding: 2.5rem 2rem;
          display: flex;
          flex-direction: column;
          justify-content: center;
          gap: 1.25rem;
        }

        .scratch-card-container {
          position: relative;
          width: 100%;
          max-width: ${cardWidth}px;
          margin: 0 auto 1.5rem;
          border-radius: 0.75rem;
          overflow: hidden;
          box-shadow: 0 10px 30px -5px rgba(0, 0, 0, 0.2);
          aspect-ratio: ${cardWidth} / ${cardHeight};
        }

        .scratch-card-canvas {
          position: absolute;
          inset: 0;
          cursor: pointer;
          touch-action: none;
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
          box-shadow: 0 0 0 3px rgba(0, 0, 0, 0.08);
        }

        .scratch-popup-input.error {
          border-color: var(--rb-error, #dc2626);
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
          padding: ${POPUP_SPACING.component.button};
          border-radius: 0.375rem;
          border: none;
          font-weight: 700;
          cursor: pointer;
          transition: all 0.2s;
          font-size: 1rem;
          text-transform: uppercase;
          letter-spacing: 0.05em;
        }

        .scratch-popup-button:hover:not(:disabled) {
          transform: translateY(-2px);
          box-shadow: 0 10px 25px -5px rgba(0, 0, 0, 0.3);
        }

        .scratch-popup-button:active:not(:disabled) {
          transform: translateY(0);
        }

        .scratch-popup-button:disabled {
          opacity: 0.6;
          cursor: not-allowed;
        }

        .scratch-popup-dismiss-button {
          margin-top: 0.75rem;
          background: transparent;
          border: none;
          color: ${config.descriptionColor || getAdaptiveMutedColor(config.backgroundColor)};
          font-size: 0.875rem;
          cursor: pointer;
        }

        .scratch-popup-dismiss-button:hover {
          text-decoration: underline;
        }

        .scratch-success-section {
          text-align: center;
          padding: 2rem 0;
        }

        .scratch-discount-wrapper {
          margin-bottom: 0.5rem;
        }

        .scratch-popup-error {
          font-size: 0.875rem;
          color: var(--rb-error, #dc2626);
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

        @keyframes pulse {
          0%, 100% { transform: scale(1); }
          50% { transform: scale(1.05); }
        }

        /* Premium reveal animations */
        @keyframes goldenShimmer {
          0% { left: -150%; opacity: 0; }
          50% { opacity: 1; }
          100% { left: 150%; opacity: 0; }
        }

        @keyframes celebrationPop {
          0% { opacity: 0; transform: scale(0.5); }
          60% { transform: scale(1.1); }
          80% { transform: scale(0.95); }
          100% { opacity: 1; transform: scale(1); }
        }

        @keyframes confettiDrop {
          0% { opacity: 1; transform: translateY(0) rotate(0deg) scale(1); }
          100% { opacity: 0; transform: translateY(100px) rotate(360deg) scale(0.5); }
        }

        @keyframes prizeReveal {
          0% {
            opacity: 0;
            transform: perspective(500px) rotateX(-15deg) translateY(20px) scale(0.9);
          }
          100% {
            opacity: 1;
            transform: perspective(500px) rotateX(0) translateY(0) scale(1);
          }
        }

        @keyframes glowPulse {
          0%, 100% { box-shadow: 0 0 15px ${config.accentColor || config.buttonColor}40; }
          50% { box-shadow: 0 0 30px ${config.accentColor || config.buttonColor}60, 0 0 45px ${config.accentColor || config.buttonColor}30; }
        }

        .revealed-animation {
          animation: celebrationPop 0.6s ease-out forwards;
        }

        /* Golden shimmer sweep on reveal */
        .revealed-animation::after {
          content: '';
          position: absolute;
          top: 0;
          left: -150%;
          width: 100%;
          height: 100%;
          background: linear-gradient(
            90deg,
            transparent,
            rgba(255, 215, 0, 0.4),
            rgba(255, 255, 255, 0.6),
            rgba(255, 215, 0, 0.4),
            transparent
          );
          animation: goldenShimmer 1s ease-in-out 0.3s forwards;
          pointer-events: none;
          z-index: 10;
        }

        /* Success section animations */
        .scratch-success-section {
          animation: prizeReveal 0.5s ease-out forwards;
        }

        .scratch-discount-wrapper {
          animation: prizeReveal 0.6s ease-out 0.2s both;
        }

        /* Code overlay glow effect */
        .scratch-card-code-overlay > div {
          animation: glowPulse 2s ease-in-out infinite;
        }

        /* Confetti particles */
        .scratch-confetti {
          position: absolute;
          pointer-events: none;
          z-index: 100;
        }

        .scratch-confetti:nth-child(1) { width: 8px; height: 8px; background: #fbbf24; left: 15%; top: 20%; animation: confettiDrop 1.2s ease-out 0s forwards; }
        .scratch-confetti:nth-child(2) { width: 6px; height: 6px; background: #ec4899; left: 25%; top: 15%; animation: confettiDrop 1.4s ease-out 0.1s forwards; border-radius: 50%; }
        .scratch-confetti:nth-child(3) { width: 10px; height: 10px; background: #8b5cf6; left: 75%; top: 18%; animation: confettiDrop 1.3s ease-out 0.15s forwards; }
        .scratch-confetti:nth-child(4) { width: 7px; height: 7px; background: #06b6d4; left: 85%; top: 22%; animation: confettiDrop 1.5s ease-out 0.08s forwards; border-radius: 50%; }
        .scratch-confetti:nth-child(5) { width: 9px; height: 9px; background: var(--rb-success, #10b981); left: 45%; top: 12%; animation: confettiDrop 1.25s ease-out 0.2s forwards; }
        .scratch-confetti:nth-child(6) { width: 8px; height: 8px; background: ${config.accentColor || config.buttonColor}; left: 55%; top: 25%; animation: confettiDrop 1.35s ease-out 0.12s forwards; border-radius: 50%; }

        /* ============================================
         * ENHANCED SCRATCH CARD EFFECTS
         * ============================================ */

        /* Card entrance animation */
        @keyframes cardEntrance {
          0% {
            opacity: 0;
            transform: perspective(600px) rotateX(-10deg) translateY(20px) scale(0.95);
          }
          100% {
            opacity: 1;
            transform: perspective(600px) rotateX(0) translateY(0) scale(1);
          }
        }

        .scratch-card-container {
          animation: cardEntrance 0.5s ease-out forwards;
          transform-style: preserve-3d;
          transition: transform 0.15s ease-out, box-shadow 0.3s ease;
        }

        /* Hover tilt effect */
        .scratch-card-container:hover:not(.revealed-animation) {
          transform: perspective(600px) rotateX(2deg) rotateY(-2deg) scale(1.02);
          box-shadow:
            0 15px 35px -10px rgba(0,0,0,0.3),
            0 5px 15px -5px rgba(0,0,0,0.2);
        }

        /* Scratching state */
        .scratch-card-container.is-scratching {
          transform: perspective(600px) scale(1.01);
          box-shadow:
            0 20px 40px -12px rgba(0,0,0,0.35),
            0 8px 20px -8px rgba(0,0,0,0.25);
        }

        /* Near threshold glow effect */
        .scratch-card-container.near-threshold {
          animation: thresholdPulse 0.8s ease-in-out infinite;
        }

        @keyframes thresholdPulse {
          0%, 100% {
            box-shadow:
              0 10px 25px -5px rgba(0,0,0,0.2),
              0 0 0 0 ${config.accentColor || config.buttonColor}00;
          }
          50% {
            box-shadow:
              0 10px 25px -5px rgba(0,0,0,0.2),
              0 0 20px 4px ${config.accentColor || config.buttonColor}60;
          }
        }

        /* Progress indicator */
        .scratch-progress-indicator {
          position: absolute;
          bottom: 8px;
          left: 50%;
          transform: translateX(-50%);
          width: 60%;
          height: 4px;
          background: rgba(0,0,0,0.2);
          border-radius: 2px;
          overflow: hidden;
          z-index: 10;
          opacity: 0.8;
        }

        .scratch-progress-bar {
          height: 100%;
          background: linear-gradient(90deg, ${config.accentColor || config.buttonColor}, #FFD700);
          border-radius: 2px;
          transition: width 0.1s ease-out;
          box-shadow: 0 0 8px ${config.accentColor || config.buttonColor}80;
        }

        /* Email Capture Overlay Panel */
        .scratch-email-overlay {
          position: absolute;
          bottom: 0;
          left: 0;
          right: 0;
          background: ${config.backgroundColor || "#ffffff"}f0;
          backdrop-filter: blur(16px);
          -webkit-backdrop-filter: blur(16px);
          border-top: 1px solid rgba(255,255,255,0.3);
          border-radius: 20px 20px 0 0;
          padding: 1.5rem;
          z-index: 100;
          animation: slideUpOverlay 0.4s cubic-bezier(0.16, 1, 0.3, 1) forwards;
          box-shadow: 0 -10px 40px rgba(0,0,0,0.2);
        }

        @keyframes slideUpOverlay {
          from {
            transform: translateY(100%);
            opacity: 0;
          }
          to {
            transform: translateY(0);
            opacity: 1;
          }
        }

        .scratch-email-overlay-content {
          max-width: 400px;
          margin: 0 auto;
        }

        .scratch-email-overlay h3 {
          font-size: 1.25rem;
          font-weight: 600;
          text-align: center;
        }

        .scratch-email-overlay p {
          font-size: 0.9375rem;
          text-align: center;
        }

        .scratch-email-overlay form {
          display: flex;
          flex-direction: column;
          gap: 0.75rem;
        }

        /* Holographic shimmer overlay animation */
        @keyframes holoShimmer {
          0% { background-position: -200% 0; }
          100% { background-position: 200% 0; }
        }

        .scratch-card-canvas::before {
          content: '';
          position: absolute;
          inset: 0;
          background: linear-gradient(
            120deg,
            transparent 30%,
            rgba(255,255,255,0.1) 38%,
            rgba(255,255,255,0.2) 40%,
            rgba(255,255,255,0.1) 42%,
            transparent 50%
          );
          background-size: 200% 100%;
          animation: holoShimmer 3s linear infinite;
          pointer-events: none;
          z-index: 5;
        }

        /* Sparkle burst effect on reveal */
        .scratch-sparkle-burst {
          position: absolute;
          top: 50%;
          left: 50%;
          width: 0;
          height: 0;
          z-index: 101;
          pointer-events: none;
        }

        @keyframes sparkleBurst {
          0% {
            transform: translateX(-50%) translateY(-50%) rotate(var(--sparkle-angle)) scaleY(0);
            opacity: 0;
          }
          20% {
            opacity: 1;
            transform: translateX(-50%) translateY(-50%) rotate(var(--sparkle-angle)) scaleY(1);
          }
          100% {
            opacity: 0;
            transform: translateX(-50%) translateY(-50%) rotate(var(--sparkle-angle)) scaleY(1.5) translateY(-40px);
          }
        }

        .scratch-sparkle {
          position: absolute;
          width: 3px;
          height: 60px;
          background: linear-gradient(to top, transparent, ${config.accentColor || config.buttonColor}80, #FFD70080);
          transform-origin: bottom center;
          border-radius: 2px;
          animation: sparkleBurst 0.8s ease-out forwards;
          animation-delay: calc(var(--sparkle-angle) * 0.001s);
        }

        /* Star pop effects */
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

        .scratch-star {
          position: absolute;
          font-size: 24px;
          pointer-events: none;
          z-index: 102;
          animation: starPop 0.8s ease-out forwards;
        }

        .scratch-star:nth-of-type(1) { animation-delay: 0.2s; }
        .scratch-star:nth-of-type(2) { animation-delay: 0.35s; }
        .scratch-star:nth-of-type(3) { animation-delay: 0.5s; }

        /* Prize canvas glow on reveal */
        .revealed-animation .scratch-prize-canvas {
          animation: prizeGlow 1.5s ease-in-out infinite;
        }

        @keyframes prizeGlow {
          0%, 100% {
            filter: drop-shadow(0 0 5px ${config.accentColor || config.buttonColor}40);
          }
          50% {
            filter: drop-shadow(0 0 15px ${config.accentColor || config.buttonColor}60)
                    drop-shadow(0 0 30px #FFD70040);
          }
        }

        /* 3D flip reveal effect */
        @keyframes flipReveal {
          0% {
            transform: perspective(600px) rotateY(-90deg);
            opacity: 0;
          }
          50% {
            transform: perspective(600px) rotateY(10deg);
            opacity: 1;
          }
          100% {
            transform: perspective(600px) rotateY(0deg);
            opacity: 1;
          }
        }

        .revealed-animation .scratch-prize-canvas {
          animation: flipReveal 0.6s ease-out forwards, prizeGlow 1.5s ease-in-out 0.6s infinite;
        }

        /* Responsive adjustments for form section padding */
        @container popup-viewport (min-width: 520px) {
          .scratch-popup-form-section {
            padding: 3rem 2.5rem;
          }
        }

      `}</style>
    </PopupPortal>
  );
};
