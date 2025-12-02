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

import React, { useState, useCallback, useRef, useEffect } from "react";
import { PopupPortal } from "./PopupPortal";
import type { PopupDesignConfig, Prize } from "./types";
import type { ScratchCardContent } from "~/domains/campaigns/types/campaign";
import { getSizeDimensions, prefersReducedMotion } from "./utils";
import { POPUP_SPACING } from "./spacing";

// Import custom hooks
import { usePopupForm, useDiscountCode, usePopupAnimation } from "./hooks";

// Import reusable components
import { EmailInput, GdprCheckbox, SubmitButton } from "./components";

// Import shared components from Phase 1 & 2
import { DiscountCodeDisplay } from "./components/shared";

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
 * Draw enhanced metallic foil overlay with holographic pattern
 */
function drawMetallicOverlay(
  ctx: CanvasRenderingContext2D,
  width: number,
  height: number,
  baseColor: string,
  instruction: string,
  accentColor: string
) {
  // Create metallic gradient
  const gradient = ctx.createLinearGradient(0, 0, width, height);
  gradient.addColorStop(0, adjustBrightness(baseColor, 15));
  gradient.addColorStop(0.2, adjustBrightness(baseColor, 30));
  gradient.addColorStop(0.4, baseColor);
  gradient.addColorStop(0.5, adjustBrightness(baseColor, 40));
  gradient.addColorStop(0.6, baseColor);
  gradient.addColorStop(0.8, adjustBrightness(baseColor, 25));
  gradient.addColorStop(1, adjustBrightness(baseColor, 10));

  ctx.fillStyle = gradient;
  ctx.fillRect(0, 0, width, height);

  // Add noise texture for realistic scratch surface
  drawNoiseTexture(ctx, width, height, 0.03);

  // Add holographic rainbow pattern
  drawHolographicPattern(ctx, width, height, accentColor);

  // Draw decorative corner elements
  drawCornerDecorations(ctx, width, height, accentColor);

  // Draw dashed border
  drawDashedBorder(ctx, width, height);

  // Draw instruction with icon
  drawScratchInstruction(ctx, width, height, instruction);

  // Draw ticket serial number
  drawSerialNumber(ctx, width, height);
}

/**
 * Draw noise texture for realistic scratch surface
 */
function drawNoiseTexture(
  ctx: CanvasRenderingContext2D,
  width: number,
  height: number,
  intensity: number
) {
  const imageData = ctx.getImageData(0, 0, width, height);
  const pixels = imageData.data;

  for (let i = 0; i < pixels.length; i += 4) {
    const noise = (Math.random() - 0.5) * 255 * intensity;
    pixels[i] = Math.max(0, Math.min(255, pixels[i] + noise));
    pixels[i + 1] = Math.max(0, Math.min(255, pixels[i + 1] + noise));
    pixels[i + 2] = Math.max(0, Math.min(255, pixels[i + 2] + noise));
  }

  ctx.putImageData(imageData, 0, 0);
}

/**
 * Draw holographic rainbow pattern
 */
function drawHolographicPattern(
  ctx: CanvasRenderingContext2D,
  width: number,
  height: number,
  accentColor: string
) {
  ctx.save();
  ctx.globalAlpha = 0.15;
  ctx.globalCompositeOperation = "overlay";

  // Create diagonal holographic stripes
  const stripeWidth = 30;
  const colors = [
    "rgba(255, 0, 128, 0.3)",
    "rgba(0, 255, 255, 0.3)",
    "rgba(255, 255, 0, 0.3)",
    "rgba(128, 0, 255, 0.3)",
    accentColor + "40",
  ];

  for (let i = -height; i < width + height; i += stripeWidth) {
    const colorIndex = Math.floor(Math.abs(i / stripeWidth)) % colors.length;
    ctx.fillStyle = colors[colorIndex];
    ctx.beginPath();
    ctx.moveTo(i, 0);
    ctx.lineTo(i + stripeWidth / 2, 0);
    ctx.lineTo(i + stripeWidth / 2 + height, height);
    ctx.lineTo(i + height, height);
    ctx.closePath();
    ctx.fill();
  }

  ctx.restore();

  // Add sparkle dots
  ctx.save();
  ctx.globalAlpha = 0.5;
  for (let i = 0; i < 40; i++) {
    const x = Math.random() * width;
    const y = Math.random() * height;
    const size = Math.random() * 3 + 1;

    const sparkleGradient = ctx.createRadialGradient(x, y, 0, x, y, size);
    sparkleGradient.addColorStop(0, "rgba(255, 255, 255, 0.9)");
    sparkleGradient.addColorStop(0.5, "rgba(255, 255, 255, 0.3)");
    sparkleGradient.addColorStop(1, "rgba(255, 255, 255, 0)");

    ctx.fillStyle = sparkleGradient;
    ctx.beginPath();
    ctx.arc(x, y, size, 0, Math.PI * 2);
    ctx.fill();
  }
  ctx.restore();
}

