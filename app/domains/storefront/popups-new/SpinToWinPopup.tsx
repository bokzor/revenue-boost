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
import { validateEmail, prefersReducedMotion, debounce } from './utils';
import { challengeTokenStore } from '~/domains/storefront/services/challenge-token.client';

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
  const [isGeneratingCode, setIsGeneratingCode] = useState(false);
  const [wonPrize, setWonPrize] = useState<Prize | null>(null);
  const [codeError, setCodeError] = useState('');
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

  const [showContent, setShowContent] = useState(false);
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
  const accentColor = config.accentColor || config.buttonColor || '#000000';
  const borderRadius =
    typeof config.borderRadius === 'string'
      ? parseFloat(config.borderRadius) || 16
      : config.borderRadius ?? 16;
  const animDuration = config.animationDuration ?? 300;

  const viewportWidth = typeof window !== 'undefined' ? window.innerWidth : null;
  const effectiveWidth = cardWidth ?? viewportWidth;

  const isMobile = effectiveWidth !== null ? effectiveWidth < 640 : false;

  // Responsive wheel sizing based on container dimensions (inspired by spin-to-win2 mockup)
  const updateWheelSize = useCallback(() => {
    if (typeof window === 'undefined') return;
    const container = wheelCellRef.current;
    if (!container) return;

    const measuredWidth = container.clientWidth;
    const measuredHeight = container.clientHeight;

    console.log('[SpinToWin] updateWheelSize', {
      containerSize: `${measuredWidth}x${measuredHeight}`,
      isMobile,
      container,
    });

    if (!measuredWidth || !measuredHeight) return;

    let newSize: number;

    if (isMobile) {
      // Mobile: "Left edge aligns with left, Right edge aligns with right"
      // So size should match the width of the container
      newSize = measuredWidth;
    } else {
      // Desktop: "Top edge aligns with top, Bottom edge aligns with bottom"
      // So size should match the height of the container
      newSize = measuredHeight;
    }

    console.log('[SpinToWin] Calculated newSize', newSize);

    // Ensure it's not too small
    newSize = Math.max(250, newSize);

    setWheelSize(newSize);
  }, [isMobile]); // Re-run when layout mode changes

  // Debounce the update to avoid excessive re-renders during resize
  const debouncedUpdateWheelSize = useMemo(
    () => debounce(updateWheelSize, 100),
    [updateWheelSize]
  );

  // Trigger update when cardWidth changes (which happens on container resize)
  useEffect(() => {
    debouncedUpdateWheelSize();
  }, [cardWidth, debouncedUpdateWheelSize]);

  useEffect(() => {
    if (!isVisible || typeof window === 'undefined') return;

    let frameId: number | null = null;

    const runInitialMeasure = () => {
      frameId = window.requestAnimationFrame(() => {
        updateWheelSize();
      });
    };

    runInitialMeasure();
    window.addEventListener('resize', debouncedUpdateWheelSize);

    return () => {
      if (frameId !== null && typeof window.cancelAnimationFrame === 'function') {
        window.cancelAnimationFrame(frameId);
      }
      window.removeEventListener('resize', debouncedUpdateWheelSize);
    };
  }, [isVisible, updateWheelSize, debouncedUpdateWheelSize]);

  useEffect(() => {
    if (!isVisible || typeof window === 'undefined') return;

    const measureCardWidth = () => {
      if (cardRef.current) {
        setCardWidth(cardRef.current.clientWidth);
      }
    };

    measureCardWidth();

    let observer: ResizeObserver | null = null;

    if (typeof ResizeObserver !== 'undefined' && cardRef.current) {
      observer = new ResizeObserver(() => {
        measureCardWidth();
      });
      observer.observe(cardRef.current as Element);
    } else {
      window.addEventListener('resize', measureCardWidth);
    }

    return () => {
      if (observer) {
        observer.disconnect();
      } else {
        window.removeEventListener('resize', measureCardWidth);
      }
    };
  }, [isVisible]);

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

  const resultMessage =
    hasSpun && wonPrize
      ? wonPrize.generatedCode
        ? `You won ${wonPrize.label}!`
        : config.failureMessage || wonPrize.label || 'Thanks for playing!'
      : null;

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

  // Prize selection and wheel rotation now handled server-side for security

  const validateForm = useCallback(() => {
    // Reset previous errors
    setEmailError('');
    setNameError('');
    setGdprError('');

    if (config.emailRequired && !email.trim()) {
      setEmailError('Email required');
      return false;
    }

    if (config.emailRequired && !validateEmail(email)) {
      setEmailError('Invalid email');
      return false;
    }

    if (collectName && config.nameFieldRequired && !name.trim()) {
      setNameError('Name is required');
      return false;
    }

    if (showGdpr && config.consentFieldRequired && !gdprConsent) {
      setGdprError('You must accept the terms to continue');
      return false;
    }

    return true;
  }, [config.emailRequired, config.nameFieldRequired, config.consentFieldRequired, email, collectName, name, showGdpr, gdprConsent]);

  const handleSpin = useCallback(async () => {
    const isValid = validateForm();
    if (!isValid) return;

    setIsSpinning(true);
    setCodeError('');

    // 1. Start spinning indefinitely (or to a very distant target)
    // We'll adjust the target once we have the prize
    const duration = config.spinDuration || 4000;
    const reduceMotion = prefersReducedMotion();

    if (spinAnimationFrameRef.current !== null && typeof cancelAnimationFrame !== 'undefined') {
      cancelAnimationFrame(spinAnimationFrameRef.current);
    }

    // Initial "loading" spin - rotate fast
    spinFromRef.current = rotationRef.current;
    // Target a far rotation so it keeps spinning until we update it
    const initialTarget = rotationRef.current + 360 * 10;
    spinToRef.current = initialTarget;
    spinStartTimeRef.current = performance.now();

    const easeOutCubic = (t: number) => 1 - Math.pow(1 - t, 3);
    const easeInOutQuad = (t: number) => t < .5 ? 2 * t * t : -1 + (4 - 2 * t) * t;

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
        await onSpin(email);
      }

      // 2. Fetch Prize
      let serverPrize: Prize | null = null;
      let discountCode: string | undefined;
      let autoApply = false;

      if (!config.previewMode && config.campaignId) {
        setIsGeneratingCode(true);
        try {
          const response = await fetch('/apps/revenue-boost/api/popups/spin-win', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              campaignId: config.campaignId,
              email,
              sessionId: typeof window !== 'undefined' ? window.sessionStorage?.getItem('rb_session_id') : undefined,
              challengeToken: challengeTokenStore.get(config.campaignId),
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
            discountCode = data.discountCode;
            autoApply = data.autoApply;
          } else {
            setCodeError(data.error || 'Could not generate discount code');
          }
        } catch (err) {
          console.error('API error', err);
          setCodeError('Network error');
        } finally {
          setIsGeneratingCode(false);
        }
      } else {
        // Preview mode: pick random
        const randomIdx = Math.floor(Math.random() * segments.length);
        serverPrize = segments[randomIdx];
        discountCode = "PREVIEW10";
      }

      // 3. Calculate Final Rotation
      if (serverPrize) {
        setWonPrize(serverPrize);

        // Find index
        const prizeIndex = segments.findIndex(s => s.id === serverPrize?.id);
        if (prizeIndex !== -1) {
          // Calculate target angle to align winning segment to 3 o'clock (0deg / 360deg)
          // Segment starts at: index * segmentAngle - 90
          // Center of segment: index * segmentAngle - 90 + segmentAngle/2
          // We want Center to be at 0 (East)
          // So we need to rotate by: 0 - Center
          // But we want to add full spins: 360 * 5 + (0 - Center)

          const segmentAngle = 360 / segments.length;
          const segmentCenter = (prizeIndex * segmentAngle) - 90 + (segmentAngle / 2);

          // Normalize segmentCenter to 0-360
          // e.g. if center is -45, we want to rotate +45 to bring it to 0.
          // target = -segmentCenter

          const baseTarget = -segmentCenter;

          // Add extra spins to ensure we spin forward and enough times
          // Current rotation is somewhere in the middle of the initial spin
          // We want to extend the animation to land exactly on target

          const currentRot = rotationRef.current;
          const minSpins = 5;
          const targetRotation = currentRot + (360 * minSpins) + (baseTarget - (currentRot % 360));

          // Adjust spinToRef to the calculated target
          // We also reset the start time to ensure a smooth ease-out from current position to new target
          spinFromRef.current = currentRot;
          spinToRef.current = targetRotation;
          spinStartTimeRef.current = performance.now();

          // The animation loop will pick up the new spinToRef and ease towards it
        }

        if (onWin && serverPrize) onWin(serverPrize);

        if (autoApply && discountCode && typeof window !== 'undefined') {
          window.localStorage.setItem('rb_discount_code', discountCode);
        }
      }

    } catch (error) {
      console.error('Spin error:', error);
      setEmailError('Error occurred');
      setIsSpinning(false);
    }
  }, [validateForm, config, email, onSpin, segments, onWin]);

  const getInputStyles = (isFocused: boolean, hasError: boolean): React.CSSProperties => {
    // Use inputTextColor with reduced opacity for placeholder
    const placeholderColor = inputTextColor ? `${inputTextColor}80` : 'rgba(107, 114, 128, 0.5)';

    return {
      width: '100%',
      padding: '14px 16px',
      fontSize: '15px',
      border: `2px solid ${hasError
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
    };
  };

  const buttonStyles: React.CSSProperties = {
    width: '100%',
    padding: '16px 32px',
    fontSize: '16px',
    fontWeight: 600,
    border: 'none',
    borderRadius: `${borderRadius}px`,
    backgroundColor: config.buttonColor || accentColor,
    color: config.buttonTextColor || '#FFFFFF',
    cursor: 'pointer',
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

  const gridContainerStyles: React.CSSProperties = {
    display: 'grid',
    // Use minmax(0, 1fr) to ensure strictly equal tracks even if content is wide
    gridTemplateColumns: isMobile ? '1fr' : 'repeat(2, minmax(0, 1fr))',
    gridTemplateRows: isMobile ? 'repeat(2, minmax(0, 1fr))' : '1fr',
    width: '100%',
    height: '100%',
    minHeight: isMobile ? 'auto' : 450,
  };

  const wheelCellStyles: React.CSSProperties = {
    position: 'relative',
    display: 'flex',
    // Desktop: Right edge touches middle (justify-end of left cell)
    // Mobile: Bottom edge touches middle (align-end of top cell)
    justifyContent: isMobile ? 'center' : 'flex-end',
    alignItems: isMobile ? 'flex-end' : 'center',
    overflow: 'visible', // Allow wheel to overflow
    padding: 0,
    zIndex: 10,
  };

  const formCellStyles: React.CSSProperties = {
    display: 'flex',
    flexDirection: 'column',
    justifyContent: 'center',
    alignItems: 'center',
    padding: isMobile ? '24px 16px' : '40px',
    zIndex: 20,
    backgroundColor: isMobile ? baseBackground : 'transparent', // Ensure form is readable
  };

  const formInnerStyles: React.CSSProperties = {
    maxWidth: 448,
    width: '100%',
    margin: '0 auto',
    display: 'flex',
    flexDirection: 'column',
    gap: 16,
  };

  const wheelWrapperStyles: React.CSSProperties = {
    position: 'absolute',
    width: wheelSize,
    height: wheelSize,
    // Mobile: Bottom-center alignment
    // Desktop: Right-center alignment
    left: isMobile ? '50%' : 'auto',
    bottom: isMobile ? 0 : 'auto',
    right: isMobile ? 'auto' : 0,
    top: isMobile ? 'auto' : '50%',
    // Mobile: Rotate 90deg so 3 o'clock (East) becomes 6 o'clock (South)
    // AND center horizontally (translateX -50%)
    // Desktop: Center vertically (translateY -50%)
    transform: isMobile
      ? 'translateX(-50%) rotate(90deg)'
      : 'translateY(-50%)',
    transformOrigin: 'center center',
    transition: 'transform 0.3s ease',
    zIndex: 10,
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
        duration: animDuration,
      }}
      position="center"
      size={config.size || 'large'}
      closeOnEscape={config.closeOnEscape !== false}
      closeOnBackdropClick={config.closeOnOverlayClick !== false}
      previewMode={config.previewMode}
      ariaLabel={config.ariaLabel || config.headline}
      ariaDescribedBy={config.ariaDescribedBy}
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
            color: ${inputTextColor ? `${inputTextColor}80` : 'rgba(107, 114, 128, 0.5)'};
            opacity: 1;
          }
        `}
      </style>
      <div
        style={{
          opacity: showContent ? 1 : 0,
          transition: `opacity ${animDuration}ms ease-out`,
        }}
      >
        <div
          ref={cardRef}
          style={{
            position: 'relative',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'stretch',
            padding: isMobile ? '24px 16px' : '40px 40px',
            borderRadius: 0,
            boxShadow: 'none',
            width: '100%',
            maxWidth: '100%',
            maxHeight: '100vh',
            margin: '0 auto',
            overflow: 'hidden',
            ...backgroundStyles,
          }}
        >
          {/* Close button in top-right corner */}
          <button
            type="button"
            onClick={onClose}
            aria-label={(config as any).closeLabel || 'Close popup'}
            style={{
              position: 'absolute',
              top: isMobile ? 12 : 16,
              right: isMobile ? 12 : 16,
              width: 32,
              height: 32,
              borderRadius: 9999,
              border: 'none',
              backgroundColor: 'rgba(15,23,42,0.08)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              cursor: 'pointer',
              color: config.textColor || '#4B5563',
              boxShadow: '0 1px 3px rgba(15,23,42,0.15)',
            }}
          >
            <span style={{ fontSize: 18, lineHeight: 1 }}>
              X
            </span>
          </button>
          <div style={gridContainerStyles}>
            {/* Wheel Cell */}
            <div style={wheelCellStyles} ref={wheelCellRef}>
              <div style={wheelWrapperStyles}>
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

                {/* Pointer - DOM Element */}
                {/* Positioned at 3 o'clock (Right) relative to the wheel wrapper */}
                {/* On mobile, the wrapper is rotated 90deg, so this becomes 6 o'clock (Bottom) */}
                <div
                  style={{
                    position: 'absolute',
                    top: '50%',
                    right: -12, // Slightly overlapping or just outside
                    transform: 'translateY(-50%)',
                    width: 0,
                    height: 0,
                    borderTop: '16px solid transparent',
                    borderBottom: '16px solid transparent',
                    borderRight: '24px solid #FFFFFF', // Points Left
                    filter: 'drop-shadow(-2px 0 4px rgba(0,0,0,0.2))',
                    zIndex: 20,
                  }}
                />

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
                    zIndex: 15,
                  }}
                >
                  SPIN
                </div>
              </div>
            </div>

            {/* Form Cell */}
            <div style={formCellStyles}>
              <div style={formInnerStyles}>
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
                    {config.headline}
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
                  {hasSpun && resultMessage && (
                    <div
                      style={{
                        marginTop: 12,
                        padding: '12px 16px',
                        borderRadius: 9999,
                        backgroundColor: wonPrize?.generatedCode
                          ? successColor
                          : '#374151', // Dark gray for failure message
                        color: '#FFFFFF', // Always white text for good contrast
                        fontSize: '14px',
                        fontWeight: 500,
                        textAlign: 'center',
                        fontFamily:
                          '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
                      }}
                    >
                      {resultMessage}
                    </div>
                  )}
                </div>

                {/* Email + GDPR + actions */}
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
                      className="spin-to-win-input"
                      value={name}
                      onChange={(e) => {
                        setName(e.target.value);
                        if (nameError) setNameError('');
                      }}
                      placeholder={config.nameFieldPlaceholder || "Enter your name"}
                      style={getInputStyles(false, !!nameError)}
                      disabled={isSpinning || hasSpun}
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
                      className="spin-to-win-input"
                      value={email}
                      onChange={(e) => {
                        setEmail(e.target.value);
                        if (emailError) setEmailError('');
                      }}
                      onFocus={() => setEmailFocused(true)}
                      onBlur={() => setEmailFocused(false)}
                      placeholder={config.emailPlaceholder || 'your@email.com'}
                      style={getInputStyles(emailFocused, !!emailError)}
                      disabled={isSpinning || hasSpun}
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
                        disabled={isSpinning || hasSpun}
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

                {/* Primary button: Spin */}
                <button
                  onClick={handleSpin}
                  disabled={isSpinning || hasSpun}
                  style={{
                    ...buttonStyles,
                    cursor: isSpinning || hasSpun ? 'not-allowed' : 'pointer',
                  }}
                  onMouseEnter={(e) => {
                    if (!isSpinning && !hasSpun) {
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
                    config.spinButtonText || 'Spin to Win!'
                  )}
                </button>

                {/* Hide "No thanks" button after spin */}
                {!hasSpun && (
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
                )}

                {/* Discount code reveal with copy functionality */}
                {wonPrize?.generatedCode && (
                  <div style={{
                    width: '100%',
                    maxWidth: '400px',
                    marginTop: '8px',
                    padding: '24px',
                    backgroundColor: inputBackground,
                    borderRadius: `${borderRadius}px`,
                    border: `1px solid ${inputBorderColor}`,
                    animation: 'slideUpFade 0.6s ease-out',
                  }}>
                    {isGeneratingCode ? (
                      <p style={{
                        fontSize: '15px',
                        margin: '0',
                        color: descriptionColor,
                        fontWeight: 500,
                        textAlign: 'center',
                        fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
                      }}>
                        Generating your discount code...
                      </p>
                    ) : (
                      <>
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
                            {wonPrize.generatedCode}
                          </code>
                        </div>
                        <p style={{
                          fontSize: '14px',
                          margin: '16px 0 0 0',
                          color: descriptionColor,
                          fontWeight: 500,
                          fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
                          textAlign: 'center',
                        }}>
                          {wonPrize.label}
                        </p>
                        {/* Copy to clipboard button */}
                        <button
                          type="button"
                          onClick={() => {
                            if (typeof navigator !== 'undefined' && navigator.clipboard && wonPrize.generatedCode) {
                              navigator.clipboard.writeText(wonPrize.generatedCode)
                                .then(() => console.log('[Spin-to-Win] Code copied to clipboard'))
                                .catch((err) => console.error('[Spin-to-Win] Copy failed:', err));
                            }
                          }}
                          style={{
                            marginTop: '12px',
                            padding: '10px 20px',
                            fontSize: '14px',
                            fontWeight: 600,
                            color: accentColor,
                            backgroundColor: 'transparent',
                            border: `2px solid ${accentColor}`,
                            borderRadius: `${borderRadius}px`,
                            cursor: 'pointer',
                            transition: 'all 0.2s ease',
                            fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
                          }}
                          onMouseEnter={(e) => {
                            e.currentTarget.style.backgroundColor = accentColor;
                            e.currentTarget.style.color = '#FFFFFF';
                          }}
                          onMouseLeave={(e) => {
                            e.currentTarget.style.backgroundColor = 'transparent';
                            e.currentTarget.style.color = accentColor;
                          }}
                        >
                          Copy Code
                        </button>
                      </>
                    )}
                    {codeError && (
                      <p style={{
                        fontSize: '13px',
                        margin: '12px 0 0 0',
                        color: '#EF4444',
                        fontWeight: 500,
                        textAlign: 'center',
                      }}>
                        {codeError}
                      </p>
                    )}
                  </div>
                )}
              </div>
              {/* Close layout row */}
            </div>
          </div>
          {/* Close overlay wrapper */}
        </div>

      </div>

    </PopupPortal>
  );
};
