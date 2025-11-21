/**
 * NewsletterPopup Component - Redesigned
 *
 * Based on mockup design at docs/mockup/newsletter/components/email-popup.tsx
 *
 * Features:
 * - 10 theme presets (modern, minimal, elegant, bold, glass, dark, gradient, luxury, neon, ocean)
 * - Image positioning support (left, right, top, bottom, none)
 * - Enhanced animations and accessibility
 * - GDPR compliance with consent checkbox
 * - Discount code display with copy-to-clipboard
 * - Responsive design with mobile optimization
 */

import React, { useState, useCallback, useEffect } from 'react';
import type { PopupDesignConfig, DiscountConfig, ImagePosition } from './types';
import type { NewsletterContent } from '~/domains/campaigns/types/campaign';

import { PopupPortal } from './PopupPortal';
import { PopupGridContainer } from './PopupGridContainer';
import { getSizeDimensions } from './utils';
import { challengeTokenStore } from '~/domains/storefront/services/challenge-token.client';


/**
 * Newsletter-specific configuration
 */
export interface NewsletterConfig extends PopupDesignConfig, NewsletterContent {
  discount?: DiscountConfig;
  successTitle?: string;
  successEmoji?: string;

  // Typography (should be set by admin based on theme)
  titleFontSize?: string;
  titleFontWeight?: string;
  titleTextShadow?: string;
  descriptionFontSize?: string;
  descriptionFontWeight?: string;

  // Input styling (should be set by admin based on theme)
  inputBackdropFilter?: string;
  inputBoxShadow?: string;
}

export interface NewsletterPopupProps {
  config: NewsletterConfig;
  isVisible: boolean;
  onClose: () => void;
  onSubmit?: (data: NewsletterFormData) => Promise<string | undefined>;
}

export interface NewsletterFormData {
  email: string;
  name?: string;
  gdprConsent: boolean;
}