/**
 * Draw ornate corner decorations
 */
function drawCornerDecorations(
  ctx: CanvasRenderingContext2D,
  width: number,
  height: number,
  accentColor: string
) {
  ctx.save();
  ctx.strokeStyle = accentColor;
  ctx.lineWidth = 2;
  ctx.globalAlpha = 0.6;

  const cornerSize = 25;
  const offset = 8;

  // Top-left corner
  ctx.beginPath();
  ctx.moveTo(offset, offset + cornerSize);
  ctx.lineTo(offset, offset);
  ctx.lineTo(offset + cornerSize, offset);
  ctx.stroke();

  // Top-right corner
  ctx.beginPath();
  ctx.moveTo(width - offset - cornerSize, offset);
  ctx.lineTo(width - offset, offset);
  ctx.lineTo(width - offset, offset + cornerSize);
  ctx.stroke();

  // Bottom-left corner
  ctx.beginPath();
  ctx.moveTo(offset, height - offset - cornerSize);
  ctx.lineTo(offset, height - offset);
  ctx.lineTo(offset + cornerSize, height - offset);
  ctx.stroke();

  // Bottom-right corner
  ctx.beginPath();
  ctx.moveTo(width - offset - cornerSize, height - offset);
  ctx.lineTo(width - offset, height - offset);
  ctx.lineTo(width - offset, height - offset - cornerSize);
  ctx.stroke();

  // Add decorative dots at corners
  ctx.fillStyle = accentColor;
  const dotSize = 3;
  ctx.beginPath();
  ctx.arc(offset + 3, offset + 3, dotSize, 0, Math.PI * 2);
  ctx.arc(width - offset - 3, offset + 3, dotSize, 0, Math.PI * 2);
  ctx.arc(offset + 3, height - offset - 3, dotSize, 0, Math.PI * 2);
  ctx.arc(width - offset - 3, height - offset - 3, dotSize, 0, Math.PI * 2);
  ctx.fill();

  ctx.restore();
}

/**
 * Draw dashed border for ticket authenticity
 */
function drawDashedBorder(
  ctx: CanvasRenderingContext2D,
  width: number,
  height: number
) {
  ctx.save();
  ctx.strokeStyle = "rgba(255, 255, 255, 0.4)";
  ctx.lineWidth = 1;
  ctx.setLineDash([6, 4]);

  const inset = 4;
  ctx.strokeRect(inset, inset, width - inset * 2, height - inset * 2);

  ctx.restore();
}

/**
 * Draw scratch instruction with coin icon
 */
