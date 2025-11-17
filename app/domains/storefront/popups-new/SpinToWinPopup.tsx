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

import React, { useState, useCallback, useRef, useEffect, useMemo } from 'react';
import { PopupPortal } from './PopupPortal';
import type { PopupDesignConfig, Prize } from './types';
import type { SpinToWinContent } from '~/domains/campaigns/types/campaign';
import { validateEmail, copyToClipboard, prefersReducedMotion, getSizeDimensions } from './utils';

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
  const [email, setEmail] = useState('');
  const [emailError, setEmailError] = useState('');
  const [name, setName] = useState('');
  const [nameError, setNameError] = useState('');
  const [gdprConsent, setGdprConsent] = useState(false);
  const [gdprError, setGdprError] = useState('');
  const [hasSpun, setHasSpun] = useState(false);
  const [isSpinning, setIsSpinning] = useState(false);
  const [wonPrize, setWonPrize] = useState<Prize | null>(null);
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
      if (spinAnimationFrameRef.current !== null && typeof cancelAnimationFrame !== 'undefined') {
        cancelAnimationFrame(spinAnimationFrameRef.current);
      }
    };
  }, []);

  const [copiedCode, setCopiedCode] = useState(false);
  const [showContent, setShowContent] = useState(false);
  const [emailFocused, setEmailFocused] = useState(false);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const wheelContainerRef = useRef<HTMLDivElement | null>(null);

  const wheelSize = config.wheelSize || 380;
  const radius = wheelSize / 2;
  const segments = useMemo(() => config.wheelSegments || [], [config.wheelSegments]);
  const segmentAngle = 360 / Math.max(1, segments.length);
  const accentColor = config.accentColor || config.buttonColor || '#000000';
  const borderRadius = typeof config.borderRadius === 'string'
    ? parseFloat(config.borderRadius) || 16
    : (config.borderRadius ?? 16);
  const animDuration = config.animationDuration ?? 300;
  const sizeDimensions = getSizeDimensions(config.size || 'medium', config.previewMode);

  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    const updateIsMobile = () => {
      setIsMobile(window.innerWidth <= 768);
    };
    updateIsMobile();
    window.addEventListener('resize', updateIsMobile);
    return () => window.removeEventListener('resize', updateIsMobile);
  }, []);

  // Wheel border styling (theme-aware via admin config)
  const wheelBorderColor = config.wheelBorderColor || '#FFFFFF';
  const wheelBorderWidth = config.wheelBorderWidth ?? 3;

  // Card background styling (supports gradient backgrounds from themes)
  const baseBackground = config.backgroundColor || '#FFFFFF';
  const backgroundStyles: React.CSSProperties =
    baseBackground.startsWith('linear-gradient(')
      ? {
          backgroundImage: baseBackground,
          backgroundColor: 'transparent',
        }
      : {
          backgroundColor: baseBackground,
        };

  // Input colors derived from design config (theme-aware)
  const inputBackground = config.inputBackgroundColor || '#FFFFFF';
  const inputTextColor = config.inputTextColor || '#111827';
  const inputBorderColor = config.inputBorderColor || '#E5E7EB';

  // Theme-aware colors for success/prize surfaces
  const successColor = (config as any).successColor || accentColor;
  const descriptionColor = (config as any).descriptionColor || '#6B7280';

  // Optional extended behavior flags (storefront-only)
  const collectName = config.collectName ?? false;
  const showGdpr = config.showGdprCheckbox ?? false;
  const gdprLabel = config.gdprLabel || 'I agree to receive marketing emails and accept the privacy policy';
  // Canvas-based wheel rendering inspired by mockup
  // Now includes the static pointer integrated directly into the canvas.
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas || segments.length === 0) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const dpr = typeof window !== 'undefined' ? window.devicePixelRatio || 1 : 1;
    const logicalSize = wheelSize;

    canvas.width = logicalSize * dpr;
    canvas.height = logicalSize * dpr;
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

    const centerX = logicalSize / 2;
    const centerY = logicalSize / 2;
    const radiusPx = logicalSize / 2 - 10;
    const segmentAngleRad = (2 * Math.PI) / Math.max(1, segments.length);
    const rotationRad = (rotation * Math.PI) / 180;

    ctx.clearRect(0, 0, logicalSize, logicalSize);

    segments.forEach((segment, index) => {
      const baseAngle = index * segmentAngleRad - Math.PI / 2;
      const startAngle = rotationRad + baseAngle;
      const endAngle = startAngle + segmentAngleRad;
      const baseColor = segment.color || accentColor;

      ctx.beginPath();
      ctx.moveTo(centerX, centerY);
      ctx.arc(centerX, centerY, radiusPx, startAngle, endAngle);
      ctx.closePath();
      ctx.fillStyle = baseColor;
      ctx.fill();

      const isWinningSegment = hasSpun && wonPrize && segment.id === wonPrize.id;
      const borderColor = isWinningSegment ? '#FFD700' : wheelBorderColor;
      const borderWidth = isWinningSegment ? wheelBorderWidth + 2 : wheelBorderWidth;

      ctx.strokeStyle = borderColor;
      ctx.lineWidth = borderWidth;
      ctx.stroke();

      ctx.save();
      ctx.translate(centerX, centerY);
      ctx.rotate(startAngle + segmentAngleRad / 2);
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillStyle = '#ffffff';

      const label: string = segment.label || '';
      const maxTextWidth = radiusPx * 0.6;
      const textDistance = radiusPx * 0.65;
      let fontSize = Math.max(10, logicalSize / 25);
      ctx.font = `bold ${fontSize}px sans-serif`;

      let textWidth = ctx.measureText(label).width;
      if (textWidth > maxTextWidth) {
        fontSize = (fontSize * maxTextWidth) / textWidth;
        ctx.font = `bold ${fontSize}px sans-serif`;
        textWidth = ctx.measureText(label).width;
      }

      ctx.shadowColor = 'rgba(0, 0, 0, 0.8)';
      ctx.shadowBlur = 6;
      ctx.shadowOffsetX = 0;
      ctx.shadowOffsetY = 2;

      const words = label.split(' ');
      if (words.length > 1 && textWidth > maxTextWidth * 0.9) {
        const mid = Math.ceil(words.length / 2);
        const line1 = words.slice(0, mid).join(' ');
        const line2 = words.slice(mid).join(' ');
        ctx.fillText(line1, textDistance, -fontSize * 0.5);
        ctx.fillText(line2, textDistance, fontSize * 0.5);
      } else {
        ctx.fillText(label, textDistance, 0);
      }

      ctx.restore();
    });

    // Draw the static pointer on top of the wheel (does not rotate).
    function drawPointer() {
      ctx.save();
      ctx.fillStyle = 'white';
      ctx.shadowColor = 'rgba(0, 0, 0, 0.4)';
      ctx.shadowBlur = 6;
      ctx.shadowOffsetY = 3;

      ctx.beginPath();

      // Triangle pointing left, at the 3 o'clock position
      // Positioned just slightly outside the wheel's radius
      const pointerTipX = centerX + radiusPx - 8;
      const pointerTipY = centerY;
      const pointerBaseX = centerX + radiusPx + 22;
      const pointerBaseYOffset = 18;

      ctx.moveTo(pointerTipX, pointerTipY); // Tip
      ctx.lineTo(pointerBaseX, pointerTipY - pointerBaseYOffset); // Top base
      ctx.lineTo(pointerBaseX, pointerTipY + pointerBaseYOffset); // Bottom base
      ctx.closePath();
      ctx.fill();

      ctx.restore();
    }

    drawPointer();
  }, [segments, wheelSize, accentColor, wheelBorderColor, wheelBorderWidth, hasSpun, wonPrize, rotation]);



  useEffect(() => {
    if (isVisible) {
      const timer = setTimeout(() => setShowContent(true), 50);
      return () => clearTimeout(timer);
    } else {
      setShowContent(false);
    }
  }, [isVisible]);

  // Auto-close timer (migrated from BasePopup)
  useEffect(() => {
    if (!isVisible || !config.autoCloseDelay || config.autoCloseDelay <= 0) return;

    const timer = setTimeout(onClose, config.autoCloseDelay * 1000);
    return () => clearTimeout(timer);
  }, [isVisible, config.autoCloseDelay, onClose]);

  const selectPrize = useCallback((): Prize => {
    const totalProbability = segments.reduce((sum, seg) => sum + seg.probability, 0);
    let random = Math.random() * totalProbability;

    for (const segment of segments) {
      random -= segment.probability;
      if (random <= 0) {
        return segment;
      }
    }

    return segments[0];
  }, [segments]);

  const calculateRotation = useCallback(
    (prizeIndex: number): number => {
      const minSpins = config.minSpins ?? 5;
      const baseRotation = minSpins * 360;

      // We draw segments starting from the top (-90deg), but the pointer sits on the
      // right-hand side of the wheel. To land the winning slice under the pointer,
      // we rotate so that the center of the chosen segment is at 90deg from the
      // top (i.e. directly at the pointer).
      const targetAngle = 90 - (prizeIndex + 0.5) * segmentAngle;

      // No random jitter so the winning slice lines up precisely with the pointer.
      return baseRotation + targetAngle;
    },
    [segmentAngle, config.minSpins],
  );

  const handleSpin = useCallback(async () => {
    // Reset previous errors
    setEmailError('');
    setNameError('');
    setGdprError('');

    // Basic guards
    if (config.emailRequired && !email.trim()) {
      setEmailError('Email required');
      return;
    }

    if (config.emailRequired && !validateEmail(email)) {
      setEmailError('Invalid email');
      return;
    }

    if (collectName && !name.trim()) {
      setNameError('Name is required');
      return;
    }

    if (showGdpr && !gdprConsent) {
      setGdprError('You must accept the terms to continue');
      return;
    }

    setIsSpinning(true);

    try {
      if (!config.previewMode && onSpin) {
        await onSpin(email);
      }

      const prize = selectPrize();
      const prizeIndex = segments.findIndex((s) => s.id === prize.id);
      const finalRotation = calculateRotation(prizeIndex);

      const duration = config.spinDuration || 4000;
      const reduceMotion = prefersReducedMotion();

      // Cancel any existing animation
      if (spinAnimationFrameRef.current !== null && typeof cancelAnimationFrame !== 'undefined') {
        cancelAnimationFrame(spinAnimationFrameRef.current);
      }

      if (reduceMotion || typeof requestAnimationFrame === 'undefined') {
        // No animation: jump directly to final rotation
        setRotation(finalRotation);
      } else {
        spinFromRef.current = rotationRef.current;
        spinToRef.current = finalRotation;
        spinStartTimeRef.current = null;

        const easeOutCubic = (t: number) => 1 - Math.pow(1 - t, 3);

        const step = (timestamp: number) => {
          if (spinStartTimeRef.current === null) {
            spinStartTimeRef.current = timestamp;
          }

          const elapsed = timestamp - spinStartTimeRef.current;
          const t = Math.min(1, elapsed / duration);
          const eased = easeOutCubic(t);
          const current = spinFromRef.current + (spinToRef.current - spinFromRef.current) * eased;

          setRotation(current);

          if (t < 1) {
            spinAnimationFrameRef.current = requestAnimationFrame(step);
          } else {
            spinAnimationFrameRef.current = null;
            setRotation(spinToRef.current);
          }
        };

        spinAnimationFrameRef.current = requestAnimationFrame(step);
      }

      setTimeout(() => {
        setWonPrize(prize);
        setHasSpun(true);
        setIsSpinning(false);

        if (onWin) {
          onWin(prize);
        }
      }, duration);

    } catch (error) {
      console.error('Spin error:', error);
      setEmailError('Error occurred');
      setIsSpinning(false);
    }
  }, [config, email, name, gdprConsent, collectName, showGdpr, onSpin, selectPrize, segments, calculateRotation, onWin]);

  const handleCopyCode = useCallback(async () => {
    if (wonPrize?.discountCode) {
      const success = await copyToClipboard(wonPrize.discountCode);
      if (success) {
        setCopiedCode(true);
        setTimeout(() => setCopiedCode(false), 2000);
      }
    }
  }, [wonPrize]);

  const getInputStyles = (isFocused: boolean, hasError: boolean): React.CSSProperties => ({
    width: '100%',
    padding: '14px 16px',
    fontSize: '15px',
    border: `2px solid ${
      hasError
        ? '#EF4444'
        : isFocused
          ? accentColor
          : inputBorderColor
    }`,
    borderRadius: `${borderRadius}px`,
    backgroundColor: inputBackground,
    color: inputTextColor,
    outline: 'none',
    transition: `all ${animDuration}ms cubic-bezier(0.4, 0, 0.2, 1)`,
    fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
  });

  const buttonStyles: React.CSSProperties = {
    width: '100%',
    padding: '16px 32px',
    fontSize: '16px',
    fontWeight: 600,
    border: 'none',
    borderRadius: `${borderRadius}px`,
    backgroundColor: config.buttonColor || accentColor,
    color: config.buttonTextColor || '#FFFFFF',
    cursor: isSpinning ? 'not-allowed' : 'pointer',
    opacity: isSpinning ? 0.6 : 1,
    transition: `all ${animDuration}ms cubic-bezier(0.4, 0, 0.2, 1)`,
    fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
  };

  const secondaryButtonStyles: React.CSSProperties = {
    ...buttonStyles,
    backgroundColor: 'transparent',
    color: config.textColor || '#4B5563',
    boxShadow: 'none',
    cursor: 'pointer',
    opacity: 0.9,
  };

  const layoutRowStyles: React.CSSProperties = {
    display: 'flex',
    flexDirection: isMobile ? 'column' : 'row',
    flexWrap: 'nowrap',
    alignItems: isMobile ? 'center' : 'stretch',
    justifyContent: 'flex-start',
    width: '100%',
    overflow: 'hidden',
    gap: isMobile ? 24 : 0,
  };

  const wheelColumnStyles: React.CSSProperties = {
    position: 'relative',
    width: isMobile ? '100%' : '60%',
    flexShrink: 0,
    display: 'flex',
    alignItems: 'center',
    justifyContent: isMobile ? 'center' : 'flex-start',
    overflow: 'visible',
    marginLeft: isMobile ? 0 : '-10%',
    marginBottom: isMobile ? 24 : 0,
  };

  const formColumnStyles: React.CSSProperties = {
    flex: isMobile ? '0 0 auto' : '0 1 360px',
    maxWidth: isMobile ? '100%' : 400,
    width: '100%',
    display: 'flex',
    flexDirection: 'column',
    gap: 16,
    alignItems: 'stretch',
  };

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
      position="center"
      closeOnEscape={config.closeOnEscape !== false}
      closeOnBackdropClick={config.closeOnOverlayClick !== false}
      previewMode={config.previewMode}
      ariaLabel={config.ariaLabel || config.headline}
      ariaDescribedBy={config.ariaDescribedBy}
    >
      <div style={{
        opacity: showContent ? 1 : 0,
        transition: `opacity ${animDuration}ms ease-out`,
      }}>
        <div
          style={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'stretch',
            padding: '32px 24px',
            borderRadius: `${borderRadius}px`,
            boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)',
            maxWidth: sizeDimensions.maxWidth,
            width: sizeDimensions.width,
            maxHeight: '95vh',
            margin: '0 auto',
            overflowY: 'auto',
            ...backgroundStyles,
          }}
        >
          <div style={layoutRowStyles}>
            {/* Wheel + optional image column */}
            <div style={wheelColumnStyles}>
              <div
                style={{
                  display: 'flex',
                  flexDirection:
                    config.imagePosition === 'top' || config.imagePosition === 'bottom'
                      ? 'column'
                      : 'row',
                  gap: 24,
                  alignItems: 'flex-start',
                  justifyContent: 'flex-start',
                }}
              >
                {/* Wheel - canvas-based, partial off-screen like mockup */}
                <div
                  style={{
                    position: 'relative',
                    width: wheelSize,
                    height: wheelSize,
                  }}
                >
                  {/* Rotating wheel canvas */}
                  <div
                    ref={wheelContainerRef}
                    style={{
                      position: 'relative',
                      width: '100%',
                      height: '100%',
                      filter: hasSpun
                        ? 'drop-shadow(0 18px 45px rgba(15,23,42,0.55))'
                        : 'drop-shadow(0 10px 30px rgba(15,23,42,0.35))',
                    }}
                  >
                    <canvas
                      ref={canvasRef}
                      width={wheelSize}
                      height={wheelSize}
                      style={{
                        width: '100%',
                        height: '100%',
                        borderRadius: '50%',
                      }}
                    />
                  </div>

                  {/* Center button visual */}
                  <div
                    style={{
                      position: 'absolute',
                      top: '50%',
                      left: '50%',
                      transform: 'translate(-50%, -50%)',
                      width: 80,
                      height: 80,
                      borderRadius: '50%',
                      backgroundColor: accentColor,
                      border: '4px solid rgba(15,23,42,0.85)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      color: '#F9FAFB',
                      fontSize: 12,
                      fontWeight: 600,
                      letterSpacing: '0.12em',
                      textTransform: 'uppercase',
                      fontFamily:
                        '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
                      boxShadow: '0 4px 12px rgba(15,23,42,0.4)',
                      pointerEvents: 'none',
                    }}
                  >
                    SPIN
                  </div>

                </div>
              </div>
            </div>

            {/* Form / prize column */}
            <div style={formColumnStyles}>
              {/* Headline + description (form side, like mockup) */}
              <div style={{ marginBottom: 24 }}>
                <h2
                  style={{
                    fontSize: '28px',
                    fontWeight: 700,
                    margin: '0 0 8px 0',
                    lineHeight: 1.3,
                    color: config.textColor || '#111827',
                    fontFamily:
                      '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
                  }}
                >
                  {hasSpun && wonPrize
                    ? wonPrize.discountCode
                      ? config.successMessage?.replace('{{prize}}', wonPrize.label).replace('{{code}}', wonPrize.discountCode) || `You won ${wonPrize.label}!`
                      : config.failureMessage || wonPrize.label || 'Thanks for playing!'
                    : config.headline}
                </h2>
                {!hasSpun && config.subheadline && (
                  <p
                    style={{
                      fontSize: '16px',
                      margin: 0,
                      color: config.textColor || '#6B7280',
                      lineHeight: 1.5,
                      fontFamily:
                        '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
                    }}
                  >
                    {config.subheadline}
                  </p>
                )}
              </div>

              {/* Email input or Prize details */}
              {!hasSpun ? (
            <>
              {/* Optional Name field */}
              {collectName && (
                <div style={{ width: '100%', maxWidth: '400px' }}>
                  <label
                    style={{
                      display: 'block',
                      marginBottom: '8px',
                      fontSize: '14px',
                      fontWeight: 600,
                      color: config.textColor || '#374151',
                      fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
                    }}
                  >
                    Name
                  </label>
                  <input
                    type="text"
                    value={name}
                    onChange={(e) => {
                      setName(e.target.value);
                      if (nameError) setNameError('');
                    }}
                    placeholder="Enter your name"
                    style={getInputStyles(false, !!nameError)}
                    disabled={isSpinning}
                  />
                  {nameError && (
                    <p
                      style={{
                        color: '#EF4444',
                        fontSize: '13px',
                        margin: '6px 0 0 0',
                        fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
                      }}
                    >
                      {nameError}
                    </p>
                  )}
                </div>
              )}

              {/* Email input - clean design */}
              {config.emailRequired && (
                <div style={{ width: '100%', maxWidth: '400px' }}>
                  {config.emailLabel && (
                    <label style={{
                      display: 'block',
                      marginBottom: '8px',
                      fontSize: '14px',
                      fontWeight: 600,
                      color: config.textColor || '#374151',
                      fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
                    }}>
                      {config.emailLabel}
                    </label>
                  )}
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => {
                      setEmail(e.target.value);
                      if (emailError) setEmailError('');
                    }}
                    onFocus={() => setEmailFocused(true)}
                    onBlur={() => setEmailFocused(false)}
                    placeholder={config.emailPlaceholder || 'your@email.com'}
                    style={getInputStyles(emailFocused, !!emailError)}
                    disabled={isSpinning}
                  />
                  {emailError && (
                    <p style={{
                      color: '#EF4444',
                      fontSize: '13px',
                      margin: '6px 0 0 0',
                      fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
                    }}>
                      {emailError}
                    </p>
                  )}
                </div>
              )}

              {/* Optional GDPR checkbox */}
              {showGdpr && (
                <div style={{ width: '100%', maxWidth: '400px' }}>
                  <div style={{ display: 'flex', alignItems: 'flex-start', gap: '10px', marginTop: '8px' }}>
                    <input
                      id="spin-gdpr"
                      type="checkbox"
                      checked={gdprConsent}
                      onChange={(e) => {
                        setGdprConsent(e.target.checked);
                        if (gdprError) setGdprError('');
                      }}
                      style={{
                        width: '16px',
                        height: '16px',
                        marginTop: '2px',
                        cursor: 'pointer',
                      }}
                      disabled={isSpinning}
                    />
                    <label
                      htmlFor="spin-gdpr"
                      style={{
                        fontSize: '13px',
                        lineHeight: 1.5,
                        color: config.textColor || '#4B5563',
                        cursor: 'pointer',
                        fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
                      }}
                    >
                      {gdprLabel}
                    </label>
                  </div>
                  {gdprError && (
                    <p
                      style={{
                        color: '#EF4444',
                        fontSize: '13px',
                        margin: '6px 0 0 0',
                        fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
                      }}
                    >
                      {gdprError}
                    </p>
                  )}
                </div>
              )}

              {/* Clean spin button */}
              <button
                onClick={handleSpin}
                disabled={isSpinning}
                style={buttonStyles}
                onMouseEnter={(e) => {
                  if (!isSpinning) {
                    e.currentTarget.style.transform = 'translateY(-1px)';
                  }
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.transform = 'translateY(0)';
                }}
              >
                {isSpinning ? (
                  <span style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '10px' }}>
                    <span style={{
                      width: '16px',
                      height: '16px',
                      border: '2px solid rgba(255,255,255,0.3)',
                      borderTopColor: '#FFF',
                      borderRadius: '50%',
                      animation: 'spin 0.8s linear infinite'
                    }} />
                    {config.loadingText || 'Spinning...'}
                  </span>
                ) : (
                  config.spinButtonText || config.buttonText || 'Spin the Wheel'
                )}
              </button>

              <button
                type="button"
                onClick={onClose}
                style={{
                  ...secondaryButtonStyles,
                  marginTop: '8px',
                }}
                onMouseEnter={(e) => (e.currentTarget.style.opacity = '1')}
                onMouseLeave={(e) => (e.currentTarget.style.opacity = '0.9')}
              >
                {config.dismissLabel || 'No thanks'}
              </button>
            </>
          ) : (
            // Prize details - shown below the wheel
            wonPrize?.discountCode && (
              <div style={{
                width: '100%',
                maxWidth: '400px',
                marginTop: '8px',
                padding: '24px',
                backgroundColor: inputBackground,
                borderRadius: `${borderRadius}px`,
                border: `1px solid ${inputBorderColor}`,
                animation: 'slideUp 0.5s ease-out',
              }}>
                <p style={{
                  fontSize: '13px',
                  margin: '0 0 12px 0',
                  color: descriptionColor,
                  fontWeight: 600,
                  textTransform: 'uppercase',
                  letterSpacing: '0.5px',
                  fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
                  textAlign: 'center',
                }}>
                  Your Discount Code
                </p>
                <div style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '12px',
                  flexWrap: 'wrap',
                }}>
                  <code style={{
                    fontSize: '28px',
                    fontWeight: 700,
                    padding: '12px 24px',
                    backgroundColor: '#FFFFFF',
                    borderRadius: `${borderRadius - 4}px`,
                    letterSpacing: '2px',
                    color: accentColor,
                    border: `2px solid ${successColor}`,
                    fontFamily: 'SF Mono, Monaco, Consolas, monospace',
                  }}>
                    {wonPrize.discountCode}
                  </code>
                  <button
                    onClick={handleCopyCode}
                    style={{
                      padding: '12px 20px',
                      fontSize: '14px',
                      fontWeight: 600,
                      border: `2px solid ${copiedCode ? successColor : inputBorderColor}`,
                      borderRadius: `${borderRadius - 4}px`,
                      backgroundColor: copiedCode ? successColor : '#FFFFFF',
                      color: copiedCode ? '#FFFFFF' : (config.textColor || '#374151'),
                      cursor: 'pointer',
                      transition: `all ${animDuration}ms`,
                      fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
                    }}
                  >
                    {copiedCode ? 'Copied!' : 'Copy'}
                  </button>
                </div>
                {wonPrize.discountValue && (
                  <p style={{
                    fontSize: '15px',
                    margin: '16px 0 0 0',
                    color: config.textColor || '#374151',
                    fontWeight: 500,
                    fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
                    textAlign: 'center',
                  }}>
                    {wonPrize.discountType === 'percentage' && `Save ${wonPrize.discountValue}%`}
                    {wonPrize.discountType === 'fixed_amount' && `Save $${wonPrize.discountValue}`}
                    {wonPrize.discountType === 'free_shipping' && 'Free Shipping'}
                  </p>
                )}
              </div>
            )
          )}
        </div>
        {/* Close layout row */}
      </div>
      {/* Close card container */}
      </div>
      {/* Close overlay wrapper */}
      </div>

      <style>{`
        @keyframes spin {
          to { transform: rotate(360deg); }
        }

        @keyframes slideUp {
          from {
            opacity: 0;
            transform: translateY(20px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
      `}</style>
    </PopupPortal>
  );
};
