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
import { BasePopup } from './BasePopup';
import type { PopupDesignConfig, Prize } from './types';
import type { ScratchCardContent } from '~/domains/campaigns/types/campaign';
import { validateEmail, copyToClipboard } from './utils';

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
  const [emailSubmitted, setEmailSubmitted] = useState(false);
  const [isScratching, setIsScratching] = useState(false);
  const [scratchPercentage, setScratchPercentage] = useState(0);
  const [isRevealed, setIsRevealed] = useState(false);
  const [wonPrize, setWonPrize] = useState<Prize | null>(null);
  const [copiedCode, setCopiedCode] = useState(false);

  const canvasRef = useRef<HTMLCanvasElement>(null);
  const prizeCanvasRef = useRef<HTMLCanvasElement>(null);
  const isDrawingRef = useRef(false);

  const cardWidth = config.scratchCardWidth || 300;
  const cardHeight = config.scratchCardHeight || 200;
  const threshold = config.scratchThreshold || 50;
  const brushRadius = config.scratchRadius || 20;

  // Select prize based on weighted probability
  const selectPrize = useCallback((): Prize => {
    const prizes = config.prizes || [];
    const totalProbability = prizes.reduce((sum, p) => sum + p.probability, 0);
    let random = Math.random() * totalProbability;

    for (const prize of prizes) {
      random -= prize.probability;
      if (random <= 0) {
        return prize;
      }
    }

    return prizes[0];
  }, [config.prizes]);

  // Initialize canvases
  useEffect(() => {
    if (!canvasRef.current || !prizeCanvasRef.current) return;
    if (!emailSubmitted && config.emailBeforeScratching) return;

    const canvas = canvasRef.current;
    const prizeCanvas = prizeCanvasRef.current;
    const ctx = canvas.getContext('2d');
    const prizeCtx = prizeCanvas.getContext('2d');

    if (!ctx || !prizeCtx) return;

    // Draw prize on hidden canvas
    const prize = selectPrize();
    setWonPrize(prize);

    prizeCtx.fillStyle = config.scratchCardBackgroundColor || '#FFFFFF';
    prizeCtx.fillRect(0, 0, cardWidth, cardHeight);
    prizeCtx.fillStyle = config.scratchCardTextColor || '#000000';
    prizeCtx.font = 'bold 32px Arial';
    prizeCtx.textAlign = 'center';
    prizeCtx.textBaseline = 'middle';
    prizeCtx.fillText(prize.label, cardWidth / 2, cardHeight / 2);

    // Draw scratch overlay
    ctx.fillStyle = config.scratchOverlayColor || '#C0C0C0';
    ctx.fillRect(0, 0, cardWidth, cardHeight);

    // Add text to overlay
    ctx.fillStyle = '#FFFFFF';
    ctx.font = 'bold 18px Arial';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(config.scratchInstruction || 'Scratch to reveal!', cardWidth / 2, cardHeight / 2);

    // Set composite operation for erasing
    ctx.globalCompositeOperation = 'destination-out';
  }, [emailSubmitted, config, cardWidth, cardHeight, selectPrize]);

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
      x: clientX - rect.left,
      y: clientY - rect.top,
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

    if (!validateEmail(email)) {
      setEmailError('Please enter a valid email address');
      return;
    }

    setEmailError('');

    try {
      if (!config.previewMode && onSubmit) {
        await onSubmit(email);
      }
      setEmailSubmitted(true);
    } catch (error) {
      setEmailError('Something went wrong. Please try again.');
    }
  }, [email, config.previewMode, onSubmit]);

  const handleCopyCode = useCallback(async () => {
    if (wonPrize?.discountCode) {
      const success = await copyToClipboard(wonPrize.discountCode);
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
    color: config.inputTextColor || '#1F2937',
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

  return (
    <BasePopup config={config} isVisible={isVisible} onClose={onClose}>
      <div style={{ display: 'flex', flexDirection: 'column', gap: '20px', alignItems: 'center' }}>
        {/* Headline */}
        <div style={{ textAlign: 'center' }}>
          <h2 style={{ fontSize: '28px', fontWeight: 700, margin: '0 0 8px 0' }}>
            {config.headline}
          </h2>
          {config.subheadline && (
            <p style={{ fontSize: '16px', margin: 0, opacity: 0.8 }}>
              {config.subheadline}
            </p>
          )}
        </div>

        {showEmailForm ? (
          // Email form
          <form onSubmit={handleEmailSubmit} style={{ width: '100%', maxWidth: '400px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
            <div>
              {config.emailLabel && (
                <label style={{ display: 'block', marginBottom: '8px', fontSize: '14px', fontWeight: 600 }}>
                  {config.emailLabel}
                </label>
              )}
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder={config.emailPlaceholder || 'Enter your email'}
                style={inputStyles}
                required
              />
              {emailError && (
                <p style={{ color: '#EF4444', fontSize: '14px', margin: '6px 0 0 0' }}>
                  {emailError}
                </p>
              )}
            </div>
            <button type="submit" style={buttonStyles}>
              {config.buttonText || 'Continue'}
            </button>
          </form>
        ) : showScratchCard && (
          // Scratch card
          <>
            <div style={{ position: 'relative', width: cardWidth, height: cardHeight, borderRadius: '12px', overflow: 'hidden', boxShadow: '0 4px 6px rgba(0,0,0,0.1)' }}>
              {/* Prize canvas (hidden) */}
              <canvas
                ref={prizeCanvasRef}
                width={cardWidth}
                height={cardHeight}
                style={{ position: 'absolute', top: 0, left: 0 }}
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
                style={{
                  position: 'absolute',
                  top: 0,
                  left: 0,
                  cursor: isScratching ? 'grabbing' : 'grab',
                  touchAction: 'none',
                }}
              />
            </div>

            {/* Progress indicator */}
            {scratchPercentage > 0 && scratchPercentage < threshold && (
              <div style={{ width: '100%', maxWidth: cardWidth }}>
                <div style={{
                  height: '8px',
                  backgroundColor: '#E5E7EB',
                  borderRadius: '4px',
                  overflow: 'hidden'
                }}>
                  <div style={{
                    height: '100%',
                    width: `${scratchPercentage}%`,
                    backgroundColor: config.accentColor || config.buttonColor,
                    transition: 'width 0.3s',
                  }} />
                </div>
                <p style={{ fontSize: '12px', textAlign: 'center', margin: '4px 0 0 0', opacity: 0.7 }}>
                  {Math.round(scratchPercentage)}% scratched
                </p>
              </div>
            )}

            {/* Prize reveal */}
            {isRevealed && wonPrize?.discountCode && (
              <div style={{ marginTop: '16px', padding: '20px', backgroundColor: config.accentColor || '#F3F4F6', borderRadius: '12px', width: '100%', maxWidth: '400px' }}>
                <p style={{ fontSize: '14px', margin: '0 0 12px 0', textAlign: 'center', opacity: 0.8 }}>
                  {config.successMessage || 'Congratulations! Your discount code:'}
                </p>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '12px', flexWrap: 'wrap' }}>
                  <code style={{
                    fontSize: '24px',
                    fontWeight: 700,
                    padding: '10px 20px',
                    backgroundColor: config.backgroundColor,
                    borderRadius: '8px',
                    letterSpacing: '2px'
                  }}>
                    {wonPrize.discountCode}
                  </code>
                  <button
                    onClick={handleCopyCode}
                    style={{
                      padding: '10px 20px',
                      fontSize: '14px',
                      fontWeight: 600,
                      border: 'none',
                      borderRadius: '8px',
                      backgroundColor: config.buttonColor,
                      color: config.buttonTextColor,
                      cursor: 'pointer',
                    }}
                  >
                    {copiedCode ? '✓ Copied!' : 'Copy'}
                  </button>
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </BasePopup>
  );
};

