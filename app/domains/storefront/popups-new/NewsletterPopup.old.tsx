/**
 * NewsletterPopup Component - Enhanced Design
 *
 * A premium newsletter signup popup optimized for Shopify stores with:
 * - Modern, polished design with smooth animations
 * - Email validation with inline error states
 * - Optional name fields (first/last)
 * - Optional consent checkbox (GDPR compliance)
 * - Discount code display with copy-to-clipboard
 * - Success/error states with animations
 * - Loading states with spinner
 * - Preview mode support
 * - Fully customizable while beautiful by default
 */

import React, { useState, useCallback, useEffect } from 'react';
import { PopupPortal } from './PopupPortal';
import type { PopupDesignConfig, DiscountConfig } from './types';
import type { NewsletterContent } from '~/domains/campaigns/types/campaign';
import { validateEmail, copyToClipboard } from './utils';

/**
 * Newsletter-specific configuration
 * Extends both design config AND campaign content type for type safety
 */
export interface NewsletterConfig extends PopupDesignConfig, NewsletterContent {
  // Discount (storefront-specific)
  discount?: DiscountConfig;

  // Additional storefront-specific fields
  successTitle?: string;
  loadingText?: string;
  showEmailIcon?: boolean;
  successEmoji?: string;
  animationDuration?: number;

  // Note: All content fields (headline, subheadline, emailPlaceholder, etc.)
  // come from NewsletterContent
  // All design fields (colors, position, size, etc.) come from PopupDesignConfig
}

export interface NewsletterPopupProps {
  config: NewsletterConfig;
  isVisible: boolean;
  onClose: () => void;
  onSubmit?: (data: NewsletterFormData) => Promise<void>;
}

export interface NewsletterFormData {
  email: string;
  firstName?: string;
  lastName?: string;
  consent?: boolean;
}

