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
 */

import React, { useState, useCallback, useRef, useEffect } from "react";
import { PopupPortal } from "./PopupPortal";
import type { PopupDesignConfig, Prize } from "./types";
import type { ScratchCardContent } from "~/domains/campaigns/types/campaign";
import { getSizeDimensions } from "./utils";
import { POPUP_SPACING } from "./spacing";

// Import custom hooks
import { usePopupForm, useDiscountCode, usePopupAnimation } from "./hooks";

// Import reusable components
import { EmailInput, GdprCheckbox, SubmitButton } from "./components";

// Import shared components from Phase 1 & 2
import { DiscountCodeDisplay } from "./components/shared";

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

  // Consent (GDPR-style checkbox)
  showGdprCheckbox?: boolean;
  gdprLabel?: string;

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
    handleSubmit: handleFormSubmit,
    validateForm,
    isSubmitting,
    isSubmitted: _isSubmitted,
  } = usePopupForm({
    config: {
      emailRequired: config.emailRequired,
      emailErrorMessage: undefined,
      consentFieldEnabled: config.showGdprCheckbox,
      consentFieldRequired: config.showGdprCheckbox,
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

  const canvasRef = useRef<HTMLCanvasElement>(null);
  const prizeCanvasRef = useRef<HTMLCanvasElement>(null);
  const isDrawingRef = useRef(false);

  const DEFAULT_CARD_WIDTH = 384;
  const DEFAULT_CARD_HEIGHT = 216;

  const cardWidth = config.scratchCardWidth || DEFAULT_CARD_WIDTH;
  const cardHeight = config.scratchCardHeight || DEFAULT_CARD_HEIGHT;
  const threshold = config.scratchThreshold || 50;
  const brushRadius = config.scratchRadius || 20;

  // Fetch prize from server
  // Note: email is passed as a parameter to avoid triggering re-fetches on every keystroke
  const fetchPrize = useCallback(
    async (emailToUse?: string) => {
      if (config.previewMode) {
        // Preview mode: select random prize locally and generate mock discount code
        console.log("[Scratch Card] Preview mode - selecting random prize locally");
        const prizes = config.prizes || [];
        if (prizes.length > 0) {
          const randomPrize = prizes[Math.floor(Math.random() * prizes.length)];
          // Add mock discount code for preview (same pattern as SpinToWin)
          setWonPrize({
            ...randomPrize,
            generatedCode: "PREVIEW10",
            discountCode: "PREVIEW10",
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
      // Note: email is NOT in dependencies to prevent re-fetching on every keystroke
      // eslint-disable-next-line react-hooks/exhaustive-deps
    },
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

    // Draw scratch overlay
    ctx.globalCompositeOperation = "source-over";
    ctx.fillStyle = config.scratchOverlayColor || "#C0C0C0";
    ctx.fillRect(0, 0, cardWidth, cardHeight);

    // Add scratch text on overlay
    ctx.fillStyle = "#FFFFFF";
    ctx.font = "600 28px system-ui, -apple-system, BlinkMacSystemFont, sans-serif";
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillText(config.scratchInstruction || "Scratch to reveal!", cardWidth / 2, cardHeight / 2);

    // Add sparkles / pattern on overlay
    ctx.globalAlpha = 0.3;
    const sparkleColor = config.accentColor || config.buttonColor || "#FFFFFF";
    ctx.fillStyle = sparkleColor;
    for (let i = 0; i < 20; i++) {
      const x = Math.random() * cardWidth;
      const y = Math.random() * cardHeight;
      ctx.beginPath();
      ctx.arc(x, y, 2, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.globalAlpha = 1;

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

  // Scratch function
  const scratch = useCallback(
    (x: number, y: number) => {
      if (!canvasRef.current) return;

      const canvas = canvasRef.current;
      // Use willReadFrequently for better performance (consistent with calculateScratchPercentage)
      const ctx = canvas.getContext("2d", { willReadFrequently: true });
      if (!ctx) return;

      // Set composite operation to erase mode
      ctx.globalCompositeOperation = "destination-out";
      ctx.beginPath();
      ctx.arc(x, y, brushRadius, 0, 2 * Math.PI);
      ctx.fill();

      // Check scratch percentage
      const percentage = calculateScratchPercentage();
      setScratchPercentage(percentage);

      if (percentage >= threshold && !isRevealed) {
        setIsRevealed(true);
        if (wonPrize && onReveal) {
          onReveal(wonPrize);
        }
      }
    },
    [brushRadius, calculateScratchPercentage, threshold, isRevealed, wonPrize, onReveal]
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
    [handleFormSubmit, validateForm, config, formState, wonPrize, fetchPrize, setDiscountCode]
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

  const imagePosition = config.imagePosition || "left";
  const showImage = !!config.imageUrl && imagePosition !== "none";
  const isVertical = imagePosition === "left" || imagePosition === "right";
  const imageFirst = imagePosition === "left" || imagePosition === "top";

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
        <div
          className={`scratch-popup-content ${
            !showImage ? "single-column" : isVertical ? "vertical" : "horizontal"
          } ${!imageFirst && showImage ? "reverse" : ""}`}
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
                  accentColor={config.accentColor || config.buttonColor}
                  textColor={config.textColor}
                  backgroundColor={config.inputBackgroundColor}
                />

                {config.showGdprCheckbox && (
                  <GdprCheckbox
                    checked={formState.gdprConsent}
                    onChange={setGdprConsent}
                    text={config.gdprLabel || "I agree to receive promotional emails"}
                    error={errors.gdpr}
                    required={true}
                    disabled={isSubmitting}
                    accentColor={config.accentColor || config.buttonColor}
                    textColor={config.textColor}
                  />
                )}

                <SubmitButton
                  type="submit"
                  loading={isSubmitting}
                  disabled={isSubmitting}
                  accentColor={config.accentColor || config.buttonColor}
                  textColor={config.buttonTextColor}
                >
                  Unlock Scratch Card
                </SubmitButton>
              </form>
            ) : (
              showScratchCard && (
                // Scratch card
                <>
                  <div
                    className={`scratch-card-container ${isRevealed ? "revealed-animation" : ""}`}
                  >
                    {/* Prize canvas (bottom layer) */}
                    <canvas
                      ref={prizeCanvasRef}
                      width={cardWidth}
                      height={cardHeight}
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
                        cursor: isScratching ? "grabbing" : "grab",
                        touchAction: "none",
                        zIndex: 2,
                      }}
                    />

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
                              label="Code:"
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
                            accentColor={config.accentColor || config.buttonColor}
                            textColor={config.textColor}
                            backgroundColor={config.inputBackgroundColor}
                          />

                          {config.showGdprCheckbox && (
                            <GdprCheckbox
                              checked={formState.gdprConsent}
                              onChange={setGdprConsent}
                              text={config.gdprLabel || "I agree to receive promotional emails"}
                              error={errors.gdpr}
                              required={true}
                              disabled={isSubmitting || isSubmittingEmail}
                              accentColor={config.accentColor || config.buttonColor}
                              textColor={config.textColor}
                            />
                          )}
                        </div>

                        <SubmitButton
                          type="submit"
                          loading={isSubmitting || isSubmittingEmail}
                          disabled={isSubmitting || isSubmittingEmail}
                          accentColor={config.accentColor || config.buttonColor}
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