function drawScratchInstruction(
  ctx: CanvasRenderingContext2D,
  width: number,
  height: number,
  instruction: string
) {
  ctx.save();

  // Draw coin icon
  const coinX = width / 2 - 80;
  const coinY = height / 2;
  const coinRadius = 14;

  // Coin gradient
  const coinGradient = ctx.createRadialGradient(
    coinX - 3, coinY - 3, 0,
    coinX, coinY, coinRadius
  );
  coinGradient.addColorStop(0, "#FFE066");
  coinGradient.addColorStop(0.5, "#FFD700");
  coinGradient.addColorStop(1, "#B8860B");

  ctx.fillStyle = coinGradient;
  ctx.beginPath();
  ctx.arc(coinX, coinY, coinRadius, 0, Math.PI * 2);
  ctx.fill();

  // Coin border
  ctx.strokeStyle = "#B8860B";
  ctx.lineWidth = 2;
  ctx.stroke();

  // Dollar sign on coin
  ctx.fillStyle = "#8B6914";
  ctx.font = "bold 14px system-ui";
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.fillText("$", coinX, coinY);

  // Instruction text with shadow
  ctx.shadowColor = "rgba(0, 0, 0, 0.5)";
  ctx.shadowBlur = 4;
  ctx.shadowOffsetX = 1;
  ctx.shadowOffsetY = 2;

  ctx.fillStyle = "#FFFFFF";
  ctx.font = "600 24px system-ui, -apple-system, BlinkMacSystemFont, sans-serif";
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.fillText(instruction, width / 2 + 10, height / 2);

  ctx.restore();
}

/**
 * Draw ticket serial number for authenticity
 */
function drawSerialNumber(
  ctx: CanvasRenderingContext2D,
  width: number,
  height: number
) {
  ctx.save();
  ctx.globalAlpha = 0.4;
  ctx.fillStyle = "#FFFFFF";
  ctx.font = "10px monospace";
  ctx.textAlign = "right";
  ctx.textBaseline = "bottom";

  // Generate pseudo-random serial
  const serial = `#${Math.random().toString(36).substring(2, 8).toUpperCase()}`;
  ctx.fillText(serial, width - 12, height - 8);

  ctx.restore();
}

/**
 * Utility function to adjust color brightness
 */
