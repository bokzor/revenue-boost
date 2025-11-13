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
import { BasePopup } from './BasePopup';
import type { PopupDesignConfig, Prize } from './types';
import type { SpinToWinContent } from '~/domains/campaigns/types/campaign';
import { validateEmail, copyToClipboard, prefersReducedMotion } from './utils';

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
  const [hasSpun, setHasSpun] = useState(false);
  const [isSpinning, setIsSpinning] = useState(false);
  const [wonPrize, setWonPrize] = useState<Prize | null>(null);
  const [rotation, setRotation] = useState(0);
  const [copiedCode, setCopiedCode] = useState(false);
  const [showContent, setShowContent] = useState(false);
  const [emailFocused, setEmailFocused] = useState(false);
  const wheelRef = useRef<SVGSVGElement>(null);

  const wheelSize = config.wheelSize || 380;
  const radius = wheelSize / 2;
  const segments = useMemo(() => config.wheelSegments || [], [config.wheelSegments]);
  const segmentAngle = 360 / segments.length;
  const accentColor = config.accentColor || config.buttonColor || '#000000';
  const borderRadius = typeof config.borderRadius === 'string'
    ? parseFloat(config.borderRadius) || 16
    : (config.borderRadius ?? 16);
  const animDuration = config.animationDuration ?? 300;

  useEffect(() => {
    if (isVisible) {
      const timer = setTimeout(() => setShowContent(true), 50);
      return () => clearTimeout(timer);
    } else {
      setShowContent(false);
    }
  }, [isVisible]);

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

  const calculateRotation = useCallback((prizeIndex: number): number => {
    const minSpins = config.minSpins || 5;
    const baseRotation = minSpins * 360;
    const segmentRotation = prizeIndex * segmentAngle;
    const centerOffset = segmentAngle / 2;
    const randomOffset = (Math.random() - 0.5) * (segmentAngle * 0.5);

    return baseRotation + (360 - segmentRotation) + centerOffset + randomOffset;
  }, [segmentAngle, config.minSpins]);

  const handleSpin = useCallback(async () => {
    if (config.emailRequired && !email.trim()) {
      setEmailError('Email required');
      return;
    }

    if (config.emailRequired && !validateEmail(email)) {
      setEmailError('Invalid email');
      return;
    }

    setEmailError('');
    setIsSpinning(true);

    try {
      if (!config.previewMode && onSpin) {
        await onSpin(email);
      }

      const prize = selectPrize();
      const prizeIndex = segments.findIndex(s => s.id === prize.id);
      const finalRotation = rotation + calculateRotation(prizeIndex);

      setRotation(finalRotation);

      const duration = config.spinDuration || 4000;
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
  }, [config, email, onSpin, selectPrize, segments, rotation, calculateRotation, onWin]);

  const handleCopyCode = useCallback(async () => {
    if (wonPrize?.discountCode) {
      const success = await copyToClipboard(wonPrize.discountCode);
      if (success) {
        setCopiedCode(true);
        setTimeout(() => setCopiedCode(false), 2000);
      }
    }
  }, [wonPrize]);

  const renderWheel = () => {
    return segments.map((segment, index) => {
      const startAngle = index * segmentAngle;
      const endAngle = startAngle + segmentAngle;

      const startRad = (startAngle - 90) * (Math.PI / 180);
      const endRad = (endAngle - 90) * (Math.PI / 180);

      const x1 = radius + radius * Math.cos(startRad);
      const y1 = radius + radius * Math.sin(startRad);
      const x2 = radius + radius * Math.cos(endRad);
      const y2 = radius + radius * Math.sin(endRad);

      const largeArc = segmentAngle > 180 ? 1 : 0;
      const pathData = [
        `M ${radius} ${radius}`,
        `L ${x1} ${y1}`,
        `A ${radius} ${radius} 0 ${largeArc} 1 ${x2} ${y2}`,
        'Z'
      ].join(' ');

      // Subtle, modern colors
      const hue = index * (360 / segments.length);
      const baseColor = segment.color || `hsl(${hue}, 65%, 58%)`;

      // Check if this is the winning segment
      const isWinningSegment = hasSpun && wonPrize && segment.id === wonPrize.id;
      const strokeColor = isWinningSegment ? '#FFD700' : '#FFFFFF'; // Gold for winner, white for others
      const strokeWidth = isWinningSegment ? 8 : 3; // Thicker border for winner

      const textAngle = startAngle + segmentAngle / 2;
      const textRad = (textAngle - 90) * (Math.PI / 180);
      const textRadius = radius * 0.72;
      const textX = radius + textRadius * Math.cos(textRad);
      const textY = radius + textRadius * Math.sin(textRad);

      return (
        <g key={segment.id}>
          <path
            d={pathData}
            fill={baseColor}
            stroke={strokeColor}
            strokeWidth={strokeWidth}
            style={{
              transition: 'stroke 0.5s ease-out, stroke-width 0.5s ease-out',
            }}
          />
          <text
            x={textX}
            y={textY}
            fill="#FFFFFF"
            fontSize="14"
            fontWeight="600"
            textAnchor="middle"
            dominantBaseline="middle"
            transform={`rotate(${textAngle}, ${textX}, ${textY})`}
            style={{
              pointerEvents: 'none',
              userSelect: 'none',
              fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
            }}
          >
            {segment.label}
          </text>
        </g>
      );
    });
  };

  const getInputStyles = (isFocused: boolean, hasError: boolean): React.CSSProperties => ({
    width: '100%',
    padding: '14px 16px',
    fontSize: '15px',
    border: `2px solid ${hasError ? '#EF4444' : isFocused ? accentColor : '#E5E7EB'}`,
    borderRadius: `${borderRadius}px`,
    backgroundColor: '#FFFFFF',
    color: '#111827',
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
    backgroundColor: accentColor,
    color: '#FFFFFF',
    cursor: isSpinning ? 'not-allowed' : 'pointer',
    opacity: isSpinning ? 0.6 : 1,
    transition: `all ${animDuration}ms cubic-bezier(0.4, 0, 0.2, 1)`,
    fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
  };

  const wheelTransition = prefersReducedMotion()
    ? 'none'
    : `transform ${config.spinDuration || 4000}ms cubic-bezier(0.17, 0.67, 0.12, 0.99)`;

  return (
    <BasePopup config={config} isVisible={isVisible} onClose={onClose}>
      <div style={{
        opacity: showContent ? 1 : 0,
        transition: `opacity ${animDuration}ms ease-out`,
      }}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '32px', alignItems: 'center' }}>
          {/* Headline */}
          <div style={{ textAlign: 'center' }}>
            <h2 style={{
              fontSize: '28px',
              fontWeight: 700,
              margin: '0 0 8px 0',
              lineHeight: 1.3,
              color: config.textColor || '#111827',
              fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
            }}>
              {hasSpun && wonPrize ? (
                wonPrize.discountCode
                  ? (config.successMessage?.replace('{{prize}}', wonPrize.label).replace('{{code}}', wonPrize.discountCode) || `You won ${wonPrize.label}!`)
                  : (config.failureMessage || wonPrize.label || 'Thanks for playing!')
              ) : (
                config.headline
              )}
            </h2>
            {!hasSpun && config.subheadline && (
              <p style={{
                fontSize: '16px',
                margin: 0,
                color: config.textColor || '#6B7280',
                lineHeight: 1.5,
                fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
              }}>
                {config.subheadline}
              </p>
            )}
          </div>

          {/* Wheel - always visible, with prize highlight */}
          <div style={{
            position: 'relative',
            width: wheelSize,
            height: wheelSize,
          }}>
            <svg
              ref={wheelRef}
              width={wheelSize}
              height={wheelSize}
              viewBox={`0 0 ${wheelSize} ${wheelSize}`}
              style={{
                transform: `rotate(${rotation}deg)`,
                transition: wheelTransition,
                filter: hasSpun
                  ? 'drop-shadow(0 8px 24px rgba(0, 0, 0, 0.2))'
                  : 'drop-shadow(0 4px 12px rgba(0, 0, 0, 0.1))',
              }}
            >
              {renderWheel()}

              {/* Simple center circle */}
              <circle
                cx={radius}
                cy={radius}
                r={28}
                fill={accentColor}
                stroke="#FFFFFF"
                strokeWidth={3}
              />
            </svg>

            {/* Minimal pointer */}
            <div style={{
              position: 'absolute',
              top: -12,
              left: '50%',
              transform: 'translateX(-50%)',
              width: 0,
              height: 0,
              borderLeft: '14px solid transparent',
              borderRight: '14px solid transparent',
              borderTop: `22px solid ${accentColor}`,
              filter: 'drop-shadow(0 2px 4px rgba(0,0,0,0.15))',
              zIndex: 10,
            }} />
          </div>

          {/* Email input or Prize details */}
          {!hasSpun ? (
            <>
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
                    onChange={(e) => setEmail(e.target.value)}
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
            </>
          ) : (
            // Prize details - shown below the wheel
            wonPrize?.discountCode && (
              <div style={{
                width: '100%',
                maxWidth: '400px',
                marginTop: '8px',
                padding: '24px',
                backgroundColor: '#F9FAFB',
                borderRadius: `${borderRadius}px`,
                border: '1px solid #E5E7EB',
                animation: 'slideUp 0.5s ease-out',
              }}>
                <p style={{
                  fontSize: '13px',
                  margin: '0 0 12px 0',
                  color: '#6B7280',
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
                    border: '2px solid #E5E7EB',
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
                      border: `2px solid ${copiedCode ? '#10B981' : '#E5E7EB'}`,
                      borderRadius: `${borderRadius - 4}px`,
                      backgroundColor: copiedCode ? '#10B981' : '#FFFFFF',
                      color: copiedCode ? '#FFFFFF' : '#374151',
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
                    color: '#374151',
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
    </BasePopup>
  );
};
