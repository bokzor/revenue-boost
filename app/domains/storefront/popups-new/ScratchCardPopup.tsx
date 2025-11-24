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

import React, { useState, useCallback, useRef, useEffect } from 'react';
import { PopupPortal } from './PopupPortal';
import type { PopupDesignConfig, Prize } from './types';
import type { ScratchCardContent } from '~/domains/campaigns/types/campaign';
import { validateEmail, copyToClipboard, getSizeDimensions } from './utils';
import { challengeTokenStore } from '~/domains/storefront/services/challenge-token.client';

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
  challengeToken?: string; // Pre-loaded challenge token from PopupManager

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
  onSubmit?: (email: string) => Promise<void>;
  onReveal?: (prize: Prize) => void;
}

export const ScratchCardPopup: React.FC<ScratchCardPopupProps> = ({
  config,
  isVisible,
  onClose,
  onSubmit,
  onReveal,
}) => {
  const [email, setEmail] = useState('');
  const [emailError, setEmailError] = useState('');
  const [gdprConsent, setGdprConsent] = useState(false);
  const [gdprError, setGdprError] = useState('');
  const [emailSubmitted, setEmailSubmitted] = useState(false);
  const [isScratching, setIsScratching] = useState(false);
  const [scratchPercentage, setScratchPercentage] = useState(0);
  const [isRevealed, setIsRevealed] = useState(false);
  const [wonPrize, setWonPrize] = useState<Prize | null>(null);
  const [copiedCode, setCopiedCode] = useState(false);

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
  const fetchPrize = useCallback(async (emailToUse?: string) => {
    if (config.previewMode) {
      // Preview mode: select random prize locally
      console.log('[Scratch Card] Preview mode - selecting random prize locally');
      const prizes = config.prizes || [];
      if (prizes.length > 0) {
        const randomPrize = prizes[Math.floor(Math.random() * prizes.length)];
        setWonPrize(randomPrize);
      }
      return;
    }

    const emailValue = emailToUse || email;
    if (!config.campaignId) {
      console.error('[Scratch Card] No campaign ID available');
      return;
    }

    try {
      // Get sessionId from the correct sessionStorage key
      const sessionId = typeof window !== 'undefined'
        ? (window.sessionStorage?.getItem('revenue_boost_session') ||
          window.sessionStorage?.getItem('rb_session_id'))
        : undefined;

      // Get challenge token - prefer from config (passed by PopupManager), fallback to store
      const challengeToken = config.challengeToken || challengeTokenStore.get(config.campaignId);

      if (!sessionId) {
        console.error('[Scratch Card] No session ID available', {
          hasWindow: typeof window !== 'undefined',
          sessionStorageKeys: typeof window !== 'undefined'
            ? Object.keys(window.sessionStorage || {})
            : []
        });
        return;
      }

      if (!challengeToken) {
        console.error('[Scratch Card] No challenge token available', {
          fromConfig: !!config.challengeToken,
          fromStore: !!challengeTokenStore.get(config.campaignId),
          campaignId: config.campaignId,
          previewMode: config.previewMode,
        });
        return;
      }

      console.log('[Scratch Card] Fetching prize from server', {
        campaignId: config.campaignId,
        hasEmail: !!emailValue,
        hasSessionId: !!sessionId,
        hasChallengeToken: !!challengeToken,
      });

      const requestBody: any = {
        campaignId: config.campaignId,
        sessionId: sessionId,
        challengeToken: challengeToken,
      };

      // Only include email if it's provided
      if (emailValue) {
        requestBody.email = emailValue;
      }

      const response = await fetch('/apps/revenue-boost/api/popups/scratch-card', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(requestBody),
      });

      const data = await response.json();

      if (data.success && data.prize && data.discountCode) {
        const serverPrize: Prize = {
          id: data.prize.id,
          label: data.prize.label,
          probability: 0, // Not needed
          generatedCode: data.discountCode,
          discountCode: data.discountCode, // For backward compatibility
        };
        setWonPrize(serverPrize);
        console.log('[Scratch Card] Prize fetched successfully:', {
          prizeLabel: serverPrize.label,
          hasDiscountCode: !!serverPrize.discountCode,
          emailProvided: !!emailValue,
        });
      } else {
        console.error('[Scratch Card] Failed to fetch prize:', {
          error: data.error,
          details: data.details,
          errors: data.errors,
          success: data.success,
        });
        // Fallback or error handling?
        // For now, maybe set a default error prize or keep it null (loading)
      }
    } catch (error) {
      console.error('[Scratch Card] Network error fetching prize:', error);
    }
    // Note: email is NOT in dependencies to prevent re-fetching on every keystroke
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [config.campaignId, config.previewMode, config.prizes]);

  // Initialize canvases (prize + scratch overlay)
  useEffect(() => {
    if (!canvasRef.current || !prizeCanvasRef.current) return;
    if (config.emailRequired && config.emailBeforeScratching && !emailSubmitted) return;

    const canvas = canvasRef.current;
    const prizeCanvas = prizeCanvasRef.current;
    const ctx = canvas.getContext('2d');
    const prizeCtx = prizeCanvas.getContext('2d');

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
      gradient.addColorStop(0, config.accentColor || config.buttonColor || '#4f46e5');
      gradient.addColorStop(1, config.buttonColor || config.accentColor || '#ec4899');
      prizeCtx.fillStyle = gradient;
      prizeCtx.fillRect(0, 0, cardWidth, cardHeight);
    }

    // Select and draw prize label
    if (wonPrize) {
      prizeCtx.fillStyle =
        config.scratchCardTextColor ||
        config.buttonTextColor ||
        config.textColor ||
        '#ffffff';
      prizeCtx.font = 'bold 32px system-ui, -apple-system, BlinkMacSystemFont, sans-serif';
      prizeCtx.textAlign = 'center';
      prizeCtx.textBaseline = 'middle';
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
        prizeCtx.lineCap = 'round';

        prizeCtx.beginPath();
        prizeCtx.moveTo(
          Math.cos(angle) * (spinnerRadius - lineWidth),
          Math.sin(angle) * (spinnerRadius - lineWidth)
        );
        prizeCtx.lineTo(
          Math.cos(angle) * spinnerRadius,
          Math.sin(angle) * spinnerRadius
        );
        prizeCtx.stroke();
      }

      prizeCtx.restore();
    }

    // Draw scratch overlay
    ctx.globalCompositeOperation = 'source-over';
    ctx.fillStyle = config.scratchOverlayColor || '#C0C0C0';
    ctx.fillRect(0, 0, cardWidth, cardHeight);

    // Add scratch text on overlay
    ctx.fillStyle = '#FFFFFF';
    ctx.font = '600 28px system-ui, -apple-system, BlinkMacSystemFont, sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(
      config.scratchInstruction || 'Scratch to reveal!',
      cardWidth / 2,
      cardHeight / 2
    );

    // Add sparkles / pattern on overlay
    ctx.globalAlpha = 0.3;
    const sparkleColor = config.accentColor || config.buttonColor || '#FFFFFF';
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
    ctx.globalCompositeOperation = 'destination-out';
  }, [emailSubmitted, config, cardWidth, cardHeight, wonPrize]);

  // Calculate scratch percentage
  const calculateScratchPercentage = useCallback(() => {
    if (!canvasRef.current) return 0;

    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
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
  const scratch = useCallback((x: number, y: number) => {
    if (!canvasRef.current) return;

    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

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
  }, [brushRadius, calculateScratchPercentage, threshold, isRevealed, wonPrize, onReveal]);

  // Mouse/touch event handlers
  const getCoordinates = (e: React.MouseEvent | React.TouchEvent): { x: number; y: number } | null => {
    if (!canvasRef.current) return null;

    const canvas = canvasRef.current;
    const rect = canvas.getBoundingClientRect();

    // Account for CSS scaling (canvas width/height vs. displayed size)
    const scaleX = canvas.width / rect.width || 1;
    const scaleY = canvas.height / rect.height || 1;

    let clientX: number, clientY: number;

    if ('touches' in e) {
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
  const handleMouseStart = (e: React.MouseEvent<HTMLCanvasElement>) => handleStart(e as unknown as React.MouseEvent<Element>);
  const handleMouseMove = (e: React.MouseEvent<HTMLCanvasElement>) => handleMove(e as unknown as React.MouseEvent<Element>);
  const handleMouseEnd = (_e: React.MouseEvent<HTMLCanvasElement>) => handleEnd();
  const handleTouchStart = (e: React.TouchEvent<HTMLCanvasElement>) => handleStart(e as unknown as React.TouchEvent<Element>);
  const handleTouchMove = (e: React.TouchEvent<HTMLCanvasElement>) => handleMove(e as unknown as React.TouchEvent<Element>);
  const handleTouchEnd = (_e: React.TouchEvent<HTMLCanvasElement>) => handleEnd();


  const handleEmailSubmit: React.FormEventHandler<HTMLFormElement> = useCallback(async (e) => {
    e.preventDefault();

    let hasError = false;

    if (!validateEmail(email)) {
      setEmailError('Please enter a valid email address');
      hasError = true;
    } else {
      setEmailError('');
    }

    if (config.showGdprCheckbox && !gdprConsent) {
      setGdprError('You must accept the terms to continue');
      hasError = true;
    } else {
      setGdprError('');
    }

    if (hasError) return;

    try {
      if (!config.previewMode && onSubmit) {
        await onSubmit(email);
      }
      setEmailSubmitted(true);
      // Fetch prize after email submission (if email is required before scratching)
      if (config.emailBeforeScratching) {
        fetchPrize(email);
      }
    } catch (error) {
      setEmailError('Something went wrong. Please try again.');
    }
  }, [email, gdprConsent, config.showGdprCheckbox, config.previewMode, onSubmit, config.emailBeforeScratching, fetchPrize]);

  // Fetch prize on mount if email is not required before scratching
  useEffect(() => {
    if (isVisible && !wonPrize && (!config.emailRequired || !config.emailBeforeScratching)) {
      console.log('[Scratch Card] Auto-fetching prize on mount:', {
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

  const handleCopyCode = useCallback(async () => {
    if (wonPrize?.discountCode) {
      const success = await copyToClipboard(wonPrize?.discountCode ?? '');
      if (success) {
        setCopiedCode(true);
        setTimeout(() => setCopiedCode(false), 2000);
      }
    }
  }, [wonPrize]);

  const inputStyles: React.CSSProperties = {
    width: '100%',
    padding: '12px 16px',
    fontSize: '16px',
    border: `1px solid ${config.inputBorderColor || '#D1D5DB'}`,
    borderRadius: `${config.borderRadius ?? 8}px`,
    backgroundColor: config.inputBackgroundColor || '#FFFFFF',
    color: config.inputTextColor || config.textColor || '#1F2937',
    outline: 'none',
  };

  const buttonStyles: React.CSSProperties = {
    width: '100%',
    padding: '14px 24px',
    fontSize: '16px',
    fontWeight: 600,
    border: 'none',
    borderRadius: `${config.borderRadius ?? 8}px`,
    backgroundColor: config.buttonColor,
    color: config.buttonTextColor,
    cursor: 'pointer',
  };

  const showEmailForm = config.emailRequired && config.emailBeforeScratching && !emailSubmitted;
  const showScratchCard = !showEmailForm;

  const imagePosition = config.imagePosition || 'left';
  const showImage = !!config.imageUrl && imagePosition !== 'none';
  const isVertical = imagePosition === 'left' || imagePosition === 'right';
  const imageFirst = imagePosition === 'left' || imagePosition === 'top';

  const baseSizeDimensions = getSizeDimensions(config.size || 'medium', config.previewMode);

  const sizeDimensions =
    showImage && isVertical
      ? getSizeDimensions('large', config.previewMode)
      : baseSizeDimensions;



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
        color: config.overlayColor || 'rgba(0, 0, 0, 1)',
        opacity: config.overlayOpacity ?? 0.6,
        blur: 4,
      }}
      animation={{
        type: config.animation || 'fade',
      }}
      position={config.position || 'center'}
      closeOnEscape={config.closeOnEscape !== false}
      closeOnBackdropClick={config.closeOnOverlayClick !== false}
      previewMode={config.previewMode}
      ariaLabel={config.ariaLabel || config.headline}
      ariaDescribedBy={config.ariaDescribedBy}
    >
      <div
        className="scratch-popup-container"
        data-splitpop="true"
        data-template="scratch-card"
      >
        <div
          className={`scratch-popup-content ${!showImage ? 'single-column' : isVertical ? 'vertical' : 'horizontal'
            } ${!imageFirst && showImage ? 'reverse' : ''}`}
        >
          {showImage && (
            <div
              className="scratch-popup-image"
              style={{ background: config.imageBgColor || '#F3F4F6' }}
            >
              <img
                src={config.imageUrl}
                alt={config.headline || 'Scratch Card'}
              />
            </div>
          )}

          <div className="scratch-popup-form-section">
            {/* Headline */}
            <div style={{ textAlign: 'center' }}>
              <h2
                style={{
                  fontSize: config.titleFontSize || '28px',
                  fontWeight: config.titleFontWeight || 700,
                  margin: '0 0 8px 0',
                  textShadow: config.titleTextShadow,
                }}
              >
                {config.headline}
              </h2>
              {(config.subheadline || showEmailForm) && (
                <p
                  style={{
                    fontSize: config.descriptionFontSize || '16px',
                    fontWeight: config.descriptionFontWeight || 400,
                    margin: 0,
                    opacity: 0.8,
                    color: config.descriptionColor || config.textColor,
                  }}
                >
                  {showEmailForm
                    ? 'Enter your email below to unlock your scratch card and reveal your prize!'
                    : config.subheadline}
                </p>
              )}
            </div>

            {showEmailForm ? (
              // Email form
              <form
                onSubmit={handleEmailSubmit}
                style={{
                  width: '100%',
                  maxWidth: '400px',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '16px',
                  margin: '0 auto',
                }}
              >
                <div>
                  <label
                    style={{
                      display: 'block',
                      marginBottom: '8px',
                      fontSize: '14px',
                      fontWeight: 600,
                    }}
                  >
                    {config.emailLabel || 'Email Address'}
                  </label>
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder={config.emailPlaceholder || 'Enter your email'}
                    style={inputStyles}
                    className={`scratch-popup-input ${emailError ? 'error' : ''}`}
                    required
                  />
                  {emailError && (
                    <p className="scratch-popup-error" style={{ margin: '6px 0 0 0' }}>
                      {emailError}
                    </p>
                  )}
                </div>
                {config.showGdprCheckbox && (
                  <div
                    style={{
                      display: 'flex',
                      alignItems: 'flex-start',
                      gap: '0.75rem',
                    }}
                  >
                    <input
                      type="checkbox"
                      checked={gdprConsent}
                      onChange={(e) => {
                        setGdprConsent(e.target.checked);
                        if (gdprError) setGdprError('');
                      }}
                      className="scratch-popup-checkbox"
                      style={{
                        borderColor: gdprError ? '#dc2626' : (config.inputBorderColor || '#d4d4d8'),
                      }}
                    />
                    <div style={{ flex: 1 }}>
                      <label
                        style={{
                          fontSize: '0.875rem',
                          lineHeight: 1.6,
                          cursor: 'pointer',
                        }}
                      >
                        {config.gdprLabel || 'I agree to receive promotional emails'}
                      </label>
                      {gdprError && (
                        <div className="scratch-popup-error">{gdprError}</div>
                      )}
                    </div>
                  </div>
                )}

                <button type="submit" style={buttonStyles} className="scratch-popup-button">
                  {'Unlock Scratch Card'}
                </button>
              </form>
            ) : showScratchCard && (
              // Scratch card
              <>
                <div
                  className={`scratch-card-container ${isRevealed ? 'revealed-animation' : ''}`}
                  style={{ height: cardHeight }}
                >
                  {/* Prize canvas (hidden) */}
                  <canvas
                    ref={prizeCanvasRef}
                    width={cardWidth}
                    height={cardHeight}
                    style={{ position: 'absolute', inset: 0, width: '100%', height: '100%' }}
                  />

                  {/* Scratch overlay canvas */}
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
                      cursor: isScratching ? 'grabbing' : 'grab',
                      touchAction: 'none',
                      width: '100%',
                      height: '100%',
                    }}
                  />

                  {/* Code overlay inside card after reveal */}
                  {isRevealed && wonPrize && wonPrize.discountCode && (
                    <div
                      className="scratch-card-code-overlay"
                      style={{
                        position: 'absolute',
                        inset: 0,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        pointerEvents: 'none',
                      }}
                    >
                      <div
                        style={{
                          padding: '0.75rem 1.5rem',
                          background: 'rgba(255, 255, 255, 0.2)',
                          borderRadius: '0.5rem',
                          border: '2px dashed rgba(255, 255, 255, 0.5)',
                          backdropFilter: 'blur(10px)',
                          pointerEvents: 'auto',
                          display: 'flex',
                          flexDirection: 'column',
                          alignItems: 'center',
                          gap: '0.5rem',
                        }}
                      >
                        <div
                          style={{
                            fontSize: '0.875rem',
                            fontWeight: 500,
                            color: '#ffffff',
                            marginBottom: '0.25rem',
                          }}
                        >
                          Code:
                        </div>
                        <div
                          style={{
                            fontSize: '1.5rem',
                            fontWeight: 700,
                            color: '#ffffff',
                            letterSpacing: '0.1em',
                          }}
                        >
                          {wonPrize?.discountCode ?? ''}
                        </div>
                        <button
                          type="button"
                          onClick={handleCopyCode}
                          className="scratch-popup-button"
                          style={{
                            width: 'auto',
                            padding: '0.4rem 0.9rem',
                            fontSize: '0.75rem',
                            fontWeight: 600,
                            borderRadius: '9999px',
                            backgroundColor: config.buttonColor,
                            color: config.buttonTextColor,
                            border: 'none',
                          }}
                        >
                          {copiedCode ? '\u2713 Copied!' : 'Copy'}
                        </button>
                      </div>
                    </div>
                  )}
                </div>

                {/* Progress indicator */}
                {scratchPercentage > 0 && scratchPercentage < threshold && (
                  <div style={{ width: '100%', maxWidth: cardWidth, margin: '0 auto' }}>
                    <div
                      style={{
                        height: '8px',
                        backgroundColor: '#E5E7EB',
                        borderRadius: '4px',
                        overflow: 'hidden',
                      }}
                    >
                      <div
                        style={{
                          height: '100%',
                          width: `${scratchPercentage}%`,
                          backgroundColor: config.accentColor || config.buttonColor,
                          transition: 'width 0.3s',
                        }}
                      />
                    </div>
                    <p
                      className="scratch-progress"
                      style={{ fontSize: '12px', marginTop: '4px' }}
                    >
                      {Math.round(scratchPercentage)}% revealed
                    </p>
                  </div>
                )}

                {/* Prize reveal fallback (non-discount prizes) */}
                {isRevealed && wonPrize && !wonPrize.discountCode && (
                  <div
                    style={{
                      marginTop: '16px',
                      padding: '20px',
                      backgroundColor: config.accentColor || '#F3F4F6',
                      borderRadius: '12px',
                      width: '100%',
                      maxWidth: '400px',
                      marginLeft: 'auto',
                      marginRight: 'auto',
                    }}
                  >
                    <p
                      style={{
                        fontSize: '14px',
                        margin: '0 0 12px 0',
                        textAlign: 'center',
                        opacity: 0.8,
                      }}
                    >
                      {config.successMessage || `Congratulations! You won ${wonPrize.label}.`}
                    </p>
                  </div>
                )}

                {/* Post-reveal email capture (mockup-style) */}
                {isRevealed && config.emailRequired && !config.emailBeforeScratching && !emailSubmitted && (
                  <form
                    onSubmit={handleEmailSubmit}
                    style={{
                      marginTop: '1.5rem',
                      display: 'flex',
                      flexDirection: 'column',
                      gap: '1rem',
                      maxWidth: '400px',
                      marginLeft: 'auto',
                      marginRight: 'auto',
                    }}
                  >
                    <div>
                      <label
                        style={{
                          display: 'block',
                          fontSize: '0.875rem',
                          fontWeight: 500,
                          marginBottom: '0.5rem',
                        }}
                      >
                        {config.emailLabel || 'Enter your email to claim your prize'}
                      </label>
                      <input
                        type="email"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        placeholder={config.emailPlaceholder || 'Enter your email'}
                        style={inputStyles}
                        className={`scratch-popup-input ${emailError ? 'error' : ''}`}
                        required
                      />
                      {emailError && (
                        <div className="scratch-popup-error">{emailError}</div>
                      )}
                      {config.showGdprCheckbox && (
                        <div
                          style={{
                            display: 'flex',
                            alignItems: 'flex-start',
                            gap: '0.75rem',
                            marginTop: '0.75rem',
                          }}
                        >
                          <input
                            type="checkbox"
                            checked={gdprConsent}
                            onChange={(e) => {
                              setGdprConsent(e.target.checked);
                              if (gdprError) setGdprError('');
                            }}
                            className="scratch-popup-checkbox"
                            style={{
                              borderColor: gdprError ? '#dc2626' : (config.inputBorderColor || '#d4d4d8'),
                            }}
                          />
                          <div style={{ flex: 1 }}>
                            <label
                              style={{
                                fontSize: '0.875rem',
                                lineHeight: 1.6,
                                cursor: 'pointer',
                              }}
                            >
                              {config.gdprLabel || 'I agree to receive promotional emails'}
                            </label>
                            {gdprError && (
                              <div className="scratch-popup-error">{gdprError}</div>
                            )}
                          </div>
                        </div>
                      )}
                    </div>

                    <button
                      type="submit"
                      className="scratch-popup-button"
                      style={{
                        backgroundColor: config.buttonColor,
                        color: config.buttonTextColor,
                      }}
                    >
                      {config.buttonText || 'Claim Prize'}
                    </button>
                  </form>
                )}

                {/* Success state after claiming prize */}
                {emailSubmitted && !config.emailBeforeScratching && (
                  <div style={{ textAlign: 'center', padding: '2rem 0' }}>
                    <div className="scratch-popup-success-icon">
                      <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="#16a34a" strokeWidth="3">
                        <polyline points="20 6 9 17 4 12" />
                      </svg>
                    </div>
                    <h3
                      style={{
                        fontSize: '1.875rem',
                        fontWeight: 700,
                        marginBottom: '0.75rem',
                      }}
                    >
                      Prize Claimed!
                    </h3>
                    <p
                      style={{
                        color: config.descriptionColor || 'rgba(0,0,0,0.7)',
                        lineHeight: 1.6,
                      }}
                    >
                      Check your email for details on how to redeem your prize.
                    </p>
                  </div>
                )}

                <div style={{ marginTop: '16px', textAlign: 'center' }}>
                  <button
                    type="button"
                    className="scratch-popup-dismiss-button"
                    onClick={onClose}
                  >
                    {config.dismissLabel || 'No thanks'}
                  </button>
                </div>
              </>
            )}
          </div>
        </div>

        <style>{`
        .scratch-popup-container {
          position: relative;
          width: ${sizeDimensions.width};
          max-width: ${sizeDimensions.maxWidth};
          margin: 0 auto;
          border-radius: ${typeof config.borderRadius === 'number' ? config.borderRadius : parseFloat(String(config.borderRadius || 16))}px;
          overflow: hidden;
          box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.25);
          background: ${config.backgroundColor};
          color: ${config.textColor};
          container-type: inline-size;
          container-name: scratch-popup;
          font-family: ${config.fontFamily || 'inherit'};
        }

        @container scratch-popup (max-width: 640px) {
          .scratch-popup-container {
            width: 100%;
            max-width: 100%;
          }
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
          gap: 1.25rem;
        }

        .scratch-card-container {
          position: relative;
          width: 100%;
          max-width: min(24rem, 90vw);
          margin: 0 auto 1.5rem;
          border-radius: 0.75rem;
          overflow: hidden;
          box-shadow: 0 10px 30px -5px rgba(0, 0, 0, 0.2);
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

        .scratch-popup-dismiss-button {
          margin-top: 0.75rem;
          background: transparent;
          border: none;
          color: ${config.descriptionColor || 'rgba(15, 23, 42, 0.7)'};
          font-size: 0.875rem;
          cursor: pointer;
        }

        .scratch-popup-dismiss-button:hover {
          text-decoration: underline;
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

        /* Container Query: Desktop-ish layout (≥480px container width)
           Match NewsletterPopup behavior so left/right images go side-by-side
           once the popup has enough width, even inside the editor preview. */
        @container scratch-popup (min-width: 480px) {
          .scratch-popup-content.vertical {
            flex-direction: row;
          }

          .scratch-popup-content.vertical.reverse {
            flex-direction: row-reverse;
          }

          .scratch-popup-content.horizontal .scratch-popup-image {
            height: 16rem;
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
          }
        }

        /* Container Query: Mobile layout (640px container width)
           Use full width for the popup and constrain image height. */
        @container scratch-popup (max-width: 640px) {
          .scratch-popup-content.horizontal .scratch-popup-image,
          .scratch-popup-content.vertical .scratch-popup-image {
            height: 12rem;
          }
        }

      `}</style>
      </div>
    </PopupPortal>
  );
};