function adjustBrightness(hex: string, percent: number): string {
  if (hex.startsWith("rgb")) return hex;

  const cleanHex = hex.replace("#", "");
  const num = parseInt(cleanHex, 16);
  const r = Math.min(255, Math.max(0, ((num >> 16) & 0xff) + Math.round(255 * percent / 100)));
  const g = Math.min(255, Math.max(0, ((num >> 8) & 0xff) + Math.round(255 * percent / 100)));
  const b = Math.min(255, Math.max(0, (num & 0xff) + Math.round(255 * percent / 100)));

  return `#${((1 << 24) + (r << 16) + (g << 8) + b).toString(16).slice(1)}`;
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
  const { discountCode: _discountCode, setDiscountCode, copiedCode, handleCopyCode } = useDiscountCode();

  // Use animation hook
  const { showContent: _showContent } = usePopupAnimation({ isVisible });

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
  const isDrawingRef = useRef(false);
  const audioContextRef = useRef<AudioContext | null>(null);
  const lastScratchTimeRef = useRef(0);
  const animationFrameRef = useRef<number | null>(null);

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
        audioContextRef.current = new (window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext)();
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
  const createParticles = useCallback((x: number, y: number) => {
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

    setParticles(prev => [...prev.slice(-30), ...newParticles]); // Keep max 30 particles
  }, [enableParticles, config.scratchOverlayColor]);

  // Animate particles
  const hasParticles = particles.length > 0;
  useEffect(() => {
    if (!hasParticles) return;

    const animate = () => {
      setParticles(prev =>
        prev
          .map(p => ({
            ...p,
            x: p.x + p.vx,
            y: p.y + p.vy,
            vy: p.vy + 0.15, // Gravity
            life: p.life - 0.03,
            opacity: p.opacity * 0.95,
          }))
          .filter(p => p.life > 0 && p.opacity > 0.1)
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

  // Initialize canvases (prize + scratch overlay)
  useEffect(() => {
    if (!canvasRef.current || !prizeCanvasRef.current) return;
    if (config.emailRequired && config.emailBeforeScratching && !emailSubmitted) return;

    const canvas = canvasRef.current;
    const prizeCanvas = prizeCanvasRef.current;
    // Use willReadFrequently for better performance with getImageData (scratch percentage calculation)
    const ctx = canvas.getContext("2d", { willReadFrequently: true });
    const prizeCtx = prizeCanvas.getContext("2d");

    if (!ctx || !prizeCtx) return;

    // Reset transforms and clear previous content
    ctx.setTransform(1, 0, 0, 1, 0, 0);
    prizeCtx.setTransform(1, 0, 0, 1, 0, 0);
    ctx.clearRect(0, 0, cardWidth, cardHeight);
    prizeCtx.clearRect(0, 0, cardWidth, cardHeight);

    // Draw prize background (gradient similar to mockup)
    if (config.scratchCardBackgroundColor) {
      prizeCtx.fillStyle = config.scratchCardBackgroundColor;
      prizeCtx.fillRect(0, 0, cardWidth, cardHeight);
    } else {
      const gradient = prizeCtx.createLinearGradient(0, 0, cardWidth, cardHeight);
      gradient.addColorStop(0, config.accentColor || config.buttonColor || "#4f46e5");
      gradient.addColorStop(1, config.buttonColor || config.accentColor || "#ec4899");
      prizeCtx.fillStyle = gradient;
      prizeCtx.fillRect(0, 0, cardWidth, cardHeight);
    }

    // Select and draw prize label
    if (wonPrize) {
      prizeCtx.fillStyle =
        config.scratchCardTextColor || config.buttonTextColor || config.textColor || "#ffffff";
      prizeCtx.font = "bold 32px system-ui, -apple-system, BlinkMacSystemFont, sans-serif";
      prizeCtx.textAlign = "center";
      prizeCtx.textBaseline = "middle";
      prizeCtx.fillText(wonPrize.label, cardWidth / 2, cardHeight / 2);
    } else {
      // Loading state - show a spinner instead of text
      // Draw a simple spinner animation
      prizeCtx.save();
      prizeCtx.translate(cardWidth / 2, cardHeight / 2);

      const spinnerRadius = 30;
      const lineWidth = 4;
      const numSegments = 8;

      for (let i = 0; i < numSegments; i++) {
        const angle = (i / numSegments) * Math.PI * 2;
        const opacity = (i + 1) / numSegments;

        prizeCtx.strokeStyle = `rgba(255, 255, 255, ${opacity * 0.8})`;
        prizeCtx.lineWidth = lineWidth;
        prizeCtx.lineCap = "round";

        prizeCtx.beginPath();
        prizeCtx.moveTo(
          Math.cos(angle) * (spinnerRadius - lineWidth),
          Math.sin(angle) * (spinnerRadius - lineWidth)
        );
        prizeCtx.lineTo(Math.cos(angle) * spinnerRadius, Math.sin(angle) * spinnerRadius);
        prizeCtx.stroke();
      }

      prizeCtx.restore();
    }

    // Draw scratch overlay (enhanced metallic or basic)
    ctx.globalCompositeOperation = "source-over";

    const enableMetallic = config.enableMetallicOverlay !== false; // Default to true
    const overlayColor = config.scratchOverlayColor || "#C0C0C0";
    const accentColor = config.accentColor || config.buttonColor || "#FFD700";
    const instruction = config.scratchInstruction || "Scratch to reveal!";

    if (enableMetallic) {
      // Use enhanced metallic overlay with holographic effects
      drawMetallicOverlay(ctx, cardWidth, cardHeight, overlayColor, instruction, accentColor);
    } else {
      // Basic overlay (fallback)
      ctx.fillStyle = overlayColor;
      ctx.fillRect(0, 0, cardWidth, cardHeight);

      ctx.fillStyle = "#FFFFFF";
      ctx.font = "600 28px system-ui, -apple-system, BlinkMacSystemFont, sans-serif";
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";
      ctx.fillText(instruction, cardWidth / 2, cardHeight / 2);

      // Add sparkles
      ctx.globalAlpha = 0.3;
      ctx.fillStyle = accentColor;
      for (let i = 0; i < 20; i++) {
        const x = Math.random() * cardWidth;
        const y = Math.random() * cardHeight;
        ctx.beginPath();
        ctx.arc(x, y, 2, 0, Math.PI * 2);
        ctx.fill();
      }
      ctx.globalAlpha = 1;
    }

    // Set composite operation for erasing
    ctx.globalCompositeOperation = "destination-out";
  }, [emailSubmitted, config, cardWidth, cardHeight, wonPrize]);

  // Calculate scratch percentage
  const calculateScratchPercentage = useCallback(() => {
    if (!canvasRef.current) return 0;

    const canvas = canvasRef.current;
    // Use willReadFrequently for better performance with repeated getImageData calls
    const ctx = canvas.getContext("2d", { willReadFrequently: true });
    if (!ctx) return 0;

    const imageData = ctx.getImageData(0, 0, cardWidth, cardHeight);
    const pixels = imageData.data;
    let transparentPixels = 0;

    for (let i = 3; i < pixels.length; i += 4) {
      if (pixels[i] < 128) {
        transparentPixels++;
      }
    }

    return (transparentPixels / (cardWidth * cardHeight)) * 100;
  }, [cardWidth, cardHeight]);

  // Scratch function with enhanced effects
  const scratch = useCallback(
    (x: number, y: number) => {
      if (!canvasRef.current) return;

      const canvas = canvasRef.current;
      // Use willReadFrequently for better performance (consistent with calculateScratchPercentage)
      const ctx = canvas.getContext("2d", { willReadFrequently: true });
      if (!ctx) return;

      // Set composite operation to erase mode
      ctx.globalCompositeOperation = "destination-out";

      // Use irregular brush shape for more realistic scratch
      const irregularity = 0.3;
      const points = 8;
      ctx.beginPath();
      for (let i = 0; i <= points; i++) {
        const angle = (i / points) * Math.PI * 2;
        const radiusVariation = brushRadius * (1 + (Math.random() - 0.5) * irregularity);
        const px = x + Math.cos(angle) * radiusVariation;
        const py = y + Math.sin(angle) * radiusVariation;
        if (i === 0) {
          ctx.moveTo(px, py);
        } else {
          ctx.lineTo(px, py);
        }
      }
      ctx.closePath();
      ctx.fill();

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
    [brushRadius, calculateScratchPercentage, threshold, isRevealed, wonPrize, onReveal, playScratchSound, triggerHaptic, createParticles, enableHaptic]
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

  const _inputStyles: React.CSSProperties = {
    width: "100%",
    padding: "12px 16px",
    fontSize: "16px",
    border: `1px solid ${config.inputBorderColor || "#D1D5DB"}`,
    borderRadius: `${config.borderRadius ?? 8}px`,
    backgroundColor: config.inputBackgroundColor || "#FFFFFF",
    color: config.inputTextColor || config.textColor || "#1F2937",
    outline: "none",
  };

  const _buttonStyles: React.CSSProperties = {
    width: "100%",
    padding: POPUP_SPACING.component.button,
    fontSize: "16px",
    fontWeight: 700,
    border: "none",
    borderRadius: `${config.borderRadius ?? 8}px`,
    backgroundColor: config.buttonColor,
    color: config.buttonTextColor,
    cursor: "pointer",
    textTransform: "uppercase",
    letterSpacing: "0.05em",
  };

  const showEmailForm = config.emailRequired && config.emailBeforeScratching && !emailSubmitted;
  const showScratchCard = !showEmailForm;

  // Derive layout from leadCaptureLayout
  const desktopLayout = config.leadCaptureLayout?.desktop || "split-left";
  const isFullBackground = desktopLayout === "overlay" && !!config.imageUrl;
  const isContentOnly = desktopLayout === "content-only";
  const showImage = !!config.imageUrl && !isContentOnly && !isFullBackground;
  const isVertical = desktopLayout === "split-left" || desktopLayout === "split-right";
  const imageFirst = desktopLayout === "split-left" || desktopLayout === "stacked";
  const bgOverlayOpacity = config.backgroundOverlayOpacity ?? 0.6;

  const baseSizeDimensions = getSizeDimensions(config.size || "medium", config.previewMode);

  const sizeDimensions =
    showImage && isVertical ? getSizeDimensions("large", config.previewMode) : baseSizeDimensions;

  // Auto-close timer (migrated from BasePopup)
  useEffect(() => {
    if (!isVisible || !config.autoCloseDelay || config.autoCloseDelay <= 0) return;

    const timer = setTimeout(onClose, config.autoCloseDelay * 1000);
    return () => clearTimeout(timer);
  }, [isVisible, config.autoCloseDelay, onClose]);

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
      }}
      position={config.position || "center"}
      closeOnEscape={config.closeOnEscape !== false}
      closeOnBackdropClick={config.closeOnOverlayClick !== false}
      previewMode={config.previewMode}
      showBranding={config.showBranding}
      ariaLabel={config.ariaLabel || config.headline}
      ariaDescribedBy={config.ariaDescribedBy}
      customCSS={config.customCSS}
      globalCustomCSS={config.globalCustomCSS}
    >
      <div className="scratch-popup-container" data-splitpop="true" data-template="scratch-card">
        {/* Full Background Mode */}
        {isFullBackground && (
          <>
            <div className="scratch-full-bg-image">
              <img src={config.imageUrl} alt="" aria-hidden="true" />
            </div>
            <div
              className="scratch-full-bg-overlay"
              style={{
                background: config.backgroundColor || "#ffffff",
                opacity: bgOverlayOpacity
              }}
            />
          </>
        )}
        <div
          className={`scratch-popup-content ${
            !showImage && !isFullBackground ? "single-column" : isVertical && !isFullBackground ? "vertical" : "horizontal"
          } ${!imageFirst && showImage ? "reverse" : ""} ${isFullBackground ? "full-bg-mode" : ""}`}
          style={isFullBackground ? { position: "relative", zIndex: 2 } : undefined}
        >
          {showImage && (
            <div
              className="scratch-popup-image"
              style={{ background: config.imageBgColor || "#F3F4F6" }}
            >
              <img src={config.imageUrl} alt={config.headline || "Scratch Card"} />
            </div>
          )}

          <div className="scratch-popup-form-section">
            {/* Headline */}
            <div style={{ textAlign: "center" }}>
              <h2
                style={{
                  fontSize: config.titleFontSize || "28px",
                  fontWeight: config.titleFontWeight || 700,
                  margin: "0 0 8px 0",
                  textShadow: config.titleTextShadow,
                }}
              >
                {config.headline}
              </h2>
              {(config.subheadline || showEmailForm) && (
                <p
                  style={{
                    fontSize: config.descriptionFontSize || "16px",
                    fontWeight: config.descriptionFontWeight || 400,
                    margin: 0,
                    opacity: 0.8,
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
              // Email form
              <form
                onSubmit={handleEmailSubmit}
                style={{
                  width: "100%",
                  maxWidth: "400px",
                  display: "flex",
                  flexDirection: "column",
                  gap: "16px",
                  margin: "0 auto",
                }}
              >
                <EmailInput
                  value={formState.email}
                  onChange={setEmail}
                  placeholder={config.emailPlaceholder || "Enter your email"}
                  label={config.emailLabel || "Email Address"}
                  error={errors.email}
                  required={true}
                  disabled={isSubmitting}
                  accentColor={config.accentColor}
                  textColor={config.inputTextColor || config.textColor}
                  backgroundColor={config.inputBackgroundColor}
                  borderColor={config.inputBorderColor}
                />

                {config.consentFieldEnabled && (
                  <GdprCheckbox
                    checked={formState.gdprConsent}
                    onChange={setGdprConsent}
                    text={config.consentFieldText}
                    error={errors.gdpr}
                    required={config.consentFieldRequired}
                    disabled={isSubmitting}
                    accentColor={config.accentColor || config.buttonColor}
                    textColor={config.textColor}
                    privacyPolicyUrl={config.privacyPolicyUrl}
                  />
                )}

                <SubmitButton
                  type="submit"
                  loading={isSubmitting}
                  disabled={isSubmitting}
                  buttonColor={config.buttonColor}
                  accentColor={config.accentColor}
                  textColor={config.buttonTextColor}
                >
                  Unlock Scratch Card
                </SubmitButton>

                {/* Dismiss button for email-before-scratching form */}
                <div style={{ marginTop: "16px", textAlign: "center" }}>
                  <button
                    type="button"
                    className="scratch-popup-dismiss-button"
                    onClick={onClose}
                  >
                    {config.dismissLabel || "No thanks"}
                  </button>
                </div>
              </form>
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
                      <div className="scratch-particles-layer" style={{ position: "absolute", inset: 0, zIndex: 3, pointerEvents: "none", overflow: "hidden" }}>
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
                          style={{ width: `${Math.min(100, (scratchPercentage / threshold) * 100)}%` }}
                        />
                      </div>
                    )}

                    {/* Enhanced celebration effects on reveal */}
                    {isRevealed && wonPrize?.discountCode && (
                      <>
                        {/* Sparkle burst */}
                        <div className="scratch-sparkle-burst">
                          {[...Array(12)].map((_, i) => (
                            <div key={i} className="scratch-sparkle" style={{ "--sparkle-angle": `${i * 30}deg` } as React.CSSProperties} />
                          ))}
                        </div>

                        {/* Star effects */}
                        <div className="scratch-star" style={{ left: "15%", top: "20%" }}>⭐</div>
                        <div className="scratch-star" style={{ left: "85%", top: "25%" }}>✨</div>
                        <div className="scratch-star" style={{ left: "50%", top: "10%" }}>🌟</div>

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
                    {isRevealed &&
                      wonPrize &&
                      wonPrize.discountCode &&
                      !config.emailRequired && (
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
                              label="🎉 Your Code:"
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

                  {/* Progress indicator */}
                  {scratchPercentage > 0 && scratchPercentage < threshold && (
                    <div style={{ width: "100%", maxWidth: cardWidth, margin: "0 auto" }}>
                      <div
                        style={{
                          height: "8px",
                          backgroundColor: "#E5E7EB",
                          borderRadius: "4px",
                          overflow: "hidden",
                        }}
                      >
                        <div
                          style={{
                            height: "100%",
                            width: `${scratchPercentage}%`,
                            backgroundColor: config.accentColor || config.buttonColor,
                            transition: "width 0.3s",
                          }}
                        />
                      </div>
                      <p
                        className="scratch-progress"
                        style={{ fontSize: "12px", marginTop: "4px" }}
                      >
                        {Math.round(scratchPercentage)}% revealed
                      </p>
                    </div>
                  )}

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

                  {/* Post-reveal email capture - Scenario 3: Email required after scratching */}
                  {isRevealed &&
                    config.emailRequired &&
                    !config.emailBeforeScratching &&
                    !emailSubmitted && (
                      <form
                        onSubmit={handleEmailSubmit}
                        style={{
                          marginTop: "1.5rem",
                          display: "flex",
                          flexDirection: "column",
                          gap: "1rem",
                          maxWidth: "400px",
                          marginLeft: "auto",
                          marginRight: "auto",
                        }}
                      >
                        <div>
                          <EmailInput
                            value={formState.email}
                            onChange={setEmail}
                            placeholder={config.emailPlaceholder || "Enter your email"}
                            label={
                              config.emailLabel || "Enter your email to receive your discount code"
                            }
                            error={errors.email}
                            required={true}
                            disabled={isSubmitting || isSubmittingEmail}
                            accentColor={config.accentColor}
                            textColor={config.inputTextColor || config.textColor}
                            backgroundColor={config.inputBackgroundColor}
                            borderColor={config.inputBorderColor}
                          />

                          {config.consentFieldEnabled && (
                            <GdprCheckbox
                              checked={formState.gdprConsent}
                              onChange={setGdprConsent}
                              text={config.consentFieldText}
                              error={errors.gdpr}
                              required={config.consentFieldRequired}
                              disabled={isSubmitting || isSubmittingEmail}
                              accentColor={config.accentColor}
                              textColor={config.textColor}
                              privacyPolicyUrl={config.privacyPolicyUrl}
                            />
                          )}
                        </div>

                        <SubmitButton
                          type="submit"
                          loading={isSubmitting || isSubmittingEmail}
                          disabled={isSubmitting || isSubmittingEmail}
                          buttonColor={config.buttonColor}
                          accentColor={config.accentColor}
                          textColor={config.buttonTextColor}
                        >
                          {config.buttonText || "Get My Discount Code"}
                        </SubmitButton>
                      </form>
                    )}

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
                              color: config.descriptionColor || "rgba(0,0,0,0.7)",
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
                          backgroundColor: config.buttonColor || "#22c55e",
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
                        {isRevealed ? "Close" : (config.dismissLabel || "No thanks")}
                      </button>
                    </div>
                  )}
                </>
              )
            )}
          </div>
        </div>

        <style>{`
        .scratch-popup-container {
          position: relative;
          width: ${sizeDimensions.width};
          max-width: ${sizeDimensions.maxWidth};
          margin: 0 auto;
          border-radius: ${typeof config.borderRadius === "number" ? config.borderRadius : parseFloat(String(config.borderRadius || 16))}px;
          overflow: hidden;
          box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.25);
          background: ${config.backgroundColor};
          color: ${config.textColor};
          container-type: inline-size;
          container-name: scratch-popup;
          font-family: ${config.fontFamily || "inherit"};
        }

        /* Full Background Mode Styles */
        .scratch-full-bg-image {
          position: absolute;
          inset: 0;
          z-index: 0;
        }

        .scratch-full-bg-image img {
          width: 100%;
          height: 100%;
          object-fit: cover;
        }

        .scratch-full-bg-overlay {
          position: absolute;
          inset: 0;
          z-index: 1;
        }

        .scratch-popup-content.full-bg-mode {
          position: relative;
          z-index: 2;
        }

        @container scratch-popup (max-width: 640px) {
          .scratch-popup-container {
            width: 100%;
            max-width: 100%;
          }
        }

        .scratch-popup-content {
          display: flex;
          width: 100%;
          height: 100%;
          align-items: stretch;
        }

        .scratch-popup-content.horizontal {
          flex-direction: column;
        }

        .scratch-popup-content.horizontal.reverse {
          flex-direction: column-reverse;
        }

        .scratch-popup-content.vertical {
          flex-direction: column;
        }

        .scratch-popup-content.vertical.reverse {
          flex-direction: column;
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
          background: ${config.imageBgColor || config.inputBackgroundColor || "#f4f4f5"};
          width: 100%;
        }

        .scratch-popup-image img {
          position: absolute;
          inset: 0;
          width: 100%;
          height: 100%;
          object-fit: cover;
        }

        .scratch-popup-form-section {
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
          box-shadow: 0 0 0 3px rgba(0, 0, 0, 0.08);
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
          color: ${config.descriptionColor || "rgba(15, 23, 42, 0.7)"};
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
        .scratch-confetti:nth-child(5) { width: 9px; height: 9px; background: #10b981; left: 45%; top: 12%; animation: confettiDrop 1.25s ease-out 0.2s forwards; }
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

        /* Container Query: Mobile layout (<480px container width)
           Stack vertically with constrained image height. */
        @container scratch-popup (max-width: 479px) {
          .scratch-popup-content.horizontal .scratch-popup-image,
          .scratch-popup-content.vertical .scratch-popup-image {
            height: 12rem;
          }
        }

        /* Container Query: Desktop-ish layout (≥480px container width)
           Match NewsletterPopup behavior so left/right images go side-by-side
           once the popup has enough width, even inside the editor preview. */
        @container scratch-popup (min-width: 480px) {
          .scratch-popup-content.vertical {
            flex-direction: row;
            min-height: 450px;
          }

          .scratch-popup-content.vertical.reverse {
            flex-direction: row-reverse;
          }

          .scratch-popup-content.horizontal .scratch-popup-image {
            height: 16rem;
          }

          .scratch-popup-content.vertical .scratch-popup-image {
            flex: 1 1 50%;
            height: auto;
            min-height: 400px;
          }

          .scratch-popup-content.vertical .scratch-popup-form-section {
            flex: 1 1 50%;
          }

          .scratch-popup-form-section {
            padding: 4rem 3.5rem;
          }

          .scratch-popup-content.single-column .scratch-popup-form-section {
            max-width: 36rem;
            margin: 0 auto;
          }
        }

      `}</style>
      </div>
    </PopupPortal>
  );
};