export const NewsletterPopup: React.FC<NewsletterPopupProps> = ({
  config,
  isVisible,
  onClose,
  onSubmit,
}) => {
  const [email, setEmail] = useState('');
  const [name, setName] = useState('');
  const [gdprConsent, setGdprConsent] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errors, setErrors] = useState<{ email?: string; name?: string; gdpr?: string }>({});
  const [generatedDiscountCode, setGeneratedDiscountCode] = useState<string | null>(null);

  // Extract configuration with defaults
  const imagePosition: ImagePosition = config.imagePosition || 'left';

  // Background image configuration (preset vs Shopify file vs none)
  const backgroundImageMode: "none" | "preset" | "file" =
    (config.backgroundImageMode as any) ?? (config.imageUrl ? "file" : "none");

  // Use image URL from config when mode is not "none" (admin sets this for preset/file)
  const imageUrl = backgroundImageMode === "none" ? undefined : config.imageUrl;

  const title = config.headline || 'Join Our Newsletter';
  const description = config.subheadline || 'Subscribe to get special offers, free giveaways, and exclusive deals.';
  const buttonText = config.submitButtonText || config.buttonText || 'Subscribe';
  const deliveryMode = config.discount?.deliveryMode || 'show_code_fallback';
  const successMessage =
    config.successMessage ??
    (deliveryMode === 'auto_apply_only'
      ? 'Thanks for subscribing! Your discount will be automatically applied when you checkout.'
      : deliveryMode === 'show_in_popup_authorized_only'
        ? 'Thanks for subscribing! Your discount code is authorized for your email address only.'
        : 'Thanks for subscribing! Your discount code is ready to use.');
  const discountCode = config.discount?.enabled ? config.discount.code : undefined;
  const showGdprCheckbox = config.consentFieldEnabled ?? false;
  const gdprLabel = config.consentFieldText || 'I agree to receive marketing emails and accept the privacy policy';
  const collectName = config.nameFieldEnabled ?? false;
  const sizeDimensions = getSizeDimensions(config.size || 'medium', config.previewMode);


  // Reset form when popup closes
  useEffect(() => {
    if (!isVisible) {
      const timer = setTimeout(() => {
        setIsSubmitted(false);
        setEmail('');
        setName('');
        setGdprConsent(false);
        setErrors({});
      }, 300);
      return () => clearTimeout(timer);
    }
  }, [isVisible]);

  // Note: Scroll locking and ESC key handling are now handled by PopupPortal

  const validateForm = () => {
    const newErrors: { email?: string; name?: string; gdpr?: string } = {};

    // Email validation (only if required)
    if (config.emailRequired !== false) {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!email) {
        newErrors.email = config.emailErrorMessage || 'Email is required';
      } else if (!emailRegex.test(email)) {
        newErrors.email = 'Please enter a valid email';
      }
    }

    // Name validation (only if enabled and required)
    if (config.nameFieldEnabled && config.nameFieldRequired && !name.trim()) {
      newErrors.name = 'Name is required';
    }

    // Consent validation (only if enabled and required)
    if (config.consentFieldEnabled && config.consentFieldRequired && !gdprConsent) {
      newErrors.gdpr = 'You must accept the terms to continue';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    if (!validateForm()) return;

    setIsSubmitting(true);

    try {
      if (onSubmit) {
        const code = await onSubmit({
          email,
          name: collectName ? name : undefined,
          gdprConsent,
        });

        const discountEnabled = config.discount?.enabled === true;
        if (code && discountEnabled) {
          setGeneratedDiscountCode(code);
        }

        setIsSubmitted(true);
      } else {
        // Default secure submission handler
        const campaignId = config.campaignId;

        if (!campaignId) {
          throw new Error('Missing campaignId for secure submission');
        }

        const challengeToken = challengeTokenStore.get(campaignId);

        if (!challengeToken) {
          throw new Error('Security check failed. Please refresh the page.');
        }

        const response = await fetch('/apps/revenue-boost/api/leads/submit', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            campaignId: config.campaignId,
            email,
            name: collectName ? name : undefined,
            sessionId: typeof window !== 'undefined' ? window.sessionStorage?.getItem('rb_session_id') : undefined,
            challengeToken: challengeToken as string,
            gdprConsent,
          }),
        });

        const data = await response.json();

        if (!response.ok) {
          throw new Error(data.error || 'Submission failed');
        }

        if (data.success) {
          if (data.discountCode) {
            setGeneratedDiscountCode(data.discountCode);
          }
          setIsSubmitted(true);
        } else {
          throw new Error(data.error || 'Submission failed');
        }
      }
    } catch (error: any) {
      console.error('Popup form submission error:', error);
      setErrors({ email: error.message || 'Something went wrong. Please try again.' });
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!isVisible) return null;

  const showImage = imagePosition !== 'none';
  const isVertical = imagePosition === 'left' || imagePosition === 'right';
  const imageFirst = imagePosition === 'left' || imagePosition === 'top';
  const defaultImage = imageUrl || `/placeholder.svg?height=600&width=500&query=modern email newsletter subscription`;

  // Content class for layout
  const contentClass = showImage
    ? isVertical
      ? `vertical ${imageFirst ? '' : 'reverse'}`
      : `horizontal ${imageFirst ? '' : 'reverse'}`
    : 'single-column';

  // Detect glass effect
  const isGlass = config.backgroundColor?.includes('rgba') &&
    parseFloat(config.backgroundColor.match(/[\d.]+(?=\))/)?.[0] || '1') < 1;

  // Detect gradient background
  const hasGradientBg = config.backgroundColor?.includes('gradient');

  return (
    <PopupPortal
      isVisible={isVisible}
      onClose={onClose}
      backdrop={{
        color: config.overlayColor || 'rgba(0, 0, 0, 0.5)',
        opacity: config.overlayOpacity ?? 0.5,
        blur: 4,
      }}
      animation={{
        type: config.animation || 'fade',
        duration: 300,
      }}
      position="center"
      size={config.size || 'medium'}
      closeOnEscape={config.closeOnEscape !== false}
      closeOnBackdropClick={config.closeOnOverlayClick !== false}
      previewMode={config.previewMode}
      ariaLabel={config.headline || 'Newsletter Signup'}
    >
      <style>
        {`
        /* Image Cell */
        .email-popup-image {
          position: relative;
          overflow: hidden;
          display: flex;
          align-items: center;
          justify-content: center;
          background: ${config.imageBgColor || config.inputBackgroundColor || '#f4f4f5'};
          min-height: 200px;
          width: 100%;
          height: 100%;
        }

        .email-popup-image img {
          width: 100%;
          height: 100%;
          object-fit: cover;
          position: absolute;
          inset: 0;
        }

        /* Form Cell */
        .email-popup-form-section {
          padding: 2rem 1.5rem;
          display: flex;
          flex-direction: column;
          justify-content: center;
          background: ${hasGradientBg ? config.backgroundColor : 'transparent'};
          width: 100%;
        }

        .email-popup-title {
          font-size: ${config.titleFontSize || config.fontSize || '1.875rem'};
          font-weight: ${config.titleFontWeight || config.fontWeight || '700'};
          margin-bottom: 0.75rem;
          color: ${config.textColor || '#111827'};
          line-height: 1.2;
          ${config.titleTextShadow ? `text-shadow: ${config.titleTextShadow};` : ''}
        }

        .email-popup-description {
          font-size: ${config.descriptionFontSize || config.fontSize || '1rem'};
          line-height: 1.6;
          margin-bottom: 1.5rem;
          color: ${config.descriptionColor || '#52525b'};
          font-weight: ${config.descriptionFontWeight || config.fontWeight || '400'};
        }

        .email-popup-form {
          display: flex;
          flex-direction: column;
          gap: 1.25rem; /* Increased gap for better spacing */
        }

        .email-popup-input-wrapper {
          position: relative;
        }

        .email-popup-input {
          width: 100%;
          height: 3rem;
          padding: 0 1rem;
          border-radius: 0.5rem;
          border: 2px solid ${config.inputBorderColor || '#d4d4d8'};
          background: ${config.inputBackgroundColor || '#ffffff'};
          color: ${config.inputTextColor || '#111827'};
          font-size: 1rem;
          transition: all 0.2s;
          outline: none;
          ${config.inputBackdropFilter ? `backdrop-filter: ${config.inputBackdropFilter};` : ''}
          ${config.inputBoxShadow ? `box-shadow: ${config.inputBoxShadow};` : ''}
        }

        .email-popup-input::placeholder {
          color: ${config.inputTextColor ? `${config.inputTextColor}80` : '#9ca3af'};
          opacity: 1;
        }

        .email-popup-input:focus {
          border-color: ${config.accentColor || config.buttonColor || '#3b82f6'};
          box-shadow: 0 0 0 3px ${config.accentColor || config.buttonColor || '#3b82f6'}33;
        }

        .email-popup-input.error {
          border-color: #ef4444;
        }

        .email-popup-error {
          color: #ef4444;
          font-size: 0.875rem;
          margin-top: 0.25rem;
        }

        .email-popup-label {
          display: block;
          font-size: 0.875rem;
          font-weight: 500;
          margin-bottom: 0.5rem;
          color: ${config.textColor || '#111827'};
        }

        .email-popup-checkbox-wrapper {
          display: flex;
          align-items: flex-start;
          gap: 0.75rem;
          margin-top: 0.25rem;
        }

        .email-popup-checkbox {
          margin-top: 0.25rem;
          width: 1.125rem;
          height: 1.125rem;
          cursor: pointer;
          flex-shrink: 0;
        }

        .email-popup-checkbox-label {
          font-size: 0.875rem;
          color: ${config.descriptionColor || '#52525b'};
          line-height: 1.4;
        }

        .email-popup-button {
          width: 100%;
          height: 3rem;
          border-radius: 0.5rem;
          border: none;
          background: ${config.buttonColor || '#3b82f6'};
          color: ${config.buttonTextColor || '#ffffff'};
          font-size: 1rem;
          font-weight: 600;
          cursor: pointer;
          transition: all 0.2s;
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 0.5rem;
          margin-top: 0.5rem;
        }

        .email-popup-button:hover:not(:disabled) {
          transform: translateY(-1px);
          box-shadow: 0 4px 12px ${config.buttonColor || '#3b82f6'}40;
        }

        .email-popup-button:disabled {
          opacity: 0.6;
          cursor: not-allowed;
        }

        .email-popup-secondary-button {
          margin-top: 0.75rem;
          width: 100%;
          background: transparent;
          border: none;
          color: ${config.descriptionColor || '#6b7280'};
          font-size: 0.875rem;
          font-weight: 500;
          cursor: pointer;
        }

        .email-popup-secondary-button:hover {
          text-decoration: underline;
        }

        .email-popup-success {
          text-align: center;
          padding: 2rem 0;
          animation: fadeInUp 0.5s ease-out;
        }

        .email-popup-success-icon {
          width: 4rem;
          height: 4rem;
          border-radius: 9999px;
          background: ${config.successColor ? `${config.successColor}20` : '#dcfce7'};
          display: flex;
          align-items: center;
          justify-content: center;
          margin: 0 auto 1rem;
          animation: bounceIn 0.6s ease-out;
        }

        .email-popup-success-icon svg {
          stroke: ${config.successColor || '#16a34a'};
        }

        .email-popup-success-message {
          font-size: ${config.titleFontSize || config.fontSize || '1.875rem'};
          font-weight: ${config.titleFontWeight || config.fontWeight || '700'};
          color: ${config.textColor || '#111827'};
          margin-bottom: 1.5rem;
          line-height: 1.2;
          ${config.titleTextShadow ? `text-shadow: ${config.titleTextShadow};` : ''}
        }

        .email-popup-discount {
          display: inline-block;
          padding: 0.75rem 1.5rem;
          border-radius: 0.5rem;
          border: 2px dashed ${config.accentColor || config.buttonColor || '#3b82f6'};
          background: ${config.accentColor ? `${config.accentColor}15` : config.inputBackgroundColor || '#f4f4f5'};
        }

        .email-popup-discount-label {
          font-size: 0.875rem;
          font-weight: 500;
          margin-bottom: 0.25rem;
          color: ${config.descriptionColor || '#52525b'};
        }

        .email-popup-discount-code {
          font-size: 1.5rem;
          font-weight: 700;
          letter-spacing: 0.05em;
          color: ${config.accentColor || config.buttonColor || config.textColor || '#111827'};
        }

        .email-popup-spinner {
          width: 1.25rem;
          height: 1.25rem;
          border: 2px solid ${config.buttonTextColor || '#ffffff'}40;
          border-top-color: ${config.buttonTextColor || '#ffffff'};
          border-radius: 50%;
          animation: spin 0.6s linear infinite;
        }

        @keyframes fadeIn {
          from { opacity: 0; }
          to { opacity: 1; }
        }

        @keyframes zoomIn {
          from {
            opacity: 0;
            transform: scale(0.95);
          }
          to {
            opacity: 1;
            transform: scale(1);
          }
        }

        @keyframes fadeInUp {
          from {
            opacity: 0;
            transform: translateY(20px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }

        @keyframes bounceIn {
          0% {
            opacity: 0;
            transform: scale(0.3);
          }
          50% {
            opacity: 1;
            transform: scale(1.05);
          }
          70% {
            transform: scale(0.9);
          }
          100% {
            transform: scale(1);
          }
        }

        @keyframes spin {
          to { transform: rotate(360deg); }
        }

        /* Desktop Layout (Side-by-Side) - Specific overrides if needed */
        @container popup (min-width: 600px) {
          .email-popup-form-section {
            padding: 3rem;
          }
        }

        @media (prefers-reduced-motion: reduce) {
          .email-popup-success,
          .email-popup-success-icon,
          .email-popup-spinner {
            animation: none !important;
            transition: none !important;
          }
        }
        `}
      </style>

      <PopupGridContainer
        config={config}
        onClose={onClose}
        imagePosition={imagePosition === 'right' ? 'right' : 'left'}
        singleColumn={!imageUrl || imagePosition === 'none'}
      >
        {/* Image Section */}
        {imageUrl && (
          <div className="email-popup-image">
            <img src={imageUrl} alt={config.headline || 'Newsletter'} />
          </div>
        )}

        {/* Form Section */}
        <div className="email-popup-form-section">
          {isSubmitted ? (
            <div className="email-popup-success">
              <div className="email-popup-success-icon">
                <svg
                  width="32"
                  height="32"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="3"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <polyline points="20 6 9 17 4 12" />
                </svg>
              </div>
              <h3 className="email-popup-success-message">
                {config.successMessage || 'Thanks for subscribing!'}
              </h3>
              {(generatedDiscountCode || discountCode) && (
                <div className="email-popup-discount">
                  <div className="email-popup-discount-label">
                    Your discount code:
                  </div>
                  <div className="email-popup-discount-code">
                    {generatedDiscountCode || discountCode}
                  </div>
                </div>
              )}
            </div>
          ) : (
            <>
              {config.headline && (
                <h2 className="email-popup-title">{config.headline}</h2>
              )}
              {config.subheadline && (
                <p className="email-popup-description">{config.subheadline}</p>
              )}

              <form className="email-popup-form" onSubmit={handleSubmit}>
                {collectName && (
                  <div className="email-popup-input-wrapper">
                    <label htmlFor="name-input" className="email-popup-label">
                      {config.firstNameLabel || 'Name'}
                    </label>
                    <input
                      id="name-input"
                      type="text"
                      className={`email-popup-input ${errors.name ? 'error' : ''}`}
                      placeholder={config.nameFieldPlaceholder || 'Your name'}
                      value={name}
                      onChange={(e) => {
                        setName(e.target.value);
                        if (errors.name) setErrors({ ...errors, name: undefined });
                      }}
                      disabled={isSubmitting}
                      required={config.nameFieldRequired}
                    />
                    {errors.name && (
                      <div className="email-popup-error">{errors.name}</div>
                    )}
                  </div>
                )}

                <div className="email-popup-input-wrapper">
                  {config.emailLabel && (
                    <label htmlFor="email-input" className="email-popup-label">
                      {config.emailLabel}
                    </label>
                  )}
                  <input
                    id="email-input"
                    type="email"
                    className={`email-popup-input ${errors.email ? 'error' : ''}`}
                    placeholder={config.emailPlaceholder || 'Enter your email'}
                    value={email}
                    onChange={(e) => {
                      setEmail(e.target.value);
                      if (errors.email) setErrors({ ...errors, email: undefined });
                    }}
                    disabled={isSubmitting}
                    required={config.emailRequired !== false}
                  />
                  {errors.email && (
                    <div className="email-popup-error">{errors.email}</div>
                  )}
                </div>

                {showGdprCheckbox && (
                  <div className="email-popup-checkbox-wrapper">
                    <input
                      type="checkbox"
                      id="gdpr-consent"
                      className="email-popup-checkbox"
                      checked={gdprConsent}
                      onChange={(e) => {
                        setGdprConsent(e.target.checked);
                        if (errors.gdpr) setErrors({ ...errors, gdpr: undefined });
                      }}
                      disabled={isSubmitting}
                      required={config.consentFieldRequired}
                    />
                    <label
                      htmlFor="gdpr-consent"
                      className="email-popup-checkbox-label"
                    >
                      {gdprLabel}
                    </label>
                  </div>
                )}
                {errors.gdpr && (
                  <div className="email-popup-error">{errors.gdpr}</div>
                )}

                <button
                  type="submit"
                  className="email-popup-button"
                  disabled={isSubmitting}
                >
                  {isSubmitting ? (
                    <>
                      <div className="email-popup-spinner" />
                      Subscribing...
                    </>
                  ) : (
                    buttonText
                  )}
                </button>

                {config.dismissLabel && (
                  <button
                    type="button"
                    className="email-popup-secondary-button"
                    onClick={onClose}
                    disabled={isSubmitting}
                  >
                    {config.dismissLabel}
                  </button>
                )}
              </form>
            </>
          )}
        </div>
      </PopupGridContainer>
    </PopupPortal>
  );
};