export const NewsletterPopup: React.FC<NewsletterPopupProps> = ({
                                                                  config,
                                                                  isVisible,
                                                                  onClose,
                                                                  onSubmit,
                                                                }) => {
  const [email, setEmail] = useState('');
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [consent, setConsent] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [error, setError] = useState('');
  const [copiedCode, setCopiedCode] = useState(false);
  const [showContent, setShowContent] = useState(false);

  // Validation
  const [emailError, setEmailError] = useState('');
  const [nameError, setNameError] = useState('');
  const [consentError, setConsentError] = useState('');

  // Focus states
  const [emailFocused, setEmailFocused] = useState(false);
  const [firstNameFocused, setFirstNameFocused] = useState(false);
  const [lastNameFocused, setLastNameFocused] = useState(false);

  // Animate content in
  useEffect(() => {
    if (isVisible) {
      const timer = setTimeout(() => setShowContent(true), 50);
      return () => clearTimeout(timer);
    } else {
      setShowContent(false);
    }
  }, [isVisible]);

  const validateForm = useCallback((): boolean => {
    let isValid = true;

    // Email validation
    if (!email.trim()) {
      setEmailError('Email is required');
      isValid = false;
    } else if (!validateEmail(email)) {
      setEmailError('Please enter a valid email address');
      isValid = false;
    } else {
      setEmailError('');
    }

    // Name validation
    if (config.nameFieldEnabled && config.nameFieldRequired) {
      if (!firstName.trim() && !lastName.trim()) {
        setNameError('Name is required');
        isValid = false;
      } else {
        setNameError('');
      }
    }

    // Consent validation
    if (config.consentFieldEnabled && config.consentFieldRequired && !consent) {
      setConsentError('You must agree to continue');
      isValid = false;
    } else {
      setConsentError('');
    }

    return isValid;
  }, [email, firstName, lastName, consent, config]);

  const handleSubmit: React.FormEventHandler<HTMLFormElement> = useCallback(async (e) => {
    e.preventDefault();

    if (!validateForm()) return;

    setIsLoading(true);
    setError('');

    try {
      if (config.previewMode) {
        // Preview mode - simulate success
        await new Promise(resolve => setTimeout(resolve, 1500));
        setIsSuccess(true);
      } else if (onSubmit) {
        // Real submission
        await onSubmit({
          email,
          firstName: firstName || undefined,
          lastName: lastName || undefined,
          consent: consent || undefined,
        });
        setIsSuccess(true);
      } else {
        setIsSuccess(true);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : config.errorMessage || 'Something went wrong');
    } finally {
      setIsLoading(false);
    }
  }, [validateForm, config, onSubmit, email, firstName, lastName, consent]);

  const handleCopyCode = useCallback(async () => {
    if (config.discount?.code) {
      const success = await copyToClipboard(config.discount.code);
      if (success) {
        setCopiedCode(true);
        setTimeout(() => setCopiedCode(false), 2000);
      }
    }
  }, [config.discount?.code]);

  // Enhanced default colors
  const accentColor = config.accentColor || config.buttonColor || '#6366F1';
  const borderRadius = typeof config.borderRadius === 'string'
    ? parseFloat(config.borderRadius) || 12
    : (config.borderRadius ?? 12);
  const animDuration = config.animationDuration ?? 300;

  // Input styles with enhanced design
  const getInputStyles = (isFocused: boolean, hasError: boolean): React.CSSProperties => ({
    width: '100%',
    padding: '14px 16px',
    fontSize: '15px',
    border: `2px solid ${hasError ? '#EF4444' : isFocused ? accentColor : config.inputBorderColor || '#E5E7EB'}`,
    borderRadius: `${borderRadius}px`,
    backgroundColor: config.inputBackgroundColor || '#FFFFFF',
    color: config.inputTextColor || '#111827',
    outline: 'none',
    transition: `all ${animDuration}ms cubic-bezier(0.4, 0, 0.2, 1)`,
    boxShadow: isFocused ? `0 0 0 3px ${accentColor}15` : hasError ? '0 0 0 3px #FEE2E2' : 'none',
    fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
  });

  const buttonStyles: React.CSSProperties = {
    width: '100%',
    padding: '16px 24px',
    fontSize: '16px',
    fontWeight: 600,
    border: 'none',
    borderRadius: `${borderRadius}px`,
    backgroundColor: config.buttonColor || '#6366F1',
    color: config.buttonTextColor || '#FFFFFF',
    cursor: isLoading ? 'not-allowed' : 'pointer',
    opacity: isLoading ? 0.7 : 1,
    transition: `all ${animDuration}ms cubic-bezier(0.4, 0, 0.2, 1)`,
    boxShadow: isLoading ? 'none' : '0 4px 12px rgba(99, 102, 241, 0.3)',
    fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
    position: 'relative',
    overflow: 'hidden',
  };

  const labelStyles: React.CSSProperties = {
    display: 'block',
    marginBottom: '8px',
    fontSize: '14px',
    fontWeight: 600,
    color: config.textColor || '#374151',
    fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
  };

  const containerStyles: React.CSSProperties = {
    opacity: showContent ? 1 : 0,
    transform: showContent ? 'translateY(0)' : 'translateY(10px)',
    transition: `all ${animDuration}ms cubic-bezier(0.4, 0, 0.2, 1)`,
  };

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
      <div style={containerStyles}>
        {!isSuccess ? (
          <form onSubmit={(e) => handleSubmit(e as any)} style={{ display: 'flex', flexDirection: 'column', gap: '20px' }} data-testid="newsletter-form">
            {/* Headline */}
            <div style={{ textAlign: 'center', marginBottom: '4px' }}>
              <h2 data-testid="newsletter-headline" style={{
                fontSize: '32px',
                fontWeight: 800,
                margin: '0 0 12px 0',
                lineHeight: 1.2,
                color: config.textColor || '#111827',
                fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
                letterSpacing: '-0.02em'
              }}>
                {config.headline}
              </h2>
              {config.subheadline && (
                <p style={{
                  fontSize: '16px',
                  margin: 0,
                  color: config.textColor || '#6B7280',
                  lineHeight: 1.6,
                  fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
                }}>
                  {config.subheadline}
                </p>
              )}
            </div>

            {/* Name fields */}
            {config.nameFieldEnabled && (
              <>
                <div style={{ display: 'flex', gap: '12px' }}>
                  <div style={{ flex: 1 }}>
                    {config.firstNameLabel && (
                      <label style={labelStyles}>
                        {config.firstNameLabel}
                      </label>
                    )}
                    <input
                      data-testid="newsletter-first-name"
                      type="text"
                      value={firstName}
                      onChange={(e) => setFirstName(e.target.value)}
                      onFocus={() => setFirstNameFocused(true)}
                      onBlur={() => setFirstNameFocused(false)}
                      placeholder={config.firstNamePlaceholder || 'First name'}
                      style={getInputStyles(firstNameFocused, !!nameError)}
                      required={config.nameFieldRequired}
                    />
                  </div>
                  <div style={{ flex: 1 }}>
                    {config.lastNameLabel && (
                      <label style={labelStyles}>
                        {config.lastNameLabel}
                      </label>
                    )}
                    <input
                      data-testid="newsletter-last-name"
                      type="text"
                      value={lastName}
                      onChange={(e) => setLastName(e.target.value)}
                      onFocus={() => setLastNameFocused(true)}
                      onBlur={() => setLastNameFocused(false)}
                      placeholder={config.lastNamePlaceholder || 'Last name'}
                      style={getInputStyles(lastNameFocused, !!nameError)}
                      required={config.nameFieldRequired}
                    />
                  </div>
                </div>
                {nameError && (
                  <p style={{
                    color: '#EF4444',
                    fontSize: '13px',
                    margin: '-12px 0 0 0',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '4px'
                  }}>
                    <span>⚠</span> {nameError}
                  </p>
                )}
              </>
            )}

            {/* Email field */}
            <div>
              {config.emailLabel && (
                <label style={labelStyles}>
                  {config.emailLabel}
                </label>
              )}
              <div style={{ position: 'relative' }}>
                {(config.showEmailIcon !== false) && (
                  <div style={{
                    position: 'absolute',
                    left: '16px',
                    top: '50%',
                    transform: 'translateY(-50%)',
                    color: emailFocused ? accentColor : '#9CA3AF',
                    transition: `color ${animDuration}ms`,
                    pointerEvents: 'none',
                    fontSize: '18px'
                  }}>
                    ✉
                  </div>
                )}
                <input
                  data-testid="newsletter-email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  onFocus={() => setEmailFocused(true)}
                  onBlur={() => setEmailFocused(false)}
                  placeholder={config.emailPlaceholder || 'you@example.com'}
                  style={{
                    ...getInputStyles(emailFocused, !!emailError),
                    paddingLeft: (config.showEmailIcon !== false) ? '48px' : '16px'
                  }}
                  required
                />
              </div>
              {emailError && (
                <p style={{
                  color: '#EF4444',
                  fontSize: '13px',
                  margin: '6px 0 0 0',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '4px'
                }}>
                  <span>⚠</span> {emailError}
                </p>
              )}
            </div>

            {/* Consent checkbox */}
            {config.consentFieldEnabled && (
              <div>
                <label style={{
                  display: 'flex',
                  alignItems: 'flex-start',
                  gap: '10px',
                  cursor: 'pointer',
                  padding: '4px 0'
                }}>
                  <input
                    data-testid="newsletter-consent"
                    type="checkbox"
                    checked={consent}
                    onChange={(e) => setConsent(e.target.checked)}
                    required={config.consentFieldRequired}
                    style={{
                      marginTop: '2px',
                      cursor: 'pointer',
                      width: '18px',
                      height: '18px',
                      accentColor: accentColor
                    }}
                  />
                  <span style={{
                    fontSize: '14px',
                    lineHeight: 1.6,
                    color: config.textColor || '#4B5563',
                    fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
                  }}>
                    {config.consentFieldText || 'I agree to receive marketing emails'}
                  </span>
                </label>
                {consentError && (
                  <p style={{
                    color: '#EF4444',
                    fontSize: '13px',
                    margin: '6px 0 0 0',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '4px'
                  }}>
                    <span>⚠</span> {consentError}
                  </p>
                )}
              </div>
            )}

            {/* Error message */}
            {error && (
              <div data-testid="newsletter-error" style={{
                padding: '14px 16px',
                backgroundColor: '#FEE2E2',
                borderRadius: `${borderRadius - 2}px`,
                color: '#991B1B',
                fontSize: '14px',
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                border: '1px solid #FEE2E2',
                animation: 'slideIn 0.3s ease-out'
              }}>
                <span style={{ fontSize: '18px' }}>⚠</span>
                <span>{error}</span>
              </div>
            )}

            {/* Submit button */}
            <button
              type="submit"
              data-testid="newsletter-submit"
              disabled={isLoading}
              style={buttonStyles}
              onMouseEnter={(e) => {
                if (!isLoading) {
                  e.currentTarget.style.transform = 'translateY(-2px)';
                  e.currentTarget.style.boxShadow = '0 8px 20px rgba(99, 102, 241, 0.4)';
                }
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.transform = 'translateY(0)';
                e.currentTarget.style.boxShadow = '0 4px 12px rgba(99, 102, 241, 0.3)';
              }}
            >
              {isLoading ? (
                <span style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '10px' }}>
                  <span style={{
                    width: '16px',
                    height: '16px',
                    border: '2px solid rgba(255,255,255,0.3)',
                    borderTopColor: '#FFF',
                    borderRadius: '50%',
                    animation: 'spin 0.8s linear infinite'
                  }} />
                  {config.loadingText || 'Subscribing...'}
                </span>
              ) : (
                config.submitButtonText || config.buttonText || config.ctaText || 'Subscribe Now'
              )}
            </button>
          </form>
        ) : (
          // Success state
          <div style={{ textAlign: 'center', padding: '20px 0' }} data-testid="newsletter-success">
            <div style={{
              fontSize: '64px',
              marginBottom: '20px',
              animation: 'bounceIn 0.6s cubic-bezier(0.68, -0.55, 0.265, 1.55)'
            }}>
              {config.successEmoji || '🎉'}
            </div>
            <h2 data-testid="newsletter-success-title" style={{
              fontSize: '28px',
              fontWeight: 800,
              margin: '0 0 12px 0',
              color: config.textColor || '#111827',
              fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
              letterSpacing: '-0.02em'
            }}>
              {config.successTitle || config.successMessage || "You're in!"}
            </h2>
            <p style={{
              fontSize: '15px',
              color: config.textColor || '#6B7280',
              margin: '0 0 24px 0',
              lineHeight: 1.6
            }}>
              Check your inbox for exclusive updates
            </p>

            {config.discount?.enabled && config.discount.code && (
              <div style={{
                marginTop: '28px',
                padding: '24px',
                background: `linear-gradient(135deg, ${accentColor}15 0%, ${accentColor}08 100%)`,
                borderRadius: `${borderRadius}px`,
                border: `1px solid ${accentColor}20`,
                animation: 'fadeInUp 0.5s ease-out 0.3s both'
              }}>
                <p style={{
                  fontSize: '13px',
                  margin: '0 0 12px 0',
                  color: config.textColor || '#6B7280',
                  fontWeight: 600,
                  textTransform: 'uppercase',
                  letterSpacing: '0.05em'
                }}>
                  Your Exclusive Code
                </p>
                <div style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '12px',
                  flexWrap: 'wrap'
                }}>
                  <code data-testid="discount-code" style={{
                    fontSize: '28px',
                    fontWeight: 800,
                    padding: '12px 24px',
                    backgroundColor: '#FFFFFF',
                    borderRadius: `${borderRadius - 2}px`,
                    letterSpacing: '3px',
                    color: accentColor,
                    boxShadow: '0 2px 8px rgba(0,0,0,0.08)',
                    border: `2px dashed ${accentColor}30`
                  }}>
                    {config.discount.code}
                  </code>
                  <button
                    onClick={handleCopyCode}
                    data-testid="discount-copy"
                    style={{
                      padding: '12px 20px',
                      fontSize: '14px',
                      border: 'none',
                      borderRadius: `${borderRadius - 2}px`,
                      backgroundColor: copiedCode ? '#10B981' : accentColor,
                      color: '#FFFFFF',
                      cursor: 'pointer',
                      fontWeight: 700,
                      transition: `all ${animDuration}ms`,
                      boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '6px'
                    }}
                  >
                    {copiedCode ? (
                      <>
                        <span>✓</span> Copied!
                      </>
                    ) : (
                      <>
                        <span>📋</span> Copy Code
                      </>
                    )}
                  </button>
                </div>
                {config.discount.percentage && (
                  <p style={{
                    fontSize: '15px',
                    margin: '16px 0 0 0',
                    color: config.textColor || '#374151',
                    fontWeight: 600
                  }}>
                    💰 Save {config.discount.percentage}% on your next order!
                  </p>
                )}
              </div>
            )}
          </div>
        )}
      </div>

      {/* Keyframe animations */}
      <style>{`
        @keyframes spin {
          to { transform: rotate(360deg); }
        }
        @keyframes bounceIn {
          0% { transform: scale(0); opacity: 0; }
          50% { transform: scale(1.1); }
          100% { transform: scale(1); opacity: 1; }
        }
        @keyframes fadeInUp {
          from { opacity: 0; transform: translateY(20px); }
          to { opacity: 1; transform: translateY(0); }
        }
        @keyframes slideIn {
          from { opacity: 0; transform: translateX(-10px); }
          to { opacity: 1; transform: translateX(0); }
        }
      `}</style>
    </PopupPortal>
  );
};
